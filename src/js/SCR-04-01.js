(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  // 新規登録ボタンはヘッダ (SCR-00-01) に定義
  c.updateParentHeader({
    screenId: "SCR-04-01",
    title: "現場記録一覧",
    back: "menu",
    showUser: true,
    extraId: "btn-site-create",
    extraLabel: "新規登録",
    extraScreen: "siteCreate"
  });

  const status = document.getElementById("site-load-status");
  const body = document.getElementById("site-list-body");
  const itemFilter = document.getElementById("item-filter");

  let allFiltered = [];

  function render(rows) {
    body.innerHTML = "";
    if (!rows.length) {
      body.innerHTML = '<tr><td colspan="3" style="text-align:center">データがありません</td></tr>';
      return;
    }
    rows.forEach(function (log) {
      const allIdx = allFiltered.indexOf(log);
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + c.escapeHtml(c.formatDate(log["日付"])) + "</td>" +
        "<td>" + c.escapeHtml(log["項目"]) + "</td>" +
        "<td><button type='button' class='btn-detail'>詳細</button></td>";
      tr.querySelector(".btn-detail").addEventListener("click", function () {
        c.setSelectedSiteLogIndex(allIdx);
        c.setSelectedSiteLogId(c.getSiteLogId(log, allIdx));
        c.navigate("siteDetail");
      });
      body.appendChild(tr);
    });
  }

  function applyFilter() {
    const sel = itemFilter.value;
    const visible = sel
      ? allFiltered.filter(function (r) { return r["項目"] === sel; })
      : allFiltered;
    status.textContent = "現場記録データ " + visible.length + "件を表示中";
    render(visible);
  }

  itemFilter.addEventListener("change", applyFilter);

  (async function init() {
    status.textContent = "現場記録データを読み込み中...";
    const result = await c.safeLoadSheetRows("siteLogs");
    if (!result.ok) {
      status.textContent = result.message;
      render([]);
      return;
    }
    const decryptedRows = result.rows.map(function (r) { return c.decryptSiteLogRecord(r); });
    c.setSiteLogs(decryptedRows);
    const loginUser = c.getCurrentUser();
    const loginUserId = loginUser ? String(loginUser.id || "") : "";
    const filtered = decryptedRows.filter(function (r) {
      return String(r["ユーザーID"] || "").trim() === loginUserId;
    });
    filtered.sort(function (a, b) {
      return String(b["日付"] || "").localeCompare(String(a["日付"] || ""));
    });
    allFiltered = filtered;
    applyFilter();
  })();
})();
