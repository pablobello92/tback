export {};

import { Schema, model } from 'mongoose';

const userSchema = new Schema({
    _id: Schema.Types.ObjectId,
    username: String,
    nickname: String,
    password: String,
    email: String,
    sex: String,
    yearofbirth: Number,
    userLevel: Number,
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