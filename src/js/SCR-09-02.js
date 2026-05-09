(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  const content = document.getElementById("shop-detail-content");
  const btnRegister = document.getElementById("btn-shop-register");
  const btnCancel = document.getElementById("btn-shop-cancel");
  const dialog = document.getElementById("register-dialog");
  const registerError = document.getElementById("register-error");

  const shops = c.getShops();
  const selectedId = c.getSelectedShopId();
  const found = selectedId ? c.findShopById(shops, selectedId) : null;
  const shop = found ? found.row : null;

  if (!shop) {
    c.updateParentHeader({
      screenId: "SCR-09-02",
      title: "お店詳細",
      back: "shop-list",
      showUser: true,
      extraId: "btn-shop-edit",
      extraLabel: "編集",
      extraEnabled: false
    });
    content.innerHTML = "<div class='detail-row'><dt>情報</dt><dd>対象データがありません。一覧に戻ってください。</dd></div>";
    btnRegister.disabled = true;
    return;
  }

  c.updateParentHeader({
    screenId: "SCR-09-02",
    title: "お店詳細",
    back: "shop-list",
    showUser: true,
    extraId: "btn-shop-edit",
    extraLabel: "編集",
    extraScreen: "shopEdit",
    extraEnabled: true
  });

  function row(label, value) {
    return "<div class='detail-row'><dt>" + c.escapeHtml(label) +
      "</dt><dd>" + c.escapeHtml(value || "") + "</dd></div>";
  }

  function shopNameRow(name, url) {
    const u = String(url || "").trim();
    if (!u) return row("店名", name);
    return "<div class='detail-row'><dt>店名</dt><dd>" +
      '<a class="name-link" href="' + c.escapeHtml(u) + '" target="_blank" rel="noopener">' +
      c.escapeHtml(String(name || "")) + "</a></dd></div>";
  }

  content.innerHTML =
    shopNameRow(shop["店名"], shop["URL"]) +
    row("場所", shop["場所"]) +
    row("カテゴリ", shop["カテゴリ"]) +
    row("営業時間", shop["営業時間"]) +
    row("訪問歴", shop["訪問歴"]) +
    row("予約可否", shop["予約可否"]) +
    row("備考", shop["備考"]);

  btnCancel.addEventListener("click", function () {
    c.navigate("shopList");
  });

  btnRegister.addEventListener("click", function () {
    registerError.textContent = "";
    dialog.hidden = false;
  });

  document.getElementById("btn-register-cancel").addEventListener("click", function () {
    dialog.hidden = true;
  });

  document.getElementById("btn-register-confirm").addEventListener("click", async function () {
    registerError.textContent = "";
    const btn = document.getElementById("btn-register-confirm");
    btn.disabled = true;
    dialog.hidden = true;

    try {
      await c.updateShop(c.encryptShopRecord(shop));
      c.navigate("shopList");
    } catch (err) {
      registerError.textContent = err && err.message ? err.message : "登録に失敗しました。";
      dialog.hidden = false;
      btn.disabled = false;
    }
  });
})();
