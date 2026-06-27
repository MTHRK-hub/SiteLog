(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  const ym = c.getSelectedCashflowYm();

  const listSource = c.getExpenditureListSource();
  const stackedName = c.getExpenditureListStackedName();
  const isStackedMode = listSource === "stacked";
  c.setExpenditureListSource("");
  c.setExpenditureListStackedName("");

  function ymToLabel(s) {
    const m = /^(\d{4})-(\d{2})$/.exec(s);
    if (!m) return s;
    return m[1] + "年" + String(parseInt(m[2], 10)) + "月";
  }

  c.updateParentHeader({
    screenId: "SCR-07-04",
    title: isStackedMode ? "残高内訳" : "支出実績一覧",
    back: "cashflow-plan",
    showUser: true,
    extraId: "hdr-btn-new-expenditure",
    extraLabel: "新規作成",
    extraUrl: "../../SCR-07-99.html"
  });

  const loginUser = c.getCurrentUser();
  const loginUserId = loginUser ? String(loginUser.id || "").trim() : "";

  const titleEl = document.getElementById("exp-list-title");
  const tbody = document.getElementById("exp-list-body");
  const statusEl = document.getElementById("exp-list-status");
  const deleteDialog = document.getElementById("delete-dialog");
  const deleteDialogMsg = document.getElementById("delete-dialog-msg");
  const btnDeleteOk = document.getElementById("btn-delete-ok");
  const btnDeleteCancel = document.getElementById("btn-delete-cancel");
  const categoryFilterEl = document.getElementById("exp-category-filter");
  const categoryTotalEl = document.getElementById("exp-category-total");
  const categoryFilterRow = categoryFilterEl.closest(".category-filter-row");

  if (isStackedMode) {
    categoryFilterRow.hidden = true;
  }

  let expenditures = [];
  let pendingDeleteId = null;

  function formatDateMmDd(dateStr) {
    if (!dateStr) return "";
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr).trim());
    if (!m) return dateStr;
    const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const dow = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    return mm + "/" + dd + "(" + dow + ")";
  }

  function formatAmount(val) {
    const n = parseInt(String(val || "").replace(/[^0-9\-]/g, ""), 10);
    if (Number.isNaN(n)) return "";
    return "¥" + Math.abs(n).toLocaleString("ja-JP");
  }

  function calcTotal(rows) {
    return rows
      .filter(function (r) { return String(r["収支区分"] || "").trim() === "1"; })
      .reduce(function (acc, r) {
        const n = parseInt(String(r["金額"] || "").replace(/[^0-9\-]/g, ""), 10);
        return acc + (Number.isNaN(n) ? 0 : Math.abs(n));
      }, 0);
  }

  function populateCategoryFilter(enumRows) {
    while (categoryFilterEl.options.length > 1) categoryFilterEl.remove(1);
    const row = enumRows.find(function (r) {
      return String(r["Enum名"] || "").trim() === "支出カテゴリ";
    });
    if (!row) return;
    for (let i = 1; i <= 15; i++) {
      const v = String(row["値" + i] || "").trim();
      if (!v) continue;
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      categoryFilterEl.appendChild(opt);
    }
  }

  function render() {
    const selectedCat = isStackedMode ? "" : categoryFilterEl.value;
    const filtered = selectedCat
      ? expenditures.filter(function (r) { return String(r["カテゴリ"] || "").trim() === selectedCat; })
      : expenditures;

    if (isStackedMode) {
      titleEl.textContent = stackedName + "_内訳";
    } else {
      const monthTotal = calcTotal(expenditures);
      titleEl.textContent = ymToLabel(ym) + " 合計支出 ¥" + monthTotal.toLocaleString("ja-JP");
      if (selectedCat) {
        categoryTotalEl.textContent = "¥" + calcTotal(filtered).toLocaleString("ja-JP");
      } else {
        categoryTotalEl.textContent = "";
      }
    }

    if (!filtered.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center">データがありません</td></tr>';
      return;
    }

    tbody.innerHTML = filtered.map(function (r) {
      const ie = String(r["収支区分"] || "").trim();
      const rowClass = ie === "0" ? " class='row-income'" : ie === "1" ? " class='row-expense'" : "";
      return "<tr" + rowClass + ">" +
        "<td><a class='date-link' role='button' tabindex='0' data-id='" + c.escapeHtml(String(r["id"] || "")) + "'>" + c.escapeHtml(formatDateMmDd(r["日付"] || "")) + "</a></td>" +
        "<td>" + c.escapeHtml(r["カテゴリ"] || "") + "</td>" +
        "<td>" + c.escapeHtml(r["種別"] || "") + "</td>" +
        "<td>" + c.escapeHtml(r["内容"] || "") + "</td>" +
        "<td class='amount-cell'>" + c.escapeHtml(formatAmount(r["金額"])) + "</td>" +
        "<td>" + c.escapeHtml(r["備考"] || "") + "</td>" +
        "<td><button class='btn btn-danger btn-delete-exp' data-id='" + c.escapeHtml(String(r["id"] || "")) + "'>削除</button></td>" +
        "</tr>";
    }).join("");

    tbody.querySelectorAll(".date-link").forEach(function (a) {
      a.addEventListener("click", function () {
        c.navigate("stackedList");
      });
      a.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); a.click(); }
      });
    });

    tbody.querySelectorAll(".btn-delete-exp").forEach(function (btn) {
      btn.addEventListener("click", function () {
        pendingDeleteId = btn.dataset.id;
        deleteDialogMsg.textContent = "支出データを削除しますか？";
        deleteDialog.removeAttribute("hidden");
      });
    });
  }

  categoryFilterEl.addEventListener("change", function () {
    render();
  });

  btnDeleteCancel.addEventListener("click", function () {
    deleteDialog.setAttribute("hidden", "");
    pendingDeleteId = null;
  });

  btnDeleteOk.addEventListener("click", async function () {
    deleteDialog.setAttribute("hidden", "");
    if (!pendingDeleteId) return;
    const id = pendingDeleteId;
    pendingDeleteId = null;

    const targetRecord = expenditures.find(function (r) {
      return String(r.id || "") === String(id);
    });

    statusEl.textContent = "削除中...";
    try {
      await c.deleteExpenditure(id);

      if (targetRecord) {
        const targetBalance = String(targetRecord["対象残高"] || "").trim();
        const amount = parseInt(String(targetRecord["金額"] || "").replace(/[^0-9-]/g, ""), 10);
        const incomeExpense = String(targetRecord["収支区分"] || "").trim();
        if (targetBalance && Number.isFinite(amount)) {
          const stackedResult = await c.safeLoadSheetRows("stacked", { allowEmpty: true });
          if (stackedResult.ok) {
            const stackedItem = stackedResult.rows
              .map(function (r) { return c.decryptStackedRecord(r); })
              .find(function (r) {
                return String(r["ユーザーID"] || "").trim() === loginUserId &&
                  String(r["項目"] || "").trim() === targetBalance;
              });
            if (stackedItem) {
              const cur = parseInt(String(stackedItem["残高"] || "0").replace(/[^0-9-]/g, ""), 10) || 0;
              stackedItem["残高"] = String(
                incomeExpense === "0" ? cur - Math.abs(amount) : cur + Math.abs(amount)
              );
              stackedItem["最終更新日時"] = new Date().toISOString().slice(0, 19).replace("T", " ");
              await c.updateStacked(c.encryptStackedRecord(stackedItem));
            }
          }
        }
      }

      c.setCompletionInfo({
        title: "収支削除完了",
        message: "収支データが削除されました。",
        buttonLabel: "一覧に戻る",
        backScreen: "expenditureList"
      });
      c.navigate("completion");
    } catch (err) {
      statusEl.textContent = err && err.message ? err.message : "削除に失敗しました。";
    }
  });

  async function loadExpenditures() {
    if (!ym) {
      statusEl.textContent = "対象年月が選択されていません。";
      return;
    }
    statusEl.textContent = "読み込み中...";

    const [enumResult, expResult] = await Promise.all([
      c.safeLoadSheetRows("enums"),
      c.safeLoadSheetRows("expenditures")
    ]);

    if (!enumResult.ok) {
      statusEl.textContent = "Enum情報を取得できませんでした。";
      return;
    }
    if (!expResult.ok) {
      statusEl.textContent = expResult.message || "支出情報を取得できませんでした。";
      return;
    }

    populateCategoryFilter(enumResult.rows);

    expenditures = expResult.rows
      .filter(function (r) {
        return !loginUserId || String(r["ユーザーID"] || "").trim() === loginUserId;
      })
      .map(function (r) { return c.decryptExpenditureRecord(r); })
      .filter(function (r) {
        if (String(r["日付"] || "").slice(0, 7) !== ym) return false;
        if (isStackedMode) {
          return String(r["対象残高"] || "").trim() === stackedName;
        }
        return String(r["収支区分"] || "").trim() === "1";
      })
      .sort(function (a, b) {
        return String(b["日付"] || "").localeCompare(String(a["日付"] || ""));
      });

    statusEl.textContent = "";
    render();
  }

  loadExpenditures();
})();
