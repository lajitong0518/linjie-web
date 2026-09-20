/* ============================================================
   app.js —— 外壳、登录、状态栏、TabBar、开发面板
   ============================================================ */
(function (LJ) {
  'use strict';
  const U = LJ.util, UI = LJ.ui;

  /* ---------------- 导航配置 ---------------- */
  /* 4 个 tab + 1 个悬浮 FAB，对应参考图的「胶囊导航 + 黑色圆形按钮」 */
  LJ.TABS = {
    youth: [
      { id: 'home', name: '首页', icon: 'home', page: 'youth.home' },
      { id: 'ledger', name: '账单', icon: 'list', page: 'youth.ledger' },
      { id: 'ai', name: '问问', icon: 'sparkle', page: 'youth.ai' },
      { id: 'talk', name: '往来', icon: 'chat', page: 'youth.talk' },
      { id: 'me', name: '我的', icon: 'user', page: 'youth.me' }
    ],
    supporter: [
      { id: 'status', name: '状态', icon: 'status', page: 'supporter.status' },
      { id: 'support', name: '支持', icon: 'plus', page: 'supporter.support' },
      { id: 'company', name: '陪伴', icon: 'heart', page: 'supporter.company' },
      { id: 'me', name: '我的', icon: 'user', page: 'supporter.me' }
    ]
  };
  /* 悬浮按钮：青年端=记一笔，支持人端=登记支持 */
  LJ.FAB = {
    youth: { icon: 'plus', label: '记一笔' },
    supporter: { icon: 'plus', label: '登记支持' }
  };
  LJ.ROOT = { youth: 'youth.home', supporter: 'supporter.status' };
  LJ.ROLE_LABEL = { youth: '青年端', supporter: '支持人端' };

  const App = LJ.app = {
    screen: null, host: null, navbar: null, tabbar: null, devbar: null,

    /* ============================================================
       启动
       ============================================================ */
    booted: false,

    boot() {
      if (App.booted) return;
      App.booted = true;
      /* 没有数据、或浏览器里是旧版本的种子数据 → 装一份新的 */
      if (LJ.seed.needsUpgrade()) LJ.seed.install(U.ymd(new Date()));

      document.getElementById('app-host').innerHTML =
        '<div class="device">' +
        '<div class="label" id="deviceLabel">临界</div>' +
        '<div class="frame">' +
        '<div class="notch"></div>' +
        '<div class="screen" id="screen">' +
        '<div class="statusbar" id="statusbar">' +
        '<span class="mono" id="sbTime">9:41</span>' +
        '<span class="icons">▮▮▮ ⌾ ▰</span>' +
        '</div>' +
        '<div class="app" id="app-root"></div>' +
        '</div></div></div>';

      this.screen = document.getElementById('screen');
      this.devbar = document.getElementById('devbar');

      // 数据/时间变化时同步周边
      LJ.bus.on('clock', () => { App.renderDevbar(); });
      LJ.bus.on('session', () => { App.renderDevbar(); });
      LJ.bus.on('*', (evt) => { if (evt.indexOf('data:') === 0) App.renderDevbar(); });

      this.tickClock();
      setInterval(() => App.tickClock(), 20000);

      /* 深链参数（用于测试与截图）：
         ?u=youth|supporter|<userId>   直接以某个身份进入
         ?p=youth.plan                 进入后定位到指定页面 */
      let q = null;
      try { q = new URLSearchParams(location.search); } catch (e) { q = null; }
      if (q && q.get('subs')) LJ.homeSubsOpen = q.get('subs') === '1';
      if (q && q.get('ask')) LJ._aiPendingAsk = q.get('ask');
      if (q && q.get('slow')) { LJ.SHARED_MS = 480 * 8; LJ.ZOOM_MS = 520 * 8; }
      /* ?shared=1 / ?zoom=1 / ?zoom2=1 ：进首页后自动点卡片，便于截转场中间帧 */
      if (q && (q.get('shared') || q.get('zoom') || q.get('zoom2'))) {
        setTimeout(() => {
          const sel = q.get('zoom2') ? '[data-zoom-push]' : '[data-zoom-src]';
          const c = document.querySelector(sel) || document.querySelector('[data-zoom-src]');
          if (c) c.click();
        }, 60);
      }
      /* ?zoom2back=1 ：展开成长中心后再点返回，验证收回落点 */
      if (q && q.get('zoom2back')) {
        setTimeout(() => {
          const c = document.querySelector('[data-zoom-push]');
          if (c) c.click();
        }, 60);
        setTimeout(() => {
          const b = document.getElementById('navBack');
          if (b) b.click();
        }, 1400);
      }
      /* ?tab=ai,home ：依次点若干底栏 tab（间隔 250ms），便于验证滑动方向 */
      if (q && q.get('tab')) {
        q.get('tab').split(',').forEach((id, i) => {
          setTimeout(() => {
            const b = document.querySelector('[data-tab="' + id.trim() + '"]');
            if (b) b.click();
          }, 200 + i * 250);
        });
      }
      /* ?act=logout    ：点一下「退出登录」，停在确认弹层（截图用）
         ?act=logout-go ：连确认一起点下去，验证整条出口通到身份选择页
         退出这条路径以前只存在于开发面板里，产品内没有 —— 加个钩子把它钉住，
         不然「按钮在但点不动」这种问题只能靠人肉点一遍才发现。 */
      if (q && /^logout(-go)?$/.test(q.get('act') || '')) {
        const go = q.get('act') === 'logout-go';
        setTimeout(() => {
          const b = document.querySelector('[data-act="logout"]');
          if (!b) return;
          b.click();
          if (!go) return;
          setTimeout(() => {
            const okBtn = document.querySelector('#sheet-root [data-ok]') ||
              document.querySelector('[data-ok]');
            if (okBtn) okBtn.click();
          }, 500);
        }, 900);
      }
      /* ?sheet=1 ：开一个待办确认弹层，便于截图验证弹层是否在手机框内 */
      if (q && q.get('sheet')) {
        setTimeout(() => {
          const t = document.querySelector('[data-todo="confirm"]') ||
            document.querySelector('[data-todo]');
          if (t) { t.click(); return; }
          LJ.ui.sheet({
            title: '确认收到这笔支持？', sub: '生活费 · ¥2,400.00',
            body: '<div class="proto"><div class="ph"><span class="seal">账</span>确认后会发生什么</div>' +
              '<div class="sm t2" style="line-height:1.8">· 这笔钱计入你的账本，归入「家庭支持金」<br>' +
              '· 双方各留存一笔对账记录，随时可查<br>· 掌控指数与成长任务会同步更新</div></div>' +
              '<button class="btn mt20">确认收到</button>'
          });
        }, 200);
      }
      /* ?zoom3=1 ：进「我的」后自动点银行卡堆叠，验证卡面 → 银行卡管理的缩放 */
      if (q && q.get('zoom3')) {
        setTimeout(() => {
          const c = document.querySelector('.cd-card');
          if (c) c.click();
        }, 400);
      }
      /* ?settle=1 ：把正在演的缩放转场钉到终态。
         无头浏览器不推进 CSS 过渡与动画，不钉的话目标页会停在 opacity:0，
         截出来一片空白 —— 只影响带这个参数的调试链接。 */
      if (q && q.get('settle')) {
        setTimeout(() => {
          document.querySelectorAll('.zoom-ov').forEach(o => o.remove());
          const layers = [].slice.call(document.querySelectorAll('.page-layer'));
          layers.forEach(l => {
            l.style.animation = 'none';
            l.style.transition = 'none';
            l.style.opacity = '';
            l.classList.remove('no-anim');
          });
        }, 1400);
      }
      /* ?scroll=800 ：把当前页滚到指定位置，用来截长页面的下半部分 */
      if (q && q.get('scroll')) {
        const px = Number(q.get('scroll')) || 0;
        setTimeout(() => {
          const l = document.querySelector('.page-layer');
          if (l) { l.style.scrollBehavior = 'auto'; l.scrollTop = px; }
        }, 600);
      }
      /* ?entry=study ：打开记一笔弹层并选中某个大类，用来截专项 chip 之类的状态 */
      if (q && q.get('entry')) {
        const cat = q.get('entry');
        setTimeout(() => {
          if (LJ.openEntrySheet) LJ.openEntrySheet();
          setTimeout(() => {
            const b = document.querySelector('.es-cat[data-cat="' + cat + '"]') ||
              document.querySelector('.es-cat[data-icat="' + cat + '"]');
            if (b) b.click();
          }, 150);
        }, 400);
        /* 无头浏览器不推进 CSS 过渡，弹层会停在屏幕外的起始位置。
           这里钉到终态 —— 只影响带 ?entry= 的调试链接。 */
        setTimeout(() => {
          const m = document.querySelector('.sheet-mask');
          const s = document.querySelector('.sheet');
          if (m) { m.style.transition = 'none'; m.classList.add('on'); }
          if (s) { s.style.transition = 'none'; s.classList.add('on'); }
        }, 800);
      }
      /* ?toast=1 ：验证吐司也在手机框内 */
      if (q && q.get('toast')) setTimeout(() => LJ.ui.toast('已记下这一笔', 60000), 200);
      /* ?drawer=1|2 ：进问问后开历史对话抽屉（2 = 再点开第一段旧对话），便于截图验证 */
      if (q && q.get('drawer')) {
        const lvl = q.get('drawer');
        setTimeout(() => {
          const b = document.querySelector('[data-history]');
          if (b) b.click();
        }, 500);
        /* 无头浏览器不推进 CSS 过渡，抽屉会停在 translateX(-102%) 的起始位置，
           截出来是一片空白。这里把它钉到终态 —— 只影响带 ?drawer= 的调试链接。 */
        setTimeout(() => {
          const p = document.querySelector('.drawer');
          const m = document.querySelector('.drawer-mask');
          if (p) { p.style.transition = 'none'; p.classList.add('on'); }
          if (m) { m.style.transition = 'none'; m.classList.add('on'); }
        }, 700);
        if (lvl === '2') {
          setTimeout(() => {
            const r = document.querySelector('.drawer-body [data-chat]');
            if (r) r.click();
          }, 1000);
        }
      }
      /* ?zoomtest=1 ：把覆盖层在过程中的尺寸与颜色采样写进 DOM，便于 --dump-dom 读取 */
      if (q && q.get('zoomtest')) {
        const log = [];
        let n = 0;
        const iv = setInterval(() => {
          n++;
          const ov = document.querySelector('.zoom-ov');
          if (ov) {
            const r = ov.getBoundingClientRect();
            const cs = getComputedStyle(ov);
            const tb = document.querySelector('.tabbar');
            const scr0 = document.getElementById('screen').getBoundingClientRect();
            /* push 时栈里有两层，取最上面那层（最后渲染的） */
            const lays = document.querySelectorAll('.page-layer');
            const lay = lays[lays.length - 1];
            const la = lay ? getComputedStyle(lay).animation : null;
            const l0 = lays[0] ? getComputedStyle(lays[0]) : null;
            const lN = lay ? getComputedStyle(lay) : null;
            const fmt = cs2 => cs2 ? ('op' + Number(cs2.opacity).toFixed(2) +
              ' tf:' + (cs2.transform === 'none' ? 'none' : cs2.transform.slice(0, 26))) : '?';
            /* 源卡片当前位置（相对手机屏），用来核对覆盖层要去哪儿 */
            const card = document.querySelector('[data-zoom-push]');
            let cardPos = '无';
            if (card) {
              const cr = card.getBoundingClientRect();
              cardPos = Math.round(cr.left - scr0.left) + ',' + Math.round(cr.top - scr0.top) +
                ' ' + Math.round(cr.width) + 'x' + Math.round(cr.height);
            }
            log.push(Math.round(performance.now()) + 'ms ' +
              '层数=' + lays.length +
              ' 首页[' + fmt(l0) + ']' +
              ' 目标页[' + fmt(lN) + ']' +
              /* 渲染后的真实位置 vs 源卡片位置 —— 带 margin 的克隆体会在这里露馅 */
              ' 覆盖层实际[' + Math.round(r.left - scr0.left) + ',' + Math.round(r.top - scr0.top) +
              ' ' + Math.round(r.width) + 'x' + Math.round(r.height) + ']' +
              ' 卡片[' + cardPos + ']' +
              ' 底栏隐藏=' + (tb ? tb.classList.contains('hidden') : '?'));
          } else if (log.length && !q.get('zoom2back')) {
            clearInterval(iv);
            const d = document.createElement('div');
            d.id = 'zoomtest';
            d.textContent = log.join(' || ');
            document.body.appendChild(d);
          }
          /* 两次转场之间有空档，固定采样到时再落盘 */
          if (n >= 45) {
            clearInterval(iv);
            const d = document.createElement('div');
            d.id = 'zoomtest';
            d.textContent = log.join(' || ') || '（全程没有覆盖层）';
            document.body.appendChild(d);
          }
        }, 100);
      }
      if (q && q.get('u')) {
        const want = q.get('u');
        const u = LJ.store.all('user').find(x => x.id === want || x.role === want);
        if (u) LJ.session.set(u.id, u.role);
      }

      const s = LJ.session.get();
      if (s.userId) {
        this.enter(s.role);
        const pg = q && q.get('p');
        if (pg) {
          /* 除 u / p 之外的查询参数都当作页面参数传下去，例如 &view=cycle */
          const params = {};
          q.forEach((v, k) => { if (k !== 'u' && k !== 'p') params[k] = v; });
          setTimeout(() => LJ.router.reset(pg, params), 80);
        }
      } else {
        this.renderLogin();
      }
    },

    tickClock() {
      const el = document.getElementById('sbTime');
      if (!el) return;
      const d = new Date();
      el.textContent = d.getHours() + ':' + U.pad(d.getMinutes());
    },

    /* ============================================================
       登录 / 身份选择
       ============================================================ */
    renderLogin() {
      const root = document.getElementById('app-root');
      const users = LJ.store.all('user');
      this.navbar = null; this.tabbar = null; this.host = null;

      root.innerHTML =
        '<div style="flex:1;display:flex;flex-direction:column;background:var(--bg);color:var(--text);padding:0 24px;overflow-y:auto">' +
        '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;padding:34px 0 26px;min-height:0">' +
        '<div style="font-size:11px;letter-spacing:.34em;color:var(--muted);font-weight:700">LIN JIE</div>' +
        '<div class="hero" style="font-size:40px;margin-top:16px">临界</div>' +
        '<div class="block lav" style="margin-top:22px;padding:16px">' +
        '<div class="glow"></div>' +
        '<div style="font-size:14px;font-weight:700;line-height:1.75;position:relative;z-index:2">' +
        '家庭支持协同账户<br>让"家里给钱"这件事<br>变成一份双方都同意的透明协议</div></div>' +
        '</div>' +
        '<div style="padding-bottom:30px">' +
        '<div class="sec-title" style="margin-top:0">选择身份进入</div>' +
        users.map(u =>
          '<button data-login="' + u.id + '" style="width:100%;display:flex;align-items:center;gap:14px;' +
          'background:var(--card);border:none;border-radius:22px;padding:15px 18px;margin-bottom:11px;' +
          'color:var(--text);text-align:left;box-shadow:var(--shadow-1)">' +
          '<span style="width:46px;height:46px;border-radius:50%;background:var(--ink);color:#fff;' +
          'display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;flex:none">' +
          UI.esc(u.avatar) + '</span>' +
          '<span style="flex:1;min-width:0"><span style="display:block;font-size:16px;font-weight:800">' + UI.esc(u.name) + '</span>' +
          '<span style="display:block;font-size:12px;color:var(--muted);margin-top:3px;font-weight:500">' +
          LJ.ROLE_LABEL[u.role] + ' · ' + UI.esc(u.nickname) + '</span></span>' +
          '<span style="color:var(--muted);font-size:18px">›</span></button>').join('') +
        '<div class="xs muted" style="margin-top:14px;line-height:1.7;text-align:center">' +
        '数据仅保存在本机浏览器，不会上传服务器</div>' +
        '</div></div>';

      root.querySelectorAll('[data-login]').forEach(b => {
        b.onclick = () => {
          const id = b.getAttribute('data-login');
          const u = LJ.store.find('user', id);
          LJ.session.set(id, u.role);
          App.enter(u.role);
        };
      });
      this.renderDevbar();
    },

    /* ============================================================
       进入主界面
       ============================================================ */
    enter(role) {
      const root = document.getElementById('app-root');
      const tabs = LJ.TABS[role];
      const fab = LJ.FAB[role];

      root.innerHTML =
        '<header class="navbar" id="navbar">' +
        '<button class="nav-back" id="navBack" style="visibility:hidden">' + UI.icon('back', 20) + '</button>' +
        '<div class="nav-title" id="navTitle"></div>' +
        '<div class="nav-right" id="navRight"></div>' +
        '</header>' +
        '<div class="page-host" id="page-host"></div>' +
        '<button class="fab" id="fab" title="' + fab.label + '">' + UI.icon(fab.icon, 26) + '</button>' +
        '<nav class="tabbar" id="tabbar">' +
        tabs.map(t => '<button data-tab="' + t.id + '">' + UI.icon(t.icon, 21, 'ti') +
          '<span>' + t.name + '</span></button>').join('') +
        '</nav>';

      this.navbar = document.getElementById('navbar');
      this.host = document.getElementById('page-host');
      this.tabbar = document.getElementById('tabbar');
      this.fab = document.getElementById('fab');

      LJ.router.init(this.host);

      document.getElementById('navBack').onclick = () => {
        /* 深链直接落到子页面时，栈里只有一层，pop() 是空操作。
           这种情况退回该角色的根页，否则用户会被困在子页面上出不来。 */
        if (LJ.router.stack.length <= 1) {
          return LJ.router.reset(LJ.ROOT[LJ.session.get().role]);
        }
        LJ.router.pop();
      };

      this.tabbar.querySelectorAll('[data-tab]').forEach(b => {
        b.onclick = () => {
          const t = tabs.find(x => x.id === b.getAttribute('data-tab'));
          if (!t) return;
          const cur = LJ.router.current();
          const curName = cur ? cur.name : '';

          /* 再点当前 tab：回到顶部，不转场 */
          if (curName === t.page) return LJ.router.reset(t.page);

          /* 按 tab 的左右顺序决定滑动方向，跟翻页一个直觉 */
          const curIdx = tabs.findIndex(x => x.page === curName);
          const nextIdx = tabs.findIndex(x => x.id === t.id);
          const dir = curIdx >= 0 && nextIdx < curIdx ? 'right' : 'left';
          LJ.router.slideTo(t.page, {}, dir);
        };
      });

      /* 悬浮按钮：青年端进记账页，支持人端进支持页 */
      this.fab.onclick = () => {
        /* 记一笔走弹层（和待办弹层同款动效），不再整页跳转 */
        if (role === 'youth') { LJ.openEntrySheet(); return; }
        const cur = LJ.router.current();
        if (cur && cur.name === 'supporter.support') {
          const b = App.host && App.host.querySelector('[data-act="register"]');
          if (b) b.click();
        } else {
          LJ.router.reset('supporter.support');
        }
      };

      if (!App.routeHooked) {
        App.routeHooked = true;
        LJ.bus.on('route', entry => App.syncChrome(entry));
      }

      LJ.router.reset(LJ.ROOT[role]);
      this.renderDevbar();

      /* 风险事件是从青年端账本里扫出来的，和"当前在看哪一端"无关 ——
         这是系统级的巡检，不是某一端的操作。支持人端也要能看到
         "该发的通知到底发了没有"，所以两端进来都扫一遍。
         真做成后端的话，这一步是服务端定时任务。
         sync 幂等，没有新事件就不写库。 */
      /* 每个孩子都巡检一遍（多子女下不能只看第一个） */
      LJ.store.all('binding').forEach(function (b) {
        if (!b.youthId) return;
        try {
          const y = LJ.api.youth(b.youthId);
          y.risk.sync();
          /* 假期过完了就生成复盘、递减跑完了就收尾（都是幂等的） */
          y.plan.syncReview();
        } catch (e) { /* 不影响进入 */ }
      });
    },

    syncChrome(entry) {
    /* 缩放转场期间先冻住：覆盖层还没铺满时切导航栏/标签栏会"啪"地跳一下。
       转场里会在覆盖层铺满的那一刻放开并补一次 emit。 */
    if (LJ.router.chromeHold) return;
    if (!entry) entry = LJ.router.current();
      if (!entry || !this.navbar) return;
      const page = entry.page || {};
      const chrome = page.chrome || 'plain';

      /* 弹层与吐司属于「手机内部」的 UI，必须挂进 .screen。
         挂在 #stage 外面的话，它们会相对整个浏览器窗口定位，
         手机在窗口里居中时，弹层就跑到手机框外面去了。 */
      const screenEl = document.getElementById('screen');
      if (screenEl) {
        ['toast-root', 'sheet-root'].forEach(id => {
          const node = document.getElementById(id);
          if (node && node.parentNode !== screenEl) screenEl.appendChild(node);
        });
      }

      this.navbar.classList.toggle('hidden', chrome === 'full' || !!page.hideNav);
      this.tabbar.classList.toggle('hidden', chrome !== 'tab');
      if (this.fab) this.fab.classList.toggle('hidden', chrome !== 'tab' || !!page.dark);

      /* 深色页面（智能助手）整机切深色：状态栏 / 导航栏 / 导航胶囊 */
      const screen = document.getElementById('screen');
      if (screen) screen.classList.toggle('dark', !!page.dark);

      document.getElementById('navTitle').textContent = page.title || '';
      /* 栈里超过一层、或者当前压根不是根页（深链进来的）都要给返回键 */
      const isRoot = entry.name === LJ.ROOT[LJ.session.get().role];
      document.getElementById('navBack').style.visibility =
        (LJ.router.stack.length > 1 || !isRoot) ? 'visible' : 'hidden';

      // tab 高亮
      if (this.tabbar) {
        const rootEntry = LJ.router.stack[0];
        const rootName = rootEntry ? rootEntry.name : '';
        this.tabbar.querySelectorAll('[data-tab]').forEach(b => {
          const t = LJ.TABS[LJ.session.get().role].find(x => x.id === b.getAttribute('data-tab'));
          b.classList.toggle('active', !!t && t.page === rootName);
        });
      }
      document.getElementById('deviceLabel').textContent =
        LJ.ROLE_LABEL[LJ.session.get().role] + ' · ' +
        (LJ.session.currentUser() || {}).name;
    },

    /* ============================================================
       开发面板（不属于产品 UI）
       ============================================================ */
    renderDevbar() {
      if (!this.devbar) return;
      const s = LJ.session.get();
      const sim = LJ.clock.now();
      const real = U.ymd(new Date());
      const offset = U.diffDays(real, sim);
      const entries = LJ.store.all('entry').length;

      this.devbar.innerHTML =
        '<h4>Dev · 非产品 UI</h4>' +

        '<div class="grp"><h4>身份</h4>' +
        (s.userId ? LJ.store.all('user').map(u =>
          '<button class="' + (u.id === s.userId ? 'on' : 'gh') + '" data-sw="' + u.id + '">' +
          LJ.ROLE_LABEL[u.role] + ' · ' + UI.esc(u.name) + '</button>').join('')
          : '<button class="gh">未登录</button>') +
        '<button class="gh" data-act="logout">退出登录</button>' +
        '</div>' +

        '<div class="grp"><h4>时间机器</h4>' +
        '<div class="clock">' + sim + '</div>' +
        '<div class="kv"><span>相对今天</span><b>' + (offset > 0 ? '+' + offset : offset) + ' 天</b></div>' +
        '<div class="kv"><span>账本条目</span><b>' + entries + '</b></div>' +
        '<div class="mt8" style="height:8px"></div>' +
        '<button data-act="d1">快进 1 天</button>' +
        '<button data-act="d7">快进 1 周</button>' +
        '<button data-act="m1">快进 1 个月</button>' +
        '<button data-act="m3">快进 3 个月</button>' +
        '<button class="gh" data-act="now">回到真实今天</button>' +
        '<div class="note">快进时会自动发放生活费、扣除订阅、生成对账记录。</div>' +
        '</div>' +

        '<div class="grp"><h4>数据</h4>' +
        '<button class="gh" data-act="reseed">重新生成种子数据</button>' +
        '<button class="gh" data-act="wipe">清空全部数据</button>' +
        '</div>';

      this.devbar.querySelectorAll('[data-sw]').forEach(b => {
        b.onclick = () => {
          const u = LJ.store.find('user', b.getAttribute('data-sw'));
          LJ.session.set(u.id, u.role);
          App.enter(u.role);
        };
      });
      this.devbar.querySelectorAll('[data-act]').forEach(b => {
        b.onclick = () => {
          const a = b.getAttribute('data-act');
          if (a === 'd1') LJ.clock.advance(1);
          else if (a === 'd7') LJ.clock.advance(7);
          else if (a === 'm1') LJ.clock.advance(30);
          else if (a === 'm3') LJ.clock.advance(90);
          else if (a === 'now') { LJ.clock.resetToReal(); UI.toast('已回到今天'); }
          else if (a === 'logout') { LJ.session.clear(); App.renderLogin(); }
          else if (a === 'reseed') {
            UI.confirm({
              title: '重新生成种子数据？', desc: '将清空现有记录，重新生成 6 个月的账本数据。',
              okText: '重新生成',
              onOk() {
                LJ.store.clearAll();
                LJ.seed.install(U.ymd(new Date()));
                LJ.session.set('u_youth_lin', 'youth');
                App.enter('youth');
                UI.toast('种子数据已重新生成');
              }
            });
          } else if (a === 'wipe') {
            UI.confirm({
              title: '清空全部数据？', desc: '所有账本、关系、留痕都会被删除，且不可恢复。',
              okText: '清空',
              onOk() {
                LJ.store.clearAll();
                LJ.session.clear();
                App.renderLogin();
                UI.toast('已清空');
              }
            });
          }
        };
      });
    }
  };

  /* ---------------- 启动 ---------------- */
  document.addEventListener('DOMContentLoaded', () => LJ.app.boot());
  if (document.readyState !== 'loading') LJ.app.boot();
})(window.LJ);
