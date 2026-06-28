(function () {
  const c = window.SiteLogCommon;

  const form = document.getElementById("expenditure-form");
  const msgEl = document.getElementById("exp-message");
  const selectCategory = document.getElementById("exp-category");
  const selectType = document.getElementById("exp-type");
  const selectTargetBalance = document.getElementById("exp-target-balance");
  const selectSourceBalance = document.getElementById("exp-source-balance");
  const selectDestBalance = document.getElementById("exp-dest-balance");
  const confirmDialog = document.getElementById("confirm-dialog");
  const btnConfirmOk = document.getElementById("btn-confirm-ok");
  const btnConfirmCancel = document.getElementById("btn-confirm-cancel");

  // 振替選択時に非表示にするフィールドラッパー
  const transferHideFields = [
    document.getElementById("wrap-target-balance"),
    document.getElementById("wrap-category"),
    document.getElementById("wrap-type"),
    document.getElementById("wrap-content"),
    document.getElementById("wrap-note"),
  ];
  // 振替選択時のみ表示するフィールドラッパー
  const transferShowFields = [
    document.getElementById("wrap-source-balance"),
    document.getElementById("wrap-dest-balance"),
  ];

  let enumRows = [];
  let stackedRows = [];

  function populateSelect(selectEl, enumName) {
    while (selectEl.options.length > 1) selectEl.remove(1);
    const row = enumRows.find(function (r) {
      return String(r["Enum名"] || "").trim() === enumName;
    });
    if (!row) return;
    for (let i = 1; i <= 15; i++) {
      const v = String(row["値" + i] || "").trim();
      if (!v) continue;
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      selectEl.appendChild(opt);
    }
  }

  function populateBalanceSelects(userId) {
    [selectTargetBalance, selectSourceBalance, selectDestBalance].forEach(function (sel) {
      while (sel.options.length > 1) sel.remove(1);
    });
    if (!userId) return;
    stackedRows
      .filter(function (r) {
        return String(r["ユーザーID"] || "").trim() === userId;
      })
      .sort(function (a, b) {
        const oa = parseInt(String(a["表示順"] || "0"), 10);
        const ob = parseInt(String(b["表示順"] || "0"), 10);
        return oa - ob;
      })
      .forEach(function (r) {
        const v = String(r["項目"] || "").trim();
        if (!v) return;
        [selectTargetBalance, selectSourceBalance, selectDestBalance].forEach(function (sel) {
          const opt = document.createElement("option");
          opt.value = v;
          opt.textContent = v;
          sel.appendChild(opt);
        });
      });
  }

  async function loadEnums() {
    const result = await c.safeLoadSheetRows("enums");
    if (!result.ok) return;
    enumRows = result.rows;
    populateSelect(selectCategory, "支出カテゴリ");
  }

  async function loadTargetBalanceOptions(userId) {
    [selectTargetBalance, selectSourceBalance, selectDestBalance].forEach(function (sel) {
      while (sel.options.length > 1) sel.remove(1);
    });
    stackedRows = [];
    if (!userId) return;

    const result = await c.safeLoadSheetRows("stacked");
    if (!result.ok) return;

    stackedRows = result.rows.map(function (r) { return c.decryptStackedRecord(r); });
    populateBalanceSelects(userId);
  }

  function applyTransferMode(isTransfer) {
    transferHideFields.forEach(function (el) { el.hidden = isTransfer; });
    transferShowFields.forEach(function (el) { el.hidden = !isTransfer; });
  }

  loadEnums();

  document.getElementById("exp-user-id").addEventListener("change", function () {
    loadTargetBalanceOptions(this.value.trim());
  });

  document.querySelectorAll("input[name='処理区分']").forEach(function (radio) {
    radio.addEventListener("change", function () {
      applyTransferMode(this.value === "2");
    });
  });

  selectCategory.addEventListener("change", function () {
    const cat = selectCategory.value.trim();
    while (selectType.options.length > 1) selectType.remove(1);
    selectType.value = "";
    if (!cat) {
      selectType.disabled = true;
      return;
    }
    selectType.disabled = false;
    populateSelect(selectType, "支出[" + cat + "]");
  });

  function showError(text) {
    msgEl.className = "error-msg";
    msgEl.textContent = text;
  }

  function showSuccess(text) {
    msgEl.className = "error-msg exp-success";
    msgEl.textContent = text;
  }

  btnConfirmCancel.addEventListener("click", function () {
    confirmDialog.hidden = true;
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    msgEl.textContent = "";

    const userId = document.getElementById("exp-user-id").value.trim();
    const date = document.getElementById("exp-date").value.trim();
    const processTypeRadio = document.querySelector("input[name='処理区分']:checked");
    const processType = processTypeRadio ? processTypeRadio.value : "";
    const isTransfer = processType === "2";
    const targetBalance = selectTargetBalance.value.trim();
    const sourceBalance = selectSourceBalance.value.trim();
    const destBalance = selectDestBalance.value.trim();
    const category = selectCategory.value.trim();
    const type = selectType.value.trim();
    const content = document.getElementById("exp-content").value.trim();
    const amount = document.getElementById("exp-amount").value.trim();
    const note = document.getElementById("exp-note").value.trim();

    if (!userId || !date) {
      showError("ユーザーIDと日付は必須です。");
      return;
    }

    confirmDialog.hidden = false;

    btnConfirmOk.onclick = async function () {
      confirmDialog.hidden = true;
      btnConfirmOk.onclick = null;

      try {
        if (isTransfer) {
          // 振替: 残高情報の振替のみ実施（収支情報への追加は行わない）
          const amountNum = parseInt(String(amount).replace(/[^0-9-]/g, ""), 10) || 0;
          const now = new Date().toISOString().slice(0, 19).replace("T", " ");

          if (sourceBalance) {
            const srcItem = stackedRows.find(function (r) {
              return String(r["ユーザーID"] || "").trim() === userId &&
                String(r["項目"] || "").trim() === sourceBalance;
            });
            if (srcItem) {
              const cur = parseInt(String(srcItem["残高"] || "0").replace(/[^0-9-]/g, ""), 10) || 0;
              srcItem["残高"] = String(cur - Math.abs(amountNum));
              srcItem["最終更新日時"] = now;
              await c.updateStacked(c.encryptStackedRecord(srcItem));
            }
          }

          if (destBalance) {
            const dstItem = stackedRows.find(function (r) {
              return String(r["ユーザーID"] || "").trim() === userId &&
                String(r["項目"] || "").trim() === destBalance;
            });
            if (dstItem) {
              const cur = parseInt(String(dstItem["残高"] || "0").replace(/[^0-9-]/g, ""), 10) || 0;
              dstItem["残高"] = String(cur + Math.abs(amountNum));
              dstItem["最終更新日時"] = now;
              await c.updateStacked(c.encryptStackedRecord(dstItem));
            }
          }
        } else {
          // 収入 / 支出: 収支情報に追加 + 残高更新
          const record = {
            "ユーザーID": userId,
            "収支区分": processType,
            "対象残高": targetBalance,
            "日付": date,
            "カテゴリ": category,
            "種別": type,
            "内容": content,
            "金額": amount,
            "備考": note
          };

          await c.appendExpenditure(c.encryptExpenditureRecord(record));

          if (targetBalance) {
            const stackedItem = stackedRows.find(function (r) {
              return String(r["ユーザーID"] || "").trim() === userId &&
                String(r["項目"] || "").trim() === targetBalance;
            });
            if (stackedItem) {
              const cur = parseInt(String(stackedItem["残高"] || "0").replace(/[^0-9-]/g, ""), 10) || 0;
              const amountNum = parseInt(String(amount).replace(/[^0-9-]/g, ""), 10) || 0;
              stackedItem["残高"] = String(
                processType === "0" ? cur + Math.abs(amountNum) : cur - Math.abs(amountNum)
              );
              stackedItem["最終更新日時"] = new Date().toISOString().slice(0, 19).replace("T", " ");
              await c.updateStacked(c.encryptStackedRecord(stackedItem));
            }
          }
        }

        showSuccess("登録しました。");
        form.reset();
        applyTransferMode(false);
        stackedRows = [];
        [selectTargetBalance, selectSourceBalance, selectDestBalance].forEach(function (sel) {
          while (sel.options.length > 1) sel.remove(1);
        });
        while (selectType.options.length > 1) selectType.remove(1);
        selectType.disabled = true;
      } catch (err) {
        showError(err && err.message ? err.message : "登録に失敗しました。");
      }
    };
  });

  document.getElementById("btn-close").addEventListener("click", function () {
    window.close();
  });
})();
