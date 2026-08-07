#!/bin/sh
DIR="$(dirname "$(readlink -f "$0")")/.."
cd "$DIR" && exec npm run dev
