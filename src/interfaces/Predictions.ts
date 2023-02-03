import { 
    ISegment
} from "./Tracks";

export type NumericArray = Float32Array | Int32Array | Uint8Array;

export type TensorSample = number[][];

export interface IPredictionSegment extends ISegment {
    id: number[];
    samples : TensorSample[];
}