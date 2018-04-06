var socket = io();
var self_id = null;
var $feed = $("#feed"),
	$empty_alert = $("#empty-alert");

// detect if mobile device
function getMobileOperatingSystem() {
  var userAgent = navigator.userAgent || navigator.vendor || window.opera;

      // Windows Phone must come first because its UA also contains "Android"
    if (/windows phone/i.test(userAgent)) {
        return "Windows Phone";
    }

    if (/android/i.test(userAgent)) {
        return "Android";
    }

    // iOS detection from: http://stackoverflow.com/a/9039885/177710
    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        return "iOS";
    }

    return null;
}

var device = getMobileOperatingSystem();

// String.prototype.hashCode = function() {
//   var hash = 0, i, chr;

//   if (this.length === 0) return hash;
//   for (i = 0; i < this.length; i++) {
//     chr   = this.charCodeAt(i);
//     hash  = ((hash << 5) - hash) + chr;
//     hash |= 0; // Convert to 32bit integer
//   }
//   return hash;
// };

// function selfCard(alias) {
//     var string = 
//     '<div class="self-card">' +
//         '<p class="lead">' + 
//         	'<img src="/img/animals/' + alias + '.svg"/><span class="you-are">You are:</span>' + alias +
//     	'</p>'+
//     '</div>'
//     return string;
// }

function userCard(user_id, alias) {
    var string = 
    '<form class="user-card dropzone" data-id="' + user_id + '"">' +
    	'<div class="message-container dz-message">' +
	        '<p class="lead">' + 
	        	'<img class="animal" src="/img/animals/' + alias + '.svg"/>' + alias +
	    	'</p>' +
    	'</div>' +
    '</form>'
    return string;
}

function checkUsers(){
	if($('.user-card').length < 1){
		$empty_alert.show();
	}else{
		$empty_alert.hide();
	}
}

function userExists(user_id){
	return $('.user-card[data-id="' + user_id + '"]').length > 0;
}

function removeUser(user_id){
	$('.user-card[data-id="' + user_id + '"]').remove();
   	checkUsers();
}

function addUser(user_id, alias){
	if(!userExists(user_id)){
		let $user_card = $(userCard(user_id, alias));
		$feed.append($user_card);
		$user_card.dropzone(options(user_id));
		checkUsers();
	}
}

// data about all the download requests (this is to keep track of the sender)
function download_card(data) {

    var download_prompt = "Download .zip"
    var download_icon = "fa-cloud-download-alt"
    if(data.hashes.length == 1 || device == "Android"){
        download_prompt = "Download"
    }
    var download_button = "<a class=\"download btn btn-outline-primary mr-2\" href='/download/" + data.hashes[0].hash + "' target='_blank'>" + download_prompt + "</a>"

    if(device == "iOS" || device == "Android"){
        download_button = ""
    }if(device == "iOS"){
        download_icon = "fa-external-link-alt"
    }

    var string = "";

    data.hashes.forEach(function(file){
        string += "<li class='file-list-item list-group-item' data-hash='" + file.hash + "'><p class='file-name'>" + file.name + "</p><p class='download-icon'><i class='fas " + download_icon + "'></i></p></li>\n"
    });

    return "<div class='download-card'>\n" +
        "<p class='lead'><img src='/img/animals/" + data.alias + ".svg'/> " + data.alias + " sent you " + data.hashes.length + " files</p>\n" +
        "<div class='downloads card mb-1' >\n" +
        "<ul class=\"list-group list-group-flush\" data-sender='" + data.sender + "' data-alias='" + data.alias + "'>\n" +
        string +
        "</ul>" +
        "</div>" +
        download_button +
        "<button type=\"button\" class=\"reject btn btn-outline-danger\">Reject</button>" +
        "</div>";
}

$(document).on('click', '.file-list-item', function (e) {
	e.preventDefault();

    var hash = $(this).data("hash");
    var name = $(this).children(".file-name").html();

    var $list = $(this).parent();
    var sender = $list.data("sender");

    $(this).remove();

    if(device == "iOS"){
        window.open(
            '/open/' + hash,
            '_blank'
        );
    }else{
        Download('/download/' + hash);
    }

    if($list.children().length === 0){
    	$list.parent().parent().remove();
    }

    if($(".download-card").length === 0){
        $("#download-modal").modal('hide');
    }

    socket.emit("accept", {sender: sender, receiver: self_id, hashes: [{name: name, hash: hash}]});

    return false;
});

// Arguments :
//  verb : 'GET'|'POST'
//  target : an optional opening target (a name, or "_blank"), defaults to "_self"
// open = function(verb, url, data, target) {
//   var form = document.createElement("form");
//   form.action = url;
//   form.method = verb;
//   form.target = target || "_self";
//   if (data) {
//     for (var key in data) {
//       var input = document.createElement("textarea");
//       input.name = key;
//       input.value = typeof data[key] === "object" ? JSON.stringify(data[key]) : data[key];
//       form.appendChild(input);
//     }
//   }
//   form.style.display = 'none';
//   document.body.appendChild(form);
//   form.submit();
// };

function Download(url) {
    document.getElementById('my_iframe').src = url;
};

