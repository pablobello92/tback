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
} from '../interfaces/Track';

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

export const getSumarizationsCallback = (req: any, res: any): void => {
    const filter = {
        cityId: req.query.cityId
    };
    getSumarizationsByFilter(filter)
        .then((result: any) => {
            res.send(result);
        })
        .catch((error: Error) => {
            res.send(error);
        })
        .finally(() => {
            res.end();
        });
}

const getSumarizationsByFilter = (filter: {}): Promise<Error | any> =>
    Sumarization.find(filter).lean()
        .catch((error: any) => new Error(error));