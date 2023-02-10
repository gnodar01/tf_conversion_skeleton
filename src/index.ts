import Plotly from "plotly.js-dist-min";
import { predict, predictWith } from "./predict";
import { genX } from "./genx";
import "./style.css";

async function predictAndPlotLR(X: number[], attachPoint: HTMLDivElement) {
  const plotDiv = document.createElement("div");
  plotDiv.id = "plot";

  const yHat = await predict(X, true);

  Plotly.newPlot(
    plotDiv,
    [{ x: X, y: yHat, mode: "markers", type: "scatter" }],
    { margin: { t: 0 } }
  );

  attachPoint.appendChild(plotDiv);
}

async function predictAndPlotUploaded(
  attachPoint: HTMLElement,
  dataFile: File,
  files: { jsonFile: File; weightsFiles: File[] },
  debug: boolean = false
) {
  const reader = new FileReader();
  reader.onload = async (readEvent) => {
    const imageSrc = readEvent.target.result as string;

    const image = new Image(224, 224); // w, h
    image.src = imageSrc;

    debug && console.log("Image Element: ", image);

    attachPoint.appendChild(image);

    image.onload = (e) => {
      predictWith(image, files, debug);
    };
  };

  reader.readAsDataURL(dataFile);
}

function getInputData(
  attachPoints: { upload: HTMLElement; main: HTMLElement },
  files: { jsonFile: File; weightsFiles: File[] },
  debug: boolean = false
) {
  const inputUpload = document.createElement("input");
  inputUpload.id = "data-upload";
  inputUpload.accept = "image/jpeg,image/png,image/tiff";
  inputUpload.type = "file";

  inputUpload.onchange = (uploadEvent) => {
    uploadEvent.preventDefault();

    const inputFiles = (uploadEvent.target as HTMLInputElement).files;

    if (!inputFiles || inputFiles.length === 0) {
      console.error("No files", uploadEvent.target);
    }

    const inputFile = inputFiles[0];

    debug && console.log("Input File: ", inputFile);

    predictAndPlotUploaded(attachPoints.main, inputFile, files, debug);
  };

  const inputLabel = document.createElement("label");
  inputLabel.htmlFor = "data-upload";
  inputLabel.id = "data-upload-label";
  inputLabel.innerText = "Upload Input Data (image): ";

  attachPoints.upload.appendChild(inputLabel);
  attachPoints.upload.appendChild(inputUpload);
}

