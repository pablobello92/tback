export {};

import Track from './../models/track';
import { Observable, from } from 'rxjs';
import { Document } from 'mongoose';
import { fetchCities } from './cities';
import { map, switchMap, tap } from 'rxjs/operators';


export const fetchTracks = (filter: {} = {}, fields: string, skip: number, limit: number): Observable<Document[]> =>
	from(Track.find(filter).select(fields).skip(skip).limit(limit).exec());

export const getTracksMapByCity = (): void => {
	fetchCities()
	.pipe(
		map((cities: Document[]) => cities.map((city: any) => city.name)),
		map((cityNames: string[]) => {
			return cityNames.map((item: string) => {
				return {
					city: item,
					startTime: Date.parse(new Date().toDateString()),
					tracks: []
				};
			});
		})
		/*switchMap((cities: string[]) => {
			const observables = cities.map((city: string) => );
		})*/
	)
	.subscribe((objects: any[]) => {
		console.log(objects);
	});
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