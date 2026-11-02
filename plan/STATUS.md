# STATUS (update after every batch; paste FLAG lines under the batch)

## Baseline (Stage 1 fills this)
- pi-subagents installed / doctor clean / agent listed / script validated: ✅
- hugo build: ✅ 47 pages in ~147ms
- npm test: ✅ 100/100 passed (26.9s)
- validation command: `node bin/check-content.js <files>`; `node bin/check-batch.js <batch-name>`
- CONVENTIONS amendments: none needed yet

## Stage 1 – Foundation
- [x] 1.1 baseline  - [x] 1.2 bin/oldpage.js  - [x] 1.3 bin/check-content.js  - [x] 1.4 bin/check-batch.js  - [ ] 1.4 theme tasks (expired jobs, article section, RSVP fix, past meetings page, mixed-case slug, map links)

### Stage 1.4 – Foundation theme tasks
```
| # | Item | Status |
|---|------|--------|
| 7 | Expired jobs behavior (`--gc`/`--buildExpired`) | ✅ confirmed: `hugo --gc` excludes expired pages; `--buildExpired` includes them. No code change needed. |
| 8 | Article section + footer nav | ✅ created `content/article/_index.md`; added "Articles" (weight=35) to footer menu in `hugo.toml`. Hugo default `section.html → list-page.html → list-item.html` renders the section. |
| 9 | RSVP link bug fix (`?` vs `&`) + empty URL handling | ✅ fixed in `meetings.html`, `home-meetings.html`, `meeting-card.html`: use `strings.Contains . "?"` to pick `?` or `&`; render no button when `event_rsvp_url` is empty. |
| 10 | Past meetings page at scale | ✅ verified: layout groups cards by year descending, uses `future_only: false`. All 26 past meetings rendered correctly. |
| 11 | Mixed-case slug conventions | ✅ tested: Hugo always produces lowercase hyphenated URLs (`Mixed-Case-Slug.md → /mixed-case-slug/`). Updated `CONVENTIONS.md` Slug paragraph with alias guidance. |
| 12 | Map links support | ✅ added `event_map_url` to archetype; updated `meetings.html` location link; created `_markup/render-link.html` render hook for Google Maps links (`target="_blank" rel="noopener"`). Tested with throwaway page, deleted it. No finished meeting had a map link in its old page. |
```
## Stage 2 – Static pages
- [ ] education  - [ ] GRIT training  - [ ] Education nav item

## Stage 3 – Meetings (142) ✅ COMPLETE
- [x] meetings-01  (5 pages, ~33 KB article HTML)
- [x] meetings-02  (8 pages, ~33 KB article HTML)
- [x] meetings-03  (4 pages, ~23 KB article HTML)

FLAG: building-shaky-ground-unveiling-vulnerabilities-firmware – link: constantcontact.com RSVP removed (pre-2024 event)
FLAG: mastering-art-storytelling-cybersecurity-communicating-your-message-impact – link: constantcontact.com RSVP removed (pre-2024 event)
FLAG: april-2023-sv-issa-chapter-event-rsa-2023-pawn-shop-soma-sf – link: constantcontact.com RSVP removed (pre-2024 event)
FLAG: march-2023-sv-issa-chapter-meeting-secops-maturity-business-intel-boardroom – link: constantcontact.com RSVP removed (pre-2024 event)
- [x] meetings-04  (5 pages, ~33 KB article HTML)

FLAG: february-2023-sv-issa-chapter-meeting-panel-need-understand-cyber-risk-quantification-crq – link: constantcontact.com RSVP removed (pre-2024 event)
FLAG: jan-2023-sv-issa-chapter-meeting-2022-lessons-learned-2023-what-we-will-do-better – link: constantcontact.com RSVP removed (pre-2024 event)
FLAG: 2022-sv-issa-winter-holiday-event – link: constantcontact.com RSVP removed (pre-2024 event)
FLAG: modern-approach-securing-todays-remote-enterprise – link: constantcontact.com RSVP removed (pre-2024 event)
FLAG: how-securely-perform-ai-training-clients-data – link: constantcontact.com RSVP removed (pre-2024 event)
- [x] meetings-05  (8 pages, ~30 KB article HTML)

FLAG: july-2022-sv-issa-monthly-chapter-meeting-zero-trust-vpns-casb-truth-hype-fully-exposed – link: pdf not in crawl, will 404 after cutover
- [x] meetings-06  (8 pages, ~32 KB article HTML)

FLAG: collision-crypto-assets-and-security-you-and-me – link: pdf not in crawl, will 404 after cutover
- [x] meetings-07  (8 pages, ~35 KB article HTML)

FLAG: cyber-attack-trends-and-insider-threats – speaker: no named speaker in old page
FLAG: kubernetes-security-doing-more-less-uncertain-times – link: pdf not in crawl, will 404 after cutover
- [x] meetings-08  (8 pages, ~28 KB article HTML)

