#!/bin/sh
# Test-Stub: kopiert die Eingabe (-i <in>) auf die Zieldatei (letztes Argument)
in=""; prev=""; out=""
for a in "$@"; do
  [ "$prev" = "-i" ] && in="$a"
  prev="$a"; out="$a"
done
cp "$in" "$out"
