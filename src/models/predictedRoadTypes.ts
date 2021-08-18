export {};

import {
    Schema,
    model
} from 'mongoose';


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
        date: Number,
        score: Number,
        distance: Number,
        id: [Number],
        samples: [[[Number]]]
    }]
});

const PredictedRoadTypes = model('PredictedRoadTypes', predictedRoadTypesSchema, 'predictedRoadTypes');

export default PredictedRoadTypes;