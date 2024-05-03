import * as ImageJS from "image-js";
import { tidy, Tensor3D, tensor3d, scalar, browser } from "@tensorflow/tfjs";

export enum ImageShapeEnum {
  DicomImage,
  GreyScale,
  SingleRGBImage,
  HyperStackImage,
  InvalidImage,
}

export type BitDepth = ImageJS.BitDepth;

export interface ImageShapeInfo {
  shape: ImageShapeEnum;
  bitDepth?: BitDepth;
  components?: number;
  alpha?: boolean;
}

export const convertToTensor = (
  imageStack: ImageJS.Stack,
  numChannels: number
): Tensor3D => {
  const { bitDepth, width, height } = imageStack[0];

  const numPixels = height * width;

  // create empty 2d array of expected size
  const imageData = new Float32Array(numChannels * numPixels);

  // fill in 2d array with image stack data
  // shape: [numFrames, numPixels]
  for (let i = 0; i < imageStack.length; i++) {
    imageData.set(Float32Array.from(imageStack[i].data), i * numPixels);
  }

  return tidy("stackToTensor", () => {
    // convert to 3d tensor
    // shape: [C, H, W]
    // then permute dims
    // shape: [H, W, C]
    let imageTensor: Tensor3D = tensor3d(imageData, [
      numChannels,
      height,
      width,
    ]).transpose([1, 2, 0]);

    // normalize in range of 0-1, if not already
    if (!(imageStack[0].data instanceof Float32Array)) {
      const normScalar = scalar(2 ** bitDepth - 1);
      imageTensor = imageTensor.div(normScalar);
    }

    return imageTensor;
  });
};

const getImageInformation = (
  image: ImageJS.Image | ImageJS.Stack
): ImageShapeInfo => {
  // a "proper" RGB will be an ImageJS.Image object with 3 components
  if (!Array.isArray(image) && image.components === 3) {
    return {
      shape: ImageShapeEnum.SingleRGBImage,
      components: image.components,
      bitDepth: image.bitDepth,
      alpha: image.alpha === 1,
    };
    // 1 channel (greyscale) image will also be an ImageJs.Image object
  } else if (!Array.isArray(image) && image.components === 1) {
    return {
      shape: ImageShapeEnum.GreyScale,
      components: image.components,
      bitDepth: image.bitDepth,
      alpha: image.alpha === 1,
    };
    // should not happen
  } else if (!Array.isArray(image)) {
    process.env.NODE_ENV !== "production" &&
      console.error("Unrecognized Image.JS.Image type, channels not in [1,3]");
    return {
      shape: ImageShapeEnum.InvalidImage,
    };
  }
  // else RGBstack, or multi-channel, or multi-z-stack image as an ImageJS.Stack object
  else {
    return {
      shape: ImageShapeEnum.HyperStackImage,
      components: image.length,
      bitDepth: image[0].bitDepth,
      alpha: image[0].alpha === 1,
    };
  }
};

const forceStack = async (image: ImageJS.Image | ImageJS.Stack) => {
  const imageShapeInfo = getImageInformation(image);

  if (imageShapeInfo.shape !== ImageShapeEnum.HyperStackImage) {
    image = (image as ImageJS.Image).split({ preserveAlpha: false });
    // preserveAlpha removes the alpha data from each ImageJS.Image
    // but its still present as its own ImageJS.Image as the final
    // element of the stack, so remove it
    if (imageShapeInfo.alpha) {
      image = new ImageJS.Stack(image.splice(0, image.length - 1));
    }
    return image;
  } else {
    return image as ImageJS.Stack;
  }
};

export const tensorFromFile = async (
  imageFile: File,
  channels: number,
  debug: boolean = false
): Promise<Tensor3D> => {
  const buffer = await imageFile.arrayBuffer();

  const image = (await ImageJS.Image.load(buffer, {
    ignorePalette: true,
  })) as ImageJS.Image | ImageJS.Stack;

  const imageStack = await forceStack(image);

  const imageTensor = convertToTensor(imageStack, channels);

  debug && console.log("Image Tensor: ", imageTensor);

  return imageTensor;
};

export const imageURLFromFile = (
  imageFile: File,
  debug: boolean = false
): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (readEvent) => {
      if (!readEvent.target) {
        console.warn("No image file read event target", readEvent);
        return;
      }

      const imageSrc = readEvent.target.result as string;

      const image = new Image(); // w, h
      image.src = imageSrc;
      image.id = "image-upload";

      debug && console.log("Image Element: ", image);

      image.onload = (_e) => {
        resolve(image);
      };

      image.onerror = (err) => {
        reject(err);
      };
    };

    reader.onerror = (err) => {
      reject(err);
    };

    reader.onabort = (err) => {
      reject(err);
    };

    reader.readAsDataURL(imageFile);
  });
};

export const labelsFromFile = (
  labelsFile: File,
  debug: boolean = false
): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (readEvent) => {
      if (!readEvent?.target?.result) {
        console.warn("No labels file read event target", readEvent);
        return;
      }

      const labelsJSON = JSON.parse(readEvent.target.result as string);

      debug && console.log("Labels: ", labelsJSON);

      resolve(labelsJSON);
    };

    reader.onerror = (err) => {
      reject(err);
    };

    reader.onabort = (err) => {
      reject(err);
    };

    reader.readAsText(labelsFile);
  });
};

export const imageFromTensor = async (
  imageTensor: Tensor3D,
  debug: boolean = false
) => {
  const width = imageTensor.shape[1];
  const height = imageTensor.shape[0];
  const image = new ImageJS.Image({
    width,
    height,
    data: imageTensor.dataSync(),
    kind: "RGB" as ImageJS.ImageKind,
    bitDepth: 8,
    components: 3,
    alpha: 0,
    colorModel: "RGB" as ImageJS.ColorModel,
  });
  const img = new Image(width, height);
  img.src = image.toDataURL();
  return img;
};

export const imageFromLabelMask = async (
  imageTensor: Tensor3D,
  debug: boolean = false
) => {
  const maxVal = imageTensor
    .max(undefined, false)
    .dataSync() as unknown as number;
  const multiplicand = Math.floor((1 / maxVal) * 255);
  const imageFormatted = tidy(() =>
    imageTensor.mul(multiplicand).asType("int32")
  ) as Tensor3D;

  const width = imageFormatted.shape[1];
  const height = imageFormatted.shape[0];

  const image = new ImageJS.Image({
    width,
    height,
    data: imageFormatted.dataSync(),
    kind: "GREY" as ImageJS.ImageKind,
    bitDepth: 8,
    components: 1,
    alpha: 0,
    colorModel: "GREY" as ImageJS.ColorModel,
  });
  const img = new Image(width, height);
  img.src = image.toDataURL();

  debug && console.log("Image from label mask: ", img);
  debug &&
    console.log("Image from label mask tensor: ", imageFormatted.dataSync());
  imageFormatted.dispose();

  return img;
};
