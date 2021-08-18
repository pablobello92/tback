export {};

import {
    Schema,
    model
} from 'mongoose';

const trackSchema = new Schema({
    _id: Schema.Types.ObjectId,
    startTime: Number,
    cityId: Number,
    userId: Number,
    ranges: [{
        id: Number,
        date: Number,
        start: {
            latitude: Number,
            longitude: Number
        },
        end: {
            latitude: Number,
            longitude: Number
        },
        speed: Number,
        score: Number,
        stabilityEvents: [{
            id: Number,
            startTime: Number,
            endTime: Number,
            xavg: Number,
            yavg: Number,
            zavg: Number,
            score: Number,
            duration: Number
        }],
        distance: Number
    }],
    accelerometers: [{
        id: Number,
        eventId: Number,
        currentTime: Number,
        x: {
            raw: Number,
            delta: Number,
            diff: Number
        },
        y: {
            raw: Number,
            delta: Number,
            diff: Number
        },
        z: {
            raw: Number,
            delta: Number,
            diff: Number
        },
        axis: String
    }]
});

const Track = model('Track', trackSchema);

export default Track;