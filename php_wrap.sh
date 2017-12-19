#!/bin/bash

echo 'Setting up PHP authentication listening on localhost:4201...'
php -t ./php -S localhost:4201 > /dev/null 2>&1 &
ng serve
