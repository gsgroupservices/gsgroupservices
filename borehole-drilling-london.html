/* GS Group Services — consenso cookie e Google Analytics 4
   -------------------------------------------------------------
   GA4 viene caricato SOLO dopo un consenso esplicito.
   Finché il visitatore non sceglie, nessuno script di terze parti
   viene inserito e nessun cookie di analisi viene scritto.

   Scelta memorizzata in localStorage sotto 'gsCookieConsent':
     'granted' → GA4 attivo
     'denied'  → nessun tracciamento, il banner non ricompare
*/

(function () {
  'use strict';

  var GA_ID = 'G-3YT6HTNT11';
  var KEY = 'gsCookieConsent';

  function read() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function write(value) {
    try { localStorage.setItem(KEY, value); } catch (e) { /* storage bloccato: vale per questa sessione */ }
  }

  function loadAnalytics() {
    if (window.__gsAnalyticsLoaded) return;
    window.__gsAnalyticsLoaded = true;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
  }

  function init() {
    var banner = document.getElementById('cookie-banner');
    var saved = read();

    if (saved === 'granted') { loadAnalytics(); return; }
    if (saved === 'denied') return;
    if (!banner) return;

    function decide(value) {
      write(value);
      banner.classList.remove('is-visible');
      if (value === 'granted') loadAnalytics();
    }

    var accept = banner.querySelector('.cookie-accept');
    var reject = banner.querySelector('.cookie-reject');
    if (accept) accept.addEventListener('click', function () { decide('granted'); });
    if (reject) reject.addEventListener('click', function () { decide('denied'); });

    banner.classList.add('is-visible');
  }

  /* Permette di ripresentare il banner da un link nella privacy policy */
  window.gsResetCookieChoice = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    location.reload();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
