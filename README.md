# tf_conversion_skeleton

Playground for creating TF model, converting to tfjs, and displaying in webapp

## Backend Set up

Install Jupyter base environment, with kernals in other environments

```zsh
# if you haven't already installed jupyter
conda install nb_conda_kernels
conda install jupyterlab
conda install notebook
# optionally, install extensions
conda install jupyter_contrib_nbextensions
```

Start a new environment

```zsh
conda create -n TF python=3.10 pip ipykernel
conda activate TF
```

Install TensorFlow. Below are [for macOS only](https://developer.apple.com/metal/tensorflow-plugin/). For other OS, follow [instructions from tensorflow](https://www.tensorflow.org/install/pip#linux).

```zsh
# only if using Apple Silicon
conda install apple tensorflow-deps

# on macos, install base TensorFlow
python -m pip install tensorflow-macos

# on macos, install metal plugin (gpu support)
python -m pip install tensorflow-metal
```

Install tfjs_converter

```zsh
python -m pip install tensorflowjs
```

## Frontend Set up

### Usage

Make sure you have yarn, npm, or [pnpm](https://pnpm.io)

```bash
$ yarn install # or pnpm install or npm install
```

### Available Scripts

In the project directory, you can run:

#### `yarn dev` or `yarn start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>

#### `npm run build`

Builds the app for production to the `dist` folder.<br>
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

## Deployment

You can deploy the `dist` folder to any static host provider (netlify, surge, now, etc.)
