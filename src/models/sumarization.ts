export {};

import {
    Schema,
    model
} from 'mongoose';

const sumarizationSchema = new Schema({
    _id: Schema.Types.ObjectId,
    cityId: Number,
    date: Number,
    ranges: [{
        // TODO: Por lo visto tengo que sacar este campo date
        date: Number,
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

const Sumarization = model('Sumarizations', sumarizationSchema, 'sumarizations');

export default Sumarization;