/* YOYANT 中英文切换 · 在同一路径的 /en 镜像间往返 */
(function () {
  var path = window.location.pathname;
  var isEnglish = path === '/en' || path.indexOf('/en/') === 0;
  var counterpart = isEnglish ? (path.replace(/^\/en(?=\/|$)/, '') || '/') : '/en' + (path === '/' ? '/' : path);
  var label = isEnglish ? '中文' : 'EN';
  var language = isEnglish ? 'zh-CN' : 'en';
  var aria = isEnglish ? '切换到中文' : 'Switch to English';

  var existing = document.querySelector('.language-switch, [data-language-switch]');
  if (existing) {
    existing.href = counterpart;
    existing.textContent = label;
    existing.lang = language;
    existing.hreflang = language;
    existing.setAttribute('aria-label', aria);
    existing.setAttribute('title', label);
    return;
  }

  var style = document.createElement('style');
  style.textContent =
    '.yoyant-language-switch{display:inline-flex;align-items:center;justify-content:center;min-width:40px;height:34px;padding:0 12px;border:1px solid var(--line,var(--border-medium,rgba(255,255,255,.18)));border-radius:999px;background:var(--surface-2,var(--surface-container,rgba(255,255,255,.08)));color:var(--ink,var(--text-primary,#fff));font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;text-decoration:none;white-space:nowrap;transition:.2s}' +
    '.yoyant-language-switch:hover{border-color:var(--accent,var(--accent-primary,#4361ff));transform:translateY(-1px)}' +
    '.yoyant-language-switch.is-floating{position:fixed;left:18px;bottom:18px;z-index:290;box-shadow:0 12px 32px rgba(0,0,0,.28);backdrop-filter:blur(14px)}' +
    '@media(max-width:700px){.yoyant-language-switch{min-width:34px;height:32px;padding:0 9px}.yoyant-language-switch.is-floating{left:12px;bottom:12px}}';
  document.head.appendChild(style);

  var link = document.createElement('a');
  link.className = 'yoyant-language-switch';
  link.href = counterpart;
  link.textContent = label;
  link.lang = language;
  link.hreflang = language;
  link.setAttribute('aria-label', aria);
  link.setAttribute('title', label);
  link.setAttribute('data-language-switch', '');

  var slot = document.querySelector('.dock-actions, .nav-right, .nav-actions');
  if (slot) slot.insertBefore(link, slot.firstChild);
  else {
    link.classList.add('is-floating');
    document.body.appendChild(link);
  }
})();
