# React build stage
FROM node:13 as build-stage

WORKDIR /build

COPY frontend/package.json frontend/yarn.lock ./

RUN yarn install --frozen-lockfile

COPY frontend /build

RUN yarn run build

FROM ubuntu:18.04

RUN apt-get update && \
    apt-get install -y python3-pip && \
    mkdir /code

COPY ./api/requirements.txt /code/
COPY ./api/SIM.csv .

RUN pip3 install -r /code/requirements.txt

WORKDIR /code

COPY --from=build-stage /build/dist/* /static/

ENV FLASK_APP=server.py
ENV FLASK_ENV=development

ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8

CMD flask run --reload --host 0.0.0.0 --port=8080
