export {};

const geolib = require('geolib');
const _ = require('underscore');

const Tracks = require('./../models/track');
const Sumarizations = require('./../models/sumarization');
const Cities = require('./../models/city');

const getTracksByFilter = async (filter: {}, pages: number) => {
	console.log(filter);
	try {
		const tracks: any[] = await Tracks.find(filter).sort([
			['startTime', -1]
		])
		if (!tracks) {
			return [];
		}
		return tracks;
	} catch (error) {
		throw new Error("Error getting the Tracks");
	}
}

const getTracksCallback = (req, res): void => {
	const filter = {
		username: req.query.username,
		city: req.query.city
		// startTime: {$gte: parseFloat(req.query.from), $lte: parseFloat(req.query.to)}
	};
	getTracksByFilter(filter, parseInt(req.query.pages))
		.then(result => {
			res.send(result);
			res.end();
		})
		.catch(err => {
			console.error(err);
		});
};

const getSumarizationsByFilter = async (filter: {}) => {
	try {
		const sumarizations: any[] = await Sumarizations.find(filter)
		if (!sumarizations) {
			return [];
		}
		return sumarizations;
	} catch (error) {
		throw new Error("Error getting the Sumarizations");
	}
}

const getSumarizationsCallback = (req, res): void => {
	const filter = {
		city: req.query.city
		// startTime: {$gte: parseFloat(req.query.from), $lte: parseFloat(req.query.to)}
	};
	getSumarizationsByFilter(filter)
		.then(result => {
			res.send(result);
		})
		.catch(err => {
			console.error(err);
			res.send(err);
		});
};

const putSumarizationsCallback = (req, res): void => {
	Sumarizations.deleteMany({})
	.then(response => {
		Sumarizations.insertMany(req.body)
		.then(res => {
			res.send(res);
		})
		.catch(err => {
			res.send(err);
		});
	})
	.catch(error => {
		res.send(error);
		res.end();
	});
    
};

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
		const tracks: any[] = await Tracks.find({city: cityName}).limit(5)
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
				res.end();
			})
			.catch(error => {
				throw error;
			});
		})
		.catch(error => {
			throw error;
		});
}

const discardRepairedSegments = (segments) => {

}
module.exports = [getTracksCallback, getSumarizationsCallback, sumarizeTracksCallback, putSumarizationsCallback];