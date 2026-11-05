# AGENTS.md - Silicon Valley ISSA Hugo Site

## Local Development

**Hugo must be extended version** (required for SCSS processing in the custom theme).

Install Hugo using the provided script:
```bash
./bin/install_hugo.sh
```

Verify installation:
```bash
./bin/test_hugo.sh
```

Build the site:
```bash
hugo --gc --minify
```

Run the dev server (live reload):
```bash
hugo server
# defaults to http://localhost:1313
```

### Playwright Tests

Install dependencies and browser binaries:
```bash
npm install
npx playwright install chromium
```

Run tests (starts Hugo server automatically):
```bash
npm test
```

Run a single test file:
```bash
npx playwright test tests/nav.spec.js
```

Generate an interactive HTML report:
```bash
npx playwright show-report
```

## Site Structure

- Theme: `themes/sv-issa-theme/` (custom theme)
- Archetypes:
  - `archetypes/default.md` - basic page template
  - `archetypes/meetings.md` - meeting content with event details, sponsors, speakers
  - `archetypes/jobs.md` - job listing template

Content lives in `content/` directory with section subdirectories (meetings, jobs, certifications, etc.).

## Agent Execution Notes

- Use the shell tool directly instead of execute code mode, will get `ReferenceError: Unknown identifier 'require'.`

### Adding New Meetings from Luma Links

When adding a new meeting from a Luma event URL:

1. **Fetch the page content:**
   ```bash
   curl -s https://luma.com/{event-id}
   ```
2. **Extract event data** from the response (search for JSON-LD/structured data, `__NEXT_DATA__`, or inline JSON containing fields like `name`, `startDate`, `endDate`, `description`, speaker info)
3. **Create the meeting file:**
   ```bash
   hugo new meetings/{slug-name}.md
   ```
4. **Fill in the frontmatter** and body:
   - `event_date`: Use an ISO format date (e.g., `"2026-11-17"`) — not a human-readable string, or Hugo will fail to parse it
   - `event_time_start`, `event_time_end`: Human-readable times (e.g., `"5:30 PM"`)
   - `event_rsvp_url`: The Luma URL
   - `event_location`: If the venue is "Registered guests only", set `event_address: ""`
   - Speaker info from the page; use local images when available (e.g., `/images/speaker.jpg`, `/images/sponsor-logo.svg`)
5. **Build to verify**
   ```bash
   hugo --gc --minify
   ```


## Version Notes

- `hugo.toml` requires Hugo extended 0.146.0+
- `bin/test_hugo.sh` expects Hugo 0.166.0
- Use extended version for SCSS support in the custom theme
