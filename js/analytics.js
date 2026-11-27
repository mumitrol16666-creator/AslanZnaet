/* Asylan Znaet — счётчики и согласие на cookie.
   Номера счётчиков вписываются в js/config.js. Пока все поля пустые,
   этот файл ничего не подключает и уведомление о cookie не показывает. */
(function () {
  'use strict';

  var C = window.AZ_CONFIG || {};
  var clean = function (v) { return String(v || '').trim(); };
  var ids = {
    ga4: clean(C.ga4),                 // G-XXXXXXXXXX
    ads: clean(C.googleAds),           // AW-XXXXXXXXX
    adsLead: clean(C.googleAdsLead),   // AW-XXXXXXXXX/метка конверсии «Заявка»
    meta: clean(C.metaPixel),          // цифры
    ym: clean(C.yandexMetrika)         // цифры
  };
  var configured = {
    google: !!(ids.ga4 || ids.ads),
    meta: !!ids.meta,
    yandex: !!ids.ym
  };
  var any = configured.google || configured.meta || configured.yandex;
  var KEY = 'az-consent';
  var loaded = false;

  function getConsent() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* хранилище недоступно */ } }
  function addScript(src) {
    var s = document.createElement('script');
    s.async = true; s.src = src;
    document.head.appendChild(s);
  }

  function load() {
    if (loaded || !any) return;
    loaded = true;
    if (configured.google) {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag('js', new Date());
      addScript('https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ids.ga4 || ids.ads));
      if (ids.ga4) window.gtag('config', ids.ga4);
      if (ids.ads) window.gtag('config', ids.ads);
    }
    if (configured.meta) {
      var n = window.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!window._fbq) window._fbq = n;
      n.push = n; n.loaded = true; n.version = '2.0'; n.queue = [];
      addScript('https://connect.facebook.net/en_US/fbevents.js');
      window.fbq('init', ids.meta);
      window.fbq('track', 'PageView');
    }
    if (configured.yandex) {
      window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
      window.ym.l = 1 * new Date();
      addScript('https://mc.yandex.ru/metrika/tag.js');
      window.ym(+ids.ym, 'init', { clickmap: true, trackLinks: true, accurateTrackBounce: true, webvisor: true });
    }
  }

  /* События для рекламы. Имя и телефон в них не передаются.
     lead — человек отправил заявку (открылся WhatsApp с сообщением), contact — нажал ссылку на WhatsApp. */
  window.AZ_track = function (name) {
    if (!loaded) return;
    try {
      // Шаги пробного задания: proba_view (задание на экране), proba_answer (выбран ответ), proba_correct.
      if (/^proba_/.test(name)) {
        if (window.gtag) window.gtag('event', name);
        if (window.fbq) window.fbq('trackCustom', name);
        if (window.ym) window.ym(+ids.ym, 'reachGoal', name);
        return;
      }
      if (window.gtag) {
        window.gtag('event', name === 'lead' ? 'generate_lead' : 'contact');
        if (name === 'lead' && ids.adsLead) window.gtag('event', 'conversion', { send_to: ids.adsLead });
      }
      if (window.fbq) window.fbq('track', name === 'lead' ? 'Lead' : 'Contact');
      if (window.ym) window.ym(+ids.ym, 'reachGoal', name === 'lead' ? 'lead' : 'whatsapp');
    } catch (e) { /* счётчик не загрузился — сайт работает дальше */ }
  };

  window.AZ_analytics = {
    configured: configured,
    reset: function () {
      try { localStorage.removeItem(KEY); } catch (e) { /* хранилище недоступно */ }
      location.reload();
    }
  };

  /* ---------- Уведомление о cookie ---------- */
  function banner() {
    var box = document.createElement('aside');
    box.className = 'consent';
    box.setAttribute('role', 'region');
    box.setAttribute('aria-label', 'Cookie');
    box.innerHTML =
      '<p>Сайт считает посещения и показывает рекламу тем, кто уже здесь был. Для этого нужны cookie. ' +
      '<a href="privacy.html">Какие данные собираем</a></p>' +
      '<div class="consent__btns">' +
      '<button type="button" class="btn btn--ink btn--sm" data-c="yes">Согласен</button>' +
      '<button type="button" class="btn btn--sm" data-c="no">Только нужные</button>' +
      '</div>';
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-c]');
      if (!b) return;
      setConsent(b.dataset.c);
      if (b.dataset.c === 'yes') load();
      box.remove();
    });
    document.body.appendChild(box);
  }

  if (!any) return;
  var consent = getConsent();
  if (consent === 'yes') load();
  else if (consent !== 'no') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', banner);
    else banner();
  }
})();
