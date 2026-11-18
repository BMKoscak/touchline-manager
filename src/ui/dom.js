// Tiny DOM helpers.
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === undefined || v === null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k in el && typeof v !== 'string') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}
function append(el, children) {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    if (Array.isArray(c)) append(el, c);
    else el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function panel(title, body, opts = {}) {
  return h('div', { class: `panel ${opts.class || ''}`, style: opts.style },
    title ? h('h2', {}, title, opts.right ? h('span', { class: 'right' }, opts.right) : null) : null,
    h('div', { class: 'body', style: opts.bodyStyle }, body));
}

export function toast(text, err = false) {
  const box = document.getElementById('toast');
  const t = h('div', { class: `t ${err ? 'err' : ''}` }, text);
  box.appendChild(t);
  setTimeout(() => t.remove(), err ? 4200 : 2600);
}

export function modal(content) {
  const m = document.getElementById('modal');
  m.innerHTML = '';
  m.appendChild(h('div', { class: 'dialog' }, content));
  m.classList.add('open');
  const close = () => { m.classList.remove('open'); m.innerHTML = ''; document.removeEventListener('keydown', esc); };
  const esc = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', esc);
  m.onclick = (e) => { if (e.target === m) close(); };
  return close;
}

export function attrClass(v) { const n = Math.round(v); return n <= 5 ? 'a1' : n <= 10 ? 'a2' : n <= 15 ? 'a3' : 'a4'; }
export function stars(v, max = 200) { const n = Math.max(1, Math.min(5, Math.round((v / max) * 5 * 2) / 2)); return '★'.repeat(Math.floor(n)) + (n % 1 ? '½' : '') ; }
export function contrast(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#0b1224' : '#ffffff';
}

/** Sortable table builder. cols: [{ key, label, num, render(row), sort(row) }] */
export function sortableTable(rows, cols, { onRow, rowClass, initialSort, initialDir = -1, className = '' } = {}) {
  let sortKey = initialSort, dir = initialDir;
  const table = h('table', { class: `cm ${className}` });
  const draw = () => {
    table.innerHTML = '';
    const col = cols.find((c) => c.key === sortKey);
    const sorted = col ? rows.slice().sort((a, b) => {
      const va = col.sort ? col.sort(a) : a[col.key], vb = col.sort ? col.sort(b) : b[col.key];
      return (va > vb ? 1 : va < vb ? -1 : 0) * dir;
    }) : rows;
    table.appendChild(h('thead', {}, h('tr', {}, cols.map((c) => h('th', {
      class: `${c.num ? 'num' : ''} ${c.nosort ? '' : 'sortable'}`, title: c.title || '',
      onclick: c.nosort ? null : () => { if (sortKey === c.key) dir = -dir; else { sortKey = c.key; dir = c.num ? -1 : 1; } draw(); },
    }, c.label, sortKey === c.key ? (dir > 0 ? ' ▲' : ' ▼') : '')))));
    const tb = h('tbody');
    for (const r of sorted) {
      tb.appendChild(h('tr', { class: `${onRow ? 'click' : ''} ${rowClass ? rowClass(r) : ''}`, onclick: onRow ? () => onRow(r) : null },
        cols.map((c) => h('td', { class: `${c.num ? 'num' : ''} ${c.tdClass ? c.tdClass(r) : ''}` }, c.render ? c.render(r) : r[c.key]))));
    }
    table.appendChild(tb);
  };
  draw();
  return table;
}
