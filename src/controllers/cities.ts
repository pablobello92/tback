export {};

import City from './../models/city';
import {
    from,
    Observable
} from 'rxjs';
import {
    Document
} from 'mongoose';

export const getCitiesCallback = (req: any, res: any): void => {
    fetchCities()
    .subscribe({
        next(cities: Document[]) {
            res.send(cities);
        },
        error(err: any) { 
            console.error(err);
            throw (err);
        }
    });
};

export const fetchCities = (): Observable < Document[] > => {
    return from(City.find({}).exec());
}