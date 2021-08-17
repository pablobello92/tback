export {};

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
	ISegment,
	ISumarizationSegment,
	ISumarizedObject,
	ISumarizingObject
} from '../interfaces/Segment';
import {
	ITrack,
	IRange
} from '../interfaces/Track';

import Track from './../models/track';

export const getTracksCallback = (req: any, res: any): void => {
	const filter = {
		userId: parseInt(req.query.userId),
		cityId: parseInt(req.query.cityId),
		startTime: {
			$gte: parseFloat(req.query.from),
			$lte: parseFloat(req.query.to)
		}
	};
	const fields: string = 'cityId startTime ranges';
	const offset = parseInt(req.query.offset);
	const limit = parseInt(req.query.pages);
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

const findMatchingSegment = (mySegment: ISumarizationSegment, array: ISumarizationSegment[]): number =>
	array.findIndex((s: ISumarizationSegment) => matches(mySegment, s));

const matches = (a: ISumarizationSegment, b: ISumarizationSegment): boolean => {
	const center: any = getCenter([a.start, a.end]);
	const length: number = getDistance(b.start, b.end);
	const distanceToStart: number = getDistance(b.start, center);
	const distanceToEnd: number = getDistance(b.end, center);
	return (
		distanceToStart < length &&
		distanceToEnd < length
	);
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

/**
 * ? -----------------
 * ? PREDICCION
 * ? -----------------
 */

export const sampleTracksByCity = (items: ISumarizingObject[]): ISumarizedObject[] =>
	items.map((item: ISumarizingObject) => sampleTracks(item));

const sampleTracks = (item: ISumarizingObject): ISumarizedObject => {
	const date = Date.parse(new Date().toDateString());
	const sumarizedSegments: ISumarizationSegment[] = [];

	item.tracks.forEach((track: ITrack) => {
		sampleNextTrack(sumarizedSegments, track);
	});

	return <ISumarizedObject> {
		cityId: item.cityId,
		date,
		ranges: sumarizedSegments
	};
}

const sampleNextTrack = (array: ISumarizationSegment[], track: ITrack): void => {
	let ranges: IRange[] = track.ranges;
	let segments: ISegment[] = [];

	segments = ranges.map((r: IRange) => mapRangeToSegment(r));

	segments.forEach((s: ISumarizationSegment) => {
		const toPush = addSegment(s, array);
		array.push(toPush);
	});
}

const mapRangeToSegment = (range: IRange): ISegment => {
	const {
		speed,
		stabilityEvents,
		...relevantFields
	} = range;
	return <ISegment> {
		...relevantFields
	};
}

const addSegment = (toAdd: ISumarizationSegment, array: ISumarizationSegment[]): ISegment => {
	const index = findMatchingSegment(toAdd, array);
	if (index === -1) {
		return toAdd;
	} else {
		const matching = array.splice(index, 1)[0];
		const merged = getMergedSegment(toAdd, matching);
		return merged;
	}
}

const getMergedSegment = (toAdd: ISumarizationSegment, matching: ISumarizationSegment): ISegment => matching;