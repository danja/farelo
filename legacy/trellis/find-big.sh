#!/bin/bash
# find ./ -type f -printf '%s %p\n' | sort -nr | head -30
# find ./ -type f -printf '%s %p\n' | sort -nr | head -30 | awk '{printf "%s %s\n", $1, $2}' | numfmt --to=iec --field=1 | sort -hr

find ./ -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -printf '%s %p\n' | sort -nr | head -30 | awk '{printf "%s %s\n", $1, $2}' | numfmt --to=iec --field=1 | sort -hr