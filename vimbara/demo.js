// The "Tell it" example on the Vimbara page: types each phrase from the app's README, then shows the
// card the app would draft for it. Without motion the first example stays as a still picture.
(function () {
  if (!document.documentElement.classList.contains('motion')) return;
  var demo = document.querySelector('.demo');
  if (!demo) return;
  var text = demo.querySelector('.tell-text'), draft = demo.querySelector('.draft');
  var kind = draft.querySelector('.draft-kind'), title = draft.querySelector('.draft-title'), detail = draft.querySelector('.draft-detail');
  var examples = [
    ['lunch 12.50', 'Expense', 'Lunch', '12.50 · Today'],
    ['dentist Fri 3pm', 'Event', 'Dentist', 'Friday · 3:00 pm'],
    ['remind me to call mum at 6', 'Reminder', 'Call mum', 'Today · 6:00 pm'],
  ];
  var n = 0, started = false;

  function type(s, i, done) {
    text.textContent = s.slice(0, i);
    if (i < s.length) setTimeout(function () { type(s, i + 1, done); }, 70 + Math.random() * 60);
    else done();
  }
  function next() {
    var ex = examples[n++ % examples.length];
    draft.classList.remove('show');
    setTimeout(function () {
      type(ex[0], 0, function () {
        setTimeout(function () {
          kind.textContent = ex[1]; title.textContent = ex[2]; detail.textContent = ex[3];
          draft.classList.add('show');
          setTimeout(next, 3400);
        }, 500);
      });
    }, 700);
  }
  // start once the example is on screen
  new IntersectionObserver(function (es, io) {
    if (!es[0].isIntersecting || started) return;
    started = true; io.disconnect();
    setTimeout(next, 900);
  }).observe(demo);
})();
