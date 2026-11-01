// Вход для администратора. Ссылка на эту страницу спрятана в подвале сайта (знак ©).
// При первом входе владелец страницы задаёт логин и пароль сам.
import { html, useState, useEffect } from "../lib.js";
import { useAuth, adminState, loginAdmin, setupAdmin, lockLeft } from "../core/auth.js";
import { L } from "../core/i18n.js";
import { Icon, toast } from "../ui/kit.js";

const MIN = 8;

function PassField({ id, label, value, onInput, auto }) {
  const [show, setShow] = useState(false);
  return html`<label class="field" for=${id}>${label}
    <span class="pass-wrap"><input class="input" id=${id} type=${show ? "text" : "password"} autocomplete=${auto} value=${value} onInput=${(e) => onInput(e.currentTarget.value)} dir="ltr" />
      <button type="button" class="icon-btn sm" aria-label=${show ? L("Скрыть пароль", "Hide password", "إخفاء كلمة المرور") : L("Показать пароль", "Show password", "إظهار كلمة المرور")} onClick=${() => setShow(!show)}><${Icon} name=${show ? "eyeOff" : "eye"} /></button></span></label>`;
}

export function LoginView() {
  const auth = useAuth();
  const [state, setState] = useState(null);
  const [login, setLogin] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  // При открытии по ссылке …#admin доступ к данным ещё не получен: ждём его.
  useEffect(() => { if (auth.ready) adminState().then(setState).catch(() => setState("unavailable")); }, [auth.ready]);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setErr("");
    if (!login.trim() || !pass) { setErr(L("Введите логин и пароль.", "Enter the login and password.", "أدخل اسم الدخول وكلمة المرور.")); return; }
    if (state === "setup") {
      if (pass.length < MIN) { setErr(L(`Пароль должен быть не короче ${MIN} символов.`, `The password must be at least ${MIN} characters.`, `يجب ألّا تقلّ كلمة المرور عن ${MIN} أحرف.`)); return; }
      if (pass !== pass2) { setErr(L("Пароли не совпадают.", "The passwords do not match.", "كلمتا المرور غير متطابقتين.")); return; }
    }
    setBusy(true);
    try {
      if (state === "setup") {
        await setupAdmin(login, pass);
        toast(L("Логин и пароль администратора сохранены", "The administrator’s login and password are saved", "حُفظ اسم دخول المشرف وكلمة مروره"), { icon: "check" });
      } else {
        const r = await loginAdmin(login, pass);
        if (r === "locked") setErr(L(`Слишком много попыток. Подождите ${lockLeft()} с.`, `Too many attempts. Wait ${lockLeft()} s.`, `محاولات كثيرة. انتظر ${lockLeft()} ث.`));
        else if (r !== "ok") { setErr(L("Неверный логин или пароль.", "Wrong login or password.", "اسم الدخول أو كلمة المرور غير صحيحة.")); setPass(""); }
      }
    } catch {
      setErr(L("Не удалось войти. Попробуйте ещё раз.", "Could not sign in. Try again.", "تعذّر الدخول. حاول مرة أخرى."));
    }
    setBusy(false);
  };

  const setup = state === "setup";
  return html`<div class="login-wrap">
    <form class="card pad-lg auth-card" onSubmit=${submit} noValidate>
      <div class="row" style="gap:12px;align-items:center"><span class="login-ico"><${Icon} name="lock" /></span>
        <h1 style="font-size:24px">${setup ? L("Учётная запись администратора", "Administrator account", "حساب المشرف") : L("Вход для администратора", "Administrator sign-in", "دخول المشرف")}</h1></div>
      ${state === null && html`<p class="hint">${L("Проверяем доступ…", "Checking access…", "جارٍ التحقّق…")}</p>`}
      ${state === "unavailable" && html`<p class="ink2" style="line-height:1.6">${L("Вход работает, когда страница открыта в аккаунте Claude, у которого есть право редактировать эту страницу.", "Sign-in works when the page is opened in a Claude account that can edit this page.", "يعمل الدخول عند فتح الصفحة بحساب Claude يملك صلاحية تعديلها.")}</p>`}
      ${state && state !== "unavailable" && html`
        ${setup && html`<p class="ink2" style="line-height:1.6">${L("Придумайте логин и пароль. Они понадобятся при каждом входе. Пароль нигде не хранится в открытом виде — только его хеш.", "Choose a login and a password. You will need them every time you sign in. The password is never stored as is — only its hash.", "اختر اسم دخول وكلمة مرور تحتاج إليهما في كل دخول. لا تُخزَّن كلمة المرور كما هي، بل بصمتها فقط.")}</p>`}
        <label class="field" for="adm-login">${L("Логин", "Login", "اسم الدخول")}
          <input class="input" id="adm-login" autocomplete="username" value=${login} onInput=${(e) => setLogin(e.currentTarget.value)} dir="ltr" placeholder=${setup ? "admin" : ""} /></label>
        <${PassField} id="adm-pass" label=${L("Пароль", "Password", "كلمة المرور")} value=${pass} onInput=${setPass} auto=${setup ? "new-password" : "current-password"} />
        ${setup && html`<${PassField} id="adm-pass2" label=${L("Пароль ещё раз", "Repeat the password", "أعد كلمة المرور")} value=${pass2} onInput=${setPass2} auto="new-password" />`}
        ${err && html`<div class="warn-box" role="alert">${err}</div>`}
        <div class="row"><button class="btn primary" type="submit" disabled=${busy}>${busy ? L("Проверяем…", "Checking…", "جارٍ التحقّق…") : setup ? L("Сохранить и войти", "Save and sign in", "حفظ ودخول") : L("Войти", "Sign in", "دخول")}</button></div>`}
    </form>
  </div>`;
}
