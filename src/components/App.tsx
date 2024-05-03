import type { Component } from "solid-js";
import UploadSegmenter from "./UploadSegmenter";
import styles from "~/styles/App.module.css";

const App: Component = () => {
  return (
    <div class={styles.App}>
      <header class={styles.header}>TFJS Demo</header>
      <UploadSegmenter />
    </div>
  );
};

export default App;
