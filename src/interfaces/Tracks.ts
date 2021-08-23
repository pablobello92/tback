interface Axis {
    raw: number;
    delta: number;
    diff: number;
}

export interface IStabilityEvent {
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
    stabilityEvents: IStabilityEvent[];
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
    type?: number;
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
    id: number;
    eventId: number;
    currentTime: number;
    x: Axis;
    y: Axis;
    z: Axis;
    axis: string;
}