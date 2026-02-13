/* Minimal JS: copy buttons and version readout (no frameworks). */
(function () {
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
})();

