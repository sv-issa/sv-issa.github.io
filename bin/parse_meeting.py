#!/usr/bin/env python3
"""Parse a single old-website meeting HTML file into a structured dict."""
import re
import sys
from urllib.parse import unquote
from bs4 import BeautifulSoup, NavigableString, Tag
from markdownify import markdownify as md

# Import security utilities
sys.path.insert(0, os.path.dirname(__file__))
from .security_utils import (
    safe_join,
    validate_file_size,
    read_file_safely,
    sanitize_html_content
)

ZWSP = '\u200b'

STOPWORDS = {
    'a', 'an', 'the', 'and', 'or', 'but', 'for', 'nor', 'on', 'at', 'to',
    'from', 'by', 'of', 'in', 'up', 'as', 'is', 'vs', 'with', 'is',
}


def title_case_from_slug(slug):
    words = slug.replace('-', ' ').split()
    out = []
    for i, w in enumerate(words):
        lw = w.lower()
        if i != 0 and i != len(words) - 1 and lw in STOPWORDS:
            out.append(lw)
        else:
            out.append(lw[:1].upper() + lw[1:])
    return ' '.join(out)


def clean_text(s):
    if s is None:
        return ''
    s = s.replace(ZWSP, ' ')
    s = re.sub(r'\xa0', ' ', s)
    s = re.sub(r'[ \t]+', ' ', s)
    s = s.strip()
    return s


def strip_query(url):
    if not url:
        return url
    return url.split('?')[0]


def local_image_basename(src):
    if not src:
        return None
    src = unquote(src)
    return src.rsplit('/', 1)[-1]


def html_fragment_to_markdown(tag):
    if tag is None:
        return ''
    html_str = str(tag)
    text = md(html_str, heading_style='ATX', bullets='-')
    text = text.replace(ZWSP, ' ')
    text = re.sub(r'[ \t]+', ' ', text)
    # collapse 3+ blank lines to 2 (one blank line)
    text = re.sub(r'\n{3,}', '\n\n', text)
    # a stray leading/trailing space per line is never semantically
    # meaningful in the source content, so it is safe to strip
    text = '\n'.join(line.strip() for line in text.split('\n'))
    return text.strip() + '\n'


def is_blank_p(tag):
    if not isinstance(tag, Tag):
        return False
    text = clean_text(tag.get_text())
    return text == ''


def is_sponsor_heading(tag):
    if not isinstance(tag, Tag):
        return False
    text = clean_text(tag.get_text()).rstrip(':').strip().lower()
    return text in ('sponsor', 'sponsors')


def extract_sponsors(body_item):
    """Find <a><img></a> sponsor logo blocks inside the body field-item.
    Returns (sponsors_list, set_of_tags_to_remove)."""
    sponsors = []
    to_remove = []
    for a in body_item.find_all('a'):
        img = a.find('img')
        if not img:
            continue
        src = img.get('src', '')
        if 'sites/sv-issa.org/files' not in src:
            continue
        name = clean_text(img.get('alt', '')) or clean_text(a.get_text())
        if not name:
            base = local_image_basename(src)
            name = base.rsplit('.', 1)[0].replace('-', ' ').replace('_', ' ').title() if base else 'Sponsor'
        # alt text commonly reads "X Logo"; the word "Logo" isn't part of
        # the sponsor's actual name
        name = re.sub(r'\s+Logo$', '', name, flags=re.IGNORECASE).strip()
        sponsors.append({
            'name': name,
            'link': a.get('href', ''),
            'logo_src': src,
        })
        # mark containing <p> for removal
        parent = a.find_parent('p') or a
        to_remove.append(parent)
    return sponsors, to_remove


def remove_sponsor_scaffolding(body_item, remove_tags):
    for t in remove_tags:
        if isinstance(t, Tag):
            t.decompose()
    # remove now-blank <p> and sponsor heading paragraphs
    for p in body_item.find_all('p'):
        if is_blank_p(p) or is_sponsor_heading(p):
            p.decompose()
    # remove sponsor section headings (h1-h6) left with no following
    # content, e.g. "<h2>Sponsors</h2>" as the very last element
    for heading in body_item.find_all(re.compile(r'^h[1-6]$')):
        if is_sponsor_heading(heading) and heading.find_next_sibling() is None:
            heading.decompose()
    # drop a trailing <hr> that only served to separate the sponsors section
    children = [c for c in body_item.children if isinstance(c, Tag)]
    if children and children[-1].name == 'hr':
        children[-1].decompose()


