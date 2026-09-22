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

## Site Structure

- Theme: `themes/sv-issa-theme/` (custom theme)
- Archetypes:
  - `archetypes/default.md` - basic page template
  - `archetypes/meetings.md` - meeting content with event details, sponsors, speakers
  - `archetypes/jobs.md` - job listing template

Content lives in `content/` directory with section subdirectories (meetings, jobs, certifications, etc.).

## Agent Execution Notes

- Use the shell tool directly instead of execute code mode, will get `ReferenceError: Unknown identifier 'require'.`


## Version Notes

- `hugo.toml` requires Hugo extended 0.146.0+
- `bin/test_hugo.sh` expects Hugo 0.166.0
- Use extended version for SCSS support in the custom theme
