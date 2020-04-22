#!/bin/sh
# This script creates dist/ if it does not exist, and
# runs parcel build in docker writing output to dist/
mkdir -p dist
docker-compose -f docker-compose.yml -f docker-compose-build.yaml up frontend
