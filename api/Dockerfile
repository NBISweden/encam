FROM python:3.8-buster

RUN apt-get update && apt-get -y upgrade

RUN mkdir -p /code

COPY ./ /code/
WORKDIR /code

RUN pip3 install --no-cache-dir -r /code/requirements.txt && chown -R www-data:www-data /code/
