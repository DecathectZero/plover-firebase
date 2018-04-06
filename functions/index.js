const functions = require('firebase-functions');
const firebase = require('firebase-admin');
const express = require('express');
const crypto = require('crypto');
const fs = require('fs');

const firebaseApp = firebase.initializeApp(
	functions.config().firebase
);

const database = firebaseApp.database();

const nature = JSON.parse(fs.readFileSync('./nature.json', 'utf8'));
const aliases = nature.animals;
const places = nature.places;
const adjectives = nature.adjectives;

function generateRoomName(){
	return getRandom(adjectives) + "-" + getRandom(adjectives) + "-" + getRandom(places);
}

function getRoom(lat_lon) {
	let room_hash = crypto.createHash('sha1').update(lat_lon).digest('hex');
	const ref = database.ref("room_lat_lon/room_name/" + room_hash);
	if(ref != null){
		console.log("existent");
	}else{
		console.log("nonexistent");
		// let room_name = 
		// database.ref('room_lat_lon').set({
		//     lat_lon: hash,
		//     room: generate
	 //  	});
	}
}

// Create and Deploy Your First Cloud Functions
// https://firebase.google.com/docs/functions/write-firebase-functions

const app = express();

app.get('/room/:lat/:lon', function(req, res){
	let lat_lon = req.params.lat + ":" + req.params.lon;
	console.log(lat_lon);
	getRoom(lat_lon);
	res.sendStatus(200);
});

exports.app = functions.https.onRequest(app);