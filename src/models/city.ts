export {};

import { Schema, model } from 'mongoose';

const citySchema = new Schema({
    _id: Schema.Types.ObjectId,
    name: String,
    center: {
        lat: Number,
        lng: Number
    }
});

const City = model('City', citySchema, 'cities', false);

export default City ;