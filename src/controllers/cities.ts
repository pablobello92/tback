export {};
import express from 'express';
import City from '../schemas/city';

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

export const fetchCityFields = (filter?: {}, fields?: string): Promise<Error | any[]> =>
    City.find(filter, fields).lean()
        .then((res: any[]) => {
            const mapped = res.map((item: any) => {
                const { _id, ...relevantFields} = item;
                return relevantFields;
            });
            return mapped;
        })
        .catch((error: any) => new Error(error));