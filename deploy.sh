#!/bin/sh -xe
test -n "$VERSION" || {
    echo '$VERSION needs to be set';
    exit 1
}
TAG="docker.pkg.github.com/nbisweden/encam/test:$VERSION"
docker-compose build --compress --build-arg "VERSION=$VERSION"
docker tag encam_main "$TAG"
docker push "$TAG"
ssh ubuntu@130.238.28.162 '
    docker stop $(docker ps --quiet);
    docker run --detach -v /home/ubuntu/config:/config -p 80:8080 -p 443:8443 '"$TAG"'
'
