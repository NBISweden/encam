FROM ubuntu:18.04

RUN apt-get update && \
    apt-get install -y python3-pip \
          && \
    mkdir /code

COPY requirements.txt /code/
COPY SIM.csv .

RUN pip3 install -r /code/requirements.txt

WORKDIR /code

ENV FLASK_APP=server.py
ENV LC_ALL=C.UTF-8

ENV LANG=C.UTF-8

CMD flask run --reload --host 0.0.0.0 --port=8080
