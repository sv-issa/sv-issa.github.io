#!/bin/bash

# Playwright installation script
# Installs system dependencies and browser binaries for Playwright

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}Installing Playwright...${NC}"

# Ensure curl is available
if ! command -v curl &> /dev/null; then
  echo "Installing curl..."
  if command -v sudo &> /dev/null; then
    sudo apt-get update && sudo apt-get install -y curl
  else
    apt-get update && apt-get install -y curl
  fi
fi

# Install system dependencies for Chromium
echo "Installing Playwright system dependencies..."
if command -v sudo &> /dev/null; then
  sudo npx playwright install-deps chromium
else
  npx playwright install-deps chromium
fi

# Install browser binaries
echo "Installing Chromium browser..."
if command -v sudo &> /dev/null; then
  sudo npx playwright install chromium
else
  npx playwright install chromium
fi

# Verify installation
echo -e "\n${BLUE}Verifying installation...${NC}"
BROWSER_PATH="$HOME/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell"
if ls $BROWSER_PATH &> /dev/null; then
  echo -e "${GREEN}✓ Chromium browser installed${NC}"
else
  echo -e "${RED}✗ Chromium browser not found${NC}"
  exit 1
fi

PKG_VERSION=$(node -p "require('@playwright/test/package.json').version" 2>/dev/null || echo "unknown")
echo -e "${GREEN}✓ @playwright/test@${PKG_VERSION} is installed${NC}"

echo -e "\n${GREEN}✓ Playwright installation complete!${NC}"
