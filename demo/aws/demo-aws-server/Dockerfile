FROM public.ecr.aws/lambda/nodejs:14
# Alternatively, you can pull the base image from Docker Hub: amazon/aws-lambda-nodejs:12

# Assumes your function is named "app.js", and there is a package.json file in the app directory
COPY package*.json /var/task/

# Install NPM dependencies for function
#COPY .npmrc .npmrc
#RUN npm install --only=production
#RUN rm -f .npmrc
RUN --mount=type=secret,id=npm,target=/root/.npmrc npm install --only=production

COPY dist/ .env /var/task/

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "dist/lambda.handler" ]

