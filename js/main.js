(function () {
  'use strict';

  var RECIPIENT = 'cheryllkates@gmail.com';

  /* Mobile navigation */
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

  /* Pre-select a service when arriving from a service card (?service=...) */
  var params = new URLSearchParams(window.location.search);
  var wanted = params.get('service');
  if (wanted) {
    document.querySelectorAll('select[name="service"]').forEach(function (select) {
      Array.prototype.forEach.call(select.options, function (opt) {
        if (opt.value === wanted) { select.value = wanted; }
      });
    });
  }

  /* Forms: no server is attached, so hand the request to the visitor's email app,
     addressed to the business. */
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
      var href = 'mailto:' + RECIPIENT +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(lines.join('\n'));

      var status = form.querySelector('.form-status');
      if (status) { status.textContent = 'Opening your email app with your request ready to send to Atlanta Peach Cleaning Company…'; }
      window.location.href = href;
    });
  });
})();
