/* ============================================================
   OIL HUB — navigation controller
   - 3 modules embedded as persistent iframes (state preserved)
   - lazy load on first visit, then just toggle visibility
   - hash routing (#news / #dashboard / #station) for deep links
   ============================================================ */

(function () {
  'use strict';

  const VIEWS = {
    news: {
      title: 'OIL PULSE',
      url: 'https://hd-oil-news.vercel.app/',
      loadMsg: 'Loading news briefing',
    },
    /* [임시 비활성화] 유가 대시보드 — 항목을 VIEWS에서 빼면 #dashboard 직접 접속도 news로 되돌아감.
       되살리려면 아래 블록 주석만 해제하고 index.html의 버튼 주석도 함께 제거.
    dashboard: {
      title: '유가 대시보드',
      url: 'https://hd-oil-watch.vercel.app/',
      loadMsg: 'Loading price dashboard',
    },
    */
    station: {
      title: '주유소 신규개발 노트',
      url: 'https://newgasstation.vercel.app/',
      loadMsg: 'Loading development notes',
    },
  };

  const DEFAULT_VIEW = 'news';

  const stage     = document.getElementById('stage');
  const navItems  = Array.from(document.querySelectorAll('.nav-item'));
  const viewTitle = document.getElementById('viewTitle');
  const extLink   = document.getElementById('extLink');
  const reloadBtn = document.getElementById('reloadBtn');
  const menuBtn   = document.getElementById('menuBtn');
  const scrim     = document.getElementById('scrim');
  const brandHome = document.getElementById('brandHome');

  // holds { wrapper, iframe, loaded } per view id once created
  const mounted = {};
  let current = null;

  /* ---------- build (lazy) an iframe view ---------- */
  function mount(id) {
    if (mounted[id]) return mounted[id];

    const cfg = VIEWS[id];

    const wrapper = document.createElement('div');
    wrapper.className = 'view';
    wrapper.dataset.view = id;

    const loader = document.createElement('div');
    loader.className = 'loader';
    loader.innerHTML =
      '<div class="loader-inner">' +
        '<div class="barrel"></div>' +
        '<div class="loader-text">' + cfg.loadMsg + '</div>' +
        '<div class="loader-hint">로딩이 계속되면 일부 사이트는 임베드가 차단될 수 있습니다. ' +
          '<a href="' + cfg.url + '" target="_blank" rel="noopener">새 탭에서 열기 ↗</a></div>' +
      '</div>';

    const iframe = document.createElement('iframe');
    iframe.title = cfg.title;
    iframe.loading = 'eager';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.setAttribute('allow', 'clipboard-write; fullscreen; geolocation');

    // hide loader once the frame fires load
    iframe.addEventListener('load', function () {
      loader.classList.add('gone');
      clearTimeout(hintTimer);
    });

    // if it takes too long, surface the "open in new tab" hint
    const hintTimer = setTimeout(function () {
      const hint = loader.querySelector('.loader-hint');
      if (hint) hint.classList.add('show');
    }, 6000);

    iframe.src = cfg.url;

    wrapper.appendChild(iframe);
    wrapper.appendChild(loader);
    stage.appendChild(wrapper);

    mounted[id] = { wrapper, iframe, loader, loaded: true };
    return mounted[id];
  }

  /* ---------- activate a view ---------- */
  function show(id, fromHash) {
    if (!VIEWS[id]) id = DEFAULT_VIEW;
    if (id === current) {
      closeDrawer();
      return;
    }
    current = id;

    // ensure mounted, then toggle visibility across all
    mount(id);
    Object.keys(mounted).forEach(function (key) {
      mounted[key].wrapper.classList.toggle('active', key === id);
    });

    // nav state
    navItems.forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.view === id);
    });

    // chrome
    viewTitle.textContent = VIEWS[id].title;
    extLink.href = VIEWS[id].url;
    document.title = 'OIL HUB — ' + VIEWS[id].title;

    if (!fromHash) {
      history.replaceState(null, '', '#' + id);
    }

    closeDrawer();
  }

  /* ---------- drawer (mobile) ---------- */
  function openDrawer()  { document.body.classList.add('drawer-open'); }
  function closeDrawer() { document.body.classList.remove('drawer-open'); }
  function toggleDrawer() { document.body.classList.toggle('drawer-open'); }

  /* ---------- wire events ---------- */
  navItems.forEach(function (btn) {
    btn.addEventListener('click', function () { show(btn.dataset.view); });
  });

  menuBtn.addEventListener('click', toggleDrawer);
  scrim.addEventListener('click', closeDrawer);

  // brand logo → back to first screen (OIL PULSE); also closes the mobile drawer
  function goHome() { show('news'); }
  brandHome.addEventListener('click', goHome);
  brandHome.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goHome(); }
  });

  reloadBtn.addEventListener('click', function () {
    const m = mounted[current];
    if (!m) return;
    reloadBtn.classList.remove('spin');
    void reloadBtn.offsetWidth;          // restart animation
    reloadBtn.classList.add('spin');
    m.loader.classList.remove('gone');
    const hint = m.loader.querySelector('.loader-hint');
    if (hint) hint.classList.remove('show');
    // reassigning src forces a fresh load
    m.iframe.src = VIEWS[current].url;
  });

  window.addEventListener('hashchange', function () {
    const id = location.hash.replace('#', '');
    if (VIEWS[id]) show(id, true);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
  });

  /* ---------- clock ---------- */
  const clock = document.getElementById('clock');
  function tick() {
    const d = new Date();
    const p = function (n) { return String(n).padStart(2, '0'); };
    clock.textContent = p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- boot ---------- */
  const startId = VIEWS[location.hash.replace('#', '')] ? location.hash.replace('#', '') : DEFAULT_VIEW;
  show(startId, true);
})();
