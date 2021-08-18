export {};

import express from 'express';
import PredictedRoadTypes from '../models/predictedRoadTypes';

import {
    Tensor4D,
    tensor4d,
    Tensor,
    loadLayersModel,
    Rank
} from '@tensorflow/tfjs-node';
import {
    getTracksMapByCity,
    sampleTracksByCity
} from './tracks';
import {
    tap,
    map,
    switchMap
} from 'rxjs/operators';
import { 
    from,
    Observable
} from 'rxjs';
import {
    ISumarizedObject,
    ISumarizingObject
} from '../interfaces/Track';
import {
    tensorSample
} from './mocks';

interface PredictionType {
    id: number;
    description: string;
};

class PredictionTypes {
    private roadTypes: PredictionType[] = [
        {
            id: 0,
            description: 'Asphalt'
        },
        {
            id: 1,
            description: 'Cobbles'
        },
        {
            id: 2,
            description: 'Concrete'
        },
        {
            id: 3,
            description: 'Earth'
        }
    ];

    private anomalyTypes: PredictionType[] = [
        {
            id: 0,
            description: 'Call'
        },
        {
            id: 1,
            description: 'Door'
        },
        {
            id: 2,
            description: 'Message'
        },
        {
            id: 3,
            description: 'Pothole'
        },
        {
            id: 4,
            description: 'Speed Bump'
        },
        {
            id: 5,
            description: 'Street Gutter'
        }
    ];

    public getRoadType(id: number): PredictionType {
        return this.roadTypes.find((item: PredictionType) => item.id === id);
    }

    public getAnomalyType(id: number): PredictionType {
        return this.anomalyTypes.find((item: PredictionType) => item.id === id);
    }

    public getSample(x: number, y: number, z: number, xdiff: number, ydiff: number, zdiff: number): number[][] {
        return [[x], [y], [z], [xdiff], [ydiff], [zdiff]];
    }
}

export const predictRoadsCallback = (req: express.Request, res: express.Response): void => {
    console.log('\n'.repeat(20));
    console.log('----------------');
    console.log('PREDECIR SUELOS');
    console.log('----------------');
    
    // TODO: añadir soporte para filtrado en getTracksMapByCity()
    // TODO: agregar filtrado por campo req.body.linkedCities

    getTracksMapByCity('cityId startTime ranges accelerometers')
        .pipe(
            map((allData: ISumarizingObject[]) => sampleTracksByCity(allData)),
            tap((predictions: ISumarizedObject[]) => {
                predictions.forEach((p: ISumarizedObject) => {
                    p.date = Date.parse(new Date().toDateString());
                });
            }) ,
            switchMap((predictions: ISumarizedObject[]) => replacePredictions(predictions))
        )
        .subscribe((result: any) => {
            res.status(200).send(result);
            res.end();
        }, (error: Error) => {
            console.error(error);
            res.status(500).send(error);
            res.end();
        });

    /* predictSample(tensorSample)
    .then(response => {
        res.send(response);
    }, error => {
        console.error(error);
        res.send(error);
    }); */
}

const predictSample = async (sample: any) => {
    try {
        const tensor: Tensor4D = tensor4d(sample);
        const loadedModel = await loadLayersModel('file://src/assets/tensorFlowCore/roads/model.json');
        // Predict() retorna un numero que identifica al tipo de muestra segun orden alfabetico:
        const result: Tensor < Rank > = loadedModel.predict(tensor) as Tensor;
        return result.dataSync();
    } catch (err) {
        throw new Error(err);
    }
}

const removePredictions = (): Promise<Error | any> =>
    PredictedRoadTypes.deleteMany({})
        .then((result: any) => result)
        .catch((error: any) => new Error(error));

const insertPredictions = (values: any): Promise<Error | any> =>
    PredictedRoadTypes.insertMany(values)
        .then((result: any) => result)
        .catch((error: any) => new Error(error));

const replacePredictions = (values: any): Observable<Error | any> =>
    from(removePredictions())
    .pipe(
        switchMap((res: any) => insertPredictions(values))
    );

/**
 * ?------------------
 * ? ANOMALIAS
 * * ?------------------
 */

export const predictAnomaliesCallback = (req: express.Request, res: express.Response): void => {
    res.send(["anomalies predicted!"]);
}