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
    SumarizationSegment
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
            tap((res: ISumarizingObject[]) => {
                console.log(res);
            }),
            //? 2) Para cada ciudad, ejecuto la sumarizacion
            map((allData: ISumarizingObject[]) => sumarizeTracksByCity(allData))
        )
        .subscribe((sumarizedTracks: any) => {
            putSumarizationsCallback(req, res, sumarizedTracks);
        }, errorCallback);
}

//? 2) Para cada ciudad, ejecuto la sumarizacion
const sumarizeTracksByCity = (items: ISumarizingObject[]): any[] => {
    return items.map((item: ISumarizingObject) => sumarizeTracks(item));
}

const sumarizeTracks = (item: ISumarizingObject): ISumarizedObject => {
    const date = new Date().getMilliseconds();

    const sumarizedRanges: ISumarizationSegment[] = [];

    const tracks = item.tracks;

    tracks.forEach((track: ITrack) => {
        addSumarizedSegmentsByTrack(sumarizedRanges, track);
    });

    return <ISumarizedObject> {
        city: item.city,
        date,
        ranges: sumarizedRanges
    };
}

const addSumarizedSegmentsByTrack = (array: ISumarizationSegment[], track: ITrack): void => {
    let segments: ISumarizationSegment[] = [];
    segments = track.ranges.map((item: IRange) => mapSegmentToSumarizingSegment(item));
    segments.forEach((segment: ISumarizationSegment) => {
        addSegment(segment, array);
    });
}

//? Convierto un Range en un SumarizationSegment, descartando lo que no me interesa
const mapSegmentToSumarizingSegment = (range: IRange): ISumarizationSegment => {
    const {
        speed,
        stabilityEvents,
        ...relevantFields
    } = range;
    return <ISumarizationSegment> {
        ...relevantFields,
        accuracy: 0
    };
}

const addSegment = (segment: ISumarizationSegment, array: ISumarizationSegment[]): void => {
    const matchingSegment = findMatchingSegment(segment, array);
    if (matchingSegment) {
        updateMatchingSegment(segment, matchingSegment);
    } else {
        segment.accuracy = 1;
        array.push(segment);
    }
}

const findMatchingSegment = (mySegment: ISumarizationSegment, array: ISumarizationSegment[]): ISumarizationSegment | undefined => {
    const matchingSegment = array.find((segment: ISumarizationSegment) =>
        new SumarizationSegment(segment).matchesTo(mySegment)
    );
    return matchingSegment;
}

const updateMatchingSegment = (segment: ISumarizationSegment, matchingSegment: ISumarizationSegment): void => {
    matchingSegment.score = matchingSegment.score * OLD_DATA_WEIGHT + segment.score * NEW_DATA_WEIGHT;
    matchingSegment.date = segment.date;
    matchingSegment.accuracy++;
}

//! TODO!!!
const discardRepairedSegments = (segments) => {}

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