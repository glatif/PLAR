#!/bin/zsh
# Builds the shareable PDFs with the design-system print stylesheet and cover pages.
# Usage: assets/build-pdf.sh   (run from anywhere)
set -e
DOCS="$(cd "$(dirname "$0")/.." && pwd)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

build() { # $1 source md, $2 cover html, $3 output pdf
  # <base> makes relative image paths (assets/images/...) resolve against the docs folder
  print "<base href=\"file://$DOCS/\">" > "$WORK/base.html"
  pandoc "$DOCS/$1" -f gfm -t html5 -s --metadata pagetitle="PLAR" -H "$WORK/base.html" \
    --css "file://$DOCS/assets/print.css" -B "$DOCS/assets/covers/$2" -o "$WORK/out.html"
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=10000 \
    --print-to-pdf="$DOCS/pdf/$3" "file://$WORK/out.html" 2>/dev/null
  echo "Built pdf/$3"
}

mkdir -p "$DOCS/pdf"
build 13-features.md features.html 13-features.pdf
build 14-design-system.md design-system.html 14-design-system.pdf
