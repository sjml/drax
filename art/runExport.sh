#!/bin/bash

cd "$(dirname "$0")"

AI_FILE="DraxLogo.ai"
OUT_DIR="out"
STRAIGHT_EXPORT="$OUT_DIR/DraxLogoExported.svg"
CLEANED_EXPORT="$OUT_DIR/DraxLogo.svg"
ASSET_DIR="../src/assets/images"

cwd=$(pwd)
mkdir -p $OUT_DIR

if [ -f $STRAIGHT_EXPORT ] && [ $STRAIGHT_EXPORT -nt $AI_FILE ]; then
  echo "Exported file already; carry on."
else
  osascript <<-END
    if application "Adobe Illustrator" is running then
      set wasRunning to true
    else
      set wasRunning to false
    end if

    tell application "Adobe Illustrator"
      activate
      do javascript "#include ${cwd}/ai2svg.js"
    end tell

    if wasRunning then
      tell application "Adobe Illustrator" to quit
    end if
END
fi

sed -i '' '/<style type="text\/css">/r DraxLogo.css' $STRAIGHT_EXPORT

npx svgo -i $STRAIGHT_EXPORT -o $CLEANED_EXPORT --pretty --disable=removeHiddenElems

cp $CLEANED_EXPORT $ASSET_DIR
