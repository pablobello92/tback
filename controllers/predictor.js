
const tf = require('@tensorflow/tfjs-node');

async function predictRoads() {
    const loadedModel = await tf.loadLayersModel('file://assets/model.json');
    const result = loadedModel.predict( tf.tensor2d([[0, 0.625, 0.495, 0.165, 1.262, 0.507, 0.318, 0.39]]));
    return result;
}

module.exports = predictRoads