/* Site Studio shop (v2): add-to-cart, cart drawer, checkout.
   Prices come from the server at checkout — never from this page. */
(function () {
  var API = document.currentScript && document.currentScript.dataset.api;
  var SITE = document.currentScript && document.currentScript.dataset.site;
  if (!API) { var m = document.querySelector("[data-studio-shop-api]");
    if (m) { API = m.getAttribute("data-studio-shop-api");
             SITE = m.getAttribute("data-studio-shop-site"); } }
  var KEY = "studio-cart:" + (SITE || location.hostname);
  function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
                    catch (e) { return {}; } }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); }
                     catch (e) {} paint(); }
  function count(c) { var n = 0; for (var k in c) n += c[k].qty; return n; }
  function money(cents, cur) {
    try { return new Intl.NumberFormat(undefined,
      { style: "currency", currency: (cur || "USD").toUpperCase() })
      .format(cents / 100); } catch (e) { return (cents / 100).toFixed(2); }
  }
  var cur = document.body.getAttribute("data-studio-currency") || "usd";

  function paint() {
    var c = load(), n = count(c);
    document.querySelectorAll("[data-studio-cart]").forEach(function (b) {
      var badge = b.querySelector(".studio-cart-n");
      if (!badge) { badge = document.createElement("span");
        badge.className = "studio-cart-n";
        badge.style.cssText = "margin-left:.45em;font-weight:700;";
        b.appendChild(badge); }
      badge.textContent = n ? "(" + n + ")" : "";
    });
  }

  function drawer() {
    var c = load();
    var ov = document.createElement("div");
    ov.style.cssText = "position:fixed;inset:0;z-index:2147483000;background:rgba(0,0,0,.45);"
      + "display:flex;align-items:flex-start;justify-content:flex-end;";
    var panel = document.createElement("div");
    panel.style.cssText = "background:#fff;color:#111;width:380px;max-width:92vw;height:100%;"
      + "padding:20px;overflow:auto;font:15px/1.5 -apple-system,'Segoe UI',sans-serif;"
      + "box-shadow:-10px 0 40px rgba(0,0,0,.3);";
    var h = document.createElement("h3");
    h.textContent = "Your basket";
    h.style.cssText = "margin:0 0 12px;font-size:20px;";
    panel.appendChild(h);
    var ids = Object.keys(c);
    if (!ids.length) {
      var e = document.createElement("p"); e.textContent = "It's empty so far.";
      panel.appendChild(e);
    }
    var total = 0;
    ids.forEach(function (id) {
      var it = c[id];
      total += it.price * it.qty;
      var row = document.createElement("div");
      row.style.cssText = "display:flex;gap:10px;align-items:center;justify-content:space-between;"
        + "padding:10px 0;border-bottom:1px solid #eee;";
      var left = document.createElement("div");
      left.innerHTML = "";
      var nm = document.createElement("div"); nm.textContent = it.name;
      nm.style.fontWeight = "600";
      var pr = document.createElement("div"); pr.textContent = money(it.price, cur);
      pr.style.cssText = "font-size:13px;opacity:.7;";
      left.appendChild(nm); left.appendChild(pr);
      var ctl = document.createElement("div");
      ctl.style.cssText = "display:flex;gap:6px;align-items:center;";
      function step(d) {
        var cc = load();
        if (!cc[id]) return;
        cc[id].qty += d;
        if (cc[id].qty < 1) delete cc[id];
        save(cc); ov.remove(); drawer();
      }
      var minus = document.createElement("button"); minus.textContent = "−";
      var qty = document.createElement("span"); qty.textContent = it.qty;
      var plus = document.createElement("button"); plus.textContent = "+";
      [minus, plus].forEach(function (b) {
        b.style.cssText = "font:inherit;width:28px;height:28px;border:1px solid #ccc;"
          + "background:#fafafa;border-radius:6px;cursor:pointer;"; });
      minus.addEventListener("click", function () { step(-1); });
      plus.addEventListener("click", function () { step(1); });
      ctl.appendChild(minus); ctl.appendChild(qty); ctl.appendChild(plus);
      row.appendChild(left); row.appendChild(ctl);
      panel.appendChild(row);
    });
    if (ids.length) {
      var tot = document.createElement("p");
      tot.style.cssText = "margin:14px 0;font-weight:700;font-size:17px;";
      tot.textContent = "Total: " + money(total, cur);
      panel.appendChild(tot);
      var pay = document.createElement("button");
      pay.textContent = "Checkout";
      pay.style.cssText = "width:100%;padding:12px;border:0;border-radius:9px;"
        + "background:#111;color:#fff;font:600 15px sans-serif;cursor:pointer;";
      pay.addEventListener("click", function () {
        pay.disabled = true; pay.textContent = "Taking you to payment…";
        var cc = load();
        var items = Object.keys(cc).map(function (id) {
          return { id: id, qty: cc[id].qty }; });
        fetch(API + "checkout", { method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ site: SITE, items: items }) })
          .then(function (r) { return r.json(); })
          .then(function (j) {
            if (j.ok && j.url) { location.href = j.url; return; }
            pay.disabled = false; pay.textContent = "Checkout";
            alert(j.error || "Checkout isn't available right now.");
          })
          .catch(function () { pay.disabled = false; pay.textContent = "Checkout";
            alert("Checkout isn't available right now."); });
      });
      panel.appendChild(pay);
    }
    var close = document.createElement("button");
    close.textContent = "Keep shopping";
    close.style.cssText = "width:100%;margin-top:10px;padding:10px;border:1px solid #ddd;"
      + "border-radius:9px;background:#fff;font:inherit;cursor:pointer;";
    close.addEventListener("click", function () { ov.remove(); });
    panel.appendChild(close);
    ov.appendChild(panel);
    ov.addEventListener("click", function (e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
  }

  document.addEventListener("click", function (e) {
    var buy = e.target.closest && e.target.closest("[data-studio-buy]");
    if (buy) {
      e.preventDefault();
      var id = buy.getAttribute("data-studio-buy");
      var name = buy.getAttribute("data-name") || "Item";
      var price = parseInt(buy.getAttribute("data-price") || "0", 10);
      var c = load();
      c[id] = { qty: ((c[id] && c[id].qty) || 0) + 1, name: name, price: price };
      save(c);
      var was = buy.textContent;
      buy.textContent = "Added ✓";
      setTimeout(function () { buy.textContent = was; }, 1200);
      return;
    }
    var cart = e.target.closest && e.target.closest("[data-studio-cart]");
    if (cart) { e.preventDefault(); drawer(); }
  });
  paint();
})();

