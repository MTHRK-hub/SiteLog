(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  const content = document.getElementById("project-detail-content");

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
    return;
  }

  c.updateParentHeader({
    screenId: "SCR-06-02",
    title: "企画詳細",
    back: "project-plan",
    showUser: true,
    extraId: "btn-project-edit",
    extraLabel: "編集",
    extraEnabled: false
  });

  function row(label, value) {
    return "<div class='detail-row'><dt>" + c.escapeHtml(label) +
      "</dt><dd>" + c.escapeHtml(value || "") + "</dd></div>";
  }

  content.innerHTML =
    row("日付", c.formatDate(project["日付"])) +
    row("時間", project["時間"]) +
    row("場所", project["場所"]) +
    row("内容", project["内容"]) +
    row("説明", project["説明"]) +
    row("参加費（男）", project["参加費（男）"]) +
    row("参加費（女）", project["参加費（女）"]);
})();
