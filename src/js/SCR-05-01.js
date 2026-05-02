(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({
    screenId: "SCR-05-01",
    title: "メモ一覧",
    back: "menu",
    showUser: true,
    extraId: "btn-manuscript-create",
    extraLabel: "新規作成",
    extraScreen: "manuscriptCreate"
  });

  const status = document.getElementById("manuscript-load-status");
  const body = document.getElementById("manuscript-list-body");
  const categoryFilter = document.getElementById("category-filter");

  let allFiltered = [];

  function extractCategory(title) {
    const m = /^(【[^】]+】)/.exec(String(title || ""));
    return m ? m[1] : null;
  }

  function buildCategoryOptions(rows) {
    const catSet = new Set();
    rows.forEach(function (r) {
      const cat = extractCategory(r["タイトル"] || "");
      if (cat) catSet.add(cat);
    });
    const sorted = Array.from(catSet).sort(function (a, b) {
      return a.localeCompare(b, "ja");
    });
    sorted.forEach(function (cat) {
      const opt = document.createElement("option");
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });
  }

  function render(rows) {
    body.innerHTML = "";
    rows.forEach(function (manuscript, index) {
      const tr = document.createElement("tr");
      const titleBtn = document.createElement("button");
      titleBtn.type = "button";
      titleBtn.className = "name-link";
      titleBtn.textContent = manuscript["タイトル"] || "";
      titleBtn.addEventListener("click", function () {
        c.setSelectedManuscriptId(c.getManuscriptId(manuscript, index));
        c.navigate("manuscriptDetail");
      });
      const tdTitle = document.createElement("td");
      tdTitle.appendChild(titleBtn);
      const tdUpdated = document.createElement("td");
      tdUpdated.textContent = manuscript["最終更新日時"] || "";
      tr.appendChild(tdTitle);
      tr.appendChild(tdUpdated);
      body.appendChild(tr);
    });
  }

  function applyFilter() {
    const sel = categoryFilter.value;
    const visible = sel
      ? allFiltered.filter(function (r) {
          return String(r["タイトル"] || "").startsWith(sel);
        })
      : allFiltered;
    status.textContent = "メモデータ " + visible.length + "件を表示中";
    render(visible);
  }

  categoryFilter.addEventListener("change", applyFilter);

  const loginUser = c.getCurrentUser();

  (async function init() {
    status.textContent = "メモデータを読み込み中...";
    const result = await c.safeLoadSheetRows("manuscripts");
    if (!result.ok) {
      status.textContent = result.message;
      render([]);
      return;
    }
    const decryptedRows = result.rows.map(function (r) { return c.decryptManuscriptRecord(r); });
    c.setManuscripts(decryptedRows);
    const loginUserId = loginUser && loginUser.id ? String(loginUser.id) : "";
    const filtered = decryptedRows.filter(function (r) {
      return String(r["ユーザーID"] || "").trim() === loginUserId;
    });
    filtered.sort(function (a, b) {
      return String(a["タイトル"] || "").localeCompare(String(b["タイトル"] || ""), "ja");
    });
    allFiltered = filtered;
    buildCategoryOptions(filtered);
    applyFilter();
  })();
})();
