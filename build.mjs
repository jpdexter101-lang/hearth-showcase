// Builds the showcase into docs/: one static page and an Atom feed, from the files in content/.
// No dependencies. One small first-party script (assets/site.js) only adds conveniences: the
// phone menu closes after a choice, and screenshots open in a viewer. Without it, every link works. Only updates marked "published" are included,
// unless --drafts is passed (local preview only: drafts are labelled and the page says so).
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const drafts = process.argv.includes("--drafts");
const read = (f) => JSON.parse(readFileSync(path.join(root, "content", f), "utf8"));
const site = read("site.json");
const progress = read("milestones.json");
const updates = read("updates.json").updates
  .filter((u) => u.status === "published" || (drafts && u.status === "draft"))
  .sort((a, b) => b.date.localeCompare(a.date));

// Each image link carries a short hash of the file, so a browser fetches a changed picture
// instead of showing the copy it saved before (same name, new content).
const v = (rel) =>
  `${rel}?v=${createHash("sha1").update(readFileSync(path.join(root, rel))).digest("hex").slice(0, 8)}`;
const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const stages = progress.stages;
const stageIndex = (id) => stages.findIndex((s) => s.id === id);
const stageLabel = (id) => stages[stageIndex(id)]?.label ?? id;
const chip = (id) => `<span class="chip chip-${esc(id)}">${esc(stageLabel(id))}</span>`;
const longDate = (d) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });

function track(id) {
  const at = stageIndex(id);
  return `<ol class="track" aria-label="Stage: ${esc(stageLabel(id))}">${stages
    .map((s, i) => `<li class="${i < at ? "done" : i === at ? "now" : ""}"><span class="sr-only">${esc(s.label)}${i === at ? " (current)" : ""}</span></li>`)
    .join("")}</ol>`;
}

const counts = stages
  .map((s) => ({ ...s, n: progress.milestones.filter((m) => m.stage === s.id).length }))
  .map((s) => `<li><strong>${s.n}</strong> ${esc(s.label.toLowerCase())}</li>`)
  .join("");

