// Site behaviour. Every feature is optional: the page is complete without JS,
// and visitors who prefer reduced motion get the final state with no animation.
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // ---------- Skill filters ----------
  var buttons = $$('.filters button');
  var tags = $$('#skill-tags li');
  buttons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.dataset.filter;
      buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      tags.forEach(function (t) { t.hidden = f !== 'all' && t.dataset.cat !== f; });
    });
  });

  // ---------- Rotating tagline ----------
  var rot = $('#rot');
  if (rot && !reduce) {
    var phrases = ['to their AI compute', 'to the cloud', 'across 50+ regions', 'between clouds'];
    var pi = 0;
    setInterval(function () {
      rot.classList.add('out');
      setTimeout(function () {
        pi = (pi + 1) % phrases.length;
        rot.textContent = phrases[pi];
        rot.classList.remove('out');
      }, 350);
    }, 2800);
  }

  // ---------- Count-up stats ----------
  function countUp(el) {
    var target = +el.dataset.count, suffix = el.dataset.suffix || '', start = null, dur = 1400;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-US') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = $$('[data-count]');
  if (!reduce && hasIO) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { countUp(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  }

  // ---------- Scroll reveal (only for elements below the fold) ----------
  if (!reduce && hasIO) {
    var revealEls = $$('section h2, .card, .side-card, .about > div, .filters, .tags, .job, .impact, .contact');
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.remove('pre'); rio.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) {
      el.classList.add('reveal');
      if (el.getBoundingClientRect().top > window.innerHeight) {
        el.classList.add('pre');
        rio.observe(el);
      }
    });
  }

  // ---------- Scroll progress, active nav link, timeline fill ----------
  var bar = $('.progress');
  var navLinks = $$('.nav a');
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); });
  var timeline = $('.timeline');
  var jobs = $$('.job');
  var ticking = false;
  function onScroll() {
    ticking = false;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    if (bar) bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';

    var mark = window.innerHeight * 0.35, current = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= mark) current = i; });
    if (max > 0 && window.scrollY >= max - 4) current = sections.length - 1;
    navLinks.forEach(function (a, i) { a.classList.toggle('active', i === current); });

    if (timeline) {
      var r = timeline.getBoundingClientRect();
      var line = window.innerHeight * 0.6;
      var fill = Math.max(0, Math.min(r.height, line - r.top));
      timeline.style.setProperty('--fill', fill + 'px');
      jobs.forEach(function (j) { j.classList.toggle('lit', j.getBoundingClientRect().top + 14 <= line); });
    }
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();
