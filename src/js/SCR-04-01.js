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
  c.enableTablePaging(body); // 先頭50件のみ表示（共通仕様）
  const itemFilter = document.getElementById("item-filter");

  let allFiltered = [];

  // 概要：「日付」＋半角スペース＋「記録」の文字列の先頭25文字（改行は空白に置き換える）
  function buildSummary(log) {
    const text = c.formatDate(log["日付"]) + " " + String(log["記録"] || "").replace(/\r?\n/g, " ");
    return Array.from(text).slice(0, 25).join("");
  }

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
        "<td><button type='button' class='btn btn-secondary'>詳細</button></td>" +
        "<td>" + c.escapeHtml(log["項目"]) + "</td>" +
        "<td>" + c.escapeHtml(buildSummary(log)) + "</td>";
      tr.querySelector(".btn-secondary").addEventListener("click", function () {
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

  async function loadItemFilterOptions() {
    const result = await c.safeLoadSheetRows("enums");
    if (!result.ok) return;
    const row = result.rows.find(function (r) {
      return String(r["Enum名"] || "").trim() === "現場記録項目";
    });
    if (!row) return;
    for (let i = 1; i <= 15; i++) {
      const v = String(row["値" + i] || "").trim();
      if (!v) continue;
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      itemFilter.appendChild(opt);
    }
  }

  (async function init() {
    loadItemFilterOptions();
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
