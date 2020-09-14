# encam

Encyclopedia of Cancer Microenvironment http://encima.one

## Local development

```
docker-compose up --build
```

This starts a flask server serving a static version of the webpage using nginx
on http://localhost:8080 with the built frontend.

The development server is started at http://localhost:1234 which proxies to the
flask process via the nginx server.

## Building and deploying

Make a new access token on https://github.com/settings/tokens/new

Set up github credentials on docker using the token as password:

```
docker login docker.pkg.github.com --username danr
```

Run the deploy script which will build the docker image, upload it as a
github package and then tell our running SNIC machine to pull it and restart:

```
VERSION=0.0.12 ./deploy.sh
```

## Running backend tests

To run the tests for the encam project
```
python test.py
```
in the `api` folder. The expected output is no assertion errors.

This can be run in a virtualenv or with
```
docker-compose run api python test.py
```

To get the code coverage, install the coverage package with pip and run
```
coverage run test.py
```
To get the report from the code coverage
```
coverage report -m
```
and the annotated HTML listings detailing missed lines
```
coverage html
```

## Running frontend tests

This can be done in the frontend directory with

```
yarn install
yarn run test
```

This can also be executed in the container with:

```
docker-compose run -w /app encam-frontend-devel yarn run test
```
