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

// Motion engine shared by the project pages. It only marks things; each page's motion.css decides how
// they move, so the same engine gives every page its own style.
//  - Revealed parts get .in as they scroll into view. Parts arriving together are staggered through --d,
//    counted per parent, with the step taken from the page's --stagger (seconds).
//  - Cards get --mx / --my, the pointer position, for cursor-following light.
//  - [data-scan] strips mark each .chip with .caught while it passes the strip's centre line.
(function () {
  var root = document.documentElement;
  root.setAttribute('data-reveal-ready', '');
  if (!root.classList.contains('motion')) return;

  var REVEAL = 'section h2, section .sub, .card, .ticks li, .steps li, details, .note, .gallery img, .shot, .demo, .final .wrap > *, [data-reveal]';
  var step = parseFloat(getComputedStyle(document.body).getPropertyValue('--stagger')) || .08;
  var io = new IntersectionObserver(function (entries) {
    var groups = [], counts = [];
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target, g = groups.indexOf(el.parentNode);
      if (g < 0) { groups.push(el.parentNode); counts.push(0); g = groups.length - 1; }
      el.style.setProperty('--d', (counts[g]++ * step).toFixed(2) + 's');
      el.classList.add('in');
      io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
  document.querySelectorAll(REVEAL).forEach(function (el) {
    if (!el.closest('.hero') || el.matches('.shot, .gallery img, .demo')) io.observe(el); // the hero text plays on load instead
  });

  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  document.querySelectorAll('[data-scan]').forEach(function (strip) {
    var chips = strip.querySelectorAll('.chip'), running = false;
    function tick() {
      if (!running) return;
      var r = strip.getBoundingClientRect(), x = r.left + r.width / 2;
      chips.forEach(function (c) {
        var b = c.getBoundingClientRect();
        if (b.left <= x && b.right >= x && !c.classList.contains('caught')) {
          c.classList.add('caught');
          setTimeout(function () { c.classList.remove('caught'); }, 1400);
        }
      });
      requestAnimationFrame(tick);
    }
    new IntersectionObserver(function (es) {
      var was = running; running = es[0].isIntersecting;
      if (running && !was) requestAnimationFrame(tick); // only watch the strip while it is on screen
    }).observe(strip);
  });
})();
