/* GS Group Services — navigazione mobile
   Gestisce il menu hamburger e l'accordion della sezione Services.
   Su desktop (>768px) il menu è sempre visibile e questo script non interferisce. */

(function () {
  'use strict';

  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');
  if (!toggle || !nav) return;

  var megaToggle = document.querySelector('.mega-toggle');
  var mega = document.getElementById('mega-services');
  var desktop = window.matchMedia('(min-width: 769px)');

  function setNav(open) {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function setMega(open) {
    if (!mega || !megaToggle) return;
    mega.classList.toggle('is-open', open);
    megaToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  toggle.addEventListener('click', function () {
    setNav(!nav.classList.contains('is-open'));
  });

  if (megaToggle && mega) {
    megaToggle.addEventListener('click', function () {
      setMega(!mega.classList.contains('is-open'));
    });
  }

  /* Un link cliccato chiude il pannello: serve per i link con ancora (#telehandler),
     dove non c'è un cambio pagina a chiuderlo da solo. */
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a') && !desktop.matches) {
      setNav(false);
      setMega(false);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setNav(false);
      setMega(false);
      toggle.focus();
    }
  });

  /* Tornando a desktop si azzera lo stato, altrimenti il menu
     resterebbe "aperto" in un layout dove quel concetto non esiste. */
  function onBreakpoint(e) {
    if (e.matches) {
      setNav(false);
      setMega(false);
    }
  }
  if (desktop.addEventListener) {
    desktop.addEventListener('change', onBreakpoint);
  } else if (desktop.addListener) {
    desktop.addListener(onBreakpoint);
  }
})();
