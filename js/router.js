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

    /* 正在播放的缩放转场。可被打断 —— 见 _settleZoom。
       以前没有这个状态，只靠 R.animating 一个布尔量硬挡：
       挡住的点击是「静默丢弃」，什么都不发生，看起来就是卡死。 */
    _zoom: null,

    /** 让收尾函数幂等：无论被定时器正常调用，还是被下一次转场提前调用，只跑一次。
        缩放转场可被打断，没有这层保护会出现重复 remove / 重复 emit('route')。 */
    _once(fn) {
      let done = false;
      return function () { if (done) return; done = true; return fn.apply(null, arguments); };
    },

    /** 把「正在播的缩放转场」立刻收尾，好让新的转场马上开始。
        ────────────────────────────────────────────────────────
        原来 zoomTo / zoomPush / zoomPop / pop 都是 `if (R.animating) return;`，
        直接吞掉点击。而收回动画要 MS+50 = 570ms 才复位 ——
        手机上「退出后马上再点卡片」正好落在这个窗口里，
        表现就是「推出后立马重新点击没反应」，其实底层什么都没发生。
        开着动画时点返回同样会被吞。

        tab 切换早就用 R.gen 解决过同一个问题（见 slideTo 的注释
        「底栏连点不能被吞掉」），缩放转场这边一直漏着。
        这里换成「先把上一次立刻收尾，再开始这一次」——
        用户点了就该有反应，宁可让上一次的动画提前落位。 */
    _settleZoom() {
      const z = R._zoom;
      R._zoom = null;
      if (z && z.finish) z.finish();
    },

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
    /** 播放展开：卡片放大铺满整屏 → 覆盖层淡出，露出底下的目标页
        返回 { wait, hold }：wait = 整段时长，hold = 覆盖层刚好铺满的时刻

        ★ 几何一律走 transform，不再动画 left/top/width/height。
        覆盖层是全屏的（手机上 DPR 3 ≈ 2.96M 物理像素），而 .zoom-ov 被
        transform:translateZ(0) 提升成了独立合成层 —— 动画 width/height 意味着
        这块合成层的**尺寸每帧都在变**，浏览器每帧都要重新分配纹理并把整个图层
        重绘一遍，手机上直接掉帧。transform 只改合成参数，元素尺寸不变，
        纹理可以复用，是纯合成器动画。

        border-radius / background-color 仍在逐帧变（实心圆角矩形的重绘很便宜）。
        角上的视觉半径 = css 半径 × 缩放比，中途最大约 1.33 倍原半径 ——
        但 css 半径同时在往 0 收，肉眼看不出来。

        分界点必须落在「覆盖层真的盖住屏幕」之后。缓动是 cubic-bezier(.32,.72,.24,1)，
        它前段极快，所以「时间进度」和「距离进度」差得很远 —— 实测：
            时间 58% → 距离 94.9% → 屏幕右侧还露 19.4px 首页
            时间 80% → 距离 99.2% → 还露 3.1px
            时间 88% → 距离 99.7% → 还露 1px
        原来定在 58%，目标页就开始渐显，边上那 19px 首页会跟着一起看见 —— 就是"重合感"。
        取 80%：露出压到 3px 以内（看不见），又比 88% 早 42ms 开始交叉，不至于拖沓。 */
    _playOpen(ov, screenEl, from) {
      const MS = LJ.ZOOM_MS;
      const HOLD = Math.round(MS * 0.8);
      const FADE = Math.round(MS * 0.5);

      const sx = screenEl.clientWidth / from.width;
      const sy = screenEl.clientHeight / from.height;

      /* 起始态：覆盖层钉在卡片原位（transform 恒等），和真卡片像素重合 */
      ov.style.transformOrigin = '0 0';
      ov.style.transform = 'translate(0px,0px) scale(1,1)';

      void ov.offsetWidth;                     // 起始态先落地，过渡才会触发
      ov.classList.add('veil');                // 卡片文字淡出
      ov.style.transition =
        'transform ' + MS + 'ms ' + EASE + ',' +
        'border-radius ' + MS + 'ms ' + EASE + ',' +
        'background-color ' + MS + 'ms ease,' +
        'opacity ' + FADE + 'ms ease ' + HOLD + 'ms';
      ov.style.transform =
        'translate(' + (-from.left) + 'px,' + (-from.top) + 'px) scale(' + sx + ',' + sy + ')';
      ov.style.borderRadius = '0px';
      ov.style.backgroundColor = BG;
      ov.style.opacity = '0';

      /* ★ 目标页不再跑 zoomReveal。
         覆盖层本来就压在目标页上面，它淡出就已经把页面露出来了；
         再给整页图层叠一个 opacity + scale 动画，等于让浏览器把
         「银行卡页那种含 3 张卡面大图的整页」当成一个大层去合成 ——
         纯属多余的开销，而且是手机上卡顿的主因之一。 */
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
       为什么必须有个这样的钩子 —— 见下面那段注释，这是 50px 偏差的来源。
       返回 { finish, ms }：finish 幂等，可被下一次转场提前调用（见 _settleZoom）。 */
    _playClose(srcEl, screenEl, onDone, beforeMeasure) {
      const MS = LJ.ZOOM_MS;
      const full = { left: 0, top: 0, width: screenEl.clientWidth, height: screenEl.clientHeight };

      /* 第一步：先铺一块整屏的实心色，把接下来要发生的一切都盖住。
         此刻还不知道卡片在哪（要等 beforeMeasure 切完导航栏才能量准），
         所以先按整屏摆，量完之后再换成「卡片尺寸 + 反向 transform」——
         两者视觉完全等价，同一帧内完成，不会闪。 */
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

      const sx = full.width / to.width;
      const sy = full.height / to.height;

      /* 第二步：换成「卡片尺寸 + 反向 transform」，视觉仍是整屏实心块。
         和 _playOpen 同理，几何走 transform 不走 width/height。 */
      ov.style.cssText =
        'left:' + to.left + 'px;top:' + to.top + 'px;width:' + to.width + 'px;height:' + to.height + 'px;' +
        'margin:0;background-color:' + toColor + ';border-radius:0px;' +
        'transform-origin:0 0;transform:translate(' + (-to.left) + 'px,' + (-to.top) + 'px) scale(' + sx + ',' + sy + ');';

      /* 卡片内容跟着一起缩回，最后浮现。
         它现在是「被放大到整屏」的，但 opacity 从 0 开始、要到 45% 之后才渐显，
         那时缩放已经接近 1，所以放大带来的模糊看不见。 */
      const inner = srcEl.cloneNode(true);
      inner.className = srcEl.className + ' zoom-ov-inner';
      inner.style.cssText = 'position:absolute;left:0;top:0;margin:0;width:100%;height:100%;' +
        'border-radius:' + radius + ';overflow:hidden;opacity:0;transition:opacity ' +
        Math.round(MS * 0.55) + 'ms ease ' + Math.round(MS * 0.45) + 'ms;';
      ov.appendChild(inner);
      srcEl.style.visibility = 'hidden';

      void ov.offsetWidth;
      ov.style.transition =
        'transform ' + MS + 'ms ' + EASE + ',' +
        'border-radius ' + MS + 'ms ' + EASE + ',' +
        'background-color ' + MS + 'ms ease';
      ov.style.transform = 'translate(0px,0px) scale(1,1)';
      ov.style.borderRadius = radius;
      ov.style.backgroundColor = toColor;
      inner.style.opacity = '1';

      /* 覆盖层刚好落位时先露出真卡片，再隔一帧撤掉覆盖层 —— 同帧做两件事会闪 */
      const t1 = setTimeout(() => { srcEl.style.visibility = ''; }, MS);
      let done = false;
      const t2 = setTimeout(finish, MS + 50);
      function finish() {
        if (done) return;
        done = true;
        clearTimeout(t1);
        clearTimeout(t2);
        srcEl.style.visibility = '';       // 被提前打断时这一帧还没到，必须补上
        ov.style.transition = 'none';
        ov.style.willChange = 'auto';
        ov.remove();
        onDone();
      }
      return { finish, ms: MS };
    },

    /* ---- 展开到 tab 页（首页 ↔ 账单）---- */
    zoomTo(name, params, srcEl) {
      /* 连点保护：同一个目标页正在展开过来，就别再来一次。
         这个活原来由页面自己用 `c.onclick = null` 干，但那是一次性的 ——
         从目标页返回后同一个卡面就永远点不动了（见 tools/probe-burst.js）。
         放在 router 里做才对：只有这里知道「正在往哪儿展开」。 */
      if (R._zoom && R._zoom.kind === 'open' && R._zoom.to === name) return R.current();

      R._settleZoom();                         // 上一次转场立刻收尾，不吞点击
      const screenEl = document.getElementById('screen');
      if (!screenEl || !srcEl) { R.reset(name, params); return; }

      R.chromeHold = true;                     // 先冻住导航栏/标签栏
      const { ov, from } = R._makeOv(srcEl, screenEl);
      R.reset(name, params);                   // 这一次 emit 被挡住，chrome 仍是首页态
      const top = R.current();

      R.animating = true;
      const t = R._playOpen(ov, screenEl, from);
      R._swapChrome(top, t.hold);              // 覆盖层刚铺满 → 此刻切，看不见

      const h = { kind: 'open', to: name, finish: R._once(() => {
        ov.style.transition = 'none';
        ov.style.willChange = 'auto';
        ov.remove();
        srcEl.style.visibility = '';
        R.chromeHold = false;
        R.animating = false;
      }) };
      R._zoom = h;
      setTimeout(() => { if (R._zoom === h) { R._zoom = null; h.finish(); } }, t.wait);
    },

    /* ---- 展开到 push 页（首页 → 成长中心 / 我的 → 银行卡管理）---- */
    zoomPush(name, params, srcEl) {
      if (R._zoom && R._zoom.kind === 'open' && R._zoom.to === name) return R.current();

      R._settleZoom();
      const screenEl = document.getElementById('screen');
      if (!screenEl || !srcEl) return R.push(name, params);

      R.chromeHold = true;
      const { ov, from } = R._makeOv(srcEl, screenEl);
      const entry = R._pushSilent(name, params);   // 无声压栈：不滑入、源页不左移

      R.animating = true;
      const t = R._playOpen(ov, screenEl, from);
      R._swapChrome(entry, t.hold);

      const h = { kind: 'open', to: name, finish: R._once(() => {
        ov.style.transition = 'none';
        ov.style.willChange = 'auto';
        ov.remove();
        srcEl.style.visibility = '';
        entry.layer.classList.remove('no-anim');
        R.chromeHold = false;
        R.animating = false;
      }) };
      R._zoom = h;
      setTimeout(() => { if (R._zoom === h) { R._zoom = null; h.finish(); } }, t.wait);

      entry.zoomFrom = { srcEl };              // 返回时原路缩回
      return entry;
    },

    /* ---- 收回：从 push 页缩回它展开来的那张卡 ---- */
    zoomPop() {
      R._settleZoom();                         // 先把上一次收干净，再重新取栈顶
      const top = R.current();
      if (!top || !top.zoomFrom || R.stack.length <= 1) return R.pop();

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
      const pc = R._playClose(srcEl, screenEl, R._once(() => {
        top.layer.remove();
        if (prev) prev.layer.classList.remove('no-anim');
        LJ.bus.emit('route', prev);
        if (prev && prev.page.onShow) prev.page.onShow(prev.layer, prev.ctx);
        R.animating = false;
      }), () => {
        /* 覆盖层此刻刚铺满整屏，导航栏/标签栏在这里切用户看不到。
           绝不能拖到动画结束再切 —— 那一下就是"卡一下"；
           更不能拖到量完卡片之后再切 —— 那会整整偏 50px。 */
        LJ.bus.emit('route', prev);
      });

      const h = { kind: 'close', finish: pc.finish };
      R._zoom = h;
      setTimeout(() => { if (R._zoom === h) { R._zoom = null; h.finish(); } }, pc.ms + 50);
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
      /* 连点保护 + 可打断：正在展开同一页就别再来一次；别的转场先收尾 */
      if (R._zoom && R._zoom.kind === 'open' && R._zoom.to === name) return R.current();
      if (R._zoom) R._settleZoom();
      else if (R.animating) return;
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
       共享元素转场：卡面自己飞过去，背景做连续平滑缩放
       opts = { shared: 源元素, sharedSel: 目标页里承接的元素选择器 }

       两个东西同时做「连续平滑缩放」，从同一点出发、同一段缓动：
         · Card 容器（clone）：源卡位置 → 目标页卡位置（transform 缩放+位移）
         · 背景（veil）：卡片底色一块，卡片大小 → 铺满整屏（transform 缩放）
       视觉上就是「顺着卡片放大进去」—— 背景和卡片各按自己的比例连续缩放，
       落位后 veil / clone 淡出，露出目标页的真卡。

       几何一律走 transform，理由同坑 18：动画 left/top/width/height
       会让合成层每帧重分配纹理并重绘；transform 只改合成参数，纹理只出一次。

       可被下次转场打断（坑 21 的教训），收尾幂等，注册进 R._zoom。
       ============================================================ */
    pushShared(name, params, opts) {
      /* 连点保护：同一个目标页正在展开过去，就别再来一次 */
      if (R._zoom && R._zoom.kind === 'open' && R._zoom.to === name) return R.current();
      R._settleZoom();

      const screenEl = document.getElementById('screen');
      const srcEl = opts.shared;
      if (!screenEl || !srcEl) return R.push(name, params);

      const srcRect = relRect(srcEl, screenEl);
      const cs = getComputedStyle(srcEl);
      const radius = cs.borderTopLeftRadius || '20px';

      const prev = R.current();
      const { el, page, ctx } = R._build(name, params);
      el.classList.add('no-anim', 'fade-layer');   // fade-layer：目标页先全透明，等淡入
      R.host.appendChild(el);

      const entry = { name, params, layer: el, page, ctx };
      R.stack.push(entry);
      R._mount({ layer: el, page: page, ctx: ctx });
      /* 导航栏标题先冻住：源页还在屏上，标题立刻切过去会"跳"；
         等源页淡掉（55%）再放闸并补发一次 */
      R.chromeHold = true;
      LJ.bus.emit('route', entry);
      R._swapChrome(entry, Math.round(LJ.SHARED_MS * 0.55));
      el.scrollTop = 0;

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
      const tgtRect = relRect(tgtEl, screenEl);

      const MS = LJ.SHARED_MS;

      /* ★ 背景：不再用「一块不透明色块盖住整屏」。
         那是擦除不是缩放 —— 色块把背景整个盖住，用户根本看不到背景在缩放，
         看到的是"一块颜色铺开再消失"，这就是别扭的来源。
         改成真实的背景缩放，两个页面同向放大：
           源页 1 → 1.06 放大并淡出（世界被推近）
           目标页 0.985 → 1 落定（新世界长好）
         中间两者对齐，读起来是连贯的一次推进，而不是"淡出淡入"。 */
      el.style.transform = 'scale(.985)';
      el.style.opacity = '0';

      /* 卡面：源卡克隆，从列表位置连续放大到详情页卡位。
           position:absolute 必须内联 —— 克隆保留源卡的类（cm-card），
           而目标卡类（cd-detail-card）是 position:relative，和 .sh-fly
           的 absolute 同特异性、靠后定义会赢，克隆会塌进正常流里偏掉一大截。 */
      const clone = srcEl.cloneNode(true);
      clone.className = srcEl.className + ' sh-fly';
      clone.style.cssText = rectCss(srcRect) + 'right:auto;bottom:auto;' +
        'position:absolute;pointer-events:none;border-radius:' + radius + ';transform-origin:0 0;';
      screenEl.appendChild(clone);

      srcEl.style.visibility = 'hidden';

      /* 强制一次布局：起始态落地了，再改目标值才会触发过渡 */
      void clone.offsetWidth;

      /* 两页交叉淡入淡出 + 背景缩放：都在**前 55%** 内完成。
         为什么必须压缩在前段 —— 克隆在第 60% 处就要把真卡交接出来，
         那时目标页必须已经落定到 scale(1)，否则真卡还在缩放、
         和已经停在终态的克隆错开，交接那一下会"抖"。
         源页先放大淡出、目标页从略小处落定，两者同窗口重叠。 */
      const PGS = Math.round(MS * 0.55);
      el.style.transition = 'transform ' + PGS + 'ms ' + EASE + ',' +
        'opacity ' + PGS + 'ms ease';
      el.style.transform = 'none';
      el.style.opacity = '1';
      if (prev) {
        prev.layer.style.transition = 'transform ' + PGS + 'ms ' + EASE + ',' +
          'opacity ' + PGS + 'ms ease';
        prev.layer.style.transform = 'scale(1.06)';
        prev.layer.style.opacity = '0';
      }

      clone.style.transition = 'transform ' + MS + 'ms ' + EASE + ',' +
        'border-radius ' + MS + 'ms ' + EASE + ',' +
        'opacity ' + Math.round(MS * 0.4) + 'ms ease ' + Math.round(MS * 0.6) + 'ms';
      clone.style.transform =
        'translate(' + (tgtRect.left - srcRect.left) + 'px,' +
        (tgtRect.top - srcRect.top) + 'px) scale(' +
        (tgtRect.width / srcRect.width) + ',' + (tgtRect.height / srcRect.height) + ')';
      /* 让视觉圆角≈目标卡圆角：css 圆角会被缩放放大，得按倍数往回折 */
      clone.style.borderRadius = (radius / Math.max(tgtRect.width / srcRect.width,
        tgtRect.height / srcRect.height)) + 'px';
      clone.style.opacity = '0';                   // 落位后淡出，露出真卡（两者像素重合）

      /* ★ 真卡必须在克隆淡完之前就交出来。
         原来是等收尾（MS+60）才 visibility 恢复，而克隆 MS 就淡到 0 了 ——
         中间 60ms 那个位置是一片页面底色，卡片凭空消失一下再出现。 */
      const reveal = setTimeout(() => { tgtEl.style.visibility = ''; }, Math.round(MS * 0.62));

      R.animating = true;
      const h = {
        kind: 'open', to: name,
        finish: R._once(() => {
          clearTimeout(reveal);
          clone.remove();
          tgtEl.style.visibility = '';
          srcEl.style.visibility = '';
          el.classList.remove('no-anim', 'fade-layer', 'fade-in');
          el.style.transition = '';
          el.style.transform = '';
          el.style.opacity = '';
          if (prev) {
            prev.layer.style.transition = '';
            prev.layer.style.transform = '';
            prev.layer.style.opacity = '';
            prev.layer.classList.add('behind');
          }
          R.chromeHold = false;      // 被打断时也要放开
          R.animating = false;
        })
      };
      R._zoom = h;
      setTimeout(() => { if (R._zoom === h) { R._zoom = null; h.finish(); } }, MS + 60);

      /* 记下反向所需的信息，返回时可原路飞回 */
      entry.shared = { sel: opts.sharedSel || '.shared-target', srcEl };
      return entry;
    },

    /* ---- 反向共享元素：卡面从详情页飞回列表位置，背景反向缩放 ---- */
    popShared() {
      R._settleZoom();

      const top = R.current();
      const prev = R.stack[R.stack.length - 2];
      if (!top || !top.shared || !prev) return R.pop();

      const screenEl = document.getElementById('screen');
      const srcEl = top.shared.srcEl;
      const tgtEl = top.layer.querySelector(top.shared.sel);
      if (!screenEl || !srcEl || !tgtEl || !document.body.contains(srcEl)) {
        R.stack.pop();
        top.layer.remove();
        R.animating = false;
        LJ.bus.emit('route', prev);
        return;
      }

      R.stack.pop();

      /* 起点：详情页里的卡（还在 DOM 里，量它）；终点：列表页的卡 */
      const from = relRect(tgtEl, screenEl);

      /* 先把列表页从 behind 状态「同步」拽回原位再量 —— 归位是渐变的会量偏 */
      prev.layer.classList.add('no-anim');
      prev.layer.classList.remove('behind');
      void prev.layer.offsetWidth;

      srcEl.style.visibility = 'hidden';
      const to = relRect(srcEl, screenEl);
      const cs = getComputedStyle(tgtEl);
      const radius = cs.borderTopLeftRadius || '20px';

      const MS = LJ.SHARED_MS;

      /* 背景缩放：前向的镜像 —— 详情页略微收小淡出，列表页从放大处落定。
         同样不放任何遮挡色块。 */
      const outgoing = top.layer;
      outgoing.style.transform = 'scale(1)';

      /* 卡面：详情卡的克隆，缩回列表卡位置。
           position:absolute 必须内联 —— 克隆保留 cd-detail-card 类，
           那是 position:relative，和 .sh-fly 的 absolute 同特异性、
           靠后定义会赢，克隆会塌进屏幕正常流里偏掉（探针实测偏 595px）。 */
      const clone = tgtEl.cloneNode(true);
      clone.className = tgtEl.className + ' sh-fly';
      clone.style.cssText = rectCss(from) + 'right:auto;bottom:auto;' +
        'position:absolute;pointer-events:none;border-radius:' + radius + ';transform-origin:0 0;';
      screenEl.appendChild(clone);

      void clone.offsetWidth;

      /* 列表页：从放大处落定；同样压在前 55% 内完成 —— 克隆要在 60% 处
         交出真卡，那时列表页必须已经落定，否则真卡还在缩放会和克隆错开 */
      const PGS = Math.round(MS * 0.55);
      prev.layer.style.transform = 'scale(1.06)';
      prev.layer.style.opacity = '0';
      void prev.layer.offsetWidth;
      prev.layer.style.transition = 'transform ' + PGS + 'ms ' + EASE + ',' +
        'opacity ' + PGS + 'ms ease';
      prev.layer.style.transform = 'none';
      prev.layer.style.opacity = '1';

      outgoing.style.transition = 'transform ' + PGS + 'ms ' + EASE + ',' +
        'opacity ' + PGS + 'ms ease';
      outgoing.style.transform = 'scale(.985)';
      outgoing.style.opacity = '0';

      /* 真卡（列表卡）也要在克隆淡完前交出来，否则中间会空一下 */
      const reveal = setTimeout(() => { srcEl.style.visibility = ''; }, Math.round(MS * 0.62));

      clone.style.transition = 'transform ' + MS + 'ms ' + EASE + ',' +
        'border-radius ' + MS + 'ms ' + EASE + ',' +
        'opacity ' + Math.round(MS * 0.4) + 'ms ease ' + Math.round(MS * 0.6) + 'ms';
      clone.style.transform =
        'translate(' + (to.left - from.left) + 'px,' + (to.top - from.top) + 'px) scale(' +
        (to.width / from.width) + ',' + (to.height / from.height) + ')';
      clone.style.borderRadius = (radius / Math.max(to.width / from.width,
        to.height / from.height)) + 'px';
      clone.style.opacity = '0';

      top.layer.classList.add('fade-out');
      prev.layer.classList.add('fade-in-layer');

      /* 导航栏标题等列表页淡进来（55%）再切，和展开时对称 */
      R.chromeHold = true;
      R._swapChrome(prev, Math.round(MS * 0.55));

      R.animating = true;
      const h = {
        kind: 'close',
        finish: R._once(() => {
          clearTimeout(reveal);
          clone.remove();
          srcEl.style.visibility = '';
          top.layer.remove();
          prev.layer.classList.remove('no-anim', 'fade-in-layer', 'fade-out');
          prev.layer.style.transition = '';
          prev.layer.style.transform = '';
          prev.layer.style.opacity = '';
          R.chromeHold = false;      // 被打断时也要放开
          LJ.bus.emit('route', prev);
          if (prev && prev.page.onShow) prev.page.onShow(prev.layer, prev.ctx);
          R.animating = false;
        })
      };
      R._zoom = h;
      setTimeout(() => { if (R._zoom === h) { R._zoom = null; h.finish(); } }, MS + 60);
    },

    pop() {
      if (R.stack.length <= 1) return;

      /* 缩放转场还在演：当场把它收尾，别把这次返回吞掉 ——
         打开动画播放期间点返回，原来会被下面那句 R.animating 挡掉，
         什么都不发生。 */
      if (R._zoom) {
        const kind = R._zoom.kind;
        R._settleZoom();
        /* 但若上一次本身就是「收回」，收尾就等于已经返回过了 ——
           这次点击只是催它落位，不能再往下弹一层，否则一次点击退两级。 */
        if (kind === 'close') return;
      } else if (R.animating) {
        return;                     // 滑动 / 共享元素转场仍然互斥
      }

      /* 这一页是用缩放展开来的 → 原路缩回去；用共享卡片飞进来的 → 飞回去 */
      const cur = R.current();
      if (cur && cur.zoomFrom) return R.zoomPop();
      if (cur && cur.shared) return R.popShared();

      const top = R.stack.pop();
      const prev = R.current();

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
