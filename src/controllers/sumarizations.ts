export {};
import express from 'express';
import Sumarization from '../schemas/sumarization';
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
    getTracksMappedByCity
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

export const executeSumarizationCallback = (req: express.Request, res: express.Response): void => {
    const type: number = parseInt(req.body.type);
    const filter: any = {
        id: req.body.linkedCities
    };
    getTracksMappedByCity(filter, 'cityId startTime ranges')
    .pipe(
            map((allData: ISumarizingObject[]) => sumarizeTracksByCity(allData, type)),
            switchMap((sumarizations: ISumarizedObject[]) => replaceSumarizations(sumarizations, type))
        )
        .subscribe((result: any) => {
            res.status(200).end();
        }, (error: Error) => {
            res.status(500).end();
        });
}

const sumarizeTracksByCity = (items: ISumarizingObject[], type: number): ISumarizedObject[] =>
    items.map((item: ISumarizingObject) => sumarizeTracks(item, type));

const sumarizeTracks = (item: ISumarizingObject, type: number): ISumarizedObject => {
    const date = Date.parse(new Date().toDateString());
    const sumarizedSegments: ISumarizationSegment[] = [];

    item.tracks.forEach((track: ITrack) => {
        sumarizeNextTrack(sumarizedSegments, track);
    });

    return <ISumarizedObject> {
        type,
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

export const replaceSumarizations = (values: ISumarizedObject[], type: number): Observable<Error | any> => {
    return from(removeSumarizations({ type }))
    .pipe(
        switchMap((res: any) => insertSumarizations(values))
    );
}

const removeSumarizations = (filter: {}): Promise<Error | any> =>
    Sumarization.deleteMany(filter)
        .catch((error: any) => new Error(error));

const insertSumarizations = (values: ISumarizedObject[]): Promise<Error | any> =>
    Sumarization.insertMany(values as any)
        .catch((error: any) => new Error(error));

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
    Sumarization.findOne(filter).lean()
        .catch((error: any) => new Error(error));