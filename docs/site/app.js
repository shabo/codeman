/* Minimal JS: copy buttons and version readout (no frameworks). */
(function () {
  function isModifiedClick(e) {
    // Let the browser do its thing (new tab/window, context menu, etc).
    return e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    try {
      document.execCommand("copy");
    } finally {
      document.body.removeChild(ta);
    }
    return Promise.resolve();
  }

  document.querySelectorAll("[data-copy]").forEach(function (wrap) {
    var btn = wrap.querySelector(".copy");
    var code = wrap.querySelector("pre code");
    if (!btn || !code) return;
    btn.addEventListener("click", function () {
      var text = code.textContent || "";
      copyText(text).then(function () {
        var prev = btn.textContent;
        btn.textContent = "Copied";
        btn.disabled = true;
        setTimeout(function () {
          btn.textContent = prev;
          btn.disabled = false;
        }, 900);
      });
    });
  });

  // Pull version from the page itself if it changes.
  var v = document.getElementById("version");
  if (v && v.textContent) {
    document.title = "Codeman " + v.textContent.trim();
  }

  // Lightbox for screenshots: accessible, ESC to close, click outside to close.
  var lb = null;
  var lbImg = null;
  var lbTitle = null;
  var lbCap = null;
  var lbClose = null;
  var lastFocus = null;

  function ensureLightbox() {
    if (lb) return;

    lb = document.createElement("div");
    lb.className = "lb";
    lb.hidden = true;
    lb.setAttribute("role", "dialog");
    lb.setAttribute("aria-modal", "true");
    lb.setAttribute("aria-label", "Screenshot viewer");

    var panel = document.createElement("div");
    panel.className = "lb__panel";
    panel.addEventListener("click", function (e) { e.stopPropagation(); });

    var bar = document.createElement("div");
    bar.className = "lb__bar";

    lbTitle = document.createElement("div");
    lbTitle.className = "lb__title";
    lbTitle.textContent = "Screenshot";

    lbClose = document.createElement("button");
    lbClose.className = "lb__close";
    lbClose.type = "button";
    lbClose.textContent = "Close (Esc)";
    lbClose.addEventListener("click", function () { closeLightbox(); });

    bar.appendChild(lbTitle);
    bar.appendChild(lbClose);

    var body = document.createElement("div");
    body.className = "lb__body";

    lbImg = document.createElement("img");
    lbImg.className = "lb__img";
    lbImg.alt = "";
    body.appendChild(lbImg);

    lbCap = document.createElement("div");
    lbCap.className = "lb__cap";
    lbCap.textContent = "";

    panel.appendChild(bar);
    panel.appendChild(body);
    panel.appendChild(lbCap);
    lb.appendChild(panel);
    document.body.appendChild(lb);

    lb.addEventListener("click", function () { closeLightbox(); });

    document.addEventListener("keydown", function (e) {
      if (!lb || lb.hidden) return;
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
        return;
      }
      // Minimal focus trap: keep focus on the close button.
      if (e.key === "Tab" && lbClose) {
        e.preventDefault();
        lbClose.focus();
      }
    });
  }

  function openLightbox(linkEl) {
    ensureLightbox();
    lastFocus = document.activeElement;

    var href = linkEl.getAttribute("href") || "";
    var imgEl = linkEl.querySelector("img");
    var alt = (imgEl && imgEl.getAttribute("alt")) || "Screenshot";

    var cap = "";
    var fig = linkEl.closest("figure");
    if (fig) {
      var fc = fig.querySelector("figcaption");
      if (fc && fc.textContent) cap = fc.textContent.trim();
    }

    var title = linkEl.getAttribute("aria-label") || cap || "Screenshot";
    title = title.replace(/^Open screenshot:\s*/i, "");

    lbTitle.textContent = title;
    lbImg.src = href;
    lbImg.alt = alt;
    lbCap.textContent = cap || alt;

    document.body.classList.add("noscroll");
    lb.hidden = false;
    lbClose.focus();
  }

  function closeLightbox() {
    if (!lb || lb.hidden) return;
    lb.hidden = true;
    document.body.classList.remove("noscroll");
    // Avoid flash of previous image when re-opened; keep it simple.
    if (lbImg) lbImg.src = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    lastFocus = null;
  }

  document.querySelectorAll("a[data-lightbox]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      if (isModifiedClick(e)) return;
      // If the lightbox can't initialize for some reason, fall back to the link target.
      try {
        e.preventDefault();
        openLightbox(a);
      } catch (_) {
        // no-op
      }
    });
  });

  // Money bag drop: lands on GitHub Sponsors, fades; then lands on Patreon, fades.
  (function () {
    var mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    function reducedMotion() { return !!(mq && mq.matches); }

    function qs(sel) { return document.querySelector(sel); }
    function inView(el) {
      if (!el) return false;
      var r = el.getBoundingClientRect();
      var w = window.innerWidth || 0;
      var h = window.innerHeight || 0;
      return r.bottom > 0 && r.right > 0 && r.top < h && r.left < w;
    }
    function topCenter(el) {
      var r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top };
    }
    var running = false;

    function sleep(ms) {
      return new Promise(function (resolve) { setTimeout(resolve, ms); });
    }

    var bag = null;
    function ensureEls() {
      if (!bag) {
        bag = document.createElement("div");
        bag.className = "moneybag";
        bag.setAttribute("aria-hidden", "true");
        bag.textContent = "💰";
        document.body.appendChild(bag);
      }
    }

    function measureBag() {
      // Emoji glyphs can render taller than font-size; measure actual box.
      ensureEls();
      var prevDisplay = bag.style.display;
      var prevLeft = bag.style.left;
      var prevTop = bag.style.top;
      var prevVis = bag.style.visibility;
      var prevOpacity = bag.style.opacity;

      bag.style.visibility = "hidden";
      bag.style.opacity = "0";
      bag.style.display = "block";
      bag.style.left = "-9999px";
      bag.style.top = "-9999px";

      var r = bag.getBoundingClientRect();

      bag.style.display = prevDisplay;
      bag.style.left = prevLeft;
      bag.style.top = prevTop;
      bag.style.visibility = prevVis;
      bag.style.opacity = prevOpacity;

      // Fallback to 30 if measurement fails.
      return { w: r.width || 30, h: r.height || 30 };
    }

    function animateDropTo(targetEl) {
      ensureEls();
      var p = topCenter(targetEl);
      // Land on the *top edge* of the pill, not the center.
      var m = measureBag();
      // Slight overlap (1px) so it reads as "landing on" the pill.
      var landY = p.y + 1 - (m.h / 2);
      var start = { x: p.x + ((Math.random() * 40) - 20), y: -40 };
      var end = { x: p.x, y: landY };
      var dx = start.x - end.x;
      var dy = start.y - end.y;

      bag.style.display = "block";
      bag.style.left = end.x + "px";
      bag.style.top = end.y + "px";
      bag.style.opacity = "1";

      var drop = bag.animate([
        { transform: "translate3d(" + dx + "px," + dy + "px,0) translate(-50%, -50%) scale(0.95)", offset: 0 },
        { transform: "translate3d(0px,0px,0) translate(-50%, -50%) scale(1.07)", offset: 0.82 },
        { transform: "translate3d(0px,0px,0) translate(-50%, -50%) scale(1)", offset: 1 }
      ], {
        duration: 920,
        easing: "cubic-bezier(0.2, 0.9, 0.25, 1)",
        fill: "forwards"
      });

      return new Promise(function (resolve) {
        drop.onfinish = function () {
          resolve();
        };
      });
    }

    function fadeBagOut() {
      if (!bag) return Promise.resolve();
      var a = bag.animate([
        { opacity: 1, transform: "translate(-50%, -50%) scale(1)" },
        { opacity: 0, transform: "translate(-50%, -50%) translateY(-10px) scale(0.98)" }
      ], { duration: 1400, easing: "ease-out", fill: "forwards" });
      return new Promise(function (resolve) {
        a.onfinish = function () {
          bag.style.display = "none";
          resolve();
        };
      });
    }

    function dropOnce(targetEl) {
      if (reducedMotion()) return;
      if (running) return;
      running = true;

      animateDropTo(targetEl)
        .then(function () { return sleep(160); })
        .then(function () { return fadeBagOut(); })
        .then(function () {
          running = false;
        })
        .catch(function () {
          if (bag) bag.style.display = "none";
          running = false;
        });
    }

    function tickFactory() {
      var onGitHub = true;
      return function tick() {
        // Use the pills under the logo if present (preferred), else fall back.
        var githubBtn = qs(".kpi--sponsor") || qs('a[href*="github.com/sponsors/shabo"]') || qs('a[href*="github.com/shabo/codeman"]');
        var patreonBtn = qs(".kpi--patreon") || qs('a[href*="patreon.com/shabers"]');
        if (!githubBtn || !patreonBtn) return;
        if (!inView(githubBtn) || !inView(patreonBtn)) return;

        dropOnce(onGitHub ? githubBtn : patreonBtn);
        onGitHub = !onGitHub;
      };
    }

    // Every 3s: GitHub, then Patreon, repeating.
    var tick = tickFactory();
    setTimeout(tick, 900);
    setInterval(tick, 3000);
  })();
})();
