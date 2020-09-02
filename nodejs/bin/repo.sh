#!/bin/bash
DIRECTORY=$(dirname $0)
node ${DIRECTORY}/../src/repo.js $* >&1