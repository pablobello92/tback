export {};
import Reparation from './../models/reparation';

export const getReparationsCallback = (req: any, res: any): void => {
    const filter = {
        cityId: parseInt(req.query.cityId)
    };
    Reparation.find(filter)
        .then(reparations => {
            res.send(reparations);
        })
        .catch(err => {
            console.error(err);
        });
};

export const putReparationCallback = (req: any, res: any): void => {
    Reparation.insertMany([req.body])
        .then(response => {
            res.send(response)
        })
        .catch(error => {
            res.send(error);
        });
};