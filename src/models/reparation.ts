export {};

import {
    Schema,
    model
} from 'mongoose';

const reparationSchema = new Schema({
    _id: Schema.Types.ObjectId,
    cityId: Number,
    date: Number,
    from: {
        lat: Number,
        lng: Number
    },
    to: {
        lat: Number,
        lng: Number
    },
});

const Reparation = model('Reparations', reparationSchema, 'reparations');

export default Reparation;