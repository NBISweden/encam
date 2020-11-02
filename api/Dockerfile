FROM python:3.8-buster

RUN apt-get update && apt-get -y upgrade

WORKDIR /code
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r /code/requirements.txt
COPY . .
RUN chown -R www-data:www-data /code/
