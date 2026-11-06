// Conveniences only: every link on the site works without this file. No network, no storage.
(() => {
  // Phone menu: closes after a choice, with Escape, and with a tap outside it.
  const menu = document.querySelector("details.menu");
  if (menu) {
    const summary = menu.querySelector("summary");
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) menu.open = false;
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && menu.open) {
        menu.open = false;
        summary.focus();
      }
    });
    document.addEventListener("click", (e) => {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
  }

  // Screenshot viewer: the picture full size with its caption, Previous, Next and Close.
  // Escape closes it (the dialog's own behaviour) and focus goes back to the screenshot.
  const viewer = document.querySelector("dialog.viewer");
  const shots = [...document.querySelectorAll("a[data-view]")];
  if (!viewer || typeof viewer.showModal !== "function" || shots.length === 0) return;
  const img = viewer.querySelector("img");
  const caption = viewer.querySelector("figcaption");
  const count = viewer.querySelector(".viewer-count");
  let at = 0;
  let opener = null;
  const show = (n) => {
    at = (n + shots.length) % shots.length;
    const link = shots[at];
    const thumb = link.querySelector("img");
    img.src = link.href;
    img.alt = thumb ? thumb.alt : "";
    const text = link.closest("figure")?.querySelector("figcaption");
    caption.replaceChildren(...(text ? [...text.childNodes].map((c) => c.cloneNode(true)) : []));
    count.textContent = `${at + 1} of ${shots.length}`;
  };
  shots.forEach((link, n) =>
    link.addEventListener("click", (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
      e.preventDefault();
      opener = link;
      show(n);
      viewer.showModal();
      viewer.querySelector("[data-close]").focus();
    }),
  );
  viewer.querySelector("[data-prev]").addEventListener("click", () => show(at - 1));
  viewer.querySelector("[data-next]").addEventListener("click", () => show(at + 1));
  viewer.querySelector("[data-close]").addEventListener("click", () => viewer.close());
  viewer.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(at - 1);
    if (e.key === "ArrowRight") show(at + 1);
  });
  viewer.addEventListener("click", (e) => {
    if (e.target === viewer) viewer.close();
  });
  viewer.addEventListener("close", () => {
    img.removeAttribute("src");
    opener?.focus();
  });
})();
