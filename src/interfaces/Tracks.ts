interface Axis {
    raw: number;
    delta: number;
    diff: number;
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

export interface IBaseSegment {
    start: Coordinate;
    end: Coordinate;
}

export interface ISegment extends IBaseSegment {
    date: number;
    score: number;
    distance: number;
}

export interface IRange extends ISegment {
    id: number;
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

interface IBaseCityGroupObject {
    cityId: number;
    date? : number;
}

export interface ISumarizingObject extends IBaseCityGroupObject {
    tracks: ITrack[];
}

export interface ISumarizedObject extends IBaseCityGroupObject {
    ranges: ISegment[];
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