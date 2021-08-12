interface Coordinate {
    lat: number;
    lng: number;
}

interface SimpleRange {
    from: Coordinate;
    to: Coordinate;
}

interface Segment {
    date: number;
    start: Coordinate;
    end: Coordinate;
    score: number;
    distance: number;
}

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

export interface SumarizingSegment extends Segment {
    accuracy ? : number;
}

export interface IRange extends Segment {
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

export interface SumarizedObject {
    city: string;
    date: number;
    ranges: SumarizingSegment[];
}