import type { Component } from "solid-js";
import Upload from "./Upload";
import LinearModel from "./LinearModel";
import styles from "~/styles/App.module.css";

const App: Component = () => {
  return (
    <div class={styles.App}>
      <header class={styles.header}>TFJS Demo</header>
      <LinearModel />
      <Upload />
    </div>
  );
};

export default App;
