export {};

const geolib = require('geolib');
const _ = require('underscore');

const Tracks = require('./../models/track');
const Cities = require('./../models/city');

const getTracksCallback = (req, res): void => {
    const filter = {
        username: req.query.username,
        city: req.query.city
        // startTime: {$gte: parseFloat(req.query.from), $lte: parseFloat(req.query.to)}
    };
    console.log(filter);
    Tracks.find(filter).sort([['startTime', -1]]).limit(parseInt(req.query.pages))
    .then(tracks => {
        res.send(tracks);
    })
    .catch(err => {
        console.error(err);
    });
};


const sumarizeTracksCallback = async(): Promise<number[]> => {
	console.clear();
	const results = [];
	const cities = Cities.find()
    .then(cities => {
        cities.forEach((city) => {
			const tracksByCity = sumarizeTracksByCity(city.name)
			.then(tracks => {
				console.log(tracks);
				console.log('-----------------------------');
			});
		});
    })
    .catch(err => {
        console.error(err);
	})
	return [0];
	// Store each one of the objects
	//results.foreEach(res => saveInDatabase(res));
}

const sumarizeTracksByCity = (city): Promise<any[]> => {
	return Tracks.find({city: city}).limit(5)
    .then(tracks => tracks.map(track => track.city));

	// let sumarized = [];
	/*
		const segments = getSegments(tracks);
	*/

	/*const result = {
		city: city,
		segments: sumarized

	};*/
	// return result;
}

const getSegments = (tracks) => {
	// const segments = tracks.map(track => ...(track.segments))
	// return discardRepairedSegments(segments);
}

const discardRepairedSegments = (segments) => {
	
}
const NEW_DATA_WEIGHT = 0.6;

const isBetween = (point, range): boolean => {
	let distance = geolib.getDistance(range.start, range.end);
	let distanceToStart = geolib.getDistance(range.start, point);
	let distanceToEnd = geolib.getDistance(range.end, point);
	return distanceToStart < distance && distanceToEnd < distance;
}

const mergeRecords = (newRecord, oldRecord): void => {
	let oldDataWeight = 1 - NEW_DATA_WEIGHT;
	oldRecord.score = oldRecord.score * oldDataWeight + newRecord.score * NEW_DATA_WEIGHT;
	oldRecord.date = newRecord.date;
	oldRecord.accuracy++;
}

/*const mergeTrackData = (trackData, latitude, longitude) => {
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
}*/

module.exports = [ getTracksCallback, sumarizeTracksCallback];