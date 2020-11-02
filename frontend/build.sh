#!/bin/sh -x

rm -rf dist

common_flags="
    --bundle src/main.tsx
    --outdir=dist
    --loader:.png=file
    --loader:.svg=file
    --define:VERSION='${VERSION:-unspecified}'
    --define:process.env.NODE_ENV='production'
    --define:process.platform='linux'
    --pure:console.log
    --pure:console.error
    --pure:console.warn
    --target=es6
"

modern_flags="
    --format=esm
    --splitting
"

old_flags="
    --format=iife
"

esbuild $common_flags $modern_flags
{
    pushd dist
    modern_filename="main.$(md5sum main.js | head -c 10).mjs"
    mv main.js "$modern_filename"
    popd
}

esbuild $common_flags $old_flags
{
    pushd dist
    old_filename="main.$(md5sum main.js | head -c 10).js"
    mv main.js "$old_filename"
    popd
}

{
    cd dist
    sed 's,.*main.js.*, \
        <script src="'"$modern_filename"'" type="module"></script> \
        <script src="'"$old_filename"'" nomodule></script> \
    ,' < ../public/index.html > index.html
}
