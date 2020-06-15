FROM python:3.8-buster

RUN mkdir -p /code

COPY ./ /code/
WORKDIR /code

RUN pip3 install -r /code/requirements.txt && chown -R www-data:www-data /code/
