#!/bin/bash

if ! type hub > /dev/null 2>&1; then
  >&2 echo "No working hub installation detected. https://hub.github.com/"
  exit 1
fi

if ! type node > /dev/null 2>&1; then
  >&2 echo "No working Node.js installation detected. https://nodejs.org/en/"
  exit 1
fi

if [ -n "$(git status --porcelain)" ]; then
  >&2 echo "Working directory has to be clean."
  exit 1
fi

currentVersion=$(node -p "require('./package.json').version")
echo -n "Input tag name (usually a version string starting with \"v\"; currently $currentVersion): "
read version

if [ -z "$version" ]; then
  >&2 echo "Tag name cannot be blank."
  exit 1
fi

echo -n "Message? (default - \"Tagging $version\"): "
read message
if [ -z $message ]; then
  message="Tagging $version"
fi

npm version $version

echo -n "Push tag and local commits to origin repo? (default - yes): "
read pushResponse
case ${pushResponse:0:1} in
  n|N )
    push=false
  ;;
  * )
    push=true
  ;;
esac
if [ "$push" = true ]; then
  git push --follow-tags

  echo -n "Do you want to make a release out of this? (default - no): "
  read relResponse
  case ${relResponse:0:1} in
    y|Y )
      release=true
    ;;
    * )
      release=false
    ;;
  esac
  if [ "$release" = true ]; then
    # TODO: take the notes in advance? Automate this from a changelist or something?
    echo "Creating release. Stick around for a minute; you'll need to write some notes."
    mkdir -p tmp/drax-$version
    npm run build
    mv dist tmp/drax-$version/drax
    cp devdocs/Administration.md tmp/drax-$version/README.md
    tar -czvf tmp/drax-$version.tar.gz -C tmp ./drax-$version
    hub release create -a tmp/drax-$version.tar.gz $version
  fi

  echo -n "Do you want to deploy this version to production? (default - yes): "
  read depResponse
  case ${depResponse:0:1} in
    n|N )
      deploy=false
    ;;
    * )
      deploy=true
    ;;
  esac
  if [ "$deploy" = true ]; then
    npm run deploy
  fi
fi
