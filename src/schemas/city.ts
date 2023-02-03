export {};

import {
    Schema,
    model
} from 'mongoose';
import { 
    iCoordinate
} from './subschemas/coordinate';

const citySchema = new Schema({
    _id: Schema.Types.ObjectId,
    id: Number,
    name: String,
    center: iCoordinate
});

const City = model('City', citySchema, 'cities', false);

export default City;