export {};

import { 
    iCoordinate
} from "./coordinate";
import { 
    iStabilityEvent
} from "./stabilityEvent";

export const iRange = {
    start: iCoordinate,
    end: iCoordinate,
    date: Number,
    score: Number,
    accuracy: Number,
    stabilityEvents: [iStabilityEvent]
};