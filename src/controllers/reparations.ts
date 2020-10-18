export {};

const Reparations = require('../models/reparation');

const getReparationsCallback = (req, res): void => {
    const filter = {
        city: req.query.city
    };
    Reparations.find(filter)
    .then(reparations => {
        res.send(reparations);
    })
    .catch(err => {
        console.error(err);
    });
};

const putReparationCallback = (req, res): void => {
    Reparations.insertMany([req.body])
    .then(res => {
        res.send(res)
    })
    .catch(error => {
        res.send(error);
    });
};

module.exports = [ getReparationsCallback, putReparationCallback ];