#!/bin/bash

php -t ./php -S localhost:4201 > /dev/null 2>&1 &
echo $! > .php_procid

