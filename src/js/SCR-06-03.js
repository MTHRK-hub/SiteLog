(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({ screenId: "SCR-06-03", title: "企画登録", showUser: true });

  const form = document.getElementById("project-create-form");
  const errorEl = document.getElementById("project-create-error");

  function nextId(rows) {
    const maxId = rows.reduce(function (max, row, idx) {
      const id = Number(c.getProjectId(row, idx));
      return Number.isFinite(id) ? Math.max(max, id) : max;
    }, 0);
    return String(maxId + 1);
  }

  const confirmDialog = document.getElementById("confirm-dialog");
  const btnConfirmOk = document.getElementById("btn-confirm-ok");
  const btnConfirmCancel = document.getElementById("btn-confirm-cancel");

  btnConfirmCancel.addEventListener("click", function () {
    confirmDialog.setAttribute("hidden", "");
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorEl.textContent = "";

    const rows = c.getProjects();
    const fd = new FormData(form);
    const currentUser = c.getCurrentUser();
    const timeFrom = String(fd.get("時間From") || "").trim();
    const timeTo = String(fd.get("時間To") || "").trim();
    const time = timeFrom || timeTo
      ? timeFrom + "～" + timeTo
      : "";
    const record = {
      id: nextId(rows),
      "日付": String(fd.get("日付") || "").trim(),
      "時間": time,
      "場所": String(fd.get("場所") || "").trim(),
      "内容": String(fd.get("内容") || "").trim(),
      "説明": String(fd.get("説明") || "").trim(),
      "男性参加費": String(fd.get("男性参加費") || "").trim(),
      "女性参加費": String(fd.get("女性参加費") || "").trim(),
      "ユーザーID": currentUser ? String(currentUser.id || "") : "",
      "最終更新日時": new Date().toISOString().slice(0, 19).replace("T", " ")
    };

    if (!record["日付"]) {
      errorEl.textContent = "日付は必須です。";
      return;
    }

    confirmDialog.removeAttribute("hidden");
    btnConfirmOk.onclick = async function () {
      confirmDialog.setAttribute("hidden", "");
      try {
        await c.appendProject(c.encryptProjectRecord(record));
        rows.push(record);
        c.setProjects(rows);
        c.setCompletionInfo({
          title: "企画登録完了",
          message: "企画が登録されました。",
          buttonLabel: "一覧に戻る",
          backScreen: "projectPlan"
        });
        c.navigate("completion");
      } catch (err) {
        errorEl.textContent = err && err.message ? err.message : "登録に失敗しました。";
      }
    };
  });

  document.getElementById("btn-create-cancel").addEventListener("click", function () {
    c.navigate("projectPlan");
  });
})();
