export {};

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    username: String,
    nickname: String,
    password: String,
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

const User = mongoose.model('User', userSchema);

module.exports = User;