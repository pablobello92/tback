export {};

import Sumarization from '../models/sumarization';

import {
    map,
    switchMap
} from 'rxjs/operators';
import { 
    from,
    Observable
} from 'rxjs';
import {
    getTracksMapByCity,
    sumarizeTracksByCity
} from './tracks';
import {
    ISumarizingObject,
    ISumarizedObject,
} from '../interfaces/Segment';


const removeSumarizations = (): Promise<Error | any> => {
    return Sumarization.deleteMany({})
        .then((result: any) => result)
        .catch((error: any) => new Error(error));
}

const insertSumarizations = (values: any): Promise<Error | any> => {
    return Sumarization.insertMany(values)
        .then((result: any) => result)
        .catch((error: any) => new Error(error));
}

const replaceSumarizations = (values: any): Observable<Error | any> => {
    return from(removeSumarizations())
    .pipe(
        switchMap((res: any) => insertSumarizations(values))
    );
}


//? Aca debe ir la funcion para descartar...
//? Para c/ciudad traigo las reparaciones y repito el proceso...
//? AL FINAL LO DE DESCARTAR SEGMENTOS REPARADOS NO LO VOY A IMPLEMENTAR...

export const sumarizeTracksCallback = (req: any, res: any): void => {
    getTracksMapByCity('cityId startTime ranges')
    .pipe(
            map((allData: ISumarizingObject[]) => sumarizeTracksByCity(allData)),
            switchMap((sumarizations: ISumarizedObject[]) => replaceSumarizations(sumarizations))
        )
        .subscribe((result: any) => {
            res.send(result);
            res.end();
        }, (error: Error) => {
            res.send(error);
            res.end();
        });
}

const getSumarizationsByFilter = async (filter: {}) => {
    try {
        const sumarizations: any[] = await Sumarization.find(filter)
        if (!sumarizations) {
            return [];
        }
        return sumarizations;
    } catch (error) {
        throw new Error("Error getting the Sumarizations");
    }
}

export const getSumarizationsCallback = (req: any, res: any): void => {
    const filter = {
        cityId: req.query.cityId
    };
    getSumarizationsByFilter(filter)
        .then(result => {
            res.send(result);
        })
        .catch(err => {
            console.error(err);
            res.send(err);
        });
}