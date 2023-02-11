# tf_conversion_skeleton

Playground for creating TF model, converting to tfjs, and displaying in webapp

## Set up

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

Make sure you have yarn/npm and run

`yarn install`

Serve the webapp

`yarn start`
