export {};

import { Schema, model } from 'mongoose';

const sumarizationSchema = new Schema({
    _id: Schema.Types.ObjectId,
    city: String,
    date: Number,
    ranges: [{
        date: Number, // Remove dates!!!!
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