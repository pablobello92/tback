import { 
    getCenter,
    getDistance
} from "geolib";

interface StabilityEvent {
    id: number;
    startTime: number;
    endTime: number;
    xavg: number;
    yavg: number;
    zavg: number;
    score: number;
    duration: number;
}

interface Axis {
    raw: Number;
    delta: Number;
    diff: Number;
}

interface Accelerometer {
    id: Number;
    eventId: Number;
    currentTime: Number;
    x: Axis;
    y: Axis;
    z: Axis;
    axis: String;
}

export interface Coordinate {
    lat: number;
    lng: number;
}

interface IBaseSegment {
    start: Coordinate;
    end: Coordinate;
}

interface ISegment extends IBaseSegment {
    date: number;
    score: number;
    distance: number;
    matchesTo(center: ISumarizationSegment): boolean;
}
export interface ISumarizationSegment extends ISegment {
    accuracy? : number;
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

    matchesTo(segment: ISumarizationSegment): boolean  {
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

export interface IRange extends ISegment {
    speed: number;
    stabilityEvents: StabilityEvent[];
}

export interface ITrack {
    id: number;
    startTime: number;
    city: String;
    ranges: IRange[];
    accelerometers ? : Accelerometer[];
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