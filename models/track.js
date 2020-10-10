const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const trackSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    startTime: Number,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    city: String,
    ranges: [{
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
    }]
});

const Track = mongoose.model('Track', trackSchema);

module.exports = Track;