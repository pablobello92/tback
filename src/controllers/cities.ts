export {};

import City from './../models/city';
import {
    Document
} from 'mongoose';

export const getCitiesCallback = (req: any, res: any): void => {
    fetchCities()
    .then((result: Document[]) => {
        res.send(result);
    })
    .catch((error: any) => {
        res.send(error);
    });
};

export const fetchCities = (): Promise<Document[]> => City.find({}).exec();

export const fetchCityFields = (fields: string): Promise<any[] > => City.find().lean().select(fields).exec();