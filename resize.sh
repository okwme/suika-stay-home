#!/bin/bash

cd joon
rm -rf ../public/fin/*
mkdir -p ../public/fin
i=1
for img in *.*; do
  convert "$img" -trim +repage -resize 200x200 "../public/fin/$((i++)).png"
done