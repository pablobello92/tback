export {};

import Sumarization from '../models/sumarization';

import {
    map
} from 'rxjs/operators';
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

// TODO: Refactorizar esto... deberia ir en un archivo aparte de configuracion o de constantes
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

// TODO: putSumarizationsCallback() deberia ir en un switchMap() dentro del pipe()
// TODO: Luego hago el res.send() en el subscribe()

//? Aca debe ir la funcion para descartar...
//? Para c/ciudad traigo las reparaciones y repito el proceso...
//? AL FINAL LO DE DESCARTAR SEGMENTOS REPARADOS NO LO VOY A IMPLEMENTAR...

export const sumarizeTracksCallback = (req: any, res: any): void => {
    getTracksMapByCity('cityId startTime ranges')
    .pipe(
            map((allData: ISumarizingObject[]) => sumarizeTracksByCity(allData)),
        )
        .subscribe((sumarizations: ISumarizedObject[]) => {
            putSumarizationsCallback(req, res, sumarizations);
        }, errorCallback);
}

const sumarizeTracksByCity = (items: ISumarizingObject[]): ISumarizedObject[] => {
    return items.map((item: ISumarizingObject) => sumarizeTracks(item));
}

//? 3) Ejecuto la sumarizacion de Tracks de una Ciudad
const sumarizeTracks = (item: ISumarizingObject): ISumarizedObject => {
    const date = Date.parse(new Date().toDateString());
    const sumarizedSegments: ISumarizationSegment[] = [];

    item.tracks.forEach((track: ITrack) => {
        sumarizeNextTrack(sumarizedSegments, track);
    });

    return <ISumarizedObject>{
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

const findMatchingSegment = (mySegment: ISumarizationSegment, array: ISumarizationSegment[]): ISumarizationSegment | undefined => {
    return array.find((s: ISumarizationSegment) => matches(mySegment, s));
}

const updateMatchingSegment = (segment: ISumarizationSegment, matchingSegment: ISumarizationSegment): void => {
    matchingSegment.score = matchingSegment.score * OLD_DATA_WEIGHT + segment.score * NEW_DATA_WEIGHT;
    matchingSegment.date = segment.date;
    matchingSegment.accuracy++;
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
        cityId: req.query.cityId
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