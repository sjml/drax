#!/bin/bash

cd "$(dirname "$0")"

AI_FILE="../DraxLogo.ai"
OUT_DIR="../out"
FULL_EXPORT="$OUT_DIR/DraxLogoExported.svg"
SIMPLE_EXPORT="$OUT_DIR/DraxLogoSimpleExported.svg"
FINAL_EXPORT="$OUT_DIR/DraxLogo.svg"
FINAL_SIMPLE_EXPORT="$OUT_DIR/DraxLogoSimple.svg"
SRC_DIR="../../src"
ASSET_DIR="$SRC_DIR/assets"
IMAGE_DIR="$ASSET_DIR/images"
ICON_DIR="$ASSET_DIR/icons"

cwd=$(pwd)
mkdir -p $OUT_DIR


# Generate SVG from Illustrator file, which is still the most reliable way
#   to do this. :-/
if [ -f $FINAL_EXPORT ] && [ $FINAL_EXPORT -nt $AI_FILE ]; then
  echo "Exported file already; carry on."
else
  osascript ./aiExport.scpt
fi

# Optimize the output SVG and copy it to the assets folder
npx svgo -i $FULL_EXPORT -o $FINAL_EXPORT --pretty
npx svgo -i $SIMPLE_EXPORT -o $FINAL_SIMPLE_EXPORT --pretty
cp $FINAL_EXPORT $IMAGE_DIR
cp $FINAL_SIMPLE_EXPORT $IMAGE_DIR

# Generate all the PNGs we'll need
echo 'Generating pngs from svg...'
node svg2pngs.js

# CRUSH THEM and make single .ico
mkdir -p $OUT_DIR/crushed
(cd $OUT_DIR && ls *.png | while read line; do pngcrush -brute $line crushed/$line; done)
convert \
  $OUT_DIR/crushed/favicon-16.png\
  $OUT_DIR/crushed/favicon-24.png\
  $OUT_DIR/crushed/favicon-32.png\
  $OUT_DIR/crushed/favicon-48.png\
  $OUT_DIR/crushed/favicon-64.png\
  $OUT_DIR/crushed/favicon.ico

# Copy the favicons over
cp $OUT_DIR/crushed/favicon.ico $SRC_DIR
cp -r $OUT_DIR/crushed/*.png $ICON_DIR
