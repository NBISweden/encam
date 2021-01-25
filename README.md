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
It needs these permissions:

* `repo`
* `write:packages`
* `read:packages`

Set up github credentials on docker using the token as password:

```
docker login docker.pkg.github.com --username danr
```

Run the deploy script which will build the docker image, upload it as a
github package and then tell our running SNIC machine to pull it and restart:

```
VERSION=0.0.12 ./deploy.sh
```

The server needs a token to pull the image. The permissions need to be:

* `read:packages`

Login on the server as well:

```
docker login docker.pkg.github.com --username danr
```

## Moving to a new server

1. On the old server: copy the `config`, `certbot` and `snap` directories in `$HOME`.
2. On the new server:
    1. Install docker.
    2. Login with github API keys as above to be able to pull the docker image.
    3. Create a volume and attach it to the running instance.
    4. Mount the volume to the config directory of the instance. On SNIC this looks like:
    ```
    sudo mkfs.ext4 /dev/vdb
    mkdir -p ~/config
    sudo mount /dev/vdb ~/config
    ```
    Detailed instructions about mounting a volume: https://github.com/naturalis/openstack-docs/wiki/Howto:-Creating-and-using-Volumes-on-a-Linux-instance
    4. Put the old server's directories `config`, `certbot` and `snap` in `$HOME`.
    5. Make sure permissions on `config/content` are liberal:
    ```
    chmod 777 config/content
    chmod 666 config/content/*
    ```
3. Locally: update the `deploy.sh` script to point to the new server IP address.
4. Locally: run the `deploy.sh` script.
5. Update the DNS on .one to point to the new IP address.

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
