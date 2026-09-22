#!/bin/bash
# Script to download sv-issa.org website for Hugo conversion
# Location: bin/download-website.sh

# Configuration
SOURCE_URL="https://sv-issa.org"
TARGET_DIR="old-website"

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Download with wget - mirror entire site
wget --convert-links --no-parent --page-requisites --adjust-extension \
     --no-host-directories --restrict-file-names=ascii \
     --recursive --level=infinity --wait=1 --tries=3 \
     -P "$TARGET_DIR" "$SOURCE_URL"

echo "Download complete! Content saved to $TARGET_DIR"
echo "Note: All files including CSS, JS, and images have been downloaded."
echo "CSS and JS files will not be used in the Hugo conversion process."