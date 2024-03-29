export {};
import express from 'express';
import Reparation from '../schemas/reparation';

export const getReparationsCallback = (req: express.Request, res: express.Response): void => {
    const filter = {
        cityId: parseInt(req.query.cityId.toString())
        // TODO: add startTime filter!
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

export const putReparationCallback = (req: express.Request, res: express.Response): void => {
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