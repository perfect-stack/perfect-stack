#!/bin/bash

echo "NPM_TOKEN = ${NPM_TOKEN:0:4}***"

aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 100150877581.dkr.ecr.ap-southeast-2.amazonaws.com
#docker build --build-arg NODE_AUTH_TOKEN=${NODE_AUTH_TOKEN} --platform linux/amd64 -t demo-aws-server .
docker build --build-arg NPM_TOKEN=${NPM_TOKEN} --platform linux/amd64 -t demo-aws-server .
#docker build --platform linux/amd64 -t demo-aws-server .

export NPM_PKG_VERSION=$(npm pkg get version | sed 's/"//g')
docker tag  demo-aws-server:latest 100150877581.dkr.ecr.ap-southeast-2.amazonaws.com/demo-aws-server:$NPM_PKG_VERSION
docker push 100150877581.dkr.ecr.ap-southeast-2.amazonaws.com/demo-aws-server:$NPM_PKG_VERSION
