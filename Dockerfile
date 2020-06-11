

FROM encam_api:latest

RUN apt-get update && apt-get -y upgrade &&\
    apt-get install -y supervisor nginx inotify-tools rsync

RUN pip3 install uwsgi

RUN mkdir -p /api_source /frontend_updates

COPY --from=encam_frontend:latest --chown=www-data:www-data /app/dist/browser /app/dist/browser

COPY system/supervisord.conf /etc/
COPY system/nginx.conf /etc/nginx/
COPY system/entrypoint.sh /

CMD /entrypoint.sh
