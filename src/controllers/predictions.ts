export {};

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
} from '../interfaces/Segment';
import {
    tensorSample
} from './mocks';
import PredictedRoadTypes from '../models/predictedRoadTypes';

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

const removePredictions = (): Promise<Error | any> => {
    return PredictedRoadTypes.deleteMany({})
        .then((result: any) => result)
        .catch((error: any) => new Error(error));
}

const insertPredictions = (values: any): Promise<Error | any> => {
    return PredictedRoadTypes.insertMany(values)
        .then((result: any) => result)
        .catch((error: any) => new Error(error));
}

const replacePredictions = (values: any): Observable<Error | any> => {
    return from(removePredictions())
    .pipe(
        switchMap((res: any) => insertPredictions(values))
    );
}

export const predictRoadsCallback = (req: any, res: any): void => {
    console.log('\n'.repeat(20));
    console.log('----------------');
    console.log('PREDECIR SUELOS');
    console.log('----------------');
    
    // TODO: añadir soporte para filtrado en getTracksMapByCity()
    // TODO: agregar filtrado por campo req.body.linkedCities

    getTracksMapByCity('cityId startTime ranges accelerometers')
        .pipe(
            map((allData: ISumarizingObject[]) => sampleTracksByCity(allData)),
            switchMap((predictions: ISumarizedObject[]) => replacePredictions(predictions))
        )
        .subscribe((result: any) => {
            res.send(result);
            res.end();
        }, (error: Error) => {
            res.send(error);
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


/**
 * ?------------------
 * ? ANOMALIAS
 * * ?------------------
 */

export const predictAnomaliesCallback = (req: any, res: any): void => {
    res.send(["anomalies predicted!"]);
}