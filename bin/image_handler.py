#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import shutil
from urllib.parse import urljoin

def copy_images(html_dir, content_dir, static_dir):
    """Copy images from old website to static/images and update references"""
    
    # Get all HTML files
    html_files = [f for f in os.listdir(html_dir) if f.endswith('.html') and 'past?page' not in f and 'upcoming.html' not in f]
    
    image_map = {}
    
    for html_file in html_files:
        html_path = os.path.join(html_dir, html_file)
        
        with open(html_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Find image URLs
        img_urls = re.findall(r'src="([^"]*)"', content)
        
        for old_url in img_urls:
            if old_url.startswith('../'):
                image_name = old_url.split('/')[-1]
                
                if image_name not in image_map:
                    old_path = os.path.join(html_dir, '..', old_url)
                    new_path = os.path.join(static_dir, 'images', image_name)
                    
                    if os.path.exists(old_path):
                        os.makedirs(os.path.dirname(new_path), exist_ok=True)
                        shutil.copy2(old_path, new_path)
                        image_map[image_name] = old_url
    
    return image_map

def update_markdown_references(content_dir, image_map):
    """Update markdown file references to use static/images paths"""
    markdown_files = [f for f in os.listdir(content_dir) if f.endswith('.md')]
    
    for md_file in markdown_files:
        md_path = os.path.join(content_dir, md_file)
        
        with open(md_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        for old_url, new_url in image_map.items():
            content = content.replace(new_url, f"/images/{old_url.split('/')[-1]}")
        
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(content)
    
    return len(markdown_files)

import re