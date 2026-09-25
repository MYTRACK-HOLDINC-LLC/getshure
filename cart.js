(function () {
  var KEY = "getshure_cart_v1";
  var FREE_SHIP = 40;

  var CATALOG = {
    screwed: {
      id: "screwed",
      title: "Don't Get Screwed by AI",
      price: 29,
      image: "covers/getshure-final-screwed.png?v=8",
      href: "product-screwed.html",
    },
    career: {
      id: "career",
      title: "Don't Get Replaced by AI",
      price: 29,
      image: "covers/getshure-final-career.jpg?v=12",
      href: "product-career.html",
    },
    family: {
      id: "family",
      title: "Keep Your Family Safe from AI",
      price: 29,
      image: "covers/getshure-final-family.png?v=9",
      href: "product-family.html",
    },
  };

  function read() {
    try {
      return JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    render();
  }

  function count(items) {
    return items.reduce(function (n, i) {
      return n + i.qty;
    }, 0);
  }

  function subtotal(items) {
    return items.reduce(function (n, i) {
      var p = CATALOG[i.id];
      return n + (p ? p.price * i.qty : 0);
    }, 0);
  }

  function ensureDrawer() {
    if (document.getElementById("cart-drawer")) return;
    var html =
      '<div class="cart-overlay" id="cart-overlay" hidden></div>' +
      '<aside class="cart-drawer" id="cart-drawer" aria-hidden="true" role="dialog" aria-label="Your cart">' +
      '  <div class="cart-drawer-head">' +
      "    <h2>Your cart</h2>" +
      '    <button type="button" class="cart-close" id="cart-close" aria-label="Close cart">&times;</button>' +
      "  </div>" +
      '  <div class="cart-drawer-body" id="cart-lines"></div>' +
      '  <div class="cart-drawer-foot" id="cart-foot"></div>' +
      "</aside>";
    document.body.insertAdjacentHTML("beforeend", html);
    document.getElementById("cart-overlay").addEventListener("click", close);
    document.getElementById("cart-close").addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") close();
    });
  }

  function open() {
    ensureDrawer();
    render();
    document.getElementById("cart-overlay").hidden = false;
    document.getElementById("cart-drawer").classList.add("is-open");
    document.getElementById("cart-drawer").setAttribute("aria-hidden", "false");
    document.body.classList.add("cart-open");
  }

  function close() {
    var ov = document.getElementById("cart-overlay");
    var dr = document.getElementById("cart-drawer");
    if (!dr) return;
    ov.hidden = true;
    dr.classList.remove("is-open");
    dr.setAttribute("aria-hidden", "true");
    document.body.classList.remove("cart-open");
  }

  function addSilent(id, qty) {
    qty = qty || 1;
    if (!CATALOG[id]) return;
    var items = read();
    var found = items.find(function (i) {
      return i.id === id;
    });
    if (found) found.qty += qty;
    else items.push({ id: id, qty: qty });
    write(items);
  }

  function add(id, qty) {
    addSilent(id, qty);
    open();
  }

  function addBundle(ids) {
    (ids || ["screwed", "career", "family"]).forEach(function (id) {
      addSilent(id, 1);
    });
    open();
  }

  function setQty(id, qty) {
    var items = read().filter(function (i) {
      if (i.id !== id) return true;
      if (qty <= 0) return false;
      i.qty = qty;
      return true;
    });
    write(items);
  }

  function render() {
    ensureDrawer();
    var items = read();
    var n = count(items);
    document.querySelectorAll("[data-cart-count], .cart").forEach(function (el) {
      if (el.classList.contains("cart") || el.hasAttribute("data-cart-count")) {
        var label = n === 0 ? "Cart (0)" : "Cart (" + n + ")";
        if (el.tagName === "BUTTON" || el.classList.contains("cart")) {
          el.textContent = label;
        } else {
          el.textContent = String(n);
        }
      }
    });

    var lines = document.getElementById("cart-lines");
    var foot = document.getElementById("cart-foot");
    if (!lines || !foot) return;

    if (!items.length) {
      lines.innerHTML =
        '<div class="cart-empty"><p>Your cart is empty.</p><a class="btn" href="index.html#shop">Continue shopping</a></div>';
      foot.innerHTML = "";
      return;
    }

    lines.innerHTML = items
      .map(function (i) {
        var p = CATALOG[i.id];
        if (!p) return "";
        return (
          '<div class="cart-line" data-id="' +
          p.id +
          '">' +
          '<a class="cart-line-img" href="' +
          p.href +
          '"><img src="' +
          p.image +
          '" alt="" width="72" height="96" /></a>' +
          '<div class="cart-line-meta">' +
          '<a href="' +
          p.href +
          '"><strong>' +
          p.title +
          "</strong></a>" +
          "<span>$" +
          p.price.toFixed(2) +
          "</span>" +
          '<div class="cart-qty">' +
          '<button type="button" data-qty="-1" aria-label="Decrease">−</button>' +
          "<span>" +
          i.qty +
          "</span>" +
          '<button type="button" data-qty="1" aria-label="Increase">+</button>' +
          "</div>" +
          '<button type="button" class="cart-remove" data-remove>Remove</button>' +
          "</div>" +
          '<div class="cart-line-total">$' +
          (p.price * i.qty).toFixed(2) +
          "</div>" +
          "</div>"
        );
      })
      .join("");

    lines.querySelectorAll(".cart-line").forEach(function (row) {
      var id = row.getAttribute("data-id");
      var item = items.find(function (x) {
        return x.id === id;
      });
      row.querySelectorAll("[data-qty]").forEach(function (btn) {
        btn.addEventListener("click", function () {
          var delta = parseInt(btn.getAttribute("data-qty"), 10);
          setQty(id, (item ? item.qty : 0) + delta);
        });
      });
      var rm = row.querySelector("[data-remove]");
      if (rm)
        rm.addEventListener("click", function () {
          setQty(id, 0);
        });
    });

    var sub = subtotal(items);
    var shipLeft = Math.max(0, FREE_SHIP - sub);
    var shipNote =
      shipLeft > 0
        ? "Add $" + shipLeft.toFixed(2) + " more for free US shipping"
        : "Free US shipping unlocked";

    foot.innerHTML =
      '<div class="cart-ship-bar"><div class="cart-ship-fill" style="width:' +
      Math.min(100, (sub / FREE_SHIP) * 100) +
      '%"></div></div>' +
      '<p class="cart-ship-note">' +
      shipNote +
      "</p>" +
      '<div class="cart-sub"><span>Subtotal</span><strong>$' +
      sub.toFixed(2) +
      "</strong></div>" +
      '<a class="btn cart-checkout" href="checkout.html">Checkout</a>' +
      '<button type="button" class="btn ghost cart-keep" id="cart-keep">Continue shopping</button>';

    var keep = document.getElementById("cart-keep");
    if (keep) keep.addEventListener("click", close);
  }

  function bindTriggers() {
    document.querySelectorAll("[data-add-cart]").forEach(function (btn) {
      if (btn._gsBound) return;
      btn._gsBound = true;
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var id = btn.getAttribute("data-add-cart");
        var qtyEl = document.querySelector("[data-qty-input]");
        var qty = qtyEl ? Math.max(1, parseInt(qtyEl.value, 10) || 1) : 1;
        add(id, qty);
      });
    });
    document.querySelectorAll("[data-add-bundle]").forEach(function (btn) {
      if (btn._gsBundleBound) return;
      btn._gsBundleBound = true;
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        var box = btn.closest(".fbt-box") || document;
        var checked = box.querySelectorAll("[data-fbt-id]:checked");
        var ids;
        if (checked.length) {
          ids = Array.prototype.map.call(checked, function (el) {
            return el.getAttribute("data-fbt-id");
          });
        } else {
          var raw = btn.getAttribute("data-add-bundle") || "screwed,career,family";
          ids = raw.split(",").map(function (s) {
            return s.trim();
          }).filter(Boolean);
        }
        if (!ids.length) return;
        addBundle(ids);
      });
    });

    document.querySelectorAll(".fbt-box").forEach(function (box) {
      if (box._gsFbtBound) return;
      box._gsFbtBound = true;
      function refreshFbt() {
        var checks = box.querySelectorAll("[data-fbt-id]");
        var n = 0;
        checks.forEach(function (el) {
          if (el.checked) n += 1;
        });
        var totalEl = box.querySelector(".fbt-total strong");
        var btn = box.querySelector("[data-add-bundle]");
        var save = box.querySelector(".fbt-save");
        if (totalEl) totalEl.textContent = "$" + (n * 29).toFixed(2);
        if (btn) {
          if (n <= 0) {
            btn.disabled = true;
            btn.textContent = "Select at least one book";
          } else if (n === 1) {
            btn.disabled = false;
            btn.textContent = "Add to cart";
          } else {
            btn.disabled = false;
            btn.textContent = "Add all " + n + " to cart";
          }
        }
        if (save) {
          save.textContent =
            n >= 2
              ? n + " hardcovers · free US shipping unlocked"
              : "Add another book for free US shipping ($40+)";
        }
      }
      box.querySelectorAll("[data-fbt-id]").forEach(function (el) {
        el.addEventListener("change", refreshFbt);
      });
      refreshFbt();
    });
    document.querySelectorAll(".cart, [data-open-cart]").forEach(function (el) {
      if (el._gsCartBound) return;
      el._gsCartBound = true;
      el.addEventListener("click", function (e) {
        e.preventDefault();
        open();
      });
    });
  }

  window.GetshureCart = {
    add: add,
    addBundle: addBundle,
    open: open,
    close: close,
    read: read,
    clear: function () { write([]); },
    catalog: CATALOG,
    subtotal: function () {
      return subtotal(read());
    },
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      ensureDrawer();
      bindTriggers();
      render();
    });
  } else {
    ensureDrawer();
    bindTriggers();
    render();
  }
})();
