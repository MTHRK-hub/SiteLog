(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({ screenId: "SCR-07-03", title: "キャッシュフロー編集", showUser: true });

  const form = document.getElementById("cashflow-edit-form");
  const errorEl = document.getElementById("cashflow-edit-error");
  const ymDisplay = document.getElementById("cf-ym-display");
  const incomeBody = document.getElementById("income-body");
  const expenseBody = document.getElementById("expense-body");
  const confirmDialog = document.getElementById("confirm-dialog");
  const btnConfirmOk = document.getElementById("btn-confirm-ok");
  const btnConfirmCancel = document.getElementById("btn-confirm-cancel");

  /** @type {Set<string>} */
  const idsMarkedForDelete = new Set();

  const selectedYmRaw = c.getSelectedCashflowYm();

  function extractYm(ymStr) {
    const s = String(ymStr || "").trim();
    const m1 = /^(\d{4})[-\/](\d{1,2})/.exec(s);
    if (m1) return m1[1] + "-" + String(parseInt(m1[2], 10)).padStart(2, "0");
    const m2 = /^(\d{4})年(\d{1,2})月/.exec(s);
    if (m2) return m2[1] + "-" + String(parseInt(m2[2], 10)).padStart(2, "0");
    return s;
  }

  function ymToLabel(ym) {
    const m = /^(\d{4})-(\d{2})$/.exec(ym);
    if (!m) return ym;
    return m[1] + "年" + String(parseInt(m[2], 10)) + "月";
  }

  function kingakuToInputVal(record) {
    const n = parseInt(String(record["金額"] || "").replace(/[^0-9\-]/g, ""), 10);
    return Number.isNaN(n) ? "" : String(Math.abs(n));
  }

  function bindRowDelete(tr) {
    const btn = tr.querySelector(".btn-row-delete");
    if (!btn) return;
    btn.addEventListener("click", function () {
      const rid = tr.getAttribute("data-cf-row-id");
      if (rid) idsMarkedForDelete.add(rid);
      tr.remove();
    });
  }

  function appendRow(tbody, record) {
    const tr = document.createElement("tr");
    const cid =
      record && record.id != null && String(record.id).trim() !== ""
        ? String(record.id).trim()
        : "";
    if (cid) tr.setAttribute("data-cf-row-id", cid);
    tr.innerHTML =
      "<td><input class='cf-input cf-naiyaku' type='text' placeholder='内訳' /></td>" +
      "<td><input class='cf-input cf-kingaku' type='number' placeholder='金額' min='0' /></td>" +
      "<td><input class='cf-input cf-biko' type='text' placeholder='備考' /></td>" +
      "<td><button type='button' class='btn btn-secondary btn-row-delete'>削除</button></td>";
    if (record) {
      tr.querySelector(".cf-naiyaku").value = record["内訳"] || "";
      tr.querySelector(".cf-kingaku").value = kingakuToInputVal(record);
      tr.querySelector(".cf-biko").value = record["備考"] || "";
    }
    bindRowDelete(tr);
    tbody.appendChild(tr);
  }

  function addRowInteractive(tbody) {
    const rows = tbody.querySelectorAll("tr");
    if (rows.length > 0) {
      const last = rows[rows.length - 1];
      const naiyaku = last.querySelector(".cf-naiyaku").value.trim();
      const kingaku = last.querySelector(".cf-kingaku").value.trim();
      if (!naiyaku && !kingaku) return;
    }
    appendRow(tbody, null);
  }

  /** @returns {{updates: Array<Object>, inserts: Array<Object>, extraDeletes: Array<string>}} */
  function collectDiff(tbody, kubun, ymCanon, loginUserId, nowIso) {
    /** @type {Array<Object>} */
    const updates = [];
    /** @type {Array<Object>} */
    const inserts = [];
    /** @type {Array<string>} */
    const extraDeletes = [];

    tbody.querySelectorAll("tr").forEach(function (tr) {
      const rowIdRaw = tr.getAttribute("data-cf-row-id");
      const rowId = rowIdRaw ? String(rowIdRaw).trim() : "";
      const naiyaku = tr.querySelector(".cf-naiyaku").value.trim();
      const kingaku = tr.querySelector(".cf-kingaku").value.trim();
      const biko = tr.querySelector(".cf-biko").value.trim();
      const hasData = !!(naiyaku || kingaku);

      if (!hasData && rowId) {
        extraDeletes.push(rowId);
        return;
      }
      if (!hasData) return;

      const baseRecord = {
        "年月": ymCanon,
        "収支区分": kubun,
        "内訳": naiyaku,
        "金額": kingaku,
        "備考": biko,
        "ユーザーID": loginUserId,
        "最終更新日時": nowIso
      };

      if (rowId) {
        updates.push(Object.assign({ id: rowId }, baseRecord));
      } else {
        inserts.push(baseRecord);
      }
    });

    return { updates: updates, inserts: inserts, extraDeletes: extraDeletes };
  }

  document.getElementById("btn-add-income").addEventListener("click", function () {
    addRowInteractive(incomeBody);
  });

  document.getElementById("btn-add-expense").addEventListener("click", function () {
    addRowInteractive(expenseBody);
  });

  btnConfirmCancel.addEventListener("click", function () {
    confirmDialog.hidden = true;
  });

  document.getElementById("btn-edit-cancel").addEventListener("click", function () {
    c.navigate("cashflowPlan");
  });

  const ymCanon = extractYm(selectedYmRaw);
  if (!ymCanon || !/^(\d{4}-\d{2})$/.test(ymCanon)) {
    errorEl.textContent = "編集対象の年月がありません。";
    form.querySelectorAll("input, button").forEach(function (el) {
      if (el.id !== "btn-edit-cancel") el.disabled = true;
    });
  } else {
    ymDisplay.textContent = ymToLabel(ymCanon);

    (async function load() {
      const loginUser = c.getCurrentUser();
      const loginUserId = loginUser ? String(loginUser.id || "").trim() : "";
      errorEl.textContent = "読み込み中...";
      const result = await c.safeLoadSheetRows("cashflows");
      if (!result.ok) {
        errorEl.textContent = result.message || "キャッシュフロー情報を取得できませんでした。";
        form.querySelectorAll("input, button").forEach(function (el) {
          if (el.id !== "btn-edit-cancel") el.disabled = true;
        });
        return;
      }

      let filtered = result.rows;
      if (loginUserId) {
        filtered = filtered.filter(function (r) {
          return String(r["ユーザーID"] || "").trim() === loginUserId;
        });
      }
      const decrypted = filtered.map(function (r) {
        return c.decryptCashflowRecord(r);
      });

      const monthRows = decrypted.filter(function (r) {
        return extractYm(r["年月"] || "") === ymCanon;
      });

      incomeBody.innerHTML = "";
      expenseBody.innerHTML = "";

      const incomeRecords = monthRows.filter(function (r) {
        return String(r["収支区分"] || "").trim() === "0";
      });
      const expenseRecords = monthRows.filter(function (r) {
        return String(r["収支区分"] || "").trim() === "1";
      });

      incomeRecords.forEach(function (rec) {
        appendRow(incomeBody, rec);
      });
      expenseRecords.forEach(function (rec) {
        appendRow(expenseBody, rec);
      });

      if (incomeRecords.length === 0) appendRow(incomeBody, null);
      if (expenseRecords.length === 0) appendRow(expenseBody, null);

      errorEl.textContent = "";
      c.setCashflows(decrypted);
    })();
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!ymCanon || !/^(\d{4}-\d{2})$/.test(ymCanon)) return;

    errorEl.textContent = "";
    const currentUser = c.getCurrentUser();
    const loginUserId = currentUser ? String(currentUser.id || "").trim() : "";
    const nowIso = new Date().toISOString().slice(0, 19).replace("T", " ");

    const inc = collectDiff(incomeBody, "0", ymCanon, loginUserId, nowIso);
    const exp = collectDiff(expenseBody, "1", ymCanon, loginUserId, nowIso);

    const allDeletes = new Set(idsMarkedForDelete);
    inc.extraDeletes.forEach(function (id) {
      allDeletes.add(id);
    });
    exp.extraDeletes.forEach(function (id) {
      allDeletes.add(id);
    });

    const hasAny =
      inc.updates.length + inc.inserts.length + exp.updates.length + exp.inserts.length > 0 ||
      allDeletes.size > 0;
    if (!hasAny) {
      errorEl.textContent = "収入または支出のデータを1件以上入力してください。";
      return;
    }

    confirmDialog.hidden = false;

    btnConfirmOk.onclick = async function () {
      confirmDialog.hidden = true;
      btnConfirmOk.onclick = null;
      errorEl.textContent = "更新中...";
      try {
        for (const id of allDeletes) {
          await c.deleteCashflow(id);
        }
        for (var i = 0; i < inc.updates.length; i++) {
          await c.updateCashflow(c.encryptCashflowRecord(inc.updates[i]));
        }
        for (var j = 0; j < exp.updates.length; j++) {
          await c.updateCashflow(c.encryptCashflowRecord(exp.updates[j]));
        }
        for (var k = 0; k < inc.inserts.length; k++) {
          await c.appendCashflow(c.encryptCashflowRecord(inc.inserts[k]));
        }
        for (var m = 0; m < exp.inserts.length; m++) {
          await c.appendCashflow(c.encryptCashflowRecord(exp.inserts[m]));
        }

        c.setCompletionInfo({
          title: "キャッシュフロー更新完了",
          message: "キャッシュフローが更新されました。",
          buttonLabel: "計画画面に戻る",
          backScreen: "cashflowPlan"
        });
        c.navigate("completion");
      } catch (err) {
        errorEl.textContent = err && err.message ? err.message : "更新に失敗しました。";
      }
    };
  });
})();
