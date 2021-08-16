import {
    getCenter,
    getDistance
} from "geolib";
import {
    Coordinate
} from "./Coordinate";
import {
    IRange,
    ITrack
} from "./Track";

export interface IBaseSegment {
    start: Coordinate;
    end: Coordinate;
}

export interface ISegment extends IBaseSegment {
    date: number;
    score: number;
    distance: number;
}

export interface ISumarizationSegment extends ISegment {
    accuracy ? : number;
}

export interface ISumarizingObject {
    cityId: number;
    date ? : number;
    tracks: ITrack[];
}

export interface ISumarizedObject {
    cityId: number;
    date: number;
    ranges: ISumarizationSegment[];
}

//? Convierto un Range en un SumarizationSegment, descartando lo que no me interesa
export const mapRangeToSumarizingSegment = (range: IRange): ISumarizationSegment => {
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

export const matches = (a: ISumarizationSegment, b: ISumarizationSegment): boolean => {
    const center: any = getCenter([a.start, a.end]);
    const length: number = getDistance(b.start, b.end);
    const distanceToStart: number = getDistance(b.start, center);
    const distanceToEnd: number = getDistance(b.end, center);
    return (
        distanceToStart < length &&
        distanceToEnd < length
    );
}