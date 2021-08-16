export {};

import Sumarization from '../models/sumarization';

import {
    map
} from 'rxjs/operators';
import {
    getTracksMapByCity, sumarizeTracksByCity
} from './tracks';
import {
    ISumarizingObject,
    ISumarizedObject,
} from '../interfaces/Segment';
import {
    IRange,
    ITrack
} from '../interfaces/Track';

const errorCallback = (err: any) => {
    console.error(err);
    throw err;
}

//TODO: pass the data as parameter, it's not a get callback anymore
const putSumarizationsCallback = (req: any, res: any, sumarizedTracks: any): void => {
    Sumarization.deleteMany({})
        .then((deleteResult: any) => {
            Sumarization.insertMany(sumarizedTracks)
                .then((insertResponse: any) => {
                    res.send(insertResponse);
                })
                .catch((err: any) => {
                    res.send(err);
                    res.end();
                });
        })
        .catch((error: any) => {
            res.send(error);
            res.end();
        });
}

// TODO: putSumarizationsCallback() deberia ir en un switchMap() dentro del pipe()
// TODO: Luego hago el res.send() en el subscribe()

//? Aca debe ir la funcion para descartar...
//? Para c/ciudad traigo las reparaciones y repito el proceso...
//? AL FINAL LO DE DESCARTAR SEGMENTOS REPARADOS NO LO VOY A IMPLEMENTAR...

export const sumarizeTracksCallback = (req: any, res: any): void => {
    getTracksMapByCity('cityId startTime ranges')
    .pipe(
            map((allData: ISumarizingObject[]) => sumarizeTracksByCity(allData)),
        )
        .subscribe((sumarizations: ISumarizedObject[]) => {
            putSumarizationsCallback(req, res, sumarizations);
        }, errorCallback);
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