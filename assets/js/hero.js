(() => {
  const hero = document.querySelector("[data-hero-crossfade]");
  if (!hero) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Prefer explicit per-hero override: <section data-hero-crossfade data-hero-baseurl="/assets/images/hero">
  // Otherwise use site baseurl (Jekyll-safe) if you expose it on <html data-baseurl="{{ site.baseurl }}">
  const htmlBase = document.documentElement.dataset.baseurl || "";
  const attrBase = hero.getAttribute("data-hero-baseurl") || hero.dataset.heroBaseurl || "";

  // If you pass a full URL by mistake, we still allow it — but we won't *force* absolute URLs.
  const rawBase = attrBase || `${htmlBase}/assets/images/hero`;

  // Normalize: ensure exactly one leading slash for root-relative paths, remove trailing slash.
  const normalizePath = (p) => {
    if (!p) return "";
    // Keep absolute URLs as-is (https://...), just trim trailing slash
    if (/^https?:\/\//i.test(p)) return p.replace(/\/+$/, "");
    // Root-relative: ensure leading slash, collapse duplicate slashes, trim trailing slash
    const withLeading = p.startsWith("/") ? p : `/${p}`;
    return withLeading.replace(/\/{2,}/g, "/").replace(/\/+$/, "");
  };

  const base = normalizePath(rawBase);

  const buildUrl = (filename) => `${base}/${filename}`.replace(/\/{2,}/g, "/");

  // SINGLE SOURCE OF TRUTH: set your hero images here
  const images = [
    buildUrl("hero-01.jpg"),
    buildUrl("hero-02.jpg"),
    buildUrl("hero-03.jpg"),
    buildUrl("hero-04.jpg"),
    // buildUrl("hero-05.jpg"),
  ].filter(Boolean);

  if (images.length === 0) return;

  // Timing (SST)
  const FADE_MS = 1600;           // must match CSS opacity transition
  const HOLD_MS = 7000;           // time fully visible before switching
  const SLIDE_MS = FADE_MS + HOLD_MS;
  const KB_DUR_MS = SLIDE_MS + 800; // a touch longer so motion doesn't "snap" at swap

  // Gentle motion presets (keep small: background-only)
  const moves = [
    { xTo: "-2%",   yTo: "-2%"   },
    { xTo: "2%",    yTo: "-1.5%" },
    { xTo: "-1.5%", yTo: "2%"    },
    { xTo: "1.5%",  yTo: "1.2%"  },
  ];

  // Find the base layer or create one
  let layerA = hero.querySelector(".hero__bg");
  if (!layerA) {
    layerA = document.createElement("div");
    layerA.className = "hero__bg";
    hero.prepend(layerA);
  }

  // Create (or reuse) second layer for crossfade
  let layerB = hero.querySelector(".hero__bg--b");
  if (!layerB || layerB === layerA) {
    layerB = document.createElement("div");
    layerB.className = "hero__bg hero__bg--b";
    hero.insertBefore(layerB, layerA.nextSibling);
  }

  const layers = [layerA, layerB];

  const setBg = (el, url) => {
    el.style.backgroundImage = `url("${url}")`;
  };

  const setKenBurnsVars = (el, moveIndex) => {
    const m = moves[moveIndex % moves.length];
    el.style.setProperty("--kb-scale-from", "1.03");
    el.style.setProperty("--kb-scale-to", "1.10");
    el.style.setProperty("--kb-x-from", "0%");
    el.style.setProperty("--kb-y-from", "0%");
    el.style.setProperty("--kb-x-to", m.xTo);
    el.style.setProperty("--kb-y-to", m.yTo);
    el.style.setProperty("--kb-dur", `${KB_DUR_MS}ms`);
  };

  const startAnim = (el) => {
    el.classList.add("is-animating");
    el.style.animation = "none";
    void el.offsetHeight; // force reflow
    el.style.animation = "";
  };

  const stopAnim = (el) => {
    el.classList.remove("is-animating");
    el.style.animation = "";
  };

  const showLayer = (el) => el.classList.add("is-visible");
  const hideLayer = (el) => el.classList.remove("is-visible");

  // Preload images to avoid black flashes
  const preload = (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });

  let idx = 0;
  let showing = 0; // 0 -> layerA, 1 -> layerB

  const init = async () => {
    await preload(images[0]);

    setBg(layers[0], images[0]);
    setKenBurnsVars(layers[0], 0);
    showLayer(layers[0]);
    if (!reduceMotion) startAnim(layers[0]);

    if (images.length < 2) return;

    setInterval(async () => {
      const incoming = layers[1 - showing];
      const outgoing = layers[showing];

      idx = (idx + 1) % images.length;
      const nextUrl = images[idx];

      await preload(nextUrl);

      setBg(incoming, nextUrl);
      setKenBurnsVars(incoming, idx);
      showLayer(incoming);

      if (!reduceMotion) startAnim(incoming);

      setTimeout(() => {
        hideLayer(outgoing);
        stopAnim(outgoing);
      }, FADE_MS + 50);

      showing = 1 - showing;
    }, SLIDE_MS);
  };

  init();
})();
