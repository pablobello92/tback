export {};

import {
    Schema,
    model
} from 'mongoose';
import { iDelta } from './subschemas/delta';
import { 
    iRange
} from './subschemas/range';

const trackSchema = new Schema({
    _id: Schema.Types.ObjectId,
    startTime: Number,
    cityId: Number,
    userId: Number,
    ranges: [iRange],
    accelerometers: [{
        id: Number,
        eventId: Number,
        currentTime: Number,
        x: iDelta,
        y: iDelta,
        z: iDelta,
        axis: String
    }]
});

const Track = model('Track', trackSchema);

export default Track;