const fs = require('fs');
const parse = require('csv-parse');
const geolib = require('geolib');
const request = require('request');
const _ = require('underscore');




const readFromFolder = (folder) => {
	fs.readdir("data/" + folder, (err, filenames) => {
		if (err) {
			console.log(err);
			return;
		}
		filenames = _.sortBy(filenames, (name) => {
			let id = name.replace(".csv", "");
			id = id.replace("track", "");
			return parseInt(id);
		});
		readFiles(folder, filenames, () => {
			console.log("All done");
		});
	});
}

const readFiles = (folder, files, done) => {
	if (files.length == 0) {
		done();
		return;
	}
	let file = files.shift();
	console.log("Reading " + file);
	parseTrackFile("data/" + folder + "/" + file, () => {
		readFiles(folder, files, done);
	});
}

const parseTrackFile = (sourceFilePath, done) => {
	let source = fs.createReadStream(sourceFilePath);

	let linesRead = 0;
	let trackData = [];
	// let columns = ["counter","time","startLat","startLon", "endLat","endLon", "speed", "stbAvg", "phAmnt", "phAvg", "maxPh", "bmpAmnt", "bmpAvg", "maxBmp"]; 

	let parser = parse({
		delimiter: ';',
		skip_empty_lines: true
		// columns:columns
	});
	let range = null;
	parser.on("readable", () => {

		let record = null;

		while (record = parser.read()) {
			linesRead++;
			if (record[0] == "Stability Event") {
				range.score += parseFloat(record[7]);
			} else {
				range = {
					id: record[0],
					date: record[1],
					start: {
						latitude: parseFloat(record[2]),
						longitude: parseFloat(record[3])
					},
					end: {
						latitude: parseFloat(record[4]),
						longitude: parseFloat(record[5])
					},
					speed: record[0],
					score: 0
				}
				range.distance = geolib.getDistance(range.start, range.end);
				if (range.distance < 200 && range.distance != 0) {
					trackData.push(range);
				}

			}

			//console.log(range)
		}


	});

	const finish = () => {
		console.log("Merging " + sourceFilePath);
		if (trackData.length > 0) {
			//console.log(trackData[0]);
			let startLocation = trackData[0].start;
			mergeTrackData(trackData, startLocation.latitude, startLocation.longitude);
		}
		done(linesRead);
	}

	parser.on("error", finish);
	parser.on("end", finish);
	source.pipe(parser);
}

const isBetween = (point, range) => {
	let distance = geolib.getDistance(range.start, range.end);
	let distanceToStart = geolib.getDistance(range.start, point);
	let distanceToEnd = geolib.getDistance(range.end, point);
	return distanceToStart < distance && distanceToEnd < distance;
}

const NEW_DATA_WEIGHT = 0.6;
const mergeRecords(newRecord, oldRecord) => {
	let oldDataWeight = 1 - NEW_DATA_WEIGHT;
	oldRecord.score = oldRecord.score * oldDataWeight + newRecord.score * NEW_DATA_WEIGHT;
	oldRecord.date = newRecord.date;
	oldRecord.accuracy++;
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
		app.db.saveObject(city, cityData);
	});

}

let ACC_LEVEL = 3;

const getCityData = (latitude, longitude, callback) => {
	getCityName(latitude, longitude, (city) => {
		let data = app.db.getObject(city);
		callback(data ? data : []);
	});
}

const analiseFiles = () => {
	let tracksInfo = fs.readFileSync('data/tracks_info.csv').toString().split("\n");
	_.each(tracksInfo, (trackInfo) => {
		let trackName = trackInfo.split(";")[0];
		console.log(trackName);
		analiseTrack(trackName);
	});
}

const analiseTrack = (track) => {
	let id = track.replace("track", "");
	let source = fs.createReadStream("data/track" + id + ".csv");

	let linesRead = 0;
	let trackData = [];
	let columns = ["counter", "time", "startLat", "startLon", "endLat", "endLon", "speed", "stbAvg", "phAmnt", "phAvg", "maxPh", "bmpAmnt", "bmpAvg", "maxBmp"];

	let parser = parse({
		delimiter: ';',
		columns: columns
	});

	parser.on("readable", () => {
		let record = null;
		while (record = parser.read()) {
			linesRead++;
			trackData.push({
				id: record.counter,
				time: record.time,
				start: {
					latitude: record.startLat,
					longitude: record.startLon
				},
				end: {
					latitude: record.endLat,
					longitude: record.endLon
				},
				speed: record.speed,
				events: []

			});

		}
	});

	parser.on("error", (error) => {
		console.log(error);
	});

	parser.on("end", () => {
		analiseAccelerometer(id, trackData);
	});

	source.pipe(parser);
}

