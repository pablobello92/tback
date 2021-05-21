export {};
import {
    getCenter,
    getDistance
} from 'geolib';

import City from '../models/city';
import Sumarization from '../models/sumarization';
import Track from '../models/track';

import {
    IRange,
    ITrack,
    ISumarizingObject,
    SumarizingSegment
} from '../interfaces/Sumarizations';
import {
    of
} from 'rxjs/internal/observable/of';
import {
    map, tap
} from 'rxjs/operators';
import {
    sumarizingObjects
} from './mocks';
import {
    getTracksMapByCity
} from './tracks';

const errorCallback =  (err: any) => {
    console.error(err);
    throw err;
}

//TODO: remove the mock, use the new getMappings function

//TODO: put the callBack inside a switchMap... and then send the response in the subscribe()
export const sumarizeTracksCallback = (req: any, res: any): void => {
    /* const requiredFields: string = 'city startTime ranges';
    getTracksMapByCity(requiredFields) */
    of(sumarizingObjects)
    .pipe(
        tap((res: any) => {
            console.log(res);
        }),
        map((mock: ISumarizingObject[]) => mock.map((item: ISumarizingObject) => sumarizeByCity(item)))
    )
    .subscribe((sumarizedTracks: any) => {
        putSumarizationsCallback(req, res, sumarizedTracks);
    }, errorCallback);
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


const sumarizeByCity = (item: ISumarizingObject): any => {
    const ranges: SumarizingSegment[] = [];
    const tracks = item.tracks;
    tracks.forEach((track: ITrack) => {
        addSumarizedSegmentsByTrack(ranges, track);
    });
    return {
        city: item.city,
        date: Date.parse(new Date().toDateString()),
        ranges
    };
}

const addSumarizedSegmentsByTrack = (temp: SumarizingSegment[], track: ITrack): any => {
    const startTime = track.startTime;
    const segments: SumarizingSegment[] = track.ranges.map((item: IRange) => mapRangeToSumarizingRange(item));
    segments.forEach((segment: SumarizingSegment) => {
        addRangeToResult(segment, temp);
    });
}

// add Coordinate = { lat/lng } type to elements
const addRangeToResult = (rangeToMerge: SumarizingSegment, subTemp: SumarizingSegment[]): any => {
    const midpoint = getCenter([rangeToMerge.start, rangeToMerge.end]);
    const toMerge = subTemp.find((range: SumarizingSegment) => shouldMerge(midpoint, range));
    if (!toMerge) {
        rangeToMerge.accuracy = 1;
        subTemp.push(rangeToMerge);
    } else {
        mergeRanges(toMerge, rangeToMerge);
    }
}

const shouldMerge = (point: any, range: any): boolean => {
    const distance = getDistance(range.start, range.end);
    const distanceToStart = getDistance(range.start, point);
    const distanceToEnd = getDistance(range.end, point);
    return distanceToStart < distance && distanceToEnd < distance;
}

const mergeRanges = (oldRange: SumarizingSegment, newRange: SumarizingSegment): void => {
    const NEW_DATA_WEIGHT = 0.6;
    const OLD_DATA_WEIGHT = 1 - NEW_DATA_WEIGHT;
    oldRange.score = oldRange.score * OLD_DATA_WEIGHT + newRange.score * NEW_DATA_WEIGHT;
    oldRange.date = newRange.date;
    oldRange.accuracy++;
}

const mapRangeToSumarizingRange = (range: IRange): SumarizingSegment => {
    const {
        speed,
        stabilityEvents,
        ...relevantFields
    } = range;
    return <SumarizingSegment > {
        ...relevantFields,
        accuracy: 0
    };
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

//! TODO!!!
const discardRepairedSegments = (segments) => {
}