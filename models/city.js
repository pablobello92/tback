const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const citySchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
});

const City = mongoose.model('City', citySchema, 'cities', false);

module.exports = City;