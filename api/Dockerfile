FROM ubuntu:18.04

RUN apt-get update && \
    apt-get install -y python3-pip \
          && \
    mkdir /code


WORKDIR /api_source
COPY ./ /code/
WORKDIR /code

RUN pip3 install -r /code/requirements.txt

