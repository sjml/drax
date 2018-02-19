#!/bin/bash

echo -n "Input tag name (usually a version string starting with \"v\"): "
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

git tag -a $version -m "$message"

echo -n "Push tag to origin repo? (default - yes): "
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
  git push origin $version
fi
