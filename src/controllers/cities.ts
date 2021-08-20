export {};
import express from 'express';
import City from './../models/city';

export const getCitiesCallback = (req: express.Request, res: express.Response): void => {
    fetchCityFields({})
    .then((result: any[]) => {
        res.send(result);
    })
    .catch((error: Error) => {
        res.send(error);
    })
    .finally(() => {
        res.end();
    });
};

export const fetchCityFields = (filter: {}, fields?: string): Promise<Error | any[]> =>
    City.find(filter).lean().select(fields)
        .then((result: any[]) => result.map(((item: any) => item.id)))
        .catch((error: any) => new Error(error));