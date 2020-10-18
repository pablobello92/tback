/* const fs = require('fs');
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

const analiseFiles = () => {
	let tracksInfo = fs.readFileSync('data/tracks_info.csv').toString().split("\n");
	_.each(tracksInfo, (trackInfo) => {
		let trackName = trackInfo.split(";")[0];
		console.log(trackName);
		analiseTrack(trackName);
	});
}
 */