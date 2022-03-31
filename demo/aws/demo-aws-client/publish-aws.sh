#!/bin/bash

export NPM_PKG_VERSION=$(npm pkg get version | sed 's/"//g')

npm run build
aws s3 cp --recursive ./dist/demo-aws-client/ s3://demo-aws-client-release/$NPM_PKG_VERSION
