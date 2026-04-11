(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({ screenId: "SCR-03-03", title: "友達登録", showUser: true });

  const form = document.getElementById("friend-create-form");
  const errorEl = document.getElementById("friend-create-error");

  function nextId(rows) {
    const maxId = rows.reduce(function (max, row, idx) {
      const id = Number(c.getFriendId(row, idx));
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

    const rows = c.getFriends();
    const fd = new FormData(form);
    const record = {
      id: nextId(rows),
      "名前": String(fd.get("名前") || "").trim(),
      "LINE名": String(fd.get("LINE名") || "").trim(),
      "年齢差": String(fd.get("年齢") || "").trim(),
      "生年月日": "",
      "性別": String(fd.get("性別") || "").trim(),
      "職業": String(fd.get("職業") || "").trim(),
      "出会った日": String(fd.get("出会った日") || "").trim(),
      "出会った場所": String(fd.get("出会った場所") || "").trim(),
      "相手の情報": String(fd.get("相手の情報") || "").trim(),
      "今後の予定": String(fd.get("今後の予定") || "").trim()
    };

    if (!record["名前"] || !record["LINE名"]) {
      errorEl.textContent = "名前とLINE名は必須です。";
      return;
    }

    // 確認ダイアログを表示
    confirmDialog.removeAttribute("hidden");
    btnConfirmOk.onclick = async function () {
      confirmDialog.setAttribute("hidden", "");
      try {
        await c.appendFriend(record);
        rows.push(record);
        c.setFriends(rows);
        c.setSelectedFriendId(record.id);
        c.setCompletionInfo({
          title: "友達登録完了",
          message: "友達情報が登録されました。",
          buttonLabel: "一覧に戻る",
          backScreen: "friendList"
        });
        c.navigate("completion");
      } catch (err) {
        errorEl.textContent = err && err.message ? err.message : "登録に失敗しました。";
      }
    };
  });

  document.getElementById("btn-create-cancel").addEventListener("click", function () {
    c.navigate("friendList");
  });
})();
