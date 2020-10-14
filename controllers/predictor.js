
const tf = require('@tensorflow/tfjs-node');

async function predictRoads() {
    
    const loadedModel = await tf.loadLayersModel('file://assets/tensorFlowCore/roads/model.json');
    console.clear();
    console.log('model loaded');
    try {
        const result = loadedModel.predict( tf.tensor2d([[0, 0.625, 0.495, 0.165, 1.262, 0.507, 0.318, 0.39]]));
        console.log('The actual test abalone age is 10, the inference result from the model is ' + result.dataSync());
        return [1, 2, 3, 4];
    } catch(error) {
        console.log(error);
        return 0;
    }
    
    
}

module.exports = predictRoads