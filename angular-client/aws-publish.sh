#!/bin/bash

export NPM_PKG_VERSION=$(npm pkg get version | sed 's/"//g')

npm build
aws s3 cp --recursive ./dist/angular-client/ s3://demo-aws-client-release/$NPM_PKG_VERSION
