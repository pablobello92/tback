import {
    getCenter,
    getDistance
} from "geolib";
import {
    Coordinate
} from "./Coordinate";
import { ITrack } from "./Track";

export interface IBaseSegment {
    start: Coordinate;
    end: Coordinate;
}

export interface ISegment extends IBaseSegment {
    date: number;
    score: number;
    distance: number;
    matchesTo(center: ISumarizationSegment): boolean;
}

export interface ISumarizationSegment extends ISegment {
    accuracy ? : number;
}

export class SumarizationSegment implements ISumarizationSegment {
    start: Coordinate;
    end: Coordinate;
    date: number;
    score: number;
    distance: number;

    constructor(segment: ISumarizationSegment) {
        this.start = segment.start;
        this.end = segment.end;
        this.date = segment.date;
        this.score = segment.score;
        this.distance = segment.distance;
    }

    matchesTo(segment: ISumarizationSegment): boolean {
        const center: any = getCenter([segment.start, segment.end]);
        const length = getDistance(this.start, this.end);
        const distanceToStart = getDistance(this.start, center);
        const distanceToEnd = getDistance(this.end, center);
        return (
            distanceToStart < length &&
            distanceToEnd < length
        );
    }
}

export interface ISumarizingObject {
    city: string;
    date ? : number;
    tracks: ITrack[];
}

export interface ISumarizedObject {
    city: string;
    date: number;
    ranges: SumarizationSegment[];
}