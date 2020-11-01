export {};
import Reparation from './../models/reparation';

const getReparationsCallback = (req, res): void => {
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

const putReparationCallback = (req, res): void => {
    Reparation.insertMany([req.body])
    .then(response => {
        res.send(response)
    })
    .catch(error => {
        res.send(error);
    });
};

export { getReparationsCallback, putReparationCallback };