FLAG: supervisory-special-agent-cyber-squad-fbi-san-francisco – speaker: no named speaker in old page

- [x] meetings-09  (8 pages, ~30 KB article HTML)

FLAG: 2019-sv-issa-winter-holiday-event – image: decorative holiday banner included in body (not a speaker photo)
- [x] meetings-10  (8 pages, ~34 KB article HTML)

### Batch 10 flags (meetings-10)
(none - all 8 pages converted cleanly; no Constant Contact links carried (pre-2024), no map links missing, images valid)
- [x] meetings-11  (7 pages, ~31 KB article HTML)

### Batch 11 flags (meetings-11)
(none - all 7 pages converted cleanly; no Constant Contact links carried (pre-2024), no map links missing, images valid, colons in titles/descriptions quoted)
- [x] meetings-12  (8 pages, ~30 KB article HTML)

### Batch 12 flags (meetings-12)
FLAG: dark-side-machine-learning – link: constantcontact.com RSVP removed (pre-2024 event)
FLAG: director-s-cut-secrets-successful-soc – link: constantcontact.com RSVP removed (pre-2024 event)
FLAG: joint-mixer-san-francisco-and-silicon-valley-issa-chapters – link: constantcontact.com RSVP removed (pre-2024 event)
FLAG: july-2017-next-gen-threats-vs-next-gen-security – link: constantcontact.com RSVP removed (pre-2024 event)
FLAG: modernize-your-endpoint-security-no-silver-bullets-you-need-arsenal – link: constantcontact.com RSVP removed (pre-2024 event)
FLAG: no-meeting-cornerstones-trust – link: constantcontact.com RSVP removed (pre-2024 event)
### Batch 13 flags (meetings-13)
FLAG: critical-criteria-ensure-cloud-workload-security – link: constant contact removed
FLAG: ddos-password-policies-and-spam-what-do-they-all-have-common – link: constant contact removed
FLAG: betting-cloud-and-winning – link: constant contact removed
FLAG: adversarial-alignment-train-you-fight – link: constant contact removed
FLAG: 2016-holiday-gathering – link: constant contact removed
FLAG: accelerating-security-response-how-outpace-noise – link: constant contact removed
FLAG: privileged-accounts-best-practices-and-practical-phased-approach-success – link: constant contact removed
- [x] meetings-13  (8 pages, ~32 KB article HTML)
FLAG: eliminating-operational-blindspots-incident-exchange-and-collaboration – speaker: only first name "Shimon" given
- [x] meetings-14  (8 pages, ~29 KB article HTML)
- [x] meetings-15  (8 pages, ~27 KB article HTML)
  Converted: bugbounty-program-presented-ncc-group, holiday-social, starting-metrics-program, addressing-risks-compliance-and-threats-cloud-world, data-centric-security-key-digital-business-success, silicon-valley-san-francisco-social-event, legal-concepts-cybersecurity, Utilizing-Contextual-Awareness-Combat-Cyber-Threats
  FLAG: Utilizing-Contextual-Awareness-Combat-Cyber-Threats – image: sv-issa-conference-location.png copied as /images/sv-issa-conference-location.png
- [x] meetings-16  (8 pages, ~32 KB article HTML)
  Converted: 2014-holiday-party, applying-critical-controls-combat-advanced-threats-and-secure-your-infrastructure, automating-security-across-cloud-services, considerations-cloud-and-mobile-security-0, no-april-meeting-due-rsa, no-meeting-june-see-you-cornerstones-trust, protecting-and-monitoring-privileged-pathway-new-layer-security-protect-heart-enterprise, twenty-steps-towards-strong-cyber-security-program
FLAG: applying-critical-controls-combat-advanced-threats-and-secure-your-infrastructure – link: constant contact removed
FLAG: automating-security-across-cloud-services – link: constant contact removed
FLAG: considerations-cloud-and-mobile-security-0 – link: constant contact removed
FLAG: protecting-and-monitoring-privileged-pathway-new-layer-security-protect-heart-enterprise – link: constant contact removed
FLAG: twenty-steps-towards-strong-cyber-security-program – link: constant contact removed
- [x] meetings-17  (8 pages, ~32 KB article HTML)
  Converted: open-forum-past-present-and-future-information-security, cons-frauds-and-flimflam-examination-social-media-and-mobile-application-scams, data-protection-and-mobile-payments, considerations-cloud-and-mobile-security, potential-volatile-memory-persistence, what-real-face-shadow-it, moving-reactive-proactive-security, march-member-feedback-meeting
