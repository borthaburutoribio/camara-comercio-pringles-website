(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phone = window.matchMedia('(max-width: 860px)');
  // A CONFIRMAR: WhatsApp de la oficina (celular que la ACI publicó para el Galpón de la Rural)
  const WA = 'https://wa.me/5492914423407?text=';
  document.documentElement.classList.add('js-motion');

  /* Barra y botón fijo del celular */
  const bar = document.getElementById('bar');
  const hero = document.getElementById('inicio');
  const floatCta = document.querySelector('.float-cta');
  const asociate = document.getElementById('asociate');
  const onScroll = () => {
    bar.dataset.state = window.scrollY > 40 ? 'solid' : 'top';
    const r = asociate.getBoundingClientRect();
    const inForm = r.top < window.innerHeight && r.bottom > 0;
    floatCta.classList.toggle('is-on', window.scrollY > hero.offsetHeight * 0.8 && !inForm);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Menú del celular */
  const toggle = document.querySelector('.bar__toggle');
  const menu = document.getElementById('menu');
  const closeMenu = () => { menu.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'Menú'; };
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Cerrar' : 'Menú';
  });
  menu.addEventListener('click', (e) => { if (e.target.closest('a')) closeMenu(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });

  /* Entradas escalonadas por sección */
  document.querySelectorAll('section, footer').forEach((sec) => {
    sec.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--d', `${Math.min(i, 5) * 80}ms`));
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      io.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  document.querySelectorAll('.reveal, .shutter, .intro__photos figure').forEach((el) => io.observe(el));

  /* Guía de comercios: buscador, rubros y mapa */
  const shops = [...document.querySelectorAll('.shop')];
  const q = document.getElementById('q');
  const chips = [...document.querySelectorAll('.chip')];
  const count = document.getElementById('count');
  const empty = document.getElementById('empty');
  const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  shops.forEach((s) => { s.dataset.text = norm(s.textContent); });
  let rubro = 'todos';
  let map = null;
  const markers = new Map();

  const filter = () => {
    const term = norm(q.value.trim());
    let n = 0;
    const visible = [];
    shops.forEach((s) => {
      const ok = (rubro === 'todos' || s.dataset.r === rubro) && (!term || s.dataset.text.includes(term));
      s.hidden = !ok;
      if (ok) { n++; visible.push(s); }
      const m = markers.get(s);
      if (m && map) { if (ok) m.addTo(map); else m.remove(); }
    });
    count.textContent = n === 1 ? '1 comercio' : `${n} comercios`;
    empty.hidden = n > 0;
    if (map) {
      const pts = visible.filter((s) => markers.has(s)).map((s) => markers.get(s).getLatLng());
      if (pts.length > 1) map.flyToBounds(L.latLngBounds(pts).pad(0.25), { duration: reduce ? 0 : 0.6, maxZoom: 16 });
      else if (pts.length === 1) map.flyTo(pts[0], 16, { duration: reduce ? 0 : 0.6 });
    }
  };
  q.addEventListener('input', filter);
  chips.forEach((c) => c.addEventListener('click', () => {
    rubro = c.dataset.r;
    chips.forEach((x) => { const on = x === c; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', String(on)); });
    filter();
  }));

  const select = (s, fromMap) => {
    shops.forEach((x) => x.classList.toggle('is-active', x === s));
    const m = markers.get(s);
    if (m && map) {
      map.flyTo(m.getLatLng(), 17, { duration: reduce ? 0 : 0.6 });
      m.openPopup();
      if (phone.matches && !fromMap) document.getElementById('mapa').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    }
    if (fromMap) s.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
  };
  shops.forEach((s) => s.addEventListener('click', (e) => { if (!e.target.closest('a')) select(s, false); }));

  const initMap = () => {
    if (map || !window.L) return;
    map = L.map('mapa', { scrollWheelZoom: false, zoomControl: true }).setView([-37.9835, -61.3535], 15);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    // La sede y la Sociedad Rural, como referencia
    L.circleMarker([-37.9859684, -61.353491], { radius: 11, color: '#1d1a19', weight: 3, fillColor: '#f6f3ee', fillOpacity: 1 })
      .addTo(map).bindPopup('<strong>Sede de la ACI</strong>Mitre 957');
    L.circleMarker([-37.9598984, -61.3720547], { radius: 9, color: '#1d1a19', weight: 3, fillColor: '#f6f3ee', fillOpacity: 1 })
      .addTo(map).bindPopup('<strong>Sociedad Rural</strong>Galpón Comercial de la ACI, octubre de 2026');
    shops.forEach((s) => {
      if (!s.dataset.lat) return;
      const name = s.querySelector('h3').textContent;
      const rub = s.querySelector('.shop__rubro').textContent;
      const dir = s.querySelector('.shop__dir').textContent.split(' · ')[0];
      const m = L.circleMarker([+s.dataset.lat, +s.dataset.lng], { radius: 9, color: '#f6f3ee', weight: 2, fillColor: '#7a1f24', fillOpacity: 1 })
        .addTo(map).bindPopup(`<strong>${name}</strong>${rub} · ${dir}`);
      m.on('click', () => select(s, true));
      markers.set(s, m);
    });
    filter();
  };
  const mapIo = new IntersectionObserver((en) => { if (en[0].isIntersecting) { initMap(); mapIo.disconnect(); } }, { rootMargin: '400px' });
  const startMap = () => {
    mapIo.observe(document.getElementById('mapa'));
    // por si el observador no dispara (pestaña en segundo plano), igual arranca al rato
    setTimeout(initMap, 4000);
  };
  if (document.readyState === 'complete') startMap(); else window.addEventListener('load', startMap);

  /* Qué hacemos: la frase activa sigue al scroll */
  const hac = document.querySelector('.hacemos');
  const items = [...hac.querySelectorAll('.hacemos__list li')];
  const pairs = [...hac.querySelectorAll('.pair')];
  let cur = 0;
  const setStep = (i) => {
    if (i === cur) return;
    cur = i;
    items.forEach((li, k) => li.classList.toggle('is-on', k === i));
    pairs.forEach((p) => p.classList.toggle('is-on', +p.dataset.i === i));
  };
  const onHac = () => {
    const r = hac.getBoundingClientRect();
    const total = hac.offsetHeight - window.innerHeight;
    const p = Math.min(Math.max(-r.top / total, 0), 0.999);
    setStep(Math.floor(p * items.length));
  };
  window.addEventListener('scroll', onHac, { passive: true });
  onHac();

  /* Ficha de inscripción por WhatsApp */
  const ficha = document.getElementById('ficha');
  const err = document.getElementById('ficha-err');
  ficha.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(ficha);
    const v = (k) => (f.get(k) || '').toString().trim();
    if (!v('comercio') || !v('rubro') || !v('nombre')) {
      err.hidden = false;
      ficha.querySelector(`[name="${!v('comercio') ? 'comercio' : !v('rubro') ? 'rubro' : 'nombre'}"]`).focus();
      return;
    }
    err.hidden = true;
    const intereses = f.getAll('interes');
    let txt = `Hola, quiero asociar mi comercio a la ACI.\n\nComercio: ${v('comercio')}\nRubro: ${v('rubro')}\nResponsable: ${v('nombre')}`;
    if (v('direccion')) txt += `\nDirección: ${v('direccion')}`;
    if (intereses.length) txt += `\nMe interesa: ${intereses.join(', ')}.`;
    window.open(WA + encodeURIComponent(txt), '_blank', 'noopener');
  });

  /* Compartir */
  const share = document.getElementById('share');
  share.addEventListener('click', async () => {
    const data = { title: 'ACI Pringles', text: 'Guía de comercios y cómo asociarse a la ACI de Coronel Pringles', url: location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(location.href); share.textContent = 'Link copiado'; }
    } catch (_) { /* cancelado */ }
  });
})();
