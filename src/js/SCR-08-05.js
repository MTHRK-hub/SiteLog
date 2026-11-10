(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.updateParentHeader({
    screenId: "SCR-08-05",
    title: "イベント検索",
    back: "event-list",
    showUser: true
  });

  // 手帳（iframe）は画面の高さに収め、スクロールは手帳の中で行う。
  // こうすると手帳の日付バーが上部に固定されたまま残る（Artifact 版と同じ動き）
  const frame = document.getElementById("event-search-frame");
  function fitFrame() {
    const card = frame.parentElement;
    const cs = getComputedStyle(card);
    const bs = getComputedStyle(document.body);
    const below = parseFloat(cs.paddingBottom) + parseFloat(cs.borderBottomWidth) + parseFloat(bs.paddingBottom);
    const h = Math.floor(window.innerHeight - frame.getBoundingClientRect().top - window.scrollY - below);
    frame.style.height = Math.max(240, h) + "px";
  }
  fitFrame();
  window.addEventListener("resize", fitFrame);
  window.addEventListener("load", fitFrame);

  // 右下の「先頭へ」ボタン：手帳の中を最上部までスクロールする
  document.getElementById("to-top").addEventListener("click", function () {
    try {
      frame.contentWindow.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) { /* 手帳が読めないときは何もしない */ }
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
