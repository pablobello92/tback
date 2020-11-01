export {};
import * as tf from '@tensorflow/tfjs-node';
import { sample } from './mocks';
import { of } from 'rxjs/internal/observable/of';
import { tensor4d, TensorLike } from '@tensorflow/tfjs-node';


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

const predictRoadsCallback = (req, res): void => {
    predictRoads()
    .then(response => {
        res.send(response);
    }, error => {
        console.error(error);
        res.send(error);
    });
}

const predictAnomaliesCallback = (req, res): void => {
    res.send(["anomalies predicted!"]); 
}

export { predictRoadsCallback, predictAnomaliesCallback };