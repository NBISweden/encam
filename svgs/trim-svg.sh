#!/bin/sh
cat ../frontend/img/center.svg | awk -v n=40 '/<stop/ { if ((++count % n)== 0) print; next } { print }' > ../frontend/img/center-trimmed.svg
