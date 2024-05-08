import * as tf from "@tensorflow/tfjs";
import * as ImageJS from "image-js";
import { imageFromLabelMask, labelConnectedComponents } from "./imageHelper";

async function miscModel(
  imageTensor: tf.Tensor4D,
  files: { jsonFile: File; weightsFiles: File[] },
  debug: boolean = false
) {
  debug && console.log("miscModel - Files: ", files);

  const model = await tf.loadGraphModel(
    tf.io.browserFiles([files.jsonFile, ...files.weightsFiles])
  );

  debug && console.log("miscModel - Model: ", model);

  const X = imageTensor.resizeBilinear([768, 768]) as tf.Tensor4D;
  const yHat = model.execute(X) as tf.Tensor4D;
  model.dispose();
  X.dispose();

  const output = yHat.reshape([
    yHat.shape[1],
    yHat.shape[2],
    yHat.shape[3],
  ]) as tf.Tensor3D;
  yHat.dispose();

  debug && console.log("miscModel - Model Output", output);

  return output;
}

async function postprocess(
  yHatTensor: tf.Tensor3D,
  origShape: [number, number],
  debug: boolean = false
) {
  const outputImageTensor = tf.tidy(() =>
    // probably should be astype("bool")
    yHatTensor.sigmoid().greater(0.5).mul(255).round().asType("int32")
  ) as tf.Tensor3D;

  const height = outputImageTensor.shape[0];
  const width = outputImageTensor.shape[1];

  const image = new ImageJS.Image({
    height,
    width,
    data: outputImageTensor.dataSync(),
    kind: "GREY" as ImageJS.ImageKind,
    bitDepth: 8,
    components: 1,
    alpha: 0,
    colorModel: "GREY" as ImageJS.ColorModel,
  });

  debug && console.log("postprocess - yhat image", image);

  const erodedImage = image.erode({
    kernel: [
      [0, 0, 0, 0, 1, 0, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 1, 1, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0],
    ],
    iterations: 1,
  });

  debug && console.log("postprocess - eroded image", erodedImage);

  const dilatedImage = erodedImage.dilate({
    kernel: [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [1, 1, 1, 1, 1],
      [0, 1, 1, 1, 0],
      [0, 0, 1, 0, 0],
    ],
    iterations: 1,
  });

  debug && console.log("postprocess - dilated image", dilatedImage);

  const labelMask = labelConnectedComponents(
    dilatedImage.data as Uint8Array,
    dilatedImage.width,
    dilatedImage.height
  );

  const labelMaskTensor = tf.tidy(() =>
    tf
      .tensor3d(labelMask, [dilatedImage.height, dilatedImage.width, 1])
      .resizeBilinear(origShape)
      .asType("float32")
  ) as tf.Tensor3D;

  const scaledLabelMask = await imageFromLabelMask(labelMaskTensor, debug);

  return scaledLabelMask;
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

  debug && console.log("predictWith - Image Tensor: ", imageTensor);

  const yHatTensor = await miscModel(batchedImageTensor, files, debug);

  batchedImageTensor.dispose();

  const finalImage = postprocess(
    yHatTensor,
    [imageTensor.shape[0], imageTensor.shape[1]],
    debug
  );

  yHatTensor.dispose();

  return finalImage;
}
