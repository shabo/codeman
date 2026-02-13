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

  // Pixel rocket: flies to GitHub then Patreon, drops cash, repeats.
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
    function center(el) {
      var r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    function dist(a, b) {
      var dx = b.x - a.x;
      var dy = b.y - a.y;
      return Math.sqrt(dx * dx + dy * dy);
    }
    function ang(a, b) {
      return Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    }
    function corner(w, h) {
      var pad = 70;
      var c = Math.floor(Math.random() * 4);
      if (c === 0) return { x: -pad, y: -pad };
      if (c === 1) return { x: w + pad, y: -pad };
      if (c === 2) return { x: -pad, y: h + pad };
      return { x: w + pad, y: h + pad };
    }

    var rocket = null;
    function ensureRocket() {
      if (rocket) return rocket;
      rocket = document.createElement("div");
      rocket.className = "rocket";
      rocket.setAttribute("aria-hidden", "true");
      rocket.innerHTML =
        '<svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">' +
          '<rect width="16" height="16" fill="none"/>' +
          '<rect x="7" y="1" width="2" height="1" fill="#eaf1ff"/>' +
          '<rect x="6" y="2" width="4" height="1" fill="#eaf1ff"/>' +
          '<rect x="5" y="3" width="6" height="1" fill="#eaf1ff"/>' +
          '<rect x="4" y="4" width="8" height="1" fill="#eaf1ff"/>' +
          '<rect x="4" y="5" width="8" height="5" fill="#b6c7ff"/>' +
          '<rect x="6" y="6" width="4" height="3" fill="#0b0f16"/>' +
          '<rect x="7" y="7" width="2" height="1" fill="#7bdff2"/>' +
          '<rect x="3" y="6" width="1" height="2" fill="#eaf1ff"/>' +
          '<rect x="12" y="6" width="1" height="2" fill="#eaf1ff"/>' +
          '<rect x="5" y="10" width="6" height="1" fill="#eaf1ff"/>' +
          '<rect x="6" y="11" width="4" height="1" fill="#eaf1ff"/>' +
          '<rect x="7" y="12" width="2" height="1" fill="#eaf1ff"/>' +
          '<rect x="7" y="13" width="2" height="1" fill="#ffd166"/>' +
          '<rect x="7" y="14" width="2" height="1" fill="#ff4d6d"/>' +
        "</svg>";
      document.body.appendChild(rocket);
      return rocket;
    }

    function spawnCash(x, y, count, symbol, hue) {
      for (var i = 0; i < count; i++) {
        var el = document.createElement("div");
        el.className = "cash";
        el.textContent = symbol;
        el.style.left = x + "px";
        el.style.top = y + "px";
        el.style.fontSize = (12 + Math.random() * 10) + "px";
        el.style.setProperty("--dx", ((Math.random() * 140) - 70) + "px");
        el.style.setProperty("--dy", ((Math.random() * 36) - 18) + "px");
        el.style.setProperty("--rot", ((Math.random() * 120) - 60) + "deg");
        if (typeof hue === "number") {
          el.style.color = "hsla(" + hue + ", 85%, 88%, 0.95)";
        }
        document.body.appendChild(el);
        el.addEventListener("animationend", function (e) {
          if (e && e.target && e.target.parentNode) e.target.parentNode.removeChild(e.target);
        });
      }
    }

    function runRocket() {
      if (reducedMotion()) return;

      // Prefer the "GitHub" button in the header (repo link).
      var githubBtn = qs('a[href*="github.com/shabo/codeman"]') || qs('a[href*="github.com/sponsors/shabo"]');
      var patreonBtn = qs('a[href*="patreon.com/shabers"]');
      if (!githubBtn || !patreonBtn) return;
      if (!inView(githubBtn) || !inView(patreonBtn)) return;

      var w = window.innerWidth || 0;
      var h = window.innerHeight || 0;

      var p0 = corner(w, h);
      var p1 = center(githubBtn);
      var p2 = center(patreonBtn);
      var p3 = corner(w, h);

      var speed = 0.75; // px/ms
      var d01 = Math.max(200, dist(p0, p1));
      var d12 = Math.max(220, dist(p1, p2));
      var d23 = Math.max(240, dist(p2, p3));
      var t01 = Math.round(d01 / speed);
      var t12 = Math.round(d12 / speed);
      var t23 = Math.round(d23 / speed);
      var total = t01 + t12 + t23;

      var el = ensureRocket();
      el.style.display = "block";

      function tf(p, rdeg) {
        return "translate3d(" + (p.x - 17) + "px," + (p.y - 17) + "px,0) rotate(" + rdeg + "deg)";
      }

      var a01 = ang(p0, p1);
      var a12 = ang(p1, p2);
      var a23 = ang(p2, p3);

      var anim = el.animate([
        { transform: tf(p0, a01), offset: 0 },
        { transform: tf(p1, a12), offset: t01 / total },
        { transform: tf(p2, a23), offset: (t01 + t12) / total },
        { transform: tf(p3, a23), offset: 1 }
      ], {
        duration: total,
        easing: "cubic-bezier(0.2, 0.9, 0.2, 1)",
        fill: "forwards"
      });

      setTimeout(function () {
        spawnCash(p1.x, p1.y, 10, "$", 190);
      }, t01);
      setTimeout(function () {
        spawnCash(p2.x, p2.y, 12, "$", 340);
        spawnCash(p2.x + 10, p2.y + 6, 6, "💰", null);
      }, t01 + t12);

      anim.onfinish = function () {
        el.style.display = "none";
      };
    }

    // First run shortly after load, then loop.
    setTimeout(runRocket, 1600);
    setInterval(runRocket, 15000);
  })();
})();
