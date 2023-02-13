export const imageURLFromFile = (
  imageFile: File,
  dims: { width: number; height: number },
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

      const image = new Image(dims.width, dims.height); // w, h
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
