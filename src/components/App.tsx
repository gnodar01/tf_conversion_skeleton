import type { Component } from "solid-js";
import UploadedModel from "./UploadedModel";
import LinearModel from "./LinearModel";
import styles from "~/styles/App.module.css";

const App: Component = () => {
  return (
    <div class={styles.App}>
      <header class={styles.header}>TFJS Demo</header>
      <LinearModel />
      <UploadedModel />
    </div>
  );
};

export default App;