$(document).on('click', '.download', function (e) {
	e.preventDefault();

	var hashes = [];
	var $list = $(this).siblings(".downloads").children("ul");
	var sender = $list.data("sender");
    var alias = $list.data("alias");

	$list.children(".file-list-item").each(function(i){
		var hash = $(this).data("hash");
    	var name = $(this).children(".file-name").html();
    	hashes.push({name: name, hash: hash});
	});

    $(this).parent().remove();

    // hashes.forEach(function(file){
    //     window.open(
    //         '/download/' + file.hash,
    //         '_blank'
    //     );
    // });
    
    if(hashes.length == 1){
        Download('/download/' + hashes[0].hash);
    }else if(hashes.length > 1){
        Download('/download/all/' + encodeURIComponent(alias) +  '/' + encodeURIComponent(JSON.stringify(hashes)));
    }
    // url to hit for zipped

    if($(".download-card").length === 0){
        $("#download-modal").modal('hide');
    }

    socket.emit("accept", {sender: sender, receiver: self_id, hashes: hashes});

    return false;
});

$(document).on('click', '.reject', function (e) {
    e.preventDefault();

	var hashes = [];
	var $list = $(this).siblings(".downloads").children("ul");
	var sender = $list.data("sender");

	$list.children(".file-list-item").each(function(i){
		var hash = $(this).data("hash");
    	var name = $(this).children(".file-name").html();
    	hashes.push({name: name, hash: hash});
	});

    $(this).parent().remove();

    if($(".download-card").length === 0){
        $("#download-modal").modal('hide');
    }

    socket.emit("reject", {sender: sender, receiver: self_id, hashes: hashes});

    return false;
});

function options(receiver_id){
	let target_url = "/upload/" + self_id + '/' + receiver_id;
    return {
	    method: "post",
	    url: target_url,
	    uploadMultiple: true,
	    thumbnailMethod: 'crop',
	    parallelUploads: 10,
	    maxFilesize: 1000,
	    params: {
            sender_id: self_id,
            receiver_id: receiver_id
        }
    };
}

socket.on('connect', function() {
	$.get('http://ip-api.com/json/?fields=lat,lon', function (res) {
		socket.emit('init', [res.lat, res.lon]);
    }).fail(function(){
        $("#adblock-modal").modal({backdrop: 'static', keyboard: false});
    });

    // when you get your own alias info
	socket.on('alias', function(data) {
		self_id = data.id;
	  	// $("#self").empty().append(selfCard(data.alias));
	  	$("#animal").html(data.alias);
	  	$('#ip').html(data.room_name);
	  	$("#animal-img").attr('src','/img/animals/' + data.alias + '.svg');
	});

	// when a new user joins, get info
	socket.on('joined', function(user) {
		if(!userExists(user.id)){
			addUser(user.id, user.alias);
		}
	});

	// whenever someone disconnects, remove them
	socket.on('disconnected', function(user) {
		// tell the server to drop this user from send/receive dict

		// you can also make the card slide up for extra fanciness
		removeUser(user);
	});

	// Get the information of all connected clients on joining
	socket.on('connected', function(data) {
		$feed.empty();
	   	data.connections.forEach(function(user){
	   		addUser(user.id, user.alias);
	   	});
	   	checkUsers();
	});

	socket.on('file', function(data){
		console.log(data);
		$("#download-feed").prepend(download_card(data));
        $("#download-modal").modal('show');
	});

	socket.on('accept', function(data){
		var receiver = data.receiver;
		$card = $('.user-card[data-id="' + receiver + '"]');
        var dropzone = Dropzone.forElement('.user-card[data-id="' + receiver + '"]');
        data.hashes.forEach(function(file){
        	$(".dz-filename").each(function(){
        		if($(this).children("span").html() == file.name){
        			$alert = $("<div class='accepted'>Accepted " + file.name + "</div>");
        			$alert.insertAfter($(this).parent().parent()).delay(6000).slideUp("normal", function() { $(this).remove(); } );
        			return;
        		}
        	});
        	dropzone.removeFile(dropzone.getFileByName(file.name));
        });
        // $alert = $("<div class='alert alert-success' role='alert'>Accepted Files</div>");
        // $alert.appendTo($card.children(".message-container")).delay(6000).slideUp("normal", function() { $(this).remove(); } );
	});

	socket.on('reject', function(data){
		var receiver = data.receiver;
		$card = $('.user-card[data-id="' + receiver + '"]');
        var dropzone = Dropzone.forElement('.user-card[data-id="' + receiver + '"]');
        // dropzone.removeAllFiles(true);
        data.hashes.forEach(function(file){
        	$(".dz-filename").each(function(){
        		if($(this).children("span").html() == file.name){
        			$alert = $("<div class='rejected'>Rejected " + file.name + "</div>");
        			$alert.insertAfter($(this).parent().parent()).delay(6000).slideUp("normal", function() { $(this).remove(); } );
        			return;
        		}
        	});
        	dropzone.removeFile(dropzone.getFileByName(file.name));
        });
        // $alert = $("<div class='alert alert-danger' role='alert'>Rejected Files</div>");
        // $alert.appendTo($card.children(".message-container")).delay(6000).slideUp("normal", function() { $(this).remove(); } );
	});
});