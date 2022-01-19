FROM public.ecr.aws/lambda/nodejs:14
# Alternatively, you can pull the base image from Docker Hub: amazon/aws-lambda-nodejs:12

# Assumes your function is named "app.js", and there is a package.json file in the app directory
COPY dist/ .env app.js package.json /var/task/

# Install NPM dependencies for function
COPY .npmrc .npmrc
RUN npm install
RUN rm -f .npmrc

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "src/lambda.handler" ]