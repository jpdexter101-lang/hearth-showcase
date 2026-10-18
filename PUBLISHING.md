# Updating the showcase

Everything on the site comes from three files in `content/`. No other system is involved.

## Change a milestone's stage

Edit `content/milestones.json`: set the milestone's `stage` to `planned`, `in-development`,
`implemented`, `verified`, or `released`, adjust its text if needed, and update `asOf`.

## Publish a development update

1. Add an entry to `content/updates.json` with `"status": "draft"`.
2. Preview it: `node build.mjs --drafts`, then open `docs/index.html` in a browser. Drafts show a
   Draft label and the page says it is a preview.
3. When it is approved, change it to `"status": "published"`.

Write for homelab enthusiasts, not programmers: what changed, why it matters to them, and its
honest state ("built and tested; in review", "planned").

## Before pushing

1. `node build.mjs` (without `--drafts`)
2. Run the check in `REVIEW.md` and go through its list.
3. Commit `content/`, `assets/`, and `docs/` together, then push.

GitHub Pages serves `docs/` from the `main` branch exactly as committed. It usually updates within
a minute or two.
