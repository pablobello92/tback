export {};

import {
    Schema,
    model
} from 'mongoose';
import { 
    iRange
} from './subschemas/range';

const prediction = new Schema({
    _id: Schema.Types.ObjectId,
    cityId: Number,
    type: Number,
    date: Number,
    ranges: [iRange]
});

const Prediction = model('Predictions', prediction, 'predictions');

export default Prediction;