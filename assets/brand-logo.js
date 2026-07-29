/* YOYANT 品牌字标组件 · 单一来源 · 改品牌名只动这里
   用法：导航放 <a class="brand" href="..." data-brand-nav aria-label="YOYANT 远洋数字"></a>
        页脚放 <span class="wm" data-brand-foot></span>
   每页 <script src="/assets/brand-logo.js" defer></script> 引入 */
(function(){
  var EN = "YOYANT", CN = "远洋数字";
  var navHTML  = '<span class="wm">' + EN + '<span class="dot">.</span></span><span class="cn">' + CN + '</span>';
  var footHTML = EN + '<span style="color:var(--accent)">.</span> ' + CN;
  document.querySelectorAll('[data-brand-nav]').forEach(function(el){ el.innerHTML = navHTML; });
  document.querySelectorAll('[data-brand-foot]').forEach(function(el){ el.innerHTML = footHTML; });
})();
