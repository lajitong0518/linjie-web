/* ============================================================
   router.js —— 页面栈（小程序式导航 + 转场）
   ============================================================ */
(function (LJ) {
  'use strict';
  const UI = LJ.ui;

  LJ.pages = LJ.pages || {};

  /* 共享元素飞行时长（毫秒）。?slow=1 可放慢 8 倍，便于截中间帧验证 */
  LJ.SHARED_MS = 480;
  /* 全屏缩放时长 */
  LJ.ZOOM_MS = 520;

  const EASE = 'cubic-bezier(.32,.72,.24,1)';
  const BG = '#F2F1F6';   // 与 --bg 一致

  /** 元素相对手机屏幕的位置（覆盖层挂在 .screen 里，会被圆角裁切） */
  function relRect(el, screenEl) {
    const r = el.getBoundingClientRect();
    const s = screenEl.getBoundingClientRect();
    return { left: r.left - s.left, top: r.top - s.top, width: r.width, height: r.height };
  }
  function rectCss(r) {
    return 'left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;';
  }

  const R = LJ.router = {
    host: null,
    stack: [],
    animating: false,

    init(host) { R.host = host; },

    current() { return R.stack[R.stack.length - 1] || null; },

    /** 页面上下文 */
    ctx(page, params, layer) {
      return {
        api: LJ.api.self(),
        role: LJ.session.get().role,
        params: params || {},
        page, layer,
        go: R.push, back: R.pop, reset: R.reset, replace: R.replace,
        goShared: (name, params, el, sel) => R.push(name, params, { shared: el, sharedSel: sel }),
        refresh: R.refresh, refreshTop: R.refreshTop
      };
    },

    /**
     * 统一的挂载入口。除了调 page.mount，还负责给「锁卡」的按钮接线 ——
     * 锁卡可能在任何一个页面 render 出来，靠每个 mount 自己记得调一次太脆，
     * 漏一个就变成"点了没反应"。放在这里一处兜住。
     */
    _mount(entry) {
      const layer = entry.layer, page = entry.page, ctx = entry.ctx;
      if (page && page.mount) page.mount(layer, ctx);
      if (LJ.bindLocked && layer.querySelector && layer.querySelector('[data-lk-go]')) {
        LJ.bindLocked(layer, ctx);
      }
    },

    _build(name, params) {
      const page = LJ.pages[name];
      if (!page) {
        const el = document.createElement('div');
        el.className = 'page-layer';
        el.innerHTML = UI.empty('⚠️', '页面还没做', name);
        return { el, page: { title: name }, ctx: { params: params || {} } };
      }
      const ctx = R.ctx(page, params, null);
      const el = document.createElement('div');
      el.className = 'page-layer';
      const chrome = page.chrome || 'plain';
      const body = page.render ? page.render(ctx) : '';
      el.innerHTML = '<div class="page-body ' + (chrome === 'tab' ? 'with-tab' : '') + '">' + body + '</div>';
      ctx.layer = el;
      return { el, page, ctx };
    },

    /* ============================================================
       全屏缩放转场
         展开：卡片 → 铺满整屏（卡片色 → 页面底色）→ 目标页交叉渐显
         收回：整屏 → 缩回卡片（页面底色 → 卡片色）→ 卡片内容浮现
       覆盖层挂在 .screen 内，会被手机圆角裁切，不会飞出机身
       ============================================================ */

    /** 造覆盖层：源卡片的克隆，先钉在它原来的位置 */
    _makeOv(srcEl, screenEl) {
      const from = relRect(srcEl, screenEl);
      const cs = getComputedStyle(srcEl);
      const color = cs.backgroundColor || '#161618';
      /* 圆角不写死：首页黑卡是 22px、账单双卡是 20px，写死会差一条边 */
      const radius = cs.borderTopLeftRadius || '22px';
      const ov = srcEl.cloneNode(true);
      ov.className = srcEl.className + ' zoom-ov';   // 保留原卡片的类，内边距等样式不丢
      ov.style.cssText = rectCss(from) + 'margin:0;background-color:' + color +
        ';border-radius:' + radius + ';';
      screenEl.appendChild(ov);
      srcEl.style.visibility = 'hidden';
      return { ov, from, color };
    },

    /** 播放展开：先把卡片放大铺满，再交叉淡化到目标页
        返回 { wait, hold }：wait = 整段时长，hold = 覆盖层刚好铺满的时刻

        分界点必须落在「覆盖层真的盖住屏幕」之后。缓动是 cubic-bezier(.32,.72,.24,1)，
        它前段极快，所以「时间进度」和「距离进度」差得很远 —— 实测：
            时间 58% → 距离 94.9% → 屏幕右侧还露 19.4px 首页
            时间 80% → 距离 99.2% → 还露 3.1px
            时间 88% → 距离 99.7% → 还露 1px
        原来定在 58%，目标页就开始渐显，边上那 19px 首页会跟着一起看见 —— 就是"重合感"。
        取 80%：露出压到 3px 以内（看不见），又比 88% 早 42ms 开始交叉，不至于拖沓。 */
    _playOpen(ov, color, screenEl, layer) {
      const MS = LJ.ZOOM_MS;
      const HOLD = Math.round(MS * 0.8);
      const FADE = Math.round(MS * 0.5);
      void ov.offsetWidth;                     // 起始尺寸先落地，过渡才会触发
      ov.classList.add('veil');                // 卡片文字淡出
      ov.style.transition =
        'left ' + MS + 'ms ' + EASE + ',top ' + MS + 'ms ' + EASE + ',' +
        'width ' + MS + 'ms ' + EASE + ',height ' + MS + 'ms ' + EASE + ',' +
        'border-radius ' + MS + 'ms ' + EASE + ',' +
        'background-color ' + MS + 'ms ease,' +
        'opacity ' + FADE + 'ms ease ' + HOLD + 'ms';
      ov.style.left = '0px';
      ov.style.top = '0px';
      ov.style.width = screenEl.clientWidth + 'px';
      ov.style.height = screenEl.clientHeight + 'px';
      ov.style.borderRadius = '0px';
      ov.style.backgroundColor = BG;
      ov.style.opacity = '0';
      if (layer) layer.style.animation = 'zoomReveal ' + (FADE + 60) + 'ms ease ' + HOLD + 'ms both';
      return { wait: MS + FADE + 80, hold: HOLD };
    },

    /** 覆盖层铺满屏幕的那一刻切导航栏/标签栏，用户看不见切换 */
    _swapChrome(entry, atMs) {
      setTimeout(() => {
        R.chromeHold = false;                  // 必须先放开闸门，否则这次补发也会被挡掉
        LJ.bus.emit('route', entry || R.current());
      }, atMs);
    },

    /* 播放收回：从整屏缩到卡片位置，颜色反向渐变，卡片内容最后浮现
       beforeMeasure：在「量卡片位置之前」执行的回调，用来先切导航栏/标签栏。
       为什么必须有个这样的钩子 —— 见下面那段注释，这是 50px 偏差的来源。 */
    _playClose(srcEl, screenEl, onDone, beforeMeasure) {
      const MS = LJ.ZOOM_MS;
      const full = { left: 0, top: 0, width: screenEl.clientWidth, height: screenEl.clientHeight };

      /* 覆盖层先铺满整屏，把接下来要发生的一切都盖住 */
      const ov = document.createElement('div');
      ov.className = 'zoom-ov';
      ov.style.cssText = rectCss(full) + 'border-radius:0px;background-color:' + BG + ';';
      screenEl.appendChild(ov);

      /* ★ 量卡片坐标之前，必须先把导航栏/标签栏切成「目标页」的状态。
         .navbar 是 .app 里的 flex:none 项，它在不在会把 .page-host 整体
         往下推 / 往上收整整 50px。账单页是 hideNav:true，支出结构页显示
         导航栏，两边差的就是这一个导航栏的高度。
         以前是「先量、后切」，量到的是导航栏还在时偏下 50px 的坐标，
         覆盖层就落在偏低 50px 的地方；等真卡片露出来，那一下就是
         "卡回去"。此刻覆盖层已经铺满，先切用户完全看不见。 */
      if (beforeMeasure) beforeMeasure();

      const to = relRect(srcEl, screenEl);
      const cs = getComputedStyle(srcEl);
      const toColor = cs.backgroundColor || '#161618';
      const radius = cs.borderTopLeftRadius || '22px';

      /* 卡片内容跟着一起缩回，最后浮现 */
      const inner = srcEl.cloneNode(true);
      inner.className = srcEl.className + ' zoom-ov-inner';
      inner.style.cssText = 'position:absolute;left:0;top:0;margin:0;width:100%;height:100%;' +
        'border-radius:' + radius + ';overflow:hidden;opacity:0;transition:opacity ' +
        Math.round(MS * 0.55) + 'ms ease ' + Math.round(MS * 0.45) + 'ms;';
      ov.appendChild(inner);
      srcEl.style.visibility = 'hidden';

      void ov.offsetWidth;
      ov.style.transition =
        'left ' + MS + 'ms ' + EASE + ',top ' + MS + 'ms ' + EASE + ',' +
        'width ' + MS + 'ms ' + EASE + ',height ' + MS + 'ms ' + EASE + ',' +
        'border-radius ' + MS + 'ms ' + EASE + ',' +
        'background-color ' + MS + 'ms ease';
      ov.style.left = to.left + 'px';
      ov.style.top = to.top + 'px';
      ov.style.width = to.width + 'px';
      ov.style.height = to.height + 'px';
      ov.style.borderRadius = radius;
      ov.style.backgroundColor = toColor;
      inner.style.opacity = '1';

      /* 覆盖层刚好落位时先露出真卡片，再隔一帧撤掉覆盖层 —— 同帧做两件事会闪 */
      setTimeout(() => { srcEl.style.visibility = ''; }, MS);
      setTimeout(() => {
        ov.style.transition = 'none';
        ov.style.willChange = 'auto';
        ov.remove();
        onDone();
      }, MS + 50);
    },

    /* ---- 展开到 tab 页（首页 ↔ 账单）---- */
    zoomTo(name, params, srcEl) {
      if (R.animating) return;
      const screenEl = document.getElementById('screen');
      if (!screenEl || !srcEl) { R.reset(name, params); return; }

      R.chromeHold = true;                     // 先冻住导航栏/标签栏
      const { ov, color } = R._makeOv(srcEl, screenEl);
      R.reset(name, params);                   // 这一次 emit 被挡住，chrome 仍是首页态
      const top = R.current();

      R.animating = true;
      const t = R._playOpen(ov, color, screenEl, top && top.layer);
      R._swapChrome(top, t.hold);              // 覆盖层刚铺满 → 此刻切，看不见

      setTimeout(() => {
        ov.style.transition = 'none';
        ov.style.willChange = 'auto';
        ov.remove();
        srcEl.style.visibility = '';
        if (top && top.layer) top.layer.style.animation = '';
        R.chromeHold = false;
        R.animating = false;
      }, t.wait);
    },

    /* ---- 展开到 push 页（首页 → 成长中心）---- */
    zoomPush(name, params, srcEl) {
      if (R.animating) return;
      const screenEl = document.getElementById('screen');
      if (!screenEl || !srcEl) return R.push(name, params);

      R.chromeHold = true;
      const { ov, color } = R._makeOv(srcEl, screenEl);
      const entry = R._pushSilent(name, params);   // 无声压栈：不滑入、源页不左移

      R.animating = true;
      const t = R._playOpen(ov, color, screenEl, entry.layer);
      R._swapChrome(entry, t.hold);

      setTimeout(() => {
        ov.style.transition = 'none';
        ov.style.willChange = 'auto';
        ov.remove();
        srcEl.style.visibility = '';
        entry.layer.style.animation = '';
        entry.layer.classList.remove('no-anim');
        R.chromeHold = false;
        R.animating = false;
      }, t.wait);

      entry.zoomFrom = { srcEl };              // 返回时原路缩回
      return entry;
    },

    /* ---- 收回：从 push 页缩回它展开来的那张卡 ---- */
    zoomPop() {
      const top = R.current();
      if (!top || !top.zoomFrom || R.animating || R.stack.length <= 1) return R.pop();

      const screenEl = document.getElementById('screen');
      const srcEl = top.zoomFrom.srcEl;
      if (!screenEl || !srcEl || !document.body.contains(srcEl)) return R.pop();

      const prev = R.stack[R.stack.length - 2];
      R.stack.pop();

      /* 目标页必须「瞬间」藏掉，不能走 .page-layer 那 340ms 的 opacity 过渡 ——
         它和首页都是 position:absolute;inset:0 铺满，只要不是立刻消失，
         覆盖层一缩就会露出两层重叠的画面。此刻覆盖层还是全屏，藏它用户看不见。 */
      top.layer.classList.add('no-anim');
      top.layer.style.opacity = '0';

      /* 关键：先把上一层从 behind 状态「同步」拽回原位再量卡片。
         .page-layer 有 transition:transform .34s，只 remove('behind')
         的话归位是渐变的，此时量到的是偏移 24% 的位置，
         覆盖层就会飞到手机外面去。 */
      if (prev) {
        prev.layer.classList.add('no-anim');
        prev.layer.classList.remove('behind');
        void prev.layer.offsetWidth;           // 强制布局，让归位立即生效
      }

      R.animating = true;
      R._playClose(srcEl, screenEl, () => {
        top.layer.remove();
        if (prev) prev.layer.classList.remove('no-anim');
        LJ.bus.emit('route', prev);
        if (prev && prev.page.onShow) prev.page.onShow(prev.layer, prev.ctx);
        R.animating = false;
      }, () => {
        /* 覆盖层此刻刚铺满整屏，导航栏/标签栏在这里切用户看不到。
           绝不能拖到动画结束再切 —— 那一下就是"卡一下"；
           更不能拖到量完卡片之后再切 —— 那会整整偏 50px。 */
        LJ.bus.emit('route', prev);
      });
    },

    /** 压栈但不播滑动动画（供缩放转场用）
        注意：不给上一层加 .behind —— 缩放转场里源页应该留在原地被盖住，
        加 behind 会让它向左滑出 24%，看起来像"页面偏移" */
    _pushSilent(name, params) {
      const { el, page, ctx } = R._build(name, params);
      el.classList.add('no-anim');
      R.host.appendChild(el);

      const entry = { name, params, layer: el, page, ctx };
      R.stack.push(entry);
      R._mount({ layer: el, page: page, ctx: ctx });
      LJ.bus.emit('route', entry);
      el.scrollTop = 0;
      return entry;
    },

    /* ---- tab 切换：滑动转场（和页面 push 同一个观感）----
       dir='left'  新页从右边进、旧页往左让（往右边的 tab 走）
       dir='right' 新页从左边进、旧页往右让（往左边的 tab 走） */
    slideTo(name, params, dir) {
      const toRight = dir === 'right';

      /* 上一次滑动可能还在演。底栏连点不能被吞掉 ——
         所以这里可打断：保留最上面那层当让位层，其余清掉，用代号让旧回调失效。 */
      R.gen = (R.gen || 0) + 1;
      const myGen = R.gen;
      const layers = [].slice.call(R.host.querySelectorAll('.page-layer'));
      const keep = layers.length ? layers[layers.length - 1] : null;
      layers.forEach(l => { if (l !== keep) l.remove(); });
      R.stack = [];
      R.animating = false;
      if (keep) keep.className = 'page-layer';   // 清掉半途的 behind/enter

      const { el, page, ctx } = R._build(name, params);
      el.classList.add(toRight ? 'enter-l' : 'enter');
      R.host.appendChild(el);
      if (keep) keep.classList.add(toRight ? 'behind-r' : 'behind');

      void el.offsetWidth;
      el.classList.remove('enter', 'enter-l');
      R.animating = true;
      setTimeout(() => {
        if (myGen !== R.gen) return;             // 已被后来的滑动取代
        if (keep && keep.parentNode) keep.remove();
        R.animating = false;
      }, 360);

      const entry = { name, params, layer: el, page, ctx };
      R.stack.push(entry);
      R._mount({ layer: el, page: page, ctx: ctx });
      LJ.bus.emit('route', entry);
      el.scrollTop = 0;
      return entry;
    },

    push(name, params, opts) {
      if (R.animating) return;
      if (opts && opts.shared) return R.pushShared(name, params, opts);

      const prev = R.current();
      const { el, page, ctx } = R._build(name, params);
      el.classList.add('enter');
      R.host.appendChild(el);

      if (prev) prev.layer.classList.add('behind');

      void el.offsetWidth;
      el.classList.remove('enter');
      R.animating = true;
      setTimeout(() => { R.animating = false; }, 350);

      const entry = { name, params, layer: el, page, ctx };
      R.stack.push(entry);
      R._mount({ layer: el, page: page, ctx: ctx });
      LJ.bus.emit('route', entry);
      el.scrollTop = 0;
      return entry;
    },

    /* ============================================================
       共享元素转场：卡片自己飞过去，页面淡入淡出
       opts = { shared: 源元素, sharedSel: 目标页里承接的元素选择器 }
       ============================================================ */
    pushShared(name, params, opts) {
      const srcEl = opts.shared;
      const srcRect = srcEl.getBoundingClientRect();
      const prev = R.current();

      const { el, page, ctx } = R._build(name, params);
      el.classList.add('no-anim', 'fade-layer');
      R.host.appendChild(el);

      const entry = { name, params, layer: el, page, ctx };
      R.stack.push(entry);
      R._mount({ layer: el, page: page, ctx: ctx });
      LJ.bus.emit('route', entry);

      const tgtEl = el.querySelector(opts.sharedSel || '.shared-target');
      if (!tgtEl) {                       // 找不到落点就退回普通转场
        el.classList.remove('no-anim', 'fade-layer');
        el.classList.add('enter');
        void el.offsetWidth;
        el.classList.remove('enter');
        return entry;
      }

      /* 用克隆顶上，真实目标先藏起来 */
      tgtEl.style.visibility = 'hidden';
      const tgtRect = tgtEl.getBoundingClientRect();

      const clone = srcEl.cloneNode(true);
      clone.classList.add('shared-fly');
      const MS = LJ.SHARED_MS;
      const ease = 'cubic-bezier(.32,.72,.24,1)';
      const T = 'left ' + MS + 'ms ' + ease + ', top ' + MS + 'ms ' + ease + ',' +
        'width ' + MS + 'ms ' + ease + ', height ' + MS + 'ms ' + ease + ',' +
        'border-radius ' + MS + 'ms ' + ease + ', opacity ' + Math.round(MS * 0.5) + 'ms ease';
      const put = (nRect, animate) => {
        clone.style.transition = animate ? T : 'none';
        clone.style.left = nRect.left + 'px';
        clone.style.top = nRect.top + 'px';
        clone.style.width = nRect.width + 'px';
        clone.style.height = nRect.height + 'px';
      };
      put(srcRect, false);
      document.body.appendChild(clone);
      srcEl.style.visibility = 'hidden';

      R.animating = true;
      /* 强制一次布局，确保"起始位置"已经生效，再改目标值才会触发过渡。
         不用 rAF —— 双重 rAF 在某些环境（含无头浏览器）不会按时回调，
         会导致过渡完全不启动。 */
      void clone.offsetWidth;
      put(tgtRect, true);
      el.classList.add('fade-in');
      if (prev) prev.layer.classList.add('fade-out');

      setTimeout(() => {
        clone.style.opacity = '0';
        tgtEl.style.visibility = '';
      }, MS * 0.62);
      setTimeout(() => {
        clone.remove();
        srcEl.style.visibility = '';
        el.classList.remove('fade-layer', 'fade-in');
        if (prev) { prev.layer.classList.remove('fade-out'); prev.layer.classList.add('behind'); }
        R.animating = false;
      }, MS + 60);

      /* 记下反向所需的信息，返回时可原路飞回 */
      entry.shared = { sel: opts.sharedSel || '.shared-target', srcEl };
      return entry;
    },

    pop() {
      if (R.stack.length <= 1 || R.animating) return;

      /* 这一页是用缩放展开来的 → 原路缩回去 */
      const cur = R.current();
      if (cur && cur.zoomFrom) return R.zoomPop();

      const top = R.stack.pop();
      const prev = R.current();

      /* 反向共享元素：卡片从详情页飞回原处 */
      if (top.shared && prev) {
        const tgtEl = top.layer.querySelector(top.shared.sel);
        const srcEl = prev.layer.querySelector('[data-shared-el]') || top.shared.srcEl;
        if (tgtEl && srcEl && document.body.contains(srcEl)) {
          const from = tgtEl.getBoundingClientRect();
          srcEl.style.visibility = 'hidden';
          prev.layer.classList.remove('behind');
          const to = srcEl.getBoundingClientRect();

          const clone = tgtEl.cloneNode(true);
          clone.classList.add('shared-fly');
          clone.style.transition = 'none';
          clone.style.left = from.left + 'px';
          clone.style.top = from.top + 'px';
          clone.style.width = from.width + 'px';
          clone.style.height = from.height + 'px';
          document.body.appendChild(clone);

          R.animating = true;
          requestAnimationFrame(() => {
            clone.style.transition =
              'left .46s cubic-bezier(.32,.72,.24,1), top .46s cubic-bezier(.32,.72,.24,1),' +
              'width .46s cubic-bezier(.32,.72,.24,1), height .46s cubic-bezier(.32,.72,.24,1),' +
              'border-radius .46s cubic-bezier(.32,.72,.24,1), opacity .4s ease';
            clone.style.left = to.left + 'px';
            clone.style.top = to.top + 'px';
            clone.style.width = to.width + 'px';
            clone.style.height = to.height + 'px';
            top.layer.classList.add('fade-out');
            prev.layer.classList.add('fade-in-layer');
          });

          setTimeout(() => { clone.style.opacity = '0'; srcEl.style.visibility = ''; }, 280);
          setTimeout(() => {
            clone.remove();
            top.layer.remove();
            prev.layer.classList.remove('fade-in-layer');
            LJ.bus.emit('route', prev);
            if (prev.page.onShow) prev.page.onShow(prev.layer, prev.ctx);
            R.animating = false;
          }, 500);
          return;
        }
      }

      if (prev) prev.layer.classList.remove('behind');
      top.layer.classList.add('pop');
      R.animating = true;
      setTimeout(() => {
        top.layer.remove();
        R.animating = false;
        LJ.bus.emit('route', prev);
        if (prev && prev.page.onShow) prev.page.onShow(prev.layer, prev.ctx);
      }, 340);
    },

    /** 替换当前页（不新增栈） */
    replace(name, params) {
      const top = R.stack.pop();
      if (top) top.layer.remove();
      const prev = R.current();
      if (prev) prev.layer.classList.remove('behind');
      const entry = R.push(name, params);
      /* 被替换掉的页面如果是缩放展开来的（带 zoomFrom），换出来的新页得继承，
         否则在「支出结构」里切一下资金来源、或翻一个月，返回时的收回动画就没了 */
      if (entry && top && top.zoomFrom) entry.zoomFrom = top.zoomFrom;
      return entry;
    },

    /** 切换 tab / 回到根部：清空栈 */
    reset(name, params) {
      R.stack.forEach((s, i) => { if (i > 0) s.layer.remove(); });
      const first = R.stack[0];
      // 只有当前根页仍挂在同一个宿主上时，才走"回到顶部"
      if (first && first.name === name && R.host && R.host.contains(first.layer)) {
        // 同一 tab 再点：回到顶部
        first.layer.scrollTo({ top: 0, behavior: 'smooth' });
        if (first.page.onShow) first.page.onShow(first.layer, first.ctx);
        LJ.bus.emit('route', first);
        return;
      }
      R.stack = [];
      if (R.host) R.host.innerHTML = '';
      const { el, page, ctx } = R._build(name, params);
      /* tab 切换不做淡入：瞬切更像原生 App，也避免任何"停在半透明"的风险 */
      R.host.appendChild(el);
      const entry = { name, params, layer: el, page, ctx };
      R.stack.push(entry);
      R._mount({ layer: el, page: page, ctx: ctx });
      LJ.bus.emit('route', entry);
    },

    /** 重渲染当前页（数据变化时） */
    refresh() {
      R.stack.forEach((entry, i) => {
        const isTop = i === R.stack.length - 1;
        if (!entry.page.render || entry.page.keepAlive) return;
        const chrome = entry.page.chrome || 'plain';
        const scroll = entry.layer.scrollTop;
        entry.ctx = R.ctx(entry.page, entry.params, entry.layer);
        entry.layer.innerHTML = '<div class="page-body ' + (chrome === 'tab' ? 'with-tab' : '') + '">' +
          entry.page.render(entry.ctx) + '</div>';
        entry.ctx.layer = entry.layer;
        R._mount(entry);
        if (isTop) entry.layer.scrollTop = scroll;
      });
      LJ.bus.emit('route', R.current());
    },

    /** 只重渲染栈顶（用于局部刷新） */
    refreshTop() {
      const entry = R.current();
      if (!entry || !entry.page.render) return;
      const chrome = entry.page.chrome || 'plain';
      const scroll = entry.layer.scrollTop;
      entry.ctx = R.ctx(entry.page, entry.params, entry.layer);
      entry.layer.innerHTML = '<div class="page-body ' + (chrome === 'tab' ? 'with-tab' : '') + '">' +
        entry.page.render(entry.ctx) + '</div>';
      entry.ctx.layer = entry.layer;
      R._mount(entry);
      entry.layer.scrollTop = scroll;
      LJ.bus.emit('route', entry);
    }
  };

  /* 数据或时间变化 → 自动刷新 */
  LJ.bus.on('*', function (evt) {
    if (!R.host) return;
    /* 时间机器批量写库期间不逐条重渲染（快进一年会写上千行，
       逐行刷新会卡死）。它跑完会补一次 'clock' 事件，那时统一刷。 */
    if (LJ.clock && LJ.clock.silent) return;
    if (evt.indexOf('data:') === 0 || evt === 'clock') {
      if (R.stack.length) R.refresh();
    }
  });
})(window.LJ);
