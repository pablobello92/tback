const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reparationSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    startTime: Number,
    city: String,
    start: {
        lat: Number,
        lng: Number
    },
    end: {
        lat: Number,
        lng: Number
    },
});

const Reparation = mongoose.Schema('Reparation', reparationSchema);

module.exports = Reparation;