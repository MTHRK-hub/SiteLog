(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({
    screenId: "SCR-06-01",
    title: "自主企画計画",
    back: "menu",
    showUser: true,
    extraId: "btn-project-create",
    extraLabel: "新規作成",
    extraEnabled: false
  });

  const status = document.getElementById("project-load-status");
  const tbody = document.getElementById("project-list-body");
  let allProjects = [];

  // 企画情報の「年月」を "YYYY-MM" 形式に正規化する
  function normalizeYm(ym) {
    const m1 = /^(\d{4})年(\d{1,2})月$/.exec(ym);
    if (m1) return m1[1] + "-" + String(parseInt(m1[2], 10)).padStart(2, "0");
    const m2 = /^(\d{4})[/-](\d{1,2})$/.exec(ym);
    if (m2) return m2[1] + "-" + String(parseInt(m2[2], 10)).padStart(2, "0");
    return ym;
  }

  // 年月プルダウンの選択肢を生成（空 + 現在から前後2ヶ月）
  function buildMonthOptions() {
    const select = document.getElementById("month-filter");
    const now = new Date();
    const options = [{ label: "", value: "" }];
    for (let offset = -2; offset <= 2; offset++) {
      const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const label = y + "年" + String(d.getMonth() + 1) + "月";
      const value = y + "-" + m;
      options.push({ label: label, value: value });
    }
    options.forEach(function (opt) {
      const el = document.createElement("option");
      el.value = opt.value;
      el.textContent = opt.label;
      select.appendChild(el);
    });
    select.addEventListener("change", function () {
      renderTable(select.value);
    });
  }

  function renderTable(filterMonth) {
    const rows = filterMonth
      ? allProjects.filter(function (p) {
          return normalizeYm(String(p["年月"] || "").trim()) === filterMonth;
        })
      : allProjects;

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">データがありません</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(function (p) {
      return "<tr>" +
        "<td>" + c.escapeHtml(p["年月"] || "") + "</td>" +
        "<td>" + c.escapeHtml(p["場所"] || "") + "</td>" +
        "<td>" + c.escapeHtml(p["内容"] || "") + "</td>" +
        '<td><button type="button" class="btn btn-secondary btn-sm" disabled>詳細</button></td>' +
        "</tr>";
    }).join("");
  }

  async function loadProjects() {
    status.textContent = "読み込み中...";
    const result = await c.safeLoadSheetRows("projects");
    if (!result.ok) {
      status.textContent = result.message || "企画情報を取得できませんでした。";
      return;
    }
    allProjects = result.rows;
    status.textContent = "";
    renderTable("");
  }

  buildMonthOptions();
  loadProjects();
})();
