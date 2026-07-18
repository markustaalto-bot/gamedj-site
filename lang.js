/* Game DJ — language routing.
   English pages live at /, Finnish mirrors at /fi/.
   Runs in <head> so the redirect happens before first paint. */
(function () {
  var KEY = 'gamedj.lang'

  function stored() {
    try { return localStorage.getItem(KEY) } catch (e) { return null }
  }
  function remember(lang) {
    try { localStorage.setItem(KEY, lang) } catch (e) { /* private mode */ }
  }

  var path = location.pathname
  var onFi = /^\/fi(\/|$)/.test(path)
  var current = onFi ? 'fi' : 'en'

  // "/fi/docs.html" -> "docs.html";  "/fi/" and "/" -> "index.html"
  function page() {
    var p = path.replace(/^\/fi(?=\/|$)/, '')
    var file = p.split('/').pop()
    return file || 'index.html'
  }
  function urlFor(lang) {
    return (lang === 'fi' ? '/fi/' : '/') + page() + location.hash
  }
  function prefersFinnish() {
    var langs = navigator.languages && navigator.languages.length
      ? navigator.languages
      : [navigator.language || '']
    for (var i = 0; i < langs.length; i++) {
      if (/^fi\b/i.test(langs[i])) return true
      // A non-Finnish language listed first wins: that visitor reads it better.
      if (/^[a-z]{2}\b/i.test(langs[i])) return false
    }
    return false
  }

  // An explicit ?lang= wins over everything and is remembered.
  var forced = null
  try { forced = new URLSearchParams(location.search).get('lang') } catch (e) { /* old browser */ }

  var want = null
  if (forced === 'fi' || forced === 'en') {
    remember(forced)
    want = forced
  } else {
    var choice = stored()
    want = choice === 'fi' || choice === 'en' ? choice : prefersFinnish() ? 'fi' : 'en'
  }

  // Compare resolved paths, never raw strings — this is the loop guard.
  if (want !== current) {
    var target = urlFor(want)
    if (target.split('#')[0] !== path) location.replace(target)
    return
  }

  // Already on the right language: wire up the switcher once the DOM exists.
  function wire() {
    var box = document.querySelector('.lang-switch')
    if (!box) return
    var links = box.querySelectorAll('a[data-lang]')
    for (var i = 0; i < links.length; i++) {
      ;(function (a) {
        var lang = a.getAttribute('data-lang')
        a.setAttribute('href', urlFor(lang))
        if (lang === current) a.setAttribute('aria-current', 'true')
        a.addEventListener('click', function () { remember(lang) })
      })(links[i])
    }
  }
  // Beta-ilmoitusbanneri jokaisen sivun ylälaitaan (kaksikielinen).
  // Betan päättyessä: poista tämä funktio + sen kutsu ja .beta-banner-CSS.
  function banner() {
    if (!document.body || document.querySelector('.beta-banner')) return
    var mail = '<a href="mailto:gamedj@waveric.fi?subject=Game%20DJ%20beta%20licence">gamedj@waveric.fi</a>'
    var el = document.createElement('div')
    el.className = 'beta-banner'
    el.innerHTML = current === 'fi'
      ? '<strong>BETA</strong> — Game DJ on yhä beta-vaiheessa. Haluatko lisenssin beta-aikana? Kirjoita ' + mail
      : '<strong>BETA</strong> — Game DJ is still in beta. Want a licence during the beta? Email ' + mail
    document.body.insertBefore(el, document.body.firstChild)
  }

  function init() { wire(); banner() }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init)
  } else {
    init()
  }
})()
