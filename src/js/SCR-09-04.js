(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({ screenId: "SCR-09-04", title: "お店編集", showUser: true });

  const form = document.getElementById("shop-edit-form");
  const errorEl = document.getElementById("shop-edit-error");
  const selectCategory = document.getElementById("select-category");
  const shops = c.getShops();
  const selectedId = c.getSelectedShopId();
  const found = c.findShopById(shops, selectedId);
  const shop = found ? found.row : null;

  async function loadCategoryOptions(selectedValue) {
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
      if (v === selectedValue) opt.selected = true;
      selectCategory.appendChild(opt);
    }
  }

  if (!shop) {
    errorEl.textContent = "編集対象データがありません。";
    form.querySelectorAll("input, select, textarea, button").forEach(function (el) {
      if (el.id !== "btn-edit-cancel") el.disabled = true;
    });
    loadCategoryOptions("");
  } else {
    form.elements["店名"].value = shop["店名"] || "";
    form.elements["場所"].value = shop["場所"] || "";
    form.elements["URL"].value = shop["URL"] || "";
    form.elements["営業時間"].value = shop["営業時間"] || "";
    form.elements["訪問歴"].value = shop["訪問歴"] || "";
    form.elements["予約可否"].value = shop["予約可否"] || "";
    form.elements["備考"].value = shop["備考"] || "";

    loadCategoryOptions(shop["カテゴリ"] || "");

    const confirmDialog = document.getElementById("confirm-dialog");
    const btnConfirmOk = document.getElementById("btn-confirm-ok");
    const btnConfirmCancel = document.getElementById("btn-confirm-cancel");

    btnConfirmCancel.addEventListener("click", function () {
      confirmDialog.setAttribute("hidden", "");
    });

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      errorEl.textContent = "";

      const fd = new FormData(form);
      const currentUser = c.getCurrentUser();

      const updated = {
        id: c.getShopId(shop, found.index),
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

      if (!updated["店名"]) {
        errorEl.textContent = "店名は必須です。";
        return;
      }

      confirmDialog.removeAttribute("hidden");
      btnConfirmOk.onclick = async function () {
        confirmDialog.setAttribute("hidden", "");
        try {
          await c.updateShop(c.encryptShopRecord(updated));
          shops[found.index] = updated;
          c.setShops(shops);
          c.setSelectedShopId(updated.id);
          c.setCompletionInfo({
            title: "お店編集完了",
            message: "お店情報が更新されました。",
            buttonLabel: "詳細に戻る",
            backScreen: "shopDetail"
          });
          c.navigate("completion");
        } catch (err) {
          errorEl.textContent = err && err.message ? err.message : "更新に失敗しました。";
        }
      };
    });
  }

  document.getElementById("btn-edit-cancel").addEventListener("click", function () {
    c.navigate("shopDetail");
  });
})();
