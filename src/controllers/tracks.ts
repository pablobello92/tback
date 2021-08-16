export {};

import Track from './../models/track';
import {
	Observable,
	from,
	forkJoin
} from 'rxjs';
import {
	Document
} from 'mongoose';
import {
	fetchCities
} from './cities';
import {
	map,
	mergeMap
} from 'rxjs/operators';


//TODO: TYPE THE RETURN OF THE FUNCTIONS
export const fetchTracks = (filter: {} = {}, fields: string, skip: number, limit: number): Observable < any[] > =>
	from(Track.find(filter).lean().select(fields).skip(skip).limit(limit).exec());

const getTracksMappingByCity = (cityId: number, fields: string, skip: number, limit: number): Observable < any > => {
	return fetchTracks({ cityId }, fields, skip, limit)
		.pipe(
			map((tracks: any[]) => {
				return {
					cityId,
					startTime: Date.parse(new Date().toDateString()),
					tracks
				};
			})
		);
}

// TODO: Remove LIMIT = 2
// !CUIDADO: SI SACO EL LIMIT ME TIRA ERROR: HEAP OUT OF MEMORY
// !GOOGLEAR EL PROBLEMA Y SOLUCIONARLO
export const getTracksMapByCity = (fields: string): Observable < any > => {
	return fetchCities()
		.pipe(
			map((cities: Document[]) => cities.map((city: any) => city.id)),
			mergeMap((cityIds: number[]) => {
				const observables = cityIds.map((cityId: number) => 
					getTracksMappingByCity(cityId, fields, 0, 2)
				);
				return forkJoin(...observables);
			})
		);
}

export const getTracksCallback = (req: any, res: any): void => {
	const filter = {
		username: req.query.username,
		city: req.query.city,
		startTime: {
			$gte: parseFloat(req.query.from),
			$lte: parseFloat(req.query.to)
		}
	};
	const fields: string = 'id ranges city startTime';
	const offset = parseInt(req.query.offset);
	const limit = parseInt(req.query.pages);
	fetchTracks(filter, fields, offset, limit)
		.subscribe(
			(tracks: Document[]) => {
				res.send(tracks);
			}, (err: any) => {
				console.error(err);
				throw (err);
			});
}