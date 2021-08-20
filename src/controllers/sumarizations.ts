export {};
import express from 'express';

import Sumarization from '../models/sumarization';

import {
    map,
    switchMap
} from 'rxjs/operators';
import { 
    from,
    Observable
} from 'rxjs';
import {
    findMatchingSegment,
    getTracksMapByCity
} from './tracks';
import {
    ISumarizingObject,
    ISumarizedObject,
    ISumarizationSegment,
    ITrack,
    IRange,
} from '../interfaces/Tracks';
import { 
    DATA_WEIGHT
} from '../shared/constants';

export const getSumarizationsCallback = (req: express.Request, res: express.Response): void => {
    const filter = {
        cityId: req.query.cityId
    };
    getSumarizationsByFilter(filter)
        .then((result: any) => {
            res.send(result);
        })
        .catch((error: Error) => {
            res.send(error);
        })
        .finally(() => {
            res.end();
        });
}

const getSumarizationsByFilter = (filter: {}): Promise<Error | any> =>
    Sumarization.find(filter).lean()
        .catch((error: any) => new Error(error));

// TODO: agregar el filtrado por ciudades vinculadas igual que con las predicciones
export const sumarizeTracksCallback = (req: express.Request, res: express.Response): void => {
    getTracksMapByCity({}, 'cityId startTime ranges')
    .pipe(
            map((allData: ISumarizingObject[]) => sumarizeTracksByCity(allData)),
            switchMap((sumarizations: ISumarizedObject[]) => replaceSumarizations(sumarizations))
        )
        .subscribe((result: any) => {
            res.send(result);
            res.end();
        }, (error: Error) => {
            res.send(error);
            res.end();
        });
}

const sumarizeTracksByCity = (items: ISumarizingObject[]): ISumarizedObject[] =>
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

const getMergedSumarizingSegment = (toAdd: ISumarizationSegment, matching: ISumarizationSegment): ISumarizationSegment => {
    matching.score = matching.score * DATA_WEIGHT.OLD + toAdd.score * DATA_WEIGHT.NEW;
    matching.date = toAdd.date;
    matching.accuracy++;
    return matching;
}

const removeSumarizations = (): Promise<Error | any> => {
    return Sumarization.deleteMany({})
        .then((result: any) => result)
        .catch((error: any) => new Error(error));
}

const insertSumarizations = (values: any): Promise<Error | any> => {
    return Sumarization.insertMany(values)
        .then((result: any) => result)
        .catch((error: any) => new Error(error));
}

const replaceSumarizations = (values: any): Observable<Error | any> => {
    return from(removeSumarizations())
    .pipe(
        switchMap((res: any) => insertSumarizations(values))
    );
}