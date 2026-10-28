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

# Skip if already installed with matching version
if hugo version &> /dev/null 2>&1; then
  INSTALLED=$(hugo version | grep -oP '\d+\.\d+\.\d+')
  if [ "$INSTALLED" = "$HUGO_VERSION" ]; then
    echo -e "${GREEN}✓ Hugo ${HUGO_VERSION} is already installed.${NC}"
    exit 0
  fi
fi

# Ensure download dependencies are available
if ! command -v curl &> /dev/null; then
  echo "Installing curl..."
  if command -v sudo &> /dev/null; then
    sudo apt-get update && sudo apt-get install -y curl
  else
    apt-get update && apt-get install -y curl
  fi
fi

# Create bin directory if it doesn't exist
if [ ! -d "${INSTALL_DIR}" ]; then
    echo "Creating ${INSTALL_DIR} directory..."
    mkdir -p "${INSTALL_DIR}"
fi

# Download the .deb package
echo "Downloading Hugo package from ${DOWNLOAD_URL}..."
curl -L -o "${DEB_FILE}" "${DOWNLOAD_URL}"

# Check if download was successful
if [ ! -f "${DEB_FILE}" ]; then
    echo "Error: Failed to download the Hugo package."
    exit 1
fi

# Helper: run a command, using sudo if available
run_with_sudo() {
  if command -v sudo &> /dev/null; then
    sudo "$@"
  else
    "$@"
  fi
}

# Install the .deb package
echo "Installing Hugo package..."
run_with_sudo dpkg -i "${DEB_FILE}"

# Fix missing dependencies if any (using apt-get)
echo "Fixing dependencies..."
run_with_sudo apt-get install -f -y

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