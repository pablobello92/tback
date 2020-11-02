export {};
import * as tf from '@tensorflow/tfjs-node';
import { sample } from './mocks';
import { of } from 'rxjs/internal/observable/of';
import { tensor4d, TensorLike } from '@tensorflow/tfjs-node';

export const predictRoadsCallback = (req: any, res: any): void => {
    predictRoads()
    .then(response => {
        res.send(response);
    }, error => {
        console.error(error);
        res.send(error);
    });
}

export const predictAnomaliesCallback = (req: any, res: any): void => {
    res.send(["anomalies predicted!"]); 
}

const predictRoads = async() => {
    console.clear();
    return of(sample)
    .subscribe((res: any) => {
        const tensor = tf.tensor4d(res);
        console.log('tensor: ', tensor);
        try {
            return tensor;
            // const loadedModel = await tf.loadLayersModel('file://assets/tensorFlowCore/roads/model.json');
            // const result = loadedModel.predict(tensor);
            // return result;
            // return result.dataSync();
        } catch(err) {
            console.error(err);
            throw new Error(err);
        }   
    }, err => {
        console.error();
        throw new Error(err);
    });  
}