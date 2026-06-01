(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({
    screenId: "SCR-07-08",
    title: "残高項目編集",
    showUser: true
  });

  const form = document.getElementById("stacked-edit-form");
  const errorEl = document.getElementById("stacked-edit-error");
  const confirmDialog = document.getElementById("confirm-dialog");
  const btnConfirmOk = document.getElementById("btn-confirm-ok");
  const btnConfirmCancel = document.getElementById("btn-confirm-cancel");

  const selectedId = c.getSelectedStackedItemId();
  let currentRecord = null;

  btnConfirmCancel.addEventListener("click", function () {
    confirmDialog.hidden = true;
  });

  document.getElementById("btn-edit-cancel").addEventListener("click", function () {
    c.navigate("stackedList");
  });

  async function loadItem() {
    if (!selectedId) {
      errorEl.textContent = "編集対象のデータがありません。";
      return;
    }
    errorEl.textContent = "読み込み中...";
    const result = await c.safeLoadSheetRows("stacked", { allowEmpty: true });
    if (!result.ok) {
      errorEl.textContent = result.message || "残高情報を取得できませんでした。";
      return;
    }
    const row = result.rows.find(function (r) {
      return String(r.id || "").trim() === String(selectedId).trim();
    });
    if (!row) {
      errorEl.textContent = "対象の残高項目が見つかりません。";
      return;
    }
    currentRecord = c.decryptStackedRecord(row);
    document.getElementById("stacked-item").value = currentRecord["項目"] || "";
    document.getElementById("stacked-balance").value = currentRecord["残高"] || "";
    errorEl.textContent = "";
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!currentRecord) return;

    errorEl.textContent = "";
    const item = document.getElementById("stacked-item").value.trim();
    const balanceRaw = document.getElementById("stacked-balance").value.trim();

    if (!item) {
      errorEl.textContent = "項目は必須です。";
      return;
    }
    if (!balanceRaw) {
      errorEl.textContent = "残高は必須です。";
      return;
    }

    confirmDialog.hidden = false;
    btnConfirmOk.onclick = async function () {
      confirmDialog.hidden = true;
      btnConfirmOk.onclick = null;
      errorEl.textContent = "更新中...";
      try {
        const record = Object.assign({}, currentRecord, {
          "項目": item,
          "残高": balanceRaw,
          "最終更新日時": new Date().toISOString().slice(0, 19).replace("T", " ")
        });
        await c.updateStacked(c.encryptStackedRecord(record));
        c.setCompletionInfo({
          title: "残高項目更新完了",
          message: "残高項目が更新されました。",
          buttonLabel: "一覧に戻る",
          backScreen: "stackedList"
        });
        c.navigate("completion");
      } catch (err) {
        errorEl.textContent = err && err.message ? err.message : "更新に失敗しました。";
      }
    };
  });

  loadItem();
})();
