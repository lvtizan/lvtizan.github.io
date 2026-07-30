/* RESON — shared shop logic: catalog · cart(localStorage) · search · nav active · UI */
(function () {
  var BASE = '/work/reson/';
  var CAT = [
    { id: 'one',   name: 'RESON One',   price: 399, img: 'reson-p1', cat: 'Headphones',  blurb: 'Flagship over-ear headphones. Machined aluminium yokes, 40mm beryllium-coated drivers and adaptive noise cancellation tuned by ear, not by spec sheet. 40-hour battery.' },
    { id: 'air',   name: 'RESON Air',   price: 199, img: 'reson-p2', cat: 'Earbuds',     blurb: 'True-wireless earbuds with dual drivers and a machined aluminium case. Low-latency mode for film and games, 8 hours per charge, 32 in the case.' },
    { id: 'field', name: 'RESON Field', price: 249, img: 'reson-p3', cat: 'Speakers',    blurb: 'A portable speaker with a 360° perforated metal grille and passive bass radiators. IP67, 24-hour battery, and a sound that fills a room twice its size.' },
    { id: 'core',  name: 'RESON Core',  price: 349, img: 'reson-p4', cat: 'Amp & DAC',   blurb: 'Desktop headphone amp and DAC in brushed dark aluminium. Balanced output, a single machined volume knob, and enough headroom for anything you plug in.' },
    { id: 'studio',name: 'RESON Studio',price: 299, img: 'reson-p5', cat: 'Earbuds',     blurb: 'Wired in-ear monitors with CNC-machined shells and a braided detachable cable. Reference-flat tuning for people who mix, master, or just listen closely.' },
    { id: 'stand', name: 'RESON Stand', price: 89,  img: 'reson-p6', cat: 'Accessories', blurb: 'A machined-aluminium headphone stand in dark anodized finish. Weighted base, silicone cradle, cable channel. Built to outlast the headphones on it.' }
  ];
  window.RESON_CAT = CAT;
  function find(id){ for (var i=0;i<CAT.length;i++) if(CAT[i].id===id) return CAT[i]; return null; }
  function money(n){ return '$ ' + n.toLocaleString('en-US'); }

  /* ---- cart (localStorage) ---- */
  function getCart(){ try { return JSON.parse(localStorage.getItem('reson_cart')||'[]'); } catch(e){ return []; } }
  function saveCart(c){ try { localStorage.setItem('reson_cart', JSON.stringify(c)); } catch(e){} updateBadge(); }
  function count(){ return getCart().reduce(function(s,l){return s+l.qty;},0); }
  function add(id,size){ var c=getCart(),k=id+'|'+(size||'OS'),hit=null;
    c.forEach(function(l){ if(l.id+'|'+l.size===k) hit=l; });
    if(hit) hit.qty++; else c.push({id:id,size:size||'OS',qty:1});
    saveCart(c); }
  function updateBadge(){ var n=count(); document.querySelectorAll('[data-cart-n]').forEach(function(el){ el.textContent=n; el.style.display=n?'grid':'none'; }); }
  window.RESON_CART = { get:getCart, save:saveCart, add:add, count:count, find:find, money:money };

  /* ---- toast ---- */
  var toast;
  function showToast(msg){ if(!toast){ toast=document.createElement('div'); toast.className='toast'; document.body.appendChild(toast);} toast.textContent=msg; toast.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(function(){toast.classList.remove('show');},2000); }
  window.RESON_TOAST = showToast;

  document.addEventListener('DOMContentLoaded', function () {
    updateBadge();

    /* add-to-bag (event delegation → works for static AND dynamically-rendered buttons) */
    document.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('[data-add]') : null;
      if (!b) return;
      e.preventDefault(); e.stopPropagation();
      var id = b.getAttribute('data-id');
      var size = b.getAttribute('data-size') || (document.querySelector('.sizes button.on') ? document.querySelector('.sizes button.on').textContent : 'OS');
      if (!id) return;
      add(id, size);
      var p = find(id);
      showToast((p ? p.name : 'Item') + ' — added to bag');
    });

    /* variant select */
    document.querySelectorAll('.sizes').forEach(function (g) {
      g.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () { g.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); });
      });
    });

    /* newsletter fake submit */
    document.querySelectorAll('form[data-nl]').forEach(function (f) {
      f.addEventListener('submit', function (e) { e.preventDefault(); f.innerHTML = '<div style="color:var(--ink);font-size:13px;letter-spacing:.06em;padding:14px 0">Thanks — you’re on the list.</div>'; });
    });

    /* nav active: URL match + in-page scrollspy */
    var navA = [].slice.call(document.querySelectorAll('.nav-links a'));
    var path = location.pathname.replace(/index\.html$/, '');
    navA.forEach(function (a) {
      var href = (a.getAttribute('href') || '').replace(/index\.html$/, '');
      if (href.charAt(0) === '/' && href !== BASE && path.indexOf(href) === 0) a.classList.add('active');
    });
    var anchors = navA.filter(function (a) { return (a.getAttribute('href') || '').charAt(0) === '#'; });
    var map = anchors.map(function (a) { return { a: a, el: document.getElementById(a.getAttribute('href').slice(1)) }; }).filter(function (m) { return m.el; });
    if (map.length && 'IntersectionObserver' in window) {
      var spy = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) map.forEach(function (m) { m.a.classList.toggle('active', m.el === e.target); }); }); }, { rootMargin: '-45% 0px -50% 0px' });
      map.forEach(function (m) { spy.observe(m.el); });
    }

    /* reveal */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { threshold: .12, rootMargin: '0px 0px -8% 0px' });
      document.querySelectorAll('.reveal').forEach(function (el) { var sibs = [].slice.call(el.parentElement.children).filter(function (c) { return c.classList.contains('reveal'); }); el.style.transitionDelay = (sibs.indexOf(el) % 3) * 80 + 'ms'; io.observe(el); });
    } else { document.querySelectorAll('.reveal').forEach(function(el){el.classList.add('in');}); }

    /* search overlay (built once) */
    var trigs = document.querySelectorAll('[data-search]');
    if (trigs.length) {
      var ov = document.createElement('div'); ov.className = 'srch';
      ov.innerHTML = '<div class="wrap" style="width:100%;display:flex;flex-direction:column;height:100%"><div class="sr-top"><input type="search" placeholder="Search RESON…" aria-label="Search"><button class="sx">Close</button></div><div class="sr-res"><div class="sr-hint">Try “headphones”, “earbuds”, “amp”…</div><div class="sr-grid"></div></div></div>';
      document.body.appendChild(ov);
      var inp = ov.querySelector('input'), grid = ov.querySelector('.sr-grid'), hint = ov.querySelector('.sr-hint');
      function render(q) {
        q = (q || '').trim().toLowerCase();
        var res = q ? CAT.filter(function (p) { return (p.name + ' ' + p.cat + ' ' + p.blurb).toLowerCase().indexOf(q) > -1; }) : CAT;
        hint.textContent = q ? (res.length + ' result' + (res.length === 1 ? '' : 's')) : 'Try “headphones”, “earbuds”, “amp”…';
        grid.innerHTML = res.map(function (p) { return '<a class="card" href="' + BASE + 'product/?p=' + p.id + '"><div class="ph"><img src="/uploads/webp/' + p.img + '.webp" alt="' + p.name + '"></div><div class="meta"><div class="nm">' + p.name + '</div><div class="pr">' + money(p.price) + '</div></div></a>'; }).join('');
      }
      function openS() { ov.classList.add('open'); document.body.style.overflow = 'hidden'; render(''); setTimeout(function () { inp.focus(); }, 50); }
      function closeS() { ov.classList.remove('open'); document.body.style.overflow = ''; }
      trigs.forEach(function (t) { t.addEventListener('click', function (e) { e.preventDefault(); openS(); }); });
      ov.querySelector('.sx').addEventListener('click', closeS);
      inp.addEventListener('input', function () { render(inp.value); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeS(); });
    }
  });
})();
