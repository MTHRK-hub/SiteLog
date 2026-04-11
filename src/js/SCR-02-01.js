(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.fillUserNames();
  c.bindLogoutButtons();

  document.getElementById("link-friend-list").addEventListener("click", function () {
    c.navigate("friendList");
  });

  document.getElementById("link-site-list").addEventListener("click", function () {
    c.navigate("siteList");
  });

  document.getElementById("link-password-change").addEventListener("click", function () {
    window.alert("パスワード変更画面は未定義のため未実装です。");
  });
})();
