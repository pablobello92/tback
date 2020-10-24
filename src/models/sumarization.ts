export {};

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sumarizationSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    city: String,
    date: Number,
    ranges: [{
        date: Number, // Remove dates!!!!
        start: {
            lat: Number,
            lng: Number
        },
        end: {
            lat: Number,
            lng: Number
        },
        score: Number,
        distance: Number,
        accuracy: Number
    }],
});

const Sumarization = mongoose.model('Sumarizations', sumarizationSchema, 'sumarizations');

module.exports = Sumarization;