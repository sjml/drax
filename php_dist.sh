#!/bin/bash

mkdir -p dist/auth
cp -R php/auth/vendor dist/auth/
cp php/auth/index.php dist/auth/
cp php/auth/secrets.php.base dist/auth/
echo secrets.php > dist/auth/.gitignore
