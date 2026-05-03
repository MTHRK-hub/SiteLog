(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({
    screenId: "SCR-08-01",
    title: "イベント一覧",
    back: "menu",
    showUser: true,
    extraId: "btn-event-create",
    extraLabel: "新規作成",
    extraEnabled: false
  });

  const status = document.getElementById("event-load-status");
  const content = document.getElementById("event-content");
  const feeTotalRow = document.getElementById("event-fee-total-row");
  const listBody = document.getElementById("event-list-body");
  const monthFilter = document.getElementById("month-filter");
  const chkParticipation = document.getElementById("chk-participation");
  const deleteRow = document.getElementById("event-delete-row");
  const deleteDialog = document.getElementById("delete-dialog");
  const deleteDialogMsg = document.getElementById("delete-dialog-msg");
  const btnDeleteOk = document.getElementById("btn-delete-ok");
  const btnDeleteCancel = document.getElementById("btn-delete-cancel");

  let allEvents = [];
  const loginUser = c.getCurrentUser();
  const loginUserId = loginUser ? String(loginUser.id || "").trim() : "";

  function buildMonthOptions() {
    const now = new Date();
    monthFilter.innerHTML = "";
    const emptyOpt = document.createElement("option");
    emptyOpt.value = "";
    emptyOpt.textContent = "";
    monthFilter.appendChild(emptyOpt);
    for (let i = 0; i < 3; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;
      const ym = y + "-" + String(m).padStart(2, "0");
      const opt = document.createElement("option");
      opt.value = ym;
      opt.textContent = y + "年" + m + "月";
      monthFilter.appendChild(opt);
    }
  }

  function getEventYm(dateStr) {
    const s = String(dateStr || "").trim();
    const m = /^(\d{4})[-\/](\d{1,2})/.exec(s);
    if (m) return m[1] + "-" + String(parseInt(m[2], 10)).padStart(2, "0");
    return "";
  }

  function parseEventDateTime(dateStr, timeStr) {
    const date = String(dateStr || "").trim();
    const time = String(timeStr || "").trim();
    const startTime = (time.split("~")[0] || time.split("〜")[0] || time).trim() || "00:00";
    const normalized = startTime.length === 4 ? "0" + startTime : startTime;
    const dt = new Date(date + "T" + normalized + ":00");
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  function calcTotalFee(rows) {
    return rows.reduce(function (acc, r) {
      const n = parseInt(String(r["参加費"] || "").replace(/[^0-9]/g, ""), 10);
      return acc + (Number.isNaN(n) ? 0 : n);
    }, 0);
  }

  function renderContent(filterYm) {
    if (!filterYm) {
      content.hidden = true;
      deleteRow.hidden = true;
      chkParticipation.disabled = true;
      chkParticipation.checked = false;
      return;
    }
    chkParticipation.disabled = false;

    const monthRows = allEvents.filter(function (r) {
      return getEventYm(r["日付"] || "") === filterYm;
    });

    const participationRows = monthRows.filter(function (r) {
      return String(r["参加フラグ"] || "").trim() === "1";
    });
    const totalFee = calcTotalFee(participationRows);
    feeTotalRow.textContent = filterYm.replace(/^(\d{4})-0?(\d+)$/, "$1年$2月") +
      " 合計参加費 ￥" + totalFee.toLocaleString("ja-JP");

    const displayRows = chkParticipation.checked ? participationRows : monthRows;

    if (!displayRows.length) {
      listBody.innerHTML = '<tr><td colspan="4" style="text-align:center">データがありません</td></tr>';
    } else {
      listBody.innerHTML = displayRows.map(function (r) {
        return "<tr>" +
          "<td>" + c.escapeHtml(r["日付"] || "") + "</td>" +
          "<td>" + c.escapeHtml(r["時間"] || "") + "</td>" +
          "<td>" + c.escapeHtml(r["イベント名"] || "") + "</td>" +
          "<td><button type='button' class='btn btn-sm btn-secondary btn-event-detail' data-eid='" + c.escapeHtml(String(r.id || "")) + "'>詳細</button></td>" +
          "</tr>";
      }).join("");
      listBody.querySelectorAll(".btn-event-detail").forEach(function (btn) {
        btn.addEventListener("click", function () {
          c.setSelectedEventId(btn.dataset.eid);
          c.navigate("eventDetail");
        });
      });
    }

    content.hidden = false;
    deleteRow.hidden = false;
  }

  monthFilter.addEventListener("change", function () {
    renderContent(monthFilter.value);
  });

  chkParticipation.addEventListener("change", function () {
    renderContent(monthFilter.value);
  });

  btnDeleteCancel.addEventListener("click", function () {
    deleteDialog.hidden = true;
  });

  document.getElementById("btn-delete-old").addEventListener("click", function () {
    deleteDialogMsg.textContent = "過去のデータを削除しますか？";
    deleteDialog.hidden = false;
  });

  btnDeleteOk.addEventListener("click", async function () {
    deleteDialog.hidden = true;
    const now = new Date();
    const targets = allEvents.filter(function (r) {
      const dt = parseEventDateTime(r["日付"], r["時間"]);
      return dt && dt < now;
    });
    if (!targets.length) {
      status.textContent = "削除対象の過去データはありません。";
      return;
    }
    status.textContent = "削除中...";
    try {
      for (let i = 0; i < targets.length; i++) {
        await c.deleteEvent(targets[i].id);
      }
      c.setCompletionInfo({
        title: "イベント削除完了",
        message: "過去のイベントデータが削除されました。",
        buttonLabel: "一覧に戻る",
        backScreen: "eventList"
      });
      c.navigate("completion");
    } catch (err) {
      status.textContent = err && err.message ? err.message : "削除に失敗しました。";
    }
  });

  async function loadEvents() {
    status.textContent = "読み込み中...";
    const result = await c.safeLoadSheetRows("events");
    if (!result.ok) {
      status.textContent = result.message || "イベント情報を取得できませんでした。";
      return;
    }
    const filtered = loginUserId
      ? result.rows.filter(function (r) {
          return String(r["ユーザーID"] || "").trim() === loginUserId;
        })
      : result.rows;
    allEvents = filtered.map(function (r) {
      return c.decryptEventRecord(r);
    });
    c.setEvents(allEvents);
    status.textContent = "";
    buildMonthOptions();
    renderContent(monthFilter.value);
  }

  loadEvents();
})();
