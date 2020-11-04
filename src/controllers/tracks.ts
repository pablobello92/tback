export {};

import Track from './../models/track';
import { Observable, from, forkJoin } from 'rxjs';
import { Document } from 'mongoose';
import { fetchCities } from './cities';
import { map, mergeAll, mergeMap, switchMap, tap } from 'rxjs/operators';


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

//TODO: Remove LIMIT, add accelerometers!
//TODO: fix deprecation warning on forkJoin
export const getTracksMapByCity = (): Observable<any> => {
	return fetchCities()
	.pipe(
		map((cities: Document[]) => cities.map((city: any) => city.name)),
		mergeMap((cities: string[]) => {
			const observables = cities.map((city: any) =>  getTracksMappingByCity(city, 'id city startTime ranges', 0, 10));
			return forkJoin(...observables);
		})
	);
}

export const getTracksCallback = (req: any, res: any): void => {
	getTracksMapByCity()
	.subscribe({
        next(result: any[]) {
			console.clear();			
			result.forEach((item: any) => {
				console.log(item.city);
				console.log(item.startTime);
				console.log(item.tracks);
			});
        },
        error(err: any) { 
            console.error(err);
        }
    });

	const filter = {
		username: req.query.username,
		city: req.query.city,
		startTime: {$gte: parseFloat(req.query.from), $lte: parseFloat(req.query.to)}
	};
	const fields: string = 'id ranges city startTime';
	const offset = parseInt(req.query.offset);
	const limit = parseInt(req.query.pages);
	fetchTracks(filter, fields, offset, limit)
	.subscribe({
        next(tracks: Document[]) {
            res.send(tracks);
        },
        error(err: any) { 
            console.error(err);
            throw (err);
        }
    });
}