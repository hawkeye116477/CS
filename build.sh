#!/bin/bash

XPI_FILE=CS

SCRIPT_PATH=$(dirname "$(realpath -s "$0")")
MAIN_PATH=$(git -C "$SCRIPT_PATH" rev-parse --show-toplevel)

cd "$MAIN_PATH"/src || exit

echo "- Removing old xpi file"
if [ -f ../"CS.xpi" ]; then
    rm ../CS.xpi
fi

echo "- Creating xpi file"
zip -r9 ../CS.xpi ./*
