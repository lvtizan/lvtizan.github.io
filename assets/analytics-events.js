/* Meaningful GA4 interactions for the YOYANT marketing site. */
(function () {
  'use strict';

  function track(name, parameters) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, Object.assign({ page_language: document.documentElement.lang || 'zh-CN' }, parameters));
  }

  document.addEventListener('click', function (event) {
    var wechatCopy = event.target.closest('[onclick*="copyWechat"]');
    if (wechatCopy) {
      track('contact_start', { contact_method: 'wechat_copy' });
      return;
    }

    var link = event.target.closest('a');
    if (!link) return;

    var href = link.getAttribute('href') || '';
    var label = (link.textContent || link.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 100);

    if (href.indexOf('mailto:') === 0) {
      track('contact_start', { contact_method: 'email', link_text: label });
      return;
    }
    if (href.indexOf('tel:') === 0) {
      track('contact_start', { contact_method: 'phone', link_text: label });
      return;
    }
    if (href.indexOf('wa.me/') !== -1) {
      track('contact_start', { contact_method: 'whatsapp', link_text: label });
      return;
    }
    if (href === '#concierge') {
      track('consultation_view', { link_text: label });
      return;
    }
    if (link.classList.contains('language-switch')) {
      track('language_switch', { destination: href });
      return;
    }
    if (/\/work\//.test(href)) {
      track('select_content', { content_type: 'case_study', item_id: href, link_text: label });
    }
  });

  var sentDepths = {};
  function recordScrollDepth() {
    var root = document.documentElement;
    var scrollable = root.scrollHeight - window.innerHeight;
    if (scrollable <= 0) return;
    var depth = Math.round((window.scrollY / scrollable) * 100);
    [50, 90].forEach(function (milestone) {
      if (depth >= milestone && !sentDepths[milestone]) {
        sentDepths[milestone] = true;
        track('scroll_depth', { percent_scrolled: milestone });
      }
    });
  }

  window.addEventListener('scroll', recordScrollDepth, { passive: true });
})();
