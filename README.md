# encam

Encyclopedia of Cancer Microenvironment

## Local development

```
docker-compose up --build
```

This starts a flask server serving a static version of the webpage using nginx
on `localhost:80` and a javascript development server on `localhost:1234`
with hot reload.

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

To get the code coverage
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
