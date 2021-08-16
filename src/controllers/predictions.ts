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
    tap
} from 'rxjs/internal/operators/tap';

export const predictRoadsCallback = (req: any, res: any): void => {
    console.log('\n'.repeat(20));
    console.log('----------------');
    console.log('PREDECIR SUELOS');
    console.log('----------------');
    console.log('');
    const fields = 'id city startTime ranges accelerometers';
    getTracksMapByCity(fields)
        .subscribe((result: any) => {
            res.send(['Prediction']);
            res.end();
        }, (err: any) =>{
            res.send(['error']);
            res.end();
        });

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