export {};

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reparationSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    startTime: Number,
    city: String,
    from: {
        lat: Number,
        lng: Number
    },
    to: {
        lat: Number,
        lng: Number
    },
});

const Reparation = mongoose.model('Reparation', reparationSchema, 'reparations');

module.exports = Reparation;