FLAG: open-forum-past-present-and-future-information-security – link: constant contact removed
FLAG: cons-frauds-and-flimflam-examination-social-media-and-mobile-application-scams – link: constant contact removed
FLAG: data-protection-and-mobile-payments – link: constant contact removed
FLAG: considerations-cloud-and-mobile-security – link: constant contact removed
FLAG: potential-volatile-memory-persistence – link: constant contact removed
FLAG: what-real-face-shadow-it – link: constant contact removed
FLAG: moving-reactive-proactive-security – link: constant contact removed
FLAG: march-member-feedback-meeting – link: constant contact removed
- [x] meetings-18  (6 pages, ~34 KB article HTML)
  Converted: using-hackers-own-methods-tools-defeat-persistent-adversaries, behavioral-analytics-intellectual-property-protection, 2013-holiday-party, building-security-program-protects-organization-s-most-critical-assets, metrics-matter-security-risk-analytics, art-selling-security-peers-executive-management
FLAG: using-hackers-own-methods-tools-defeat-persistent-adversaries – link: constant contact removed
FLAG: behavioral-analytics-intellectual-property-protection – link: constant contact removed
FLAG: 2013-holiday-party – image: rsvp-button.jpg already exists in static/images
FLAG: art-selling-security-peers-executive-management – link: constant contact removed
- [x] meetings-19  (8 pages, ~34 KB article HTML)

### Batch 19 flags (meetings-19)
(none - all 8 pages converted cleanly; no Constant Contact RSVP links (pre-2024), map iframes dropped with links as event_map_url, no speaker images to copy)
- [x] meetings-20  (3 pages, ~10 KB article HTML)

### Batch 20 flags (meetings-20)
- FLAG: why-your-enterprise-should-be-managing-its-certificates – link: pdf not in crawl, will 404 after cutover

## Stage 4 2013 Jobs (99) 2705 COMPLETE
- [x] jobs-01  (9 pages, ~36 KB article HTML)

### Batch jobs-01 flags
(none - all 9 job posts converted cleanly; no Constant Contact links, no images to copy, no map iframes)
- [x] jobs-02  (8 pages, ~38 KB article HTML)

### Batch jobs-02 flags
FLAG: cissp-training-opportunity – other: not a job (recruiter solicitation), converted with job_company set to sender's org
- [x] jobs-03  (8 pages, ~32 KB article HTML)

### Batch jobs-03 flags
(none - all 8 job posts converted cleanly; no Constant Contact links, no images to copy, no map iframes)
### Batch jobs-04 flags
FLAG: free-job-postings – other: not a job (informational page about SV-ISSA free posting service), converted with job_company set to Silicon Valley ISSA
- [x] jobs-04  (9 pages, ~36 KB article HTML)
- [ ] jobs-05  (10 pages, ~37 KB article HTML)
### Batch jobs-05 flags
none - all 10 pages are valid job postings; information-security-officer has minimal body content (only an external Stanford application link)
- [x] jobs-05
- [x] jobs-06  (6 pages, ~37 KB article HTML)
### Batch jobs-06 flags
(none - all 6 job posts converted cleanly; no Constant Contact links, no images to copy, no map iframes)
- [x] jobs-07  (10 pages, ~29 KB article HTML)
### Batch jobs-07 flags

FLAG: network-security-architect-role-and-others – other: no job_company in source (recruiter contact post)
- [x] jobs-08  (8 pages, ~39 KB article HTML)
### Batch jobs-08 flags

FLAG: security-assessment-consultant-cissp-ceh-contract-sacramento – other: no job_company in source (unattributed contract posting)
- [x] jobs-09  (7 pages, ~37 KB article HTML)
### Batch jobs-09 flags
(none - all 7 job posts converted cleanly; no Constant Contact links, no images to copy, no map iframes)
- [x] jobs-10  (9 pages, ~39 KB article HTML)
### Batch jobs-10 flags
(none - all 9 job posts converted cleanly; no Constant Contact links, no images to copy, no map iframes)
- [x] jobs-11  (8 pages, ~38 KB article HTML)
### Batch jobs-11 flags
(none - all 8 job posts converted cleanly; no Constant Contact links, no images to copy, no map iframes)
- [x] jobs-12  (7 pages, ~25 KB article HTML)
### Batch jobs-12 flags
(none - all 7 job posts converted; no Constant Contact links, no images to copy)

## Stage 5 – Articles (29)
- [ ] articles-01  (10 pages, ~22 KB article HTML)
- [ ] articles-02  (10 pages, ~16 KB article HTML)
- [ ] articles-03  (9 pages, ~15 KB article HTML)

## Stage 6 – Final QA
- [ ] 6A automated  - [ ] 6B coverage + spot checks  - [ ] handoff report

## Flags / theme requests collected
(none yet)

### Batch 10 flags (meetings-10)
(none - all 8 pages converted cleanly; no Constant Contact links carried (pre-2024), no map links missing, images valid)

## check-batch.js self-test results (2025-10-29)
- `--manifest` with 2 existing pages → PASS ✅
- missing slug in manifest → FAIL ❌ (correct)
- uncommitted file in content/ → FAIL ❌ (correct)
