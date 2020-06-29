

FROM encam_api:latest

RUN apt-get install -y supervisor nginx inotify-tools rsync

RUN pip3 install --no-cache-dir uwsgi

# Mountpoint for backend
RUN mkdir -p /api_src

COPY --from=encam_frontend:latest --chown=www-data:www-data /app/dist /app/dist

COPY system/supervisord.conf /etc/
COPY system/nginx.conf /etc/nginx/
COPY system/encam.devel.nginx /etc/nginx/encam.devel
COPY system/encam.standalone.nginx /etc/nginx/encam.standalone

VOLUME /etc/nginx

COPY system/entrypoint.sh /

CMD /entrypoint.sh