function component() {
  const DEBUG = true;

  // Test Data
  const testX = [
    9.76699767, 3.80195735, 9.23246234, 2.61692424, 3.19097058, 1.18091233,
    2.41766293, 3.18533929, 9.64079245, 2.63649804, 4.41006122, 6.09870809,
    8.63621297, 8.63757671, 6.74881313, 6.59874348, 7.35757698, 2.22753658,
    1.72066185, 8.70414972, 0.60138658, 6.83688909, 6.71238019, 6.11017981,
    0.60137313, 9.77769274, 4.38951627, 5.32595022, 0.03132287, 2.51267105,
    8.58490437, 4.25298351, 7.35818994, 9.22043217, 1.53474171, 9.92259229,
    1.82331783, 9.40112902, 0.86883055, 4.68210715, 8.289892, 2.81052263,
    8.69091511, 9.76416574, 8.41713657, 4.488736, 3.7050843, 4.82669437,
    0.92181547, 2.26683105, 5.36566237, 7.33231651, 4.48910789, 3.0550077,
    9.47359603, 7.51033836, 4.7204846, 4.5727588, 7.46337803, 8.55399878,
    2.93501558, 7.33314499, 8.08830703, 8.87086974, 0.24833211, 5.12549448,
    6.1278568, 2.80348952, 4.52131727, 5.31221089, 9.88634563, 0.05978169,
    2.01288286, 2.56875796, 3.40744839, 0.53001963, 3.26494495, 1.98358207,
    8.29214909, 6.37121629, 0.85440736, 2.20160437, 6.81176006, 1.34410089,
    9.56513691, 1.36523977, 7.97702139, 4.98293523, 3.04707727, 2.34206052,
    8.93008166, 3.77536504, 0.76345452, 0.33806854, 4.61613322, 8.73823961,
    3.50609491, 8.23520552, 9.47199074, 0.6704071,
  ];

  // const expectedPreds = [
  // 9.8529625 , 3.706414   , 9.302162 , 2.485322   , 3.0768359 ,
  // 1.0056143 , 2.2799973  , 3.071033 , 9.722918   , 2.5054913 ,
  // 4.3330216 , 6.073052   , 8.687769 , 8.689175   , 6.7429385 ,
  // 6.5883026 , 7.3702264  , 2.084086 , 1.5617876  , 8.757772  ,
  // 0.4084543 , 6.833695   , 6.705397 , 6.0848727  , 0.4084404 ,
  // 9.863983  , 4.3118515  , 5.27678  , -0.17895573, 2.3778965 ,
  // 8.634899  , 4.1711645  , 7.370858 , 9.289766   , 1.3702102 ,
  // 10.013292 , 1.6675673  , 9.47596  , 0.6840362  , 4.6133456 ,
  // 8.330912  , 2.6848114  , 8.744137 , 9.850044   , 8.462027  ,
  // 4.4140906 , 3.6065934  , 4.7623324, 0.73863333 , 2.124576  ,
  // 5.317701  , 7.3441973  , 4.414474 , 2.9367356  , 9.550632  ,
  // 7.527636  , 4.652891   , 4.50067  , 7.4792466  , 8.603054  ,
  // 2.8130925 , 7.3450513  , 8.123192 , 8.929567   , 0.04465681,
  // 5.070225  , 6.1030874  , 2.6775641, 4.4476633  , 5.262623  ,
  // 9.975943  , -0.14963095, 1.8629005, 2.4356902  , 3.2999005 ,
  // 0.3349157 , 3.1530612  , 1.8327081, 8.333237   , 6.3538523 ,
  // 0.66917413, 2.0573645  , 6.807801 , 1.1737683  , 9.6449585 ,
  // 1.1955504 , 8.00852    , 4.923328 , 2.9285638  , 2.2020946 ,
  // 8.99058   , 3.6790128  , 0.5754537, 0.1371238  , 4.5453644 ,
  // 8.7929    , 3.4015489  , 8.274561 , 9.548979   , 0.47957498]

  const testX2 = [
    100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
    100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
    100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
    100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
    100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
    100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
    100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
  ]; // ret: [1042,...]

  const main = document.createElement("div");
  const btn = document.createElement("button");

  main.innerHTML = "Run prediction: ";
  main.classList.add("main");

  btn.innerHTML = "Dew It!";
  btn.onclick = () => predictAndPlotLR(DEBUG ? testX2 : genX(100, 5, 1), main);

  main.appendChild(btn);

  const upload = document.createElement("div");
  upload.id = "uploads";
  const input = document.createElement("input");
  input.id = "model-upload";
  input.accept = "application/json|.bin";
  input.type = "file";
  input.multiple = true;
  input.onchange = (event) => {
    event.preventDefault();

    const inputFiles = (event.target as HTMLInputElement).files;

    if (!inputFiles) {
      console.error("No files", event.target);
    }

    let weightsFiles: Array<File> = [];
    let jsonFile = inputFiles[0];
    for (let i = 0; i < inputFiles.length; i++) {
      const file = inputFiles[i];
      if (file.name.endsWith(".json")) {
        jsonFile = file;
      } else {
        weightsFiles.push(file);
      }
    }

    getInputData({ upload, main }, { jsonFile, weightsFiles }, DEBUG);
  };

  const inputLabel = document.createElement("label");
  inputLabel.htmlFor = "model-upload";
  inputLabel.id = "model-upload-label";
  inputLabel.innerText = "Upload Model: ";

  upload.appendChild(inputLabel);
  upload.appendChild(input);
  main.appendChild(upload);

  const canvas = document.createElement("canvas");
  canvas.id = "image-canvas";

  main.appendChild(canvas);

  return main;
}

document.body.appendChild(component());
