#!/bin/sh -xe
test -n "$VERSION" || {
    echo '$VERSION needs to be set';
    exit 1
}
echo "export const version = '$VERSION'" > frontend/src/version.tsx
function cleanup {
    echo "export const version = 'git'" > frontend/src/version.tsx
}
trap cleanup EXIT
TAG="docker.pkg.github.com/nbisweden/encam/test:$VERSION"
docker-compose build
docker tag encam_main "$TAG"
docker push "$TAG"
ssh ubuntu@130.238.28.162 '
    docker stop $(docker ps --quiet);
    docker run --detach -p 80:8080 -p 443:8443 '"$TAG"'
'
