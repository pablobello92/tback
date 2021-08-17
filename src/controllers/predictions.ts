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
    sumarizeTracksByCity
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

const predictSample = async (sample: any) => {
    try {
        const tensor: Tensor4D = tensor4d(sample);
        const loadedModel = await loadLayersModel('file://src/assets/tensorFlowCore/roads/model.json');
        const result: Tensor < Rank > = loadedModel.predict(tensor) as Tensor;
        return result.dataSync();
    } catch (err) {
        throw new Error(err);
    }
}

// El resultado es el sample...
// Lo veo mañana, pero creo que primero obtengo la sumarizacion, luego eso es el sample
// Finalmente, el resultado del tensorflow es lo que inserto en la BBDD

export const predictRoadsCallback = (req: any, res: any): void => {
    console.log('\n'.repeat(20));
    console.log('----------------');
    console.log('PREDECIR SUELOS');
    console.log('----------------');
    getTracksMapByCity('cityId startTime ranges accelerometers')
        .pipe(
            map((allData: ISumarizingObject[]) => sumarizeTracksByCity(allData)),
            switchMap((predictions: ISumarizedObject[]) => replacePredictions(predictions))
        )
        .subscribe((result: any) => {
            res.send(result);
            res.end();
        }, (error: Error) => {
            res.send(error);
        });

    /* predictSample(tensorSample)
    .then(response => {
        res.send(response);
    }, error => {
        console.error(error);
        res.send(error);
    }); */
}

export const predictAnomaliesCallback = (req: any, res: any): void => {
    res.send(["anomalies predicted!"]);
}

/**
 *  Predict() retorna un numero que identifica al tipo de muestra segun orden alfabetico:
 *   Asphalt 0
 *   Cobbles 1
 *   Concrete 2
 *   Earth 3 
 * 
 *  Call 0
 * Door 1
 * Message 2
 * Pothole 3
 * Speed Bump 4
 * Street Gutter 5
 */