(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({ screenId: "SCR-06-05", title: "メッセージ設定", showUser: true });

  const currentUser = c.getCurrentUser();
  const inputMessage = document.getElementById("input-message");
  const loadError = document.getElementById("load-error");
  const formError = document.getElementById("form-error");
  const confirmDialog = document.getElementById("confirm-dialog");
  const btnConfirmOk = document.getElementById("btn-confirm-ok");
  const btnConfirmCancel = document.getElementById("btn-confirm-cancel");

  // ユーザー情報から現在のメッセージを取得して初期表示
  async function loadCurrentMessage() {
    const result = await c.safeLoadSheetRows("users");
    if (!result.ok) {
      loadError.textContent = result.message || "ユーザー情報を取得できませんでした。";
      return;
    }
    const userId = String(currentUser ? (currentUser.id || "") : "").trim();
    const userRow = result.rows.find(function (u) {
      const sheetId = c.normalizeAuthValue(u["ユーザーID"] || u["id"] || u["ID"] || "");
      return sheetId === userId;
    });
    if (userRow && userRow["メッセージ"]) {
      inputMessage.value = c.decrypt(userRow["メッセージ"]);
    }
  }

  loadCurrentMessage();

  document.getElementById("form-message").addEventListener("submit", function (e) {
    e.preventDefault();
    formError.textContent = "";
    confirmDialog.hidden = false;
  });

  btnConfirmOk.addEventListener("click", async function () {
    confirmDialog.hidden = true;
    formError.textContent = "";
    btnConfirmOk.disabled = true;

    try {
      const msgValue = inputMessage.value || "";
      const encrypted = msgValue ? c.encrypt(msgValue) : "";
      await c.updateUserMessage(String(currentUser ? (currentUser.id || "") : ""), encrypted);

      c.setCompletionInfo({
        title: "メッセージ設定完了",
        message: "メッセージが設定されました。",
        buttonLabel: "計画画面に戻る",
        backScreen: "projectPlan"
      });
      c.navigate("completion");
    } catch (err) {
      formError.textContent = err && err.message ? err.message : "更新に失敗しました。";
      btnConfirmOk.disabled = false;
    }
  });

  btnConfirmCancel.addEventListener("click", function () {
    confirmDialog.hidden = true;
  });

  document.getElementById("btn-cancel").addEventListener("click", function () {
    c.navigate("projectPlan");
  });
})();
