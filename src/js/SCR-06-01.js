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
        "<td>" + c.escapeHtml(p["時間"] || "") + "</td>" +
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
    allProjects = filtered.map(function (p) {
      var decrypted = c.decryptProjectRecord(p);
      // シートの旧カラム名「年月」→「日付」の後方互換対応
      if (!decrypted["日付"] && p["年月"]) {
        decrypted["日付"] = String(p["年月"]).trim();
      }
      return decrypted;
    });
    // 月の降順・日の昇順でソート
    allProjects.sort(function (a, b) {
      var parseDate = function (p) {
        var s = String(p["日付"] || "").trim();
        var m = /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/.exec(s);
        if (m) return { month: parseInt(m[2], 10), day: parseInt(m[3], 10) };
        return { month: 0, day: 0 };
      };
      var da = parseDate(a), db = parseDate(b);
      if (da.month !== db.month) return db.month - da.month;
      return da.day - db.day;
    });
    c.setProjects(allProjects);
    renderTable(document.getElementById("month-filter").value);
  }

  document.getElementById("btn-msg-setting").addEventListener("click", function () {
    c.navigate("projectMessageSetting");
  });

  // ===== メッセージ表示ポップアップ =====
  const msgPopup = document.getElementById("msg-popup");
  const msgPopupContent = document.getElementById("msg-popup-content");
  let cachedUserMessage = null;

  async function getUserMessage() {
    if (cachedUserMessage !== null) return cachedUserMessage;
    const result = await c.safeLoadSheetRows("users");
    if (!result.ok) { cachedUserMessage = ""; return ""; }
    const userRow = result.rows.find(function (u) {
      return c.normalizeAuthValue(u["ユーザーID"] || u["id"] || u["ID"] || "") === loginUserId;
    });
    cachedUserMessage = (userRow && userRow["メッセージ"]) ? c.decrypt(userRow["メッセージ"]) : "";
    return cachedUserMessage;
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return "⚫︎さん、おはようございます☀️";
    if (hour >= 11 && hour < 17) return "⚫︎さん、こんにちは🌤️";
    return "⚫︎さん、こんばんは🌙";
  }

  // ポップアップ用日付フォーマット: YYYY/MM/DD → m/d(曜日)
  function formatDateShort(dateStr) {
    const s = String(dateStr || "").trim();
    const m = /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/.exec(s);
    if (!m) return s;
    const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
    const days = ["日", "月", "火", "水", "木", "金", "土"];
    return parseInt(m[2], 10) + "/" + parseInt(m[3], 10) + "(" + days[d.getDay()] + ")";
  }

  function showPopup(text) {
    msgPopupContent.textContent = text;
    msgPopup.hidden = false;
  }

  document.getElementById("btn-msg-show").addEventListener("click", async function () {
    const filterMonth = document.getElementById("month-filter").value;

    // A: 年月未選択
    if (!filterMonth) {
      showPopup("対象年月を選択してください。");
      return;
    }

    // B: 0:00〜5:59 は実行不可
    if (new Date().getHours() < 6) {
      showPopup("6:00以降に実行してください。");
      return;
    }

    // C: 通常ポップアップ
    const userMessage = await getUserMessage();
    const filtered = allProjects.filter(function (p) {
      return extractYm(String(p["日付"] || "").trim()) === filterMonth;
    });

    const DIVIDER = "----------------------";
    const lines = [getGreeting()];
    if (userMessage) lines.push(userMessage);
    filtered.forEach(function (p) {
      lines.push(DIVIDER);
      const datePart = p["日付"] ? formatDateShort(p["日付"]) : "";
      const timePart = p["時間"] ? p["時間"] : "";
      if (datePart || timePart) lines.push([datePart, timePart].filter(Boolean).join(" "));
      if (p["内容"]) lines.push(p["内容"]);
    });
    if (filtered.length > 0) lines.push(DIVIDER);

    showPopup(lines.join("\n"));
  });

  document.getElementById("btn-msg-popup-close").addEventListener("click", function () {
    msgPopup.hidden = true;
  });

  buildMonthOptions();
  loadProjects();
})();
