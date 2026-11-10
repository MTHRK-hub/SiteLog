(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({
    screenId: "SCR-08-05",
    title: "イベント検索",
    back: "event-list",
    showUser: true
  });

  // 手帳（iframe）の高さは CSS で画面に合わせる（SCR-08-05.css）。
  // スクロールは手帳の中で行うので、手帳の日付バーが上部に固定されたまま残る
  const frame = document.getElementById("event-search-frame");

  // 右下の「先頭へ」ボタン：手帳の中を最上部までスクロールする
  document.getElementById("to-top").addEventListener("click", function () {
    try {
      frame.contentWindow.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) { /* 手帳が読めないときは何もしない */ }
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // 右下の「最下部へ」ボタン：手帳の中を最下部までスクロールする
  document.getElementById("to-bottom").addEventListener("click", function () {
    try {
      const w = frame.contentWindow;
      w.scrollTo({ top: w.document.documentElement.scrollHeight, behavior: "smooth" });
    } catch (e) { /* 手帳が読めないときは何もしない */ }
  });
})();
