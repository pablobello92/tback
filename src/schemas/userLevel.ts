export {};

import {
    Schema,
    model
} from 'mongoose';

const userLevelSchema = new Schema({
    _id: Schema.Types.ObjectId,
    id: Number,
    level: Number,
    type: String,
});

const UserLevel = model('UserLevel', userLevelSchema);

export default UserLevel;