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
    /* 天平：给「这一笔要不要花」用 —— 称一称，而不是记一记 */
    scale: '<path d="M12 4v16M8.5 20h7M4 8h16"/><path d="M1.5 13h5L4 8z"/><path d="M17.5 13h5L20 8z"/>',
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

  /* 动效令牌的 JS 读数口：CSS 是唯一真源，JS 不再手抄曲线和时长。
     ★ 兜底值必须和 app.css :root 里的默认值逐字相等 ——
       测试环境（node）没有 getComputedStyle，读到 NaN 会让清理定时器失效，
       弹层就永远留在 DOM 里。tools/render-test.js 有一条断言专门盯着这个等式。 */
  const MOTION_FALLBACK = {
    '--ease-ui': 'cubic-bezier(.32,.72,.24,1)',
    '--ease-out': 'cubic-bezier(0.23, 1, 0.32, 1)',
    '--dur-press': 120, '--dur-fade': 160, '--dur-quick': 220,
    '--dur-ui': 340, '--dur-stack': 450, '--dur-fill': 500,
    '--dur-stagger': 40, '--dur-stagger-r': 35
  };
  const motionCache = {};
  function cssVar(name) {
    if (motionCache[name] !== undefined) return motionCache[name];
    let raw = '';
    try { raw = getComputedStyle(document.documentElement).getPropertyValue(name) || ''; }
    catch (e) { raw = ''; }
    motionCache[name] = raw.trim();
    return motionCache[name];
  }
  /** 时长（毫秒，数字） */
  UI.motion = function (name) {
    const v = parseFloat(cssVar(name));
    return (isFinite(v) && v > 0) ? v : MOTION_FALLBACK[name];
  };
  /** 曲线（字符串，直接拼进 transition） */
  UI.ease = function (name) {
    const v = cssVar(name);
    return v || MOTION_FALLBACK[name];
  };

  /* ============================================================
     手势 DOM 层（010 批次十）
     ------------------------------------------------------------
     物理规则（方向锁/速度/投影/橡皮筋/吸附/收尾判定）在 engine.E.gest ——
     那层没有 document，smoke-test 直接可测。这一层只做接线：

     · track()：Pointer Events + setPointerCapture。认轴（10px 迟滞）
       之前**什么都不做** —— 纵向意图立刻交还浏览器滚动（不抢竖滑）；
       pointercancel（来电、系统手势抢指针）走 onCancel 收尾。
     · 位移 > 迟滞的松手会吞掉随后 350ms 内的合成 click：
       不吞的话每次"滑动松手"都顺带触发一次行点击 —— 最隐蔽的误触。
     · swipe()：一次性横滑触发器（页内换视图 B1-B4），认轴即触发一次。
     · matrixX/Y：从 computed style 读当前位移 —— 动画途中再抓住时
       从"屏幕上的值"接手，不从目标值接手（否则跳一下）。
     ============================================================ */
  const G = LJ.gest = Object.assign({}, LJ.engine.gest);

  let swallowUntil = 0;
  G.swallowClick = function () { swallowUntil = Date.now() + G.SWALLOW; };
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('click', e => {
      if (Date.now() < swallowUntil) { e.stopPropagation(); e.preventDefault(); }
    }, true);
  }

  /** 当前 transform 的 x/y 位移（px；none → 0） */
  G.matrixX = function (el) {
    const t = getComputedStyle(el).transform;
    if (!t || t === 'none') return 0;
    const m = t.match(/matrix\(([^)]+)\)/);
    return m ? (parseFloat(String(m[1]).split(',')[4]) || 0) : 0;
  };
  G.matrixY = function (el) {
    const t = getComputedStyle(el).transform;
    if (!t || t === 'none') return 0;
    const m = t.match(/matrix\(([^)]+)\)/);
    return m ? (parseFloat(String(m[1]).split(',')[5]) || 0) : 0;
  };

  /** 通用指针跟踪。
      opts = { axis:'x'|'y'|'both', ignore(e)→bool,
               onClaim(info), onMove(info), onEnd(info), onCancel() }
      info = { dx, dy, vx, vy, axis } */
  G.track = function (el, opts) {
    let st = null;
    el.addEventListener('pointerdown', e => {
      if (st) return;
      if (G.edgeActive) return;   /* 边缘返回正在拖：本指针归它（app.js 的 capture 先认领） */
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (opts.ignore && opts.ignore(e)) return;
      st = {
        id: e.pointerId, x0: e.clientX, y0: e.clientY, axis: null,
        pts: [{ x: e.clientX, y: e.clientY, t: Date.now() }]
      };
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* 合成事件没有活跃指针 */ }
    });
    el.addEventListener('pointermove', e => {
      if (!st || e.pointerId !== st.id) return;
      const dx = e.clientX - st.x0, dy = e.clientY - st.y0;
      if (!st.axis) {
        const ax = G.dirLock(dx, dy);
        if (!ax) return;
        /* 边缘返回在同一事件的 capture 阶段先认领过 → 撒手让路 */
        if (G.edgeActive) { st = null; return; }
        /* 轴不合（比如页面要竖滑）：立刻撒手，之后当无事发生 */
        if (opts.axis && opts.axis !== 'both' && ax !== opts.axis) { st = null; return; }
        st.axis = ax;
        if (opts.onClaim) opts.onClaim({ dx, dy, vx: 0, vy: 0, axis: ax });
      }
      st.pts.push({ x: e.clientX, y: e.clientY, t: Date.now() });
      if (st.pts.length > 12) st.pts.shift();
      if (opts.onMove) opts.onMove({ dx, dy, vx: 0, vy: 0, axis: st.axis });
    });
    const finish = (e, cancelled) => {
      if (!st || (e && e.pointerId !== st.id)) return;
      const s = st; st = null;
      try { el.releasePointerCapture(s.id); } catch (err) { }
      const dx = (e ? e.clientX : s.x0) - s.x0;
      const dy = (e ? e.clientY : s.y0) - s.y0;
      if (cancelled) { if (opts.onCancel) opts.onCancel(); return; }
      /* 认过轴且真动了 → 吞掉随后的合成 click（滑动松手不许再点一下） */
      if (s.axis && (Math.abs(dx) >= G.TH || Math.abs(dy) >= G.TH)) G.swallowClick();
      if (!opts.onEnd) return;
      const v = G.velocity(s.pts, Date.now());
      opts.onEnd({ dx, dy, vx: v.vx, vy: v.vy, axis: s.axis });
    };
    el.addEventListener('pointerup', e => finish(e, false));
    el.addEventListener('pointercancel', e => finish(e, true));
  };

  /** 一次性横滑触发器（B1-B4）：认轴为 x 就 onFire('left'|'right') 一次。
      el 幂等打标 —— review 这种 mount 会重跑的页面不会叠监听。 */
  G.swipe = function (el, opts) {
    if (!el || el.getAttribute('data-gest-swipe')) return;
    el.setAttribute('data-gest-swipe', '1');
    G.track(el, {
      axis: 'x',
      ignore: opts.ignore,
      onClaim: d => { if (opts.onFire) opts.onFire(d.dx < 0 ? 'left' : 'right'); }
    });
  };

  /* ---------------- toast：手指划走（G4） ---------------- */
  UI.toast = function (msg, ms) {
    const root = document.getElementById('toast-root');
    const el = document.createElement('div');
    el.className = 'toast'; el.textContent = msg;
    root.appendChild(el);
    let done = false;
    const dismiss = () => {
      if (done) return; done = true;
      const q = UI.motion('--dur-quick');
      el.style.transition = 'opacity ' + q + 'ms, transform ' + q + 'ms';
      el.style.opacity = '0'; el.style.transform = 'translateY(8px)';
      /* +10ms 余量：过渡被打断时 transitionend 不保证触发，
         定时器必须比动画本身长一点，否则元素会在动画中途被移除 */
      setTimeout(() => el.remove(), q + 10);
    };
    let timer = setTimeout(dismiss, ms || 1800);
    let bx = 0, by = 0;
    G.track(el, {
      axis: 'both',
      onClaim() {
        clearTimeout(timer);
        /* 入场 keyframes 正在跑会压住内联 transform：先读矩阵接值，再掐动画 */
        bx = G.matrixX(el); by = G.matrixY(el);
        el.style.animation = 'none';
      },
      onMove(d) { el.style.transform = 'translate(' + (bx + d.dx) + 'px,' + (by + d.dy) + 'px)'; },
      onEnd(d) {
        if (Math.hypot(d.dx, d.dy) > 40 || Math.hypot(d.vx, d.vy) >= G.FLING) { dismiss(); return; }
        el.style.transition = 'transform ' + UI.motion('--dur-ui') + 'ms ' + UI.ease('--ease-ui');
        el.style.transform = 'translate(' + bx + 'px,' + by + 'px)';
        setTimeout(() => { if (!done) el.style.transition = ''; }, UI.motion('--dur-ui') + 10);
        timer = setTimeout(dismiss, ms || 1800);   /* 回弹了：自动消失的钟继续走 */
      }
    });
  };

  /* ---------------- 半屏浮层 ---------------- */
  UI.sheet = function (opt) {
    const root = document.getElementById('sheet-root');
    const mask = document.createElement('div'); mask.className = 'sheet-mask';
    const sheet = document.createElement('div'); sheet.className = 'sheet';
    /* 把手 + 标题 + 副题包成一个拖拽面（.sheet-gz，touch-action:none）—— G1 */
    sheet.innerHTML = '<div class="sheet-gz"><div class="grab"></div>' +
      (opt.title ? '<h3>' + UI.esc(opt.title) + '</h3>' : '') +
      (opt.sub ? '<div class="sub">' + opt.sub + '</div>' : '') + '</div>' +
      (opt.body || '');
    root.appendChild(mask); root.appendChild(sheet);
    requestAnimationFrame(() => { mask.classList.add('on'); sheet.classList.add('on'); });

    let closed = false;
    function close() {
      if (closed) return;          /* 幂等：拖拽收尾和遮罩点击可能撞车 */
      closed = true;
      mask.classList.remove('on'); sheet.classList.remove('on');
      setTimeout(() => { mask.remove(); sheet.remove(); }, UI.motion('--dur-ui') + 10);
      opt.onClose && opt.onClose();
    }
    mask.onclick = close;
    if (opt.mount) opt.mount(sheet, close);

    /* ---- 下拉关闭（G1 把手区 / G2 内容到顶再下拉），两路共用收尾 ----
       G2 的 touchmove 只在 scrollTop==0 且向下时声明并吃掉这一段 ——
       它声明的恰好是"关闭手势"本身；正常滚动路径不经过 preventDefault。 */
    let H = 0, lastY = 0;
    const applyY = y => {
      lastY = y;
      sheet.style.transform = 'translate(-50%,' + y + 'px)';
      const p = Math.max(0, Math.min(1, y / Math.max(1, H)));
      mask.style.opacity = String(Math.max(0, 1 - p * 1.2));
    };
    const grabBase = () => {
      H = sheet.getBoundingClientRect().height || 320;
      sheet.style.transition = 'none'; mask.style.transition = 'none';
      return G.matrixY(sheet);
    };
    const settleY = (y, vy, dy) => {
      const T = 'transform ' + UI.motion('--dur-ui') + 'ms ' + UI.ease('--ease-ui');
      /* 判定用**手势增量** dy：抓在开合动画中途时，matrix 基线带着开合进度，
         拿绝对位移判会把"刚开到一半"误判成拖到底（010 探针 ⑥a 抓过）。 */
      if (G.settle(dy == null ? y : dy, vy, H, 0.3) === 1) {
        /* 落到 class 的目标位（inline 赢但值相同 → 不跳变），再走统一 close */
        sheet.style.transition = T;
        sheet.style.transform = 'translate(-50%,100%)';
        mask.style.transition = ''; mask.style.opacity = '';
        close();
      } else {
        sheet.style.transition = T;
        sheet.style.transform = 'translate(-50%,0)';
        mask.style.transition = 'opacity ' + UI.motion('--dur-quick') + 'ms';
        mask.style.opacity = '';
        setTimeout(() => {
          if (closed) return;
          sheet.style.transition = ''; sheet.style.transform = '';
          mask.style.transition = '';
        }, UI.motion('--dur-ui') + 10);
      }
    };
    let dragging = false, baseY = 0;
    const gz = sheet.querySelector('.sheet-gz');
    G.track(gz, {
      axis: 'y',
      onClaim() { dragging = true; baseY = grabBase(); },
      onMove(d) { let y = baseY + d.dy; if (y < 0) y = G.rubberband(y, H); applyY(y); },
      onEnd(d) { if (!d.axis) return; dragging = false; settleY(lastY, d.vy, d.dy); },
      onCancel() { dragging = false; }
    });
    /* G2：内容区到顶再下拉（触屏） */
    let t2 = null;
    sheet.addEventListener('touchstart', e => {
      if (closed || dragging) return;
      if (e.target && e.target.closest && e.target.closest('.sheet-gz')) return;
      if (sheet.scrollTop > 0) return;
      t2 = { y0: e.touches[0].clientY, claimed: false, base: 0, pts: [{ x: 0, y: e.touches[0].clientY, t: Date.now() }] };
    }, { passive: true });
    sheet.addEventListener('touchmove', e => {
      if (!t2) return;
      const dy = e.touches[0].clientY - t2.y0;
      t2.pts.push({ x: 0, y: e.touches[0].clientY, t: Date.now() });
      if (t2.pts.length > 12) t2.pts.shift();
      if (!t2.claimed) {
        if (dy > G.TH && sheet.scrollTop <= 0) { t2.claimed = true; t2.base = grabBase(); dragging = true; }
        else if (dy < -G.TH) { t2 = null; return; }   /* 向上 = 正常滚动，撒手 */
        else return;
      }
      e.preventDefault();
      let y = t2.base + dy;
      if (y < 0) y = G.rubberband(y, H);
      applyY(y);
    }, { passive: false });
    const t2End = () => {
      if (!t2) return;
      const was = t2.claimed, pts = t2.pts, y0 = t2.y0;
      t2 = null;
      if (!was) return;
      dragging = false;
      const v = G.velocity(pts, Date.now());
      const dyEnd = pts.length ? (pts[pts.length - 1].y - y0) : 0;
      settleY(lastY, v.vy, dyEnd);
    };
    sheet.addEventListener('touchend', t2End, { passive: true });
    sheet.addEventListener('touchcancel', t2End, { passive: true });

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
      setTimeout(() => { mask.remove(); panel.remove(); }, UI.motion('--dur-ui') + 10);
      opt.onClose && opt.onClose();
    }
    mask.onclick = close;
    if (opt.mount) opt.mount(panel, close);

    /* 面板横向拖（G3）：左抽屉 —— 左拖关闭、过 4 成宽或快甩就关；
       右拖是橡皮筋（它已经开到头了，硬停会像卡死）。 */
    let W = 0, baseX = 0, lastX = 0;
    const T = () => 'transform ' + UI.motion('--dur-ui') + 'ms ' + UI.ease('--ease-ui');
    G.track(panel, {
      axis: 'x',
      onClaim() {
        W = panel.getBoundingClientRect().width || 312;
        panel.style.transition = 'none'; mask.style.transition = 'none';
        baseX = G.matrixX(panel); lastX = baseX;
      },
      onMove(d) {
        let x = baseX + d.dx;
        if (x > 0) x = G.rubberband(x, W);
        if (x < -W) x = -W;
        lastX = x;
        panel.style.transform = 'translateX(' + x + 'px)';
        const p = Math.min(1, Math.abs(x) / Math.max(1, W));
        mask.style.opacity = String(Math.max(0, 1 - p * 1.2));
      },
      onEnd(d) {
        if (!d.axis) return;
        /* 阈值判定用**手势增量** d.dx（抓在抽屉开合中途时基线带着进度）；
           视觉仍跟手 base+d.dx，回弹目标永远是"开到位/关到位"。 */
        if (G.settle(d.dx, d.vx, W, 0.4) === -1) {
          panel.style.transition = T();
          panel.style.transform = 'translateX(-100%)';
          mask.style.transition = ''; mask.style.opacity = '';
          close();
        } else {
          panel.style.transition = T();
          panel.style.transform = 'translateX(0)';
          mask.style.transition = 'opacity ' + UI.motion('--dur-quick') + 'ms';
          mask.style.opacity = '';
          setTimeout(() => {
            if (closed) return;
            panel.style.transition = ''; panel.style.transform = '';
            mask.style.transition = '';
          }, UI.motion('--dur-ui') + 10);
        }
      },
      onCancel() { }
    });

    return { close, el: panel };
  };

  /* ---------------- 行左滑揭示（010 · C1 消息 / C2 时间线 / C3 流水行）----------------
     结构由页面给：.sw > .sw-acts（动作）+ .sw-body（滑动面）。
     · 只认左滑揭示；右拖是橡皮筋不是硬停。
     · 收尾走 E.gest.settle：快甩看速度符号、慢放看位置过没过半。
     · 一次只开一行；开着的行被点一下 = 收回（capture，抢在行导航之前）；
       点行外任意处也收回。位移过迟滞的松手由 track 统一吞掉随后的合成 click。 */
  let openSw = null;
  function closeSw(box) {
    if (!box) return;
    const body = box.querySelector('.sw-body');
    box.classList.remove('sw-open', 'sw-on');
    if (body) {
      body.style.transition = 'transform ' + UI.motion('--dur-ui') + 'ms ' + UI.ease('--ease-ui');
      body.style.transform = '';
    }
  }
  UI.swCloseAll = function () {
    if (openSw) { closeSw(openSw); openSw = null; }
  };

  let swDocBound = false;
  UI.rowSwipe = function (root) {
    if (!root) return;
    if (!swDocBound && typeof document !== 'undefined' && document.addEventListener) {
      swDocBound = true;
      document.addEventListener('click', e => {
        if (!openSw) return;
        if (e.target && openSw.contains(e.target)) return;   /* 点在开着的行里：交给行自己收 */
        UI.swCloseAll();
      }, true);
    }
    root.querySelectorAll('.sw').forEach(box => {
      if (box.getAttribute('data-sw-bound')) return;
      box.setAttribute('data-sw-bound', '1');
      const body = box.querySelector('.sw-body');
      const acts = box.querySelector('.sw-acts');
      if (!body || !acts) return;
      let W = 0, curX = 0, claimBase = 0;
      const width = () => W || (W = acts.offsetWidth || 72);
      const setX = (px, anim) => {
        curX = px;
        body.style.transition = anim
          ? 'transform ' + UI.motion('--dur-ui') + 'ms ' + UI.ease('--ease-ui')
          : 'none';
        body.style.transform = px ? 'translateX(' + px + 'px)' : '';
      };
      G.track(body, {
        axis: 'x',
        onClaim() {
          if (openSw && openSw !== box) { closeSw(openSw); openSw = null; }
          box.classList.add('sw-on');
          /* 从屏幕当前值接续（可能开着在 -w、也可能回弹动画中途） */
          claimBase = G.matrixX(body);
        },
        onMove(d) {
          const w = width();
          let x = claimBase + d.dx;
          if (x > 0) x = G.rubberband(x, w);
          if (x < -w) x = -w - G.rubberband((-w) - x, w);
          setX(x, false);
        },
        onEnd(d) {
          if (!d.axis) return;
          const w = width();
          if (G.settle(curX, d.vx, w, 0.5) === -1) {
            if (openSw && openSw !== box) { closeSw(openSw); openSw = null; }
            openSw = box;
            box.classList.add('sw-open');
            setX(-w, true);
          } else {
            box.classList.remove('sw-open', 'sw-on');
            setX(0, true);
            if (openSw === box) openSw = null;
          }
        },
        onCancel() {
          box.classList.remove('sw-open', 'sw-on');
          setX(0, true);
          if (openSw === box) openSw = null;
        }
      });
      /* 开着的行：点一下收回（capture，抢在行的 onclick 之前） */
      body.addEventListener('click', e => {
        if (box.classList.contains('sw-open')) {
          e.stopPropagation(); e.preventDefault();
          closeSw(box);
          if (openSw === box) openSw = null;
        }
      }, true);
    });
  };

  /* ---------------- 转义 ---------------- */
  UI.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
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
      'style="transition:stroke-dashoffset .8s ' + UI.ease('--ease-ui') + '"/>' +
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

  /* ---------------- 可折叠列表 ----------------
     账单/首页那些"一长串"的区块（大类支出、预算执行率、我登记的支持、
     待办、支持记录、更多工具）都走这里：折叠时只露前 MAX 项，多的收起来。

     两条硬约束：
     1) 状态按 key 存在模块级 map 里，**不写 localStorage**。
        刷新页面回到折叠态是对的 —— 这是每次进入页面的默认视图，
        不是用户偏好设置。但同一会话里来回切页要记住，否则
        "展开 → 进详情 → 返回"会弹回折叠，很难用。
     2) 折叠靠 hidden 切，**不重渲染**。重渲染会重建 DOM、丢掉滚动位置，
        在长页面上表现为"点一下展开、页面跳一下"。 */
  const FOLD_MAX = 3;
  const foldOpen = Object.create(null);

  UI.fold = function (key, items, opts) {
    const o = opts || {};
    const max = o.max || FOLD_MAX;
    const list = items || [];
    /* 不超过上限就不给折叠按钮 —— 一个折起来也省不下东西的按钮只会碍事 */
    if (list.length <= max) return list.join('');

    const open = !!foldOpen[key];
    const head = list.slice(0, max);
    const tail = list.slice(max);
    const more = tail.length;

    return head.join('') +
      '<div class="fold-more" data-fold="' + UI.esc(key) + '"' + (open ? '' : ' hidden') + '>' +
      tail.join('') + '</div>' +
      '<button class="fold-btn' + (open ? ' open' : '') + '" data-fold-btn="' + UI.esc(key) + '" ' +
      'aria-expanded="' + (open ? 'true' : 'false') + '">' +
      '<span data-fold-label>' + (open ? '收起' : '展开另外 ' + more + ' 项') + '</span>' +
      UI.icon('chevron', 12) + '</button>';
  };

  /* 绑定折叠按钮。放在 UI 里而不是每个页面各写一遍：
     六个区块 × 各写一遍 = 六处会各自跑偏的连点/状态 bug。 */
  UI.bindFold = function (root) {
    (root || document).querySelectorAll('[data-fold-btn]').forEach(btn => {
      btn.onclick = () => {
        const key = btn.getAttribute('data-fold-btn');
        const box = (root || document).querySelector('[data-fold="' + key + '"]');
        if (!box) return;
        const open = box.hidden;
        box.hidden = !open;
        foldOpen[key] = open;
        btn.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        const label = btn.querySelector('[data-fold-label]');
        if (label) label.textContent = open ? '收起' : '展开另外 ' + box.children.length + ' 项';
      };
    });
  };

  /* 供探针/深链检查折叠状态 */
  UI.foldState = function () { return foldOpen; };

  /* ---------------- 数字滚动 ----------------
     把"数值变化"表达成"数量在移动"，而不是字符串被替换。
     ★ 只在**真的变了**或会话内首次出现时滚；同值重渲染不动 ——
       首页是最高频的页面，每次进来都滚一遍就是噪音（playbook §1）。
     ★ tabular-nums 已经在 .hi-bal 上，数字宽度稳定，滚动不会抖。
     ★ 状态（上次的值）挂在元素的 data-count-from 上，和 foldOpen 一样
       **不写 localStorage**：刷新重置是有意的，见上面折叠那段的说明。 */
  UI.countTo = function (el, to, ms) {
    if (!el) return;
    /* ★ 只写"数字那一个文本节点"，不用 textContent —— 后者会把 <b> 里的
       子元素（比如 .hi-cur 的 ¥ 前缀 span）整块删掉，结构就被滚没了。
       <b> 的结构是 [<span class="hi-cur">¥</span>][文本节点]，所以取
       lastChild 正好只改数字。没有文本节点时退化成写 textContent。 */
    const write = (v) => {
      const tn = el.lastChild;
      if (tn && tn.nodeType === 3) tn.nodeValue = String(v);
      else el.textContent = String(v);
    };
    const fmt = () => el.getAttribute('data-fmt') || String(to);
    /* 尊重减弱动效：直接写终值，不做位移/滚动（playbook §6） */
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      write(fmt());
      el.setAttribute('data-count-from', String(to));
      return;
    }
    const from = Number(el.getAttribute('data-count-from') || to);
    if (!(to - from)) { write(fmt()); el.setAttribute('data-count-from', String(to)); return; }
    const dur = ms || 400;
    el.setAttribute('data-anim', 'roll');           // 探针证人：这次真的滚了
    /* ★ 起点先落定，再开始滚：下面 rAF 兜底可能在很晚才跑，若那时才写
       data-count-from，中间任何一次重渲染读到的都是旧值（会误判成"又变了"）。 */
    el.setAttribute('data-count-from', String(to));
    let done = false;
    const finish = () => { if (done) return; done = true; write(to); };
    const tick = () => {
      if (done) return;
      const k = Math.min(1, (performance.now() - t0) / dur);
      /* 强 ease-out 的数值近似（0.23,1,0.32,1 的手感），收尾稳 */
      const e = 1 - Math.pow(1 - k, 3);
      if (k >= 1) { finish(); return; }
      write(Math.round(from + (to - from) * e));
      requestAnimationFrame(tick);
    };
    const t0 = performance.now();
    tick();
    /* ★ rAF 在无头 / 后台标签页里会被节流甚至完全不触发（实测 headless 下
       只跑第一帧就停住，数字永远停在起点）。补一个定时器兜底：到点直接落终值，
       保证"数字最终一定是对的"这条底线不依赖 rAF 是否被调度。 */
    setTimeout(finish, dur + 60);
  };

  /* ---------------- 图形：复盘用图表（纯 SVG，零依赖） ----------------
     三个原则，都是被需求逼出来的：

     1) 每张图都要能回答「然后呢」。只画"过去发生了什么"的图是后视镜 ——
        好看，但用户合上就忘。所以折线图画到周期末尾（投影），
        环形图和条形图把异常项自己跳出来（不用读文字）。
     2) 尺寸全部走 viewBox + width:100%，不在 JS 里读 DOM 宽度 ——
        页面渲染时量宽会触发同步布局，而且隐藏容器里量出来是 0。
     3) 几何全部由数据算，不写死路径 —— 探针才能用数学断言验它
        （环形各段 dash 之和 == 圆周长、折线末点 y == 累计值映射）。
  ---------------------------------------------------------------------- */

  /** 数值 → 保留两位，避免 SVG 属性里出现 1.2000000000000002 */
  const n2 = v => Math.round(v * 100) / 100;

  /* 累计支出折线 + 预算线 + 按当前节奏外推到周期末
     o: { daily, periodDays, budgetTotal, avgPerDay, restDays, projectedEnd }

     现在没有页面在用：复盘页的「看节奏」按需求删了（它和「看未来」
     功能重合、结论还互相打架）。函数保留备查，重新用它时把图级探针补回来
     （probe-charts 里曾经有它一整套坐标断言，照抄即可）。

     ★ 颜色一律走 CSS 类，不写 stroke="var(--x)"。
       SVG 的 presentation attribute 按 SVG 值解析，**不认 CSS 变量**，
       写了会被静默忽略、线条变黑或消失。类名放在 app.css 里才生效。 */
  UI.chartCumulative = function (o) {
    const W = 310, H = o.height || 132;
    const PL = 38, PR = 10, PT = 12, PB = 20;
    const iw = W - PL - PR, ih = H - PT - PB;

    const daily = o.daily || [];
    if (!daily.length) return '';

    const days = o.periodDays || daily.length;
    const budget = o.budgetTotal || 0;
    const proj = o.projectedEnd || 0;
    const last = daily[daily.length - 1];
    const projPerDay = o.avgPerDay || 0;

    /* y 轴上限：预算、已花、外推落点三者取最大，再留 8% 余量。
       只按预算定上限的话，超支月份曲线会冲出画布被裁掉。 */
    const yMax = Math.max(budget, last.cum, proj) * 1.08 || 1;

    const X = d => n2(PL + (d / days) * iw);          // d = 第几天（0..days）
    const Y = v => n2(PT + ih - (v / yMax) * ih);     // v = 金额

    /* 已发生：逐日累计 */
    const obs = daily.map(p => X(p.d) + ',' + Y(p.cum));
    /* 外推：从今天（最后一个观测点）按当前日均走到周期末 */
    const projPts = [X(last.d) + ',' + Y(last.cum), X(days) + ',' + Y(proj)];
    /* 预算线：从原点直线到周期末的预算总额 */
    const budPts = [X(0) + ',' + Y(0), X(days) + ',' + Y(budget)];

    /* 超支交点：预算线与「今天之后的外推线」的交点。
       外推线：cum(d) = last.cum + (d - last.d) * projPerDay
       预算线：bud(d) = budPerDay * d
       联立解得 d = (last.d * projPerDay - last.cum) / (projPerDay - budPerDay)
       只有在「还没超、但按当前节奏会超」时这个点才有意义（落在今天之后）。 */
    let cross = null;
    const budPerDay = days > 0 ? budget / days : 0;
    if (budget > 0 && projPerDay > budPerDay && last.cum < budPerDay * last.d) {
      const dc = (last.d * projPerDay - last.cum) / (projPerDay - budPerDay);
      if (dc > last.d && dc <= days) cross = { d: n2(dc), v: n2(budPerDay * dc) };
    }

    const areaPts = obs.join(' ') + ' ' + X(days) + ',' + Y(0) + ' ' + X(daily[0].d) + ',' + Y(0);

    return '<svg class="ch ch-cum" viewBox="0 0 ' + W + ' ' + H + '" width="100%" ' +
      'height="' + H + '" data-days="' + days + '" data-ymax="' + n2(yMax) + '" ' +
      'data-budget="' + n2(budget) + '" data-proj="' + n2(proj) + '">' +
      '<defs><linearGradient id="chCumFill" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#161618" stop-opacity=".16"/>' +
      '<stop offset="1" stop-color="#161618" stop-opacity="0"/></linearGradient></defs>' +

      /* 横向参考线：0 / 一半 / 上限 */
      [0, .5, 1].map(f =>
        '<line class="ch-grid" x1="' + PL + '" y1="' + n2(PT + ih - f * ih) + '" x2="' + n2(PL + iw) +
        '" y2="' + n2(PT + ih - f * ih) + '"/>').join('') +

      /* y 轴刻度 */
      '<text x="' + (PL - 6) + '" y="' + n2(PT + 4) + '" text-anchor="end" class="ch-t">' + Math.round(yMax) + '</text>' +
      '<text x="' + (PL - 6) + '" y="' + n2(PT + ih + 4) + '" text-anchor="end" class="ch-t">0</text>' +

      /* 已发生区域的填充（只填到"今天"，不外推到未来） */
      '<polygon points="' + areaPts + '" fill="url(#chCumFill)"/>' +

      /* 预算线（虚线，参照系） */
      '<polyline class="ch-budget" points="' + budPts.join(' ') + '" fill="none" ' +
      'stroke-width="1.5" stroke-dasharray="4 4"/>' +

      /* 累计支出（实线，主角） */
      '<polyline class="ch-obs" points="' + obs.join(' ') + '" fill="none" ' +
      'stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>' +

      /* 外推段（虚线，颜色随是否超支） */
      '<polyline class="ch-proj' + (proj > budget ? ' over' : '') + '" points="' + projPts.join(' ') +
      '" fill="none" stroke-width="2.5" stroke-dasharray="5 4" stroke-linecap="round"/>' +

      /* 今天的位置 */
      '<circle class="ch-today" cx="' + X(last.d) + '" cy="' + Y(last.cum) + '" r="4" stroke-width="2.5"/>' +

      /* 超支预警点 */
      (cross ? '<circle class="ch-cross" cx="' + X(cross.d) + '" cy="' + Y(cross.v) + '" r="4.5" ' +
        'data-cross-day="' + cross.d + '"/>' : '') +

      /* x 轴两端 */
      '<text x="' + PL + '" y="' + (H - 5) + '" class="ch-t">1 日</text>' +
      '<text x="' + n2(PL + iw) + '" y="' + (H - 5) + '" text-anchor="end" class="ch-t">' + days + ' 日</text>' +
      '</svg>';
  };

  /* 承诺三条 —— 复盘「看承诺」那一维的主图
     o: { rows: [{ name, chip, ratio, tone }] }

     结构照参考图**按像素量出来的一比一还原**（参考图是深色底，
     配色换成本产品的浅色系 —— 结构是它的，皮是我们自己的）：
       · 一行 = 标签 + 数值胶囊（同一行靠左）+ 一根比例条（在下）
       · 比例条 = [填充][4px 缝][灰轨]，填充按 ratio 归一（>100% 时封顶在 100%）
       · 行里**没有第三行字** —— 数字都住在胶囊里，条只负责"一眼看出多少"

     ★ 胶囊里的百分比**从 ratio 现算**，不由调用方传进来：
       条和字必须是同一个数的两个视图，各传各的迟早对不上（而且探针就没法
       用"胶囊 == 条"这条断言抓 bug 了）。chip 只给动词（已用 / 占支出 / 用掉）。
     为什么不做环形图：三条要放在一起**比长短**，环形图并排比不了。
     ★ 几何全部可断言（data-ratio / width%）：探针按原始账本独立复算再验一遍，
       不是"和函数自己算出来的一致"就完事。 */
  UI.chartPromise = function (o) {
    const rows = o.rows || [];
    if (!rows.length) return '';
    return '<div class="pm" data-rows="' + rows.length + '">' + rows.map(r => {
      const ratio = n2(r.ratio || 0);
      const pct = Math.max(0, Math.min(1, ratio)) * 100;
      const chipTxt = (r.chip ? UI.esc(r.chip) + ' ' : '') + Math.round(ratio * 100) + '%';
      const tone = ['ok', 'warn', 'danger', 'info'].indexOf(r.tone) >= 0 ? r.tone : 'info';
      return '<div class="pm-row t-' + tone + '" data-name="' + UI.esc(r.name) +
        '" data-chip="' + chipTxt + '" data-ratio="' + ratio + '">' +
        '<div class="pm-h"><span class="pm-k">' + UI.esc(r.name) + '</span>' +
        '<span class="pm-chip">' + chipTxt + '</span></div>' +
        '<div class="pm-bar"><i style="width:' + n2(pct) + '%"></i><u></u></div>' +
        '</div>';
    }).join('') + '</div>';
  };

  /* 决定时间线 —— 复盘「看决定」那一维
     o: { items: [{date, d, amount, merchant, tag, tagName, after, restDays, catName}],
          max, days, periodDays, byTag, impulseShare }

     一条钢轨竖着往下走，四个编码各干一件事，谁都不许兼职：
       · 钢轨 + 日期     = 什么时候（顺序就是时间，间隔靠留白带出来）
       · 圆点的颜色      = 这笔是什么性质（推演过 / 计划内 / 临时起意）
       · 横条的长度      = 多大（按本期最大一笔归一）
       · 条下面那行字    = 然后呢（这笔之后每天还能花多少）

     ★ 为什么不用横向时间轴：手机宽度只有 346px，6 笔大额横着排，
       商户名会被挤成两个字。竖着排，日期在左、金额在右，都能读全。
     ★ 几何全是可断言的数字（data-d / data-amount / width 百分比），
       探针按 items 重算一遍就能验，不靠肉眼看图。 */
  UI.chartTimeline = function (o) {
    const items = o.items || [];
    if (!items.length) return '';
    const max = o.max || items.reduce((a, b) => Math.max(a, b.amount), 1);
    const tagCls = t => t === 'simulated' ? 'sim' : t === 'planned' ? 'plan' : 'imp';
    let prevD = null;
    const rows = items.map(it => {
      const w = Math.max(6, n2(it.amount / max * 100));
      /* 和上一笔隔了几天 → 留白最多 12px。间隔大就是"想清楚再花"，
         间隔小就是"连着来"，这件事得让人一眼看出来。 */
      const gap = prevD === null ? 0 : Math.max(0, it.d - prevD);
      const mt = Math.min(12, Math.max(0, (gap - 1) * 4));
      prevD = it.d;
      return '<div class="tl-i t-' + tagCls(it.tag) + '" data-d="' + it.d + '" data-tag="' + it.tag +
        '" data-amount="' + n2(it.amount) + '" data-gap="' + gap + '"' +
        (mt ? ' style="margin-top:' + mt + 'px"' : '') + '>' +
        '<div class="tl-when"><b>' + String(it.date).slice(5).replace('-', '/') + '</b>' +
        '<span>第 ' + it.d + ' 天</span></div>' +
        '<div class="tl-dot"><i></i></div>' +
        '<div class="tl-box">' +
        '<div class="tl-head"><b>' + UI.esc(it.merchant) + '</b>' +
        '<span class="tl-tag">' + UI.esc(it.tagName || '') + '</span>' +
        '<span class="tl-amt mono">¥' + U.wonInt(it.amount) + '</span></div>' +
        '<div class="tl-bar"><i style="width:' + w + '%"></i></div>' +
        (it.after != null
          ? '<div class="tl-foot">这笔之后，剩下 ' + it.restDays + ' 天每天还能花 ¥' + it.after + '</div>'
          : '<div class="tl-foot">' + UI.esc(it.catName || '') + '</div>') +
        '</div></div>';
    }).join('');

    return '<div class="ch-tl" data-count="' + items.length + '" data-max="' + n2(max) +
      '" data-days="' + (o.periodDays || 0) + '">' +
      '<div class="tl-rail"></div>' + rows +
      '<div class="tl-x"><span>1 日</span><span>' + (o.periodDays || '') + ' 日</span></div>' +
      '</div>';
  };

  /* 环形占比图
     o: { items: [{ name, amount, color }] }
     用 stroke-dasharray 分段而不是 arc path —— 各段 dash 之和必须等于圆周长，
     这条等式就是探针验"占比算对了"的依据；arc path 没有这么干净的断言。 */
  /* 环形图：目前没有页面在用（复盘页的「支出结构」按需求删了，
     和流水/支出结构页重合）。函数保留备查，重新用它时把图级探针补回来。 */
  UI.chartDonut = function (o) {
    const items = (o.items || []).filter(x => x.amount > 0);
    if (!items.length) return '';
    const S = o.size || 118, R = 44, C = n2(2 * Math.PI * R);
    const total = items.reduce((a, b) => a + b.amount, 0);

    let off = 0;
    const segs = items.map(it => {
      const len = n2((it.amount / total) * C);
      const seg = '<circle class="ch-seg" data-name="' + UI.esc(it.name) + '" ' +
        'data-amount="' + n2(it.amount) + '" data-len="' + len + '" ' +
        'cx="' + (S / 2) + '" cy="' + (S / 2) + '" r="' + R + '" fill="none" ' +
        'stroke="' + it.color + '" stroke-width="17" ' +
        'stroke-dasharray="' + len + ' ' + n2(C - len) + '" ' +
        'stroke-dashoffset="' + n2(-off) + '" ' +
        'transform="rotate(-90 ' + (S / 2) + ' ' + (S / 2) + ')"/>';
      off += len;
      return seg;
    }).join('');

    /* ★ 尺寸必须走内联 style，不能只靠 width/height 属性。
       .ch 类里有 width:100%，而 CSS 的优先级高于 SVG 的 presentation attribute，
       于是环形图会被撑满整行（实测 310px 而不是 118px），把右边图例挤出屏幕
       （页面横向溢出 24px）。内联 style 才盖得住类。 */
    return '<svg class="ch ch-donut" viewBox="0 0 ' + S + ' ' + S + '" ' +
      'style="width:' + S + 'px;height:' + S + 'px" ' +
      'data-circ="' + C + '" data-total="' + n2(total) + '">' +
      '<circle class="ch-track" cx="' + (S / 2) + '" cy="' + (S / 2) + '" r="' + R + '" ' +
      'fill="none" stroke-width="17"/>' + segs +
      '<text x="' + (S / 2) + '" y="' + (S / 2 - 2) + '" text-anchor="middle" class="ch-dv">' +
      Math.round(total) + '</text>' +
      '<text x="' + (S / 2) + '" y="' + (S / 2 + 15) + '" text-anchor="middle" class="ch-dk">总支出</text>' +
      '</svg>';
  };

  /* 成对条形：本期 vs 上期（上期用灰、本期用大类色，长短差一眼可见）
     o: { rows: [{ name, cur, prev, color }] } */
  /* 成对条形（本期 vs 上期）：复盘页那块按需求删了，函数保留备查。 */
  UI.chartPair = function (o) {
    const rows = o.rows || [];
    if (!rows.length) return '';
    const max = Math.max.apply(null, rows.map(r => Math.max(r.cur, r.prev)).concat([1]));
    return '<div class="ch-pair" data-max="' + n2(max) + '">' + rows.map(r =>
      '<div class="cp-row" data-name="' + UI.esc(r.name) + '">' +
      '<div class="cp-k">' + UI.esc(r.name) + '</div>' +
      '<div class="cp-bars">' +
      '<div class="cp-b cp-prev" data-v="' + n2(r.prev) + '">' +
      '<i style="width:' + n2(r.prev / max * 100) + '%"></i></div>' +
      '<div class="cp-b cp-cur" data-v="' + n2(r.cur) + '">' +
      '<i style="width:' + n2(r.cur / max * 100) + '%;background:' + (r.color || 'var(--ink)') + '"></i></div>' +
      '</div>' +
      '<div class="cp-v mono">¥' + U.wonInt(r.cur) + '</div>' +
      '</div>').join('') + '</div>';
  };

  /* 决策沙盘：两条线看「买了 / 不买」分别能撑多久
     o: { remaining, amount, pace, daysLeft }
     画的是**剩余预算随时间递减**：不买从 remaining 开始掉，
     买了从 remaining - amount 开始掉，两条线触底的时间差就是代价。
     预算节奏那条虚线是参照系（从 remaining 直线到周期末的 0）——
     它回答"按预算该怎么花"，另外两条回答"按你的实际节奏会怎样"。 */
  UI.chartSandbox = function (o) {
    const W = 310, H = o.height || 128;
    const PL = 34, PR = 12, PT = 10, PB = 18;
    const iw = W - PL - PR, ih = H - PT - PB;

    const days = Math.max(1, o.daysLeft || 1);
    const rem = Math.max(0, o.remaining || 0);
    const amt = Math.max(0, o.amount || 0);
    const pace = Math.max(0, o.pace || 0);
    if (rem <= 0) return '';

    const yMax = Math.max(rem, 1);
    const X = d => n2(PL + (d / days) * iw);
    const Y = v => n2(PT + ih - (Math.max(0, Math.min(v, yMax)) / yMax) * ih);

    /* 从 start 起按 pace 递减，触底就停（不画到负数区） */
    function lineFor(start) {
      const dEnd = pace > 0 ? Math.min(days, start / pace) : days;
      const vEnd = Math.max(0, start - pace * dEnd);
      return {
        pts: [X(0) + ',' + Y(start), X(dEnd) + ',' + Y(vEnd)],
        dEnd: n2(dEnd),
        ranOut: dEnd < days
      };
    }
    const keep = lineFor(rem);
    const buy = lineFor(rem - amt);
    /* 预算节奏：正好在周期末用完 */
    const pacePts = [X(0) + ',' + Y(rem), X(days) + ',' + Y(0)];

    return '<svg class="ch ch-sandbox" viewBox="0 0 ' + W + ' ' + H + '" width="100%" ' +
      'height="' + H + '" data-days="' + days + '" data-rem="' + n2(rem) +
      '" data-amount="' + n2(amt) + '" data-pace="' + n2(pace) +
      '" data-keep-end="' + keep.dEnd + '" data-buy-end="' + buy.dEnd + '">' +
      [0, .5, 1].map(f =>
        '<line class="ch-grid" x1="' + PL + '" y1="' + n2(PT + ih - f * ih) + '" x2="' + n2(PL + iw) +
        '" y2="' + n2(PT + ih - f * ih) + '"/>').join('') +
      '<text x="' + (PL - 5) + '" y="' + (PT + 4) + '" text-anchor="end" class="ch-t">' +
      Math.round(yMax) + '</text>' +
      '<text x="' + (PL - 5) + '" y="' + n2(PT + ih + 4) + '" text-anchor="end" class="ch-t">0</text>' +
      /* 预算节奏参照线 */
      '<polyline class="ch-pace" points="' + pacePts.join(' ') + '" fill="none" ' +
      'stroke-width="1.5" stroke-dasharray="4 4"/>' +
      /* 不买 */
      '<polyline class="ch-keep" points="' + keep.pts.join(' ') + '" fill="none" ' +
      'stroke-width="2.5" stroke-linecap="round"/>' +
      /* 买了 */
      '<polyline class="ch-buy" points="' + buy.pts.join(' ') + '" fill="none" ' +
      'stroke-width="2.5" stroke-linecap="round" stroke-dasharray="6 3"/>' +
      /* 触底的点：一眼看出哪天用完 */
      (keep.ranOut ? '<circle class="ch-zero keep" cx="' + X(keep.dEnd) + '" cy="' + Y(0) + '" r="3.5"/>' : '') +
      (buy.ranOut ? '<circle class="ch-zero buy" cx="' + X(buy.dEnd) + '" cy="' + Y(0) + '" r="3.5"/>' : '') +
      '<text x="' + PL + '" y="' + (H - 4) + '" class="ch-t">今天</text>' +
      '<text x="' + n2(PL + iw) + '" y="' + (H - 4) + '" text-anchor="end" class="ch-t">' +
      days + ' 天后</text>' +
      '</svg>';
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
