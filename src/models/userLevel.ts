export {};

import {
    Schema,
    model
} from 'mongoose';

const userLevelSchema = new Schema({
    _id: Schema.Types.ObjectId,
    level: Number,
    type: String,
});

const UserLevel = model('UserLevel', userLevelSchema);

export default UserLevel;