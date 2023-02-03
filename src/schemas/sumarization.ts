export {};

import {
    Schema,
    model
} from 'mongoose';
import { 
    iRange
} from './subschemas/range';

const sumarizationSchema = new Schema({
    _id: Schema.Types.ObjectId,
    type: Number,
    cityId: Number,
    date: Number,
    ranges: [iRange],
});

const Sumarization = model('Sumarizations', sumarizationSchema, 'sumarizations');

export default Sumarization;