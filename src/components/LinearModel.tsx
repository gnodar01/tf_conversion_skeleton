import type { Component } from "solid-js";
import modelStyles from "~/styles/Model.module.css";

const LinearModel: Component = () => {
  return (
    <div id="linear-model">
      Run Prediction:
      <button class={modelStyles.predict} onclick={() => console.log("hello")}>
        Dew It!
      </button>
    </div>
  );
};

export default LinearModel;