def parse_location(location_item):
    """Return (name, address) from a field-name-field-meeting-location field-item div."""
    if location_item is None:
        return '', ''
    # remove iframes (maps embeds)
    for iframe in location_item.find_all('iframe'):
        iframe.decompose()

    # Case: jsx div structure with fw-medium (name) and text-tinted (address)
    name_div = location_item.find('div', class_=re.compile(r'fw-medium'))
    if name_div:
        name = clean_text(name_div.get_text())
        addr_div = location_item.find('div', class_=re.compile(r'text-tinted'))
        addr = clean_text(addr_div.get_text()) if addr_div else ''
        return name, addr

    # Generic: gather text lines split by <br> and <p> boundaries
    lines = []
    for p in location_item.find_all(['p', 'div'], recursive=True):
        if p.find(['p', 'div']):
            continue  # only leaf-level blocks
        # split on <br>
        parts = re.split(r'<br\s*/?>', str(p))
        for part in parts:
            frag = BeautifulSoup(part, 'lxml')
            text = clean_text(frag.get_text())
            if text:
                lines.append(text.rstrip(','))
    if not lines:
        text = clean_text(location_item.get_text()).rstrip(',')
        return text, ''

    if len(lines) == 1:
        # A single line like "NetApp, 3060 Olsen Dr, San Jose, CA 95128,
        # USA" packs the venue name and street address together; split at
        # the first comma so it matches the two-field name/address shape
        # used everywhere else.
        line = lines[0]
        m = re.match(r'^([^,]+),\s*(\d.+)$', line)
        if m:
            return m.group(1).strip(), m.group(2).strip()
        return line, ''
    return lines[0], ', '.join(lines[1:])


def is_name_like(text):
    words = text.split()
    if not (1 <= len(words) <= 6):
        return False
    if text.endswith('.') and not re.match(r'^(Dr|Mr|Mrs|Ms)\.', text):
        return False
    if len(text) > 45:
        return False
    if '|' in text:
        # titles/roles in this dataset use '|' as a separator (e.g. "Deputy
        # CISO | Moderna"); real names never contain a pipe character
        return False
    return True


def is_title_like(text):
    """Heuristic: a job-title/role line, e.g. 'CISO, SPLX.AI' or 'Founder & CEO, Hacker Valley Media'."""
    if len(text) > 140:
        return False
    if re.search(r'[.!?]$', text) and not re.match(r'^(Dr|Mr|Mrs|Ms)\.', text):
        # sentences ending in punctuation are unlikely to be titles, unless
        # it's just an abbreviation
        return False
    return True


ROLE_KEYWORDS = (
    'ceo', 'cto', 'ciso', 'cio', 'cfo', 'coo', 'vp', 'vice president',
    'president', 'founder', 'co-founder', 'chief', 'director', 'officer',
    'manager', 'evangelist', 'professor', 'engineer', 'analyst',
    'consultant', 'strategist', 'coach', 'scientist', 'journalist',
    'agent', 'partner', 'principal', 'advisor', 'expert', 'specialist',
    'head of', 'lead', 'moderator', 'panelist',
)


def looks_like_role(text):
    """Positive signal that a short line is a job title/role rather than a
    person's name, even when it doesn't contain the usual comma/pipe/&
    separators (e.g. 'Cyber Threat Intelligence Expert')."""
    lower = text.lower()
    if any(sep in text for sep in (',', '|', '&')) or ' of ' in lower or ' at ' in lower:
        return True
    return any(kw in lower for kw in ROLE_KEYWORDS)


