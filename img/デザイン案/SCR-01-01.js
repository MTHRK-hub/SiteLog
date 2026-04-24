// SCR-01-01 デザイン案プレビュー用スクリプト
// 実際の認証ロジックは src/js/SCR-01-01.js を参照
(function () {
  const form     = document.getElementById("login-form");
  const errorEl  = document.getElementById("login-error");
  const idInput  = document.getElementById("login-id");
  const pwInput  = document.getElementById("login-password");

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    errorEl.textContent = "";

    const id = idInput.value.trim();
    const pw = pwInput.value.trim();

    if (!id || !pw) {
      errorEl.textContent = "IDとパスワードを入力してください";
      return;
    }

    // プレビュー用：実際には src/js/SCR-01-01.js のシート照合に置き換える
    alert("ログイン成功（デザイン案プレビュー）");
  });

  document.getElementById("btn-close").addEventListener("click", function () {
    errorEl.textContent = "";
    idInput.value = "";
    pwInput.value = "";
    // 実装時は window.parent.postMessage({ type: "closeApp" }, "*"); に置き換える
  });
})();
