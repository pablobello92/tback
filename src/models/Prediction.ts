export {};

import {
    Schema,
    model
} from 'mongoose';

// TODO: definir el modelo
const predictionSchema = new Schema({
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
        score: Number,
        distance: Number,
        accuracy: Number
    }],
});

const Prediction = model('Predictions', predictionSchema, 'predictions');

export default Prediction;