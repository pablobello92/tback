export {};

import {
    Schema,
    model
} from 'mongoose';


const prediction = new Schema({
    _id: Schema.Types.ObjectId,
    cityId: Number,
    date: Number,
    ranges: [{
        start: {
            lat: Number,
            lng: Number
        },
        end: {
            lat: Number,
            lng: Number
        },
        date: Number,
        score: Number,
        distance: Number
    }]
});

const Prediction = model('Predictions', prediction, 'predictions');

export default Prediction;