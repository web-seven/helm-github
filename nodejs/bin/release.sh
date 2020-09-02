#!/bin/bash
DIRECTORY=$(dirname $0)
node ${DIRECTORY}/../src/release.js $* >&1