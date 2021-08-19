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
} from '../interfaces/Track';

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
export const getTracksMapByCity = (fields: string): Observable < any > =>
	from(fetchCityFields('id'))
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

/**
 * ? -----------------
 * ? SUMARIZACION
 * ? -----------------
 */

export const sumarizeTracksByCity = (items: ISumarizingObject[]): ISumarizedObject[] =>
	items.map((item: ISumarizingObject) => sumarizeTracks(item));

const sumarizeTracks = (item: ISumarizingObject): ISumarizedObject => {
	const date = Date.parse(new Date().toDateString());
	const sumarizedSegments: ISumarizationSegment[] = [];

	item.tracks.forEach((track: ITrack) => {
		sumarizeNextTrack(sumarizedSegments, track);
	});

	return <ISumarizedObject> {
		cityId: item.cityId,
		date,
		ranges: sumarizedSegments
	};
}

const sumarizeNextTrack = (array: ISumarizationSegment[], track: ITrack): void => {
	let ranges: IRange[] = track.ranges;
	let segments: ISumarizationSegment[] = [];

	segments = ranges.map((r: IRange) => mapRangeToSumarizingSegment(r));

	segments.forEach((s: ISumarizationSegment) => {
		const toPush = addSumarizingSegment(s, array);
		array.push(toPush);
	});
}

const mapRangeToSumarizingSegment = (range: IRange): ISumarizationSegment => {
	const {
		speed,
		stabilityEvents,
		...relevantFields
	} = range;
	return <ISumarizationSegment > {
		...relevantFields,
		accuracy: 1
	};
}

const addSumarizingSegment = (toAdd: ISumarizationSegment, array: ISumarizationSegment[]): ISumarizationSegment => {
	const index = findMatchingSegment(toAdd, array);
	if (index === -1) {
		return toAdd;
	} else {
		const matching = array.splice(index, 1)[0];
		const merged = getMergedSumarizingSegment(toAdd, matching);
		return merged;
	}
}

const findMatchingSegment = (mySegment: IBaseSegment, array: IBaseSegment[]): number =>
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

// TODO: Refactorizar esto... deberia ir en un archivo aparte de configuracion o de constantes
// TODO: Agregar funcion que calcule peso de forma dinamica haciendo una resta entre
// TODO: Date() y el date del segmento
// TODO: estoy dando por hecho que el nuevo tiene fecha mas reciente...
// TODO: comparar fechas y ahi decido cual es el new y el old

const NEW_DATA_WEIGHT = 0.6;
const OLD_DATA_WEIGHT = 1 - NEW_DATA_WEIGHT;

const getMergedSumarizingSegment = (toAdd: ISumarizationSegment, matching: ISumarizationSegment): ISumarizationSegment => {
	matching.score = matching.score * OLD_DATA_WEIGHT + toAdd.score * NEW_DATA_WEIGHT;
	matching.date = toAdd.date;
	matching.accuracy++;
	return matching;
}