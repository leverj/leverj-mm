#!/usr/bin/env bash

# make sure the following virtual env exists: .env/python3
# it can be created via: python3 -m venv .env/python3

source .env/python3/bin/activate
pip install --upgrade pip
pip install .

# for development
pip install -e .[dev]
python setup.py yarn --init
