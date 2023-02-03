export {};

import { 
    iDelta
} from "./delta";

export const iAccelerometer = {
    id: Number,
    eventId: Number,
    currentTime: Number,
    x: iDelta,
    y: iDelta,
    z: iDelta,
    axis: String
};