def paragraph_to_lines(p_tag):
    """Split a <p> into a list of (text, candidate) line records.
    candidate=True means the line is eligible to start a new speaker segment.
    If the paragraph begins with a bold run, the bold text becomes its own
    candidate line (the name), and any remaining text on the same visual
    line becomes a separate non-candidate line (typically a title)."""
    p_copy = BeautifulSoup(str(p_tag), 'lxml').find('p') or BeautifulSoup(str(p_tag), 'lxml')
    for img in p_copy.find_all('img'):
        img.decompose()

    children = list(p_copy.children)
    first_real = None
    for c in children:
        if isinstance(c, NavigableString) and not str(c).strip():
            continue
        first_real = c
        break

    lines = []
    if isinstance(first_real, Tag) and first_real.name in ('strong', 'b'):
        bold_text = clean_text(first_real.get_text())
        html_str = str(p_copy)
        parts = re.split(r'<br\s*/?>', html_str)
        first_seg = BeautifulSoup(parts[0], 'lxml')
        for b in first_seg.find_all(['strong', 'b']):
            b.decompose()
        remainder = clean_text(first_seg.get_text())
        if bold_text:
            lines.append((bold_text, True))
        if remainder:
            lines.append((remainder, False))
        for part in parts[1:]:
            frag = BeautifulSoup(part, 'lxml')
            text = clean_text(frag.get_text())
            if text:
                lines.append((text, False))
    else:
        html_str = str(p_copy)
        parts = re.split(r'<br\s*/?>', html_str)
        for idx, part in enumerate(parts):
            frag = BeautifulSoup(part, 'lxml')
            text = clean_text(frag.get_text())
            if not text:
                continue
            if idx == 0:
                name, rest = split_narrative_name(text)
                if name and rest != name:
                    lines.append((name, True))
                    lines.append((rest, False))
                    continue
            lines.append((text, idx == 0))
    return lines


def names_overlap(a, b):
    aw = set(w.lower() for w in re.findall(r"[A-Za-z']+", a))
    bw = set(w.lower() for w in re.findall(r"[A-Za-z']+", b))
    return bool(aw & bw)


def flatten_speaker_lines(speaker_item):
    """Walk the top-level blocks of the speaker field-item in document order,
    producing (text, candidate) line records, plus a list of (index_before,
    src) markers recording where each <img> appeared relative to the
    produced lines. <li> bullets are never candidates. A lone
    <img alt="Name"> paragraph yields a candidate name line so image-only
    speaker headers are still recognized, unless the very next candidate
    line is a fuller version of the same name (duplicate), in which case
    the image-alt line is dropped and the image is attached to that line."""
    lines = []
    img_markers = []  # (line_index, src) pairs, referring to the index in `lines` the image precedes

    for block in speaker_item.find_all(recursive=False):
        if block.name == 'p':
            imgs = block.find_all('img')
            block_lines = paragraph_to_lines(block)
            if not block_lines:
                alt = clean_text(imgs[0].get('alt', '')) if imgs else ''
                if alt:
                    lines.append((alt, True))
                    if imgs and imgs[0].get('src'):
                        img_markers.append((len(lines) - 1, imgs[0]['src']))
                continue
            start_idx = len(lines)
            lines.extend(block_lines)
            for img in imgs:
                if img.get('src'):
                    img_markers.append((start_idx, img['src']))
        elif block.name in ('ul', 'ol'):
            for li in block.find_all('li', recursive=False):
                text = clean_text(li.get_text())
                if text:
                    lines.append((text, False))

    # Deduplicate: an image-alt-only name line immediately followed by a
    # fuller candidate name line referring to the same person.
    deduped = []
    marker_map = {}
    for idx, src in img_markers:
        marker_map.setdefault(idx, []).append(src)

    skip_next_marker_transfer = {}
    i = 0
    while i < len(lines):
        text, candidate = lines[i]
        if (candidate and i in marker_map and i + 1 < len(lines)
                and lines[i + 1][1] and is_name_like(lines[i + 1][0])
                and names_overlap(text, lines[i + 1][0])):
            # drop this alt-only line, move its image marker to the next line
            skip_next_marker_transfer[i + 1] = marker_map[i]
            i += 1
            continue
        deduped.append((text, candidate))
        i += 1

    # Rebuild marker map against the deduped list positions
    new_lines = []
    new_markers = {}
    old_to_new = {}
    j = 0
    i = 0
    while i < len(lines):
        text, candidate = lines[i]
        if (candidate and i in marker_map and i + 1 < len(lines)
                and lines[i + 1][1] and is_name_like(lines[i + 1][0])
                and names_overlap(text, lines[i + 1][0])):
            i += 1
            continue
        old_to_new[i] = j
        new_lines.append((text, candidate))
        j += 1
        i += 1

    for idx, srcs in marker_map.items():
        target = idx
        if idx in skip_next_marker_transfer:
            continue
        if target in old_to_new:
            new_markers.setdefault(old_to_new[target], []).extend(srcs)
    for target_idx, srcs in skip_next_marker_transfer.items():
        if target_idx in old_to_new:
            new_markers.setdefault(old_to_new[target_idx], []).extend(srcs)

    return new_lines, new_markers


