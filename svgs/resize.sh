#!/bin/sh

set -x

for i in *png; do
    convert $i -resize 6% ../frontend/img/$i
done
