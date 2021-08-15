export {};

import Sumarization from '../models/sumarization';

import {
    of
} from 'rxjs/internal/observable/of';
import {
    map,
    tap
} from 'rxjs/operators';
import {
    sumarizingObjects
} from './mocks';
import {
    getTracksMapByCity
} from './tracks';
import {
    ISumarizingObject,
    ISumarizationSegment,
    ISumarizedObject,
    mapRangeToSumarizingSegment,
    matches
} from '../interfaces/Segment';
import {
    IRange,
    ITrack
} from '../interfaces/Track';

// TODO: refactor this... this should go in a separate configuration or constants file
// TODO: Agregar funcion que calcule peso de forma dinamica haciendo una resta entre
// TODO: Date() y el date del segmento
const NEW_DATA_WEIGHT = 0.6;
const OLD_DATA_WEIGHT = 1 - NEW_DATA_WEIGHT;

const errorCallback = (err: any) => {
    console.error(err);
    throw err;
}

//TODO: pass the data as parameter, it's not a get callback anymore
const putSumarizationsCallback = (req: any, res: any, sumarizedTracks: any): void => {
    Sumarization.deleteMany({})
        .then((deleteResult: any) => {
            Sumarization.insertMany(sumarizedTracks)
                .then((insertResponse: any) => {
                    res.send(insertResponse);
                })
                .catch((err: any) => {
                    res.send(err);
                    res.end();
                });
        })
        .catch((error: any) => {
            res.send(error);
            res.end();
        });
}

//TODO: DESMOCKEAR, usar la funcion getMappings()
// TODO: putSumarizationsCallback() deberia ir en un switchMap() dentro del pipe()
// TODO: Luego hago el res.send() en el subscribe()

//? 1) Obtengo los tracks MOCKEADOS
export const sumarizeTracksCallback = (req: any, res: any): void => {
    /* const requiredFields: string = 'city startTime ranges';
    getTracksMapByCity(requiredFields) */
    console.log('\n'.repeat(20));
    console.log('----------------');
    console.log('SUMARIZAR TRACKS');
    console.log('----------------');
    console.log('');
    of (sumarizingObjects)
    .pipe(
            //? 2) Para cada ciudad, ejecuto la sumarizacion
            map((allData: ISumarizingObject[]) => sumarizeTracksByCity(allData))
            //? Aca debe ir la funcion para descartar...
            //? PAra c/ciudad traigo las reparaciones y repito el proceso...
        )
        .subscribe((sumarizedTracks: ISumarizedObject[]) => {
            putSumarizationsCallback(req, res, sumarizedTracks);
        }, errorCallback);
}

//? 2) Para cada ciudad, ejecuto la sumarizacion
const sumarizeTracksByCity = (items: ISumarizingObject[]): ISumarizedObject[] => {
    return items.map((item: ISumarizingObject) => sumarizeTracks(item));
}

//? 3) Ejecuto la sumarizacion de Tracks de una Ciudad
const sumarizeTracks = (item: ISumarizingObject): ISumarizedObject => {
    // TODO: Probably all City groupings should have the same date!!
    const date = new Date().getMilliseconds();

    const sumarizedSegments: ISumarizationSegment[] = [];

    const tracks = item.tracks;

    tracks.forEach((track: ITrack) => {
        sumarizeNextTrack(sumarizedSegments, track);
    });

    return <ISumarizedObject > {
        city: item.city,
        date,
        sumarizedSegments
    };
}

const sumarizeNextTrack = (array: ISumarizationSegment[], track: ITrack): void => {
    let ranges: IRange[] = track.ranges;
    let segments: ISumarizationSegment[] = [];
    segments = ranges.map((item: IRange) => mapRangeToSumarizingSegment(item));
    segments.forEach((segment: ISumarizationSegment) => {
        addSegment(segment, array);
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

const findMatchingSegment = (mySegment: ISumarizationSegment, array: ISumarizationSegment[]): ISumarizationSegment | undefined => {
    return array.find((segment: ISumarizationSegment) => matches(mySegment, segment));
}

const updateMatchingSegment = (segment: ISumarizationSegment, matchingSegment: ISumarizationSegment): void => {
    matchingSegment.score = matchingSegment.score * OLD_DATA_WEIGHT + segment.score * NEW_DATA_WEIGHT;
    matchingSegment.date = segment.date;
    matchingSegment.accuracy++;
}

//! TODO!!!
const discardRepairedSegments = (segments): void => {
    return;
}

const getSumarizationsByFilter = async (filter: {}) => {
    try {
        const sumarizations: any[] = await Sumarization.find(filter)
        if (!sumarizations) {
            return [];
        }
        return sumarizations;
    } catch (error) {
        throw new Error("Error getting the Sumarizations");
    }
}

export const getSumarizationsCallback = (req: any, res: any): void => {
    const filter = {
        city: req.query.city
    };
    getSumarizationsByFilter(filter)
        .then(result => {
            res.send(result);
        })
        .catch(err => {
            console.error(err);
            res.send(err);
        });
}