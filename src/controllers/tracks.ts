export {};

import express from 'express';
import Track from './../models/track';

import {
	getCenter,
	getDistance
} from 'geolib';
import {
	Observable,
	from,
	forkJoin
} from 'rxjs';
import {
	fetchCityFields
} from './cities';
import {
	map,
	mergeMap
} from 'rxjs/operators';
import {
	IAccelerometer,
	IBaseSegment,
	ISumarizationSegment,
	ISumarizedObject,
	ISumarizingObject,
	ITrack,
	IRange
} from '../interfaces/Tracks';

export const getTracksCallback = (req: express.Request, res: express.Response): void => {
	const filter = {
		userId: parseInt(req.query.userId.toString()),
		cityId: parseInt(req.query.cityId.toString()),
		startTime: {
			$gte: parseFloat(req.query.from.toString()),
			$lte: parseFloat(req.query.to.toString())
		}
	};
	const offset = parseInt(req.query.offset.toString());
	const limit = parseInt(req.query.pages.toString());
	const fields: string = 'cityId startTime ranges';
	fetchTracks(filter, fields, offset, limit)
	.then((result: any[]) => {
		res.send(result);
	})
	.catch((error: Error) => {
		res.send(error);
	})
	.finally(() => {
        res.end();
    });
}

//? ----------------------------------------------------
//? FUNCIONALIDAD COMPARTIDA ENTRE SUMARIZACION Y PREDICCION
//? ----------------------------------------------------

// TODO: Remove LIMIT = 2
// !CUIDADO: SI SACO EL LIMIT ME TIRA ERROR: HEAP OUT OF MEMORY
// !GOOGLEAR EL PROBLEMA Y SOLUCIONARLO
export const getTracksMapByCity = (filter: {}, fields: string): Observable < any > =>
	from(fetchCityFields(filter, 'id'))
		.pipe(
			mergeMap((cityIds: number[]) => {
				const observables = cityIds.map((cityId: number) =>
					getTracksMappingByCity(cityId, fields, 0, 2)
				);
				return forkJoin(observables);
			})
		);

const getTracksMappingByCity = (cityId: number, fields: string, skip: number, limit: number): Observable < any > =>
	from(fetchTracks({ cityId }, fields, skip, limit))
		.pipe(
			map((tracks: any[]) => {
				return {
					cityId,
					startTime: Date.parse(new Date().toDateString()),
					tracks
				};
			})
		);

const fetchTracks = (filter: {} = {}, fields: string, skip: number, limit: number): Promise<Error | any[]> => {
	return Track.find(filter).lean().select(fields).skip(skip).limit(limit).exec()
		.catch((error: any) => new Error(error));
}

export const findMatchingSegment = (mySegment: IBaseSegment, array: IBaseSegment[]): number =>
    array.findIndex((s: IBaseSegment) => matches(mySegment, s));

const matches = (a: IBaseSegment, b: IBaseSegment): boolean => {
    const center: any = getCenter([a.start, a.end]);
    const length: number = getDistance(b.start, b.end);
    const distanceToStart: number = getDistance(b.start, center);
    const distanceToEnd: number = getDistance(b.end, center);
    return (
        distanceToStart < length &&
        distanceToEnd < length
    );
}