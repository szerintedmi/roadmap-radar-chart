#!/bin/bash
#
#  Copy assets to dist
#

mkdir -p dist/exampleData
cp -R exampleData dist
cp src/style.css dist/style.css
cp src/svgtest.html dist/svgtest.html