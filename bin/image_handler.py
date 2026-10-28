#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import shutil
import re
from urllib.parse import urljoin
from .security_utils import (
    safe_join,
    is_within_directory,
    read_file_safely,
    MAX_FILE_SIZE
)

# Add current directory to path for relative imports
import sys
if __name__ == '__main__':
    sys.path.insert(0, os.path.dirname(__file__))

def copy_images(html_dir, content_dir, static_dir):
    """Copy images from old website to static/images and update references"""

    # Get all HTML files
    html_files = [f for f in os.listdir(html_dir) if f.endswith('.html') and 'past?page' not in f and 'upcoming.html' not in f]

    image_map = {}

    for html_file in html_files:
        html_path = safe_join(html_dir, html_file)

        try:
            content = read_file_safely(html_path)

            # Use BeautifulSoup for safer HTML parsing
            try:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(content, 'html.parser')
                img_tags = soup.find_all('img')
                img_urls = [tag.get('src') for tag in img_tags]
            except ImportError:
                # Fallback to regex if BeautifulSoup not available
                img_urls = re.findall(r'src="([^"]*)"', content)

            for old_url in img_urls:
                if old_url and old_url.startswith('../'):
                    image_name = old_url.split('/')[-1]

                    if image_name not in image_map:
                        try:
                            # Validate old path is within html_dir
                            old_path = safe_join(html_dir, old_url)
                            if not is_within_directory(old_path, html_dir):
                                print(f'WARNING: Path outside allowed directory: {old_path}')
                                continue

                            new_path = safe_join(static_dir, os.path.join('images', image_name))

                            if os.path.exists(old_path):
                                os.makedirs(os.path.dirname(new_path), exist_ok=True)
                                shutil.copy2(old_path, new_path)
                                image_map[image_name] = old_url
                        except (ValueError, OSError) as e:
                            print(f'WARNING: Error processing image {old_url}: {e}')
                            continue

        except (FileNotFoundError, PermissionError, ValueError, OSError) as e:
            print(f'WARNING: Error processing file {html_path}: {e}')
            continue

    return image_map

def update_markdown_references(content_dir, image_map):
    """Update markdown file references to use static/images paths"""
    markdown_files = [f for f in os.listdir(content_dir) if f.endswith('.md')]

    for md_file in markdown_files:
        md_path = safe_join(content_dir, md_file)

        try:
            content = read_file_safely(md_path)

            for old_url, new_url in image_map.items():
                content = content.replace(new_url, f"/images/{old_url.split('/')[-1]}")

            # Write back with proper error handling
            with open(md_path, 'w', encoding='utf-8') as f:
                f.write(content)

        except (FileNotFoundError, PermissionError, ValueError, OSError) as e:
            print(f'WARNING: Error updating reference in {md_path}: {e}')
            continue

    return len(markdown_files)