export {};
import {
    sample
} from './mocks';
import {
    Tensor4D,
    tensor4d,
    Tensor,
    loadLayersModel,
    Rank
} from '@tensorflow/tfjs-node';
import {
    getTracksMapByCity
} from './tracks';
import {
    map,
    tap
} from 'rxjs/operators';
import {
    ISumarizedObject,
    ISumarizingObject
} from '../interfaces/Segment';
import Prediction from '../models/Prediction';

const errorCallback = (err: any) => {
    console.error(err);
    throw err;
}

//TODO: pass the data as parameter, it's not a get callback anymore
const putPredictionsCallback = (req: any, res: any, predictions: any): void => {
    Prediction.deleteMany({})
        .then((deleteResult: any) => {
            Prediction.insertMany(predictions)
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
        )
        .subscribe((predictions: ISumarizedObject[]) => {
            putPredictionsCallback(req, res, predictions);
        }, errorCallback);

    /*predictRoads()
    .then(response => {
        res.send(response);
    }, error => {
        console.error(error);
        res.send(error);
    });*/
}

const predictRoads = async () => {
    try {
        const tensor: Tensor4D = tensor4d(sample);
        const loadedModel = await loadLayersModel('file://src/assets/tensorFlowCore/roads/model.json');
        const result: Tensor < Rank > = loadedModel.predict(tensor) as Tensor;
        return result.dataSync();
    } catch (err) {
        console.error(err);
        throw new Error(err);
    }
}

export const predictAnomaliesCallback = (req: any, res: any): void => {
    res.send(["anomalies predicted!"]);
}


function sumarizeTracksByCity(allData: any[]): any {
    throw new Error('Function not implemented.');
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