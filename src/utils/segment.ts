import * as tf from "@tensorflow/tfjs";

async function miscModel(
  X: tf.Tensor4D,
  files: { jsonFile: File; weightsFiles: File[] },
  debug: boolean = false
) {
  debug && console.log("Files: ", files);

  const canvas = document.getElementById("theCanvas") as HTMLCanvasElement;
  const fakeY = tf.tidy(() => {
    return X.mul(255)
      .reshape([768, 768, 3])
      .round()
      .asType("int32") as tf.Tensor3D;
  });
  const imageData = await tf.browser.toPixels(fakeY, canvas);
  const img = new Image();
  img.src = canvas.toDataURL();

  return img;

  //const model = await tf.loadGraphModel(
  //  tf.io.browserFiles([files.jsonFile, ...files.weightsFiles])
  //);

  //debug && console.log("Model: ", model);

  //// input [-1, W, H, 3]
  //// output dense, [-1, 3]
  //const yHat = model.execute(X) as tf.Tensor2D;

  //const canvas = document.getElementById("theCanvas") as HTMLCanvasElement;
  //const fakeY = tf.tidy(() => {
  //  return X.mul(255).reshape([768, 768, 3]) as tf.Tensor3D;
  //});
  //const imageData = await tf.browser.toPixels(fakeY, canvas);
  //const img = new Image();
  //img.src = canvas.toDataURL();

  //return img;

  // const maxIdxT = tf.argMax(yHat, 1) as tf.Tensor1D;
  // const maxValT = tf.max(yHat, 1, false) as tf.Tensor1D;

  // const preds = yHat.arraySync()[0];
  // const maxIdx = maxIdxT.arraySync()[0];
  // const maxVal = maxValT.arraySync()[0];

  // debug && console.log("Preds: ", preds);
  // debug && console.log("Argmax: ", maxIdx);
  // debug && console.log("MaxVal: ", maxVal);

  // X.dispose();
  // yHat.dispose();
  // maxIdxT.dispose();
  // maxValT.dispose();

  // return { preds, maxIdx, maxVal };
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
        .reshape([-1, 768, 768, 3])
        .asType("float32")
        .div(255) as tf.Tensor4D
  );

  debug && console.log("Image Tensor: ", imageTensor);

  return miscModel(imageTensor, files, debug);
}
