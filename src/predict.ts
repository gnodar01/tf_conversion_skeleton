import * as tf from '@tensorflow/tfjs';
import MODEL_JSON from "../saved_models/gra_web/model.json"
import MODEL_WEIGHTS from "../saved_models/gra_web/group1-shard1of1.bin"

export async function predict(X: number[], debug: boolean = false) {

    const model_topology_blob = new Blob([JSON.stringify(MODEL_JSON)], { type: 'application/json' });
    const model_topology = new File([model_topology_blob], "model.json", {type: 'application/json'});

    const model_weights_blob = new Blob([MODEL_WEIGHTS], {type: 'application/octet-stream'});
    const model_weights = new File([model_weights_blob], "group1-shard1of1.bin", {type: 'application/octet-stream'})

    const files = tf.io.browserFiles([model_topology, model_weights]);
    const model = await tf.loadGraphModel(files);

    const xT = tf.tensor1d(X);

    const yHatT = model.execute(xT) as tf.Tensor1D;
    
    const preds = yHatT.arraySync();

    if (debug) {
        // console.log(MODEL_JSON)

        console.log(model)

        console.log("X:", X);
        xT.print();

        console.log("preds:", preds);
        // yHatT instanceof tf.Tensor<tf.Rank> ? yHatT.print() : yHatT.map(t => t.print())
        yHatT.print();
    }


    xT.dispose();
    yHatT.dispose();

    return preds;
}