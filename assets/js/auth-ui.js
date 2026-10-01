/* =========================================================
   Glow by Grace — shared sign-in panel
   Google or email + password. Both lead to the same account
   when the email address is the same (Supabase links them).
   Also handles "set a new password" after a reset link.
   ========================================================= */
(function () {
  const { esc, ICON, toast } = window.GBG;
  const API = window.GBG_API;

  const field = (name, label, type, extra = "") =>
    `<label class="field"><span>${label}</span><input class="input" name="${name}" type="${type}" ${extra}></label>`;
  const passwordField = (name, label, autocomplete, hint = "") => `
    <label class="field"><span>${label}</span>
      <span class="pw-wrap">
        <input class="input" name="${name}" type="password" required minlength="8" autocomplete="${autocomplete}">
        <button type="button" class="pw-toggle" data-pw-toggle aria-label="Show password">Show</button>
      </span>
      ${hint ? `<i class="hint">${hint}</i>` : ""}
    </label>`;

  // Renders the panel into `el`. opts: { title, text, onSignedIn }
  function render(el, opts = {}) {
    let mode = "signin";
    let email = "";

    function draw(notice) {
      const forms = {
        signin: `
          ${field("email", "Email", "email", `required autocomplete="email" value="${esc(email)}"`)}
          ${passwordField("password", "Password", "current-password")}
          <button type="button" class="link auth-forgot" data-mode="forgot">Forgot password?</button>
          <button class="btn btn-dark auth-submit">Sign in</button>`,
        signup: `
          ${field("name", "Full name", "text", 'required autocomplete="name"')}
          ${field("email", "Email", "email", `required autocomplete="email" value="${esc(email)}"`)}
          ${passwordField("password", "Create a password", "new-password", "At least 8 characters")}
          <button class="btn btn-dark auth-submit">Create account</button>`,
        forgot: `
          <p class="muted small">Enter your email and we'll send you a link to set a new password. This also works if you've only signed in with Google before and want to add a password.</p>
          ${field("email", "Email", "email", `required autocomplete="email" value="${esc(email)}"`)}
          <button class="btn btn-dark auth-submit">Send reset link</button>
          <button type="button" class="link auth-back" data-mode="signin">Back to sign in</button>`
      };
      el.innerHTML = `
        <section class="card co-signin auth-card">
          <h3>${opts.title || "Sign in"}</h3>
          ${opts.text ? `<p>${opts.text}</p>` : ""}
          <button type="button" class="btn btn-google auth-google" data-google>${ICON.google} Continue with Google</button>
          <div class="auth-or"><span>or use your email</span></div>
          ${mode === "forgot" ? "" : `
          <div class="auth-tabs" role="tablist">
            <button type="button" role="tab" data-mode="signin" class="${mode === "signin" ? "active" : ""}" aria-selected="${mode === "signin"}">Sign in</button>
            <button type="button" role="tab" data-mode="signup" class="${mode === "signup" ? "active" : ""}" aria-selected="${mode === "signup"}">Create account</button>
          </div>`}
          ${notice ? `<div class="auth-notice ${notice.tone || ""}">${notice.html}</div>` : ""}
          <form class="auth-form" data-auth-form novalidate>${forms[mode]}</form>
        </section>`;
      const first = el.querySelector(`.auth-form input[name="${mode === "signup" ? "name" : email ? "password" : "email"}"]`);
      if (first && notice !== undefined) first.focus({ preventScroll: true });
    }

    // show a message above the form without clearing what the shopper typed
    function say(notice) {
      const form = el.querySelector("[data-auth-form]");
      let box = el.querySelector(".auth-notice");
      if (!box) {
        box = document.createElement("div");
        form.before(box);
      }
      box.className = `auth-notice ${notice.tone || ""}`;
      box.innerHTML = notice.html;
      box.setAttribute("role", notice.tone === "err" ? "alert" : "status");
    }

    function checkInbox(addr) {
      el.innerHTML = `
        <section class="card co-signin auth-card center">
          <div class="o-check">✉</div>
          <h3>Check your inbox</h3>
          <p>We've sent a confirmation link to <b>${esc(addr)}</b>. Click it to finish creating your account — you'll come straight back here, signed in.</p>
          <p class="muted small">Can't find it? Check your spam folder.</p>
          <p><button type="button" class="btn btn-ghost" data-resend>Resend email</button></p>
          <button type="button" class="link" data-mode="signin">Back to sign in</button>
        </section>`;
    }

    el.onclick = async (e) => {
      const b = e.target.closest("button");
      if (!b) return;
      if (b.hasAttribute("data-google")) {
        try { await API.signIn(location.href.split("#")[0]); } catch (err) { toast(API.authMessage(err)); }
        return;
      }
      if (b.hasAttribute("data-pw-toggle")) {
        const input = b.parentElement.querySelector("input");
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        b.textContent = show ? "Hide" : "Show";
        b.setAttribute("aria-label", show ? "Hide password" : "Show password");
        return;
      }
      if (b.hasAttribute("data-resend")) {
        b.disabled = true;
        try { await API.resendConfirmation(email, location.href.split("#")[0]); toast("Confirmation email sent again ✦"); }
        catch (err) { toast(API.authMessage(err)); }
        b.disabled = false;
        return;
      }
      if (b.dataset.mode) {
        const input = el.querySelector('input[name="email"]');
        if (input) email = input.value.trim();
        mode = b.dataset.mode;
        draw(null);
      }
    };

    el.onsubmit = async (e) => {
      e.preventDefault();
      const f = e.target;
      const val = (n) => (f.elements[n] ? f.elements[n].value.trim() : "");
      email = val("email");
      const password = f.elements.password ? f.elements.password.value : "";
      const fail = (msg) => say({ tone: "err", html: esc(msg) });
      if (!/^\S+@\S+\.\S+$/.test(email)) return fail("Please enter a valid email address.");
      if (mode === "signup" && !val("name")) return fail("Please enter your name.");
      if (mode !== "forgot" && password.length < 8) return fail("Your password needs at least 8 characters.");

      const btn = f.querySelector(".auth-submit");
      const label = btn.textContent;
      btn.disabled = true;
      btn.textContent = "Please wait…";
      const done = () => { btn.disabled = false; btn.textContent = label; };
      try {
        if (mode === "signin") {
          await API.signInWithPassword(email, password);
          (opts.onSignedIn || (() => location.reload()))();
        } else if (mode === "signup") {
          const { needsConfirmation } = await API.signUp(email, password, val("name"), location.href.split("#")[0]);
          if (needsConfirmation) checkInbox(email);
          else (opts.onSignedIn || (() => location.reload()))();
        } else {
          await API.sendPasswordReset(email);
          mode = "signin";
          draw({ tone: "ok", html: `If <b>${esc(email)}</b> has an account, a reset link is on its way. Open it on this device to set your new password.` });
        }
      } catch (err) {
        done();
        if (mode === "signin" && /email_not_confirmed|Email not confirmed/i.test((err.code || "") + err.message)) {
          say({ tone: "err", html: `${esc(API.authMessage(err))} <button type="button" class="link" data-resend>Resend confirmation email</button>` });
        } else {
          fail(API.authMessage(err));
        }
      }
    };

    draw();
  }

  // ---- "Set a new password" after following a reset link ----
  function recoveryDialog() {
    const dlg = document.createElement("dialog");
    dlg.className = "adm-dialog auth-dialog";
    dlg.innerHTML = `
      <form class="dlg-body auth-form" data-recover novalidate>
        <h3 class="auth-dlg-title">Set a new password</h3>
        <p class="muted small">Choose a password for your Glow by Grace account. You can still sign in with Google as well.</p>
        ${passwordField("password", "New password", "new-password", "At least 8 characters")}
        <p class="err" data-err hidden></p>
        <button class="btn btn-dark auth-submit">Save password</button>
      </form>`;
    document.body.append(dlg);
    dlg.addEventListener("click", (e) => {
      const b = e.target.closest("[data-pw-toggle]");
      if (!b) return;
      const input = b.parentElement.querySelector("input");
      input.type = input.type === "password" ? "text" : "password";
      b.textContent = input.type === "password" ? "Show" : "Hide";
    });
    dlg.querySelector("form").onsubmit = async (e) => {
      e.preventDefault();
      const pw = e.target.elements.password.value;
      const errEl = dlg.querySelector("[data-err]");
      if (pw.length < 8) { errEl.textContent = "Your password needs at least 8 characters."; errEl.hidden = false; return; }
      try {
        await API.updatePassword(pw);
        API.clearRecovery();
        dlg.close();
        dlg.remove();
        toast("Password saved ✦ You can now sign in with your email too.");
      } catch (err) {
        errEl.textContent = API.authMessage(err);
        errEl.hidden = false;
      }
    };
    dlg.showModal();
  }

  async function checkRecovery() {
    if (!API.recovery) return;
    // wait for the reset link to turn into a session
    for (let i = 0; i < 20 && !(await API.user()); i++) await new Promise((r) => setTimeout(r, 150));
    if (await API.user()) recoveryDialog();
  }
  if (API.configured) setTimeout(checkRecovery, 300);

  window.GBG_AUTH = { render, passwordField };
})();
