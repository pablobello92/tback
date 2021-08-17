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
	Document
} from 'mongoose';
import {
	fetchCityFields
} from './cities';
import {
	map,
	mergeMap
} from 'rxjs/operators';
import {
	ISumarizationSegment,
	ISumarizedObject,
	ISumarizingObject
} from '../interfaces/Segment';
import {
	ITrack,
	IRange
} from '../interfaces/Track';

import Track from './../models/track';

// TODO: Refactorizar esto... deberia ir en un archivo aparte de configuracion o de constantes
// TODO: Agregar funcion que calcule peso de forma dinamica haciendo una resta entre
// TODO: Date() y el date del segmento
const NEW_DATA_WEIGHT = 0.6;
const OLD_DATA_WEIGHT = 1 - NEW_DATA_WEIGHT;

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
	.catch((error: any) => {
		res.send(new Error(error));
	});
}

//? ----------------------------------------------------
//? FUNCIONALIDAD COMPARTIDA PARA SUMARIZACION DE TRACKS
//? ----------------------------------------------------

// TODO: Remove LIMIT = 2
// !CUIDADO: SI SACO EL LIMIT ME TIRA ERROR: HEAP OUT OF MEMORY
// !GOOGLEAR EL PROBLEMA Y SOLUCIONARLO
export const getTracksMapByCity = (fields: string): Observable < any > =>
	from(fetchCityFields('cityId'))
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

const fetchTracks = (filter: {} = {}, fields: string, skip: number, limit: number): Promise<any[]> =>
	Track.find(filter).lean().select(fields).skip(skip).limit(limit).exec();

export const sumarizeTracksByCity = (items: ISumarizingObject[]): ISumarizedObject[] =>
	items.map((item: ISumarizingObject) => sumarizeTracks(item));

//? 3) Ejecuto la sumarizacion de Tracks de una Ciudad
const sumarizeTracks = (item: ISumarizingObject): ISumarizedObject => {
	const date = Date.parse(new Date().toDateString());
	const sumarizedSegments: ISumarizationSegment[] = [];

	item.tracks.forEach((track: ITrack) => {
		sumarizeNextTrack(sumarizedSegments, track);
	});

	return <ISumarizedObject > {
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
		addSegment(s, array);
	});
}

const addSegment = (sNew: ISumarizationSegment, array: ISumarizationSegment[]): void => {
	const matchingSegment = findMatchingSegment(sNew, array);
	if (matchingSegment) {
		updateMatchingSegment(sNew, matchingSegment);
	} else {
		sNew.accuracy = 1;
		array.push(sNew);
	}
}

const findMatchingSegment = (
	mySegment: ISumarizationSegment,
	array: ISumarizationSegment[]
): ISumarizationSegment | undefined =>
		array.find((s: ISumarizationSegment) => matches(mySegment, s));

const updateMatchingSegment = (segment: ISumarizationSegment, matchingSegment: ISumarizationSegment): void => {
	matchingSegment.score = matchingSegment.score * OLD_DATA_WEIGHT + segment.score * NEW_DATA_WEIGHT;
	matchingSegment.date = segment.date;
	matchingSegment.accuracy++;
}

//? Convierto un Range en un SumarizationSegment, descartando lo que no me interesa
const mapRangeToSumarizingSegment = (range: IRange): ISumarizationSegment => {
	const {
		speed,
		stabilityEvents,
		...relevantFields
	} = range;
	return <ISumarizationSegment > {
		...relevantFields,
		accuracy: 0
	};
}

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