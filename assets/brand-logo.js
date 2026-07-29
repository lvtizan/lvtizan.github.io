/* YOYANT 品牌字标组件 · 单一来源 · 改品牌名/描述只动这里
   用法：导航放 <a class="brand" href="..." data-brand-nav aria-label="YOYANT 远洋数字"></a>
        页脚放 <span class="wm" data-brand-foot></span>
   每页 <script src="/assets/brand-logo.js" defer></script> 引入 */
(function () {
  var EN = "YOYANT", CN = "远洋数字", DESC = "外贸独立站 · 软件界面 · 产品设计";
  var navHTML =
    '<span class="brand-main"><span class="wm">' + EN + '<span class="dot">.</span></span>' +
    '<span class="cn">' + CN + '</span></span>' +
    '<span class="brand-desc">' + DESC + '</span>';
  var footHTML =
    '<span class="fwm">' + EN + '<span style="color:var(--accent)">.</span> ' + CN + '</span>' +
    '<span class="fdesc">' + DESC + '</span>';

  // descriptor 需要把 .brand 从横排改成竖排叠一行小字（注入 CSS，后加载覆盖各页内联样式）
  var css =
    '.brand{display:flex;flex-direction:column;align-items:flex-start;gap:2px;justify-content:center}' +
    '.brand-main{display:flex;align-items:baseline;gap:8px}' +
    '.brand-desc{font-family:var(--mono,ui-monospace,monospace);font-size:9px;letter-spacing:.06em;' +
    'color:var(--muted,#787C8B);opacity:.82;line-height:1;white-space:nowrap}' +
    '@media(max-width:560px){.brand-desc{display:none}}' +
    '[data-brand-foot]{display:inline-flex;flex-direction:column;gap:4px}' +
    '.fdesc{font-family:var(--mono,ui-monospace,monospace);font-size:10px;letter-spacing:.03em;' +
    'color:var(--muted,#787C8B);text-transform:none;font-weight:400;line-height:1}';
  var st = document.createElement('style');
  st.id = 'brand-logo-css';
  st.textContent = css;
  document.head.appendChild(st);

  document.querySelectorAll('[data-brand-nav]').forEach(function (el) { el.innerHTML = navHTML; });
  document.querySelectorAll('[data-brand-foot]').forEach(function (el) { el.innerHTML = footHTML; });
})();
