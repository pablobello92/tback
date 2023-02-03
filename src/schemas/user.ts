export {};

import {
    Schema,
    model
} from 'mongoose';

const userSchema = new Schema({
    _id: Schema.Types.ObjectId,
    id: Number,
    level: Number,
    linkedCities: [Number],
    username: String,
    password: String,
    nickname: String,
    email: String,
    sex: String,
    yearofbirth: Number,
    car: {
        brand: String,
        model: String,
        year: Number
    },
    smartphone: {
        brand: String,
        model: String
    }
});

const User = model('User', userSchema);

export default User;