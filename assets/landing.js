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
//  - Revealed parts get .in as they scroll into view and lose it once they have left, so they play again in
//    both scroll directions. Parts arriving together are staggered through --d, counted per parent, with the
//    step taken from the page's --stagger (seconds). --dir is -1 for parts that left through the top, so
//    pages can bring them back down into place when scrolling up.
//  - The hero itself is revealed too, so its load animation replays when you scroll back to the top.
//  - Cards get --mx / --my, the pointer position, for cursor-following light.
//  - [data-scan] strips mark each .chip with .caught while it passes the strip's centre line.
(function () {
  var root = document.documentElement;
  root.setAttribute('data-reveal-ready', '');
  if (!root.classList.contains('motion')) return;

  var REVEAL = '.hero, section h2, section .sub, .card, .ticks li, .steps li, details, .note, .gallery img, .shot, .demo, .final .wrap > *, [data-reveal]';
  var step = parseFloat(getComputedStyle(document.body).getPropertyValue('--stagger')) || .08;
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
      el.style.setProperty('--d', (counts[g]++ * step).toFixed(2) + 's');
      el.classList.add('in');
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: [0, .12] });
  document.querySelectorAll(REVEAL).forEach(function (el) {
    // inside the hero only the hero itself and its pictures are revealed; its text plays with the hero
    if (el.matches('.hero, .shot, .gallery img, .demo') || !el.closest('.hero')) io.observe(el);
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

// Smooth wheel scrolling: the wheel glides the page instead of jumping. Touch, keyboard, scrollbar and
// anchor links stay native; the glide just follows them.
(function () {
  if (matchMedia('(pointer: coarse)').matches) return;
  var root = document.documentElement, target = scrollY, raf = 0, ours = false;
  function maxY() { return root.scrollHeight - innerHeight; }
  function canScroll(el, dy) { // let an inner scroll area take the wheel while it still can move that way
    for (; el && el !== document.body && el !== root; el = el.parentElement) {
      var oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1 &&
          (dy > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0)) return true;
    }
    return false;
  }
  function step() {
    var y = scrollY, next = y + (target - y) * .085;
    if (Math.abs(target - next) < .6) next = target;
    ours = true; scrollTo({ top: next, behavior: 'instant' });
    raf = next === target ? 0 : requestAnimationFrame(step);
  }
  addEventListener('wheel', function (e) {
    if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || canScroll(e.target, e.deltaY)) return;
    e.preventDefault();
    var dy = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
    if (!raf) target = scrollY;
    target = Math.max(0, Math.min(maxY(), target + dy));
    if (!raf) raf = requestAnimationFrame(step);
  }, { passive: false });
  addEventListener('scroll', function () { if (ours) { ours = false; return; } if (!raf) target = scrollY; }, { passive: true });
  document.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a[href^="#"]') && raf) { cancelAnimationFrame(raf); raf = 0; }
  }, true);
})();
