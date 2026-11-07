/**
 * Barbershop booking (visual demo only: nothing is saved or sent)
 */
(function () {
  "use strict";

  const form = document.getElementById('bookingForm');
  if (!form) return;

  // Opening hours by weekday (0 = Sunday). null = closed.
  const HOURS = { 0: null, 1: [9, 18], 2: [9, 18], 3: [9, 18], 4: [9, 18], 5: [9, 18], 6: [10, 16] };
  const MAX_MONTHS_AHEAD = 2;

  const el = id => document.getElementById(id);
  const grid = el('calGrid'), title = el('calTitle'), prev = el('calPrev'), next = el('calNext');
  const slotsBox = el('slots'), slotsTitle = el('slotsTitle'), msg = el('bookingMsg');

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const firstMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const state = { view: new Date(firstMonth), date: null, time: null };

  const key = d => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
  const fmtTime = m => {
    const h = Math.floor(m / 60), mm = String(m % 60).padStart(2, '0');
    return ((h + 11) % 12 + 1) + ':' + mm + ' ' + (h < 12 ? 'AM' : 'PM');
  };
  // Deterministic "already booked" slots so the demo feels real
  const isTaken = (str) => {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h % 100 < 28;
  };
  const checked = name => form.querySelector('input[name="' + name + '"]:checked');

  function renderCalendar() {
    const y = state.view.getFullYear(), m = state.view.getMonth();
    title.textContent = state.view.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    prev.disabled = state.view <= firstMonth;
    const limit = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + MAX_MONTHS_AHEAD, 1);
    next.disabled = state.view >= limit;

    grid.innerHTML = '';
    const offset = new Date(y, m, 1).getDay();
    for (let i = 0; i < offset; i++) grid.appendChild(document.createElement('span'));

    const days = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= days; d++) {
      const date = new Date(y, m, d);
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'cal-day';
      b.textContent = d;
      b.disabled = date < today || !HOURS[date.getDay()];
      if (+date === +today) b.classList.add('is-today');
      if (state.date && +date === +state.date) b.classList.add('is-selected');
      b.setAttribute('aria-label', date.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' }));
      b.addEventListener('click', () => { state.date = date; state.time = null; renderCalendar(); renderSlots(); updateSummary(); });
      grid.appendChild(b);
    }
  }

  function renderSlots() {
    slotsBox.innerHTML = '';
    if (!state.date) { slotsTitle.textContent = 'Select a day to see available times'; return; }
    const service = checked('service');
    const barber = checked('barber').value;
    const dur = service ? +service.dataset.min : 30;
    const [open, close] = HOURS[state.date.getDay()];
    const longDate = state.date.toLocaleDateString('es-ES', { weekday: 'long', month: 'long', day: 'numeric' });
    slotsTitle.textContent = 'Available times for ' + longDate;

    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const isToday = +state.date === +today;

    for (let t = open * 60; t + dur <= close * 60; t += 30) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'slot';
      b.textContent = fmtTime(t);
      b.disabled = (isToday && t <= nowMin + 30) || isTaken(key(state.date) + barber + t);
      if (state.time === t) b.classList.add('is-selected');
      b.addEventListener('click', () => { state.time = t; renderSlots(); updateSummary(); });
      slotsBox.appendChild(b);
    }
    // Drop a previously chosen time that no longer fits
    if (state.time !== null && !slotsBox.querySelector('.is-selected')) { state.time = null; updateSummary(); }
    if (!slotsBox.querySelector('.slot:not(:disabled)')) slotsTitle.textContent = 'No times left on ' + longDate + '. Try another day.';
  }

  function setSummary(id, text) {
    const n = el(id);
    n.textContent = text || 'No Seleccionado';
    n.classList.toggle('is-empty', !text);
  }

  function updateSummary() {
    const service = checked('service');
    setSummary('sumService', service && service.value);
    el('sumBarber').textContent = checked('barber').value;
    setSummary('sumDate', state.date && state.date.toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' }));
    setSummary('sumTime', state.time !== null && fmtTime(state.time));
    el('sumTotal').textContent = '$' + (service ? service.dataset.price : 0);
  }

  function showMsg(text, isError) {
    msg.textContent = text;
    msg.classList.toggle('is-error', !!isError);
    msg.hidden = false;
  }

  prev.addEventListener('click', () => { state.view.setMonth(state.view.getMonth() - 1); renderCalendar(); });
  next.addEventListener('click', () => { state.view.setMonth(state.view.getMonth() + 1); renderCalendar(); });
  form.querySelectorAll('input[name="service"], input[name="barber"]').forEach(i =>
    i.addEventListener('change', () => { renderSlots(); updateSummary(); }));

  form.addEventListener('submit', e => {
    e.preventDefault();
    const missing = [];
    if (!checked('service')) missing.push('el servicio');
    if (!state.date) missing.push('la fecha');
    else if (state.time === null) missing.push('la hora');
    ['bkName', 'bkPhone', 'bkEmail'].forEach(id => {
      const f = el(id), bad = !f.checkValidity();
      f.setAttribute('aria-invalid', bad);
      if (bad) missing.push({ bkName: 'tu nombre', bkPhone: 'tu teléfono', bkEmail: 'un correo electrónico válido' }[id]);
    });
    if (missing.length) { showMsg('Por favor añada ' + missing.join(', ') + ' para confirmar la reserva.', true); return; }

    // Demo only: there is no backend, so we show an error on purpose.
    showMsg("No se pudo conectar con el servidor, Porfavor intente de nuevo mas tarde", true);
  });

  renderCalendar();
  updateSummary();
})();
