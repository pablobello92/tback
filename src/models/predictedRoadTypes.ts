export {};

import {
    Schema,
    model
} from 'mongoose';

// TODO: definir el modelo
const predictedRoadTypesSchema = new Schema({
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

const PredictedRoadTypes = model('PredictedRoadTypes', predictedRoadTypesSchema, 'predictedRoadTypes');

export default PredictedRoadTypes;