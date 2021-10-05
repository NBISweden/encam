# Configuration directory

If you run with docker-compose, this actual directory will be mounted as /config.

If you run the deployment image, you can mount a directory of your choice as /config.

Currently known contents that will be picked up from here:

* dhparam.pem

   Diffie-Hellman parameters for forward secrecy, can be generated with a command like
   `openssl dhparam -out dhparam.pem 2048`  

* cert.pem

   A certificate to use for TLS (pem format).

* ca.pem

   Certificate chain file to use for TLS (pem format)

* key.pem

   Private key to use for TLS (in pem format). 
