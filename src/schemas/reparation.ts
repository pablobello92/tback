export {};

import {
    Schema,
    model
} from 'mongoose';
import { 
    iCoordinate
} from './subschemas/coordinate';

const reparationSchema = new Schema({
    _id: Schema.Types.ObjectId,
    cityId: Number,
    date: Number,
    from: iCoordinate,
    to: iCoordinate,
});

const Reparation = model('Reparations', reparationSchema, 'reparations');

export default Reparation;