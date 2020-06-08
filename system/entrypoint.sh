#!/bin/sh

# Set up self signed certificate in case none is supplied.

yes '' | openssl req -x509 -nodes -days 365 -newkey rsa:4096 -keyout /code/key.pem -out /code/cert.pem > /dev/null 2>/dev/null
cp /code/cert.pem /code/ca.pem

for p in {cert,key,ca}; do 
  if [ -r /config/$p.pem ]; then
    echo "$p.pem supplied, copying"
    cp "/config/$p.pem" /code/
  fi
done

if [ -r /config/dhparam.pem ]; then
    cp /config/dhparam.pem /code/
else
    echo "Generating forward secrecy crypto parameters"
    openssl dhparam -out /code/dhparam.pem 2048 > /dev/null 2>/dev/null
fi

chown www-data.www-data /code/*.pem

if getent hosts encam-frontend-devel >/dev/null; then
    # Development mode                                                                                                                                        
    mv /etc/nginx/encam.devel /etc/nginx/encam
else
    # Standalone
    mv /etc/nginx/encam.standalone /etc/nginx/encam
fi


supervisord -c /etc/supervisord.conf