/* ---- showing prices in the reader's own currency ------------------------
   Their currency if we can tell where they are, otherwise the shop's. This
   only changes what is DISPLAYED. The charge is always in the shop's own
   currency, because there is no live exchange rate in this product and
   inventing one to bill somebody would be indefensible — so whenever an
   estimate is on screen, the page says so. */
(function () {
  var box = document.querySelector("[data-studio-currency]");
  var site = (document.body.getAttribute("data-studio-site") || "").trim();
  if (!site) return;
  var chosen = null;
  try { chosen = localStorage.getItem("ssCurrency"); } catch (e) {}

  function apply(data) {
    (data.products || []).forEach(function (p) {
      var els = document.querySelectorAll('[data-price-id="' + p.id + '"]');
      for (var n = 0; n < els.length; n++) els[n].textContent = p.shown_text;
    });
    var note = document.querySelector("[data-studio-currency-note]");
    if (note) note.textContent = data.note || "";
    if (!box || box.getAttribute("data-built")) return;
    box.setAttribute("data-built", "1");
    var sel = document.createElement("select");
    sel.setAttribute("aria-label", "Show prices in");
    (data.offer || []).forEach(function (code) {
      var o = document.createElement("option");
      o.value = code;
      o.textContent = code.toUpperCase() + (code === data.base ? "" : " (approx.)");
      sel.appendChild(o);
    });
    sel.value = data.showing;
    sel.addEventListener("change", function () {
      try { localStorage.setItem("ssCurrency", sel.value); } catch (e) {}
      load(sel.value);
    });
    box.appendChild(sel);
  }

  function load(currency) {
    var payload = { site: site };
    if (currency) payload.currency = currency;
    fetch("/__studio__/api/prices", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(function (r) { return r.json(); })
      .then(function (j) { if (j && j.ok) apply(j); })
      .catch(function () { /* the real prices are already on the page */ });
  }
  load(chosen);
})();
