interface Axis {
    raw: Number;
    delta: Number;
    diff: Number;
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

interface Coordinate {
    lat: number;
    lng: number;
}

interface IBaseSegment {
    start: Coordinate;
    end: Coordinate;
}

export interface ISegment extends IBaseSegment {
    date: number;
    score: number;
    distance: number;
}

export interface IRange extends ISegment {
    speed: number;
    stabilityEvents: StabilityEvent[];
}

export interface ISumarizationSegment extends ISegment {
    accuracy? : number;
}

export interface ITrack {
    id: number;
    startTime: number;
    city: String;
    ranges: IRange[];
    accelerometers ? : IAccelerometer[];
}

export interface ISumarizingObject {
    cityId: number;
    date ? : number;
    tracks: ITrack[];
}

export interface ISumarizedObject {
    cityId: number;
    date: number;
    ranges: ISegment[] | ISumarizationSegment[];
}

export interface IAccelerometer {
    id: Number;
    eventId: Number;
    currentTime: Number;
    x: Axis;
    y: Axis;
    z: Axis;
    axis: String;
}