

FROM encam_api:latest

RUN apt-get update && apt-get -y upgrade &&\
    apt-get install -y supervisor nginx inotify-tools rsync

RUN pip3 install uwsgi

COPY --from=encam_frontend:latest --chown=www-data:www-data /app/dist/browser /app/dist/browser

COPY system/supervisord.conf /etc/
COPY system/nginx.conf /etc/nginx/
COPY system/encam.devel.nginx /etc/nginx/encam.devel
COPY system/encam.standalone.nginx /etc/nginx/encam.standalone

COPY system/entrypoint.sh /

CMD /entrypoint.sh
