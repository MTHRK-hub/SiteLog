(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  const content = document.getElementById("project-detail-content");
  const btnDelete = document.getElementById("btn-project-delete");
  const btnDetailMsg = document.getElementById("btn-detail-msg");
  const detailMsgPopup = document.getElementById("detail-msg-popup");
  const detailMsgContent = document.getElementById("detail-msg-content");
  const dialog = document.getElementById("delete-dialog");
  const deleteError = document.getElementById("delete-error");

  const projects = c.getProjects();
  const selectedId = c.getSelectedProjectId();
  const found = selectedId ? c.findProjectById(projects, selectedId) : null;
  const project = found ? found.row : null;

  if (!project) {
    c.updateParentHeader({
      screenId: "SCR-06-02",
      title: "企画詳細",
      back: "project-plan",
      showUser: true,
      extraId: "btn-project-edit",
      extraLabel: "編集",
      extraEnabled: false
    });
    content.innerHTML = "<div class='detail-row'><dt>情報</dt><dd>対象データがありません。一覧に戻ってください。</dd></div>";
    btnDelete.disabled = true;
    btnDetailMsg.disabled = true;
    return;
  }

  c.updateParentHeader({
    screenId: "SCR-06-02",
    title: "企画詳細",
    back: "project-plan",
    showUser: true,
    extraId: "btn-project-edit",
    extraLabel: "編集",
    extraScreen: "projectEdit",
    extraEnabled: true
  });

  function row(label, value) {
    return "<div class='detail-row'><dt>" + c.escapeHtml(label) +
      "</dt><dd>" + c.escapeHtml(value || "") + "</dd></div>";
  }

  function buildLocationRow(place, locationUrl) {
    const placeStr = String(place || "");
    const urlStr = String(locationUrl || "").trim();
    if (!urlStr) return row("場所", placeStr);
    const lines = placeStr.split(/\r?\n/);
    const firstLine = c.escapeHtml(lines[0] || "");
    const restLines = lines.slice(1).map(function (l) { return c.escapeHtml(l); });
    let dd = '<a class="name-link" href="' + c.escapeHtml(urlStr) + '" target="_blank" rel="noopener">' + firstLine + "</a>";
    if (restLines.length) dd += "<br>" + restLines.join("<br>");
    return "<div class='detail-row'><dt>場所</dt><dd>" + dd + "</dd></div>";
  }

  function formatFee(value) {
    const str = String(value || "").trim().replace(/[,¥]/g, "");
    if (!str) return "";
    const num = parseFloat(str);
    if (!Number.isFinite(num) || Number.isNaN(num)) return String(value || "");
    return "¥" + Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  const maleVal = c.escapeHtml(formatFee(project["男性参加費"]));
  const femaleVal = c.escapeHtml(formatFee(project["女性参加費"]));
  const feeRow =
    "<div class='detail-row'><dt>参加費</dt>" +
    "<dd>男性：" + maleVal + "<br>女性：" + femaleVal + "</dd></div>";

  content.innerHTML =
    row("日付", c.formatDate(project["日付"])) +
    row("時間", project["時間"]) +
    buildLocationRow(project["場所"], project["場所URL"]) +
    row("内容", project["内容"]) +
    row("説明", project["説明"]) +
    feeRow;

  const DIVIDER = "―――――――――――――――";

  function formatDateShort(dateStr) {
    if (!dateStr) return "";
    const s = String(dateStr).trim();
    const m = /^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/.exec(s);
    if (!m) return s;
    const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
    const dow = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
    return parseInt(m[2], 10) + "/" + parseInt(m[3], 10) + "(" + dow + ")";
  }

  function buildDetailMessage() {
    const lines = [];
    lines.push(DIVIDER);
    if (project["内容"]) lines.push(project["内容"]);
    if (project["説明"]) lines.push(project["説明"]);
    lines.push("");
    lines.push("【日時】");
    lines.push([formatDateShort(project["日付"]), project["時間"]].filter(Boolean).join(" "));
    lines.push("");
    lines.push("【場所】");
    lines.push((project["場所"] || ""));
    if (project["場所URL"]) lines.push(project["場所URL"]);
    lines.push("");
    lines.push("【参加費】");
    lines.push("男性👨‍🦱：" + formatFee(project["男性参加費"]));
    lines.push("女性👩‍🦱：" + formatFee(project["女性参加費"]));
    lines.push(DIVIDER);
    return lines.join("\n");
  }

  btnDetailMsg.addEventListener("click", function () {
    detailMsgContent.textContent = buildDetailMessage();
    detailMsgPopup.hidden = false;
  });

  document.getElementById("btn-detail-msg-close").addEventListener("click", function () {
    detailMsgPopup.hidden = true;
  });

  btnDelete.addEventListener("click", function () {
    deleteError.textContent = "";
    dialog.hidden = false;
  });

  document.getElementById("btn-delete-cancel").addEventListener("click", function () {
    dialog.hidden = true;
  });

  document.getElementById("btn-delete-confirm").addEventListener("click", async function () {
    deleteError.textContent = "";
    const btn = document.getElementById("btn-delete-confirm");
    btn.disabled = true;

    try {
      const projectId = c.getProjectId(project, found.index);
      await c.deleteProject(projectId);

      const updated = projects.filter(function (_, i) { return i !== found.index; });
      c.setProjects(updated);

      c.setCompletionInfo({
        title: "企画削除完了",
        message: "企画情報が削除されました。",
        buttonLabel: "一覧に戻る",
        backScreen: "projectPlan"
      });
      c.navigate("completion");
    } catch (err) {
      deleteError.textContent = err && err.message ? err.message : "削除に失敗しました。";
      btn.disabled = false;
    }
  });
})();
