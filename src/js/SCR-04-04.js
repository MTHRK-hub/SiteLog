(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({ screenId: "SCR-04-04", title: "現場記録編集", showUser: true });

  const form = document.getElementById("site-edit-form");
  const errorEl = document.getElementById("site-edit-error");
  const rows = c.getSiteLogs();
  const selectedId = c.getSelectedSiteLogId();
  const found = c.findSiteLogById(rows, selectedId);

  const log = found ? c.decryptSiteLogRecord(found.row) : null;

  async function loadItemOptions(selectedValue) {
    const result = await c.safeLoadSheetRows("enums");
    const container = document.getElementById("item-radio-group");
    if (!result.ok) return;
    const row = result.rows.find(function (r) {
      return String(r["Enum名"] || "").trim() === "現場記録項目";
    });
    if (!row) return;
    for (let i = 1; i <= 15; i++) {
      const v = String(row["値" + i] || "").trim();
      if (!v) continue;
      const label = document.createElement("label");
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "項目";
      input.value = v;
      if (v === selectedValue) input.checked = true;
      label.appendChild(input);
      label.appendChild(document.createTextNode(v));
      container.appendChild(label);
    }
  }

  if (!log) {
    errorEl.textContent = "編集対象データがありません。";
    form.querySelectorAll("input, select, textarea, button").forEach(function (el) {
      if (el.id !== "btn-edit-cancel") el.disabled = true;
    });
    loadItemOptions("");
  } else {
    form.elements["日付"].value = log["日付"] || "";
    form.elements["記録"].value = log["記録"] || "";
    form.elements["ToDo"].value = log["ToDo"] || "";
    loadItemOptions(log["項目"] || "");

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
        id: c.getSiteLogId(log, found.index),
        "日付": String(fd.get("日付") || "").trim(),
        "項目": String(fd.get("項目") || "").trim(),
        "記録": String(fd.get("記録") || "").trim(),
        "ToDo": String(fd.get("ToDo") || "").trim(),
        "ユーザーID": currentUser ? String(currentUser.id || "") : "",
        "最終更新日時": new Date().toISOString().slice(0, 19).replace("T", " ")
      };

      if (!updated["日付"]) {
        errorEl.textContent = "日付は必須です。";
        return;
      }

      // 確認ダイアログを表示
      confirmDialog.removeAttribute("hidden");
      btnConfirmOk.onclick = async function () {
        confirmDialog.setAttribute("hidden", "");
        try {
          await c.updateSiteLog(c.encryptSiteLogRecord(updated));
          rows[found.index] = updated;
          c.setSiteLogs(rows);
          c.setSelectedSiteLogId(updated.id);
          c.setCompletionInfo({
            title: "現場記録編集完了",
            message: "現場記録が更新されました。",
            buttonLabel: "詳細に戻る",
            backScreen: "siteDetail"
          });
          c.navigate("completion");
        } catch (err) {
          errorEl.textContent = err && err.message ? err.message : "更新に失敗しました。";
        }
      };
    });
  }

  document.getElementById("btn-edit-cancel").addEventListener("click", function () {
    c.navigate("siteDetail");
  });
})();
