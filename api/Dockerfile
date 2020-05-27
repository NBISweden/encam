FROM ubuntu:18.04

RUN apt-get update && \
    apt-get install -y python3-pip \
          && \
    mkdir /code

COPY requirements.txt /code/
COPY SIM.csv .

RUN pip3 install -r /code/requirements.txt

WORKDIR /code


ENV LC_ALL=C.UTF-8
ENV LANG=C.UTF-8

CMD [ "uwsgi", "app.ini" ]


# Running the app with flask
#ENV FLASK_APP=server.py
#CMD flask run --reload --host 0.0.0.0 --port=8080

# Alternative ways for running the app through uwsgi
#CMD uwsgi --http 0.0.0.0:5001 --wsgi-file ${FLASK_APP} --callable app
#CMD uwsgi app.ini



