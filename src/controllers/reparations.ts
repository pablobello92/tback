export {};
import Reparation from './../models/reparation';

export const getReparationsCallback = (req: any, res: any): void => {
    const filter = {
        cityId: parseInt(req.query.cityId)
    };
    Reparation.find(filter)
        .then((result: any) => {
            res.send(result)
        })
        .catch((error: any) => {
            res.send(new Error(error));
        })
        .finally(() => {
            res.end();
        });
};

export const putReparationCallback = (req: any, res: any): void => {
    Reparation.insertMany([req.body])
        .then((result: any) => {
            res.send(result)
        })
        .catch((error: any) => {
            res.send(new Error(error));
        })
        .finally(() => {
            res.end();
        });
};