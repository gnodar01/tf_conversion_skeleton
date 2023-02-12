import type { Component } from "solid-js";
import modelStyles from "~/styles/Model.module.css";

const Upload: Component = () => {
  const DEBUG = import.meta.env.VITE_DEBUG === "true";

  return (
    <div class="upload">
      <form
        action=""
        method="post"
        class="upload-form"
        enctype="multipart/form-data"
        onSubmit={(e: SubmitEvent) => {
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

          console.log(modelWeightsFiles, modelJsonFile, dataFile, labelFile);
          console.log(import.meta);
        }}
      >
        <div>
          <label for="model-upload-input">Upload Model: </label>
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
  );
};

export default Upload;
