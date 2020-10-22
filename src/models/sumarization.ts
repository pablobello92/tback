export {};

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sumarizationSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    city: String,
    ranges: [{
        _id: String,
        id: Number,
        date: Number,
        start: {
            latitude: Number,
            longitude: Number
        },
        end: {
            latitude: Number,
            longitude: Number
        },
        speed: Number,
        score: Number,
        stabilityEvents: [{
            id: Number,
            startTime: Number,
            endTime: Number,
            xavg: Number,
            yavg: Number,
            zavg: Number,
            score: Number,
            duration: Number
        }],
        distance: Number
    }],
    accelerometers: [{
        id: Number,
        eventId: Number,
        currentTime: Number,
        x: {
            raw: Number,
            delta: Number,
            diff: Number
        },
        y: {
            raw: Number,
            delta: Number,
            diff: Number
        },
        z: {
            raw: Number,
            delta: Number,
            diff: Number
        },
        axis: String
    }],
    accuracy: Number
});

const Sumarization = mongoose.model('Sumarizations', sumarizationSchema, 'sumarizations');

module.exports = Sumarization;