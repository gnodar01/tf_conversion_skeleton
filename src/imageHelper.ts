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
