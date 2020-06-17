#!/bin/sh

if getent hosts encam-frontend-devel >/dev/null; then
    # Development mode
    mv /etc/nginx/encam.devel /etc/nginx/encam
else
    # Standalone
    mv /etc/nginx/encam.standalone /etc/nginx/encam
fi


supervisord -c /etc/supervisord.conf
