(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({
    screenId: "SCR-08-05",
    title: "イベント検索",
    back: "event-list",
    showUser: true
  });

  // 手帳（iframe）から届く高さに合わせて、外枠ごと縦幅を伸び縮みさせる
  const frame = document.getElementById("event-search-frame");
  window.addEventListener("message", function (e) {
    if (e.source !== frame.contentWindow) return;
    const data = e.data || {};
    if (data.type !== "sitelog-notebook-height") return;
    const h = Number(data.height);
    if (h > 0) frame.style.height = h + "px";
  });

  // 右下の「先頭へ」ボタン：この画面（コンテンツ領域）を最上部までスクロールする
  document.getElementById("to-top").addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
