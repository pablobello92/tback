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