# encam

Encyclopedia of Cancer Microenvironment http://encima.one

## Local development

```
docker-compose up --build
```

This starts a flask server serving a static version of the webpage using nginx
on `localhost:8080` with the frontend development server proxied there too.


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

## Testing
To run the tests for the encam project
```
python test.py
```
in the `api` folder. The expected output is no assertion errors.

This can be run in a virtualenv or with
```
docker-compose exec api python test.py
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
