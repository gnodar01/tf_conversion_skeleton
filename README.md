# tf_conversion_skeleton
Playground for creating TF model, converting to tfjs, and displaying in webapp

## Set up

Install Jupyter base environment, with kernals in other environments

```
conda install notebook
conda install jupyterlab
conda install nb_conda_kernels
# optionally, install extensiosn
conda install jupyter_contrib_nbextensions
```

Start a new environment

```
conda env create -n TF python=3.10 pip ipykernel
conda activate TF
```

Install TensorFlow. For mac follow [instructions here](https://developer.apple.com/metal/tensorflow-plugin/)

```
# only if using Apple Silicon
conda install apple tensorflow-deps

# install base TensorFlow
python -m pip install tensorflow-metal
```

Install tfjs_converter

`python -m pip install tensorflowjs`


Make sure you have yarn/npm and run

`yarn install`

Serve the webapp

`yarn start`
