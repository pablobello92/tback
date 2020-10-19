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
	getTracksByFilter(filter, parseInt(req.query.pages))
		.then(tracks => {
			res.send(tracks);
		})
		.catch(err => {
			console.error(err);
		});
};

const getTracksByFilter = async (filter: {}, pages: number) => {
	console.log(filter);
	try {
		const tracks: any[] = await Tracks.find(filter).sort([
			['startTime', -1]
		]).limit(pages)
		if (!tracks) {
			return [];
		}
		return tracks;
	} catch (error) {
		throw new Error("Error getting the Tracks");
	}
}

const getCityNames = async() => {
	try {
		const cities = await Cities.find()
		if(!cities) {
			return [];
		}
		return cities.map(city => city.name);
	} catch(error) {
		throw new Error("error getting the cities");
	}
}

const getTracksByCity = async(cityName: string) => {
	try {
		const tracks: any[] = await Tracks.find({city: cityName}).limit(2)
		if(!tracks) {
			return [];
		}
		const result = tracks.map(track => {
			return {
				startTime: track.startTime,
				ranges: track.ranges
			};
		});
		return result;
	} catch(error) {
		throw new Error("error getting the cities");
	}
}


const sumarizeTracksCallback = (req, res): void => {
	getCityNames()
		.then((cityNames: string[]) => {
			let result = [];
			cityNames.forEach(cityName => {
				result.push(getTracksByCity(cityName))
			});
			Promise.all(result)
			.then(tracks => {
				const objects = tracks.map((tracks, index) => {
					return {
						city: cityNames[index],
						tracks
					};
				});
				return objects;
			})
			.then(objects => {
				res.send(objects);
			})
			.catch(error => {
				throw error;
			});
		})
		.catch(error => {
			throw error;
		});
}

const sumarizeTracksByCity = (city): Promise < string[] > => {
	return Tracks.find({
			city: city
		}).limit(5)
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

module.exports = [getTracksCallback, sumarizeTracksCallback];