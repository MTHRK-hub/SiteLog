(function () {
  const c = window.SiteLogCommon;
  // 画面HTML分割のため、一覧→詳細の受け渡しは sessionStorage に保存して遷移する
  if (!c.requireLogin()) return;

  c.fillUserNames();
  c.bindLogoutButtons();
  c.bindNavButton("[data-action='menu']", "menu");
  c.bindNavButton("#btn-friend-create", "friendCreate");

  const status = document.getElementById("friend-load-status");
  const body = document.getElementById("friend-list-body");

  function render(rows) {
    body.innerHTML = "";
    rows.forEach(function (f, index) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td><button type='button' class='name-link' data-friend-index='" + index + "'>" + c.escapeHtml(f["名前"]) + "</button></td>" +
        "<td>" + c.escapeHtml(f["LINE名"]) + "</td>" +
        "<td>" + c.escapeHtml(f["年齢"]) + "</td>" +
        "<td>" + c.escapeHtml(f["性別"]) + "</td>" +
        "<td>" + c.escapeHtml(f["職業"]) + "</td>";
      body.appendChild(tr);
    });
    body.querySelectorAll("[data-friend-index]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        // 選択行インデックスを保存して詳細画面へ
        const index = Number(btn.getAttribute("data-friend-index"));
        c.setSelectedFriendIndex(index);
        c.setSelectedFriendId(c.getFriendId(rows[index], index));
        c.navigate("friendDetail");
      });
    });
  }

  (async function init() {
    // 表示のたびに最新を取りたいので、一覧画面遷移時に読み込む
    status.textContent = "友達データを読み込み中...";
    const result = await c.safeLoadSheetRows("friends");
    if (!result.ok) {
      status.textContent = result.message;
      render([]);
      return;
    }
    c.setFriends(result.rows);
    status.textContent = "友達データ " + result.rows.length + "件を表示中";
    render(result.rows);
  })();
})();
