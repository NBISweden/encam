#!/bin/sh
rm -rf dist
esbuild                                          \
    --bundle src/index.tsx                       \
    --outdir=dist                                \
    --loader:.png=file                           \
    --loader:.svg=file                           \
    --target=es6                                 \
    --minify                                     \
    "--define:VERSION='${VERSION:-unspecified}'" \
    "--define:process.env.NODE_ENV='production'" \
    "--define:process.platform='linux'"          \
    --pure:console.log
cd dist
index_hash="main.$(md5sum index.js | head -c 10).js"
mv index.js "$index_hash"
sed 's,.*index.js.*,<script src="'"$index_hash"'"></script>,' < ../public/index.html > index.html
