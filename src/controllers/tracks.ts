export {};

import Track from './../models/track';
import { Observable, from, forkJoin } from 'rxjs';
import { Document } from 'mongoose';
import { fetchCities } from './cities';
import { map, mergeAll, mergeMap, switchMap, tap } from 'rxjs/operators';


//TODO: TYPE THE RETURN OF THE FUNCTIONS
export const fetchTracks = (filter: {} = {}, fields: string, skip: number, limit: number): Observable<Document[]> =>
	from(Track.find(filter).select(fields).skip(skip).limit(limit).exec());

const getTracksMappingByCity = (city: string, fields: string, skip: number, limit: number): Observable<any> => {
	return fetchTracks({city: city}, fields, skip, limit)
	.pipe(
		map(tracks => {
			return {
				city: city,
				startTime: Date.parse(new Date().toDateString()),
				tracks: tracks
			};
		})
	);
}

//TODO: Remove LIMIT
export const getTracksMapByCity = (fields: string): Observable<any> => {
	return fetchCities()
	.pipe(
		map((cities: Document[]) => cities.map((city: any) => city.name)),
		mergeMap((cityNames: string[]) => {
			const observables = cityNames.map((cityName: any) =>  getTracksMappingByCity(cityName, fields, 0, 4));
			return forkJoin(...observables);
		})
	);
}

export const getTracksCallback = (req: any, res: any): void => {
	const filter = {
		username: req.query.username,
		city: req.query.city,
		startTime: {$gte: parseFloat(req.query.from), $lte: parseFloat(req.query.to)}
	};
	const fields: string = 'id ranges city startTime';
	const offset = parseInt(req.query.offset);
	const limit = parseInt(req.query.pages);
	console.log(req.query);
	console.log(offset, limit);
	fetchTracks(filter, fields, offset, limit)
	.subscribe(
		(tracks: Document[]) => {
			console.log(tracks);
            res.send(tracks);
        }, (err: any) => { 
            console.error(err);
            throw (err);
    });
}