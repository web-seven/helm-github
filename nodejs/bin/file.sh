#!/bin/sh
DIRECTORY=$(dirname $0)
node ${DIRECTORY}/../src/file.js $* >&1