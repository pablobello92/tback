export {};

import City from './../models/city';

export const getCitiesCallback = (req: any, res: any): void => {
    fetchCityFields()
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

export const fetchCityFields = (fields?: string): Promise<Error | any[]> =>
    City.find().lean().select(fields)
        .then((result: any[]) => result.map(((item: any) => item.id)))
        .catch((error: any) => new Error(error));