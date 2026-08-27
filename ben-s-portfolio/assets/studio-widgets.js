/* Site Studio widgets (v4): gallery lightbox + contact forms
   + slideshows + live footer year. Safe to edit or delete — recreated on
   the next save. */
(function () {
  // Footer years never go stale: anything marked data-studio-year always
  // shows the current year, so January doesn't age every site at once.
  var yrs = document.querySelectorAll("[data-studio-year]");
  for (var yi = 0; yi < yrs.length; yi++) {
    yrs[yi].textContent = new Date().getFullYear();
  }
  var style = document.createElement("style");
  style.textContent =
    ".sw-lb{position:fixed;inset:0;z-index:9999;background:rgba(10,12,14,.93);display:flex;" +
    "align-items:center;justify-content:center;flex-direction:column;cursor:zoom-out}" +
    ".sw-lb img{max-width:92vw;max-height:82vh;border-radius:8px;box-shadow:0 20px 60px rgba(0,0,0,.5)}" +
    ".sw-lb .sw-cap{color:#eee;font:14px/1.5 -apple-system,'Segoe UI',sans-serif;margin-top:12px;" +
    "max-width:80vw;text-align:center}" +
    ".sw-lb button{position:fixed;top:50%;transform:translateY(-50%);font-size:34px;background:none;" +
    "border:0;color:#fff;cursor:pointer;padding:18px;line-height:1}" +
    ".sw-lb .sw-prev{left:6px}.sw-lb .sw-next{right:6px}" +
    ".sw-lb .sw-close{top:18px;right:14px;transform:none;font-size:28px}" +
    "[data-gallery] img{cursor:zoom-in}" +
    ".sw-form-note{font-size:.95rem;opacity:.85;margin-top:.8rem}";
  document.head.appendChild(style);

  /* ---- gallery lightbox: click a photo, arrows / Esc to browse ---- */
  var imgs = [], idx = 0, box = null;
  function show(i) {
    idx = (i + imgs.length) % imgs.length;
    box.querySelector("img").src = imgs[idx].src;
    box.querySelector(".sw-cap").textContent = imgs[idx].alt || "";
  }
  function close() {
    if (box) { box.remove(); box = null; document.removeEventListener("keydown", onkey); }
  }
  function onkey(e) {
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") show(idx + 1);
    if (e.key === "ArrowLeft") show(idx - 1);
  }
  function open(list, i) {
    imgs = list;
    box = document.createElement("div");
    box.className = "sw-lb";
    box.innerHTML = '<img alt="" /><div class="sw-cap"></div>' +
      '<button class="sw-prev" aria-label="Previous">&#8249;</button>' +
      '<button class="sw-next" aria-label="Next">&#8250;</button>' +
      '<button class="sw-close" aria-label="Close">&#215;</button>';
    document.body.appendChild(box);
    box.addEventListener("click", function (e) {
      if (e.target.classList.contains("sw-prev")) { show(idx - 1); e.stopPropagation(); return; }
      if (e.target.classList.contains("sw-next")) { show(idx + 1); e.stopPropagation(); return; }
      close();
    });
    document.addEventListener("keydown", onkey);
    show(i);
  }
  document.addEventListener("click", function (e) {
    var im = e.target.closest && e.target.closest("[data-gallery] img");
    if (!im) return;
    var list = Array.prototype.slice.call(
      im.closest("[data-gallery]").querySelectorAll("img"));
    open(list, list.indexOf(im));
    e.preventDefault();
  });

  /* ---- slideshows (photos or rotating text) ---- */
  Array.prototype.forEach.call(
    document.querySelectorAll("[data-studio-carousel]"), function (car) {
      var kids = Array.prototype.slice.call(car.children);
      if (kids.length < 2) return;
      var interval = Math.max(1500, parseInt(car.getAttribute("data-interval"), 10) || 6000);
      var trans = (car.getAttribute("data-transition") || "fade").toLowerCase();
      var dur = parseInt(car.getAttribute("data-duration"), 10);
      if (isNaN(dur)) dur = 1200;
      var maxH = 0;
      kids.forEach(function (k) { maxH = Math.max(maxH, k.offsetHeight); });
      if (!car.style.aspectRatio && maxH) car.style.height = maxH + "px";
      if (getComputedStyle(car).position === "static") car.style.position = "relative";
      car.style.overflow = "hidden";
      kids.forEach(function (k, i) {
        k.style.position = "absolute";
        k.style.left = "0"; k.style.right = "0"; k.style.top = "0";
        k.style.margin = "0";
        if (k.tagName === "IMG") { k.style.height = "100%"; k.style.width = "100%"; k.style.objectFit = "cover"; }
        k.style.transition = trans === "instant" ? "none"
          : (trans === "slide"
            ? "transform " + dur + "ms ease, opacity " + dur + "ms ease"
            : "opacity " + dur + "ms ease");
        k.style.opacity = i === 0 ? "1" : "0";
        if (trans === "slide" && i !== 0) k.style.transform = "translateX(40px)";
      });
      var cur = 0;
      setInterval(function () {
        /* Inside the editor, slides hold still (and show expanded) so each
           one can be edited; they only take turns in Preview / live. */
        if (document.documentElement.classList.contains("studio-editing")) return;
        var prev = kids[cur];
        cur = (cur + 1) % kids.length;
        var next = kids[cur];
        prev.style.opacity = "0";
        if (trans === "slide") {
          prev.style.transform = "translateX(-40px)";
          next.style.transition = "none";
          next.style.transform = "translateX(40px)";
          void next.offsetWidth;
          next.style.transition = "transform " + dur + "ms ease, opacity " + dur + "ms ease";
          next.style.transform = "translateX(0)";
        }
        next.style.opacity = "1";
      }, interval);
    });

  /* ---- contact forms: send without leaving the page ---- */
  document.addEventListener("submit", function (e) {
    var f = e.target.closest && e.target.closest("form[data-studio-form]");
    if (!f) return;
    e.preventDefault();
    var data = {};
    Array.prototype.forEach.call(f.querySelectorAll("input,textarea"), function (el) {
      if (el.name) data[el.name] = el.value;
    });
    var note = f.querySelector(".sw-form-note");
    if (!note) { note = document.createElement("p"); note.className = "sw-form-note"; f.appendChild(note); }
    note.textContent = "Sending…";
    fetch(f.getAttribute("action"), {
      method: "POST",
      headers: { "Content-Type": "text/plain" },   /* simple request: no preflight */
      body: JSON.stringify(data),
    }).then(function (r) { return r.json(); }).then(function (r) {
      if (r && r.ok) { note.textContent = "Thank you — your message was sent."; f.reset(); }
      else { note.textContent = (r && r.error) || "Could not send — please email us directly."; }
    }).catch(function () {
      note.textContent = "Could not send — please email us directly.";
    });
  });
})();
