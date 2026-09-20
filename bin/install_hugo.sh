#!/bin/bash

# Hugo installation script
# Downloads and installs Hugo extended binaries from GitHub releases

set -e

# Configuration
HUGO_VERSION="0.166.0"
DOWNLOAD_URL="https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb"
INSTALL_DIR="bin"
DEB_FILE="${INSTALL_DIR}/hugo_extended_${HUGO_VERSION}_linux-amd64.deb"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Installing Hugo ${HUGO_VERSION}...${NC}"

# Create bin directory if it doesn't exist
if [ ! -d "${INSTALL_DIR}" ]; then
    echo "Creating ${INSTALL_DIR} directory..."
    mkdir -p "${INSTALL_DIR}"
fi

# Download the .deb package
echo "Downloading Hugo package from ${DOWNLOAD_URL}..."
if command -v curl &> /dev/null; then
    curl -L -o "${DEB_FILE}" "${DOWNLOAD_URL}"
elif command -v wget &> /dev/null; then
    wget -O "${DEB_FILE}" "${DOWNLOAD_URL}"
else
    echo "Error: Neither curl nor wget is available. Please install one of them."
    exit 1
fi

# Check if download was successful
if [ ! -f "${DEB_FILE}" ]; then
    echo "Error: Failed to download the Hugo package."
    exit 1
fi

# Install the .deb package
echo "Installing Hugo package..."
sudo dpkg -i "${DEB_FILE}"

# Fix missing dependencies if any (using apt-get)
echo "Fixing dependencies..."
sudo apt-get install -f -y

# Move the .deb file to trash or remove if needed
echo "Cleaning up..."
rm "${DEB_FILE}"

# Check if Hugo is installed and add to PATH if needed
if command -v hugo &> /dev/null; then
    echo -e "${GREEN}✓ Hugo has been successfully installed!${NC}"
    echo "Hugo version:"
    hugo version
else
    echo -e "${BLUE}Note: Hugo binary not found in PATH. Make sure to add ${INSTALL_DIR} to your PATH.${NC}"
    echo "Example: export PATH=\"${PWD}/${INSTALL_DIR}:\$PATH\""
fi

# Test the installation
echo -e "\n${BLUE}Testing installation...${NC}"
if hugo version &> /dev/null; then
    echo -e "${GREEN}✓ Installation test successful!${NC}"
else
    echo -e "${YELLOW}⚠ Installation completed but Hugo is not in PATH yet.${NC}"
    echo "To add it to your PATH, run:"
    echo "  export PATH=\"${PWD}/${INSTALL_DIR}:\$PATH\""
fi