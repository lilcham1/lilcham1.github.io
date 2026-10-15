// Point the download buttons straight at the latest release file. Without the API
// they keep linking to the latest release page.
(function () {
  var repo = document.body.dataset.repo, pattern = document.body.dataset.asset;
  if (!repo || !pattern || !window.fetch) return;
  fetch('https://api.github.com/repos/' + repo + '/releases/latest', { headers: { Accept: 'application/vnd.github+json' } })
    .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
    .then(function (release) {
      var file = (release.assets || []).find(function (a) { return new RegExp(pattern, 'i').test(a.name); });
      if (!file) return;
      var size = file.size >= 1048576 ? (file.size / 1048576).toFixed(1) + ' MB' : Math.round(file.size / 1024) + ' KB';
      document.querySelectorAll('a.download').forEach(function (a) { a.href = file.browser_download_url; });
      document.querySelectorAll('.version').forEach(function (s) { s.textContent = 'Version ' + release.tag_name.replace(/^v/, '') + ' · ' + size; });
    })
    .catch(function () {});
})();

// Motion shared by the project pages. It only marks things; landing.css decides how they move.
//  - Revealed parts get .in as they scroll into view and lose it once they have left, so they play again in
//    both scroll directions. Parts arriving together are staggered through --d, counted per parent.
//    --dir is -1 for parts that left through the top, so they come back down into place when scrolling up.
//  - Reveals start once the opening sting has lifted (the page's --intro, in seconds); any wheel, key or
//    tap skips it.
//  - The nav marks the section being read, with one gold block sliding between the links.
(function () {
  var root = document.documentElement;
  root.setAttribute('data-reveal-ready', '');
  var motion = root.classList.contains('motion');

  if (motion) {
    var REVEAL = '.hero, .sec-head, section > .wrap > .sub, .card, ul.ticks li, ol.steps li, details, .note, .marquee, .final-panel';
    var io = new IntersectionObserver(function (entries) {
      var groups = [], counts = [];
      entries.forEach(function (e) {
        var el = e.target;
        if (!e.isIntersecting) {
          el.classList.remove('in');
          el.style.setProperty('--dir', e.boundingClientRect.top < 0 ? -1 : 1);
          return;
        }
        if (e.intersectionRatio < .12 || el.classList.contains('in')) return;
        var g = groups.indexOf(el.parentNode);
        if (g < 0) { groups.push(el.parentNode); counts.push(0); g = groups.length - 1; }
        el.style.setProperty('--d', (counts[g]++ * .08).toFixed(2) + 's');
        el.classList.add('in');
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: [0, .12] });
    var revealing = false;
    function startReveals() {
      if (revealing) return; revealing = true;
      document.querySelectorAll(REVEAL).forEach(function (el) { io.observe(el); });
    }
    var intro = document.querySelector('.sting') ? parseFloat(getComputedStyle(document.body).getPropertyValue('--intro')) || .85 : 0;
    var introTimer = setTimeout(startReveals, intro * 1000);
    var INPUT = ['wheel', 'keydown', 'pointerdown', 'touchstart'];
    function skipIntro() {
      INPUT.forEach(function (t) { removeEventListener(t, skipIntro); });
      if (revealing) return;
      root.classList.add('intro-skip'); clearTimeout(introTimer); startReveals();
    }
    if (intro) INPUT.forEach(function (t) { addEventListener(t, skipIntro, { passive: true }); });

    // the scanner's line sweeps the list it sits on, whatever its height
    document.querySelectorAll('.scan').forEach(function (s) {
      var list = s.querySelector('ul');
      function fit() { s.style.setProperty('--scan-h', (list.offsetTop + list.offsetHeight - 2) + 'px'); }
      fit(); addEventListener('resize', fit);
    });
  }

  /* nav: highlight the section being read */
  var links = Array.prototype.filter.call(document.querySelectorAll('header nav a'), function (a) { return a.hash && a.getAttribute('href').charAt(0) === '#'; });
  if (!links.length) return;
  var sections = links.map(function (a) { return document.getElementById(a.hash.slice(1)); });
  var nav = links[0].parentNode, ind = null, current = null, queued = false, lockUntil = 0;
  if (motion) { ind = document.createElement('span'); ind.className = 'nav-ind'; ind.setAttribute('aria-hidden', 'true'); nav.appendChild(ind); }
  function moveInd() {
    if (!ind) return;
    var a = nav.querySelector('a[aria-current="true"]');
    if (!a || !a.offsetWidth) { ind.style.opacity = '0'; return; }
    var appearing = ind.style.opacity !== '1';
    if (appearing) ind.style.transition = 'none'; // first appearance: show it in place, don't slide in from the left
    ind.style.width = a.offsetWidth + 'px'; ind.style.height = a.offsetHeight + 'px';
    ind.style.transform = 'translate(' + a.offsetLeft + 'px, ' + a.offsetTop + 'px)';
    if (appearing) { void ind.offsetWidth; ind.style.transition = ''; }
    ind.style.opacity = '1';
  }
  function mark(id) {
    links.forEach(function (a) { if (a.hash === '#' + id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    current = id; moveInd();
  }
  function sync() {
    if (performance.now() < lockUntil) return;
    var id = '', line = innerHeight * .45;
    sections.forEach(function (s) { if (s && s.getBoundingClientRect().top <= line) id = s.id; });
    if (id !== current) mark(id);
  }
  addEventListener('scroll', function () {
    if (performance.now() < lockUntil) { lockUntil = performance.now() + 200; return; }
    if (queued) return; queued = true;
    requestAnimationFrame(function () { queued = false; sync(); });
  }, { passive: true });
  addEventListener('resize', function () { sync(); moveInd(); });
  links.forEach(function (a) { a.addEventListener('click', function () { mark(a.hash.slice(1)); lockUntil = performance.now() + 600; }); });
  sync();
  if (document.fonts) document.fonts.ready.then(function () { sync(); moveInd(); });
})();
