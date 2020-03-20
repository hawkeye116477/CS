#!/bin/bash

XPI_FILE=CS

path=$(dirname "$0")

cd $path/src

echo "- Removing old xpi file"
if [ -f "$XPI_FILE.xpi" ]; then
    rm $XPI_FILE.xpi
fi

echo "- Creating xpi file"
zip -r ../$XPI_FILE.xpi *
