(function () {
  const c = window.SiteLogCommon;
  if (!c.requireLogin()) return;

  c.fillUserNames();
  c.bindLogoutButtons();

  const info = c.getCompletionInfo();
  const title = info.title || "完了";
  const message = info.message || "処理が完了しました。";
  const buttonLabel = info.buttonLabel || "戻る";
  const backScreen = info.backScreen || "menu";

  document.querySelector(".js-completion-title").textContent = title;
  document.querySelector(".js-completion-message").textContent = message;

  const btnBack = document.getElementById("btn-back");
  btnBack.textContent = buttonLabel;
  btnBack.addEventListener("click", function () {
    c.navigate(backScreen);
  });
})();
