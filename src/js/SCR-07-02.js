(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({ screenId: "SCR-07-02", title: "キャッシュフロー登録", showUser: true });

  const form = document.getElementById("cashflow-create-form");
  const errorEl = document.getElementById("cashflow-create-error");
  const incomeBody = document.getElementById("income-body");
  const expenseBody = document.getElementById("expense-body");
  const confirmDialog = document.getElementById("confirm-dialog");
  const btnConfirmOk = document.getElementById("btn-confirm-ok");
  const btnConfirmCancel = document.getElementById("btn-confirm-cancel");

  function makeRow() {
    const tr = document.createElement("tr");
    tr.innerHTML =
      "<td><input class='cf-input cf-naiyaku' type='text' placeholder='内訳' /></td>" +
      "<td><input class='cf-input cf-kingaku' type='number' placeholder='金額' min='0' /></td>" +
      "<td><input class='cf-input cf-biko' type='text' placeholder='備考' /></td>";
    return tr;
  }

  function addRow(tbody) {
    const rows = tbody.querySelectorAll("tr");
    if (rows.length > 0) {
      const last = rows[rows.length - 1];
      const naiyaku = last.querySelector(".cf-naiyaku").value.trim();
      const kingaku = last.querySelector(".cf-kingaku").value.trim();
      if (!naiyaku && !kingaku) return;
    }
    tbody.appendChild(makeRow());
  }

  function getTableRows(tbody, kubun) {
    const records = [];
    tbody.querySelectorAll("tr").forEach(function (tr) {
      const naiyaku = tr.querySelector(".cf-naiyaku").value.trim();
      const kingaku = tr.querySelector(".cf-kingaku").value.trim();
      if (!naiyaku && !kingaku) return;
      records.push({ naiyaku: naiyaku, kingaku: kingaku, biko: tr.querySelector(".cf-biko").value.trim(), kubun: kubun });
    });
    return records;
  }

  function extractYm(ymStr) {
    const s = String(ymStr || "").trim();
    const m1 = /^(\d{4})[-\/](\d{1,2})/.exec(s);
    if (m1) return m1[1] + "-" + String(parseInt(m1[2], 10)).padStart(2, "0");
    return s;
  }

  function ymToLabel(ym) {
    const m = /^(\d{4})-(\d{2})$/.exec(ym);
    if (!m) return ym;
    return m[1] + "年" + String(parseInt(m[2], 10)) + "月";
  }

  // 初期行を追加
  incomeBody.appendChild(makeRow());
  expenseBody.appendChild(makeRow());

  document.getElementById("btn-add-income").addEventListener("click", function () {
    addRow(incomeBody);
  });

  document.getElementById("btn-add-expense").addEventListener("click", function () {
    addRow(expenseBody);
  });

  btnConfirmCancel.addEventListener("click", function () {
    confirmDialog.hidden = true;
  });

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    errorEl.textContent = "";

    const ymRaw = String(document.getElementById("cf-ym").value || "").trim();
    if (!ymRaw) {
      errorEl.textContent = "年月は必須です。";
      return;
    }
    const ym = extractYm(ymRaw);

    const incomeRecords = getTableRows(incomeBody, "0");
    const expenseRecords = getTableRows(expenseBody, "1");
    const allRecords = incomeRecords.concat(expenseRecords);

    if (!allRecords.length) {
      errorEl.textContent = "収入または支出のデータを1件以上入力してください。";
      return;
    }

    // 対象年月の既存データ確認
    const existing = c.getCashflows().filter(function (r) {
      return extractYm(r["年月"] || "") === ym;
    });
    if (existing.length > 0) {
      errorEl.textContent = "対象年月のデータがすでに存在します。";
      return;
    }

    confirmDialog.hidden = false;

    btnConfirmOk.onclick = async function () {
      confirmDialog.hidden = true;
      btnConfirmOk.onclick = null;
      const currentUser = c.getCurrentUser();
      const userId = currentUser ? String(currentUser.id || "") : "";
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");

      try {
        for (var i = 0; i < allRecords.length; i++) {
          const r = allRecords[i];
          const record = {
            "年月": ym,
            "収支区分": r.kubun,
            "内訳": r.naiyaku,
            "金額": r.kingaku,
            "備考": r.biko,
            "ユーザーID": userId,
            "最終更新日時": now
          };
          await c.appendCashflow(c.encryptCashflowRecord(record));
        }
        c.setCompletionInfo({
          title: "キャッシュフロー登録完了",
          message: "キャッシュフローが登録されました。",
          buttonLabel: "計画画面に戻る",
          backScreen: "cashflowPlan"
        });
        c.navigate("completion");
      } catch (err) {
        errorEl.textContent = err && err.message ? err.message : "登録に失敗しました。";
      }
    };
  });

  document.getElementById("btn-create-cancel").addEventListener("click", function () {
    c.navigate("cashflowPlan");
  });
})();
