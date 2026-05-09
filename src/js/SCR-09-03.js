(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({ screenId: "SCR-09-03", title: "お店登録", showUser: true });

  const form = document.getElementById("shop-create-form");
  const errorEl = document.getElementById("shop-create-error");
  const selectCategory = document.getElementById("select-category");

  function nextId(rows) {
    const maxId = rows.reduce(function (max, row, idx) {
      const id = Number(c.getShopId(row, idx));
      return Number.isFinite(id) ? Math.max(max, id) : max;
    }, 0);
    return String(maxId + 1);
  }

  async function loadCategoryOptions() {
    const result = await c.safeLoadSheetRows("enums");
    if (!result.ok) return;
    const row = result.rows.find(function (r) {
      return String(r["Enum名"] || "").trim() === "お店カテゴリ";
    });
    if (!row) return;
    for (let i = 1; i <= 15; i++) {
      const v = String(row["値" + i] || "").trim();
      if (!v) continue;
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      selectCategory.appendChild(opt);
    }
  }

  loadCategoryOptions();

  const confirmDialog = document.getElementById("confirm-dialog");
  const btnConfirmOk = document.getElementById("btn-confirm-ok");
  const btnConfirmCancel = document.getElementById("btn-confirm-cancel");

  btnConfirmCancel.addEventListener("click", function () {
    confirmDialog.setAttribute("hidden", "");
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorEl.textContent = "";

    const rows = c.getShops();
    const fd = new FormData(form);
    const currentUser = c.getCurrentUser();

    const record = {
      id: nextId(rows),
      "店名": String(fd.get("店名") || "").trim(),
      "場所": String(fd.get("場所") || "").trim(),
      "カテゴリ": String(fd.get("カテゴリ") || "").trim(),
      "URL": String(fd.get("URL") || "").trim(),
      "営業時間": String(fd.get("営業時間") || "").trim(),
      "訪問歴": String(fd.get("訪問歴") || "").trim(),
      "予約可否": String(fd.get("予約可否") || "").trim(),
      "備考": String(fd.get("備考") || "").trim(),
      "ユーザーID": currentUser ? String(currentUser.id || "") : "",
      "最終更新日時": new Date().toISOString().slice(0, 19).replace("T", " ")
    };

    if (!record["店名"]) {
      errorEl.textContent = "店名は必須です。";
      return;
    }

    confirmDialog.removeAttribute("hidden");
    btnConfirmOk.onclick = async function () {
      confirmDialog.setAttribute("hidden", "");
      try {
        await c.appendShop(c.encryptShopRecord(record));
        rows.push(record);
        c.setShops(rows);
        c.setCompletionInfo({
          title: "お店登録完了",
          message: "お店情報が登録されました。",
          buttonLabel: "一覧に戻る",
          backScreen: "shopList"
        });
        c.navigate("completion");
      } catch (err) {
        errorEl.textContent = err && err.message ? err.message : "登録に失敗しました。";
      }
    };
  });

  document.getElementById("btn-create-cancel").addEventListener("click", function () {
    c.navigate("shopList");
  });
})();
