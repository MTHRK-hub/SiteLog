(function () {
  const c = window.SiteLogCommon;
  const loginForm = document.getElementById("login-form");
  const loginError = document.getElementById("login-error");
  const idInput = document.getElementById("login-id");
  const passwordInput = document.getElementById("login-password");

  // 既にログイン済みならメニューへ（戻る操作などのUX向上）
  if (c.getCurrentUser()) {
    c.navigate("menu");
    return;
  }

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    loginError.textContent = "";
    const id = c.normalizeAuthValue(idInput.value);
    const password = c.normalizeAuthValue(passwordInput.value);

    if (!id || !password) {
      loginError.textContent = "IDとパスワードを入力してください";
      return;
    }

    // ユーザーデータは毎回取得せず、ログイン時だけ取得して照合
    const result = await c.safeLoadSheetRows("users");
    if (!result.ok) {
      loginError.textContent = result.message;
      return;
    }

    function getFirstNonEmpty(obj, keys) {
      for (let i = 0; i < keys.length; i++) {
        const v = obj ? obj[keys[i]] : "";
        if (v != null && String(v).trim() !== "") return v;
      }
      return "";
    }

    const matched = result.rows.find(function (u) {
      // 列名ゆれ（ユーザーID/id 等）を吸収して照合する
      const sheetId = c.normalizeAuthValue(getFirstNonEmpty(u, ["ユーザーID", "id", "ID"]));
      const sheetPw = c.normalizeAuthValue(getFirstNonEmpty(u, ["パスワード", "password", "PW"]));
      return sheetId === id && sheetPw === password;
    });
    if (!matched) {
      loginError.textContent = "IDまたはパスワードが正しくありません";
      return;
    }

    c.setCurrentUser({
      id: matched["ユーザーID"],
      name: matched["ユーザー名"] || matched["ユーザーID"]
    });
    c.navigate("menu");
  });

  document.getElementById("btn-close-login").addEventListener("click", function () {
    loginError.textContent = "";
    idInput.value = "";
    passwordInput.value = "";
    // ブラウザの仕様上、スクリプトで開いていないタブは閉じられないことが多い
    try {
      window.close();
    } catch (_) {}

    // 閉じられない場合のフォールバック（疑似的に「閉じる」）
    setTimeout(function () {
      try {
        document.open();
        document.write("<!doctype html><title>終了</title><meta name='viewport' content='width=device-width, initial-scale=1'><body style='font-family:system-ui; padding:16px'>終了しました。このタブを閉じてください。</body>");
        document.close();
      } catch (_) {
        try {
          window.location.href = "about:blank";
        } catch (_) {}
      }
    }, 50);
  });
})();
