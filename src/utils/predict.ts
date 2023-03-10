import * as tf from "@tensorflow/tfjs";
import MODEL_JSON from "../../saved_models/gra_web/model.json";
import MODEL_WEIGHTS from "../../saved_models/gra_web/group1-shard1of1.bin?raw";

async function linearRegressor(X: number[], debug: boolean = false) {
  const model_topology_blob = new Blob([JSON.stringify(MODEL_JSON)], {
    type: "application/json",
  });
  const model_topology = new File([model_topology_blob], "model.json", {
    type: "application/json",
  });

  const model_weights_blob = new Blob([MODEL_WEIGHTS], {
    type: "application/octet-stream",
  });
  const model_weights = new File([model_weights_blob], "group1-shard1of1.bin", {
    type: "application/octet-stream",
  });

  const files = tf.io.browserFiles([model_topology, model_weights]);

  const model = await tf.loadGraphModel(files);

  const xT = tf.tensor1d(X);

  const yHatT = model.execute(xT) as tf.Tensor1D;

  const yHatTIntermediate = model.execute(xT, [
    "StatefulPartitionedCall/ReadVariableOp",
    "StatefulPartitionedCall/ReadVariableOp_1",
  ]);

  const preds = yHatT.arraySync();

  if (debug) {
    // console.log(MODEL_JSON)

    console.log(model);

    console.log("X:", X);
    xT.print();

    console.log("preds:", preds);
    yHatTIntermediate instanceof tf.Tensor<tf.Rank>
      ? yHatTIntermediate.print()
      : yHatTIntermediate.map((t) => t.print());
    yHatT.print();
  }

  xT.dispose();
  yHatT.dispose();

  return preds;
}

async function miscModel(
  X: tf.Tensor4D,
  files: { jsonFile: File; weightsFiles: File[] },
  debug: boolean = false
) {
  debug && console.log("Files: ", files);

  const model = await tf.loadGraphModel(
    tf.io.browserFiles([files.jsonFile, ...files.weightsFiles])
  );

  debug && console.log("Model: ", model);

  // input [-1, 224, 224, 3]
  // output dense, [-1, 3]
  const yHat = model.execute(X) as tf.Tensor2D;
  const maxIdxT = tf.argMax(yHat, 1) as tf.Tensor1D;
  const maxValT = tf.max(yHat, 1, false) as tf.Tensor1D;

  const preds = yHat.arraySync()[0];
  const maxIdx = maxIdxT.arraySync()[0];
  const maxVal = maxValT.arraySync()[0];

  debug && console.log("Preds: ", preds);
  debug && console.log("Argmax: ", maxIdx);
  debug && console.log("MaxVal: ", maxVal);

  X.dispose();
  yHat.dispose();
  maxIdxT.dispose();
  maxValT.dispose();

  return { preds, maxIdx, maxVal };
}

export async function predict(X: number[], debug: boolean = false) {
  return linearRegressor(X, debug);
}

export async function predictWith(
  image: HTMLImageElement,
  files: { jsonFile: File; weightsFiles: File[] },
  debug: boolean = false
) {
  const imageTensor = tf.tidy(
    () =>
      tf.browser
        .fromPixels(image)
        .reshape([-1, 224, 224, 3])
        .asType("float32")
        .div(255) as tf.Tensor4D
  );

  debug && console.log("Image Tensor: ", imageTensor);

  return miscModel(imageTensor, files, debug);
}
