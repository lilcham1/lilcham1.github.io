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
