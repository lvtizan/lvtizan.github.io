/* AVELINE — shared shop logic: catalog · cart(localStorage) · search · nav active · UI */
(function () {
  var BASE = '/work/aveline/';
  var CAT = [
    { id: 'coat', name: 'The Wool Coat', price: 890, img: 'aveline-p1', cat: 'Outerwear', blurb: 'An unstructured double-breasted coat in pure Italian virgin wool. Dropped shoulders, a relaxed drape, horn buttons — made to be worn open for a decade.' },
    { id: 'knit', name: 'Ribbed Cashmere Knit', price: 340, img: 'aveline-p2', cat: 'Knitwear', blurb: 'A softly ribbed crew-neck in pure Grade-A Mongolian cashmere, knitted in a single Italian mill. Weighty, warm, quietly luxurious.' },
    { id: 'dress', name: 'Silk Slip Dress', price: 420, img: 'aveline-p3', cat: 'Dresses', blurb: 'A bias-cut slip in sandwashed silk with a fluid drape and adjustable straps. The one dress that carries a season.' },
    { id: 'trousers', name: 'Tailored Wool Trousers', price: 290, img: 'aveline-p4', cat: 'Trousers', blurb: 'High-rise wide-leg trousers in Italian wool with a pressed crease and a clean, elongating line.' },
    { id: 'blouse', name: 'The Silk Blouse', price: 260, img: 'aveline-p5', cat: 'Shirting', blurb: 'A relaxed silk-crepe blouse in soft champagne with a concealed placket. Considered ease, day to evening.' },
    { id: 'blazer', name: 'Structured Blazer', price: 520, img: 'aveline-p6', cat: 'Tailoring', blurb: 'A single-button blazer in taupe wool, softly structured through the shoulder for a clean, confident line.' }
  ];
  window.AVELINE_CAT = CAT;
  function find(id){ for (var i=0;i<CAT.length;i++) if(CAT[i].id===id) return CAT[i]; return null; }
  function money(n){ return '$ ' + n.toLocaleString('en-US'); }

  /* ---- cart (localStorage) ---- */
  function getCart(){ try { return JSON.parse(localStorage.getItem('aveline_cart')||'[]'); } catch(e){ return []; } }
  function saveCart(c){ try { localStorage.setItem('aveline_cart', JSON.stringify(c)); } catch(e){} updateBadge(); }
  function count(){ return getCart().reduce(function(s,l){return s+l.qty;},0); }
  function add(id,size){ var c=getCart(),k=id+'|'+(size||'OS'),hit=null;
    c.forEach(function(l){ if(l.id+'|'+l.size===k) hit=l; });
    if(hit) hit.qty++; else c.push({id:id,size:size||'OS',qty:1});
    saveCart(c); }
  function updateBadge(){ var n=count(); document.querySelectorAll('[data-cart-n]').forEach(function(el){ el.textContent=n; el.style.display=n?'grid':'none'; }); }
  window.AVELINE_CART = { get:getCart, save:saveCart, add:add, count:count, find:find, money:money };

  /* ---- toast ---- */
  var toast;
  function showToast(msg){ if(!toast){ toast=document.createElement('div'); toast.className='toast'; document.body.appendChild(toast);} toast.textContent=msg; toast.classList.add('show'); clearTimeout(toast._t); toast._t=setTimeout(function(){toast.classList.remove('show');},2000); }
  window.AVELINE_TOAST = showToast;

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

    /* size select */
    document.querySelectorAll('.sizes').forEach(function (g) {
      g.querySelectorAll('button').forEach(function (b) {
        b.addEventListener('click', function () { g.querySelectorAll('button').forEach(function (x) { x.classList.remove('on'); }); b.classList.add('on'); });
      });
    });

    /* newsletter fake submit */
    document.querySelectorAll('form[data-nl]').forEach(function (f) {
      f.addEventListener('submit', function (e) { e.preventDefault(); f.innerHTML = '<div style="color:#FBFAF6;font-size:13px;letter-spacing:.06em;padding:14px 0">Thank you — welcome to Aveline.</div>'; });
    });

    /* nav active: URL match + in-page scrollspy (clay underline) */
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
      ov.innerHTML = '<div class="wrap" style="width:100%;display:flex;flex-direction:column;height:100%"><div class="sr-top"><input type="search" placeholder="Search the collection…" aria-label="Search"><button class="sx">Close</button></div><div class="sr-res"><div class="sr-hint">Try “coat”, “cashmere”, “silk”…</div><div class="sr-grid"></div></div></div>';
      document.body.appendChild(ov);
      var inp = ov.querySelector('input'), grid = ov.querySelector('.sr-grid'), hint = ov.querySelector('.sr-hint');
      function render(q) {
        q = (q || '').trim().toLowerCase();
        var res = q ? CAT.filter(function (p) { return (p.name + ' ' + p.cat + ' ' + p.blurb).toLowerCase().indexOf(q) > -1; }) : CAT;
        hint.textContent = q ? (res.length + ' result' + (res.length === 1 ? '' : 's')) : 'Try “coat”, “cashmere”, “silk”…';
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
