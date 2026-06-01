(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({
    screenId: "SCR-07-06",
    title: "残高一覧",
    back: "cashflow-plan",
    showUser: true,
    extraId: "hdr-btn-stacked-create",
    extraLabel: "新規作成",
    extraScreen: "stackedCreate"
  });

  const loginUser = c.getCurrentUser();
  const loginUserId = loginUser ? String(loginUser.id || "").trim() : "";
  const tbody = document.getElementById("stacked-list-body");
  const statusEl = document.getElementById("stacked-list-status");

  function formatAmount(val) {
    const n = parseInt(String(val || "").replace(/[^0-9-]/g, ""), 10);
    if (!Number.isFinite(n)) return String(val || "");
    return "¥" + Math.abs(n).toLocaleString("ja-JP");
  }

  function render(rows) {
    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="3" style="text-align:center">データがありません</td></tr>';
      return;
    }
    tbody.innerHTML = rows.map(function (r) {
      return "<tr>" +
        "<td>" + c.escapeHtml(r["項目"] || "") + "</td>" +
        "<td class='amount-cell'>" + c.escapeHtml(formatAmount(r["残高"])) + "</td>" +
        "<td><button class='btn btn-secondary btn-edit-stacked' data-id='" + c.escapeHtml(String(r["id"] || "")) + "'>編集</button></td>" +
        "</tr>";
    }).join("");

    tbody.querySelectorAll(".btn-edit-stacked").forEach(function (btn) {
      btn.addEventListener("click", function () {
        c.setSelectedStackedItemId(btn.dataset.id);
        // 残高項目編集画面は後日実装
      });
    });
  }

  async function loadStacked() {
    statusEl.textContent = "読み込み中...";
    const result = await c.safeLoadSheetRows("stacked", { allowEmpty: true });
    if (!result.ok) {
      statusEl.textContent = result.message || "残高情報を取得できませんでした。";
      return;
    }
    const rows = result.rows
      .filter(function (r) {
        return !loginUserId || String(r["ユーザーID"] || "").trim() === loginUserId;
      })
      .sort(function (a, b) {
        const na = parseInt(String(a["表示順"] || "0"), 10);
        const nb = parseInt(String(b["表示順"] || "0"), 10);
        return na - nb;
      });
    statusEl.textContent = "";
    render(rows);
  }

  loadStacked();
})();
