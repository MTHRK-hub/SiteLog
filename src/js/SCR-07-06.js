(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({
    screenId: "SCR-07-06",
    title: "残高項目登録",
    showUser: true
  });

  const form = document.getElementById("stacked-create-form");
  const errorEl = document.getElementById("stacked-create-error");
  const confirmDialog = document.getElementById("confirm-dialog");
  const btnConfirmOk = document.getElementById("btn-confirm-ok");
  const btnConfirmCancel = document.getElementById("btn-confirm-cancel");

  const loginUser = c.getCurrentUser();
  const loginUserId = loginUser ? String(loginUser.id || "").trim() : "";

  btnConfirmCancel.addEventListener("click", function () {
    confirmDialog.hidden = true;
  });

  document.getElementById("btn-create-cancel").addEventListener("click", function () {
    c.navigate("stackedList");
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
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

    errorEl.textContent = "確認中...";
    const result = await c.safeLoadSheetRows("stacked", { allowEmpty: true });
    if (!result.ok) {
      errorEl.textContent = result.message || "残高情報を取得できませんでした。";
      return;
    }
    errorEl.textContent = "";

    const userRows = result.rows
      .filter(function (r) {
        return !loginUserId || String(r["ユーザーID"] || "").trim() === loginUserId;
      })
      .map(function (r) { return c.decryptStackedRecord(r); });

    const maxOrder = userRows.reduce(function (max, r) {
      const n = parseInt(String(r["表示順"] || "0"), 10);
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0);

    const maxId = result.rows.reduce(function (max, row) {
      const id = parseInt(String(row["id"] || ""), 10);
      return Number.isFinite(id) ? Math.max(max, id) : max;
    }, 0);

    const record = {
      id: String(maxId + 1),
      "項目": item,
      "表示順": String(maxOrder + 1),
      "残高": balanceRaw,
      "ユーザーID": loginUserId,
      "最終更新日時": new Date().toISOString().slice(0, 19).replace("T", " ")
    };

    confirmDialog.hidden = false;
    btnConfirmOk.onclick = async function () {
      confirmDialog.hidden = true;
      btnConfirmOk.onclick = null;
      errorEl.textContent = "登録中...";
      try {
        await c.appendStacked(c.encryptStackedRecord(record));
        c.setCompletionInfo({
          title: "残高項目登録完了",
          message: "残高項目が登録されました。",
          buttonLabel: "一覧に戻る",
          backScreen: "stackedList"
        });
        c.navigate("completion");
      } catch (err) {
        errorEl.textContent = err && err.message ? err.message : "登録に失敗しました。";
      }
    };
  });
})();
