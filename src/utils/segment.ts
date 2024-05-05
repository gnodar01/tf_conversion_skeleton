import * as tf from "@tensorflow/tfjs";
import { imageFromLabelMask } from "./imageHelper";

async function miscModel(
  imageTensor: tf.Tensor4D,
  files: { jsonFile: File; weightsFiles: File[] },
  debug: boolean = false
) {
  debug && console.log("Files: ", files);

  const model = await tf.loadGraphModel(
    tf.io.browserFiles([files.jsonFile, ...files.weightsFiles])
  );

  debug && console.log("Model: ", model);

  const X = imageTensor.resizeBilinear([768, 768]) as tf.Tensor4D;
  const yHat = model.execute(X) as tf.Tensor4D;
  X.dispose();

  const output = yHat.reshape([
    yHat.shape[1],
    yHat.shape[2],
    yHat.shape[3],
  ]) as tf.Tensor3D;
  yHat.dispose();
  debug && console.log("model output", output);
  return imageFromLabelMask(output, debug);
}

export async function predictWith(
  imageTensor: tf.Tensor3D,
  files: { jsonFile: File; weightsFiles: File[] },
  debug: boolean = false
) {
  const batchedImageTensor = imageTensor.reshape([
    -1,
    imageTensor.shape[0],
    imageTensor.shape[1],
    imageTensor.shape[2],
  ]) as tf.Tensor4D;

  debug && console.log("Image Tensor: ", imageTensor);

  const labelMask = await miscModel(batchedImageTensor, files, debug);
  batchedImageTensor.dispose();
  return labelMask;
}
