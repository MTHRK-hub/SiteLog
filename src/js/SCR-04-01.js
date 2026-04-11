(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.fillUserNames();
  c.bindLogoutButtons();
  c.bindNavButton("[data-action='menu']", "menu");
  c.bindNavButton("#btn-site-create", "siteCreate");

  const status = document.getElementById("site-load-status");
  const body = document.getElementById("site-list-body");

  function render(rows) {
    body.innerHTML = "";
    rows.forEach(function (log, index) {
      const tr = document.createElement("tr");
      tr.innerHTML =
        "<td>" + c.escapeHtml(c.formatDate(log["日付"])) + "</td>" +
        "<td>" + c.escapeHtml(log["項目"]) + "</td>" +
        "<td><button type='button' class='btn-detail' data-log-index='" + index + "'>詳細</button></td>";
      body.appendChild(tr);
    });
    body.querySelectorAll("[data-log-index]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        const idx = Number(btn.getAttribute("data-log-index"));
        c.setSelectedSiteLogIndex(idx);
        c.setSelectedSiteLogId(c.getSiteLogId(rows[idx], idx));
        c.navigate("siteDetail");
      });
    });
  }

  (async function init() {
    status.textContent = "現場記録データを読み込み中...";
    const result = await c.safeLoadSheetRows("siteLogs");
    if (!result.ok) {
      status.textContent = result.message;
      render([]);
      return;
    }
    c.setSiteLogs(result.rows);
    status.textContent = "現場記録データ " + result.rows.length + "件を表示中";
    render(result.rows);
  })();
})();
