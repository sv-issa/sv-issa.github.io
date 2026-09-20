#!/bin/bash

# Hugo installation test script
# Verifies that Hugo is correctly installed and accessible

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Testing Hugo installation...${NC}"

# Test 1: Check if hugo command exists
echo "Test 1: Checking if hugo command exists..."
if command -v hugo &> /dev/null; then
    echo -e "${GREEN}✓ Hugo command found in PATH${NC}"
else
    echo -e "${RED}✗ Hugo command not found in PATH${NC}"
    exit 1
fi

# Test 2: Check Hugo version
echo -e "\nTest 2: Checking Hugo version..."
EXPECTED_VERSION="0.166.0"
HUGO_VERSION=$(hugo version | grep -oP 'v\d+\.\d+\.\d+' | grep -oP '\d+\.\d+\.\d+')

if [ "$HUGO_VERSION" = "$EXPECTED_VERSION" ]; then
    echo -e "${GREEN}✓ Hugo version matches expected version ${EXPECTED_VERSION}${NC}"
else
    echo -e "${RED}✗ Hugo version mismatch! Expected: ${EXPECTED_VERSION}, Got: ${HUGO_VERSION}${NC}"
    exit 1
fi

# Test 3: Verify it's the extended version
echo -e "\nTest 3: Verifying Hugo extended version..."
if hugo version | grep -q "extended"; then
    echo -e "${GREEN}✓ Hugo extended version confirmed${NC}"
else
    echo -e "${RED}✗ Hugo extended version not found${NC}"
    exit 1
fi

# Test 4: Check if hugo can be run in the project directory
echo -e "\nTest 4: Testing Hugo in project directory..."
cd /home/user/opt/sv-issa.github.io
if hugo version &> /dev/null; then
    echo -e "${GREEN}✓ Hugo can be run in project directory${NC}"
else
    echo -e "${RED}✗ Hugo cannot be run in project directory${NC}"
    exit 1
fi

# Test 5: Test building the site
echo -e "\nTest 5: Testing Hugo build..."
if hugo --quiet version > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Hugo build test successful${NC}"
else
    echo -e "${RED}✗ Hugo build test failed${NC}"
    exit 1
fi

echo -e "\n${GREEN}✓ All tests passed! Hugo is correctly installed and functional.${NC}"