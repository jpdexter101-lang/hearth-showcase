# Before anything is published

Every change to this repository goes through this list. Publishing is always a deliberate step by
the project owner: nothing is copied here or pushed automatically.

## 1. Automated check (must pass)

```sh
node build.mjs
SHOWCASE_PRIVATE_TERMS=<path to the private terms list> node check.mjs
```

It fails on private or internal IP addresses, VPN network names, filesystem paths, email
addresses, things that look like tokens or keys, long hex strings, source maps, script tags,
links to unexpected sites, hidden image metadata (PNG text, EXIF, XMP), and every name on the
private terms list. The private list is kept outside this repository and is never committed.

## 2. People check every item below

**Screenshots and recordings**
- [ ] Taken from a demo installation with sample data, never a real homelab.
- [ ] Every pixel looked at: no machine names, account names, addresses, paths, tokens, browser
      tabs, bookmarks, notifications, or other windows. The operating system account name can
      appear inside the app (for example in setup instructions); check for it.
- [ ] Shows only what really exists. A concept or mockup is labelled as one, on the image or right
      beside it.
- [ ] Re-saved without metadata (the check confirms).

**Words**
- [ ] Every status matches the private development checklist on the day it is published.
- [ ] "Implemented" is never written as "done", "released", or "verified".
- [ ] Nothing implies Hearth can be downloaded before it can.
- [ ] No internal security details beyond what a user needs to trust it (no attack surface maps,
      internal endpoints, or how protections are bypassed).

**Code excerpts (optional, owner approval each time)**
- [ ] Short, self-contained, and chosen on purpose; assume it will be copied.
- [ ] No credentials, endpoints, hostnames, paths, or private repository references.
- [ ] Not security-sensitive internals.
- [ ] License stated next to it.

**Repository and history**
- [ ] Commits use the GitHub no-reply email address, never a personal one.
- [ ] No files copied from the private repository's history, branches, or issues.
- [ ] No links to the private repository, private issues, or internal documents.
- [ ] No GitHub Actions secrets or tokens; GitHub Pages serves `docs/` as committed.

## 3. Publish

Only the owner approves and pushes. Drafts (`"status": "draft"`) are never published: change an
update to `"published"` only when it is approved.
