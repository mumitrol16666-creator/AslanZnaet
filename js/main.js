/* Asylan Znaet — поведение главной страницы */
(function () {
  'use strict';

  /* Контакты лежат в js/config.js — там их и нужно менять. */
  var CONFIG = window.AZ_CONFIG || {};

  // Номер WhatsApp приводим к виду, который понимает wa.me: только цифры, с кодом страны.
  function waNumber() {
    var digits = String(CONFIG.whatsapp || '').replace(/\D/g, '');
    if (digits.length === 11 && digits.charAt(0) === '8') digits = '7' + digits.slice(1);
    if (digits.length === 10) digits = '7' + digits;
    return digits.length >= 11 ? digits : '';
  }
  function waLink(text) {
    var num = waNumber();
    return num ? 'https://wa.me/' + num + '?text=' + encodeURIComponent(text) : '';
  }
  function openInNewTab(url) {
    var w = window.open(url, '_blank');
    if (w) { try { w.opener = null; } catch (e) { /* не страшно */ } }
    else window.location.href = url; // всплывающее окно заблокировано — открываем в этой вкладке
  }

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /* ---------- Контакты ---------- */
  var links = {
    whatsapp: waLink('Здравствуйте, Асылан! Хочу узнать про обучение 1С и бухгалтерии.'),
    telegram: CONFIG.telegram && 'https://t.me/' + String(CONFIG.telegram).replace(/^@/, ''),
    instagram: CONFIG.instagram && 'https://instagram.com/' + String(CONFIG.instagram).replace(/^@/, '')
  };
  $$('[data-contact]').forEach(function (a) {
    var url = links[a.dataset.contact];
    if (url) { a.href = url; a.target = '_blank'; a.rel = 'noopener'; }
    else if (a.hasAttribute('data-optional')) a.hidden = true; // контакт не указан — ссылку не показываем
  });

  /* ---------- Даты ---------- */
  var now = new Date();
  var dateEl = $('#formDate');
  if (dateEl) dateEl.textContent = now.toLocaleDateString('ru-RU');
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = now.getFullYear();

  /* ---------- Печатающийся вопрос ---------- */
  (function typewriter() {
    var out = $('#askText');
    var box = $('.ask');
    var title = $('.hero__title');
    if (!out || !box) return;
    var questions = [
      'Почему не сходится ОСВ?',
      'Как выписать ЭСФ в 1С?',
      'Как заполнить форму 910?',
      'Как начислить зарплату?',
      'Как оформить СНТ?',
      'Как закрыть месяц в 1С?'
    ];
    var i = 0;

    function answered() {
      box.classList.add('is-answered');
      if (title && !reduceMotion) {
        title.classList.remove('is-pop');
        void title.offsetWidth;
        title.classList.add('is-pop');
      }
    }

    async function run() {
      answered();
      await wait(2200);
      for (;;) {
        var text = out.textContent;
        box.classList.remove('is-answered');
        if (reduceMotion) {
          i = (i + 1) % questions.length;
          out.textContent = questions[i];
        } else {
          for (var n = text.length; n >= 0; n--) { out.textContent = text.slice(0, n); await wait(18); }
          i = (i + 1) % questions.length;
          var next = questions[i];
          await wait(250);
          for (var k = 1; k <= next.length; k++) { out.textContent = next.slice(0, k); await wait(48); }
        }
        await wait(350);
        answered();
        await wait(2400);
      }
    }
    run();
  })();

  /* ---------- Карточка «Закрытие месяца» ---------- */
  (function closeMonth() {
    var items = $$('#closeList li');
    if (!items.length) return;
    if (reduceMotion) { items.forEach(function (li) { li.classList.add('is-done'); }); return; }
    async function loop() {
      for (;;) {
        items.forEach(function (li) { li.classList.remove('is-done'); });
        await wait(900);
        for (var i = 0; i < items.length; i++) { items[i].classList.add('is-done'); await wait(800); }
        await wait(2600);
      }
    }
    loop();
  })();

  /* ---------- Карточка «ОСВ»: дебет и кредит сходятся ---------- */
  (function osvCount() {
    var nums = $$('[data-count]');
    var ok = $('#osvOk');
    if (!nums.length) return;
    var fmt = function (v) { return Math.round(v).toLocaleString('ru-RU').replace(/ | /g, ' '); };
    if (reduceMotion) { if (ok) ok.classList.add('is-on'); return; }

    function play() {
      if (ok) ok.classList.remove('is-on');
      var start = performance.now();
      var dur = 1700;
      // кредит сначала «отстаёт», потом догоняет — цифры сходятся в конце
      function frame(t) {
        var p = Math.min((t - start) / dur, 1);
        var e = 1 - Math.pow(1 - p, 3);
        nums.forEach(function (el, idx) {
          var target = +el.dataset.count;
          var lag = idx === 1 ? Math.pow(p, 1.8) : e;
          el.textContent = fmt(target * lag);
        });
        if (p < 1) requestAnimationFrame(frame);
        else if (ok) ok.classList.add('is-on');
      }
      requestAnimationFrame(frame);
    }
    play();
    setInterval(play, 7000);
  })();

  /* ---------- Параллакс на первом экране ---------- */
  (function parallax() {
    var visual = $('#heroVisual');
    var hero = $('.hero');
    if (!visual || !hero || reduceMotion || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    var raf = 0;
    hero.addEventListener('pointermove', function (e) {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        var r = hero.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        visual.style.setProperty('--px', (x * 16).toFixed(1) + 'px');
        visual.style.setProperty('--py', (y * 12).toFixed(1) + 'px');
      });
    });
    hero.addEventListener('pointerleave', function () {
      visual.style.setProperty('--px', '0px');
      visual.style.setProperty('--py', '0px');
    });
  })();

  /* ---------- Появление блоков при прокрутке ---------- */
  (function reveal() {
    var els = $$('.reveal');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Программа: переключение модулей ---------- */
  (function program() {
    var tabs = $$('.app__nav [role="tab"]');
    var status = $('#modStatus');
    var nextBtn = $('#modNext');
    if (!tabs.length) return;
    var current = 0;

    function show(idx, focus) {
      current = (idx + tabs.length) % tabs.length;
      tabs.forEach(function (tab, i) {
        var on = i === current;
        tab.classList.toggle('is-active', on);
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(tab.getAttribute('aria-controls'));
        if (panel) { panel.hidden = !on; panel.classList.toggle('is-active', on); }
      });
      if (status) status.textContent = (current + 1) + ' из ' + tabs.length + ' модулей';
      var active = tabs[current];
      var nav = active.parentElement;
      if (nav.scrollWidth > nav.clientWidth) {
        nav.scrollTo({ left: active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
      }
      if (focus) active.focus({ preventScroll: true });
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { show(i); });
      tab.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); show(current + 1, true); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1, true); }
        if (e.key === 'Home') { e.preventDefault(); show(0, true); }
        if (e.key === 'End') { e.preventDefault(); show(tabs.length - 1, true); }
      });
    });
    if (nextBtn) nextBtn.addEventListener('click', function () { show(current + 1); });
  })();

  /* ---------- Подсветка активного раздела в шапке ---------- */
  (function spy() {
    var row = $('#sectionsRow');
    var navLinks = $$('[data-spy]');
    var sections = $$('[data-section]');
    if (!row || !sections.length || !('IntersectionObserver' in window)) return;

    function activate(name) {
      navLinks.forEach(function (a) {
        var on = a.dataset.spy === name;
        if (on && !a.classList.contains('is-active') && row.scrollWidth > row.clientWidth) {
          row.scrollTo({ left: a.offsetLeft - (row.clientWidth - a.offsetWidth) / 2, behavior: reduceMotion ? 'auto' : 'smooth' });
        }
        a.classList.toggle('is-active', on);
      });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var name = en.target.dataset.section;
        activate(name === 'zayavka' ? '' : name);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { io.observe(s); });
  })();

  /* ---------- Уведомление ---------- */
  var toast = $('#toast');
  var toastTimer = 0;
  function showToast(title, text, opts) {
    if (!toast) return;
    opts = opts || {};
    $('#toastTitle').textContent = title;
    $('#toastText').textContent = text;
    $('#toastLink').hidden = !opts.link;
    toast.hidden = false;
    toast.style.animation = 'none';
    void toast.offsetWidth;
    toast.style.animation = '';
    clearTimeout(toastTimer);
    if (opts.autoHide) toastTimer = setTimeout(function () { toast.hidden = true; }, opts.autoHide);
  }
  if (toast) {
    $('.toast__x', toast).addEventListener('click', function () { toast.hidden = true; });
    $('#toastLink').addEventListener('click', function () { toast.hidden = true; });

  }

  /* ---------- Всплывающее окно с вопросом ---------- */
  // Показываем один раз за визит: человек дочитал до середины, пробыл на странице 40 секунд
  // или повёл мышь к закрытию вкладки. Рядом с формой заявки и после её отправки не показываем.
  (function popup() {
    var pop = $('#pop');
    var popForm = $('#popForm');
    if (!pop || !popForm) return;
    var shown = false;
    try { shown = sessionStorage.getItem('az-pop') === '1'; } catch (e) { /* хранилище недоступно */ }
    var formSection = $('#zayavka');
    var lastFocus = null;
    var crm = !!CONFIG.endpoint;
    if (crm) $('#popBtnText').textContent = 'Перейти к заявке';

    function busy() {
      var a = document.activeElement;
      var typing = a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName);
      var nearForm = formSection && formSection.getBoundingClientRect().top < window.innerHeight * 0.8 &&
        formSection.getBoundingClientRect().bottom > 0;
      var sent = $('#formDone') && !$('#formDone').hidden;
      return typing || nearForm || sent;
    }
    function open() {
      if (shown || busy()) return;
      shown = true;
      try { sessionStorage.setItem('az-pop', '1'); } catch (e) { /* не страшно */ }
      stopWatching();
      lastFocus = document.activeElement;
      pop.hidden = false;
      document.documentElement.classList.add('is-pop-open');
      popForm.elements.name.focus({ preventScroll: true });
    }
    function close() {
      pop.hidden = true;
      document.documentElement.classList.remove('is-pop-open');
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    var onScroll = function () {
      var seen = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (seen > 0.45) open();
    };
    var onLeave = function (e) { if (e.clientY <= 0 && !e.relatedTarget) open(); };
    var timer = setTimeout(open, 40000);
    function stopWatching() {
      clearTimeout(timer);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('mouseout', onLeave);
    }
    if (shown) stopWatching();
    else {
      window.addEventListener('scroll', onScroll, { passive: true });
      document.addEventListener('mouseout', onLeave);
    }

    $$('[data-pop-close]', pop).forEach(function (el) { el.addEventListener('click', close); });
    document.addEventListener('keydown', function (e) {
      if (pop.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') { // фокус не уходит из окна
        var items = $$('input, button', popForm);
        var first = items[0], last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    popForm.addEventListener('input', function () { $('.field', popForm).classList.remove('is-invalid'); });
    popForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = popForm.elements.name;
      var name = input.value.trim();
      if (name.length < 2) { $('.field', popForm).classList.add('is-invalid'); input.focus(); return; }
      var mainForm = $('#leadForm');
      if (mainForm) mainForm.elements.name.value = name;
      var url = crm ? '' : waLink([
        'Здравствуйте, Асылан! Меня зовут ' + name + '.',
        'Хочу узнать про курс по 1С и бухгалтерии: ближайший поток, форматы и рассрочку на 12 месяцев.'
      ].join('\n'));
      close();
      if (url) openInNewTab(url);
      else if (formSection) formSection.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  })();

  /* ---------- Кнопка на телефоне ---------- */
  (function mobileCta() {
    var btn = $('#mcta');
    var hero = $('.hero');
    var form = $('#zayavka');
    if (!btn || !hero || !form || !('IntersectionObserver' in window)) return;
    var heroOn = true;
    var formOn = false;
    var update = function () { btn.classList.toggle('is-on', !heroOn && !formOn); };
    new IntersectionObserver(function (e) { heroOn = e[0].isIntersecting; update(); }).observe(hero);
    new IntersectionObserver(function (e) { formOn = e[0].isIntersecting; update(); }).observe(form);
  })();

  /* ---------- Потоки: прошедшие скрываем, ближайший отмечаем ---------- */
  (function streams() {
    var rows = $$('.stream');
    var select = $('#streamSelect');
    if (!rows.length) return;
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var parse = function (v) { var d = v.split('-'); return new Date(+d[0], d[1] - 1, +d[2]); };
    var open = rows.filter(function (r) {
      if (parse(r.dataset.start) < today) { r.hidden = true; return false; }
      if (parse(r.dataset.early) < today) {
        var early = $('.stream__early', r);
        early.textContent = 'закончилась'; early.classList.add('is-off');
      }
      return true;
    });
    if (select) {
      $$('option', select).forEach(function (o) {
        if (o.value && !open.some(function (r) { return r.dataset.label === o.value; })) o.parentNode.removeChild(o);
      });
    }
    if (!open.length) {
      $('#potoki').hidden = true;
      if ($('#streamField')) $('#streamField').hidden = true;
      return;
    }
    open[0].classList.add('is-next');
    var tag = document.createElement('span');
    tag.className = 'stream__tag'; tag.textContent = 'ближайший';
    $('.stream__date', open[0]).appendChild(tag);
    var next = $('#nextStart');
    if (next) next.textContent = open[0].dataset.label;
    $$('[data-stream]').forEach(function (a) {
      a.addEventListener('click', function () { if (select) select.value = a.dataset.stream; });
    });
  })();

  /* ---------- Выбор формата из карточек ---------- */
  var formatSelect = $('#formatSelect');
  $$('[data-plan]').forEach(function (a) {
    a.addEventListener('click', function () {
      if (!formatSelect) return;
      $$('option', formatSelect).forEach(function (o) { if (o.textContent === a.dataset.plan) formatSelect.value = o.value; });
    });
  });

  /* ---------- Форма заявки ---------- */
  (function leadForm() {
    var form = $('#leadForm');
    if (!form) return;
    var done = $('#formDone');
    var doneText = $('#formDoneText');
    var doneLink = $('#formDoneLink');
    var back = $('#formBack');

    // Два режима: заявка уходит в CRM (нужны телефон и согласие)
    // или открывается WhatsApp с готовым сообщением (номер человека Асылан увидит и так).
    var crmMode = !!CONFIG.endpoint;
    if (crmMode) {
      $$('[data-crm]', form).forEach(function (el) { el.hidden = false; });
      $('#formBtnText').textContent = 'Отправить заявку';
      $('#formNote').textContent = 'Перезвоним или напишем в WhatsApp в течение дня.';
    }
    if (back) back.addEventListener('click', function () { done.hidden = true; });

    function validate() {
      var ok = true;
      var name = form.elements.name;
      var phone = form.elements.phone;
      var consent = form.elements.consent;
      var checks = [[name, name.value.trim().length >= 2]];
      if (crmMode) {
        checks.push([phone, phone.value.replace(/\D/g, '').length >= 10]);
        checks.push([consent, consent.checked]);
      }
      var firstBad = null;
      checks.forEach(function (c) {
        var wrap = c[0].closest('label');
        wrap.classList.toggle('is-invalid', !c[1]);
        if (!c[1]) { ok = false; firstBad = firstBad || c[0]; }
      });
      if (firstBad) firstBad.focus();
      return ok;
    }

    form.addEventListener('input', function (e) {
      var wrap = e.target.closest('label');
      if (wrap) wrap.classList.remove('is-invalid');
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!validate()) return;

      var data = {
        name: form.elements.name.value.trim(),
        format: form.elements.format.value,
        stream: form.elements.stream ? form.elements.stream.value : '',
        question: form.elements.question.value.trim()
      };

      if (crmMode) {
        data.phone = form.elements.phone.value.trim();
        try {
          var res = await fetch(CONFIG.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          doneText.textContent = 'Спасибо! Асылан свяжется с вами в ближайшее время.';
          doneLink.hidden = true;
          back.hidden = true;
          done.hidden = false;
        } catch (err) {
          showToast('Заявка не отправлена', 'Не получилось связаться с сервером. Попробуйте ещё раз или напишите нам напрямую.', { autoHide: 8000 });
        }
        return;
      }

      // WhatsApp: собираем готовое сообщение, человеку остаётся нажать «Отправить».
      var lines = [
        'Здравствуйте, Асылан! Хочу записаться на обучение 1С и бухгалтерии.',
        'Меня зовут ' + data.name + '.',
        'Формат: ' + data.format + '.'
      ];
      if (data.stream) lines.push('Поток: старт ' + data.stream + '.');
      if (data.question) lines.push('Вопрос: ' + data.question);
      var url = waLink(lines.join('\n'));

      if (!url) {
        // Номер ещё не вписан в js/config.js — честно говорим, что заявка никуда не ушла.
        showToast('Номер WhatsApp не указан', 'Заявка пока никуда не отправляется. Впишите номер в файл js/config.js — и кнопка заработает.', { autoHide: 9000 });
        return;
      }

      doneLink.href = url;
      done.hidden = false;
      openInNewTab(url);
    });
  })();
})();
