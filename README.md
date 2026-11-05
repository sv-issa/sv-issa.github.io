# Silicon Valley ISSA Chapter

![ISSA Logo](https://github.com/sv-issa/sv-issa.github.io/raw/main/static/images/logo.png)

> The website source for the Silicon Valley ISSA Chapter - a community of information security professionals in the Silicon Valley region.

[Live Website](https://sv-issa.org) | [ISSA International](https://www.issa.org)

## Overview

This repository contains the source code for the Silicon Valley ISSA Chapter website, built with [Hugo](https://gohugo.io/). The site serves as a hub for information security professionals to connect, learn, and grow professionally through educational meetings, networking opportunities, career resources, and training programs.

### What We Offer

- **Monthly Meetings**: Guest speakers covering the latest in cybersecurity, AI security, threat intelligence, and industry trends
- **Career Center**: Job board and certification resources for security professionals
- **Training Programs**: Review courses and certifications (e.g., CISSP)
- **Community**: Networking opportunities through LinkedIn groups and Slack channels
- **Events**: Holiday parties, special presentations, and community gatherings

## Tech Stack

- **Hugo Extended** (0.146.0+) - Static site generator with SCSS support
- **Custom Theme** - `sv-issa-theme` - Custom-designed for ISSA's branding and functionality
- **SCSS/CSS** - For styling and theming
- **Python** - For automation scripts (meeting content processing, image handling)

## Local Development

### Prerequisites

- Hugo Extended version 0.146.0 or higher
- Python 3.6+ (for automation scripts)

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/sv-issa/sv-issa.github.io.git
   cd sv-issa.github.io
   ```

2. **Install Hugo** (recommended approach)

   The repository includes a helper script to install Hugo:
   ```bash
   ./bin/install_hugo.sh
   ```

   Verify installation:
   ```bash
   hugo version
   ```

3. **Run the site locally**

   ```bash
   hugo server
   ```

   The site will be available at [http://localhost:1313](http://localhost:1313)

4. **Build the site**

   For production use, build the site:
   ```bash
   hugo --gc --minify
   ```

   The output will be in the `public/` directory.

## Project Structure

```
sv-issa.github.io/
├── archetypes/          # Page templates for different content types
│   ├── default.md      # Basic page archetype
│   ├── meetings.md     # Meeting content template
│   └── jobs.md         # Job listing template
├── bin/                # Utility scripts
│   ├── install_hugo.sh # Install Hugo script
│   ├── test_hugo.sh    # Test Hugo installation
│   ├── build_meetings.py    # Convert old site HTML to Hugo content
│   ├── parse_meeting.py     # Parse meeting HTML files
│   ├── image_handler.py     # Handle images from old site
│   └── download-website.sh  # Download old site content
├── content/            # Site content (markdown files)
│   ├── meetings/       # Meeting events and recordings
│   ├── jobs/           # Job postings
│   ├── about/          # Chapter and ISSA information
│   ├── certifications.md
│   └── _index.md       # Homepage content
├── static/             # Static assets (images, PDFs, etc.)
│   └── images/         # Site images and logos
├── themes/             # Hugo themes
│   └── sv-issa-theme/  # Custom theme files
│       ├── assets/     # SCSS, CSS, JavaScript
│       ├── layouts/    # Site templates
│       └── hugo.toml
├── AGENTS.md           # Development agent documentation
├── hugo.toml           # Hugo configuration
└── LICENSE             # Apache 2.0 License
```

## Content Management

Hugo provides a streamlined workflow for creating new pages using the `hugo new content` command. Each content type has a dedicated archetype in `archetypes/` that provides the correct frontmatter structure.

### Creating New Meeting Pages

Use Hugo's archetype-based workflow:

```bash
# Create a new meeting in the meetings section
hugo new meetings/my-meeting-name.md
```

This command will:
- Create the file in `content/meetings/` with the correct date and title
- Pre-fill frontmatter based on the `archetypes/meetings.md` template
- Set `draft: false` by default

Then edit the file to add:
- Title
- Date and time
- Speaker information
- Sponsor details
- Event description
- Recording access (if applicable)

#### From a Luma Event Link

When the event is hosted on [Luma](https://luma.com), extract the content programmatically:

```bash
# 1. Fetch the page
curl -s https://luma.com/{event-slug}
```

The response contains structured JSON data with the event details (name, dates, description, speaker bios). Use `grep` or `jq` to extract it:

```bash
curl -s https://luma.com/b26e746k | grep -oP '"name":"[^"]*"' 
curl -s https://luma.com/b26e746k | grep -oP '"description":\{[^}]+\}'
```

Key frontmatter notes when porting from Luma:
- **`event_date`**: Must be an ISO date string in quotes (e.g., `"2026-11-17"`). Human-readable dates will cause Hugo to fail with a parse error.
- **`event_location`**: If Luma shows "Registered guests only", leave `event_address: ""` empty.
- **Speaker images / sponsor logos**: Place in `static/images/` and reference as `/images/filename.ext`.
- For free events, set the appropriate ticket info but it doesn't affect site rendering.

### Creating Job Listings

Use the job archetype:

```bash
# Create a new job listing in the jobs section
hugo new jobs/my-job-title.md
```

This command will create a file in `content/jobs/` with frontmatter including:
- Job title
- Company
- Location
- Description
- Apply link

### Creating Standard Pages

For general pages (about, policies, etc.), use the default archetype:

```bash
# Create a new page in the about section
hugo new about/my-page-name.md
```

### Available Archetypes

The project includes three archetypes in `archetypes/`:

1. **`default.md`** - Basic page template for general content
2. **`meetings.md`** - Meeting event template with event-specific frontmatter
3. **`jobs.md`** - Job listing template with employment-specific fields

Each archetype defines the frontmatter fields automatically, making it easier to maintain consistency across content.

## Automation Scripts

### Meeting Content Migration

The `bin/build_meetings.py` script converts HTML files from the old website to Hugo markdown format:

```bash
./bin/build_meetings.py
```

This script:
- Parses HTML meeting files
- Extracts event details (date, speakers, sponsors)
- Creates properly formatted markdown files
- Copies images to the `static/images/` directory
- Handles image URL normalization

### Test Hugo Installation

Verify your Hugo setup:
```bash
./bin/test_hugo.sh
```

### Download Old Site Content

To fetch content from the old website:
```bash
./bin/download-website.sh
```

## Theme Development

The custom theme is located in `themes/sv-issa-theme/`. Key theme features:

- Responsive design for desktop and mobile
- SCSS support for theme customization
- Meeting listing layouts with event details
- Job board functionality
- Social media integration (LinkedIn, Slack)
- SEO-optimized structure

### Theme Configuration

The main theme configuration is in `themes/sv-issa-theme/hugo.toml`. Site-wide settings are in `hugo.toml`.

## Development Workflow

1. Make changes to markdown content or templates
2. Run `hugo server` to preview locally
3. Test on different screen sizes
4. Run `hugo --gc --minify` for production build
5. Verify the output in the `public/` directory
6. Commit and push changes

## Contributing

We welcome contributions! Areas for contribution include:

- Meeting content updates and transcription
- Job listings
- Website design improvements
- Bug fixes and features
- Documentation updates

Before making changes, please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test thoroughly with `hugo server`
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Website Structure

The menu is configured in `hugo.toml`:

- **Home** - Main landing page
- **About Us** - Chapter information and ISSA International
- **Meetings** - Upcoming and past meetings
- **Career Center** - Jobs and certifications
- **Social** - LinkedIn group and Slack channel
- **Participate** - Become a member, speaker, or sponsor

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ by the Silicon Valley ISSA Chapter**

For more information about ISSA, visit [https://www.issa.org](https://www.issa.org)