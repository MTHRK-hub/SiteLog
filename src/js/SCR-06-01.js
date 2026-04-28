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
    extraScreen: "projectCreate",
    extraEnabled: true
  });

  const status = document.getElementById("project-load-status");
  const tbody = document.getElementById("project-list-body");
  let allProjects = [];
  const loginUser = c.getCurrentUser();
  const loginUserId = loginUser ? String(loginUser.id || "").trim() : "";

  // 日付文字列から "YYYY-MM" を抽出する
  function extractYm(dateStr) {
    const s = String(dateStr || "").trim();
    const m1 = /^(\d{4})[-\/](\d{1,2})/.exec(s);
    if (m1) return m1[1] + "-" + String(parseInt(m1[2], 10)).padStart(2, "0");
    const m2 = /^(\d{4})年(\d{1,2})月/.exec(s);
    if (m2) return m2[1] + "-" + String(parseInt(m2[2], 10)).padStart(2, "0");
    return "";
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
      options.push({ label: label, value: y + "-" + m });
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
          return extractYm(String(p["日付"] || "").trim()) === filterMonth;
        })
      : allProjects;

    status.textContent = "企画データ " + rows.length + "件を表示中";

    if (!rows.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center">データがありません</td></tr>';
      return;
    }

    tbody.innerHTML = rows.map(function (p) {
      const origIndex = allProjects.indexOf(p);
      const projectId = c.getProjectId(p, origIndex);
      return "<tr>" +
        "<td>" + c.escapeHtml(c.formatDate(p["日付"] || "")) + "</td>" +
        "<td>" + c.escapeHtml(p["場所"] || "") + "</td>" +
        "<td>" + c.escapeHtml(p["内容"] || "") + "</td>" +
        '<td><button type="button" class="btn btn-secondary btn-sm" data-project-id="' +
          c.escapeHtml(projectId) + '">詳細</button></td>' +
        "</tr>";
    }).join("");

    tbody.querySelectorAll("[data-project-id]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        c.setSelectedProjectId(btn.getAttribute("data-project-id"));
        c.navigate("projectDetail");
      });
    });
  }

  async function loadProjects() {
    status.textContent = "読み込み中...";
    const result = await c.safeLoadSheetRows("projects");
    if (!result.ok) {
      status.textContent = result.message || "企画情報を取得できませんでした。";
      return;
    }
    const filtered = loginUserId
      ? result.rows.filter(function (p) {
          return String(p["ユーザーID"] || "").trim() === loginUserId;
        })
      : result.rows;
    allProjects = filtered.map(function (p) { return c.decryptProjectRecord(p); });
    c.setProjects(allProjects);
    renderTable(document.getElementById("month-filter").value);
  }

  buildMonthOptions();
  loadProjects();
})();
