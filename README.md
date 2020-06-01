# encam

Encyclopedia of Cancer Microenvironment

## Local development

```
docker-compose up --build
```

This starts a flask server on `localhost:8080` serving a static version of
the webpage and a javascript development server on `localhost:1234` with
hot reload.

## Deployment

The built `api` image could be used for deployment, the ENV var should be
changed though.
