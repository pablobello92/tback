export {};

import City from './../models/city';

export const getCitiesCallback = (req: any, res: any): void => {
    fetchCityFields()
    .then((result: any[]) => {
        res.send(result);
    })
    .catch((error: any) => {
        res.send(error);
    });
};

export const fetchCityFields = (fields?: string): Promise<any[] > => City.find().lean().select(fields).exec();