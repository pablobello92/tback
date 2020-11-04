export {};
import { sample } from './mocks';
import { Tensor4D, tensor4d, Tensor, loadLayersModel, Rank } from '@tensorflow/tfjs-node';

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

/**
 * 
 * 85 muestras
 * ==> tensor: [ [0...5][0]... [0...5][84] ] = [[x, y, z, xdiff, ydiff, zdiff][0]...]
 */
const predictRoads = async() => {
    console.clear();
    try {
        // return tensor;
        const tensor: Tensor4D = tensor4d(sample);
        const loadedModel = await loadLayersModel('file://src/assets/tensorFlowCore/roads/model.json');
        const result: Tensor<Rank> = loadedModel.predict(tensor) as Tensor;
        return result.dataSync();
    } catch(err) {
        console.error(err);
        throw new Error(err);
    }
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