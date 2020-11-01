export {};
import Reparation from './../models/reparation';

export const getReparationsCallback = (req, res): void => {
    const filter = {
        city: req.query.city
    };
    Reparation.find(filter)
    .then(reparations => {
        res.send(reparations);
    })
    .catch(err => {
        console.error(err);
    });
};

export const putReparationCallback = (req, res): void => {
    Reparation.insertMany([req.body])
    .then(response => {
        res.send(response)
    })
    .catch(error => {
        res.send(error);
    });
};