const figure = (s) =>
  `<figure class="shot"><a href="${v(`assets/shots/${s.file}`)}" data-view><img src="${v(`assets/shots/${s.file}`)}" alt="${esc(s.title)}: ${esc(s.caption)}" width="${s.w ?? 1440}" height="${s.h ?? 900}" loading="lazy"></a><figcaption><strong>${esc(s.title)}</strong> ${esc(s.caption)}</figcaption></figure>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(site.name)}: ${esc(site.tagline)}</title>
<meta name="description" content="${esc(site.description)}">
<meta name="referrer" content="no-referrer">
<meta property="og:title" content="${esc(site.name)}: ${esc(site.tagline)}">
<meta property="og:description" content="${esc(site.description)}">
<meta property="og:image" content="${esc(site.siteUrl)}assets/shots/home.png">
<link rel="icon" href="assets/img/favicon.png">
<link rel="alternate" type="application/atom+xml" title="Hearth development updates" href="feed.xml">
<link rel="stylesheet" href="assets/site.css">
${drafts ? '<meta name="robots" content="noindex">' : ""}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${drafts ? '<div class="preview-bar" role="note">Local preview with draft content. Nothing here is published, and links to the public repository will not work until it exists.</div>' : ""}
<header class="top">
  <a class="brand" href="#top"><img src="assets/img/hearth-mark.png" alt="" width="36" height="36"><span>hearth</span></a>
  <nav class="nav-wide" aria-label="Sections">
    <a href="#ember">Ember</a><a href="#workflow">In action</a><a href="#preview">Preview</a><a href="#progress">Progress</a><a href="#roadmap">Roadmap</a><a href="#pricing">Pricing</a><a href="gallery.html">Gallery</a><a href="#updates">Updates</a><a href="#follow" class="nav-cta">Follow</a>
  </nav>
  <div class="nav-small">
    <details class="menu">
      <summary>Sections</summary>
      <nav aria-label="Sections"><a href="#ember">Ember</a><a href="#workflow">In action</a><a href="#preview">Preview</a><a href="#progress">Progress</a><a href="#roadmap">Roadmap</a><a href="#pricing">Pricing</a><a href="gallery.html">Gallery</a><a href="#updates">Updates</a></nav>
    </details>
    <a href="#follow" class="nav-cta">Follow</a>
  </div>
</header>

<main id="main">
<section class="hero" id="top">
  <div class="hero-text">
    <p class="status"><span class="dot" aria-hidden="true"></span>${esc(site.status)}</p>
    <h1>${esc(site.tagline)}</h1>
    <p class="lead">${esc(site.description)}</p>
    <div class="ctas">
      <a class="btn btn-primary" href="#follow">Follow development</a>
      <a class="btn" href="#workflow">See Ember in action</a>
    </div>
  </div>
  <figure class="hero-shot">
    <img src="${v("assets/shots/home.png")}" alt="Hearth's Home page: Ember in the middle with active projects around it" width="1440" height="900">
    <figcaption>The real Hearth interface, shown with sample data.</figcaption>
  </figure>
</section>

<section id="workflow" aria-labelledby="workflow-h">
  <p class="eyebrow">See it in action</p>
  <h2 id="workflow-h">${esc(site.workflow.title)}</h2>
  <p class="sub">${esc(site.workflow.intro)}</p>
  <ol class="flow">
    ${site.workflow.steps
      .map(
        (st) => `<li><figure class="shot"><a href="${v(`assets/shots/${st.file}`)}" data-view><img src="${v(`assets/shots/${st.file}`)}" alt="${esc(st.title)}: ${esc(st.caption)}" width="${st.w}" height="${st.h}" loading="lazy"></a><figcaption><strong>${esc(st.title)}</strong> ${esc(st.caption)}</figcaption></figure></li>`,
      )
      .join("\n    ")}
  </ol>
  <p class="fine">${esc(site.workflow.note)}</p>
</section>

<section class="band" id="ember" aria-labelledby="ember-h">
  <div class="ember-intro">
    <img src="${v("assets/img/mascots/ember-classic.webp")}" alt="Ember, Hearth's flame mascot" width="220" height="220" class="ember-pic">
    <div>
      <p class="eyebrow">Meet Ember</p>
      <h2 id="ember-h">An administrator, not just a chatbot</h2>
      ${site.emberIntro.map((t) => `<p>${esc(t)}</p>`).join("\n      ")}
      <p class="fine">You can rename Ember and give it a different voice and look. Ember thinks with the AI service you connect.</p>
    </div>
  </div>
  <ol class="loop">
    ${site.emberLoop
      .map((s, i) => `<li><span class="n">${i + 1}</span><h3>${esc(s.step)}</h3>${chip(s.stage)}<p>${esc(s.note)}</p></li>`)
      .join("\n    ")}
  </ol>
  <p class="fine center">"Implemented" means built and tested in development builds. Nothing is publicly released yet.</p>
  <h3 class="looks-h">Make Ember yours</h3>
  <p class="fine center">Ten looks to pick from. Ember's name and voice are yours to change too.</p>
  <div class="mascots" role="group" aria-label="Ember's ten looks"><figure><img src="${v("assets/img/mascots/ember-classic.webp")}" alt="Ember, Classic look" width="96" height="96" loading="lazy"><figcaption>Classic</figcaption></figure><figure><img src="assets/img/mascots/ember-chatty.webp" alt="Ember, Chatty look" width="96" height="96" loading="lazy"><figcaption>Chatty</figcaption></figure><figure><img src="assets/img/mascots/ember-manager.webp" alt="Ember, Manager look" width="96" height="96" loading="lazy"><figcaption>Manager</figcaption></figure><figure><img src="assets/img/mascots/ember-detective.webp" alt="Ember, Detective look" width="96" height="96" loading="lazy"><figcaption>Detective</figcaption></figure><figure><img src="assets/img/mascots/ember-engineer.webp" alt="Ember, Engineer look" width="96" height="96" loading="lazy"><figcaption>Engineer</figcaption></figure><figure><img src="assets/img/mascots/ember-gamer.webp" alt="Ember, Gamer look" width="96" height="96" loading="lazy"><figcaption>Gamer</figcaption></figure><figure><img src="assets/img/mascots/ember-it.webp" alt="Ember, IT look" width="96" height="96" loading="lazy"><figcaption>IT</figcaption></figure><figure><img src="assets/img/mascots/ember-cosmic.webp" alt="Ember, Cosmic look" width="96" height="96" loading="lazy"><figcaption>Cosmic</figcaption></figure><figure><img src="assets/img/mascots/ember-arcane.webp" alt="Ember, Arcane look" width="96" height="96" loading="lazy"><figcaption>Arcane</figcaption></figure><figure><img src="assets/img/mascots/ember-cozy.webp" alt="Ember, Cozy look" width="96" height="96" loading="lazy"><figcaption>Cozy</figcaption></figure></div>
</section>

<section id="preview" aria-labelledby="preview-h">
  <p class="eyebrow">Product preview</p>
  <h2 id="preview-h">What it looks like today</h2>
  <p class="sub">Real screens from current development builds, using sample data instead of anyone's real homelab: an app panel, a plan waiting for approval, the home dashboard, and a watch party.</p>
  <div class="shots">
    ${site.screens.filter((s) => s.featured).map(figure).join("\n    ")}
  </div>
  <div class="ctas center"><a class="btn btn-primary" href="gallery.html">See all ${site.screens.length} screenshots</a></div>
</section>

<section class="band" id="build" aria-labelledby="build-h">
  <p class="eyebrow">The big goal</p>
  <h2 id="build-h">${esc(progress.journey.title)}</h2>
  <p class="sub">${esc(progress.journey.intro)}</p>
  <div class="build-grid">
    <ol class="journey">
      ${progress.journey.steps.map((s, i) => `<li><span class="n">${i + 1}</span><span class="t">${esc(s.title)}</span>${chip(s.stage)}</li>`).join("\n      ")}
    </ol>
    <figure class="concept">
      <figcaption><span class="chip chip-planned">Not built yet</span> ${esc(site.concept.title)}</figcaption>
      <ul>${site.concept.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
      <p class="fine">An illustration of the experience we're designing, not a screenshot. Every real step will come from what actually happened, and anything sensitive will ask you first.</p>
    </figure>
  </div>
  <div class="build-shot">${figure(site.screens.find((x) => x.file === "plan-6-plan.png"))}</div>
</section>

<section id="progress" aria-labelledby="progress-h">
  <p class="eyebrow">Development progress</p>
  <h2 id="progress-h">Where Hearth is today</h2>
  <p class="sub">Each milestone moves through five stages. We don't publish an overall percentage: the roadmap is still growing, so one number would pretend to a precision we don't have.</p>
  <ul class="legend">${stages.map((s) => `<li>${chip(s.id)} ${esc(s.meaning)}</li>`).join("")}</ul>
  <ul class="counts" aria-label="Milestones by stage">${counts}</ul>
  <div class="cards">
    ${progress.milestones
      .map(
        (m) => `<article class="card"><header><h3>${esc(m.title)}</h3>${chip(m.stage)}</header>${track(m.stage)}<p>${esc(m.summary)}</p><p class="fine">${esc(m.detail)}</p></article>`,
      )
      .join("\n    ")}
  </div>
  <p class="fine">Status as of ${esc(longDate(progress.asOf))}, from the project's development records.</p>
</section>

<section class="band" id="roadmap" aria-labelledby="roadmap-h">
  <p class="eyebrow">Roadmap</p>
  <h2 id="roadmap-h">What's coming</h2>
  <div class="roadmap">
    ${[
      ["Now", progress.roadmap.now],
      ["Next", progress.roadmap.next],
      ["Later", progress.roadmap.later],
    ]
      .map(([h, items]) => `<div><h3>${h}</h3><ul>${items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`)
      .join("\n    ")}
  </div>
  <p class="fine">Plans change as we learn. Dates aren't promised until a release is ready.</p>
</section>

<section id="pricing" aria-labelledby="pricing-h">
  <p class="eyebrow">Free and paid</p>
  <h2 id="pricing-h">${esc(site.pricing.title)}</h2>
  <p class="lead">${esc(site.pricing.lead)}</p>
  <div class="pricing">
    <div><h3>Free</h3><ul>${site.pricing.free.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>
    <div><h3>Paid add-ons</h3><ul>${site.pricing.paid.map(([n, d]) => `<li><strong>${esc(n)}</strong>: ${esc(d)}</li>`).join("")}</ul><p class="biz">${esc(site.pricing.business)}</p></div>
  </div>
  <p class="fine">${esc(site.pricing.note)}</p>
</section>

<section id="updates" aria-labelledby="updates-h">
  <p class="eyebrow">Development updates</p>
  <h2 id="updates-h">Recent progress</h2>
  ${
    updates.length
      ? `<ol class="updates">${updates
          .map(
            (u) => `<li><article><p class="meta"><time datetime="${esc(u.date)}">${esc(longDate(u.date))}</time> · ${esc(u.category)}${u.status === "draft" ? ' · <span class="draft">Draft</span>' : ""}</p><h3>${esc(u.title)}</h3>${u.body.map((p) => `<p>${esc(p)}</p>`).join("")}${u.image ? `<figure class="update-shot"><a href="${v(`assets/shots/${u.image}`)}"><img src="${v(`assets/shots/${u.image}`)}" alt="${esc(u.imageAlt ?? u.title)}" loading="lazy"></a></figure>` : ""}<p class="fine">${esc(u.state)}</p></article></li>`,
          )
          .join("")}</ol>`
      : '<p class="sub">The first update is on its way.</p>'
  }
  <p class="fine">Get new updates in a feed reader (Feedly, Inoreader, NetNewsWire and others): add <code>${esc(site.siteUrl)}feed.xml</code>. Opening that address in a browser shows raw XML; that's normal.</p>
</section>

<section class="band follow" id="follow" aria-labelledby="follow-h">
  <h2 id="follow-h">Follow along</h2>
  <p class="sub">Hearth isn't available to download yet. Two ways to hear when it is. No sign-up here, and we don't collect anything about you.</p>
  <div class="follow-ways">
    <div>
      <h3>On GitHub</h3>
      <p>Open the project page, then press <strong>Star</strong> to bookmark it, or <strong>Watch</strong>, then <strong>Custom</strong>, then <strong>Releases</strong> to get a notification when a release comes out. Both need a free GitHub account.</p>
      <a class="btn btn-primary" href="${esc(site.repoUrl)}">Open the project on GitHub</a>
    </div>
    <div>
      <h3>In a feed reader</h3>
      <p>Add this address to any feed reader to get every development update:</p>
      <p><code>${esc(site.siteUrl)}feed.xml</code></p>
      <p class="fine">Opening it in a browser shows raw XML; a feed reader turns it into posts.</p>
    </div>
  </div>
</section>
</main>

<footer>
  <p><strong>Hearth is in development.</strong> Features described as planned or in development may change, and nothing here is available to download yet. Screens show sample data.</p>
  <p>Made by ${esc(site.maker)}. ${esc(site.copyright)} The text, images, and design of this site are original showcase content.</p>
  <p>App names and logos shown in the interface belong to their owners and are used only to identify them.</p>
</footer>
<dialog class="viewer" aria-label="Screenshot viewer">
  <figure><img alt=""><p class="viewer-hint">Swipe sideways to see the whole screen.</p><figcaption></figcaption></figure>
  <div class="viewer-bar">
    <button type="button" data-prev>Previous</button>
    <span class="viewer-count" aria-live="polite"></span>
    <button type="button" data-next>Next</button>
    <button type="button" data-close>Close</button>
  </div>
</dialog>
<script src="${v("assets/site.js")}" defer></script>
</body>
</html>
`;

const atomEsc = esc;
const feed = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Hearth development updates</title>
  <link href="${atomEsc(site.siteUrl)}"/>
  <link rel="self" href="${atomEsc(site.siteUrl)}feed.xml"/>
  <id>${atomEsc(site.siteUrl)}</id>
  <updated>${(updates[0]?.date ?? progress.asOf)}T00:00:00Z</updated>
${updates
  .map(
    (u) => `  <entry>
    <title>${atomEsc(u.title)}</title>
    <id>${atomEsc(site.siteUrl)}#${atomEsc(u.id)}</id>
    <link href="${atomEsc(site.siteUrl)}#updates"/>
    <updated>${u.date}T00:00:00Z</updated>
    <summary>${atomEsc(u.body.join(" "))}</summary>
  </entry>`,
  )
  .join("\n")}
</feed>
`;

// docs/ is what GitHub Pages serves (Settings > Pages > main branch, /docs). Commit it only after check.mjs passes.
const dist = path.join(root, "docs");
rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });
cpSync(path.join(root, "assets"), path.join(dist, "assets"), { recursive: true });
writeFileSync(path.join(dist, "index.html"), html);
// The gallery: every screenshot on its own page, so the main page stays short.
const gallery = html
  .replace(/<title>[^<]*<\/title>/, `<title>${esc(site.name)}: screenshots</title>`)
  .replace(/href="#(?!main")/g, 'href="index.html#')
  .replace(
    /<main id="main">[\s\S]*<\/main>/,
    `<main id="main">
<section id="gallery" aria-labelledby="gallery-h">
  <p class="eyebrow">Gallery</p>
  <h1 id="gallery-h">Every screen, as it looks today</h1>
  <p class="sub">Real screens from current development builds, using sample data instead of anyone's real homelab. Tap one to see it full size.</p>
  <nav class="gallery-jump" aria-label="Gallery groups">${site.galleryGroups.map((g) => `<a href="#g-${g.id}">${esc(g.title)}</a>`).join("")}</nav>
  ${site.galleryGroups
    .map(
      (g) => `<section class="gallery-group" id="g-${g.id}" aria-labelledby="g-${g.id}-h">
  <h2 id="g-${g.id}-h">${esc(g.title)}</h2>
  <p class="sub">${esc(g.intro)}</p>
  <div class="shots gallery">
    ${site.screens.filter((x) => x.group === g.id).map(figure).join("\n    ")}
  </div>
</section>`,
    )
    .join("\n  ")}
  <div class="ctas center"><a class="btn" href="index.html">Back to the overview</a></div>
</section>
</main>`,
  );
writeFileSync(path.join(dist, "gallery.html"), gallery);
writeFileSync(path.join(dist, "feed.xml"), feed);
// GitHub Pages: serve the files as they are, without Jekyll.
writeFileSync(path.join(dist, ".nojekyll"), "");
console.log(`Built docs/ with ${updates.length} update(s)${drafts ? " (drafts included, preview only)" : ""}.`);
