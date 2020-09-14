#!/bin/sh
rm -rf dist
esbuild                                          \
    --bundle src/main.tsx                        \
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
main_hash="main.$(md5sum main.js | head -c 10).js"
mv main.js "$main_hash"
sed 's,.*main.js.*,<script src="'"$main_hash"'"></script>,' < ../public/index.html > index.html
