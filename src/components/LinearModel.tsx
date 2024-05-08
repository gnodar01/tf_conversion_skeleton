import { batch, createEffect, createSignal, Show } from "solid-js";
import type { Component } from "solid-js";
import { Data } from "plotly.js-dist-min";
import PlotComponent from "~/plotlyComponents/PlotComponent";
import modelStyles from "~/styles/Model.module.css";
import { genX } from "~/utils/genX";
import { testX } from "~/tests/LRData";
import { predict } from "~/utils/predictClass";

const LinearModel: Component = () => {
  const DEBUG = import.meta.env.VITE_DEBUG === "true";

  const [X, setX] = createSignal<number[]>([]);
  const [Y, setY] = createSignal<number[]>([]);

  const [data, setData] = createSignal([
    { x: X(), y: Y(), mode: "markers", type: "scatter" },
  ]);

  createEffect(() => {
    setData((prev) => [{ ...prev[0], x: X(), y: Y() }]);
  });

  const predictAndPlotLR = async (X: number[]) => {
    const yHat = await predict(X, DEBUG);

    batch(() => {
      setX(X);
      setY(yHat);
    });
  };

  return (
    <div>
      <div>
        Run Linear Regression Prediction:
        <button
          class={modelStyles.predict}
          onclick={() => predictAndPlotLR(DEBUG ? testX : genX(100, 5, 1))}
        >
          Dew It!
        </button>
      </div>
      <Show when={X().length > 0}>
        <PlotComponent
          data={data as () => Data[]}
          layout={{ margin: { t: 0 } }}
          className={"LR-model-plot"}
        />
      </Show>
    </div>
  );
};

export default LinearModel;
