(() => {
  const hero = document.querySelector("[data-hero-crossfade]");
  if (!hero) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // SINGLE SOURCE OF TRUTH: set your hero images here
  const images = [
    "/assets/images/hero/hero-01.jpg",
    "/assets/images/hero/hero-02.jpg",
    "/assets/images/hero/hero-03.jpg",
    "/assets/images/hero/hero-04.jpg",
    // "/assets/images/hero/hero-05.jpg",
  ].filter(Boolean);

  if (images.length === 0) return;

  // Timing (SST)
  const FADE_MS = 1600;       // must match CSS opacity transition
  const HOLD_MS = 7000;       // time fully visible before switching
  const SLIDE_MS = FADE_MS + HOLD_MS;
  const KB_DUR_MS = SLIDE_MS + 800; // a touch longer so motion doesn't "snap" at swap

  // Gentle motion presets (keep small: background-only)
  const moves = [
    { xTo: "-2%",  yTo: "-2%"  },
    { xTo: "2%",   yTo: "-1.5%"},
    { xTo: "-1.5%",yTo: "2%"   },
    { xTo: "1.5%", yTo: "1.2%" },
  ];

  // Find the base layer or create one
  let layerA = hero.querySelector(".hero__bg");
  if (!layerA) {
    layerA = document.createElement("div");
    layerA.className = "hero__bg";
    hero.prepend(layerA);
  }

  // Create second layer for crossfade
  const layerB = document.createElement("div");
  layerB.className = "hero__bg";
  hero.insertBefore(layerB, layerA.nextSibling);

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
    // Restart animation cleanly by toggling
    el.style.animation = "none";
    // force reflow
    void el.offsetHeight;
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

    // If only one image, nothing else to do
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

      // Let the fade finish, then stop animating outgoing so it doesn't keep burning CPU
      setTimeout(() => {
        hideLayer(outgoing);
        stopAnim(outgoing);
      }, FADE_MS + 50);

      showing = 1 - showing;
    }, SLIDE_MS);
  };

  init();
})();
