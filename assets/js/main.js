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

  // ---------- Animated network in the hero ----------
  var svg = $('#net');
  if (svg) {
    var NS = 'http://www.w3.org/2000/svg';
    var nodes = {
      dc:  { x: 62,  y: 78,  label: 'Customer DC', lx: 0,  ly: -18, edge: true },
      az:  { x: 338, y: 78,  label: 'Azure',       lx: 0,  ly: -18, edge: true },
      pop: { x: 62,  y: 322, label: 'Edge PoP',    lx: 0,  ly: 28,  edge: true },
      gpu: { x: 338, y: 322, label: 'GPU cluster', lx: 0,  ly: 28,  edge: true },
      r1:  { x: 128, y: 140 }, r2: { x: 272, y: 140 },
      r3:  { x: 128, y: 260 }, r4: { x: 272, y: 260 },
      c1:  { x: 200, y: 172, core: true }, c2: { x: 200, y: 228, core: true },
      t1:  { x: 200, y: 92 },  t2: { x: 200, y: 308 },
      s1:  { x: 72,  y: 200 }, s2: { x: 328, y: 200 }
    };
    var links = [
      ['dc', 'r1'], ['az', 'r2'], ['pop', 'r3'], ['gpu', 'r4'],
      ['r1', 'c1'], ['r2', 'c1'], ['r3', 'c2'], ['r4', 'c2'],
      ['r1', 'c2'], ['r2', 'c2'], ['r3', 'c1'], ['r4', 'c1'], ['c1', 'c2'],
      ['r1', 't1'], ['r2', 't1'], ['r3', 't2'], ['r4', 't2'],
      ['r1', 's1'], ['r3', 's1'], ['r2', 's2'], ['r4', 's2']
    ];
    var adj = {};
    Object.keys(nodes).forEach(function (k) { adj[k] = []; });
    links.forEach(function (l) { adj[l[0]].push(l[1]); adj[l[1]].push(l[0]); });

    function el(tag, attrs, parent) {
      var e = document.createElementNS(NS, tag);
      for (var a in attrs) e.setAttribute(a, attrs[a]);
      (parent || svg).appendChild(e);
      return e;
    }
    var gLinks = el('g', {}), gPackets = el('g', {}), gNodes = el('g', {});
    var linkEls = {};
    links.forEach(function (l) {
      var a = nodes[l[0]], b = nodes[l[1]];
      linkEls[l[0] + l[1]] = linkEls[l[1] + l[0]] =
        el('line', { x1: a.x, y1: a.y, x2: b.x, y2: b.y, 'class': 'link' }, gLinks);
    });
    Object.keys(nodes).forEach(function (k) {
      var n = nodes[k], r = n.edge ? 9 : n.core ? 8 : 5;
      if (n.edge || n.core) el('circle', { cx: n.x, cy: n.y, r: r, 'class': 'node-ring', style: 'animation-delay:' + (Math.random() * 3).toFixed(2) + 's' }, gNodes);
      el('circle', { cx: n.x, cy: n.y, r: r, 'class': 'node' + (n.core ? ' core' : '') }, gNodes);
      if (n.label) {
        var t = el('text', { x: n.x + n.lx, y: n.y + n.ly, 'text-anchor': 'middle', 'class': 'label' }, gNodes);
        t.textContent = n.label;
      }
    });

    // Shortest path between two edge sites (BFS), so packets travel realistic routes through the core.
    function route(from, to) {
      var prev = {}, q = [from], seen = {}; seen[from] = true;
      while (q.length) {
        var cur = q.shift();
        if (cur === to) break;
        adj[cur].slice().sort(function () { return Math.random() - 0.5; }).forEach(function (nx) {
          if (!seen[nx]) { seen[nx] = true; prev[nx] = cur; q.push(nx); }
        });
      }
      var path = [to];
      while (path[0] !== from) path.unshift(prev[path[0]]);
      return path;
    }

    var edges = ['dc', 'az', 'pop', 'gpu'];
    var packets = [];
    function spawn() {
      var a = edges[Math.floor(Math.random() * 4)], b;
      do { b = edges[Math.floor(Math.random() * 4)]; } while (b === a);
      var path = route(a, b);
      packets.push({ path: path, hop: 0, t: 0, speed: 0.012 + Math.random() * 0.01, dot: el('circle', { r: 3.2, 'class': 'packet' }, gPackets) });
    }

    if (!reduce) {
      var running = true, last = 0, sinceSpawn = 0;
      function frame(ts) {
        if (!running) return;
        var dt = last ? Math.min((ts - last) / 16.7, 3) : 1; last = ts;
        sinceSpawn += dt;
        if (sinceSpawn > 38 && packets.length < 7) { spawn(); sinceSpawn = 0; }
        packets = packets.filter(function (p) {
          p.t += p.speed * dt;
          if (p.t >= 1) {
            var done = linkEls[p.path[p.hop] + p.path[p.hop + 1]];
            if (done) done.classList.remove('hot');
            p.hop++; p.t = 0;
            if (p.hop >= p.path.length - 1) { p.dot.remove(); return false; }
          }
          var a = nodes[p.path[p.hop]], b = nodes[p.path[p.hop + 1]];
          var l = linkEls[p.path[p.hop] + p.path[p.hop + 1]];
          if (l) l.classList.add('hot');
          p.dot.setAttribute('cx', a.x + (b.x - a.x) * p.t);
          p.dot.setAttribute('cy', a.y + (b.y - a.y) * p.t);
          return true;
        });
        requestAnimationFrame(frame);
      }
      function start() { if (!running) { running = true; last = 0; requestAnimationFrame(frame); } }
      function stop() { running = false; }
      spawn();
      requestAnimationFrame(frame);
      // Pause when the hero is off screen or the tab is hidden.
      if (hasIO) new IntersectionObserver(function (e) { e[0].isIntersecting ? start() : stop(); }).observe(svg);
      document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    }
  }
})();
