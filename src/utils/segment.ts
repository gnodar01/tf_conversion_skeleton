import * as tf from "@tensorflow/tfjs";
import * as ImageJS from "image-js";
import { imageFromLabelMask, imageJSFromLabelMask } from "./imageHelper";

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

  return output;
}

function labelConnectedComponents(
  image: Uint8Array,
  width: number,
  height: number
): Uint8Array {
  const output = new Uint8Array(image.length);
  const stack: number[] = [];
  let currentLabel = 1;

  // Helper function to check if a pixel is within bounds and is foreground
  function isForeground(x: number, y: number): boolean {
    return (
      x >= 0 &&
      x < width &&
      y >= 0 &&
      y < height &&
      image[x * height + y] === 255
    );
  }

  // Helper function to process a connected component using stack
  function processComponent(x: number, y: number) {
    stack.push(x * height + y); // Push the starting pixel
    output[x * height + y] = currentLabel; // Label the starting pixel

    while (stack.length > 0) {
      const pixel = stack.pop()!;
      const px = Math.floor(pixel / height);
      const py = pixel % height;

      // Check neighbors
      const neighbors = [
        [px - 1, py],
        [px + 1, py],
        [px, py - 1],
        [px, py + 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (isForeground(nx, ny) && output[nx * height + ny] === 0) {
          stack.push(nx * height + ny);
          output[nx * height + ny] = currentLabel;
        }
      }
    }
  }

  // Loop through each pixel
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < height; y++) {
      const index = x * height + y;
      if (image[index] === 255 && output[index] === 0) {
        processComponent(x, y); // Start processing a new component
        currentLabel++; // Move to the next label for the next component
      }
    }
  }

  return output;
}

async function postprocess(yHatTensor: tf.Tensor3D, debug: boolean = false) {
  const outputImageTensor = tf.tidy(() =>
    yHatTensor.greater(0.5).mul(255).round().asType("int32")
  ) as tf.Tensor3D;

  const height = outputImageTensor.shape[0];
  const width = outputImageTensor.shape[1];

  const image = new ImageJS.Image({
    width,
    height,
    data: outputImageTensor.dataSync(),
    kind: "GREY" as ImageJS.ImageKind,
    bitDepth: 8,
    components: 1,
    alpha: 0,
    colorModel: "GREY" as ImageJS.ColorModel,
  });

  debug && console.log("yhat image", image);

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

  debug && console.log("eroded image", erodedImage);

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

  debug && console.log("dilated image", dilatedImage);

  const labelMask = labelConnectedComponents(
    dilatedImage.data as Uint8Array,
    dilatedImage.width,
    dilatedImage.height
  );

  const labelMaskTensor = tf.tidy(() =>
    tf
      .tensor3d(labelMask, [dilatedImage.height, dilatedImage.width, 1])
      .asType("float32")
  ) as tf.Tensor3D;

  const scaledLabelMask = imageFromLabelMask(labelMaskTensor, debug);

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

  debug && console.log("Image Tensor: ", imageTensor);

  const yHatTensor = await miscModel(batchedImageTensor, files, debug);

  batchedImageTensor.dispose();

  const finalImage = postprocess(yHatTensor, debug);

  yHatTensor.dispose();

  return finalImage;
}
