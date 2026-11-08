(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({
    screenId: "SCR-08-05",
    title: "イベント検索",
    back: "event-list",
    showUser: true
  });
})();
