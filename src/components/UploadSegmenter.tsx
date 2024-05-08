import { batch, Component, createMemo, createSignal, Show } from "solid-js";
import {
  imageFromTensor,
  tensorFromFile,
  imageFromLabelMask,
} from "~/utils/imageHelper";
import { predictWith } from "~/utils/segment";
import modelStyles from "~/styles/Model.module.css";
import { set } from "lodash";

const UploadSegmenter: Component = () => {
  const DEBUG = import.meta.env.VITE_DEBUG === "true";

  const [image, setImage] = createSignal<HTMLImageElement>();
  const [annotation, setAnnotation] = createSignal<HTMLImageElement>();
  const [prediction, setPrediction] = createSignal<HTMLImageElement>();

  const predictAndShow = async (files: {
    modelJsonFile: File;
    modelWeightsFiles: File[];
    dataFile: File;
    labelFile?: File;
  }) => {
    let annotationElement = undefined;

    DEBUG && console.log("Creating Image Tensor");
    const imageTensor = await tensorFromFile(files.dataFile, 3, DEBUG);
    const imageElement = await imageFromTensor(imageTensor, DEBUG);
    if (files.labelFile) {
      DEBUG && console.log("Creating Annotations Tensor");
      const annotationTensor = await tensorFromFile(files.labelFile, 1, DEBUG);

      annotationElement = await imageFromLabelMask(annotationTensor, DEBUG);
      annotationTensor.dispose();
    }
    const pred = await predictWith(
      imageTensor,
      { jsonFile: files.modelJsonFile, weightsFiles: files.modelWeightsFiles },
      DEBUG
    );
    batch(() => {
      setImage(imageElement);
      setAnnotation(annotationElement);
      setPrediction(pred);
    });
    imageTensor.dispose();
  };

  const handleSubmit = (e: SubmitEvent) => {
    e.preventDefault();

    if (!e || !e.target) {
      console.warn("Unrecognized event", e);
      return;
    }

    const [modelInput, dataInput, labelInput] = Object.values(
      e.target as HTMLFormElement
    ) as HTMLInputElement[];

    if (!modelInput.files) {
      console.warn("Missing model files");
      return;
    } else if (!dataInput.files) {
      console.warn("Missing data file");
      return;
    } else if (!labelInput.files) {
      console.warn("Missing label file");
      return;
    }

    const modelFiles = modelInput.files;
    const [dataFile] = dataInput.files;
    const [labelFile] = labelInput.files;

    let modelWeightsFiles: Array<File> = [];
    let modelJsonFile = modelFiles[0];
    for (let i = 0; i < modelFiles.length; i++) {
      const file = modelFiles[i];
      if (file.name.endsWith(".json")) {
        modelJsonFile = file;
      } else {
        modelWeightsFiles.push(file);
      }
    }

    DEBUG &&
      console.log(
        "submitted: ",
        modelWeightsFiles,
        modelJsonFile,
        dataFile,
        labelFile
      );

    predictAndShow({
      modelJsonFile,
      modelWeightsFiles,
      dataFile,
      labelFile,
    });
  };

  return (
    <div>
      <div class="upload">
        <form
          action=""
          method="post"
          class="upload-form"
          enctype="multipart/form-data"
          onSubmit={handleSubmit}
        >
          <div>
            <label for="model-upload-input">Upload Segmenter Model: </label>
            <input
              type="file"
              accept="*"
              multiple={true}
              id="model-upload-input"
              class={modelStyles.upload}
            />
          </div>

          <div>
            <label for="data-upload-input">Upload Data: </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/tiff"
              id="data-upload-input"
              class={modelStyles.upload}
            />
          </div>

          <div>
            <label for="label-upload-input">Upload Labels: </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/tiff"
              id="label-upload-input"
              class={modelStyles.upload}
            />
          </div>

          <div>
            <label for="upload-submit">Submit:</label>
            <input
              type="submit"
              value="Dew it!"
              id="upload-submit"
              class={modelStyles.predict}
            />
          </div>
        </form>
      </div>

      <div>
        <Show when={image() !== undefined}>{image()}</Show>
        <Show when={annotation() !== undefined}>{annotation()}</Show>
        <Show when={prediction() !== undefined}>{prediction()}</Show>
      </div>
      <canvas
        id="theCanvas"
        style="visibility:hidden"
        width="768"
        height="768"
      ></canvas>
    </div>
  );
};

export default UploadSegmenter;