const analiseAccelerometer = (id, trackData) => {

	let source = fs.createReadStream("data/accelerometer" + id + ".csv");
	// console.log("Offset for "+id+" is "+ofst)
	let offset = parseInt(trackData[0].id);
	offset = offset == 1 ? 0 : offset - 1;
	let linesRead = 0;
	let columns = ["counter", "time", "rawX", "deltaX", "diffX", "rawY", "deltaY", "diffY", "rawZ", "deltaZ", "diffZ", "axis"];

	let parser = parse({
		delimiter: ';',
		columns: columns
	});

	let lastRecord = null;
	let stabilityEvent = null;
	let stbMAX = 5;
	let stabilizing = stbMAX;

	const isStable = (val, stbVal) => {
		let rVal = parseFloat(val);
		return Math.abs(rVal - stbVal) < 2;
	}

	parser.on("readable", () => {
		let record = null;
		console.log("Analizing accelerometer with id " + id);
		while (record = parser.read()) {
			linesRead++;
			if (record.counter == "0") {
				continue;
			}
			if (lastRecord != null && !(lastRecord.rawX == record.rawX && lastRecord.rawY == record.rawY && lastRecord.rawZ == record.rawZ)) {
				let delta = {
					x: parseFloat(record.deltaX),
					y: parseFloat(record.deltaY),
					z: parseFloat(record.deltaZ)
				};
				if (delta.z > 0 || delta.x > 0 || stabilityEvent != null) {

					if (delta.x == 0 && delta.y == 0 && delta.z == 0 &&
						isStable(record.rawX, 0) && isStable(record.rawY, 0) && isStable(record.rawZ, 9.8)) {
						// console.log("acc is stable");
						stabilizing--;
						if (stabilizing == 0) {
							// console.log(stabilityEvent);
							stabilityEvent.avgX = stabilityEvent.avgX / stabilityEvent.totalUpdates;
							stabilityEvent.avgY = stabilityEvent.avgY / stabilityEvent.totalUpdates;
							stabilityEvent.avgZ = stabilityEvent.avgZ / stabilityEvent.totalUpdates;
							stabilityEvent.endTime = parseInt(record.time);
							stabilityEvent.duration = (stabilityEvent.endTime - stabilityEvent.startTime) / 1000;
							stabilityEvent.score = (stabilityEvent.avgX + stabilityEvent.avgY + stabilityEvent.avgZ) * stabilityEvent.duration;
							// console.log("Closing event");
							// console.log(stabilityEvent);
							stabilityEvent = null;
						}
					} else {
						// console.log("updating event");
						stabilizing = stbMAX;
						if (stabilityEvent == null) {
							stabilityEvent = {
								avgX: delta.x,
								avgY: delta.y,
								avgZ: delta.z,
								totalUpdates: 1,
								startTime: parseInt(record.time)
							}
							let rangeId = parseInt(record.counter);
							console.log("Saving event in range " + rangeId);
							if (rangeId != 0) {
								console.log("Offset " + offset);
								rangeId = rangeId - offset;
							}

							console.log("Range with offset " + rangeId);
							console.log(trackData[rangeId]);

							// console.log(stabilityEvenst);
							// console.log(trackData[rangeId]);
							if (rangeId >= 0) {
								trackData[rangeId].events.push(stabilityEvent);
							}

						} else {
							stabilityEvent.avgX += delta.x;
							stabilityEvent.avgY += delta.y;
							stabilityEvent.avgZ += delta.z;
							stabilityEvent.totalUpdates++;
						}
					}
				}
			}
			lastRecord = record;
		}
	});

	parser.on("error", (error) => {
		console.log(error);
	});

	parser.on("end", () => {
		writeNewTrackData(id, trackData);
	});

	source.pipe(parser);
}

const writeNewTrackData = (id, trackData) => {
	let stream = fs.createWriteStream("newData/track" + id + ".csv");
	stream.once('open', (fd) => {
		_.each(trackData, (track) => {

			let lines = [];
			let score = 0;
			_.each(track.events, (ev, index) => {
				score += ev.score;
				lines[index] = "Stability Event;" + index + ";" + ev.startTime + ";" + ev.endTime + ";" + ev.avgX + ";" + ev.avgY + ";" + ev.avgZ + ";" + ev.score + ";" + ev.duration;
			});
			let line = track.id + ";" + track.time + ";" + track.start.latitude + ";" + track.start.longitude + ";" +
				track.end.latitude + ";" + track.end.longitude + ";" + track.speed + ";" +
				geolib.getDistance(track.start, track.end) + ";" + score;
			stream.write(line + "\n");
			_.each(lines, (l) => {
				stream.write(l + "\n");
			});
		});
		stream.end();
	});

}

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