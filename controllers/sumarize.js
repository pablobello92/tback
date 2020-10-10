
const fs = require('fs');
const parse = require('csv-parse');
const geolib = require('geolib');
const request = require('request');
const _ = require('underscore');

/**
 * TODO Add collection with cities
 */
const getSavedCityName = (lat, lon) => {
	let cities = app.db.getObject("cities");
	if (cities) {
		let city = _.find(cities, (location, name) => {
			let distance = geolib.getDistance({
				latitude: lat,
				longitude: lon
			}, location) / 1000;
			return distance < 100;
		});
		if (city) {
			console.log("Found cached city " + city);
			return city;
		}
	}
	return null;
}

/**
 * TODO Test this
 * TODO how to test this callback alone
 */
const getCityName = (lat, lon, callback) => {
	//find the city on nearby cities
	let city = getSavedCityName(lat, lon);
	if (city) {
		callback(city);
		return;
	}
	console.log("City not found, checking geocode service");
	let url = 'https://maps.googleapis.com/maps/api/geocode/json?key=GOOGLEKEY&latlng=LATCOORD,LONCOORD&sensor=true';
	url = url.replace("LATCOORD", lat);
	url = url.replace("LONCOORD", lon);
	url = url.replace("GOOGLEKEY", "AIzaSyCvExvJQhQ4H8BOL790oGljb10nKzdWj5A");
	request(url, (error, response, body) => {
		city = null;
		let bparsed = JSON.parse(response.body);
		if (bparsed) {
			let address = bparsed.results[0].address_components;
			for (let i = 0; i < address.length && !city; i++) {
				if (address[i].types[0] == "locality") {
					city = address[i].long_name;

				}
			}
		}
		let cities = app.db.getObject("cities");
		if (!cities) {
			cities = [];
		}
		cities[city] = {
			latitude: lat,
			longitude: lon
		};
		app.db.saveObject("cities", cities);
		callback(city);
	});
}

let ACC_LEVEL = 3;
const NEW_DATA_WEIGHT = 0.6;

const getCityData = (latitude, longitude, callback) => {
	getCityName(latitude, longitude, (city) => {
		let data = app.db.getObject(city);
		callback(data ? data : []);
	});
}

const mergeRecords = (newRecord, oldRecord) => {
	let oldDataWeight = 1 - NEW_DATA_WEIGHT;
	oldRecord.score = oldRecord.score * oldDataWeight + newRecord.score * NEW_DATA_WEIGHT;
	oldRecord.date = newRecord.date;
	oldRecord.accuracy++;
}

const isBetween = (point, range) => {
	let distance = geolib.getDistance(range.start, range.end);
	let distanceToStart = geolib.getDistance(range.start, point);
	let distanceToEnd = geolib.getDistance(range.end, point);
	return distanceToStart < distance && distanceToEnd < distance;
}

const mergeTrackData = (trackData, latitude, longitude) => {
	if (trackData.length == 0) {
		return;
	}
	// get all other records in the same city
	getCityData(latitude, longitude, (cityData) => {
		_.each(trackData, (record, index) => {
			console.log("Checking record");
			console.log(record);
			let midpoint = geolib.getCenter([record.start, record.end]);
			let toJoin = _.find(cityData, (cRecord) => {
				// find a saved record where the midpoint lies between its start and end
				return isBetween(midpoint, cRecord);
			});
			// if record exists, merge data and return event
			if (toJoin) {
				console.log("Found another record!");
				console.log(toJoin);
				mergeRecords(record, toJoin);
			} else { // if not, add new event
				// console.log("Adding new record");
				record.accuracy = 1;
				cityData.push(record);
			}
		});
		console.log("All merged");

		// Here goes my own function to save the data
		app.db.saveObject(city, cityData);
	});
}
