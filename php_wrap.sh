#!/bin/bash

echo 'Setting up GitHub auth listening on localhost:4201...'
php -t ./php -S localhost:4201 > /dev/null 2>&1 &

ng serve --host localhost --port 4200
