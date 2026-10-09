(function () {
  'use strict';

  var RECIPIENT = 'cheryllkates@gmail.com';
  var PHONE = '(404) 838-6701';

  /* ------------------------------------------------------------------ *
   * Mobile navigation
   * ------------------------------------------------------------------ */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('is-open')) {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }

  var params = new URLSearchParams(window.location.search);

  /* ------------------------------------------------------------------ *
   * Quote / contact forms (no server attached: hand the request to the
   * visitor's email app, addressed to the business)
   * ------------------------------------------------------------------ */
  var wanted = params.get('service');
  if (wanted) {
    document.querySelectorAll('form[data-mailto] select[name="service"]').forEach(function (select) {
      Array.prototype.forEach.call(select.options, function (opt) {
        if (opt.value === wanted) { select.value = wanted; }
      });
    });
  }

  document.querySelectorAll('form[data-mailto]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var data = new FormData(form);
      var name = [data.get('firstName'), data.get('lastName')].filter(Boolean).join(' ') || data.get('name') || '';
      var lines = [
        'Name: ' + name,
        'Phone: ' + (data.get('phone') || ''),
        'Email: ' + (data.get('email') || ''),
        'Service needed: ' + (data.get('service') || ''),
        '',
        (data.get('message') || '')
      ];
      var subject = (form.getAttribute('data-subject') || 'Cleaning request') + (name ? ' - ' + name : '');
      var status = form.querySelector('.form-status');
      if (status) { status.textContent = 'Opening your email app with your request ready to send to Atlanta Peach Cleaning Company…'; }
      window.location.href = mailtoHref(subject, lines.join('\n'));
    });
  });

  function mailtoHref(subject, body) {
    return 'mailto:' + RECIPIENT + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  }

  /* ------------------------------------------------------------------ *
   * Online booking
   * ------------------------------------------------------------------ */
  var form = document.getElementById('booking-form');
  if (!form) { return; }

  var ALL_SLOTS = ['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM'];
  var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  var SERVICES = [
    { id: 'Residential Cleaning', desc: 'Keep your home clean, fresh, and comfortable.', price: 'Quote after review', sub: '' },
    { id: 'Commercial Cleaning', desc: 'Maintain a clean and professional environment for your business.', price: 'Quote after review', sub: '' },
    { id: 'Weekly Commercial Clean', desc: 'Up to 3,000 sq. ft., once a week. Trash removal, restroom sanitization, surface dusting, floor mopping.', price: '$375 – $400', sub: 'estimated / week' },
    { id: 'Day Porter Service', desc: 'Daily shift. Ongoing lobby maintenance, restroom restocking, spill pickup, trash care.', price: 'Custom quote', sub: '' },
    { id: 'Janitorial Services', desc: 'Reliable cleaning support for workplaces and facilities.', price: 'Quote after review', sub: '' },
    { id: 'Flooring Services', desc: 'Cleaning and flooring-related support to help maintain clean, well-presented spaces.', price: 'Quote after review', sub: '' }
  ];

  /* Sample team + sample availability. Replace with real staff and schedules. */
  var TEAM = [
    { id: 'any', name: 'Any available cleaner', role: 'We’ll match you with the best fit', img: 'images/team-any.svg', days: [1, 2, 3, 4, 5, 6], slots: ALL_SLOTS },
    { id: '1', name: 'Team Member 1', role: 'Cleaning Specialist', img: 'https://images.unsplash.com/photo-1662850886700-4ec19bd30d11?auto=format&fit=crop&crop=faces&w=160&h=160&q=70', days: [1, 2, 3, 4, 5], slots: ALL_SLOTS },
    { id: '2', name: 'Team Member 2', role: 'Cleaning Specialist', img: 'https://images.unsplash.com/photo-1573496527892-904f897eb744?auto=format&fit=crop&crop=faces&w=160&h=160&q=70', days: [2, 3, 4, 5, 6], slots: ALL_SLOTS },
    { id: '3', name: 'Team Member 3', role: 'Cleaning Specialist', img: 'https://images.unsplash.com/photo-1592275772614-ec71b19e326f?auto=format&fit=crop&crop=faces&w=160&h=160&q=70', days: [1, 3, 5, 6], slots: ['10:00 AM', '12:00 PM', '2:00 PM'] },
    { id: '4', name: 'Team Member 4', role: 'Cleaning Specialist', img: 'https://images.unsplash.com/photo-1589386417686-0d34b5903d23?auto=format&fit=crop&crop=faces&w=160&h=160&q=70', days: [1, 2, 3, 4], slots: ['8:00 AM', '10:00 AM', '12:00 PM'] }
  ];

  var state = { step: 1, service: '', cleaner: 'any', date: null, slot: '', pay: 'invoice' };
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var earliest = addDays(today, 1);
  var latest = addDays(today, 90);
  var view = { y: earliest.getFullYear(), m: earliest.getMonth() };

  var el = {
    steps: form.querySelectorAll('.book-step'),
    stepper: document.querySelectorAll('#stepper li'),
    back: document.getElementById('btn-back'),
    next: document.getElementById('btn-next'),
    error: document.getElementById('step-error'),
    services: document.getElementById('service-options'),
    cleaners: document.getElementById('cleaner-options'),
    calHead: document.getElementById('cal-title'),
    calGrid: document.getElementById('cal-grid'),
    calPrev: document.getElementById('cal-prev'),
    calNext: document.getElementById('cal-next'),
    slots: document.getElementById('slots'),
    slotsSub: document.getElementById('slots-sub'),
    availNote: document.getElementById('avail-note'),
    review: document.getElementById('review'),
    success: document.getElementById('success'),
    panel: document.getElementById('booking-panel'),
    sum: {
      service: document.getElementById('sum-service'),
      cleaner: document.getElementById('sum-cleaner'),
      when: document.getElementById('sum-when'),
      price: document.getElementById('sum-price')
    }
  };

  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function same(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function getService() { return SERVICES.filter(function (s) { return s.id === state.service; })[0]; }
  function getCleaner() { return TEAM.filter(function (t) { return t.id === state.cleaner; })[0] || TEAM[0]; }
  function fmtDate(d) { return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }); }
  function priceText(s) { return s ? (s.price + (s.sub ? ' ' + s.sub : '')) : ''; }
  function node(tag, cls, text) { var n = document.createElement(tag); if (cls) { n.className = cls; } if (text != null) { n.textContent = text; } return n; }
  function availText(t) {
    if (t.id === 'any') { return 'Mon – Sat'; }
    return t.days.map(function (d) { return DAY_NAMES[d]; }).join(', ');
  }

  /* ---- Step 1: services ---- */
  function renderServices() {
    el.services.textContent = '';
    SERVICES.forEach(function (s) {
      var label = node('label', 'opt');
      var input = node('input'); input.type = 'radio'; input.name = 'service'; input.value = s.id; input.checked = state.service === s.id;
      input.addEventListener('change', function () { state.service = s.id; updateSummary(); clearError(); });
      var dot = node('span', 'dot');
      var info = node('span', 'info'); info.appendChild(node('strong', '', s.id)); info.appendChild(node('span', 'desc', s.desc));
      var price = node('span', 'price', s.price); if (s.sub) { price.appendChild(node('small', '', s.sub)); }
      label.appendChild(input); label.appendChild(dot); label.appendChild(info); label.appendChild(price);
      el.services.appendChild(label);
    });
  }

  /* ---- Step 2: cleaners ---- */
  function renderCleaners() {
    el.cleaners.textContent = '';
    TEAM.forEach(function (t) {
      var label = node('label', 'pick');
      var input = node('input'); input.type = 'radio'; input.name = 'cleaner'; input.value = t.id; input.checked = state.cleaner === t.id;
      input.addEventListener('change', function () {
        state.cleaner = t.id;
        if (state.date && !isDayOpen(state.date)) { state.date = null; state.slot = ''; }
        if (state.slot && getCleaner().slots.indexOf(state.slot) === -1) { state.slot = ''; }
        updateSummary(); clearError();
      });
      var img = node('img'); img.src = t.img; img.alt = ''; img.width = 64; img.height = 64;
      var txt = node('span'); txt.appendChild(node('strong', '', t.name)); txt.appendChild(node('span', 'meta', t.role)); txt.appendChild(node('span', 'meta', 'Sample availability: ' + availText(t)));
      var check = node('span', 'check'); check.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-check"/></svg>';
      label.appendChild(input); label.appendChild(img); label.appendChild(txt); label.appendChild(check);
      el.cleaners.appendChild(label);
    });
  }

  /* ---- Step 3: calendar + slots ---- */
  function isDayOpen(d) {
    return d >= earliest && d <= latest && getCleaner().days.indexOf(d.getDay()) !== -1;
  }
  function renderCalendar() {
    var first = new Date(view.y, view.m, 1);
    el.calHead.textContent = first.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    el.calGrid.textContent = '';
    DAY_NAMES.forEach(function (n) { el.calGrid.appendChild(node('div', 'cal-dow', n)); });
    for (var i = 0; i < first.getDay(); i++) { el.calGrid.appendChild(node('span', 'cal-day is-empty')); }
    var count = new Date(view.y, view.m + 1, 0).getDate();
    for (var day = 1; day <= count; day++) {
      (function (d) {
        var date = new Date(view.y, view.m, d);
        var b = node('button', 'cal-day', String(d)); b.type = 'button';
        var open = isDayOpen(date);
        b.disabled = !open;
        if (same(date, state.date)) { b.classList.add('is-selected'); b.setAttribute('aria-pressed', 'true'); }
        b.setAttribute('aria-label', fmtDate(date) + (open ? '' : ' (unavailable)'));
        b.addEventListener('click', function () { state.date = date; state.slot = ''; clearError(); renderCalendar(); renderSlots(); updateSummary(); });
        el.calGrid.appendChild(b);
      })(day);
    }
    el.calPrev.disabled = (view.y === earliest.getFullYear() && view.m <= earliest.getMonth());
    el.calNext.disabled = (view.y === latest.getFullYear() && view.m >= latest.getMonth());
  }
  function renderSlots() {
    el.slots.textContent = '';
    var c = getCleaner();
    if (!state.date) { el.slotsSub.textContent = 'Select a date to see available times.'; }
    else { el.slotsSub.textContent = fmtDate(state.date) + ' • ' + (c.id === 'any' ? 'any available cleaner' : c.name); }
    if (!state.date) { return; }
    c.slots.forEach(function (s) {
      var b = node('button', 'slot', s); b.type = 'button';
      b.setAttribute('aria-pressed', String(state.slot === s));
      b.addEventListener('click', function () { state.slot = s; clearError(); renderSlots(); updateSummary(); });
      el.slots.appendChild(b);
    });
  }
  el.calPrev.addEventListener('click', function () { view.m--; if (view.m < 0) { view.m = 11; view.y--; } renderCalendar(); });
  el.calNext.addEventListener('click', function () { view.m++; if (view.m > 11) { view.m = 0; view.y++; } renderCalendar(); });

  /* ---- Step 5: review ---- */
  function details() {
    var d = new FormData(form);
    return {
      name: String(d.get('name') || '').trim(), phone: String(d.get('phone') || '').trim(), email: String(d.get('email') || '').trim(),
      address: String(d.get('address') || '').trim(), notes: String(d.get('notes') || '').trim()
    };
  }
  function renderReview() {
    var d = details(), s = getService(), c = getCleaner();
    var rows = [
      ['Service', state.service], ['Estimated price', priceText(s)], ['Cleaner', c.name],
      ['Date', state.date ? fmtDate(state.date) : ''], ['Time', state.slot],
      ['Name', d.name], ['Phone', d.phone], ['Email', d.email], ['Service address', d.address]
    ];
    if (d.notes) { rows.push(['Notes', d.notes]); }
    el.review.textContent = '';
    rows.forEach(function (r) { var row = node('div'); row.appendChild(node('span', 'k', r[0])); row.appendChild(node('span', 'v', r[1])); el.review.appendChild(row); });
  }

  /* ---- Summary sidebar ---- */
  function setSum(target, text, emptyText) {
    target.textContent = text || emptyText;
    target.classList.toggle('empty', !text);
  }
  function updateSummary() {
    var s = getService(), c = getCleaner();
    setSum(el.sum.service, state.service, 'Not selected yet');
    setSum(el.sum.cleaner, c.name, 'Any available cleaner');
    setSum(el.sum.when, state.date ? fmtDate(state.date) + (state.slot ? ' at ' + state.slot : '') : '', 'Not selected yet');
    setSum(el.sum.price, s ? priceText(s) : '', '—');
  }

  /* ---- Navigation + validation ---- */
  function clearError() { el.error.textContent = ''; }
  function validate(step) {
    if (step === 1 && !state.service) { return 'Please choose a service to continue.'; }
    if (step === 3) {
      if (!state.date) { return 'Please pick an available date.'; }
      if (!state.slot) { return 'Please pick a time.'; }
    }
    if (step === 4) {
      var d = details();
      if (!d.name) { return 'Please enter your name.'; }
      if (d.phone.replace(/\D/g, '').length < 10) { return 'Please enter a valid phone number.'; }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(d.email)) { return 'Please enter a valid email address.'; }
      if (!d.address) { return 'Please enter the address to be cleaned.'; }
    }
    return '';
  }
  function showStep(n, initial) {
    state.step = n;
    el.steps.forEach(function (s) { s.hidden = Number(s.getAttribute('data-step')) !== n; });
    el.stepper.forEach(function (li, i) {
      li.classList.toggle('is-done', i + 1 < n);
      li.classList.toggle('is-current', i + 1 === n);
      if (i + 1 === n) { li.setAttribute('aria-current', 'step'); } else { li.removeAttribute('aria-current'); }
    });
    el.back.style.visibility = n === 1 ? 'hidden' : 'visible';
    el.next.textContent = n === 5 ? 'Request Booking' : 'Continue';
    if (n === 3) { renderCalendar(); renderSlots(); updateAvailNote(); }
    if (n === 5) { renderReview(); }
    clearError();
    if (initial) { return; }
    var h = form.querySelector('.book-step:not([hidden]) h2');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
    el.panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function updateAvailNote() {
    var c = getCleaner();
    el.availNote.querySelector('span').textContent = c.id === 'any'
      ? 'Showing days when at least one cleaner is available. Availability shown is a sample.'
      : 'Showing ' + c.name + '’s open days (' + availText(c) + '). Availability shown is a sample.';
  }

  el.next.addEventListener('click', function () {
    var msg = validate(state.step);
    if (msg) { el.error.textContent = msg; return; }
    if (state.step < 5) { showStep(state.step + 1); } else { submit(); }
  });
  el.back.addEventListener('click', function () { if (state.step > 1) { showStep(state.step - 1); } });
  form.addEventListener('submit', function (e) { e.preventDefault(); el.next.click(); });
  form.addEventListener('change', function (e) { if (e.target && e.target.name === 'pay') { state.pay = e.target.value; } });

  function submit() {
    var d = details(), s = getService(), c = getCleaner();
    var lines = [
      'BOOKING REQUEST', '',
      'Service: ' + state.service, 'Estimated price: ' + priceText(s), 'Cleaner: ' + c.name,
      'Date: ' + fmtDate(state.date), 'Time: ' + state.slot, '',
      'Name: ' + d.name, 'Phone: ' + d.phone, 'Email: ' + d.email, 'Service address: ' + d.address,
      'Notes: ' + (d.notes || '-'), '', 'Payment: Invoice / pay after service'
    ];
    var href = mailtoHref('Booking request - ' + state.service + ' - ' + d.name, lines.join('\n'));
    form.hidden = true;
    document.getElementById('stepper').hidden = true;
    el.success.hidden = false;
    document.getElementById('resend-link').setAttribute('href', href);
    el.panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.location.href = href;
  }

  /* ---- Init (supports ?service= and ?cleaner= deep links) ---- */
  var qs = params.get('service');
  if (qs && SERVICES.some(function (s) { return s.id === qs; })) { state.service = qs; }
  var qc = params.get('cleaner');
  if (qc && TEAM.some(function (t) { return t.id === qc; })) { state.cleaner = qc; }

  renderServices();
  renderCleaners();
  updateSummary();
  showStep(1, true);
})();
