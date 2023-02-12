import { createEffect, onCleanup, onMount } from "solid-js";
import type { Component } from "solid-js";
import Plotly from "plotly.js-dist-min";
import { PlotParams, PlotlyElement, Figure } from "./types";

// The naming convention is:
//   - events are attached as `'plotly_' + eventName.toLowerCase()`
//   - react props are `'on' + eventName`
const eventNames = [
  "AfterExport",
  "AfterPlot",
  "Animated",
  "AnimatingFrame",
  "AnimationInterrupted",
  "AutoSize",
  "BeforeExport",
  "BeforeHover",
  "ButtonClicked",
  "Click",
  "ClickAnnotation",
  "Deselect",
  "DoubleClick",
  "Framework",
  "Hover",
  "LegendClick",
  "LegendDoubleClick",
  "Relayout",
  "Relayouting",
  "Restyle",
  "Redraw",
  "Selected",
  "Selecting",
  "SliderChange",
  "SliderEnd",
  "SliderStart",
  "SunburstClick",
  "Transitioning",
  "TransitionInterrupted",
  "Unhover",
  "WebGlContextLost",
];

const updateEvents = [
  "plotly_restyle",
  "plotly_redraw",
  "plotly_relayout",
  "plotly_relayouting",
  "plotly_doubleclick",
  "plotly_animated",
  "plotly_sunburstclick",
] as const;

// Check if a window is available since SSR (server-side rendering)
// breaks unnecessarily if you try to use it server-side.
const isBrowser = typeof window !== "undefined";

const PlotComponent: Component<PlotParams> = (props) => {
  let p = Promise.resolve();
  let resizeHandler: (() => void) | undefined = undefined;
  let handlers: { [eventName: string]: (_: any) => any } = {};
  let unmounting = false;
  let el: PlotlyElement | undefined = undefined;

  onMount(() => {
    unmounting = false;
    updatePlotly(true, props.onInitialized, true, props.data());
  });

  createEffect(() => {
    el && updatePlotly(false, props.onUpdate, false, props.data());
  });

  const onPropsUpdate = (prevProps: PlotParams) => {
    unmounting = false;

    // frames *always* changes identity so fall back to check length only :(
    const numPrevFrames =
      prevProps.frames && prevProps.frames.length ? prevProps.frames.length : 0;
    const numNextFrames =
      props.frames && props.frames.length ? props.frames.length : 0;

    const figureChanged = !(
      prevProps.layout === props.layout &&
      prevProps.data === props.data &&
      prevProps.config === props.config &&
      numNextFrames === numPrevFrames
    );

    const revisionDefined = prevProps.revision !== void 0;
    const revisionChanged = prevProps.revision !== props.revision;

    if (
      !figureChanged &&
      (!revisionDefined || (revisionDefined && !revisionChanged))
    ) {
      return;
    }

    updatePlotly(false, props.onUpdate, false, props.data());
  };

  const updatePlotly = (
    shouldInvokeResizeHandler: boolean,
    figureCallbackFunction: typeof props.onInitialized | typeof props.onUpdate,
    shouldAttachUpdateEvents: boolean,
    data: ReturnType<typeof props.data>
  ) => {
    p = p
      .then(() => {
        if (unmounting) {
          return;
        }
        if (!el) {
          throw new Error("Missing element reference");
        }

        return Plotly.react(el, data, props.layout, props.config);
      })
      .then(() => {
        if (unmounting) {
          return;
        }
        syncWindowResize(shouldInvokeResizeHandler);
        syncEventHandlers();
        figureCallback(figureCallbackFunction);
        if (shouldAttachUpdateEvents) {
          attachUpdateEvents();
        }
      })
      .catch((err) => {
        if (props.onError) {
          props.onError(err);
        }
      });
  };

  onCleanup(() => {
    unmounting = true;

    figureCallback(props.onPurge);

    if (resizeHandler && isBrowser) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = undefined;
    }

    removeUpdateEvents();

    el && Plotly.purge(el);
  });

  const attachUpdateEvents = () => {
    if (!el || !el.removeEventListener) {
      return;
    }

    updateEvents.forEach((updateEvent: typeof updateEvents[number]) => {
      //@ts-ignore
      el?.on(updateEvent, handleUpdate);
    });
  };

  const removeUpdateEvents = () => {
    if (!el || !el.removeEventListener) {
      return;
    }

    updateEvents.forEach((updateEvent) => {
      el?.removeEventListener(updateEvent, handleUpdate);
    });
  };

  const handleUpdate = () => {
    figureCallback(props.onUpdate);
  };

  const figureCallback = (
    callback: typeof props.onUpdate | typeof props.onPurge
  ) => {
    if (!el) {
      return;
    }

    if (typeof callback === "function") {
      const { data, layout } = el;
      const frames = el._transitionData ? el._transitionData._frames : null;
      const figure = { data, layout, frames } as Figure;
      callback(figure, el);
    }
  };

  const syncWindowResize = (invoke: boolean) => {
    if (!el || !isBrowser) {
      return;
    }

    if (props.useResizeHandler && !resizeHandler) {
      resizeHandler = () => Plotly.Plots.resize(el as PlotlyElement);
      window.addEventListener("resize", resizeHandler);
      if (invoke) {
        resizeHandler();
      }
    } else if (props.useResizeHandler && resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = undefined;
    }
  };

  const getRef = (node: HTMLDivElement) => {
    el = node as unknown as PlotlyElement;

    if (props.debug && isBrowser) {
      //@ts-ignore
      window.gd = el;
    }
  };

  const syncEventHandlers = () => {
    eventNames.forEach((eventName) => {
      //@ts-ignore
      const prop: ((_: any) => any) | undefined = props["on" + eventName];
      const handler = handlers[eventName];
      const hasHandler = Boolean(handler);

      if (prop && !hasHandler) {
        addEventHandler(eventName, prop);
      } else if (!prop && hasHandler) {
        removeEventHandler(eventName);
      } else if (prop && hasHandler && prop !== handler) {
        removeEventHandler(eventName);
        addEventHandler(eventName, prop);
      }
    });
  };

  const addEventHandler = (eventName: string, prop: (_: any) => any) => {
    handlers[eventName] = prop;
    //@ts-ignore
    el?.on(getPlotlyEventName(eventName), handlers[eventName]);
  };

  const removeEventHandler = (eventName: string) => {
    el?.removeEventListener(getPlotlyEventName(eventName), handlers[eventName]);
    delete handlers[eventName];
  };

  const getPlotlyEventName = (eventName: string) => {
    return "plotly_" + eventName.toLocaleLowerCase();
  };

  return (
    <div
      id={props.divId}
      class={props.className}
      ref={getRef}
      style={{ position: "relative", display: "inline-block" }}
    />
  );
};

export default PlotComponent;
