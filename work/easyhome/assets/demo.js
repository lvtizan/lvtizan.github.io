/* Static catalog interactions. The demo never sends orders or account data. */
(() => {
  'use strict';
  const data = window.EASYHOME_DEMO;
  const base = document.body.dataset.demoBase;
  if (!data || !base) return;
  const products = new Map(data.products.map(p => [p.id, p]));
  const storageKey = 'easyhome_demo_cart_v1';
  const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  let bag = {};
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
    for (const [id, quantity] of Object.entries(saved || {})) {
      if (products.has(Number(id)) && Number.isInteger(quantity) && quantity > 0) bag[id] = Math.min(99, quantity);
    }
  } catch (_) { /* Storage can be unavailable in private browsing. */ }

  const status = document.createElement('div');
  status.className = 'demo-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  document.body.append(status);
  let statusTimer;
  const announce = message => {
    status.textContent = message;
    status.classList.add('is-visible');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => status.classList.remove('is-visible'), 4000);
  };
  const updateBag = () => {
    const count = Object.values(bag).reduce((sum, n) => sum + n, 0);
    document.querySelectorAll('.eh-bag-count').forEach(e => { e.textContent = String(count); });
    document.querySelectorAll('.eh-header-bag').forEach(e => { e.setAttribute('aria-label', `Shopping bag, ${count} ${count === 1 ? 'item' : 'items'}`); });
    try { localStorage.setItem(storageKey, JSON.stringify(bag)); } catch (_) { /* In-memory bag remains usable. */ }
  };
  const add = (id, quantity = 1) => {
    id = Number(id);
    if (!products.has(id)) return;
    quantity = Math.max(1, Math.min(99, Math.floor(Number(quantity) || 1)));
    bag[id] = Math.min(99, (bag[id] || 0) + quantity);
    updateBag();
    announce('Added to your demo bag. No order has been placed.');
  };
  updateBag();

  document.querySelectorAll('form[data-demo-add]').forEach(form => {
    form.addEventListener('submit', event => {
      event.preventDefault();
      add(form.dataset.demoAdd, form.querySelector('[name="quantity"]')?.value || 1);
    });
  });
  document.querySelectorAll('a[data-demo-add]').forEach(link => {
    link.addEventListener('click', event => { event.preventDefault(); add(link.dataset.demoAdd); });
  });
  document.querySelectorAll('form[data-demo-form]:not([data-demo-add])').forEach(form => {
    form.addEventListener('submit', event => event.preventDefault());
  });

  const nav = document.getElementById('site-navigation');
  const toggle = nav?.querySelector('.menu-toggle');
  const closeMenu = () => {
    nav?.classList.remove('toggled');
    toggle?.setAttribute('aria-expanded', 'false');
  };
  toggle?.addEventListener('click', () => {
    const open = nav.classList.toggle('toggled');
    toggle.setAttribute('aria-expanded', String(open));
  });
  document.addEventListener('click', event => { if (nav && !nav.contains(event.target)) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav?.classList.contains('toggled')) { closeMenu(); toggle.focus(); }
  });
  document.querySelectorAll('#menu-main-navigation li').forEach(li => {
    const link = li.querySelector('a');
    if (!link) return;
    const path = new URL(link.href).pathname;
    const active = path === location.pathname || (path === base + 'shop/' && location.pathname.includes('/product/'));
    li.classList.toggle('current-menu-item', active);
    link.removeAttribute('aria-current');
    if (active) link.setAttribute('aria-current', 'page');
  });

  const catalog = document.querySelector('body[data-demo-category] ul.products');
  if (catalog) {
    const category = document.body.dataset.demoCategory;
    const select = document.querySelector('.woocommerce-ordering select');
    const counter = document.querySelector('.woocommerce-result-count');
    const pagination = document.createElement('nav');
    pagination.className = 'demo-pagination';
    pagination.setAttribute('aria-label', 'Product pages');
    catalog.after(pagination);
    const renderCatalog = () => {
      const query = new URLSearchParams(location.search);
      const search = (query.get('s') || '').trim().toLocaleLowerCase();
      const order = query.get('orderby') || 'menu_order';
      let list = data.products.filter(p => (!category || p.categories.includes(category)) && (!search || `${p.name} ${p.sku}`.toLocaleLowerCase().includes(search)));
      if (order === 'price') list.sort((a, b) => a.price - b.price);
      if (order === 'price-desc') list.sort((a, b) => b.price - a.price);
      if (select) select.value = ['price','price-desc'].includes(order) ? order : 'menu_order';
      const pageSize = 16;
      const pages = Math.max(1, Math.ceil(list.length / pageSize));
      const requested = Number.parseInt(query.get('page'), 10) || 1;
      const page = Math.min(pages, Math.max(1, requested));
      const offset = (page - 1) * pageSize;
      catalog.innerHTML = list.slice(offset, offset + pageSize).map(p => p.card).join('');
      document.querySelector('.demo-empty-search')?.remove();
      if (!list.length) {
        const empty = document.createElement('section');
        empty.className = 'easyhome-empty-state demo-empty-search';
        empty.innerHTML = `<h2>No matching products</h2><p>Try a different product name, brand or category.</p><a class="button" href="${base}shop/">Browse all furniture</a>`;
        catalog.before(empty);
      }
      if (counter) counter.textContent = list.length ? `Showing ${offset + 1}–${Math.min(offset + pageSize, list.length)} of ${list.length} products` : '0 products';
      if (search) {
        document.querySelector('h1').textContent = `Search results: “${query.get('s').trim()}”`;
        const searchInput = document.querySelector('input[type="search"]');
        if (searchInput) searchInput.value = query.get('s');
      }
      pagination.innerHTML = pages > 1 ? Array.from({length: pages}, (_, i) => {
        const target = i + 1;
        return `<button type="button" data-page="${target}" aria-label="Page ${target}"${target === page ? ' aria-current="page"' : ''}>${target}</button>`;
      }).join('') : '';
    };
    select?.addEventListener('change', () => {
      const url = new URL(location.href);
      url.searchParams.set('orderby', select.value);
      url.searchParams.delete('page');
      history.replaceState({}, '', url);
      renderCatalog();
    });
    pagination.addEventListener('click', event => {
      const button = event.target.closest('[data-page]');
      if (!button) return;
      const url = new URL(location.href);
      url.searchParams.set('page', button.dataset.page);
      history.pushState({}, '', url);
      renderCatalog();
      document.querySelector('.woocommerce-products-header').scrollIntoView({ block: 'start' });
    });
    window.addEventListener('popstate', renderCatalog);
    renderCatalog();
  }

  const cart = document.getElementById('demo-cart');
  const renderCart = () => {
    if (!cart) return;
    const entries = Object.entries(bag).filter(([id]) => products.has(Number(id)));
    if (!entries.length) {
      cart.innerHTML = `<section class="easyhome-empty-state"><h2>Your bag is empty</h2><p>Explore the collection and save a few pieces.</p><a class="button" href="${base}shop/">Browse furniture</a></section>`;
      return;
    }
    let total = 0;
    const rows = entries.map(([id, quantity]) => {
      const p = products.get(Number(id));
      total += p.price * quantity;
      return `<article class="demo-cart-row"><a href="${p.url}"><img src="${p.images[0]}" alt="${escape(p.name)}"></a><div><a href="${p.url}" class="demo-cart-title">${escape(p.name.split('|')[0])}</a><p>${money(p.price)} · EXW</p><div class="demo-quantity"><button type="button" data-quantity="${id}" data-delta="-1" aria-label="Reduce quantity"${quantity === 1 ? ' disabled' : ''}>−</button><span aria-label="Quantity">${quantity}</span><button type="button" data-quantity="${id}" data-delta="1" aria-label="Increase quantity"${quantity === 99 ? ' disabled' : ''}>+</button><button class="demo-remove" type="button" data-remove="${id}">Remove</button></div></div><strong>${money(p.price * quantity)}</strong></article>`;
    }).join('');
    cart.innerHTML = rows + `<div class="demo-cart-total"><span>Product subtotal</span><strong>${money(total)}</strong></div><p>Shipping and taxes are not included. This demo bag does not create an order.</p><a class="button" href="${base}shop/">Continue browsing</a>`;
  };
  cart?.addEventListener('click', event => {
    const remove = event.target.closest('[data-remove]');
    const quantity = event.target.closest('[data-quantity]');
    if (remove) delete bag[remove.dataset.remove];
    if (quantity) bag[quantity.dataset.quantity] = Math.max(1, Math.min(99, bag[quantity.dataset.quantity] + Number(quantity.dataset.delta)));
    if (remove || quantity) { updateBag(); renderCart(); announce(remove ? 'Item removed from your demo bag.' : 'Quantity updated.'); }
  });
  renderCart();
  window.addEventListener('storage', event => { if (event.key === storageKey) location.reload(); });

  const gallery = document.querySelector('.demo-gallery');
  const mainImage = gallery?.querySelector('.demo-gallery-main img');
  gallery?.querySelectorAll('[data-gallery-src]').forEach(button => {
    button.addEventListener('click', () => {
      mainImage.src = button.dataset.gallerySrc;
      gallery.querySelectorAll('[data-gallery-src]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    });
  });
  gallery?.querySelector('.demo-gallery-main').addEventListener('click', () => {
    const dialog = document.createElement('dialog');
    dialog.className = 'demo-lightbox';
    dialog.setAttribute('aria-label', 'Enlarged product image');
    dialog.innerHTML = '<button type="button" aria-label="Close image">×</button><img alt="">';
    dialog.querySelector('img').src = mainImage.src;
    dialog.querySelector('img').alt = mainImage.alt;
    document.body.append(dialog);
    dialog.addEventListener('close', () => dialog.remove());
    dialog.querySelector('button').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    dialog.showModal();
  });
})();
