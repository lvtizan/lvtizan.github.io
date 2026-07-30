/* YOYANT 移动端导航菜单 · 单一来源 · 每页 <script src="/assets/nav-menu.js" defer> 引入
   自动适配各页不同断点：JS 检测 .nav-links 是否被 CSS 隐藏，隐藏时才显示汉堡，
   汉堡菜单从现有 .nav-links + 主 CTA 克隆链接，无需改各页 HTML/CSS。 */
(function () {
  var links = document.querySelector('.nav-links');
  var right = document.querySelector('.nav-right');
  if (!links || !right) return;

  var css =
    '.nav-burger{display:none;background:transparent;border:1px solid var(--line-2,rgba(255,255,255,.17));color:var(--ink,#F6F7FB);width:38px;height:38px;border-radius:10px;cursor:pointer;align-items:center;justify-content:center;padding:0;flex:none}' +
    '.nav-burger span,.nav-burger span::before,.nav-burger span::after{content:"";display:block;width:18px;height:2px;background:currentColor;border-radius:2px;transition:transform .25s,opacity .2s}' +
    '.nav-burger span{position:relative}.nav-burger span::before,.nav-burger span::after{position:absolute;left:0}' +
    '.nav-burger span::before{top:-6px}.nav-burger span::after{top:6px}' +
    '.nav-burger.open span{background:transparent}' +
    '.nav-burger.open span::before{top:0;transform:rotate(45deg)}.nav-burger.open span::after{top:0;transform:rotate(-45deg)}' +
    '.nav-scrim{position:fixed;inset:0;background:rgba(4,5,8,.55);z-index:399;opacity:0;pointer-events:none;transition:opacity .3s;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}' +
    '.nav-scrim.open{opacity:1;pointer-events:auto}' +
    '.nav-drawer{position:fixed;top:0;right:0;bottom:0;width:min(80vw,320px);background:var(--bg-2,#0F1017);border-left:1px solid var(--line-2,rgba(255,255,255,.17));z-index:400;display:flex;flex-direction:column;padding:26px 24px calc(26px + env(safe-area-inset-bottom));transform:translateX(102%);transition:transform .32s cubic-bezier(.2,.7,.2,1);overflow-y:auto}' +
    '.nav-drawer.open{transform:none}' +
    '.nav-drawer .dh{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}' +
    '.nav-drawer .dh .wm{font-family:var(--disp,sans-serif);font-weight:700;font-size:19px;color:var(--ink,#F6F7FB)}.nav-drawer .dh .wm i{color:var(--accent,#4361FF);font-style:normal}' +
    '.nav-drawer .dx{background:none;border:none;color:var(--muted,#787C8B);font-size:24px;line-height:1;cursor:pointer;padding:2px 6px}.nav-drawer .dx:hover{color:var(--ink,#fff)}' +
    '.nav-drawer a{font-family:var(--sans,sans-serif);font-size:16.5px;color:var(--ink-2,#B7BAC6);padding:14px 2px;border-bottom:1px solid var(--line,rgba(255,255,255,.09));transition:color .2s}' +
    '.nav-drawer a:hover{color:var(--ink,#fff)}' +
    '.nav-drawer .dcta{margin-top:20px;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--accent,#4361FF);color:#fff;font-weight:700;font-size:15px;padding:13px 20px;border-radius:40px;border:none}' +
    '.nav-links a{position:relative}' +
    '.nav-links a.active{color:var(--ink,#fff)}' +
    '.nav-links a.active::after{content:"";position:absolute;left:0;bottom:0;width:100%;height:2px;background:var(--accent,#4361FF);border-radius:2px}';
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  // burger button
  var burger = document.createElement('button');
  burger.className = 'nav-burger';
  burger.setAttribute('aria-label', '打开菜单');
  burger.setAttribute('aria-expanded', 'false');
  burger.innerHTML = '<span></span>';
  right.appendChild(burger);

  // scrim + drawer
  var scrim = document.createElement('div');
  scrim.className = 'nav-scrim';
  var drawer = document.createElement('nav');
  drawer.className = 'nav-drawer';
  drawer.setAttribute('aria-label', '移动端导航');

  var linksHTML = '';
  links.querySelectorAll('a').forEach(function (a) {
    linksHTML += '<a href="' + a.getAttribute('href') + '">' + a.textContent + '</a>';
  });
  var ctaEl = right.querySelector('a.btn');
  var ctaHTML = ctaEl
    ? '<a class="dcta" href="' + ctaEl.getAttribute('href') + '">' + ctaEl.textContent.trim() + '</a>'
    : '';
  drawer.innerHTML =
    '<div class="dh"><span class="wm">YOYANT<i>.</i></span>' +
    '<button class="dx" aria-label="关闭菜单">✕</button></div>' +
    linksHTML + ctaHTML;
  document.body.appendChild(scrim);
  document.body.appendChild(drawer);

  function open() {
    drawer.classList.add('open'); scrim.classList.add('open'); burger.classList.add('open');
    burger.setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden';
  }
  function close() {
    drawer.classList.remove('open'); scrim.classList.remove('open'); burger.classList.remove('open');
    burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = '';
  }
  burger.addEventListener('click', function () {
    drawer.classList.contains('open') ? close() : open();
  });
  scrim.addEventListener('click', close);
  drawer.querySelector('.dx').addEventListener('click', close);
  drawer.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', close); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  // show burger only when the page's own CSS has hidden .nav-links
  function sync() {
    var hidden = getComputedStyle(links).display === 'none';
    burger.style.display = hidden ? 'inline-flex' : 'none';
    if (!hidden) close();
  }
  window.addEventListener('resize', sync);
  sync();

  // --- 当前项高亮(蓝下划线):页面链接按 URL 匹配 + 本页锚点滚动高亮 ---
  var navA = [].slice.call(links.querySelectorAll('a'));
  var path = location.pathname.replace(/index\.html$/, '');
  if (path.charAt(path.length - 1) !== '/') path += '';
  navA.forEach(function (a) {
    var href = a.getAttribute('href') || '';
    if (href.charAt(0) === '/') {
      var hp = href.replace(/index\.html$/, '');
      if (hp !== '/' && path.indexOf(hp) === 0) a.classList.add('active');
    }
  });
  var anchors = navA.filter(function (a) { return (a.getAttribute('href') || '').charAt(0) === '#'; });
  var map = anchors.map(function (a) {
    return { a: a, el: document.getElementById(a.getAttribute('href').slice(1)) };
  }).filter(function (m) { return m.el; });
  if (map.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          map.forEach(function (m) { m.a.classList.toggle('active', m.el === e.target); });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    map.forEach(function (m) { spy.observe(m.el); });
  }
})();
