/* ============================================================
   ui.js —— 通用组件与图形
   ============================================================ */
(function (LJ) {
  'use strict';
  const U = LJ.util;
  const UI = LJ.ui = {};

  /* ---------------- 图标 ---------------- */
  const P = {
    home:  '<path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    list:  '<path d="M4 6h16M4 12h16M4 18h10"/>',
    plan:  '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
    chat:  '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"/>',
    user:  '<circle cx="12" cy="8" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/>',
    status:'<circle cx="12" cy="12" r="9"/><path d="M12 8v4.5l3 1.8"/>',
    plus:  '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
    heart: '<path d="M12 20s-7-4.4-7-9.4A4.1 4.1 0 0 1 12 7.6 4.1 4.1 0 0 1 19 10.6c0 5-7 9.4-7 9.4z"/>',
    back:  '<path d="M15 5 8 12l7 7"/>',
    shield:'<path d="M12 3l7 3v5.5c0 4.6-3 8.4-7 9.5-4-1.1-7-4.9-7-9.5V6z"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    check: '<path d="M4 12.5 9 17.5 20 6.5"/>',
    spark: '<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6.3 6.3l3.5 3.5M14.2 14.2l3.5 3.5M17.7 6.3l-3.5 3.5M9.8 14.2l-3.5 3.5"/>',
    download: '<path d="M12 3v12M7 11l5 5 5-5M4 20h16"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>',
    sparkle: '<path d="M12 2.4c.9 4.9 1.9 7.4 4.1 8.9 2.1 1.4 4.6 1.7 8 1.7-3.4 0-5.9.3-8 1.7-2.2 1.5-3.2 4-4.1 8.9-.9-4.9-1.9-7.4-4.1-8.9-2.1-1.4-4.6-1.7-8-1.7 3.4 0 5.9-.3 8-1.7 2.2-1.5 3.2-4 4.1-8.9z" fill="currentColor" stroke="none"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    mic: '<path d="M12 15a3.5 3.5 0 0 0 3.5-3.5V6a3.5 3.5 0 0 0-7 0v5.5A3.5 3.5 0 0 0 12 15z"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.5"/>',
    send: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    compose: '<path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14 6l4 4"/>',
    receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
    more: '<circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none"/>'
  };
  UI.icon = function (name, size, cls) {
    return '<svg class="' + (cls || '') + '" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" ' +
      'fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' +
      (P[name] || P.home) + '</svg>';
  };

  /* ---------------- 转义 ---------------- */
  UI.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  };

  /* ---------------- Toast ---------------- */
  UI.toast = function (msg, ms) {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    root.appendChild(el);
    setTimeout(() => {
      el.style.transition = 'opacity .22s, transform .22s';
      el.style.opacity = '0'; el.style.transform = 'translateY(8px)';
      setTimeout(() => el.remove(), 240);
    }, ms || 1800);
  };

  /* ---------------- 半屏浮层 ---------------- */
  UI.sheet = function (opt) {
    const root = document.getElementById('sheet-root');
    const mask = document.createElement('div'); mask.className = 'sheet-mask';
    const sheet = document.createElement('div'); sheet.className = 'sheet';
    sheet.innerHTML = '<div class="grab"></div>' +
      (opt.title ? '<h3>' + UI.esc(opt.title) + '</h3>' : '') +
      (opt.sub ? '<div class="sub">' + opt.sub + '</div>' : '') +
      (opt.body || '');
    root.appendChild(mask); root.appendChild(sheet);
    requestAnimationFrame(() => { mask.classList.add('on'); sheet.classList.add('on'); });

    function close() {
      mask.classList.remove('on'); sheet.classList.remove('on');
      setTimeout(() => { mask.remove(); sheet.remove(); }, 340);
      opt.onClose && opt.onClose();
    }
    mask.onclick = close;
    if (opt.mount) opt.mount(sheet, close);
    return { close, el: sheet };
  };

  /* ---------------- 左侧抽屉 ----------------
     从手机左边滑出的面板，用来放「历史对话」这类列表。
     和弹层一样挂在 #sheet-root（z-index 500，在底栏和缩放覆盖层之上），
     所以它跟着手机走，也会被手机圆角裁切。 */
  UI.drawer = function (opt) {
    const root = document.getElementById('sheet-root');
    const mask = document.createElement('div'); mask.className = 'drawer-mask';
    const panel = document.createElement('div'); panel.className = 'drawer';
    panel.innerHTML = (opt.head || '') +
      '<div class="drawer-body">' + (opt.body || '') + '</div>';
    root.appendChild(mask); root.appendChild(panel);
    requestAnimationFrame(() => { mask.classList.add('on'); panel.classList.add('on'); });

    let closed = false;
    function close() {
      if (closed) return;
      closed = true;
      mask.classList.remove('on'); panel.classList.remove('on');
      setTimeout(() => { mask.remove(); panel.remove(); }, 360);
      opt.onClose && opt.onClose();
    }
    mask.onclick = close;
    if (opt.mount) opt.mount(panel, close);
    return { close, el: panel };
  };

  UI.confirm = function (opt) {
    return UI.sheet({
      title: opt.title,
      sub: opt.desc || '',
      body: '<div class="mt16"></div>',
      mount(el, close) {
        const wrap = document.createElement('div');
        wrap.innerHTML =
          '<button class="btn" data-ok>' + UI.esc(opt.okText || '确定') + '</button>' +
          '<button class="btn ghost mt12" data-no>' + UI.esc(opt.cancelText || '取消') + '</button>';
        el.appendChild(wrap);
        wrap.querySelector('[data-ok]').onclick = () => { close(); opt.onOk && opt.onOk(); };
        wrap.querySelector('[data-no]').onclick = () => close();
      }
    });
  };

  /* ---------------- 图形：环形指数 ----------------
     opt: { label, track, size, stroke, color, sub } */
  UI.ring = function (score, size, stroke, color, opt) {
    opt = opt || {};
    size = size || 96; stroke = stroke || 8;
    const r = (size - stroke) / 2, c = 2 * Math.PI * r;
    const off = c * (1 - U.clamp(score, 0, 100) / 100);
    color = color || 'var(--ink)';
    const track = opt.track || '#E9E8EE';
    const label = opt.label === undefined ? '掌控指数' : opt.label;
    return '<div class="ring" style="width:' + size + 'px;height:' + size + 'px">' +
      '<svg width="' + size + '" height="' + size + '" style="transform:rotate(-90deg)">' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + track + '" stroke-width="' + stroke + '"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="' + stroke +
      '" stroke-linecap="round" stroke-dasharray="' + c + '" stroke-dashoffset="' + off + '" ' +
      'style="transition:stroke-dashoffset .8s cubic-bezier(.32,.72,.24,1)"/>' +
      '</svg>' +
      '<div class="rt"><div class="n">' + Math.round(score) + '</div>' +
      (label ? '<div class="l">' + UI.esc(label) + '</div>' : '') + '</div>' +
      '</div>';
  };

  /* ---------------- 图形：四维雷达 ---------------- */
  UI.radar = function (dims, size) {
    size = size || 180;
    const cx = size / 2, cy = size / 2, R = size / 2 - 30;
    const n = dims.length;
    const pt = (i, ratio) => {
      const a = (Math.PI * 2 * i / n) - Math.PI / 2;
      return [cx + Math.cos(a) * R * ratio, cy + Math.sin(a) * R * ratio];
    };
    let grid = '';
    [0.25, 0.5, 0.75, 1].forEach(k => {
      const pts = dims.map((_, i) => pt(i, k).map(v => v.toFixed(1)).join(',')).join(' ');
      grid += '<polygon points="' + pts + '" fill="none" stroke="#E6E5EB" stroke-width="1"/>';
    });
    dims.forEach((_, i) => {
      const [x, y] = pt(i, 1);
      grid += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x.toFixed(1) + '" y2="' + y.toFixed(1) + '" stroke="#E6E5EB" stroke-width="1"/>';
    });
    const poly = dims.map((d, i) => pt(i, U.clamp(d.score, 0, 100) / 100).map(v => v.toFixed(1)).join(',')).join(' ');
    let labels = '';
    dims.forEach((d, i) => {
      const a = (Math.PI * 2 * i / n) - Math.PI / 2;
      const x = cx + Math.cos(a) * (R + 20), y = cy + Math.sin(a) * (R + 18);
      labels += '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" text-anchor="middle" dominant-baseline="middle" ' +
        'font-size="10" font-weight="600" fill="#A0A0A8">' + UI.esc(d.name) + '</text>';
    });
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">' +
      grid +
      '<polygon points="' + poly + '" fill="rgba(211,185,255,.45)" stroke="#161618" stroke-width="1.8" stroke-linejoin="round"/>' +
      dims.map((d, i) => {
        const [x, y] = pt(i, U.clamp(d.score, 0, 100) / 100);
        return '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.8" fill="#161618"/>';
      }).join('') +
      labels + '</svg>';
  };

  /* ---------------- 图形：胶囊柱状（参考图样式） ----------------
     series: [{date, amount, label?}]
     opt: { highlight: 下标数组(黑柱), selected: 下标(紫渐变), labels: bool, today: 下标 } */
  UI.pillBars = function (series, opt) {
    opt = opt || {};
    const max = Math.max.apply(null, series.map(s => s.amount).concat([1]));
    const hi = opt.highlight || [];
    const H = opt.height || 96;
    let html = '<div class="pill-bars" style="height:' + H + 'px">' +
      series.map((s, i) => {
        const h = Math.max(14, Math.round(s.amount / max * H));
        let cls = '';
        if (opt.selected === i) cls = 'sel';
        else if (hi.indexOf(i) >= 0) cls = 'hi';
        else if (opt.today === i) cls = 'today';
        return '<div class="pb ' + cls + '" title="' + UI.esc(s.label || s.date) + ' ¥' + U.won(s.amount) + '">' +
          '<i style="height:' + h + 'px"></i></div>';
      }).join('') + '</div>';
    if (opt.labels !== false) {
      html += '<div class="pill-labels">' + series.map((s, i) =>
        '<span class="' + (opt.selected === i ? 'on' : '') + '">' +
        UI.esc(s.label || String(s.date).slice(5).replace('-', '/')) + '</span>').join('') + '</div>';
    }
    return html;
  };

  /* ---------------- 图形：迷你柱状（旧接口，保留兼容） ---------------- */
  UI.bars = function (series, height) {
    return UI.pillBars(series, { height: height || 56, labels: false });
  };

  /* ---------------- 图形：进度条 ---------------- */
  UI.bar = function (ratio, color) {
    const pct = U.clamp(ratio * 100, 0, 100);
    return '<div class="bar"><i style="width:' + pct.toFixed(1) + '%;background:' + (color || 'var(--ink)') + '"></i></div>';
  };

  /* ---------------- 状态色板 ---------------- */
  UI.STATUS_CLS = { green: 'c-green', yellow: 'c-yellow', orange: 'c-orange', blue: 'c-blue' };
  UI.STATUS_ORDER = ['green', 'yellow', 'orange', 'blue'];

  UI.statusHero = function (st, extra) {
    const idx = UI.STATUS_ORDER.indexOf(st.key);
    return '<div class="status-hero ' + (UI.STATUS_CLS[st.key] || 'c-green') + '">' +
      '<div class="pulse"></div>' +
      '<div class="st">' + UI.esc(st.title) + '</div>' +
      '<div class="sd">' + UI.esc(st.desc) + '</div>' +
      (extra || '') +
      '<div class="status-dots">' + UI.STATUS_ORDER.map((_, i) => '<i class="' + (i <= idx ? 'on' : '') + '"></i>').join('') + '</div>' +
      '</div>';
  };

  /* ---------------- 状态占位 ---------------- */
  UI.empty = function (emoji, title, desc, action) {
    return '<div class="state"><span class="em">' + emoji + '</span>' +
      '<div class="t">' + UI.esc(title) + '</div>' +
      '<div class="d">' + UI.esc(desc || '') + '</div>' + (action || '') + '</div>';
  };
  UI.skeleton = function (rows) {
    let h = '<div class="pad mt16">';
    for (let i = 0; i < (rows || 4); i++) {
      h += '<div class="card" style="margin-bottom:10px"><div class="skel" style="height:14px;width:42%"></div>' +
        '<div class="skel mt12" style="height:11px;width:72%"></div></div>';
    }
    return h + '</div>';
  };

  /* ---------------- 金额格式化 ---------------- */
  UI.money = function (n, sign) {
    const s = sign ? (n >= 0 ? '+' : '−') : '';
    return s + U.won(Math.abs(n));
  };
  UI.pct = function (n) { return (n >= 0 ? '+' : '') + n + '%'; };
})(window.LJ);