NARRATIVE_NAME_RE = re.compile(
    r'^((?:Dr\.\s+)?[A-Z][\w.\'-]*(?:\s+[A-Z][\w.\'-]*){1,4})\s+'
    r'(?:is|was)\b'
)

PRONOUNS = {
    'he', 'she', 'they', 'it', 'this', 'that', 'the', 'his', 'her',
    'their', 'we', 'you', 'i',
}


def split_narrative_name(text):
    """For a speaker paragraph with no bold markup at all (name and bio run
    together as plain prose, e.g. 'M.K. Palmore is a seasoned...'), pull the
    leading name out and return (name, remaining_text). Returns (None, text)
    if no leading name could be confidently identified. Requires a
    multi-word proper name immediately followed by 'is'/'was' (never
    matching narrower continuation phrasing like 'He has' or 'Kay also',
    which would otherwise misfire on later paragraphs about the same
    person)."""
    m = NARRATIVE_NAME_RE.match(text)
    if not m:
        return None, text
    name = m.group(1).strip()
    if name.split()[0].lower() in PRONOUNS:
        return None, text
    if not is_name_like(name):
        return None, text
    # keep the verb ("is"/"was") that follows the name as part of the
    # remaining description text, since it's the start of the sentence
    verb_start = len(name)
    remainder = text[verb_start:].strip()
    return name, remainder


def segment_speakers(lines, img_markers=None):
    """Segment flattened lines into speaker dicts: name/title/description.
    Only candidate lines can start a new speaker segment. img_markers maps
    a line index to a list of image srcs anchored at that line; the first
    marker found within a speaker's own span of lines is attached as its
    photo."""
    img_markers = img_markers or {}
    speakers = []
    i = 0
    n = len(lines)
    while i < n:
        text, candidate = lines[i]
        if candidate and is_name_like(text):
            name = text.lstrip('*').strip()
            title = ''
            desc_lines = []
            span_start = i
            j = i + 1
            if j < n:
                nxt_text, nxt_candidate = lines[j]
                # A non-candidate line right after a name (same paragraph,
                # e.g. bold name + "<br>Title" on one <p>) is always a
                # title. A candidate line (its own <p>) is only treated as
                # a title if it reads like one and not like another name.
                if not nxt_candidate and is_title_like(nxt_text):
                    title = nxt_text
                    j += 1
                elif nxt_candidate and is_title_like(nxt_text) and (
                        looks_like_role(nxt_text) or not is_name_like(nxt_text)):
                    title = nxt_text
                    j += 1
            while j < n and not (lines[j][1] and is_name_like(lines[j][0])):
                desc_lines.append(lines[j][0])
                j += 1
            speaker = {
                'name': name,
                'title': title,
                'description': '\n\n'.join(desc_lines).strip(),
            }
            for k in range(span_start, j):
                if k in img_markers:
                    speaker['image_src'] = img_markers[k][0]
                    break
            speakers.append(speaker)
            i = j
        else:
            if speakers:
                if speakers[-1]['description']:
                    speakers[-1]['description'] += '\n\n' + text
                else:
                    speakers[-1]['description'] = text
            else:
                speakers.append({'name': text, 'title': '', 'description': ''})
            i += 1

    # A speaker segment with no title and no description is very likely a
    # stray photo caption (e.g. a mislabeled alt attribute) rather than a
    # distinct person; fold it into the speaker that immediately follows,
    # keeping that speaker's image if it doesn't already have one.
    merged = []
    for idx, sp in enumerate(speakers):
        if (not sp['title'] and not sp['description'] and idx + 1 < len(speakers)):
            nxt = speakers[idx + 1]
            if 'image_src' in sp and 'image_src' not in nxt:
                nxt['image_src'] = sp['image_src']
            continue
        merged.append(sp)

    # Consecutive segments sharing the exact same name are the same person
    # split across two paragraphs (e.g. a bold "Name<br>Title" paragraph
    # followed by a separate narrative-prose paragraph starting with the
    # same name again); combine them into a single speaker entry.
    combined = []
    for sp in merged:
        if combined and (combined[-1]['name'] == sp['name']
                          or names_overlap(combined[-1]['name'], sp['name'])):
            prev = combined[-1]
            prev['title'] = prev['title'] or sp['title']
            if sp['description']:
                prev['description'] = (
                    (prev['description'] + '\n\n' + sp['description']).strip()
                    if prev['description'] else sp['description']
                )
            if 'image_src' in sp and 'image_src' not in prev:
                prev['image_src'] = sp['image_src']
            continue
        combined.append(sp)
    return combined


