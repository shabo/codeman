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
})();
