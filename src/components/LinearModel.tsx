import { createEffect, createSignal, Show } from "solid-js";
import type { Component } from "solid-js";
import { Data } from "plotly.js-dist-min";
import PlotComponent from "~/plotlyComponents/PlotComponent";
import modelStyles from "~/styles/Model.module.css";

const LinearModel: Component = () => {
  const [X, setX] = createSignal<number[]>([1, 2, 3]);
  const [Y, setY] = createSignal<number[]>([4, 5, 6]);

  const [data, setData] = createSignal([
    { x: X(), y: Y(), mode: "markers", type: "scatter" },
  ]);

  createEffect(() => {
    setData((prev) => [{ ...prev[0], x: X(), y: Y() }]);
  });

  const predictAndPlot = async (X: number[]) => {
    // const preds = await predict(X, true);
    // const preds = [1, 2, 3];
    // setPreds(preds);
    // <Plot data={[{ x: X, y: preds, mode: "markers", type: "scatter" }]} layout={{ margin: { t: 0 } }} />
  };

  return (
    <div>
      <div>
        Run Prediction:
        <button
          class={modelStyles.predict}
          onclick={() => {
            setX((prev) => prev.map((e) => e + 1));
          }}
        >
          Dew It!
        </button>
      </div>
      {/* <Show when={preds().length > 0}>
      <div id="linear-model-plot">
      </div>
      </Show> */}
      <PlotComponent
        data={data as () => Data[]}
        layout={{ margin: { t: 0 } }}
        className={"LR-model-plot"}
      />
    </div>
  );
};

export default LinearModel;
