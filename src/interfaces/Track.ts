import {
    ISegment
} from "./Segment";

export interface Axis {
    raw: Number;
    delta: Number;
    diff: Number;
}

export interface Accelerometer {
    id: Number;
    eventId: Number;
    currentTime: Number;
    x: Axis;
    y: Axis;
    z: Axis;
    axis: String;
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