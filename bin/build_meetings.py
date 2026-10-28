#!/usr/bin/env python3
"""Convert old-website meeting HTML files into Hugo content/meetings/*.md
files matching the frontmatter shape used by the theme and archetype."""
import glob
import os
import re
import shutil
import sys
from datetime import datetime, timezone
from urllib.parse import unquote

import yaml

sys.path.insert(0, os.path.dirname(__file__))
from parse_meeting import (  # noqa: E402
    parse_meeting, local_image_basename, extract_event_time_end,
    title_case_from_slug,
)
from .security_utils import (
    safe_join,
    is_within_directory,
    validate_file_size,
    read_file_safely,
    sanitize_html_content,
    is_allowed_file_extension
)

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HTML_DIR = os.path.join(REPO_ROOT, 'old-website', 'meetings')
CONTENT_DIR = os.path.join(REPO_ROOT, 'content', 'meetings')
OLD_FILES_DIR = os.path.join(REPO_ROOT, 'old-website', 'sites', 'sv-issa.org', 'files')
STATIC_IMAGES_DIR = os.path.join(REPO_ROOT, 'static', 'images')

SKIP_FILES = {
    'past.html', 'upcoming.html',
    # Already exists as a manually curated Hugo file with extra data
    # (a second sponsor and a speaker LinkedIn link) that isn't present in
    # the raw HTML source; leave it untouched rather than regenerate it.
    'october-2025-event-alien-ai-horizon-navigating-genai-security-2025.html',
}


def copy_image(src_url):
    """Copy a referenced old-site image into static/images and return its
    new site-relative path, or None if the image can't be found."""
    basename = local_image_basename(src_url)
    if not basename:
        return None
    basename = unquote(basename)

    try:
        # Validate source path is within OLD_FILES_DIR
        src_path = safe_join(OLD_FILES_DIR, basename)
        if not is_within_directory(src_path, OLD_FILES_DIR):
            print(f'WARNING: Path outside allowed directory: {src_path}')
            return None

        if not os.path.isfile(src_path):
            return None

        # Validate file size
        validate_file_size(src_path)

        # spaces in a URL path require escaping everywhere they're used, so
        # normalize them out of the copied filename instead
        safe_basename = basename.replace(' ', '-')
        dest_path = safe_join(STATIC_IMAGES_DIR, safe_basename)

        os.makedirs(STATIC_IMAGES_DIR, exist_ok=True)
        if not os.path.exists(dest_path):
            shutil.copy2(src_path, dest_path)

        return f'/images/{safe_basename}'

    except (ValueError, OSError) as e:
        print(f'WARNING: Error copying image {src_url}: {e}')
        return None


def yaml_str(value):
    """Wrap a plain YAML scalar so PyYAML never picks block/folded style,
    matching the reference file's inline formatting."""
    return value


def build_frontmatter(data, html_filename):
    title = data['title'] or title_case_from_slug(html_filename.replace('.html', ''))

    published = data.get('published_time') or ''
    try:
        date_obj = datetime.fromisoformat(published) if published else datetime.now(timezone.utc)
    except ValueError:
        date_obj = datetime.now(timezone.utc)

    params = {}
    if data['event_date']:
        params['event_date'] = data['event_date']
    if data['event_time_start']:
        params['event_time_start'] = data['event_time_start']

    time_end = extract_event_time_end(
        data['body_markdown'], data['event_time_start'][-2:] if data['event_time_start'] else ''
    )
    params['event_time_end'] = time_end or '8:00pm'

    if data['rsvp_url']:
        params['event_rsvp_url'] = data['rsvp_url']

    if data['location_name']:
        params['event_location'] = data['location_name']
        if data['location_address']:
            params['event_address'] = data['location_address']

    if data['sponsors']:
        sponsors_out = []
        for sp in data['sponsors']:
            entry = {'name': sp['name'], 'link': sp['link']}
            logo = copy_image(sp['logo_src'])
            if logo:
                entry['logo'] = logo
            sponsors_out.append(entry)
        params['event_sponsors'] = sponsors_out

    if data['speakers']:
        speakers_out = []
        for sp in data['speakers']:
            entry = {'name': sp['name']}
            if sp.get('title'):
                entry['title'] = sp['title']
            image_src = sp.get('image_src')
            if image_src:
                img = copy_image(image_src)
                if img:
                    entry['image'] = img
            if sp.get('description'):
                desc = sp['description']
                # re-attach the name when the description is a continuation
                # sentence missing its subject (e.g. "is a trailblazer...")
                if re.match(r'^(is|was|has|have)\b', desc):
                    desc = f"{entry['name']} {desc}"
                entry['description'] = desc
            speakers_out.append(entry)
        params['event_speakers'] = speakers_out

    frontmatter = {
        'title': title,
        'draft': False,
        'date': date_obj,
        'layout': 'meetings',
        'params': params,
    }
    return frontmatter


class InlineDumper(yaml.SafeDumper):
    pass


def represent_str(dumper, data):
    if '\n' in data:
        return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='|')
    return dumper.represent_scalar('tag:yaml.org,2002:str', data)


InlineDumper.add_representer(str, represent_str)


def dump_frontmatter(frontmatter):
    text = yaml.dump(
        frontmatter, Dumper=InlineDumper, default_flow_style=False,
        allow_unicode=True, sort_keys=False, width=100000,
    )
    return text


def convert_file(html_path):
    try:
        data = parse_meeting(html_path)
    except (ValueError, OSError) as e:
        print(f'ERROR processing {html_path}: {e}')
        return False

    if not data or not data.get('title'):
        print(f'SKIP (no title): {html_path}')
        return False

    html_filename = os.path.basename(html_path)
    md_filename = html_filename.replace('.html', '.md')
    md_path = safe_join(CONTENT_DIR, md_filename)

    try:
        frontmatter = build_frontmatter(data, html_filename)
        fm_text = dump_frontmatter(frontmatter)

        body = data['body_markdown'].strip()
        content = f'---\n{fm_text}---\n\n{body}\n'

        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Wrote: {md_path}')
        return True

    except (FileNotFoundError, PermissionError, ValueError, OSError) as e:
        print(f'ERROR writing {md_path}: {e}')
        return False


def main():
    try:
        os.makedirs(CONTENT_DIR, exist_ok=True)
    except (OSError, PermissionError) as e:
        print(f'ERROR: Cannot create content directory {CONTENT_DIR}: {e}')
        return

    html_files = sorted(glob.glob(os.path.join(HTML_DIR, '*.html')))
    converted = 0
    for html_path in html_files:
        try:
            # Validate path is within HTML_DIR
            html_path = safe_join(HTML_DIR, html_path)
            if not is_within_directory(html_path, HTML_DIR):
                print(f'WARNING: Path outside allowed directory: {html_path}')
                continue

            base = os.path.basename(html_path)
            if base in SKIP_FILES or 'page=' in base:
                continue
            if convert_file(html_path):
                converted += 1
        except (ValueError, OSError) as e:
            print(f'WARNING: Error processing {html_path}: {e}')
            continue

    print(f'\nConverted {converted} files.')


if __name__ == '__main__':
    main()