TIME_RANGE_RE = re.compile(
    r'(\d{1,2}:\d{2})\s*(AM|PM|am|pm)?\s*[-–—]\s*(\d{1,2}:\d{2})\s*(AM|PM|am|pm)?'
)


def extract_event_time_end(body_markdown, start_suffix):
    """Find the last "H:MM - H:MM [AM/PM]" style range in the agenda text
    and return its end time, inferring AM/PM from the range itself or
    falling back to the event's start-time suffix."""
    matches = list(TIME_RANGE_RE.finditer(body_markdown))
    if not matches:
        return ''
    m = matches[-1]
    end_time, end_suffix, start_time_alt = m.group(3), m.group(4), m.group(2)
    suffix = end_suffix or start_time_alt or start_suffix
    if not suffix:
        return end_time
    return f'{end_time}{suffix.lower()}'


def parse_meeting(html_path):
    try:
        # Use secure file reading
        content = read_file_safely(html_path)

        # Use BeautifulSoup with safe HTML sanitization
        soup = BeautifulSoup(content, 'lxml')

        # Sanitize HTML content to remove potentially dangerous elements
        content = sanitize_html_content(content)
        soup = BeautifulSoup(content, 'lxml')
    except (ValueError, PermissionError, OSError) as e:
        print(f'ERROR: Failed to read or sanitize file {html_path}: {e}')
        return None
    article = soup.find('article')
    if article is None:
        return None

    result = {}

    title_span = soup.find('span', attrs={'property': 'dc:title'})
    result['title'] = clean_text(title_span.get('content')) if title_span else ''

    pub_meta = soup.find('meta', attrs={'property': 'article:published_time'})
    result['published_time'] = pub_meta.get('content') if pub_meta else ''

    date_span = article.find('span', class_='date-display-single')
    if date_span:
        result['date_iso'] = date_span.get('content', '')
        full_text = clean_text(date_span.get_text())
        if ' - ' in full_text:
            date_part, time_part = full_text.split(' - ', 1)
        else:
            date_part, time_part = full_text, ''
        result['event_date'] = date_part.strip()
        result['event_time_start'] = time_part.strip()
    else:
        result['date_iso'] = ''
        result['event_date'] = ''
        result['event_time_start'] = ''

    rsvp_div = article.find('div', class_='field-name-field-meeting-rsvp')
    result['rsvp_url'] = ''
    if rsvp_div:
        a = rsvp_div.find('a')
        if a:
            result['rsvp_url'] = strip_query(a.get('href', ''))

    # Body / topic
    body_div = article.find('div', class_='field-name-body')
    sponsors = []
    body_markdown = ''
    if body_div:
        body_item = body_div.find('div', class_='field-item')
        if body_item:
            sponsors, remove_tags = extract_sponsors(body_item)
            remove_sponsor_scaffolding(body_item, remove_tags)
            body_markdown = html_fragment_to_markdown(body_item)
    result['sponsors'] = sponsors
    result['body_markdown'] = body_markdown

    # Speaker
    speaker_div = article.find('div', class_='field-name-field-meeting-speaker')
    speakers = []
    if speaker_div:
        speaker_item = speaker_div.find('div', class_='field-item')
        if speaker_item:
            lines, img_markers = flatten_speaker_lines(speaker_item)
            speakers = segment_speakers(lines, img_markers)
    result['speakers'] = speakers

    # Location
    location_div = article.find('div', class_='field-name-field-meeting-location')
    loc_name, loc_addr = '', ''
    if location_div:
        location_item = location_div.find('div', class_='field-item')
        loc_name, loc_addr = parse_location(location_item)
    result['location_name'] = loc_name
    result['location_address'] = loc_addr

    return result


if __name__ == '__main__':
    import json

    if len(sys.argv) < 2:
        print('Usage: python parse_meeting.py <html_file_path>')
        sys.exit(1)

    path = sys.argv[1]

    try:
        r = parse_meeting(path)
        if r:
            print(json.dumps(r, indent=2, ensure_ascii=False))
        else:
            sys.exit(1)
    except (ValueError, PermissionError, OSError) as e:
        print(f'ERROR: {e}')
        sys.exit(1)
    except Exception as e:
        print(f'UNEXPECTED ERROR: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
