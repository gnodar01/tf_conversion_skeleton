import { batch, Component, createMemo, createSignal, Show } from "solid-js";
import { imageURLFromFile, labelsFromFile } from "~/utils/imageHelper";
import { predictWith } from "~/utils/predictClass";
import modelStyles from "~/styles/Model.module.css";

const UploadClassifier: Component = () => {
  const DEBUG = import.meta.env.VITE_DEBUG === "true";

  const [image, setImage] = createSignal<HTMLImageElement>();
  const [category, setCategory] = createSignal<string>("");
  const [prob, setProb] = createSignal<number>(0);

  const confidence = createMemo(
    () => `${category()}: ${(prob() * 100).toFixed(2)}%`
  );

  const predictAndPlotUpdated = async (files: {
    modelJsonFile: File;
    modelWeightsFiles: File[];
    dataFile: File;
    labelsFile: File;
  }) => {
    const imageElement = await imageURLFromFile(
      files.dataFile,
      { width: 224, height: 224 },
      DEBUG
    );
    const labelsJSON = await labelsFromFile(files.labelsFile, DEBUG);

    predictWith(
      imageElement,
      { jsonFile: files.modelJsonFile, weightsFiles: files.modelWeightsFiles },
      DEBUG
    ).then((preds) => {
      batch(() => {
        setImage(imageElement);
        setCategory(labelsJSON[preds.maxIdx]);
        setProb(preds.maxVal);
      });
    });
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
    const [labelsFile] = labelInput.files;

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
        labelsFile
      );

    predictAndPlotUpdated({
      modelJsonFile,
      modelWeightsFiles,
      dataFile,
      labelsFile,
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
            <label for="model-upload-input">Upload Classifier Model: </label>
            <input
              type="file"
              accept="application/json,application/octet-stream"
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
              accept="application/json"
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
        <Show when={image() !== undefined}>
          {image()}
          <p>{confidence()}</p>
        </Show>
      </div>
    </div>
  );
};

export default UploadClassifier;
