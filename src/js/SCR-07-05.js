(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({
    screenId: "SCR-07-05",
    title: "残高一覧",
    back: "cashflow-plan",
    showUser: true,
    extraId: "hdr-btn-stacked-create",
    extraLabel: "新規作成",
    extraScreen: "stackedCreate"
  });

  const loginUser = c.getCurrentUser();
  const loginUserId = loginUser ? String(loginUser.id || "").trim() : "";
  const totalAmountEl = document.getElementById("stacked-total-amount");
  const container = document.getElementById("stacked-list-container");
  const statusEl = document.getElementById("stacked-list-status");

  let currentRows = [];

  function formatAmount(val) {
    const s = String(val == null ? "" : val).trim();
    if (s === "") return "-";
    const n = parseInt(s.replace(/[^0-9-]/g, ""), 10);
    if (!Number.isFinite(n)) return s;
    return (n < 0 ? "-¥" : "¥") + Math.abs(n).toLocaleString("ja-JP");
  }

  function render() {
    let total = 0;
    let hasValue = false;
    currentRows.forEach(function (r) {
      const n = parseInt(String(r["残高"] == null ? "" : r["残高"]).replace(/[^0-9-]/g, ""), 10);
      if (Number.isFinite(n)) { total += n; hasValue = true; }
    });
    totalAmountEl.textContent = hasValue
      ? (total < 0 ? "-¥" : "¥") + Math.abs(total).toLocaleString("ja-JP")
      : "-";

    if (!currentRows.length) {
      container.innerHTML = '<p class="stacked-empty">データがありません</p>';
      return;
    }

    container.innerHTML = currentRows.map(function (r, i) {
      const upBtn = i > 0
        ? '<button class="sort-btn sort-up" data-index="' + i + '" aria-label="上へ">⬆️</button>'
        : '<span class="sort-placeholder"></span>';
      const downBtn = i < currentRows.length - 1
        ? '<button class="sort-btn sort-down" data-index="' + i + '" aria-label="下へ">⬇️</button>'
        : '<span class="sort-placeholder"></span>';
      return '<div class="stacked-row">' +
        '<div class="stacked-card">' +
          '<a class="stacked-item-name" role="button" tabindex="0" data-id="' + c.escapeHtml(String(r.id || "")) + '">' + c.escapeHtml(r["項目"] || "") + '</a>' +
          '<a class="stacked-amount stacked-amount-link" role="button" tabindex="0">' + c.escapeHtml(formatAmount(r["残高"])) + '</a>' +
        '</div>' +
        '<div class="stacked-sort-btns">' + upBtn + downBtn + '</div>' +
      '</div>';
    }).join("");

    container.querySelectorAll(".stacked-item-name").forEach(function (a) {
      a.addEventListener("click", function () {
        c.setSelectedStackedItemId(a.dataset.id);
        c.navigate("stackedEdit");
      });
      a.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          a.click();
        }
      });
    });

    container.querySelectorAll(".stacked-amount-link").forEach(function (a) {
      a.addEventListener("click", function () {
        c.navigate("expenditureList");
      });
      a.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          a.click();
        }
      });
    });

    container.querySelectorAll(".sort-btn").forEach(function (btn) {
      btn.addEventListener("click", async function () {
        const idx = parseInt(btn.dataset.index, 10);
        const isUp = btn.classList.contains("sort-up");
        const otherIdx = isUp ? idx - 1 : idx + 1;

        const a = currentRows[idx];
        const b = currentRows[otherIdx];
        const orderA = a["表示順"];
        const orderB = b["表示順"];
        a["表示順"] = orderB;
        b["表示順"] = orderA;

        container.querySelectorAll(".sort-btn").forEach(function (b2) { b2.disabled = true; });
        statusEl.textContent = "更新中...";
        try {
          await c.updateStacked(c.encryptStackedRecord(a));
          await c.updateStacked(c.encryptStackedRecord(b));
          statusEl.textContent = "";
          currentRows.sort(function (x, y) {
            return parseInt(String(x["表示順"] || "0"), 10) - parseInt(String(y["表示順"] || "0"), 10);
          });
          render();
        } catch (err) {
          a["表示順"] = orderA;
          b["表示順"] = orderB;
          statusEl.textContent = err && err.message ? err.message : "更新に失敗しました。";
          container.querySelectorAll(".sort-btn").forEach(function (b2) { b2.disabled = false; });
        }
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
    currentRows = result.rows
      .filter(function (r) {
        return !loginUserId || String(r["ユーザーID"] || "").trim() === loginUserId;
      })
      .map(function (r) { return c.decryptStackedRecord(r); })
      .sort(function (a, b) {
        const na = parseInt(String(a["表示順"] || "0"), 10);
        const nb = parseInt(String(b["表示順"] || "0"), 10);
        return na - nb;
      });
    statusEl.textContent = "";
    render();
  }

  loadStacked();
})();
