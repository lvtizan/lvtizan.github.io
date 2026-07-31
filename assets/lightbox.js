/* Lightbox — click gallery images to view large, arrow/keyboard to navigate.
   Self-contained: injects its own CSS, no dependencies. Targets `figure img`. */
(function () {
  var imgs = [].slice.call(document.querySelectorAll('figure img'));
  if (!imgs.length) return;

  var items = imgs.map(function (img) {
    var cap = '';
    var fig = img.closest('figure');
    if (fig) { var fc = fig.querySelector('figcaption'); if (fc) cap = fc.textContent.trim(); }
    if (!cap) cap = img.getAttribute('alt') || '';
    return { el: img, cap: cap };
  });

  var css = document.createElement('style');
  css.textContent = [
    '.lb{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;',
    'background:#0A0A0E;padding:clamp(8px,2vw,24px)}',
    '.lb.on{display:flex}',
    '.lb-fig{margin:0;max-width:96vw;display:flex;flex-direction:column;align-items:center;gap:14px}',
    '.lb-img{max-width:98vw;max-height:94vh;width:auto;height:auto;object-fit:contain;border-radius:6px;box-shadow:0 30px 80px -20px rgba(0,0,0,.7);opacity:0;transition:opacity .18s}',
    '.lb-img.rdy{opacity:1}',
    '.lb-cap{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:12px;letter-spacing:.06em;color:#c7cbd6;text-align:center;max-width:90vw}',
    '.lb-btn{position:absolute;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.06);color:#fff;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;line-height:1;transition:background .2s}',
    '.lb-btn:hover{background:rgba(255,255,255,.16)}',
    '.lb-x{top:clamp(14px,2vw,26px);right:clamp(14px,2vw,26px);width:44px;height:44px;font-size:24px}',
    '.lb-nav{top:50%;transform:translateY(-50%);width:52px;height:52px;font-size:28px}',
    '.lb-prev{left:clamp(10px,2vw,32px)}.lb-next{right:clamp(10px,2vw,32px)}',
    '.lb-count{position:absolute;bottom:clamp(16px,2.4vw,30px);left:50%;transform:translateX(-50%);',
    'font-family:"JetBrains Mono",ui-monospace,monospace;font-size:12px;letter-spacing:.1em;color:#9aa0b0}',
    '@media(max-width:560px){.lb-nav{width:42px;height:42px;font-size:24px}.lb-x{width:38px;height:38px}}'
  ].join('');
  document.head.appendChild(css);

  var ov = document.createElement('div');
  ov.className = 'lb';
  ov.setAttribute('role', 'dialog');
  ov.setAttribute('aria-label', '图片查看');
  ov.innerHTML =
    '<button class="lb-btn lb-x" aria-label="关闭">✕</button>' +
    '<button class="lb-btn lb-nav lb-prev" aria-label="上一张">‹</button>' +
    '<figure class="lb-fig"><img class="lb-img" alt=""><figcaption class="lb-cap"></figcaption></figure>' +
    '<button class="lb-btn lb-nav lb-next" aria-label="下一张">›</button>' +
    '<div class="lb-count"></div>';
  document.body.appendChild(ov);

  var lbImg = ov.querySelector('.lb-img'),
      lbCap = ov.querySelector('.lb-cap'),
      lbCount = ov.querySelector('.lb-count'),
      i = 0, loadToken = 0;

  function show(n) {
    i = (n + items.length) % items.length;
    var it = items[i];
    var thumb = it.el.currentSrc || it.el.src;
    var full = it.el.getAttribute('data-full') || thumb;
    var myToken = ++loadToken;
    // 立即显示已加载的缩略图（不留空白），高清源下完再无缝换上；翻页竞态用 token 防串图
    lbImg.classList.add('rdy');
    lbImg.src = thumb;
    lbImg.alt = it.cap;
    if (full !== thumb) {
      var hi = new Image();
      hi.onload = function () { if (myToken === loadToken) lbImg.src = full; };
      hi.src = full;
    }
    lbCap.textContent = it.cap;
    lbCap.style.display = it.cap ? 'block' : 'none';
    lbCount.textContent = (i + 1) + ' / ' + items.length;
  }
  function open(n) { show(n); ov.classList.add('on'); document.body.style.overflow = 'hidden'; }
  function close() { ov.classList.remove('on'); document.body.style.overflow = ''; }

  items.forEach(function (it, idx) {
    it.el.style.cursor = 'zoom-in';
    it.el.addEventListener('click', function (e) { e.preventDefault(); open(idx); });
  });
  ov.querySelector('.lb-x').addEventListener('click', close);
  ov.querySelector('.lb-prev').addEventListener('click', function (e) { e.stopPropagation(); show(i - 1); });
  ov.querySelector('.lb-next').addEventListener('click', function (e) { e.stopPropagation(); show(i + 1); });
  ov.addEventListener('click', function (e) { if (e.target === ov || e.target.classList.contains('lb-fig')) close(); });
  document.addEventListener('keydown', function (e) {
    if (!ov.classList.contains('on')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') show(i - 1);
    else if (e.key === 'ArrowRight') show(i + 1);
  });
})();
