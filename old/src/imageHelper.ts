export function imageToUint8Array(image: HTMLImageElement) {
  const canvas = document.getElementById("image-canvas") as HTMLCanvasElement;
  const context = canvas.getContext("2d");

  canvas.width = image.width;
  canvas.height = image.height;

  context.drawImage(image, 0, 0);
  // `getImageData().data` is a `Uint8ClampedArray`, which differs from `Uint8Array` only in
  // how data is treated when values are being *set*, so it is valid to perform the conversion
  // into a `Uint8Array`.
  return new Uint8Array(
    context.getImageData(0, 0, image.width, image.height).data.buffer
  );
}

export function imageFromFile(
  imageFile: File,
  debug: boolean = false
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (readEvent) => {
      const imageSrc = readEvent.target.result as string;

      const image = new Image(224, 224); // w, h
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
}

export function labelsFromFile(
  labelsFile: File,
  debug: boolean = false
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (readEvent) => {
      const labelsJson = JSON.parse(readEvent.target.result as string);

      debug && console.log("Labels: ", labelsJson);

      resolve(labelsJson);
    };

    reader.onerror = (err) => {
      reject(err);
    };

    reader.onabort = (err) => {
      reject(err);
    };

    reader.readAsText(labelsFile);
  });
}
