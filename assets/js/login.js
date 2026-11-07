/**
 * Inicio de sesión (demo visual: no se envía nada a ningún servidor).
 * Solo guarda el nombre/correo en el navegador para simular una sesión.
 * Cuando exista un backend, reemplaza simulateLogin() por una llamada real (fetch).
 */
(function () {
  "use strict";

  const form = document.getElementById('loginForm');
  if (!form) return;

  const $ = id => document.getElementById(id);
  const guest = $('authGuest'), user = $('authUser');
  const msg = $('authMsg'), nameField = $('nameField');
  const email = $('authEmail'), pass = $('authPass'), name = $('authName');
  const remember = $('authRemember'), extras = $('authExtras');
  const navLogin = $('navLogin');
  const KEY = 'ibiza_session', REMEMBER = 'ibiza_email';
  let mode = 'login';

  const store = {
    get(k, area) { try { return JSON.parse((area || localStorage).getItem(k)); } catch (e) { return null; } },
    set(k, v, area) { try { (area || localStorage).setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k, area) { try { (area || localStorage).removeItem(k); } catch (e) {} }
  };

  function show(text, isError) {
    msg.textContent = text;
    msg.classList.toggle('is-error', !!isError);
    msg.hidden = false;
  }

  function setMode(m) {
    mode = m;
    const signup = m === 'signup';
    $('tabLogin').classList.toggle('is-active', !signup);
    $('tabSignup').classList.toggle('is-active', signup);
    $('tabLogin').setAttribute('aria-selected', String(!signup));
    $('tabSignup').setAttribute('aria-selected', String(signup));
    nameField.hidden = !signup;
    extras.hidden = signup;
    pass.autocomplete = signup ? 'new-password' : 'current-password';
    $('authTitle').textContent = signup ? 'Crea tu cuenta' : 'Bienvenido de vuelta';
    $('authSubtitle').textContent = signup ? 'Guarda tus datos y reserva más rápido.' : 'Ingresa para ver y gestionar tus reservas.';
    $('authSubmitText').textContent = signup ? 'Crear cuenta' : 'Iniciar sesión';
    msg.hidden = true;
  }

  function render() {
    const s = store.get(KEY, sessionStorage) || store.get(KEY);
    const logged = !!s;
    guest.hidden = logged;
    user.hidden = !logged;
    if (logged) {
      $('userName').textContent = s.name;
      $('userEmail').textContent = s.email;
    }
    navLogin.textContent = logged ? 'Mi cuenta' : 'Iniciar Sesión';
  }

  // Simulación: aquí iría la llamada real al servidor cuando exista
  function simulateLogin(data) {
    const session = { name: data.name, email: data.email };
    // Con "Recordarme" la sesión dura entre visitas; si no, solo mientras la pestaña esté abierta
    if (remember.checked || mode === 'signup') store.set(KEY, session);
    else store.set(KEY, session, sessionStorage);
    if (remember.checked) store.set(REMEMBER, data.email); else store.del(REMEMBER);
    render();
    form.reset();
    msg.hidden = true;
  }

  document.querySelectorAll('.auth-tab').forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));

  $('passToggle').addEventListener('click', () => {
    const hide = pass.type === 'password';
    pass.type = hide ? 'text' : 'password';
    $('passToggle').firstElementChild.className = hide ? 'bi bi-eye-slash' : 'bi bi-eye';
    $('passToggle').setAttribute('aria-label', hide ? 'Ocultar contraseña' : 'Mostrar contraseña');
  });

  $('forgotLink').addEventListener('click', e => {
    e.preventDefault();
    show('La recuperación de contraseña aún no está disponible. Escríbenos a ibizareserves@gmail.com.');
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const em = email.value.trim(), pw = pass.value, nm = name.value.trim();
    if (mode === 'signup' && !nm) return show('Escribe tu nombre.', true);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return show('Escribe un correo válido.', true);
    if (pw.length < 6) return show('La contraseña debe tener al menos 6 caracteres.', true);
    simulateLogin({ name: nm || em.split('@')[0], email: em });
  });

  $('logoutBtn').addEventListener('click', () => {
    store.del(KEY); store.del(KEY, sessionStorage);
    render();
    setMode('login');
    const saved = store.get(REMEMBER);
    if (saved) { email.value = saved; remember.checked = true; }
  });

  const saved = store.get(REMEMBER);
  if (saved) { email.value = saved; remember.checked = true; }
  render();
})();
