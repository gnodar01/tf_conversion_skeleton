import type { Component } from "solid-js";

import logo from "./logo.svg";
import styles from "./styles/App.module.css";

const App: Component = () => {
  return (
    <div class={styles.App}>
      <header class={styles.header}></header>
    </div>
  );
};

export default App;
