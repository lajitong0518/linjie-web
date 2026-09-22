/* ============================================================
   pages-youth.js —— 青年端页面
   ============================================================ */
(function (LJ) {
  'use strict';
  const U = LJ.util, UI = LJ.ui, M = LJ.metrics, P = LJ.pages;

  /* 首页订阅卡组的展开状态（挂在 LJ 上，便于深链与调试指定初始态） */
  LJ.homeSubsOpen = LJ.homeSubsOpen || false;
  function subsOpen() { return !!LJ.homeSubsOpen; }

  /* 展开态的卡片宽度与间距（超出视口即可横滑查看） */
  const SUB_W = 158, SUB_GAP = 12;

  /* ---------------- 订阅品牌 ----------------
     图标做法：品牌色圆盘 + 对比色图形，图形缩到圆盘的 56% 并居中，
     四周留白 → 有"应用图标"的精致感，而不是贴一张图上去 */
  function brandDisc(disc, glyph) {
    return '<svg viewBox="0 0 24 24">' +
      '<circle cx="12" cy="12" r="12" fill="' + disc + '"/>' +
      '<g transform="translate(12 12) scale(.56) translate(-12 -12)">' +
      glyph + '</g></svg>';
  }

  /* OpenAI 结形（官方 mark 路径） */
  const GLYPH_CHATGPT = '<path fill="#0B0B0C" d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.4097 9.2186V6.8862a.0678.0678 0 0 1 .0295-.0615l4.8303-2.7865a4.504 4.504 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.0381-.0521V6.0699a4.4944 4.4944 0 0 1 7.3711-3.4535l-.142.0804-4.7783 2.7582a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>';

  /* Spotify 的三道声波弧（从官方 mark 里剥出来的独立路径） */
  const GLYPH_SPOTIFY = '<path fill="#fff" d="M17.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>';

  /* 网盘云朵 */
  const GLYPH_CLOUD = '<path fill="#fff" d="M9.4 17.35h6.5a3.4 3.4 0 0 0 .55-6.76 4.76 4.76 0 0 0-8.99-.74A3.5 3.5 0 0 0 9.4 17.35Z"/>';

  const SVG_CHATGPT = brandDisc('#FFFFFF', GLYPH_CHATGPT);
  const SVG_SPOTIFY = brandDisc('#1DB954', GLYPH_SPOTIFY);
  const SVG_BAIDUPAN = brandDisc('#2A6BE0', GLYPH_CLOUD);

  /* rank 越小越靠前（渲染时靠后的层级在前，所以排序要反着来） */
  const SUB_BRANDS = [
    { re: /chatgpt|openai|gpt/i, rank: 0, bg: 'linear-gradient(152deg,#4A4A55 0%,#0B0B0C 92%)', fg: '#fff', logo: SVG_CHATGPT },
    { re: /spotify/i, rank: 1, bg: 'linear-gradient(152deg,#1FAE5E 0%,#06452A 94%)', fg: '#fff', logo: SVG_SPOTIFY },
    { re: /百度网盘|网盘|云盘/i, rank: 2, bg: 'linear-gradient(152deg,#5E9BF0 0%,#123A9B 94%)', fg: '#fff', logo: SVG_BAIDUPAN }
  ];
  function subBrand(name) {
    const n = String(name || '');
    for (let i = 0; i < SUB_BRANDS.length; i++) if (SUB_BRANDS[i].re.test(n)) return SUB_BRANDS[i];
    return { rank: 99, bg: 'linear-gradient(152deg,#B394F5 0%,#4A2C93 94%)', fg: '#fff', logo: SVG_CHATGPT };
  }

  /* ============================================================
     首页 · 资金全景看板
     ============================================================ */
  P['youth.home'] = {
    title: '临界', chrome: 'tab',
    render(ctx) {
      const api = ctx.api, d = api.dashboard();
      const me = api.profile();
      const b = d.balances;
      const pend = api.support.pending();
      const invites = api.invite.pending();
      const incomingMode = api.disclosure.incoming();
      const bp = d.budget, g = d.gap, c = d.control;
      const allTasks = api.task.summary();

      let html = '<div class="pad">';

      /* ① 顶行：左＝本月还可用（存量），右＝开场白（教练的一句话）。
           日期不放 —— 日期是系统的事，产品只说跟钱有关的话。
           开场白三态（稳 / 紧 / 超），一律陈述句、不训人（文档 3.3.2 中性化）。
           存量（还可用）和节奏（今天还能花）是两码事，一个说"还有多少"，
           一个说"今天怎么花" —— 分开放、标签写清楚就不打架。 */
      /* ① 顶行：左＝问候语 + 本月余额（同一 hero 字号，上一版问候语的尺寸），
           右＝开场白（纯汉字、大气排版 —— 不要绿色胶囊，就放字）。
           口径：本月余额＝预算剩余（存量）；"今天还能花"在判断卡里（节奏）。
           问候语按钟点变，测试别断言它的文案（坑 25）。 */
      const daysLeft = Math.max(0, bp.totalDays - bp.passed);
      const remaining = Math.round(bp.remaining);
      const brokeBudget = remaining < 0;
      const dailyLeft = Math.round(Math.max(0, remaining) / Math.max(1, daysLeft));
      const evS = LJ.evStats(api);
      const spentSoFar = Math.max(0, Math.round(bp.total - bp.remaining));
      const dailyAvg = spentSoFar / Math.max(1, bp.passed);
      const runwayDays = dailyAvg > 0 ? Math.floor(Math.max(0, bp.remaining) / dailyAvg) : 0;
      const aheadDays = Math.max(0, (bp.totalDays - bp.passed) - runwayDays);
      const ov14 = (api.ledger.overview(14) || {}).series || [];
      const wkNow = ov14.slice(-7).reduce((a, s) => a + (s.amount || 0), 0);
      const wkPrev = ov14.slice(-14, -7).reduce((a, s) => a + (s.amount || 0), 0);
      const coach = brokeBudget ? '本月已超预算<br>下个月会紧一点'
        : (aheadDays >= 2 || wkNow > wkPrev * 1.15) ? '照这个节奏<br>会提前花完'
          : (wkNow <= wkPrev ? '这周的节奏比上周稳<br>这个月花得完' : '现在的花法走得通<br>这个月花得完');
      const hh = new Date().getHours();
      html += '<div class="row between" style="padding:8px 4px 18px;align-items:flex-start">' +
        '<div class="home-hello">' +
        '<div class="hero">' + (hh < 12 ? '早上好' : hh < 18 ? '下午好' : '晚上好') + '</div>' +
        '<div class="hero hi-bal" data-month-left><b>¥' +
        U.wonInt(brokeBudget ? Math.abs(remaining) : remaining) + '</b></div>' +
        '<div class="hi-k">' + (brokeBudget ? '本月已超' : '本月余额') + '</div>' +
        '</div>' +
        '<div class="coach-plain" data-coach>' + coach + '</div>' +
        '</div>';

      /* ①.5 风险提醒条 —— 只在二级以上、还没处理的时候出现
         "先提醒本人"是这个产品的核心承诺，提醒不能埋在页面最底下。
         一级不占这条：它只是"你自己看看"，不该推着人走。 */
      const hotRisk = api.risk.active()
        .filter(r => r.level >= 2)
        .sort((a, b) => b.level - a.level)[0];
      if (hotRisk) {
        const lv = LJ.engine.riskLevel(hotRisk.level);
        const cd = api.risk.countdown(hotRisk);
        html += '<div class="rk-alert l' + hotRisk.level + '" data-todo="risk" data-id="' + hotRisk.id + '">' +
          '<div class="ra-i">' + lv.icon + '</div>' +
          '<div class="ra-t"><b>' + UI.esc(hotRisk.title) + '</b>' +
          '<span>' + (cd ? cd.text + ' · 家人还不会收到通知'
            : '已同步家人，通知不含明细') + '</span></div>' +
          '<span class="ra-go">去看 ›</span>' +
          '</div>';
      }

      /* ② 主数字行 —— 「今天还能花多少」
             余额是后视镜，日均可用才是方向盘：前者说"存量还剩多少"，
             后者说"今天可以怎么花"。把前瞻性的那个数放到第一眼，
             产品的气质才从"记账本"变成"花钱参谋"。
             下面那行小字写出算式本身（预算剩多少 ÷ 还剩几天）——
             数字不给依据，用户只会当成又一个凭空冒出来的指标；
             给了依据，用户顺手就学会了这个关系式，这本身就是财商。
         ★ 不动黑卡：那张卡是共享元素转场的克隆源，内容和「支出结构」顶部的卡
           必须逐字一致，改它的数字会让交接瞬间文字突变（README 坑 23）。 */
      /* 超支时主数字换成「超了多少」而不是显示 ¥0。
         一个恒为 0 的 hero 数字看起来像坏了，而且整个月都是 0、毫无信息量；
         超出额既是诚实的，也仍然是一个能驱动行动的数。
         措辞一律陈述事实（"本月已超预算"），不写"先别再花"这类祈使句 ——
         文档 3.3.2 要求中性化表达，产品不做消费道德评判。 */
      /* ② 「这一笔要不要花」卡 —— 大字标题就是产品灵魂那句话。
            判断句全删（字少才是大字的底气），卡里只留两组数字
            （今天还能花 / 天后发生活费）+ 一个沙盘按钮。 */
      html += '<div class="card judge" data-judge>' +
        '<div class="jd-title">这一笔要不要花</div>';
      html += '<div class="row between" style="padding:0 4px 20px;align-items:flex-end">' +
        '<div style="text-align:left;min-width:0">' +
        '<div class="stat" data-hero-spend><div class="n"><span class="cur">¥</span>' +
        U.wonInt(brokeBudget ? Math.abs(remaining) : dailyLeft) + '</div>' +
        '<div class="k">' + (brokeBudget ? '本月已超预算' : '今天还能花') + '</div></div>' +
        '<div class="xs muted" data-hero-basis style="margin-top:9px;line-height:1.6">' +
        (brokeBudget
          ? '预算 ¥' + U.wonInt(bp.total) + ' 已用完 · 本周期还剩 ' + daysLeft + ' 天'
          : '预算剩 ¥' + U.wonInt(remaining) + ' ÷ 还有 ' + daysLeft + ' 天') +
        '</div></div>' +
        '<div style="text-align:right;flex:none">' +
        '<div class="stat"><div class="n">' + d.daysToPayday + '</div>' +
        '<div class="k">天后发生活费</div></div></div>' +
        '</div>';
      /* 沙盘推演：产品灵魂入口，从右下角浮标提成主按钮。
         浮标还在（全局可达），但第一眼的主动作是"做一次判断"，不是"记一笔"。 */
      html += '<button class="btn jd-btn" data-sandbox>沙盘推演</button>' +
        '</div>';

      /* ③ 双账户卡 → 共享元素转场到「支出结构」
             （卡面自己飞过去、尺寸不变，缩放交给背景 —— 和「我的 → 银行卡管理」同款）。
             名字保留 data-zoom-src：tools 里有 4 处按它取元素（app.js 的 ?zoom=1、
             shot-fly.js、probe-zoom.js、probe-shared.js），改名会连带牵动它们。 */
      html += '<div class="mt12">' +
        acctCard(b, { tail: (me.phone || '').slice(-4), attrs: ' data-zoom-src' }) +
        '<div class="cap-note" data-cap-go>复盘一次，下个月就知道哪笔可省 ›</div>' +
        '</div>';

      /* 订阅卡组 → 「流水 · 明细」顶部（LJ.subsBlock）；
         缺口预警 → 「复盘」页顶部；待办 → 「往来」页「待我处理」。 */

      /* ⑥ 成长卡（淡紫块 · 环形 + 成长中心 融合）→ 成长中心
             共享元素转场：卡面自己飞过去，尺寸交给背景缩放。
             卡本身由 LJ.growCard 渲染，成长中心顶部用的是同一个函数
             （那边通栏更宽、间距更大，但高度一致 —— 所以转场是横向拉伸）。 */
      html += LJ.growCard(c, allTasks, api.milestone.list().length,
        { attrs: ' data-zoom-push="youth.grow"', ev: evS });

      /* 待办在往来页「待我处理」（LJ.todosBlock） */

      html += '</div>';
      return html;
    },
    mount(el, ctx) {
      UI.bindFold(el);
      /* 首页黑卡「家庭支持协同账户」→ 支出结构。
         共享元素转场：卡面自己飞过去、**尺寸不变**（两页的卡都是 346x170），
         缩放交给背景 —— 和「我的 → 银行卡管理」完全同款。
         支出结构顶部就是同一张卡（还兼作资金来源选择器），所以落点是纯平移。 */
      el.querySelectorAll('[data-zoom-src]').forEach(n => {
        n.onclick = () => ctx.goShared('youth.structure', {}, n, '[data-shared-acct]');
      });
      /* 成长卡 → 成长中心，同样改共享元素转场（落点是成长中心那张指数环主卡） */
      el.querySelectorAll('[data-zoom-push]').forEach(n => {
        n.onclick = () => ctx.goShared(n.getAttribute('data-zoom-push'), {}, n, '[data-shared-grow]');
      });
      el.querySelectorAll('[data-go]').forEach(n => {
        n.onclick = () => {
          const v = n.getAttribute('data-view');
          ctx.go(n.getAttribute('data-go'), v ? { view: v } : {});
        };
      });

      /* 订阅阶梯栈随首页一起搬走：行为挪进 LJ.subsMount（流水页调用），原样没改 */

      /* 判断卡的沙盘按钮（产品灵魂入口）+ 黑卡下的复盘入口 */
      const sb = el.querySelector('[data-sandbox]');
      if (sb) sb.onclick = () => { if (LJ.openSpendSheet) LJ.openSpendSheet(); };
      const cap = el.querySelector('[data-cap-go]');
      if (cap) cap.onclick = () => {
        const src = el.querySelector('[data-zoom-src]');
        if (src) src.onclick();
      };
    }
  };

  /* 首页待办：确认收到的弹层 */
  function openConfirmSheet(ctx, id) {
    const p = ctx.api.support.pending().find(x => x.id === id);
    if (!p) return;
    UI.sheet({
      title: '确认收到这笔支持？',
      sub: UI.esc(p.purpose) + ' · ¥' + U.won(p.amount) + (p.directed ? ' · 定向用途' : ''),
      body: '<div class="proto"><div class="ph"><span class="seal">账</span>确认后会发生什么</div>' +
        '<div class="sm t2" style="line-height:1.8">· 这笔钱计入你的账本，归入「家庭支持金」<br>' +
        '· 双方各留存一笔对账记录，随时可查<br>· 掌控指数与成长任务会同步更新</div></div>' +
        '<button class="btn mt20" id="csOk">确认收到</button>' +
        '<button class="btn ghost mt12" id="csNo">暂不确认</button>',
      mount(el, close) {
        el.querySelector('#csOk').onclick = () => {
          ctx.api.support.confirm(id);
          close();
          UI.toast('已计入账本');
          ctx.go('youth.ledger', { view: 'list', hl: id });
        };
        el.querySelector('#csNo').onclick = () => {
          ctx.api.support.decline(id); close(); UI.toast('已回应，对方会收到提示');
        };
      }
    });
  }

  /* 首页待办：邀约回应弹层 */
  function openInviteSheet(ctx, id) {
    const iv = ctx.api.invite.list().find(x => x.id === id);
    if (!iv) return;
    const REASONS = ['这次先不用啦，谢谢', '我这边够用，留着下次吧', '想自己先试试看'];
    UI.sheet({
      title: UI.esc(iv.title),
      sub: '家人主动想支持你 · ¥' + U.won(iv.amount) + (iv.note ? '<br>' + UI.esc(iv.note) : ''),
      body: '<button class="btn" id="ivOk">收下</button>' +
        '<div class="sec-title">或者，礼貌地谢绝</div>' +
        REASONS.map((r, i) => '<button class="btn ghost mt12" data-r="' + UI.esc(r) + '">' + UI.esc(r) + '</button>').join('') +
        '<div class="proto mt16"><div class="ph"><span class="seal">说</span>谢绝不是拒收</div>' +
        '<div class="xs t2" style="line-height:1.75">系统只会给对方一个中性的提示，不会解释原因。' +
        '把「不要」变成一个不需要辩解的回答。</div></div>',
      mount(el, close) {
        el.querySelector('#ivOk').onclick = () => {
          ctx.api.invite.accept(id); close(); UI.toast('已收下并计入账本');
          ctx.go('youth.ledger', { view: 'list' });
        };
        el.querySelectorAll('[data-r]').forEach(b => b.onclick = () => {
          ctx.api.invite.decline(id, b.getAttribute('data-r'));
          close(); UI.toast('已回应，对方会收到中性的提示');
        });
      }
    });
  }

  /* ============================================================
     待我处理（原首页「待办」，现落在往来页顶部）
     ------------------------------------------------------------
     风险 → 确认 → 邀约 → 方案，按优先级排；折叠默认露前 3 项
     （折起来看不见的正好是最不要紧的那些）。
     确认支持一项一项都列（首页时代只列第一笔）——
     搬了家，顺手把"剩下的进折叠区"补正确。
     ★ data-todo 的点击语义由 LJ.bindTodos 统一绑定，页面别各写一份。
     ============================================================ */
  function todosBlock(api, opts) {
    const title = (opts && opts.title) || '待我处理';
    const pend = api.support.pending();
    const invites = api.invite.pending();
    const incomingMode = api.disclosure.incoming();
    const todos = [];

    api.risk.active()
      .slice().sort((a, b) => b.level - a.level)
      .forEach(r => {
        const lv = LJ.engine.riskLevel(r.level);
        const cd = api.risk.countdown(r);
        todos.push({
          act: 'risk', id: r.id, risk: true, level: r.level, icon: lv.icon,
          title: r.title,
          sub: cd ? cd.text + ' · ' + cd.dateText + ' 之前回应，家人不会收到通知'
            : r.level === 1 ? lv.lead + ' · 家人不会收到通知'
              : '已同步家人，通知不含明细',
          tag: lv.short, cls: r.level >= 2 ? 'danger' : 'warn',
          cta: cd ? '我来说明' : '查看'
        });
      });

    pend.forEach(p => {
      todos.push({
        act: 'confirm', id: p.id, icon: '📩',
        title: p.purpose, sub: '家人登记 · ¥' + U.won(p.amount) + (p.directed ? ' · 定向用途' : ''),
        tag: '待确认', cls: 'warn', cta: '确认收到'
      });
    });
    invites.forEach(iv => {
      todos.push({
        act: 'invite', id: iv.id, icon: '🎁',
        title: iv.title, sub: '家人主动支持 · ¥' + U.won(iv.amount) + ' · 可收下或谢绝',
        tag: '待回应', cls: 'info', cta: '回应'
      });
    });
    if (incomingMode) {
      todos.push({
        act: 'go', to: 'youth.mode', icon: '📜',
        title: '信息范围调整', sub: '家人申请调整为「' + LJ.disclosure.MODES[incomingMode.proposedMode].name + '」',
        tag: '待确认', cls: 'warn', cta: '查看'
      });
    }
    api.plan.incoming().forEach(p => {
      todos.push({
        act: 'plan', id: p.id, icon: p.kind === 'taper' ? '🎓' : '🏖',
        title: '家人想调整生活费',
        sub: api.plan.summary(p) + ' · 你确认之后才生效',
        tag: '待确认', cls: 'warn', cta: '去看看'
      });
    });

    const todoRow = t => t.risk
      ? '<div class="li rk-todo l' + t.level + '" data-todo="risk" data-id="' + t.id + '">' +
      '<div class="ico" style="background:transparent;font-size:19px">' + t.icon + '</div>' +
      '<div class="grow"><div class="ellipsis" style="font-size:14.5px;font-weight:700">' +
      UI.esc(t.title) + '</div>' +
      '<div class="xs muted" style="margin-top:3px">' + UI.esc(t.sub) + '</div></div>' +
      '<button class="btn xs">' + UI.esc(t.cta) + '</button>' +
      '</div>'
      : '<div class="li" data-todo="' + t.act + '" data-id="' + (t.id || '') + '" data-to="' + (t.to || '') + '">' +
      '<div class="ico">' + t.icon + '</div>' +
      '<div class="grow"><div class="ellipsis" style="font-size:14.5px;font-weight:600">' + UI.esc(t.title) + '</div>' +
      '<div class="xs muted" style="margin-top:3px">' + UI.esc(t.sub) + '</div></div>' +
      '<button class="btn xs ' + (t.act === 'go' ? 'ghost' : '') + '">' + UI.esc(t.cta) + '</button>' +
      '</div>';

    return '<div class="sec-title" style="margin-top:16px">' + title +
      (todos.length ? '<span class="more">' + todos.length + ' 项</span>' : '') + '</div>' +
      (todos.length
        ? '<div class="list">' + UI.fold('youth.todos', todos.map(todoRow)) + '</div>'
        : '<div class="card flat"><div class="sm muted" style="text-align:center;padding:14px 0">' +
        '暂时没有需要处理的事</div></div>');
  }
  LJ.todosBlock = todosBlock;

  LJ.bindTodos = function (el, ctx) {
    el.querySelectorAll('[data-todo]').forEach(n => {
      n.onclick = () => {
        const act = n.getAttribute('data-todo');
        const id = n.getAttribute('data-id');
        if (act === 'go') { ctx.go(n.getAttribute('data-to')); return; }
        if (act === 'confirm') return openConfirmSheet(ctx, id);
        if (act === 'invite') return openInviteSheet(ctx, id);
        if (act === 'risk') return ctx.go('youth.riskDetail', { id });
        if (act === 'plan') return ctx.go('youth.plan', {});
      };
    });
  };

  /* ============================================================
     订阅卡组（阶梯堆叠 ⇄ 横向排开）—— 从首页搬到「流水 · 明细」顶部
     ------------------------------------------------------------
     动效原样保留：折叠＝阶梯堆叠（右对齐、左边缘逐级向外），
     展开＝横向排开、宽度固定、超出横滑。DOM 与行为一点没改，只是换了住址。
     ============================================================ */
  function subsBlock(api) {
    const subs = api.subscription.list().filter(s => s.status === 'active');
    if (!subs.length) return '';
    /* 按「下次扣款」由远及近排：远的在后层，最近的露在最外面 */
    const ordered = subs.slice()
      .sort((a, b) => subBrand(a.name).rank - subBrand(b.name).rank)
      .slice(0, 3).reverse();
    const n = ordered.length;
    const open = subsOpen();
    const STEP = 52, H_CLOSED = 176, H_OPEN = 198, INSET_PCT = 14;
    const stackH = open ? H_OPEN : (n - 1) * STEP + H_CLOSED;

    return '<div class="card mt12" style="padding:16px 14px 14px">' +
      '<div class="row between" style="padding:0 4px">' +
      '<div class="sm" style="font-weight:700">订阅</div>' +
      '<div class="xs muted" style="font-weight:600">每月 ¥' +
      Math.round(subs.reduce((a, b) => a + (b.actualMonthly || b.amount), 0)) +
      ' · ' + n + ' 项</div>' +
      '</div>' +
      '<div class="sub-viewport" id="subVp" style="height:' + stackH + 'px;margin-top:14px">' +
      '<div class="sub-track" id="subTrack" data-n="' + n + '" data-open="' + (open ? 1 : 0) + '" ' +
      'style="height:' + stackH + 'px">' +
      ordered.map((s, i) => {
        const b = subBrand(s.name);
        const inset = n - 1 - i;   // 越靠后层，左边缘缩进越多 → 阶梯
        const style = open
          ? 'top:0;left:' + ((n - 1 - i) * (SUB_W + SUB_GAP)) + 'px;width:' + SUB_W + 'px;height:' + H_OPEN +
          'px;z-index:' + (i + 1) + ';'
          : 'top:' + (i * STEP) + 'px;left:' + (inset * INSET_PCT) + '%;' +
          'width:calc(100% - ' + (inset * INSET_PCT) + '%);height:' + H_CLOSED + 'px;z-index:' + (i + 1) + ';';
        return '<div class="sub-card block' + (open ? ' tight' : '') + '" data-sub="' + s.id + '" ' +
          'style="' + style + 'background:' + b.bg + ';color:' + b.fg + '">' +
          '<div class="glow"></div>' +
          '<div class="srow"><span class="slogo">' + b.logo + '</span>' +
          '<div style="min-width:0"><div class="sname">' + UI.esc(s.name) + '</div>' +
          '<div class="scycle">每月</div></div></div>' +
          '<div class="smeta">' +
          '<div><div class="k">待扣款</div><div class="v">¥' + U.won(s.actualMonthly || s.amount) + '</div></div>' +
          '<div><div class="k">下次扣款</div><div class="v">' +
          (s.nextDate ? U.ymdCN(s.nextDate) : '—') + '</div></div>' +
          '</div></div>';
      }).join('') +
      '</div></div>' +
      '<div class="sub-hint' + (open ? ' open' : '') + '" id="subHint">' +
      (open ? '收起' : '展开全部 ' + n + ' 项') + UI.icon('chevron', 13) + '</div>' +
      '</div>';
  }
  LJ.subsBlock = subsBlock;

  LJ.subsMount = function (el) {
    const vp = el.querySelector('#subVp');
    const track = el.querySelector('#subTrack');
    const hint = el.querySelector('#subHint');
    if (!vp || !track || !hint) return;
    const n = Number(track.getAttribute('data-n'));
    const cards = Array.prototype.slice.call(track.querySelectorAll('.sub-card'));
    const STEP = 52, H_CLOSED = 176, H_OPEN = 198, INSET_RATIO = 0.14;

    const layout = (next) => {
      const W = vp.clientWidth;
      const insetPx = Math.round(W * INSET_RATIO);
      const h = next ? H_OPEN : (n - 1) * STEP + H_CLOSED;
      vp.style.height = h + 'px';
      track.style.height = h + 'px';
      track.style.width = next ? (n * SUB_W + (n - 1) * SUB_GAP) + 'px' : W + 'px';
      cards.forEach((c, i) => {
        if (next) {
          c.classList.add('tight');
          c.style.top = '0px';
          /* 展开时也按品牌优先级从左往右排（DOM 最后的排最左） */
          c.style.left = ((n - 1 - i) * (SUB_W + SUB_GAP)) + 'px';
          c.style.width = SUB_W + 'px';
        } else {
          c.classList.remove('tight');
          const inset = n - 1 - i;      // 后层缩进更多
          c.style.top = (i * STEP) + 'px';
          c.style.left = (inset * insetPx) + 'px';
          c.style.width = (W - inset * insetPx) + 'px';
        }
        c.style.height = (next ? H_OPEN : H_CLOSED) + 'px';
      });
      track.setAttribute('data-open', next ? '1' : '0');
      hint.classList.toggle('open', next);
      hint.innerHTML = (next ? '收起' : '展开全部 ' + n + ' 项') + UI.icon('chevron', 13);
    };

    const toggle = () => {
      LJ.homeSubsOpen = track.getAttribute('data-open') !== '1';
      if (!LJ.homeSubsOpen) vp.scrollTo({ left: 0, behavior: 'smooth' });
      layout(LJ.homeSubsOpen);
    };
    vp.onclick = toggle;
    hint.onclick = toggle;

    /* 首帧：把百分比初值换成 px，保证折叠态右对齐严丝合缝 */
    layout(LJ.homeSubsOpen);
  };

  function entryRow(e, ctx, hl) {
    const c = LJ.catById(e.category);
    const isIn = e.direction === 'in';
    const title = isIn ? (e.title || '入账') : (e.merchant || c.name);
    const sub = isIn
      ? (e.fundingSource === 'family' ? '家庭支持' : '个人自有')
      : c.name + (e.fundingSource === 'own' ? ' · 自有资金' : '');
    return '<div class="li' + (hl && e.id === hl ? ' hl' : '') + '" data-entry="' + e.id + '">' +
      '<div class="ico" style="background:' + (isIn ? '#DFFAEC' : c.color + '18') + ';color:' + (isIn ? 'var(--ok)' : c.color) + '">' +
      (isIn ? '↓' : c.icon) + '</div>' +
      '<div class="grow"><div class="ellipsis" style="font-size:14.5px;font-weight:500">' + UI.esc(title) + '</div>' +
      '<div class="xs muted" style="margin-top:2px">' + U.ymdCN(e.date) + ' · ' + UI.esc(sub) + '</div></div>' +
      '<div class="amt ' + (isIn ? 'in' : 'out') + '">' + (isIn ? '+' : '−') + U.won(e.amount) + '</div>' +
      '</div>';
  }

  function bindGo(el, ctx) {
    el.querySelectorAll('[data-go]').forEach(n => {
      n.onclick = () => ctx.go(n.getAttribute('data-go'));
    });
  }
  LJ._bindGo = bindGo;
  LJ._entryRow = entryRow;

  /* ============================================================
     退出登录 —— 产品内的身份出口
     ------------------------------------------------------------
     在此之前「退出」只存在于开发面板里，产品内一条路都没有：
     以支持人端进去之后，界面上找不到任何回到青年端的路径。
     真实 App 不会这样 —— 这是把「演示能跑」当成「产品能用了」。

     退出后落到身份选择页，那里列着青年端 / 支持人端两个账号，
     所以「退出登录」同时就是「换身份」的那条路。
     两页共用，避免两端各写一份又走岔。
     ============================================================ */
  LJ.LOGOUT_ROW =
    '<div class="li" data-act="logout"><div class="ico" style="background:#F1F0F5">🚪</div>' +
    '<div class="grow"><div style="font-size:14.5px">退出登录</div>' +
    '<div class="xs muted" style="margin-top:2px">退出后可切换其他身份</div></div>' +
    '<div class="muted">›</div></div>';

  /* 产品导览：30 秒演示动线（一次判断 → 沙盘 → 留痕 → 支持人端的证据）。
     放在产品内叫「产品导览」—— 真产品也该有新手引导，不是演示专用按钮。 */
  LJ.TOUR_ROW =
    '<div class="li" data-act="tour"><div class="ico" style="background:#DFFAEC">🧭</div>' +
    '<div class="grow"><div style="font-size:14.5px">产品导览</div>' +
    '<div class="xs muted" style="margin-top:2px">30 秒看懂：判断 → 推演 → 留痕 → 证据</div></div>' +
    '<div class="muted">›</div></div>';

  LJ.bindLogout = function (el) {
    const t = el.querySelector('[data-act="tour"]');
    if (t) t.onclick = () => LJ.demoTour && LJ.demoTour();
    const n = el.querySelector('[data-act="logout"]');
    if (!n) return;
    n.onclick = () => UI.confirm({
      title: '退出当前身份？',
      desc: '退出后回到身份选择页，可以换一个身份进入。本机已有的记录不会被删除。',
      okText: '退出',
      onOk() { LJ.session.clear(); LJ.app.renderLogin(); }
    });
  };

  /* ============================================================
     账单

  /* ============================================================
     支出结构（点账单页右卡进入）—— 环形图 + 分类列表
     ============================================================ */
  /* ============================================================
     黑色账户卡「临界 · 家庭支持协同账户」
     ------------------------------------------------------------
     首页和「支出结构」页顶部是**同一张卡**，尺寸必须逐像素一致（346x170），
     共享元素转场才是纯平移、卡不变形。所以抽成一个函数两边共用 ——
     各写一份迟早会走岔（尺寸差 1px 就变成缩放）。

     opts.pick：给两个资金池加 data-src，让卡本身当资金来源选择器
                （取代「支出结构」原来那排「全部 / 家庭支持金 / 个人自有资金」）。
     opts.sel ：当前选中的池子（'' | 'family' | 'own'）。**只加类名，不增删元素** ——
                加一行就会改高度，尺寸一致立刻破掉。
     ★ 元素结构不能动：lbl / val / split 三块、两个 half 的顺序和嵌套层级
       都得和原来一模一样，否则高度会变。
     ============================================================ */
  function acctCard(b, o) {
    o = o || {};
    const pick = !!o.pick;
    const sel = o.sel || '';
    const cls = 'acct' + (pick ? ' acct-pick pick-' + (sel || 'all') : '');
    const half = (key, name, val) =>
      '<div class="half' + (pick && sel === key ? ' on' : '') + '"' +
      (pick ? ' data-src="' + key + '"' : '') + '>' +
      '<div class="k">' + name + '</div><div class="v">¥' + U.won(val) + '</div></div>';
    return '<div class="' + cls + '"' + (o.attrs || '') + '>' +
      '<div class="cardno">•••• ' + o.tail + '</div>' +
      /* 标题从「账户名」换成「这一页要回答的问题」——
         首页和「支出结构」页顶部同一张卡（同一函数渲染，逐字一致，坑 23）。 */
      '<div class="lbl">这个月的钱花去哪了</div>' +
      '<div class="val"><span class="cur">¥</span>' + U.won(b.total) + '</div>' +
      '<div class="split">' + half('family', '家庭支持金', b.family) +
      half('own', '个人自有资金', b.own) + '</div>' +
      '</div>';
  }

  /* 能力证据的四维口径（两端共用同一顺序、同一命名） */
  LJ.DIMS = ['预算管理', '消费认知', '储蓄习惯', '风险抵御'];

  /** 本人的能力证据统计：总数 / 四维分布 / 本周 vs 上周（全按 E.EVIDENCE 白名单） */
  LJ.evStats = function (api) {
    const today = LJ.clock.now();
    const all = api.task.evidence('2000-01-01', today);
    const dimSum = {};
    let total = 0;
    all.forEach(e => { total += e.count; dimSum[e.dim] = (dimSum[e.dim] || 0) + e.count; });
    const sumIn = (f, t) => api.task.evidence(f, t).reduce((a, e) => a + e.count, 0);
    return {
      list: all, total, dimSum,
      weekN: sumIn(U.addDays(today, -6), today),
      prevN: sumIn(U.addDays(today, -13), U.addDays(today, -7)),
      wk: api.task.actions()
    };
  };

  /* ============================================================
     成长卡（淡紫块：环形图标 + 层级 + 任务进度）
     ------------------------------------------------------------
     首页和「成长中心」顶部是**同一张卡**，由这个函数统一渲染 ——
     和黑卡（acctCard）同一个思路：各写一份迟早走岔，
     走岔了共享元素转场就从「平移/拉伸」变成乱缩放。

     opts.gap   ：图标与文字之间的间距（两边都是 18，保持一致）。
     opts.chevron：首页要那个 ›（还能点进去），成长中心不要（已经在里面了）。
     ★ 两页的尺寸和间距**完全一致**，只有 › 的有无不同 ——
       尺寸一致（346×122），共享元素转场才是纯平移（走合成器，最省最顺）；
       一旦要缩放，克隆就得每帧重新光栅，观感就是"最后卡一下"。
       所以别为了塞内容把卡撑高/撑宽，放不下的内容放卡外面。
       （「能力轨迹」版文案换过一版又撤回又换回 —— 卡面文案可以换，
         但两页必须出自这一个函数、尺寸实测 346×122 不变。
         能力轨迹详情在成长中心卡下面的独立块里也有。）
     ============================================================ */
  function growCard(c, tasks, msCount, o) {
    o = o || {};
    const ev = o.ev || null;
    const dimLine = ev
      ? LJ.DIMS.map(d => d.slice(0, 2) + ' ' + (ev.dimSum[d] || 0)).join(' · ')
      : '';
    return '<div class="block lav mt12"' + (o.attrs || '') + '>' +
      '<div class="glow"></div>' +
      '<div class="row" style="gap:18px;position:relative;z-index:2;align-items:center">' +
      UI.ring(c.score, 84, 9, '#161618', { track: 'rgba(0,0,0,.13)', label: '' }) +
      '<div class="grow">' +
      '<div class="row between" style="gap:8px">' +
      '<div class="bk" style="opacity:.55">能力轨迹</div>' +
      '<div class="bk" style="opacity:.55">' +
      (ev ? '这周 ' + ev.weekN + ' 次' + (ev.weekN > ev.prevN ? ' ↑' : '') : '') + '</div>' +
      '</div>' +
      '<div style="font-size:20px;font-weight:800;margin-top:5px;letter-spacing:-.03em">' +
      (ev ? ev.total : 0) + ' 次主动动作</div>' +
      '<div class="bd" style="margin-top:6px">' + dimLine + '</div>' +
      '<div style="margin-top:11px">' + UI.bar(tasks.done / tasks.total, 'rgba(0,0,0,.55)') + '</div>' +
      '</div>' +
      (o.chevron === false ? '' : '<div style="font-size:22px;opacity:.3">›</div>') +
      '</div></div>';
  }
  LJ.growCard = growCard;   // pages-youth-m2.js（成长中心）也要用

  P['youth.structure'] = {
    title: '支出结构', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const scope = ctx.params.scope || '';
      const src = ctx.params.src || '';
      const b = api.dashboard().balances;
      const tail = (api.profile().phone || '').slice(-4);

      /* ★ 顶部就是首页那张黑卡（同一个 acctCard 函数渲染，尺寸逐像素一致）——
         它取代了原来那排「全部 / 家庭支持金 / 个人自有资金」chip，
         两个资金池本身成了选择器：点某一池 = 只看那一池，点卡身 = 全部。
         这一块**不放进 #stRest**：切换资金来源时它必须原地不动
         （它就是共享元素转场的落点，动了就等于卡在跳）。 */
      let html = '<div class="pad">' +
        acctCard(b, { tail: tail, pick: true, sel: src, attrs: ' data-shared-acct' }) +
        '<div id="stRest">' + stRest(ctx, scope, src) + '</div>' +
        '</div>';
      return html;
    },
    mount(el, ctx) {
      const api = ctx.api;

      /* 选资金来源 / 翻月份都**原地更新** #stRest，不重渲染整页：
         一是卡是共享元素落点、不能动；二是重渲染会让整页滑一下，
         而用户只是在切一个筛选条件。 */
      function refresh(scope, src) {
        ctx.params.scope = scope;
        ctx.params.src = src;
        const box = el.querySelector('#stRest');
        if (box) box.innerHTML = stRest(ctx, scope, src);
        const card = el.querySelector('.acct-pick');
        if (card) {
          card.classList.remove('pick-all', 'pick-family', 'pick-own');
          card.classList.add('pick-' + (src || 'all'));
          card.querySelectorAll('.half').forEach(h => {
            h.classList.toggle('on', !!src && h.getAttribute('data-src') === src);
          });
        }
        bindRest();
      }

      function bindRest() {
        const box = el.querySelector('#stRest');
        if (!box) return;
        box.querySelectorAll('[data-src]').forEach(n => {
          n.onclick = () => refresh(ctx.params.scope || '', n.getAttribute('data-src'));
        });
        box.querySelectorAll('[data-scope]').forEach(n => {
          n.onclick = () => {
            const s = n.getAttribute('data-scope');
            if (s) refresh(s, ctx.params.src || '');
          };
        });
        box.querySelectorAll('[data-cat]').forEach(n => {
          n.onclick = () => ctx.go('youth.ledger', {
            cat: n.getAttribute('data-cat'), scope: ctx.params.scope || ''
          });
        });
      }

      /* 卡身上的两池 = 选池子；卡身其余部分 = 全部 */
      el.querySelectorAll('.acct-pick .half').forEach(n => {
        n.onclick = (ev) => {
          if (ev && ev.stopPropagation) ev.stopPropagation();
          refresh(ctx.params.scope || '', n.getAttribute('data-src'));
        };
      });
      const card = el.querySelector('.acct-pick');
      if (card) {
        card.onclick = () => refresh(ctx.params.scope || '', '');
      }

      bindRest();
    }
  };

  /* ============================================================
     支出结构页里、黑卡以下的那部分（月份切换 / 大数字 / 环形图 / 分类列表）
     ------------------------------------------------------------
     抽出来是为了切资金来源、翻月份时**只换这一块**：
     顶部那张黑卡是共享元素转场（首页黑卡）的落点，必须原地不动。
     ============================================================ */
  function stRest(ctx, scope, src) {
    const api = ctx.api;
    const d = api.ledger.structure(scope, src);
    const label = d.isYear ? d.scope + ' 年' : Number(d.scope.slice(5)) + ' 月';
    const P = d.pools;
    const idx = d.months.indexOf(d.scope);   // 月份切换用（声明漏过一次，直接 ReferenceError）
    let html = '';
    if (src === 'own' && !P.own.count) {
      html += '<div class="st-note">这个月没有用个人自有资金付款的记录。' +
        '记账时可以在资金来源里切换。</div>';
    }
      html += '<div class="st-nav">' +
        '<button class="st-arrow" data-scope="' + (idx > 0 ? d.months[idx - 1] : '') + '"' +
        (idx > 0 ? '' : ' disabled') + '>' + UI.icon('chevron', 18) + '</button>' +
        '<div class="st-label">' + label + '</div>' +
        '<button class="st-arrow st-next" data-scope="' + (idx >= 0 && idx < d.months.length - 1 ? d.months[idx + 1] : '') + '"' +
        (idx >= 0 && idx < d.months.length - 1 ? '' : ' disabled') + '>' + UI.icon('chevron', 18) + '</button>' +
        '</div>';

      /* 大数字 */
      html += '<div class="st-total">¥' + U.won(d.total) + '</div>';

      if (!d.cats.length) {
        html += UI.empty('📊', src ? '这个池子没有支出' : '这个月还没有支出',
          src ? '换一个资金来源看看，或者去记一笔。' : '记一笔之后这里会显示支出结构。');
        return html;   // .pad 外壳在 render 里，这里不能再补 </div>
      }

      /* 环形图 */
      html += '<div class="card" style="margin-top:16px">' +
        '<div class="st-h">' + (src === 'family' ? '家庭支持金花在哪'
          : src === 'own' ? '个人自有资金花在哪' : '支出结构') + '</div>' +
        '<div class="st-donut-wrap">' + donut(d.cats) + '</div>' +
        '</div>';

      /* 分类列表 */
      html += '<div class="sec-title">按分类<span class="more">' + d.cats.length + ' 类</span></div>';
      html += '<div class="list">' + d.cats.map(c =>
        '<div class="li" data-cat="' + c.id + '">' +
        '<div class="ico" style="background:' + c.color + '22">' + c.icon + '</div>' +
        '<div class="grow" style="min-width:0">' +
        '<div class="row between"><span class="sm" style="font-weight:700">' + c.name + '</span>' +
        '<span class="amt out">−¥' + U.won(c.amount) + '</span></div>' +
        '<div class="row" style="gap:9px;margin-top:7px;align-items:center">' +
        '<span class="st-mini"><i style="width:' + Math.max(4, Math.round(c.ratio * 100)) +
        '%;background:' + c.color + '"></i></span>' +
        '<span class="xs muted" style="flex:none">' + c.count + ' 笔 · ' +
        Math.round(c.ratio * 100) + '%</span>' +
        '</div></div>' +
        '<div class="muted" style="font-size:16px">›</div>' +
        '</div>').join('') + '</div>';

      html += '<div class="proto mt20"><div class="ph"><span class="seal">看</span>占比是怎么算的</div>' +
        '<div class="xs t2" style="line-height:1.8">只统计支出，不含收入。' +
        '点任意一类可以跳到该类在账单里的全部明细。</div></div>';
      html += '<div style="height:30px"></div>';
      return html;

      /* SVG 环形图：每段用 stroke-dasharray 画在同一个圆上
         几何要留够引线标签的位置，否则左右两边的文字会溢出卡片 */
      function donut(cats) {
        const CX = 120, CY = 72, R0 = 36, SW = 18, RR = 56;
        const C = 2 * Math.PI * R0;
        let acc = 0;
        const segs = cats.map(c => {
          const len = c.ratio * C;
          const s = '<circle cx="' + CX + '" cy="' + CY + '" r="' + R0 + '" fill="none" stroke="' + c.color +
            '" stroke-width="' + SW + '" stroke-dasharray="' + len.toFixed(2) + ' ' + (C - len).toFixed(2) +
            '" stroke-dashoffset="' + (-acc).toFixed(2) +
            '" transform="rotate(-90 ' + CX + ' ' + CY + ')"/>';
          acc += len;
          return s;
        }).join('');
        /* 引线标签：最多标前 4 类 */
        const marks = cats.slice(0, 4).map((c, i) => {
          const a0 = cats.slice(0, i).reduce((s, x) => s + x.ratio, 0) + c.ratio / 2;
          const ang = a0 * 2 * Math.PI - Math.PI / 2;
          const co = Math.cos(ang), si = Math.sin(ang);
          const x1 = CX + co * (R0 + SW / 2 + 4), y1 = CY + si * (R0 + SW / 2 + 4);
          const x2 = CX + co * RR, y2 = CY + si * RR;
          const right = co >= 0;
          return '<line x1="' + x1.toFixed(1) + '" y1="' + y1.toFixed(1) + '" x2="' + x2.toFixed(1) +
            '" y2="' + y2.toFixed(1) + '" stroke="#D8D7DF" stroke-width="1"/>' +
            '<text x="' + (x2 + (right ? 5 : -5)).toFixed(1) + '" y="' + (y2 + 3.5).toFixed(1) +
            '" text-anchor="' + (right ? 'start' : 'end') +
            '" font-size="10" font-weight="700" fill="#7A7A85">' +
            UI.esc(c.name) + '</text>';
        }).join('');
        return '<svg viewBox="0 0 240 148" style="width:100%;height:auto;display:block">' +
          segs + marks + '</svg>';
      }
  }

  /* ============================================================
     账单
     ============================================================ */
  /** 把独立页面降级成"账本内的视图"：剥掉它自己的 .pad 外壳 */
  function asView(name, ctx) {
    const page = LJ.pages[name];
    if (!page) return '<div class="state"><span class="em">⚠️</span><div class="t">视图缺失</div>' +
      '<div class="d">' + UI.esc(name) + '</div></div>';
    return page.render(ctx)
      .replace(/^\s*<div class="pad">/, '')
      .replace(/<\/div>\s*$/, '');
  }

  /* ---------------- 我的银行卡 ----------------
     平行堆叠（三张左边缘对齐，只错开纵向位置），标题行右边点进「银行卡管理」。
     卡片数据现在住在 store 的 bankCard 表里（卡面图 + 这张卡扮演的角色），
     所以「银行卡管理」页改了角色，这边和账本口径会一起变。 */
  LJ.cardsOpen = false;

  const LEDGER_VIEWS = [    { id: 'list', name: '明细' },
    { id: 'cycle', name: '周期' },
    { id: 'subs', name: '订阅' },
    { id: 'review', name: '复盘' }
  ];

  /** 视图 A · 明细（照参考图一的布局：大标题 + 洞察卡 + 双统计卡 + 分组列表） */
  function ledgerList(ctx) {
    const api = ctx.api;
    const cat = ctx.params.cat || '';
    const limit = ctx.params.limit || 40;
    const hl = ctx.params.hl || null;
    const ov = api.ledger.overview(14);
    const all = api.entry.list(cat ? { category: cat } : {});
    const list = all.slice(0, limit);
    const groups = {};
    list.forEach(e => { (groups[e.date] = groups[e.date] || []).push(e); });
    const dates = Object.keys(groups).sort().reverse();

    let html = '';

    /* ---------- 页头：大标题 + 条数 ----------
       记一笔的入口搬到这里：青年端的主按钮让给了「这一笔要不要花」
       （决策预演），记账降级成账单页里的一个动作 ——
       它仍然是整个产品的数据来源，但不该占着最显眼的位置。 */
    html += '<div class="lg-head">' +
      '<div><div class="lg-title">我的流水</div>' +
      '<div class="lg-sub">' + ov.count.toLocaleString('en-US') + ' 条记录</div></div>' +
      '<div class="row" style="gap:8px;align-items:center">' +
      '<button class="icon-btn" data-entry-new title="记下来（作为证据）">' + UI.icon('compose', 19) + '</button>' +
      '<div class="lg-mark">' + UI.icon('receipt', 46) + '</div>' +
      '</div>' +
      '</div>';

    /* ---------- 洞察卡：取当前最要紧的一条建议 ----------
       这是「预算偏差提醒」的落点：没做完「设置一次分类预算」之前，
       这里只给一张锁卡 —— 任务奖励说的就是这件事，得真的拦住。 */
    if (ctx.api.unlock.locked('budget_warn')) {
      html += LJ.lockedCard(ctx, 'budget_warn');
    } else {
      const sug = api.ai.suggestions();
      if (sug && sug.length) {
        const s0 = sug[0];
        html += '<div class="lg-insight" data-go="youth.ai">' +
          '<div class="t">' + (s0.icon || '✨') + ' ' + UI.esc(s0.title) + '</div>' +
          '<div class="d">' + UI.esc(s0.body) + '</div>' +
          '</div>';
      }
    }

    /* ---------- 双统计卡：左只读，右可点进「支出结构」 ----------
       data-shared-acct：首页黑卡「家庭支持协同账户」的共享元素落点。
       同宽 346（146 vs 170，只差 14%），是这一页里最贴近的对应物。 */
    html += '<div class="lg-duo" data-shared-acct>' +
      '<div class="lg-card">' +
      '<div class="n">¥' + U.won(ov.expense) + '</div>' +
      '<div class="k">' + ov.monthLabel + '总支出</div>' +
      '<div class="lg-line"><span>今日支出</span><b class="out">−¥' + U.won(ov.todayOut) + '</b></div>' +
      '<div class="lg-line"><span>今日收入</span><b class="in">¥' + U.won(ov.todayIn) + '</b></div>' +
      '</div>' +
      '<button class="lg-card lg-hit" data-structure>' +
      '<div class="n">¥' + U.won(ov.avgPerDay) + '</div>' +
      '<div class="k">' + ov.monthLabel + '日均支出</div>' +
      '<div class="lg-bars">' + ov.series.map(s => {
        const h = Math.max(3, Math.round(s.amount / ov.seriesMax * 44));
        const isToday = s.date === LJ.clock.now();
        return '<i style="height:' + h + 'px' + (isToday ? ';background:var(--ink)' : '') + '"></i>';
      }).join('') + '</div>' +
      '<div class="lg-axis"><span>' + Math.round(ov.seriesMax) + '</span><span>0.0</span></div>' +
      '</button>' +
      '</div>';

    /* ---------- 订阅阶梯栈（从首页搬来，动效原样） ---------- */
    html += LJ.subsBlock(api);

    /* ---------- 分段控件 + 工具 ---------- */
    html += '<div class="row" style="gap:9px;padding:18px 0 2px;align-items:center">' +
      '<div class="seg" style="flex:1">' + LEDGER_VIEWS.map(s =>
        '<button class="' + (s.id === 'list' ? 'on' : '') + '" data-v="' + s.id + '">' + s.name + '</button>'
      ).join('') + '</div>' +
      '<button class="icon-btn" data-go="youth.ai" title="智能助手">' + UI.icon('spark', 19) + '</button>' +
      '<button class="icon-btn" data-go="youth.import" title="导入账单">' + UI.icon('download', 19) + '</button>' +
      '</div>';

    if (!all.length) {
      html += UI.empty('🗂', '这里还没有记录', '记一笔之后，这里会按天汇总你的收支。');
      return html;
    }

    /* ---------- 分类筛选 ---------- */
    html += '<div class="row" style="gap:8px;padding:12px 2px 4px;overflow-x:auto">' +
      '<button class="chip ' + (!cat ? 'on' : '') + '" data-cat="">全部</button>' +
      LJ.CATEGORIES.map(c => '<button class="chip ' + (cat === c.id ? 'on' : '') +
        '" data-cat="' + c.id + '">' + c.icon + ' ' + c.name + '</button>').join('') +
      '</div>';

    /* ---------- 分组列表 ---------- */
    html += '<div class="sec-title">' + ov.monthLabel + '账单' +
      '<span class="more">' + (cat ? LJ.catById(cat).name : '全部') + '</span></div>';
    dates.forEach(d => {
      const day = groups[d];
      const o = day.filter(e => e.direction === 'out').reduce((s, e) => s + e.amount, 0);
      const i = day.filter(e => e.direction === 'in').reduce((s, e) => s + e.amount, 0);
      html += '<div class="lg-daygroup">' +
        '<div class="lg-dayhead"><span class="d">' + U.ymdCN(d) + '</span>' +
        '<span class="s">支出:¥' + U.won(o) + ' | 收入:¥' + U.won(i) + '</span></div>' +
        '<div class="list">' + day.map(e => entryRow(e, ctx, hl)).join('') + '</div>' +
        '</div>';
    });

    if (all.length > list.length) {
      html += '<button class="btn ghost mt20" data-more>再加载 ' +
        Math.min(40, all.length - list.length) + ' 笔</button>';
    } else {
      html += '<div class="xs muted" style="text-align:center;padding:22px 0">— 已经到底了 —</div>';
    }
    return html;
  }

  P['youth.ledger'] = {
    title: '流水', chrome: 'tab', hideNav: true,
    render(ctx) {
      const view = ctx.params.view || 'list';
      let html = '<div class="pad">';

      /* 明细视图自带页头（大标题 + 条数），所以上面不走通用分段控件那一行 */
      if (view !== 'list') {
        html += '<div class="row" style="gap:9px;padding:14px 0 2px;align-items:center">' +
          '<div class="seg" style="flex:1">' + LEDGER_VIEWS.map(s =>
            '<button class="' + (s.id === view ? 'on' : '') + '" data-v="' + s.id + '">' + s.name + '</button>'
          ).join('') + '</div>' +
          '<button class="icon-btn" data-go="youth.ai" title="智能助手">' + UI.icon('spark', 19) + '</button>' +
          '<button class="icon-btn" data-entry-new title="记一笔">' + UI.icon('compose', 19) + '</button>' +
          '<button class="icon-btn" data-go="youth.import" title="导入账单">' + UI.icon('download', 19) + '</button>' +
          '</div>';
      }

      if (view === 'list') html += ledgerList(ctx);
      else if (view === 'cycle') {
        /* 周期视图是成长任务解锁出来的（t_record7 连续记账 7 天）。
           没解锁就显示"完成任务解锁"的卡，不是把入口藏起来。 */
        html += ctx.api.unlock.has('cycle_view')
          ? asView('youth.cycle', ctx)
          : '<div style="padding-top:14px">' + LJ.lockedCard(ctx, 'cycle_view') + '</div>';
      }
      else if (view === 'subs') html += asView('youth.subs', ctx);
      else if (view === 'review') html += asView('youth.review', ctx);

      html += '</div>';
      return html;
    },
    mount(el, ctx) {
      const view = ctx.params.view || 'list';
      el.querySelectorAll('[data-v]').forEach(n => {
        n.onclick = () => ctx.replace('youth.ledger', { view: n.getAttribute('data-v') });
      });

      el.querySelectorAll('[data-go]').forEach(n => {
        n.onclick = () => ctx.go(n.getAttribute('data-go'));
      });
      /* 记一笔（从悬浮按钮降级到这里的动作） */
      el.querySelectorAll('[data-entry-new]').forEach(n => {
        n.onclick = () => { if (LJ.openEntrySheet) LJ.openEntrySheet(); };
      });
      /* 右卡 → 支出结构（用卡片缩放转场，和首页两张卡一致） */
      el.querySelectorAll('[data-structure]').forEach(n => {
        n.onclick = () => LJ.router.zoomPush('youth.structure', {}, n);
      });
      if (view === 'list') {
        LJ.subsMount(el);   /* 订阅阶梯栈的折叠⇄展开（首页搬来的那套动效） */
        el.querySelectorAll('[data-cat]').forEach(n => {
          n.onclick = () => ctx.replace('youth.ledger', { view: 'list', cat: n.getAttribute('data-cat') });
        });
        el.querySelectorAll('[data-entry]').forEach(n => {
          n.onclick = () => ctx.go('youth.entryDetail', { id: n.getAttribute('data-entry') });
        });
        const more = el.querySelector('[data-more]');
        if (more) more.onclick = () => ctx.replace('youth.ledger', {
          view: 'list', cat: ctx.params.cat || '', limit: (ctx.params.limit || 40) + 40
        });
      } else {
        LJ.bindLocked(el, ctx);
        const locked = view === 'cycle' && !ctx.api.unlock.has('cycle_view');
        const p = locked ? null
          : LJ.pages[view === 'cycle' ? 'youth.cycle' : view === 'subs' ? 'youth.subs' : 'youth.review'];
        if (p && p.mount) p.mount(el, ctx);
      }
    }
  };

  /* ============================================================
     记一笔
     ============================================================ */
  /* 收入分类：pool = 默认入哪个池，ask = 是否需要用户确认
     来源明确的（生活费、专项支持）自动入池不打扰；
     来源模糊的（奖学金、红包、理财）必须让用户过一眼 ——
     亲戚红包可能是父母转交的，理财本金可能来自父母，只有用户知道。 */
  LJ.INCOME_CATS = [
    { id: 'support', name: '生活费', icon: '🏦', pool: 'family', ask: false, note: '父母转入' },
    { id: 'directed', name: '专项支持', icon: '🎯', pool: 'family', ask: false, note: '定向用途' },
    { id: 'scholar', name: '奖学金', icon: '🏅', pool: 'own', ask: true },
    { id: 'redpacket', name: '红包', icon: '🧧', pool: 'own', ask: true },
    { id: 'invest', name: '理财收益', icon: '📈', pool: 'own', ask: true },
    { id: 'refund', name: '退款', icon: '↩️', pool: 'family', ask: true },
    { id: 'other', name: '其他', icon: '✳️', pool: '', ask: true }
  ];

  /* 记一笔：以弹层形式打开（复用页面本体，动效和待办弹层一致）
     页面本体仍然保留，深链 ?p=youth.entry 照旧可用 */
  LJ.openEntrySheet = function () {
    const page = LJ.pages['youth.entry'];
    if (!page) return;
    UI.sheet({
      mount(el, close) {
        el.style.padding = '6px 0 0';          // 页面自己带 .pad，弹层不要再叠一层
        const box = document.createElement('div');
        const ctx = {
          api: LJ.api.self(), params: {}, page: page, layer: el,
          go() { }, replace() { }, reset() { }, refresh() { }, refreshTop() { },
          back() { close(); }
        };
        box.innerHTML = page.render(ctx);
        el.appendChild(box);
        page.mount(box, ctx);
      }
    });
  };

  /* 这一笔要不要花 —— 决策沙盘 v1（悬浮按钮）
     理财能力长在「钱不够、必须取舍」的那一刻，而记账只在事后记录结果。
     所以青年端的主按钮从「记一笔」（后视镜）换成决策预演（挡风玻璃）：
     输入金额，当场用**他自己的真实账本**推演出两种结局的差别。

     ★ 不评判、不劝阻，只把机会成本换算成他熟悉的单位（每天还能花多少）。
       文档 3.3.2 要求中性化表达，产品不做消费道德评判 ——
       所以这里没有"别买了"，只有"买了之后每天是 ¥X，不买是 ¥Y"。

     ★ 记一笔没有消失：账单页和首页缺口卡各留了入口。
       真实形态下（内嵌工行 APP）流水由账户自动进来，手动记账本来就是脚手架，
       脚手架不该占着最显眼的位置 —— 这个取舍本身就是产品哲学。 */
  LJ.openSpendSheet = function () {
    const api = LJ.api.self();
    const bp = api.dashboard().budget;
    const daysLeft = Math.max(0, bp.totalDays - bp.passed);
    const remaining = Math.round(bp.remaining);
    const perDay = n => Math.round(Math.max(0, n) / Math.max(1, daysLeft));
    /* 当前真实节奏：本周期已花的日均。用它推演"照这样花下去会怎样"。 */
    const pace = Math.round(bp.spent / Math.max(1, bp.passed));

    UI.sheet({
      title: '这一笔要不要花',
      sub: '按你本周期剩下的预算算，不评判，只算数',
      body: '<div class="ss">' +
        '<div class="ss-in"><span class="cur">¥</span>' +
        '<input id="ssAmt" type="text" inputmode="decimal" placeholder="输入金额" autocomplete="off"></div>' +
        '<div class="ss-chips">' +
        [50, 100, 200, 500].map(v =>
          '<button class="chip" data-amt="' + v + '">¥' + v + '</button>').join('') +
        '</div>' +
        '<div id="ssOut"></div>' +
        /* 决策和记账是一件事的两面：想清楚要不要花，和已经花了记下来。
           把「记一笔」放在这里，比放在悬浮按钮上更贴近用户的真实时刻。 */
        '<button class="ss-more" data-entry>已经花了？记一笔 →</button>' +
        '</div>',
      mount(el, close) {
        const input = el.querySelector('#ssAmt');
        const out = el.querySelector('#ssOut');
        el.querySelector('[data-entry]').onclick = () => {
          close();
          setTimeout(() => { if (LJ.openEntrySheet) LJ.openEntrySheet(); }, 180);
        };

        function paint() {
          const A = Number(String(input.value).replace(/[^0-9.]/g, '')) || 0;

          if (!(A > 0)) {
            out.innerHTML =
              '<div class="ss-base">现在：本周期还剩 <b>¥' + U.wonInt(Math.max(0, remaining)) +
              '</b>，' + daysLeft + ' 天，每天能花 <b>¥' + perDay(remaining) + '</b></div>' +
              '<div class="ss-hint">输入金额，看看买了之后这个周期会变成什么样。</div>';
            return;
          }

          const after = remaining - A;
          const bd = perDay(remaining), ad = perDay(after);
          const drop = bd > 0 ? Math.round((1 - ad / bd) * 100) : 0;
          const overNow = remaining < 0;
          const overAfter = after < 0;

          /* 两条线各能撑多少天（按当前真实节奏） */
          const keepDays = pace > 0 ? remaining / pace : daysLeft;
          const buyDays = pace > 0 ? Math.max(0, after) / pace : daysLeft;
          const sooner = Math.max(0, Math.round(keepDays - buyDays));
          /* ★ 只有**真的在本周期内用完**时才谈"提前几天"。
             图上两条线都被截在周期末（不画到未来），如果两者都撑得比周期长，
             图上看不出差别、文案却说"提前 N 天用完" —— 图和文字就打架了。
             所以这里按"谁会在周期内用完"分三种情况说，文案只说图能证明的话。 */
          const keepOut = pace > 0 && remaining > 0 && keepDays <= daysLeft;
          const buyOut = pace > 0 && after > 0 && buyDays <= daysLeft;
          let runway = '';
          if (remaining > 0 && pace > 0 && sooner > 0) {
            if (buyOut && keepOut) {
              runway = '<br>按现在的节奏（每天 ¥' + U.wonInt(pace) + '），不买会在第 ' +
                Math.ceil(keepDays) + ' 天用完，买了第 ' + Math.ceil(buyDays) +
                ' 天就用完 —— <b>提前 ' + sooner + ' 天</b>。';
            } else if (buyOut && !keepOut) {
              runway = '<br>按现在的节奏（每天 ¥' + U.wonInt(pace) + '），不买能撑到周期末；' +
                '买了会在第 ' + Math.ceil(buyDays) + ' 天用完 —— <b>提前 ' + sooner + ' 天</b>。';
            } else {
              runway = '<br>按现在的节奏（每天 ¥' + U.wonInt(pace) + '），这一笔不会让本周期' +
                '提前用完；但每天的可花额度会从 ¥' + bd + ' 降到 ¥' + ad + '。';
            }
          }

          out.innerHTML =
            '<div class="ss-cmp">' +
            '<div class="ss-col"><div class="k">不买</div>' +
            '<div class="v">¥' + bd + '</div><div class="u">每天还能花</div></div>' +
            '<div class="ss-col after"><div class="k">买了</div>' +
            '<div class="v">¥' + ad + '</div><div class="u">每天还能花</div></div>' +
            '</div>' +
            (drop > 0 ? '<div class="ss-drop">每天的可花额度少 ' + drop + '%</div>' : '') +
            /* 曲线：不买 / 买了 分别能撑多久。比两个静态数字更能说明代价 ——
               触底点的左右位置差，就是这一笔花掉的时间。 */
            UI.chartSandbox({
              remaining: remaining, amount: A, pace: pace, daysLeft: daysLeft
            }) +
            (remaining > 0 && pace > 0
              ? '<div class="row" style="gap:14px;margin-top:10px;flex-wrap:wrap">' +
              '<span class="ch-k"><i style="background:var(--ink)"></i>不买</span>' +
              '<span class="ch-k"><i style="background:var(--coral)"></i>买了</span>' +
              '<span class="ch-k"><i style="background:var(--muted)"></i>按预算的节奏</span>' +
              '</div>'
              : '') +
            '<div class="ss-note">' +
            (overAfter && !overNow
              ? '这一笔会让本周期从「还在预算内」变成超预算 ¥' + U.wonInt(Math.abs(after)) + '。'
              : overAfter
                ? '本周期已经超预算 ¥' + U.wonInt(Math.abs(remaining)) +
                '，加上这一笔会超 ¥' + U.wonInt(Math.abs(after)) + '。'
                : '买了之后本周期仍在预算内，还剩 ¥' + U.wonInt(after) + '。') +
            /* 关键那句：把"钱变少了"翻译成"能撑的天数变少了"。
               文案由 runway 按"谁会在周期内用完"分三种情况生成 ——
               绝不承诺图上看不出来的差别。 */
            runway +
            '</div>' +
            '<div class="ss-hint">按你本周期真实的预算剩余、已花日均和剩余天数算的。</div>';
        }

        input.oninput = paint;
        el.querySelectorAll('[data-amt]').forEach(b => {
          b.onclick = () => {
            input.value = b.getAttribute('data-amt');
            paint();
          };
        });
        paint();
        setTimeout(() => { try { input.focus(); } catch (e) {} }, 320);
      }
    });
  };

  P['youth.entry'] = {
    title: '记一笔', chrome: 'full', keepAlive: true,
    render(ctx) {
      const bal = ctx.api.account.detail().balances;
      const cats = LJ.CATEGORIES;
      const icats = LJ.INCOME_CATS;

      /* 一行 4 个圆格，最多两行 */
      /* 分类格：默认只露两行（8 个），其余折起来 —— 12 类摊三行太占地方 */
      const COLS = 4, ROWS = 2, MAXV = COLS * ROWS;
      const btn = (c, attr) => '<button class="es-cat" data-' + attr + '="' + c.id + '">' +
        '<i>' + c.icon + '</i><span>' + c.name + '</span></button>';
      const grid = (list, attr) => {
        const head = list.slice(0, MAXV), tail = list.slice(MAXV);
        return '<div class="es-cats">' + head.map(c => btn(c, attr)).join('') + '</div>' +
          (tail.length
            ? '<div class="es-cats" id="esMore" hidden>' + tail.map(c => btn(c, attr)).join('') + '</div>' +
            '<button class="es-expand" data-expand>展开另外 ' + tail.length + ' 类' +
            UI.icon('chevron', 12) + '</button>'
            : '');
      };

      return '<div class="es">' +
        '<div class="es-head">' +
        '<button class="es-cancel" data-close>取消</button>' +
        '<div class="es-mode" data-mode>' +
        '<button class="on" data-m="out">支出</button>' +
        '<button data-m="in">收入</button></div>' +
        '<button class="es-done" id="esDone" disabled>完成</button>' +
        '</div>' +

        '<div class="es-input">' +
        '<div class="es-amt"><span class="cur">¥</span>' +
        '<input id="esAmount" type="text" inputmode="decimal" placeholder="输入金额" autocomplete="off"></div>' +
        '<div class="es-line"></div>' +
        '<div class="es-meta">' +
        '<button class="es-chip" data-noop>今天</button>' +
        '<button class="es-chip" data-noop id="esTime">' +
        new Date().toTimeString().slice(0, 5) + '</button>' +
        '<button class="es-chip fund" id="esFund" data-fund>🏦 支持金 · ¥' + U.won(bal.family) + '</button>' +
        '<input id="esNote" placeholder="请输入备注" autocomplete="off">' +
        '</div>' +
        /* 专项单独占一行：和资金池那两个 chip 挤在一行会溢出
           （实测四个 chip 需要 460px，一行只有 314px，备注框会被顶到屏幕外） */
        '<button class="es-special" id="esSpecial" hidden></button></div>' +

        '<div class="es-warn" id="esWarn" hidden></div>' +

        '<div id="esCatOut">' + grid(cats, 'cat') + '</div>' +
        '<div id="esCatIn" hidden>' + grid(icats, 'icat') + '</div>' +
        '</div>';
    },
    mount(el, ctx) {
      let cat = null, mode = 'out', fund = 'family', special = null;
      const bal = ctx.api.account.detail().balances;
      const input = el.querySelector('#esAmount');
      const note = el.querySelector('#esNote');
      const done = el.querySelector('#esDone');
      const fundChip = el.querySelector('#esFund');
      const spChip = el.querySelector('#esSpecial');
      const warn = el.querySelector('#esWarn');

      /* 专项资金：选中大类之后，如果有对得上的生效专项，就冒出一整行。
         对得上就默认挂上 —— 这正是那个专项存在的理由；
         对不上也说清楚，别让人以为钱花不出去。 */
      const paintSpecial = () => {
        if (!spChip) return;
        const usable = ctx.api.fund.usable();
        if (mode !== 'out' || !cat || !usable.length) {
          spChip.hidden = true; special = null; return;
        }
        const f = ctx.api.fund.matchFor(cat);
        spChip.hidden = false;
        if (!f) {
          special = null;
          const other = usable.find(x => x.category !== cat);
          spChip.classList.add('off');
          spChip.classList.remove('on');
          spChip.innerHTML = '<span>🎯 ' + UI.esc(other.name) + '</span>' +
            '<span class="rm">只能用于' + LJ.catById(other.category).name + '</span>';
          return;
        }
        const p = ctx.api.fund.progress(f);
        spChip.classList.remove('off');
        special = special || f.id;          // 默认挂上
        const on = special === f.id;
        spChip.classList.toggle('on', on);
        /* 文案要短：这一行内宽只有 286px，写「从「XX」扣 · 剩 ¥Y」会截断 */
        spChip.innerHTML = '<span>🎯 ' + UI.esc(f.name) + '</span>' +
          '<span class="rm">' + (on ? '剩 ¥' + U.won(p.remaining) : '不从这里扣') + '</span>';
      };
      if (spChip) spChip.onclick = () => {
        const f = ctx.api.fund.matchFor(cat);
        if (!f) return;
        special = special === f.id ? null : f.id;
        paintSpecial();
      };

      const paintFund = () => {
        fundChip.textContent = (fund === 'family' ? '🏦 支持金 · ¥' + U.won(bal.family)
          : '👤 自有 · ¥' + U.won(bal.own));
        fundChip.classList.toggle('own', fund === 'own');
      };
      /* 平时静默；只有这笔会让家庭支持金花超时才提示 */
      const checkFund = () => {
        const n = Number(input.value) || 0;
        if (mode !== 'out' || n <= bal.family) { warn.hidden = true; return; }
        warn.hidden = false;
        warn.innerHTML = '这笔会让家庭支持金花超 ¥' + U.won(n - bal.family) +
          '<button data-switch>改用自有</button>';
        warn.querySelector('[data-switch]').onclick = () => { fund = 'own'; paintFund(); checkFund(); };
      };
      const sync = () => {
        done.disabled = !(cat && Number(input.value) > 0);
        checkFund();
      };

      input.oninput = sync;
      fundChip.onclick = () => { fund = fund === 'family' ? 'own' : 'family'; paintFund(); checkFund(); };

      el.querySelectorAll('[data-cat],[data-icat]').forEach(b => {
        b.onclick = () => {
          cat = b.getAttribute('data-cat') || b.getAttribute('data-icat');
          el.querySelectorAll('[data-cat],[data-icat]').forEach(x => x.classList.toggle('on', x === b));
          /* 收入：来源明确的自动入池，模糊的预选自有，其他必选 */
          if (mode === 'in') {
            const c = LJ.INCOME_CATS.find(x => x.id === cat) || {};
            if (!c.ask) { fund = c.pool; paintFund(); }
            else if (c.pool) { fund = c.pool; paintFund(); }
            else { fund = ''; fundChip.textContent = '选择资金池'; fundChip.classList.add('own'); }
          }
          sync();
          paintSpecial();
        };
      });

      el.querySelectorAll('[data-mode] button').forEach(b => {
        b.onclick = () => {
          mode = b.getAttribute('data-m');
          el.querySelectorAll('[data-mode] button').forEach(x => x.classList.toggle('on', x === b));
          el.querySelector('#esCatOut').hidden = mode !== 'out';
          el.querySelector('#esCatIn').hidden = mode !== 'in';
          cat = null; input.value = '';
          el.querySelectorAll('[data-cat],[data-icat]').forEach(x => x.classList.remove('on'));
          fund = 'family'; paintFund();
          special = null; paintSpecial();
          sync();
        };
      });

      el.querySelector('[data-close]').onclick = () => ctx.back();

      /* 展开 / 收起剩下的分类 */
      el.querySelectorAll('[data-expand]').forEach(b => {
        b.onclick = () => {
          const box = el.querySelector('#' + (mode === 'in' ? 'esMore2' : 'esMore')) ||
            b.previousElementSibling;
          const more = b.previousElementSibling;
          const open = more.hidden;
          more.hidden = !open;
          const tail = more.children.length;
          b.innerHTML = (open ? '收起' : '展开另外 ' + tail + ' 类') + UI.icon('chevron', 12);
          b.classList.toggle('open', open);
        };
      });

      done.onclick = () => {
        try {
          const isIn = mode === 'in';
          if (!cat) throw new Error(isIn ? '请选择收入类型' : '请选择支出大类');
          if (!fund) throw new Error('请选择这笔计入哪个池');
          const rec = ctx.api.entry.create({
            amount: Number(input.value),
            direction: isIn ? 'in' : 'out',
            category: cat,
            title: isIn ? (LJ.INCOME_CATS.find(c => c.id === cat) || {}).name : null,
            merchant: note.value.trim(),
            fundingSource: fund,
            /* 挂到专项上：这笔就从专项的余额里扣，家人那边看到的是进度涨了 */
            fundId: isIn ? null : special
          });
          UI.toast(isIn ? '已记入 · ' + rec.title + ' ¥' + U.won(rec.amount)
            : '已记一笔 · ' + LJ.catById(rec.category).name + ' ¥' + U.won(rec.amount) +
            (special ? '（记入专项）' : ''));
          ctx.back();
        } catch (e) { UI.toast(e.message); }
      };
      paintFund();
    }
  };

  /* ============================================================
     账单详情
     ============================================================ */
  P['youth.entryDetail'] = {
    title: '账单详情', chrome: 'plain',
    render(ctx) {
      const e = ctx.api.entry.get(ctx.params.id);
      if (!e) return UI.empty('🔍', '记录不存在');
      const c = LJ.catById(e.category);
      const isIn = e.direction === 'in';
      return '<div class="pad mt16">' +
        '<div class="card" style="text-align:center;padding:30px 16px">' +
        '<div style="font-size:30px">' + (isIn ? '↓' : c.icon) + '</div>' +
        '<div class="big-num" style="font-size:32px;margin-top:10px">' + (isIn ? '+' : '−') + U.won(e.amount) + '</div>' +
        '<div class="sm muted mt8" style="margin-top:6px">' + UI.esc(e.merchant || e.title || c.name) + '</div>' +
        '</div>' +
        '<div class="list mt16">' +
        row('类型', isIn ? '入账' : '支出') +
        row('大类', isIn ? '—' : c.name) +
        row('资金来源', e.fundingSource === 'family' ? '家庭支持金' : '个人自有资金') +
        row('日期', e.date + ' 周' + U.weekday(e.date)) +
        row('来源', { manual: '手动记录', seed: '历史数据', support: '支持对账', import: '账单导入' }[e.source] || e.source) +
        row('备注', e.note || '—') +
        '</div>' +
        '<button class="btn ghost mt20" id="delEntry">删除这笔记录</button>' +
        '</div>';
      function row(k, v) {
        return '<div class="li"><div class="grow sm muted">' + k + '</div><div class="sm" style="font-weight:500">' + UI.esc(v) + '</div></div>';
      }
    },
    mount(el, ctx) {
      el.querySelector('#delEntry').onclick = () => {
        UI.confirm({
          title: '删除这笔记录？', desc: '删除后不可恢复。',
          okText: '删除',
          onOk() { ctx.api.entry.remove(ctx.params.id); UI.toast('已删除'); ctx.back(); }
        });
      };
    }
  };

  function sum0(n) { return '¥' + Math.round(n); }
  function planRow(icon, bg, title, sub, to) {
    return '<div class="li" data-go="' + to + '"><div class="ico" style="background:' + bg + '">' + icon + '</div>' +
      '<div class="grow"><div style="font-size:14.5px;font-weight:500">' + UI.esc(title) + '</div>' +
      '<div class="xs muted" style="margin-top:3px">' + UI.esc(sub) + '</div></div><div class="muted">›</div></div>';
  }

  /* ============================================================
     协商
     ============================================================ */
  P['youth.talk'] = {
    title: '往来', chrome: 'tab',
    render(ctx) {
      const api = ctx.api;
      const pend = api.support.pending();
      const mine = api.request.mine();
      const records = api.support.list().slice(0, 5);
      const cfg = api.disclosure.current();
      let html = '<div class="pad">';

      /* 待我处理：首页搬来的待办（风险/确认/邀约/方案）+ 原「待我确认」合并成一处 */
      html += LJ.todosBlock(api);

      html += '<div class="sec-title">发起支持协商</div>';
      html += '<div class="grid2">' + LJ.REQUEST_TEMPLATES.slice(0, 4).map(t =>
        '<button class="card flat" data-tpl="' + t.id + '" style="text-align:left;padding:14px">' +
        '<div style="font-size:20px">' + t.icon + '</div>' +
        '<div style="font-size:13.5px;font-weight:600;margin-top:8px">' + t.name + '</div>' +
        '<div class="xs muted" style="margin-top:3px">标准化申请</div></button>').join('') + '</div>';

      html += '<div class="sec-title">我发起的</div>';
      if (!mine.length) {
        html += '<div class="card flat"><div class="sm muted" style="text-align:center;padding:10px 0">还没有发起过申请</div></div>';
      } else {
        const ST = { pending: ['待响应', 'warn'], full: ['已全额支持', 'ok'], partial: ['部分支持', 'info'], defer: ['暂缓', 'gray'], reject: ['暂不处理', 'gray'] };
        html += '<div class="list">' + mine.map(r => {
          const s = ST[r.status] || ST.pending;
          return '<div class="li"><div class="ico" style="background:#EDE9FB">✉️</div>' +
            '<div class="grow"><div style="font-size:14.5px;font-weight:500">' + UI.esc(r.name) + '</div>' +
            '<div class="xs muted" style="margin-top:2px">' + U.ymdCN(r.date) + (r.responseNote ? ' · ' + UI.esc(r.responseNote) : '') + '</div></div>' +
            '<div style="text-align:right"><div class="amt">¥' + U.won(r.responseAmount || r.amount) + '</div>' +
            '<span class="tag ' + s[1] + '" style="margin-top:5px">' + s[0] + '</span></div></div>';
        }).join('') + '</div>';
      }

      html += '<div class="sec-title">往来的支持</div>';
      /* 折叠：默认只露前 3 笔 */
      html += '<div class="list">' + UI.fold('youth.records', records.map(r =>
        '<div class="li"><div class="ico" style="background:#DFFAEC">💠</div>' +
        '<div class="grow"><div class="ellipsis" style="font-size:14.5px">' + UI.esc(r.purpose) + '</div>' +
        '<div class="xs muted" style="margin-top:2px">' + U.ymdCN(r.date) + ' · ' +
        ({ confirmed: '已对账', pending: '待对账', declined: '已谢绝' }[r.status] || r.status) + '</div></div>' +
        '<div class="amt">¥' + U.won(r.amount) + '</div></div>')) + '</div>';

      /* 常用工具 —— 折叠：默认只露前 3 个 */
      const toolRow = (to, ico, title, sub, tail) =>
        '<div class="li" data-go="' + to + '"><div class="ico">' + ico + '</div><div class="grow">' +
        '<div style="font-size:14.5px">' + title + '</div>' +
        '<div class="xs muted" style="margin-top:2px">' + sub + '</div></div>' +
        (tail || '<div class="muted">›</div>') + '</div>';
      html += '<div class="sec-title">常用工具</div><div class="list">' + UI.fold('youth.tools', [
        toolRow('youth.scripts', '💬', '边界沟通话术', '用非对抗的方式说明你的想法'),
        toolRow('youth.share', '🧾', '生成脱敏账单', '只含宏观数据，主动同步给家人'),
        toolRow('youth.prepay', '📄', '预支与还款', '把再一次开口要钱变成一次资金安排'),
        toolRow('youth.invites', '🎁', '收到的支持邀约', '家人主动给你的支持，可收下或谢绝',
          api.invite.pending().length ? '<span class="tag danger">' + api.invite.pending().length + '</span>' : ''),
        toolRow('youth.savings', '🎯', '共同储蓄目标', '和家人一起存一笔钱'),
        toolRow('youth.service', '🎧', '客服与紧急求助', '智能客服、反诈专线')
      ]) + '</div>';

      /* 信息边界：和「我的」是同一批页面的两个入口 */
      html += '<div class="sec-title">人情往来<span class="more" data-go="youth.favor">全部</span></div>';
      const favorOv = api.favor.overview();
      html += '<div class="card" data-go="youth.favor">' +
        '<div class="row between">' +
        '<div class="stat sm"><div class="n">¥' + favorOv.outTotal + '</div><div class="k">今年送出</div></div>' +
        '<div class="stat sm" style="text-align:right"><div class="n">¥' + favorOv.inTotal + '</div>' +
        '<div class="k">今年收到</div></div>' +
        '</div>' +
        (favorOv.pending.length
          ? '<div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line-2)">' +
          favorOv.pending.slice(0, 2).map(p =>
            '<div class="row" style="gap:9px;margin-bottom:7px">' +
            '<span style="font-size:14px">' + p.icon + '</span>' +
            '<span class="xs t2" style="line-height:1.5">' + UI.esc(p.text) + '</span></div>').join('') +
          '</div>'
          : '<div class="xs muted" style="margin-top:12px">今年的人情往来都是平的</div>') +
        '</div>';

      html += '<div class="sec-title">信息边界<span class="more" data-go="youth.mode">当前：' + cfg.name + '</span></div>';
      html += '<div class="list">' +
        '<div class="li" data-go="youth.mode"><div class="ico" style="background:#EDE9FB">📜</div>' +
        '<div class="grow"><div style="font-size:14.5px">省心模式</div>' +
        '<div class="xs muted" style="margin-top:2px">决定家人能看到什么，改动需双方确认</div></div><div class="muted">›</div></div>' +
        '<div class="li" data-go="youth.grants"><div class="ico" style="background:#EDE9FB">🔑</div>' +
        '<div class="grow"><div style="font-size:14.5px">授权中心</div>' +
        '<div class="xs muted" style="margin-top:2px">' +
        api.grant.list().filter(g => g.status === 'active').length + ' 项生效中 · 可随时撤回</div></div><div class="muted">›</div></div>' +
        '<div class="li" data-go="common.audit"><div class="ico" style="background:#FFF0D4">🧾</div>' +
        '<div class="grow"><div style="font-size:14.5px">留痕记录</div>' +
        '<div class="xs muted" style="margin-top:2px">谁在什么时候改了什么、看了什么</div></div><div class="muted">›</div></div>' +
        '</div>';

      html += '</div>';
      return html;
    },
    mount(el, ctx) {
      LJ._bindGo(el, ctx);
      UI.bindFold(el);
      LJ.bindTodos(el, ctx);   /* 待我处理的行点击（风险/确认/邀约/方案） */
      el.querySelectorAll('[data-confirm]').forEach(b => {
        b.onclick = () => {
          UI.confirm({
            title: '确认收到这笔支持？',
            desc: '确认后会记入你的账本，双方各留存一笔对账记录。',
            okText: '确认收到',
            onOk() { ctx.api.support.confirm(b.getAttribute('data-confirm')); UI.toast('已确认并计入账本'); }
          });
        };
      });
      el.querySelectorAll('[data-tpl]').forEach(b => {
        b.onclick = () => ctx.go('youth.requestNew', { tpl: b.getAttribute('data-tpl') });
      });
    }
  };

  /* ============================================================
     发起支持申请
     ============================================================ */
  P['youth.requestNew'] = {
    title: '发起协商', chrome: 'plain', keepAlive: true,
    render(ctx) {
      const tpl = LJ.REQUEST_TEMPLATES.find(t => t.id === ctx.params.tpl) || LJ.REQUEST_TEMPLATES[0];
      return '<div class="pad">' +
        '<div class="proto mt16"><div class="ph"><span class="seal">议</span>标准化协商</div>' +
        '<div class="sm t2" style="line-height:1.7">你填写的内容会以结构化卡片发送给家人，' +
        '不会附带任何消费流水。所有响应都会留痕。</div></div>' +

        '<div class="sec-title">申请类型</div>' +
        '<div class="cats">' + LJ.REQUEST_TEMPLATES.map(t =>
          '<button class="cat ' + (t.id === tpl.id ? 'on' : '') + '" data-tpl="' + t.id + '">' +
          '<span class="ci">' + t.icon + '</span><span class="cn">' + t.name + '</span></button>').join('') + '</div>' +

        '<div class="sec-title">金额</div>' +
        '<input id="rqAmount" type="number" inputmode="decimal" placeholder="0.00" value="" ' +
        'style="width:100%;height:50px;border:1px solid var(--line);border-radius:12px;padding:0 14px;' +
        'font-family:var(--mono);font-size:20px;outline:none;background:var(--card)">' +

        '<div class="sec-title">说明</div>' +
        '<textarea id="rqReason" rows="3" placeholder="' + UI.esc(tpl.placeholder) + '" ' +
        'style="width:100%;border:1px solid var(--line);border-radius:12px;padding:12px 14px;outline:none;' +
        'background:var(--card);resize:none;line-height:1.6"></textarea>' +

        '<label class="row mt16" style="gap:10px;cursor:pointer">' +
        '<input type="checkbox" id="rqInstall" style="width:18px;height:18px">' +
        '<span class="sm t2">希望以预支方式处理，下个周期归还</span></label>' +

        '<div class="proto mt16"><div class="ph"><span class="seal">示</span>对方将看到</div>' +
        '<div class="sm t2" style="line-height:1.8">类型：<b id="pvName">' + tpl.name + '</b><br>' +
        '金额：<b id="pvAmount">待填写</b><br>' +
        '说明：<span id="pvReason" class="muted">待填写</span></div></div>' +

        '<button class="btn mt20" id="rqSend">发送申请</button>' +
        '<div style="height:30px"></div></div>';
    },
    mount(el, ctx) {
      let tplId = ctx.params.tpl;
      const amt = el.querySelector('#rqAmount'), rsn = el.querySelector('#rqReason');
      function sync() {
        const tpl = LJ.REQUEST_TEMPLATES.find(t => t.id === tplId);
        el.querySelector('#pvName').textContent = tpl.name;
        el.querySelector('#pvAmount').textContent = Number(amt.value) > 0 ? '¥' + U.won(Number(amt.value)) : '待填写';
        el.querySelector('#pvReason').textContent = rsn.value || '待填写';
      }
      amt.oninput = sync; rsn.oninput = sync;
      el.querySelectorAll('[data-tpl]').forEach(b => {
        b.onclick = () => {
          tplId = b.getAttribute('data-tpl');
          el.querySelectorAll('[data-tpl]').forEach(x => x.classList.toggle('on', x === b));
          rsn.placeholder = LJ.REQUEST_TEMPLATES.find(t => t.id === tplId).placeholder;
          sync();
        };
      });
      el.querySelector('#rqSend').onclick = () => {
        const tpl = LJ.REQUEST_TEMPLATES.find(t => t.id === tplId);
        const v = Number(amt.value);
        if (!(v > 0)) return UI.toast('请填写金额');
        ctx.api.request.create({
          template: tplId, name: tpl.name, amount: v, reason: rsn.value.trim(),
          installment: el.querySelector('#rqInstall').checked
        });
        UI.toast('已发送，等待家人响应');
        ctx.back();
      };
    }
  };

  /* ============================================================
     话术库
     ============================================================ */
  P['youth.scripts'] = {
    title: '边界沟通话术', chrome: 'plain',
    render() {
      const S = [
        { t: '家人想看你这个月每笔花销', c: '我知道你担心我花钱没数。这个月我按大类做了预算，超支的部分我自己也看到了。我把分类的支出情况整理给你，具体的每一笔我想自己先捋一捋，有需要我再跟你细说。' },
        { t: '被问到"钱都花哪去了"', c: '这个月主要花在吃饭和教材上，占比大概七成。我之前记了一笔账，可以给你看汇总，具体的明细我想自己管着，这样我更容易养成习惯。' },
        { t: '需要一笔额外支持但不想被追问', c: '这次要报一个证，费用是 XXX，我算过是必要的开支。报名截止是 X 号，你看方便的时候帮我一下，我这边也会从生活费里挪一部分出来。' },
        { t: '生活费想调整', c: '我这几个月记账下来，发现固定支出大概是 XXX。下个周期想按这个数试试，如果不够我再跟你说，不想每次都临时开口。' },
        { t: '想减少家里的支持', c: '我这学期拿了奖学金，也想试着多管一点自己的钱。下个月开始生活费可以少一些，我想看看自己能不能转得过来。' }
      ];
      return '<div class="pad">' +
        '<div class="proto mt16"><div class="ph"><span class="seal">说</span>为什么要有话术</div>' +
        '<div class="sm t2" style="line-height:1.7">很多冲突不是因为钱，而是因为没找到说法。' +
        '这里给你一些参考，你可以改成自己的语气再发出去。</div></div>' +
        '<div class="mt20">' + S.map((s, i) =>
          '<div class="card mt12" style="margin-bottom:12px">' +
          '<div class="sm" style="font-weight:600;margin-bottom:8px">' + UI.esc(s.t) + '</div>' +
          '<div class="sm t2" style="line-height:1.8">' + UI.esc(s.c) + '</div>' +
          '<button class="btn ghost sm mt12" style="margin-top:12px" data-copy="' + i + '">复制这段话</button>' +
          '</div>').join('') + '</div></div>';
    },
    mount(el) {
      const S = el.querySelectorAll('[data-copy]');
      S.forEach(b => b.onclick = () => {
        const txt = b.parentElement.querySelectorAll('.sm')[1].textContent;
        try { navigator.clipboard.writeText(txt); UI.toast('已复制'); }
        catch (e) { UI.toast('复制失败，请手动选择文本'); }
      });
    }
  };

  /* ============================================================
     脱敏账单
     ============================================================ */
  P['youth.share'] = {
    title: '脱敏账单', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const d = api.dashboard();
      const cats = d.categories.filter(c => c.amount > 0);
      const sent = api.share.sent();
      return '<div class="pad">' +
        '<div class="proto mt16"><div class="ph"><span class="seal">脱</span>只含宏观数据</div>' +
        '<div class="sm t2" style="line-height:1.7">这张卡片不含任何一笔具体交易，' +
        '只呈现大类占比与总体节奏。你可以主动发给家人，用主动沟通代替被动盘问。</div></div>' +
        '<div class="card mt20" style="padding:22px">' +
        '<div class="row between"><div><div style="font-size:16px;font-weight:700">' + U.monthKey(LJ.clock.now()) + ' 月度概览</div>' +
        '<div class="xs muted" style="margin-top:3px">由本人主动分享</div></div>' +
        '<span class="stamp">已脱敏</span></div>' +
        '<div class="grid3 mt16" style="margin-top:16px">' +
        '<div class="metric"><div class="k">总支出</div><div class="v">' + Math.round(d.month.expense) + '</div></div>' +
        '<div class="metric"><div class="k">结余</div><div class="v" style="color:var(--ok)">' + Math.round(d.month.net) + '</div></div>' +
        '<div class="metric"><div class="k">掌控指数</div><div class="v">' + d.control.score + '</div></div>' +
        '</div>' +
        '<div class="mt20">' + cats.map(c =>
          '<div style="margin-bottom:12px"><div class="row between"><span class="sm">' + c.icon + ' ' + c.name + '</span>' +
          '<span class="xs mono muted">' + Math.round(c.ratio * 100) + '%</span></div>' +
          '<div class="mt8" style="margin-top:6px">' + UI.bar(c.ratio, c.color) + '</div></div>').join('') +
        '</div></div>' +
        /* 附一句话：主动分享的价值一半在"说了什么"，一半在"愿不愿意说" */
        '<div class="sec-title">附一句话<span class="more">可选</span></div>' +
        '<input id="shareNote" maxlength="40" placeholder="想跟家人说的话" ' +
        'style="width:100%;height:46px;border:1px solid var(--line);border-radius:12px;' +
        'padding:0 14px;outline:none;background:var(--card);font-size:14px">' +
        '<button class="btn mt16" id="shareBtn">发送给家人</button>' +
        '<div class="xs muted" style="margin-top:10px;line-height:1.7;text-align:center">' +
        '发出后家人会在消息中心收到，他们确认收到时你会收到一条回执。</div>' +
        /* 已发送记录：让"我主动说过什么"看得见 */
        (sent.length
          ? '<div class="sec-title">我发出的</div><div class="list">' + sent.slice(0, 6).map(c =>
            '<div class="li"><div class="ico">' + (c.ackAt ? '✅' : '📤') + '</div>' +
            '<div class="grow"><div class="row between">' +
            '<span class="sm" style="font-weight:600">' + UI.esc(c.month) + ' 月度概览</span>' +
            '<span class="tag ' + (c.ackAt ? 'ok' : 'warn') + '">' + (c.ackAt ? '已确认收到' : '待对方确认') + '</span></div>' +
            '<div class="xs muted" style="margin-top:3px">' + UI.esc((c.at || '').slice(0, 10)) +
            (c.note ? ' · ' + UI.esc(c.note) : '') + '</div>' +
            (c.ackNote ? '<div class="xs" style="margin-top:3px;color:var(--ok)">家人的回复：' +
              UI.esc(c.ackNote) + '</div>' : '') +
            '</div></div>').join('') + '</div>'
          : '') +
        '<div style="height:30px"></div></div>';
    },
    mount(el, ctx) {
      el.querySelector('#shareBtn').onclick = () => {
        try {
          ctx.api.share.send(el.querySelector('#shareNote').value);
          UI.toast('已发送，家人会在消息中心看到');
          ctx.refreshTop();
        } catch (e) { UI.toast(e.message); }
      };
    }
  };

  /* ============================================================
     待对账支持
     ============================================================ */
  P['youth.support'] = {
    title: '支持对账', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const list = api.support.list();
      if (!list.length) return UI.empty('📭', '还没有支持记录');
      const ST = { confirmed: ['已对账', 'ok'], pending: ['待确认', 'warn'], declined: ['已谢绝', 'gray'] };
      return '<div class="pad mt16">' +
        '<div class="proto"><div class="ph"><span class="seal">账</span>支持对账</div>' +
        '<div class="sm t2" style="line-height:1.7">每一笔家庭支持都由双方共同确认后才计入账本。' +
        '这是"家庭支持资金"与"个人自有资金"边界的来源，也避免了口头说不清。</div></div>' +
        '<div class="list mt16">' + list.map(r => {
          const s = ST[r.status] || ST.pending;
          return '<div class="li"><div class="grow">' +
            '<div class="row between"><span style="font-size:14.5px;font-weight:500">' + UI.esc(r.purpose) + '</span>' +
            '<span class="amt">¥' + U.won(r.amount) + '</span></div>' +
            '<div class="row between" style="margin-top:6px"><span class="xs muted">' + U.ymdCN(r.date) + ' · ' +
            ({ month: '按月', once: '一次性' }[r.cycle] || r.cycle) + (r.directed ? ' · 定向' : '') + '</span>' +
            '<span class="tag ' + s[1] + '">' + s[0] + '</span></div>' +
            (r.status === 'pending' ? '<div class="row mt8" style="gap:8px;margin-top:10px">' +
              '<button class="btn sm" data-ok="' + r.id + '" style="flex:1;height:34px">确认收到</button>' +
              '<button class="btn ghost sm" data-no="' + r.id + '" style="flex:1;height:34px">暂不确认</button></div>' : '') +
            '</div></div>';
        }).join('') + '</div></div>';
    },
    mount(el, ctx) {
      el.querySelectorAll('[data-ok]').forEach(b => b.onclick = () => {
        ctx.api.support.confirm(b.getAttribute('data-ok')); UI.toast('已确认，已计入账本');
      });
      el.querySelectorAll('[data-no]').forEach(b => b.onclick = () => {
        ctx.api.support.decline(b.getAttribute('data-no')); UI.toast('已回应，对方会收到提示');
      });
    }
  };

  /* ============================================================
     风险预警中心（产品文档 3.2.4）
     这一页要讲清楚三件事：
     ① 分级 —— 什么算"花多了"，什么算"可能出事了"
     ② 缓冲 —— 二级先给你 24 小时，你自己能说清就不用惊动家人
     ③ 边界 —— 家人收到的通知长什么样，里面没有任何明细
     ============================================================ */
  function riskLevelChip(level) {
    const lv = LJ.engine.riskLevel(level);
    return '<span class="rk-lv l' + lv.id + '">' + lv.short + '</span>';
  }

  P['youth.risk'] = {
    title: '风险预警', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const act = api.risk.active();
      const hist = api.risk.history();
      const wl = api.risk.whitelist();
      const notified = api.risk.list().filter(r => r.status === 'notified').length;

      let html = '<div class="pad">';

      /* ---------- 概览 ---------- */
      const topLv = act.length ? Math.max.apply(null, act.map(r => r.level)) : 0;
      const waiting = act.filter(r => r.level === 2 && r.status === 'pending_parent');
      const synced = api.risk.list().filter(r => r.status === 'notified');
      let headline;
      if (waiting.length) {
        headline = '其中 ' + waiting.length + ' 件需要你在 24 小时内回应，' +
          '回应了家人就不会收到通知。';
      } else if (synced.length) {
        headline = '有 ' + synced.length + ' 件已经同步过家人，通知里没有金额和明细。';
      } else if (act.length) {
        headline = '都是一级事件 —— 只提醒你本人，家人完全不知道。';
      } else {
        headline = '系统在盯着账本。真出事会先提醒你，日常消费家人一条通知都收不到。';
      }
      html += '<div class="rk-hero' + (topLv ? ' lv' + topLv : '') + '">' +
        '<div class="rk-hn">' + (act.length || '0') + '</div>' +
        '<div class="rk-hk">' + (act.length ? '件事等你确认' : '暂时没有要处理的事') + '</div>' +
        '<div class="rk-hd">' + headline + '</div></div>';

      /* ---------- 三级机制说明 ---------- */
      html += '<div class="rk-steps">' + LJ.engine.RISK_LEVELS.map(lv =>
        '<div class="rk-step l' + lv.id + '">' +
        '<div class="sh"><b>' + lv.name + '</b><i>' + lv.lead + '</i></div>' +
        '<div class="sp">' + lv.policy + '</div>' +
        '</div>').join('') + '</div>';

      /* ---------- 进行中 ---------- */
      if (act.length) {
        html += '<div class="sec-title">进行中<span class="more">' + act.length + ' 条</span></div>';
        html += '<div class="rk-list">' + act.map(r => {
          const lv = LJ.engine.riskLevel(r.level);
          const cd = api.risk.countdown(r);
          let state = '';
          if (cd) {
            state = '<span class="rk-cd' + (cd.due ? ' due' : '') + '">' + cd.text + '</span>';
          } else if (r.level === 1) {
            state = '<span class="rk-cd quiet">只有你知道</span>';
          } else {
            state = '<span class="rk-cd sent">已同步家人</span>';
          }
          return '<div class="rk-item l' + r.level + '" data-risk="' + r.id + '">' +
            '<div class="rk-ih">' + riskLevelChip(r.level) + state + '</div>' +
            '<div class="rk-it">' + UI.esc(r.title) + '</div>' +
            '<div class="rk-id">' + UI.esc(r.detail) + '</div>' +
            (cd ? '<div class="rk-ihint">' + cd.dateText + ' 之前回应，家人不会收到任何通知</div>' : '') +
            '<div class="rk-go">查看并处理' + UI.icon('chevron', 13) + '</div>' +
            '</div>';
        }).join('') + '</div>';
      }

      /* ---------- 已闭环 ---------- */
      if (hist.length) {
        html += '<div class="sec-title">已闭环<span class="more">' + hist.length + ' 条</span></div>';
        html += '<div class="list">' + hist.map(r => {
          const st = r.status === 'notified' ? '已同步家人'
            : r.status === 'dismissed' ? '已忽略' : '已处理';
          return '<div class="li" data-risk="' + r.id + '">' +
            '<div class="ico">' + LJ.engine.riskLevel(r.level).icon + '</div>' +
            '<div class="grow"><div style="font-size:14px;font-weight:700">' + UI.esc(r.title) + '</div>' +
            '<div class="xs muted" style="margin-top:3px">' +
            U.ymdCN(String(r.at).slice(0, 10)) + ' · ' + st + '</div></div>' +
            '<div class="muted">›</div></div>';
        }).join('') + '</div>';
      }

      /* ---------- 白名单 ---------- */
      html += '<div class="sec-title">风险白名单<span class="more">' + wl.length + ' 个关键词</span></div>';
      html += '<div class="list"><div class="li" data-go="youth.riskWhitelist">' +
        '<div class="ico" style="background:#EDE9FB">🕊</div>' +
        '<div class="grow"><div style="font-size:14.5px">信任的场景不再打扰</div>' +
        '<div class="xs muted" style="margin-top:2px">' +
        (wl.length ? wl.map(w => w.word).join(' · ') : '还没有添加') +
        '</div></div><div class="muted">›</div></div></div>';

      /* ---------- 承诺卡：这是整套机制的分量所在 ---------- */
      html += '<div class="proto mt20"><div class="ph"><span class="seal">界</span>家人到底能收到什么</div>' +
        '<div class="xs t2" style="line-height:1.85">' +
        '一级事件只提醒你本人，家人完全不知道。<br>' +
        '二级事件先给你 24 小时，只有超时未回应，家人才会收到一条「存在异常」，' +
        '<b>没有金额、没有商户、没有时间</b>。<br>' +
        '三级事件双方立即收到通知，但通知里同样没有明细。<br>' +
        '<b>你花在哪儿，家人永远看不到。</b></div></div>';

      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      /* 每次进这一页都重扫一遍账本：记了新账、导入了账单，风险判定要跟着变。
         sync 是幂等的（按 key 去重），没有新东西就不写库、不发事件，
         所以不会和「data: 事件 → 整页刷新」互相触发成死循环。 */
      ctx.api.risk.sync();
      el.querySelectorAll('[data-risk]').forEach(n => {
        n.onclick = () => ctx.go('youth.riskDetail', { id: n.getAttribute('data-risk') });
      });
      el.querySelectorAll('[data-go]').forEach(n => {
        n.onclick = () => ctx.go(n.getAttribute('data-go'));
      });
    }
  };

  P['youth.riskDetail'] = {
    title: '风险事件', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const r = api.risk.get(ctx.params.id);
      if (!r) return UI.empty('🔍', '找不到这条风险事件');
      const lv = LJ.engine.riskLevel(r.level);
      const cd = api.risk.countdown(r);
      const preview = api.risk.supporterPreview(r);
      const isOpen = r.status === 'open' || r.status === 'pending_parent';

      let html = '<div class="pad">';

      /* ---------- 等级头 ---------- */
      html += '<div class="rk-head l' + r.level + '">' +
        '<div class="rk-hi">' + lv.icon + '</div>' +
        '<div class="rk-ht">' + lv.name + '</div>' +
        '<div class="rk-hp">' + lv.lead + '</div>' +
        '<div class="rk-hd2">' + lv.policy + '</div>' +
        '</div>';

      if (cd) {
        html += '<div class="rk-cdbar"><b>' + cd.text + '</b>' +
          '<span>' + cd.dateText + ' 之前回应，家人不会收到任何通知</span></div>';
      }

      /* ---------- 事实（只列事实，不做价值判断）---------- */
      html += '<div class="sec-title">判定依据<span class="more">只列事实</span></div>';
      html += '<div class="card">' +
        '<div class="rk-it2">' + UI.esc(r.title) + '</div>' +
        '<div class="rk-id2">' + UI.esc(r.detail) + '</div>' +
        (r.amount ? '<div class="cm-kv"><span>涉及金额</span><b>¥' + U.won(r.amount) + '</b></div>' : '') +
        (r.merchant ? '<div class="cm-kv"><span>收款方</span><b>' + UI.esc(r.merchant) + '</b></div>' : '') +
        '<div class="cm-kv"><span>判定时间</span><b>' + U.ymdCN(String(r.at).slice(0, 10)) + '</b></div>' +
        '<div class="rk-why">' + UI.esc(r.why) + '</div>' +
        '</div>';

      /* ---------- 闭环时间轴 ---------- */
      if (r.timeline && r.timeline.length) {
        html += '<div class="sec-title">处理过程<span class="more">全程留痕</span></div>';
        html += '<div class="rk-tl">' + r.timeline.map(t => {
          const who = { system: '系统', youth: '你', supporter: '家人', bank: '银行客服' }[t.actor] || t.actor;
          return '<div class="rk-tl-i ' + t.actor + '">' +
            '<div class="tl-dot"></div>' +
            '<div class="tl-b">' +
            '<div class="tl-h"><b>' + UI.esc(t.action) + '</b>' +
            '<span>' + who + ' · ' + U.ymdCN(String(t.at).slice(0, 10)) + '</span></div>' +
            (t.note ? '<div class="tl-n">' + UI.esc(t.note) + '</div>' : '') +
            '</div></div>';
        }).join('') + '</div>';
      }

      /* ---------- 家人会收到什么：脱敏原文摆出来 ---------- */
      html += '<div class="sec-title">家人会收到什么</div>';
      if (!preview) {
        html += '<div class="rk-none">一级事件只提醒你本人。<b>家人不会收到任何通知，也不会知道发生过这件事。</b></div>';
      } else {
        html += '<div class="rk-notice">' +
          '<div class="nn-h">' + UI.esc(preview.title) + '</div>' +
          '<div class="nn-b">' + UI.esc(preview.body) + '</div>' +
          /* 以 notifyAt 为准，不看 status —— 事件可能已经闭环，
             但闭环之前到底发没发过通知，只有 notifyAt 说得准 */
          '<div class="nn-f">' + (r.notifyAt
            ? '已于 ' + U.ymdCN(String(r.notifyAt).slice(0, 10)) + ' 发出'
            : '还没发出' + (cd ? ' · ' + cd.dateText + ' 到期' : '')) + '</div>' +
          '</div>';
        html += '<div class="rk-none sm">这就是家人能看到的<b>全部</b>内容 —— ' +
          '没有金额、没有商户、没有时间。明细永远出不了这台设备。</div>';
      }

      /* ---------- 处理动作 ---------- */
      if (isOpen) {
        html += '<div class="sec-title">你打算怎么办</div>';
        if (r.level >= 2) {
          html += '<button class="btn mt8" data-act="explain">我来说明</button>' +
            '<div class="xs muted" style="margin-top:8px;line-height:1.75">' +
            '说清楚之后这件事就结了' +
            (r.status === 'pending_parent' ? '，<b>倒计时同时停止，家人不会收到任何通知</b>' : '') + '。</div>';
          if (r.status === 'pending_parent') {
            html += '<button class="btn ghost mt12" data-act="notify">我主动告诉家人</button>';
          }
        }
        html += '<button class="btn ghost mt12" data-act="resolve">标记已处理</button>';
        html += '<button class="btn ghost mt12" data-act="white">这很正常，以后不再提醒</button>';
      } else {
        if (r.explain) {
          html += '<div class="card mt16"><div class="xs muted">你的说明</div>' +
            '<div class="sm t2" style="margin-top:8px;line-height:1.8">' + UI.esc(r.explain) + '</div></div>';
        }
        html += '<div class="rk-none">这条事件已经闭环。' +
          (r.notifyAt ? '家人收到过一条不含明细的提示。' : '家人从未收到任何通知。') +
          '</div>';
      }

      /* ---------- 三级：紧急通道 ---------- */
      if (r.level === 3) {
        html += '<div class="sec-title">紧急通道</div>';
        html += '<div class="rk-hot">' + api.risk.HOTLINE.map(h =>
          '<a class="rk-hot-i" href="tel:' + h.tel + '" data-tel="' + h.tel + '">' +
          '<div class="hn">' + h.name + '</div>' +
          '<div class="ht">' + h.tel + '</div>' +
          '<div class="hd">' + h.note + '</div></a>').join('') + '</div>';
        const cards = api.card.list();
        html += '<button class="btn mt16" data-act="freeze">先冻结银行卡（' +
          (cards[0] ? '•••• ' + cards[0].tail : '主卡') + '）</button>' +
          '<div class="xs muted" style="margin-top:8px;line-height:1.75">' +
          '三级事件里最快的止损动作。冻结后双方都会收到一条通知，同样不含明细。</div>';
      }

      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      const api = ctx.api;
      const r = api.risk.get(ctx.params.id);
      if (!r) return;

      const ask = (title, desc, onOk, okText) => UI.confirm({
        title, desc, okText, onOk: () => { onOk(); ctx.refreshTop(); }
      });

      el.querySelectorAll('[data-act]').forEach(n => {
        const act = n.getAttribute('data-act');
        n.onclick = () => {
          if (act === 'explain') {
            const box = document.createElement('div');
            box.innerHTML = '<textarea class="ta" rows="3" placeholder="' +
              '比如：是帮同学代付的，钱已经还我了"></textarea>';
            const sheet = UI.sheet({
              title: '我来说明', sub: '写给自己看，也写进留痕记录。说清楚之后这件事就结了。',
              mount(s, close) {
                s.appendChild(box);
                const b = document.createElement('button');
                b.className = 'btn mt16'; b.textContent = '提交说明';
                b.onclick = () => {
                  const t = box.querySelector('textarea').value;
                  if (!String(t).trim()) return UI.toast('写一句就行');
                  close();
                  api.risk.explain(r.id, String(t).trim());
                  ctx.refreshTop();
                  UI.toast('已记录。倒计时停止，家人不会收到通知');
                };
                s.appendChild(b);
              }
            });
            return;
          }
          if (act === 'resolve') {
            return ask('标记已处理？', '这件事会移到「已闭环」。家人不会收到任何通知。',
              () => { api.risk.resolve(r.id); UI.toast('已闭环'); }, '标记已处理');
          }
          if (act === 'notify') {
            return ask('主动告诉家人？', '不用等倒计时。家人会收到那条不含明细的提示，' +
              '同时你自己先说，比系统替你开口要好。',
              () => { api.risk.notifyNow(r.id); UI.toast('已同步给家人'); }, '告诉家人');
          }
          if (act === 'white') {
            const box = document.createElement('div');
            box.innerHTML = '<input class="ta" id="wlOne" style="min-height:44px" value="' +
              UI.esc(r.merchant || '') + '">';
            UI.sheet({
              title: '这很正常，以后不再提醒',
              sub: '按关键词匹配。同类支出不会再触发风险提醒，也不会改变任何信息披露范围。',
              mount(s, close) {
                s.appendChild(box);
                const b = document.createElement('button');
                b.className = 'btn mt16'; b.textContent = '加入白名单并结案';
                b.onclick = () => {
                  const w = String(box.querySelector('#wlOne').value || '').trim();
                  if (!w) return UI.toast('需要一个关键词');
                  close();
                  api.risk.whitelistAdd(w, '来自风险事件：' + r.title);
                  ctx.refreshTop();
                  UI.toast('已加入白名单，同类支出不再提醒');
                };
                s.appendChild(b);
              }
            });
            return;
          }
          if (act === 'freeze') {
            const c = api.card.list()[0];
            return ask('冻结这张卡？', '立刻停止收付款，先止血。双方都会收到一条不含明细的通知。',
              () => {
                api.risk.freezeCard(c.id, r.id);
                UI.toast('已冻结 ' + c.name);
              }, '冻结');
          }
        };
      });

      /* 拨号：桌面浏览器打不出去，点一下说明清楚就行 */
      el.querySelectorAll('[data-tel]').forEach(n => {
        n.onclick = (e) => {
          e.preventDefault();
          UI.toast('真机上会直接拨 ' + n.getAttribute('data-tel'));
        };
      });
    }
  };

  P['youth.riskWhitelist'] = {
    title: '风险白名单', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const wl = api.risk.whitelist();
      let html = '<div class="pad">';

      html += '<div class="proto"><div class="ph"><span class="seal">误</span>为什么要白名单</div>' +
        '<div class="xs t2" style="line-height:1.85">' +
        '报名费、教材、看牙……这些金额不小但完全在计划内。' +
        '把它们放进来，系统就不再为同类支出打扰你。' +
        '<b>白名单只影响你自己这边的提醒，不改变任何信息披露范围。</b></div></div>';

      html += '<div class="sec-title">已信任<span class="more">' + wl.length + ' 个</span></div>';
      if (!wl.length) {
        html += '<div class="card flat"><div class="sm muted" style="text-align:center;padding:14px 0">' +
          '还没有添加关键词</div></div>';
      } else {
        html += '<div class="list">' + wl.map(w =>
          '<div class="li"><div class="ico">🕊</div>' +
          '<div class="grow"><div style="font-size:14.5px;font-weight:700">' + UI.esc(w.word) + '</div>' +
          '<div class="xs muted" style="margin-top:2px">' +
          (UI.esc(w.note) || '不限备注') + ' · ' + U.ymdCN(String(w.at || '').slice(0, 10)) + '</div></div>' +
          '<button class="ch-del" data-del="' + w.id + '" title="移除">✕</button></div>').join('') +
          '</div>';
      }

      html += '<div class="sec-title">添加关键词</div>';
      html += '<div class="card">' +
        '<input class="ta" id="wlInput" placeholder="比如：考证、教材、牙科" style="min-height:44px">' +
        '<button class="btn mt12" id="wlAdd">加入白名单</button>' +
        '<div class="xs muted" style="margin-top:10px;line-height:1.75">' +
        '按关键词匹配商户名和备注。命中的交易不会再触发风险提醒。</div>' +
        '</div>';

      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      const api = ctx.api;
      const add = () => {
        const inp = el.querySelector('#wlInput');
        const w = String(inp.value || '').trim();
        if (!w) return UI.toast('填一个关键词');
        api.risk.whitelistAdd(w, '手动添加');
        ctx.refreshTop();
        UI.toast('已加入「' + w + '」');
      };
      const b = el.querySelector('#wlAdd');
      if (b) b.onclick = add;
      const inp = el.querySelector('#wlInput');
      if (inp) inp.onkeydown = e => { if (e.key === 'Enter') add(); };

      el.querySelectorAll('[data-del]').forEach(n => {
        n.onclick = () => {
          api.risk.whitelistRemove(n.getAttribute('data-del'));
          ctx.refreshTop();
          UI.toast('已移除');
        };
      });
    }
  };

  /* ============================================================
     我的生活费（产品文档 3.5.3 / 3.5.5）
     青年端这一侧的重点：确认权在我手上，而且能看见家人的通知长什么样。
     ============================================================ */
  function youthPlanTable(plan, base) {
    const rows = LJ.engine.planSchedule(plan);
    const max = Math.max.apply(null, rows.map(r => r.amount).concat([1]));
    const total = rows.reduce((s, r) => s + r.amount, 0);
    return '<div class="lp-tbl">' + rows.map(r => {
      const zero = r.amount === 0;
      const tag = plan.kind === 'taper' ? (zero ? '自立' : '递减')
        : zero ? '不发' : (r.amount < base ? '半给' : '');
      return '<div class="lp-tr' + (zero ? ' zero' : '') + (plan.kind === 'taper' ? ' grad' : '') + '">' +
        '<span class="m">' + Number(r.month.slice(5)) + '月</span>' +
        '<span class="bar"><i style="width:' + Math.max(zero ? 0 : 4, Math.round(r.amount / max * 100)) + '%"></i></span>' +
        '<span class="v">¥' + U.won(r.amount) + '</span>' +
        '<span class="tg">' + tag + '</span></div>';
    }).join('') +
      '<div class="lp-total"><span class="k">整期合计</span>' +
      '<span class="v">¥' + U.won(total) + '</span></div></div>';
  }

  function youthPlanLog(plan) {
    if (!plan.log || !plan.log.length) return '';
    const who = { youth: '我', supporter: '家人', system: '系统' };
    return '<div class="lp-log">' + plan.log.slice().reverse().map(l =>
      '<div class="lp-log-i ' + l.actor + '"><div class="dot"></div><div class="tx">' +
      '<b>' + UI.esc(l.action) + '</b>' +
      '<span>' + (who[l.actor] || l.actor) + ' · ' + U.ymdCN(String(l.at).slice(0, 10)) +
      (l.note ? ' · ' + UI.esc(l.note) : '') + '</span></div></div>').join('') + '</div>';
  }

  P['youth.plan'] = {
    title: '我的生活费', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const base = api.plan.base();
      const incoming = api.plan.incoming();
      const outgoing = api.plan.outgoing();
      const live = api.plan.active();
      const next = api.plan.amountOn(U.addMonths(LJ.clock.now(), 0).slice(0, 7));
      const hist = api.plan.list().filter(p => p.status === 'done' || p.status === 'declined');
      let html = '<div class="pad">';

      /* 待我确认 —— 放最前面，这是需要动作的东西 */
      if (incoming.length) {
        html += incoming.map(p =>
          '<div class="lp-card wait">' +
          '<div class="lp-h"><span class="n">家人想调整生活费</span>' +
          '<span class="tag warn">等你确认</span></div>' +
          '<div class="lp-sub">' + UI.esc(api.plan.summary(p)) + '</div>' +
          (p.note ? '<div class="lp-sub" style="color:var(--text-2)">「' + UI.esc(p.note) + '」</div>' : '') +
          youthPlanTable(p, base) +
          '<div class="xs muted" style="margin-top:12px;line-height:1.75">' +
          '确认之前一切照旧。这不是通知，是需要你点头的方案。</div>' +
          '<button class="btn mt12" data-ok="' + p.id + '">确认，就按这个来</button>' +
          '<button class="btn ghost mt12" data-no="' + p.id + '">我想再聊聊</button>' +
          '</div>').join('');
      }

      /* 正在执行 */
      html += '<div class="sec-title">正在执行</div>';
      if (!live.length) {
        html += '<div class="card flat"><div class="sm muted" style="text-align:center;padding:12px 0">' +
          '按约定基准 ¥' + U.won(base) + ' / 月发放，没有任何调整</div></div>';
      } else {
        html += live.map(p => '<div class="lp-card ' + (p.kind === 'taper' ? 'grad' : 'live') + '">' +
          '<div class="lp-h"><span class="n">' + UI.esc(p.name) + '</span>' +
          '<span class="tag ' + (p.kind === 'taper' ? 'info' : 'ok') + '">' +
          (p.kind === 'taper' ? '递减中' : '进行中') + '</span></div>' +
          '<div class="lp-sub">' + UI.esc(api.plan.summary(p)) + '</div>' +
          youthPlanTable(p, base) + youthPlanLog(p) + '</div>').join('');
      }

      /* 我的基准 */
      html += '<div class="sec-title">我的基准</div>';
      html += '<div class="card"><div class="cm-kv"><span>约定月度生活费</span>' +
        '<b>¥' + U.won(base) + '</b></div>' +
        '<div class="cm-kv"><span>发放日</span><b>每月 1 日</b></div>' +
        '<div class="cm-kv"><span>这个月实发</span><b>¥' + U.won(next.amount) + '</b></div>' +
        (next.plan ? '<div class="xs muted" style="margin-top:11px;line-height:1.7">按「' +
          UI.esc(next.plan.name) + '」执行。</div>' : '') +
        '</div>';

      /* 假期复盘 */
      const withReview = api.plan.list().filter(p => p.review);
      if (withReview.length) {
        html += '<div class="sec-title">假期复盘<span class="more">自动生成</span></div>';
        html += withReview.map(p => {
          const r = p.review;
          return '<div class="card mt12"><div class="row between">' +
            '<div><div style="font-size:14.5px;font-weight:800">' + UI.esc(p.name) + '</div>' +
            '<div class="xs muted" style="margin-top:4px">' + r.from + ' ~ ' + r.to +
            ' · ' + r.days + ' 天</div></div>' +
            '<span class="stamp">复盘</span></div>' +
            '<div class="lp-rv"><div class="rv-n">' +
            '<div><div class="k">假期支出</div><div class="v">¥' + U.won(r.expense) + '</div></div>' +
            '<div><div class="k">日均</div><div class="v">¥' + U.won(r.avg) + '</div></div>' +
            '<div><div class="k">放假前日均</div><div class="v">¥' + U.won(r.beforeAvg) + '</div></div>' +
            '</div><ul>' + r.notes.map(n => '<li>' + UI.esc(n) + '</li>').join('') + '</ul>' +
            '</div></div>';
        }).join('');
      }

      /* 我发起的 */
      if (outgoing.length) {
        html += '<div class="sec-title">我发起的<span class="more">等家人确认</span></div>';
        html += outgoing.map(p => '<div class="lp-card wait">' +
          '<div class="lp-h"><span class="n">' + UI.esc(p.name) + '</span>' +
          '<span class="tag info">等确认</span></div>' +
          '<div class="lp-sub">' + UI.esc(api.plan.summary(p)) + '</div>' +
          youthPlanTable(p, base) + '</div>').join('');
      }

      /* 历史 */
      if (hist.length) {
        html += '<div class="sec-title">历史</div><div class="list">' + hist.map(p =>
          '<div class="li"><div class="ico">' + (p.kind === 'taper' ? '🎓' : '🏖') + '</div>' +
          '<div class="grow"><div style="font-size:14px;font-weight:700">' + UI.esc(p.name) + '</div>' +
          '<div class="xs muted" style="margin-top:3px">' + UI.esc(api.plan.summary(p)) + '</div></div>' +
          '<span class="tag ' + (p.status === 'done' ? 'gray' : 'info') + '">' +
          (p.status === 'done' ? '已结束' : '已婉拒') + '</span></div>').join('') + '</div>';
      }

      /* 我也能发起 */
      html += '<div class="sec-title">我也想提一个</div>';
      html += '<div class="lp-modes">' + api.plan.kinds.map(k =>
        '<button class="lp-mode" data-new="' + k.id + '">' +
        '<span class="ic">' + k.icon + '</span>' +
        '<span class="tx"><b>' + k.name + '</b><i>' + k.desc + '</i></span>' +
        '<span class="pv">›</span></button>').join('') + '</div>';

      /* 毕业报告入口 */
      html += '<div class="sec-title">其他</div><div class="list">' +
        '<div class="li" data-go="youth.gradReport"><div class="ico" style="background:#EFEAFF">🎓</div>' +
        '<div class="grow"><div style="font-size:14.5px">大学阶段财务成长报告</div>' +
        '<div class="xs muted" style="margin-top:2px">从入学到现在的一次纵向回顾</div></div>' +
        '<div class="muted">›</div></div></div>';

      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      const api = ctx.api;
      el.querySelectorAll('[data-go]').forEach(n => n.onclick = () => ctx.go(n.getAttribute('data-go')));
      el.querySelectorAll('[data-new]').forEach(n => n.onclick = () =>
        ctx.go('youth.planNew', { kind: n.getAttribute('data-new') }));

      el.querySelectorAll('[data-ok]').forEach(n => n.onclick = () => {
        const p = api.plan.get(n.getAttribute('data-ok'));
        UI.confirm({
          title: '确认按这个方案发？',
          desc: p ? api.plan.summary(p) + '。确认后从生效月起按新方案发放，' +
            '账本里的对账记录会跟着变。' : '',
          okText: '确认',
          onOk() { api.plan.confirm(n.getAttribute('data-ok')); ctx.refreshTop(); UI.toast('已确认，按新方案发放'); }
        });
      });

      el.querySelectorAll('[data-no]').forEach(n => n.onclick = () => {
        const box = document.createElement('div');
        box.innerHTML = '<textarea class="ta" rows="3" placeholder="' +
          '想说点什么？比如：寒假我要留校实习，开销不会少。"></textarea>';
        UI.sheet({
          title: '我想再聊聊', sub: '这句话会推给家人。方案不会生效，一切照旧。',
          mount(s, close) {
            s.appendChild(box);
            const b = document.createElement('button');
            b.className = 'btn mt16'; b.textContent = '发过去';
            b.onclick = () => {
              const t = String(box.querySelector('textarea').value || '').trim();
              if (!t) return UI.toast('写一句就行');
              close();
              api.plan.decline(n.getAttribute('data-no'), t);
              ctx.refreshTop();
              UI.toast('已回给家人，方案没有生效');
            };
            s.appendChild(b);
          }
        });
      });
    }
  };

  /* 青年自己发起（对称的能力，走同一套渲染思路但参数更少） */
  P['youth.planNew'] = {
    title: '我提一个生活费方案', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const kind = ctx.params.kind || 'holiday';
      const today = LJ.clock.now();
      const base = api.plan.base();
      const y = U.parse(today).getFullYear();
      const summer = (y + '-07-01') >= today ? [y + '-07-01', y + '-08-31'] : [(y + 1) + '-07-01', (y + 1) + '-08-31'];
      const winter = (y + '-01-15') >= today ? [y + '-01-15', y + '-02-20'] : [(y + 1) + '-01-15', (y + 1) + '-02-20'];
      const useWinter = ctx.params.preset === 'winter';
      const from = useWinter ? winter[0] : summer[0];
      const to = useWinter ? winter[1] : summer[1];
      const mode = ctx.params.mode || 'half';
      const months = Number(ctx.params.months) || 6;
      const startMonth = ctx.params.startMonth || today.slice(0, 7);

      const draft = kind === 'taper'
        ? { kind: 'taper', name: startMonth.slice(0, 4) + ' 毕业过渡', startMonth, months, mode: 'taper', base }
        : { kind: 'holiday', name: from.slice(0, 4) + (from.slice(5, 7) === '07' ? ' 暑假' : ' 寒假'), from, to, mode, base };

      let html = '<div class="pad">';
      html += '<div class="proto mt16"><div class="ph"><span class="seal">谈</span>你也可以主动提</div>' +
        '<div class="sm t2" style="line-height:1.75">生活费不是只能等家里定。' +
        '你先提一个方案，家人点同意就生效 —— 主动开口，比被动接受要体面。</div></div>';

      html += '<div class="seg" style="margin-top:16px">' + api.plan.kinds.map(k =>
        '<button class="' + (k.id === kind ? 'on' : '') + '" data-kind="' + k.id + '">' +
        k.icon + ' ' + k.name + '</button>').join('') + '</div>';

      if (kind === 'holiday') {
        html += '<div class="sec-title">哪个假期</div>' +
          '<div class="row" style="gap:8px;padding:2px 0">' +
          '<button class="chip ' + (useWinter ? '' : 'on') + '" data-set="preset=summer">☀️ 暑假</button>' +
          '<button class="chip ' + (useWinter ? 'on' : '') + '" data-set="preset=winter">❄️ 寒假</button></div>';
        html += '<div class="sec-title">怎么发</div>';
        html += '<div class="lp-modes">' + api.plan.modes.map(m =>
          '<button class="lp-mode' + (m.id === mode ? ' on' : '') + '" data-set="mode=' + m.id + '">' +
          '<span class="ic">' + m.icon + '</span>' +
          '<span class="tx"><b>' + m.name + '</b><i>' + m.desc + '</i></span>' +
          '<span class="pv">' + m.preview(base) + '</span></button>').join('') + '</div>';
      } else {
        html += '<div class="sec-title">从哪个月开始递减</div><div class="row" style="gap:8px;padding:2px 0;flex-wrap:wrap">' +
          [0, 1, 2, 3, 4, 5].map(i => {
            const mk = U.addMonths(today, i).slice(0, 7);
            return '<button class="chip ' + (mk === startMonth ? 'on' : '') +
              '" data-set="startMonth=' + mk + '">' + Number(mk.slice(5)) + ' 月</button>';
          }).join('') + '</div>';
        html += '<div class="sec-title">几个月递减到 0</div><div class="row" style="gap:8px;padding:2px 0">' +
          [3, 4, 5, 6, 9, 12].map(n => '<button class="chip ' + (n === months ? 'on' : '') +
            '" data-set="months=' + n + '">' + n + ' 个月</button>').join('') + '</div>';
      }

      html += '<div class="sec-title">预览</div>';
      html += '<div class="lp-card ' + (kind === 'taper' ? 'grad' : 'live') + '">' +
        '<div class="lp-h"><span class="n">' + UI.esc(draft.name) + '</span>' +
        '<span class="tag info">预览</span></div>' +
        '<div class="lp-sub">' + UI.esc(LJ.engine.planSummary(draft)) + '</div>' +
        youthPlanTable(draft, base) + '</div>';

      html += '<div class="sec-title">说一句理由</div>';
      html += '<div class="card"><textarea class="ta" id="ypNote" rows="3" ' +
        'placeholder="比如：暑假我要留校实习，吃饭和通勤都得自己出。"></textarea></div>';
      html += '<button class="btn mt16" id="ypSend">发给家人，等确认</button>';

      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      const api = ctx.api;
      const p = ctx.params;
      const set = (kv) => {
        const next = {};
        ['kind', 'preset', 'mode', 'months', 'startMonth'].forEach(k => { if (p[k] != null) next[k] = p[k]; });
        kv.split('&').forEach(pair => {
          const i = pair.indexOf('=');
          next[pair.slice(0, i)] = pair.slice(i + 1);
        });
        ctx.replace('youth.planNew', next);
      };
      el.querySelectorAll('[data-kind]').forEach(n => n.onclick = () =>
        ctx.replace('youth.planNew', { kind: n.getAttribute('data-kind') }));
      el.querySelectorAll('[data-set]').forEach(n => n.onclick = () => set(n.getAttribute('data-set')));

      const send = el.querySelector('#ypSend');
      if (send) send.onclick = () => {
        const note = (el.querySelector('#ypNote') || {}).value || '';
        const kind = p.kind || 'holiday';
        const today = LJ.clock.now();
        const y = U.parse(today).getFullYear();
        const summer = (y + '-07-01') >= today ? [y + '-07-01', y + '-08-31'] : [(y + 1) + '-07-01', (y + 1) + '-08-31'];
        const winter = (y + '-01-15') >= today ? [y + '-01-15', y + '-02-20'] : [(y + 1) + '-01-15', (y + 1) + '-02-20'];
        const pr = p.preset === 'winter' ? winter : summer;
        const rec = api.plan.create(kind === 'taper'
          ? {
            kind: 'taper', name: (p.startMonth || today).slice(0, 4) + ' 毕业过渡',
            startMonth: p.startMonth || today.slice(0, 7), months: Number(p.months) || 6, note: note
          }
          : {
            kind: 'holiday',
            name: pr[0].slice(0, 4) + (pr[0].slice(5, 7) === '07' ? ' 暑假' : ' 寒假'),
            from: pr[0], to: pr[1], mode: p.mode || 'half', note: note
          });
        ctx.replace('youth.plan', {});
        UI.toast('已发给家人，等确认后生效');
      };
    }
  };

  /* ============================================================
     任务解锁的「锁」长什么样
     刻意不隐藏：看不见的东西，用户只会以为产品缺了这个功能。
     显示成一张"完成任务解锁"的卡，附上任务名和一个去做的按钮。
     ============================================================ */
  LJ.lockedCard = function (ctx, key, opt) {
    opt = opt || {};
    const p = ctx.api.unlock.pending(key);
    if (!p) return '';
    return '<div class="lk-card">' +
      '<div class="lk-h"><span class="lk-ic">🔒</span>' +
      '<div><div class="lk-n">' + UI.esc(opt.title || p.name) + ' 还没解锁</div>' +
      '<div class="lk-s">完成成长任务「' + UI.esc(p.taskName) + '」后开放</div></div></div>' +
      (p.taskDesc ? '<div class="lk-d">' + UI.esc(p.taskDesc) + '</div>' : '') +
      '<button class="btn soft sm mt12" style="margin-top:12px" data-lk-go="' +
      UI.esc(p.taskGo || '') + '">' + UI.esc(p.taskGoLabel || '去做') + '</button>' +
      '<div class="lk-f">' + UI.esc(p.where ? '解锁后出现在 ' + p.where : '') + '</div>' +
      '</div>';
  };

  /** 锁卡里的按钮统一在这里接线（各页面 mount 里调一次） */
  LJ.bindLocked = function (el, ctx) {
    el.querySelectorAll('[data-lk-go]').forEach(n => {
      n.onclick = () => {
        const to = n.getAttribute('data-lk-go');
        ctx.go(to || 'youth.tasks');
      };
    });
  };

  /* ============================================================
     我的专项（3.5.1 开学季 / 3.5.2 实习求职 / 3.5.4 应急医疗）
     三个场景共用一套机制：钱有用途、有期限，家人只看得到进度。
     青年端这一侧的重点是——**把家人的视角直接摆给用户看**，
     让人确信"他们真的看不到我买了什么"。
     ============================================================ */
  function fundCard(f, p, opts) {
    const k = LJ.engine.fundKind(f.kind);
    const over = p.over;
    return '<div class="fu-card' + (f.status === 'closed' ? ' done' : '') + '">' +
      '<div class="fu-h"><span class="n">' + k.icon + ' ' + UI.esc(f.name) + '</span>' +
      '<span class="fu-use">' + (f.status === 'closed' ? '已结项'
        : '仅限' + LJ.catById(f.category).name) + '</span></div>' +
      '<div class="fu-nums">' +
      '<div><div class="k">计划</div><div class="v">¥' + U.won(p.target) + '</div></div>' +
      '<div><div class="k">已转入</div><div class="v">¥' + U.won(p.inTotal) + '</div></div>' +
      '<div><div class="k">剩余</div><div class="v"' +
      (p.remaining < 0 ? ' style="color:var(--danger)"' : '') + '>¥' + U.won(p.remaining) + '</div></div>' +
      '</div>' +
      '<div class="fu-bar' + (over ? ' over' : '') + '">' +
      '<div class="track"><i style="width:' + Math.round(p.ratio * 100) + '%"></i></div>' +
      '<div class="cap"><span>已用 ¥' + U.won(p.used) + ' · ' + p.count + ' 笔</span>' +
      '<span class="p">' + Math.round(p.ratio * 100) + '%</span></div></div>' +
      (f.note ? '<div class="fu-note">「' + UI.esc(f.note) + '」</div>' : '') +
      (f.periodEnd ? '<div class="fu-note" style="color:var(--muted)">有效期至 ' +
        U.ymdCN(f.periodEnd) + ' · 只能用于' + LJ.catById(f.category).name + '</div>' : '') +
      (opts && opts.see !== false ? '<div class="fu-see">' +
        '<div class="sh">家人那边看到的就是这些</div><ul>' +
        '<li>计划 ¥' + U.won(p.target) + '，已转入 ¥' + U.won(p.inTotal) + '</li>' +
        '<li>已用 ¥' + U.won(p.used) + '（' + Math.round(p.ratio * 100) + '%），' + p.count + ' 笔</li>' +
        '<li>剩余 ¥' + U.won(p.remaining) + '</li>' +
        '<li class="no">买了什么、在哪买的、多少钱一件 —— 看不到</li>' +
        '</ul></div>' : '') +
      /* 结束了的专项给一个复盘入口。
         文档 3.5.1/3.5.2/3.5.5 都要求"场景结束后自动生成消费复盘" ——
         原来只有假期那条链路有，专项跑完就静静躺在那儿。 */
      (opts && opts.review ? '<button class="btn soft sm mt12" style="margin-top:12px" ' +
        'data-fundreview="' + f.id + '">看这次花了什么样</button>' : '') +
      '</div>';
  }

  /* ============================================================
     专项复盘（场景结束后自动生成）
     ============================================================
     假期复盘比的是"日均降下来没有"；专项复盘比的是**计划 vs 执行**：
     家里说好放 ¥3,800 做开学季，实际用了多少、剩多少、花在哪些类上。
     专项有 target 和用途约束，所以"执行率"才是它的核心指标。 */
  P['youth.fundReview'] = {
    title: '专项复盘', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const id = ctx.params.id;
      const f = api.fund.get(id);
      const rv = api.fund.review(id);
      if (!f) return '<div class="pad mt16">' + UI.empty('🎯', '没找到这个专项') + '</div>';
      if (!rv) {
        return '<div class="pad mt16">' + UI.empty('⏳', '这个专项还没结束',
          '结束之后这里会自动生成一份复盘 —— 计划用了多少、实际用了多少、剩多少。') + '</div>';
      }
      const k = LJ.engine.fundKind(f.kind);
      const execPct = Math.round(rv.executed * 100);

      let html = '<div class="pad">';
      html += '<div class="card mt16">' +
        '<div class="row between"><div><div class="xs muted">' +
        U.ymdCN(rv.from) + ' ~ ' + U.ymdCN(rv.to) + '</div>' +
        '<div style="font-size:17px;font-weight:700;margin-top:5px">' + k.icon + ' ' +
        UI.esc(rv.name) + '</div></div>' +
        '<span class="stamp">已复盘</span></div>' +
        '<div class="grid3 mt16" style="margin-top:16px">' +
        '<div class="metric"><div class="k">计划</div><div class="v">¥' + U.wonInt(rv.target) + '</div></div>' +
        '<div class="metric"><div class="k">实际用了</div><div class="v">¥' + U.wonInt(rv.used) + '</div></div>' +
        '<div class="metric"><div class="k">执行率</div><div class="v">' + execPct +
        '<span class="u">%</span></div></div>' +
        '</div>' +
        '<div class="mt16" style="margin-top:14px">' + UI.bar(Math.min(1, rv.executed)) + '</div>' +
        '<div class="xs muted" style="margin-top:8px">' +
        rv.days + ' 天 · 日均 ¥' + U.wonInt(rv.avgPerDay) +
        ' · 共 ' + rv.cats.reduce((s, c) => s + 1, 0) + ' 个大类有支出</div>' +
        '</div>';

      /* 结论：只说事实，不评判 */
      if (rv.notes.length) {
        html += '<div class="sec-title">这次的结果</div>' +
          '<div class="card flat"><div class="sm t2" style="line-height:1.85">' +
          rv.notes.map(n => UI.esc(n)).join('<br>') + '</div></div>';
      }

      /* 花在哪些类上 —— 这一块**只有本人看得到**，家人侧读的是不含大类的投影 */
      if (rv.cats.length) {
        html += '<div class="sec-title">花在哪些类上<span class="more">只有你看得到</span></div>';
        html += '<div class="card">' + rv.cats.map(c =>
          '<div style="margin-bottom:13px"><div class="row between">' +
          '<span class="sm">' + c.icon + ' ' + UI.esc(c.name) + '</span>' +
          '<span class="xs mono muted">¥' + U.wonInt(c.amount) + ' · ' +
          (rv.used > 0 ? Math.round(c.amount / rv.used * 100) : 0) + '%</span></div>' +
          '<div class="mt8" style="margin-top:6px">' +
          UI.bar(rv.used > 0 ? c.amount / rv.used : 0, c.color) + '</div></div>').join('') +
          '</div>';
      }

      /* 家人看到的版本 —— 把披露口径直接摆出来，用户才信得过 */
      const sup = LJ.engine.fundReviewForSupporter(rv);
      html += '<div class="proto mt20"><div class="ph"><span class="seal">界</span>家人看到的是这些</div>' +
        '<div class="xs t2" style="line-height:1.85">' +
        '「' + UI.esc(rv.name) + '」计划 ¥' + U.wonInt(sup.target) +
        '，实际用了 ¥' + U.wonInt(sup.used) + '（执行率 ' + Math.round(sup.executed * 100) + '%）。<br>' +
        '<b>上面那张"花在哪些类上"的构成，家人看不到。</b>' +
        '专项的披露口径一直是"看进度、不看买了什么" —— 复盘也不会绕开它。</div></div>';

      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) { LJ._bindGo(el, ctx); }
  };

  P['youth.funds'] = {
    render(ctx) {
      const api = ctx.api;
      const list = api.fund.list();
      const live = list.filter(f => f.status === 'active');
      const closed = list.filter(f => f.status === 'closed');
      const scene = api.fund.scene();
      const hasScene = scene && !live.some(f => f.kind === scene.kind);
      let html = '<div class="pad">';

      /* 场景提示：到点了主动说（3.5.1/3.5.2 的"自动识别时间节点"）——
         这是「完成一次场景化规划」解锁的「场景提醒」。 */
      if (hasScene && api.unlock.has('scene_remind')) {
        html += '<div class="fu-scene">' +
          '<div class="sh"><b>' + scene.name + '</b><span class="tag info">现在</span></div>' +
          '<div class="sd">' + UI.esc(scene.hint) + '</div>' +
          '<div class="sd" style="color:var(--muted)">参考金额 ¥' +
          U.won(scene.suggest) + ' · 这个月就能开</div>' +
          '<button class="btn soft sm mt12" style="margin-top:12px" data-ask="' + scene.kind + '">' +
          '跟家人说一声，开一个专项</button></div>';
      }

      /* 进行中 */
      html += '<div class="sec-title">进行中<span class="more">' + live.length + ' 个</span></div>';
      if (!live.length) {
        html += '<div class="card flat"><div class="sm muted" style="text-align:center;padding:14px 0">' +
          '还没有专项资金。日常开销走生活费，大额的专项要单独开。</div></div>';
      } else {
        html += live.map(f => fundCard(f, api.fund.progress(f))).join('');
      }

      /* 应急医疗通道 */
      html += '<div class="sec-title">紧急情况</div>';
      html += '<div class="card">' +
        '<div class="row" style="gap:11px">' +
        '<span style="font-size:22px">🏥</span>' +
        '<div class="grow"><div style="font-size:14.5px;font-weight:800">应急医疗支持通道</div>' +
        '<div class="xs muted" style="margin-top:5px;line-height:1.7">' +
        '突发生病可以先去看，钱的事走这条通道。</div></div></div>' +
        '<div class="fu-see" style="margin-top:14px">' +
        '<div class="sh">这条通道为什么能保护你的隐私</div><ul>' +
        '<li>家人收到的只有「需要医疗应急支持 ¥XXX」和一句话说明</li>' +
        '<li class="no">没有科室、没有药品、没有诊断结果</li>' +
        '<li class="no">它和你的账本分开走，不进日常流水</li>' +
        '</ul></div>' +
        '<button class="btn mt16" data-med>发起应急医疗求助</button></div>';

      /* 已结项 */
      if (closed.length) {
        html += '<div class="sec-title">已结项<span class="more">' + closed.length + ' 个</span></div>';
        html += closed.map(f => fundCard(f, api.fund.progress(f), { see: false, review: true })).join('');
      }

      /* 家人开专项的入口说明 */
      html += '<div class="proto mt20"><div class="ph"><span class="seal">专</span>专项和生活费不一样</div>' +
        '<div class="xs t2" style="line-height:1.85">' +
        '生活费是每月固定给你的，花在哪由你定。<br>' +
        '专项资金是一笔有用途、有期限的钱 —— 学费、实习、看病这类' +
        '<b>一次性的、省不掉的大额支出</b>。<br>' +
        '它不进日常预算，也不会把某个月的大类支出顶爆，' +
        '家人那边看到的只有"用了多少"。<br>' +
        '<b>专项由家人开立和转入，你负责花，两边都看得见进度。</b></div></div>';

      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      const api = ctx.api;
      /* 已结项的专项 → 复盘页 */
      el.querySelectorAll('[data-fundreview]').forEach(n => {
        n.onclick = () => ctx.go('youth.fundReview', { id: n.getAttribute('data-fundreview') });
      });
      const askSheet = (kind) => {
        const k = LJ.engine.fundKind(kind);
        UI.confirm({
          title: '跟家人说一声？',
          desc: '会发一条消息给家人，说明你想开一个「' + k.name + '」（' + k.desc + '）。' +
            '专项由家人开立和转入，你只需要说清楚用途。',
          okText: '发过去',
          onOk() {
            const b = LJ.store.all('binding')[0];
            LJ.store.insert('message', {
              userId: b.supporterId, type: 'request', title: '孩子想开一个专项',
              body: '「' + k.name + '」· ' + k.desc + '。可以在「专项支持」里开立并转入。',
              read: false, at: LJ.clock.nowISO()
            });
            UI.toast('已告诉家人');
          }
        });
      };
      el.querySelectorAll('[data-ask]').forEach(n => n.onclick = () => askSheet(n.getAttribute('data-ask')));

      el.querySelectorAll('[data-med]').forEach(n => n.onclick = () => {
        const box = document.createElement('div');
        box.innerHTML =
          '<div class="cm-kv"><span>需要多少</span></div>' +
          '<input class="ta" id="medAmt" inputmode="decimal" placeholder="比如 1200" style="min-height:44px">' +
          '<div class="cm-kv" style="margin-top:12px"><span>一句话说明</span></div>' +
          '<textarea class="ta" id="medWhy" rows="2" placeholder="比如：需要做个检查，具体等结果出来再说"></textarea>';
        UI.sheet({
          title: '应急医疗支持', sub: '只填金额和一句话。家人收到的不含科室、药品和诊断。',
          mount(s, close) {
            s.appendChild(box);
            const b = document.createElement('button');
            b.className = 'btn mt16'; b.textContent = '发给家人';
            b.onclick = () => {
              const amt = Number(String(box.querySelector('#medAmt').value).replace(/[^\d.]/g, ''));
              const why = String(box.querySelector('#medWhy').value || '').trim();
              if (!(amt > 0)) return UI.toast('填一下大概需要多少');
              close();
              api.request.create({
                template: 'medical', name: '应急医疗支持', amount: amt,
                reason: why || '突发就医，具体等有结果了再说'
              });
              UI.toast('已发出，家人收到的申请里没有明细');
            };
            s.appendChild(b);
          }
        });
      });
    }
  };

  /* ============================================================
     大学阶段财务成长报告（产品文档 3.5.5）
     纵向回顾：从入学到现在，收到了什么、花在了哪、能力有没有长
     ============================================================ */
  P['youth.gradReport'] = {
    title: '大学阶段财务成长报告', chrome: 'plain',
    render(ctx) {
      const g = ctx.api.grad.report();
      const trendDown = g.lateAvg <= g.earlyAvg;
      let html = '<div class="pad">';

      html += '<div class="gr-hero">' +
        '<div class="n">' + g.days + '<span style="font-size:16px;font-weight:700"> 天</span></div>' +
        '<div class="k">' + g.firstDate + ' 至今 · ' + g.months + ' 个月</div>' +
        '<div class="d">这期间家里累计支持 ¥' + U.won(g.familyIn) + '，' +
        '你自己挣到 / 拿到的有 ¥' + U.won(g.ownIn) +
        '（占 ' + Math.round(g.ownRatio * 100) + '%）。' +
        '这份报告只给你自己看，不含任何一笔消费的道德评价。</div>' +
        '</div>';

      html += '<div class="gr-grid">' +
        '<div class="gr-cell"><div class="k">累计支出</div><div class="v">¥' + U.won(g.totalOut) + '</div>' +
        '<div class="s">月均 ¥' + U.won(g.avgMonth) + '</div></div>' +
        '<div class="gr-cell"><div class="k">累计结余</div><div class="v" style="color:' +
        (g.net >= 0 ? 'var(--ok)' : 'var(--coral)') + '">¥' + U.won(g.net) + '</div>' +
        '<div class="s">收入 − 支出</div></div>' +
        '<div class="gr-cell"><div class="k">掌控指数</div><div class="v">' + g.control.score + '</div>' +
        '<div class="s">' + g.control.level + '</div></div>' +
        '<div class="gr-cell"><div class="k">完成任务</div><div class="v">' + g.tasksDone + '</div>' +
        '<div class="s">累计支持 ' + g.supportCount + ' 次</div></div>' +
        '</div>';

      html += '<div class="sec-title">花钱的节奏</div>';
      html += '<div class="card">' +
        '<div class="cm-kv"><span>前半段月均</span><b>¥' + U.won(g.earlyAvg) + '</b></div>' +
        '<div class="cm-kv"><span>后半段月均</span><b>¥' + U.won(g.lateAvg) + '</b></div>' +
        (g.peakMonth ? '<div class="cm-kv"><span>花得最多的一个月</span><b>' +
          g.peakMonth + ' · ¥' + U.won(g.peakAmount) + '</b></div>' : '') +
        '<div class="xs muted" style="margin-top:12px;line-height:1.8">' +
        (trendDown
          ? '后半段的月均比前半段低 ¥' + U.won(g.earlyAvg - g.lateAvg) +
            '。不是省出来的，是节奏稳下来了 —— 该花的地方花，不该花的没花。'
          : '后半段的月均比前半段高了 ¥' + U.won(g.lateAvg - g.earlyAvg) +
            '。可能是场景变了（实习、求职、社交），也可能只是这两个月刚好有大件。') +
        '</div></div>';

      html += '<div class="sec-title">收入的来源结构</div>';
      html += '<div class="card">' +
        '<div class="row between"><span class="sm t2">家庭支持</span>' +
        '<span class="mono" style="font-weight:700">¥' + U.won(g.familyIn) + '</span></div>' +
        '<div class="mt8" style="margin-top:8px">' +
        UI.bar(g.totalIn ? g.familyIn / g.totalIn : 0, 'var(--ink)') + '</div>' +
        '<div class="row between" style="margin-top:14px"><span class="sm t2">个人自有</span>' +
        '<span class="mono" style="font-weight:700">¥' + U.won(g.ownIn) + '</span></div>' +
        '<div class="mt8" style="margin-top:8px">' +
        UI.bar(g.totalIn ? g.ownIn / g.totalIn : 0, 'var(--lav-d)') + '</div>' +
        '<div class="xs muted" style="margin-top:12px;line-height:1.8">' +
        '自有收入占比 ' + Math.round(g.ownRatio * 100) + '%。' +
        '这个数字只作为客观参考 —— 临界不引导、也不推荐任何兼职或收入渠道。</div></div>';

      html += '<div class="proto mt20"><div class="ph"><span class="seal">续</span>这份报告的用法</div>' +
        '<div class="xs t2" style="line-height:1.85">' +
        '毕业那天把它和「财务掌控力认证」一起拿出来，' +
        '就是一个大学生四年财务能力从零到自主的完整证据链。<br>' +
        '你可以选择保留家庭支持通道，也可以就此对接工行成人个人金融服务体系 —— ' +
        '<b>这个选择权在你手上</b>。</div></div>';

      html += '<div style="height:30px"></div></div>';
      return html;
    }
  };

  /* ============================================================
     我的
     ============================================================ */
  P['youth.me'] = {
    title: '我的', chrome: 'tab',
    render(ctx) {
      const api = ctx.api, me = api.profile(), partner = api.partner();
      const bind = api.binding();
      const cfg = api.disclosure.current();
      const unread = api.message.unread();
      const grants = api.grant.list();
      const riskBadge = api.risk.badge();
      const planWaiting = api.plan.incoming().length;
      const fundLive = api.fund.active().length;
      const fundScene = api.fund.scene();
      let html = '<div class="pad">';

      html += '<div class="card mt16"><div class="row">' +
        '<div style="width:52px;height:52px;border-radius:50%;background:var(--navy);color:#fff;' +
        'display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600">' + UI.esc(me.avatar) + '</div>' +
        '<div class="grow"><div style="font-size:17px;font-weight:700">' + UI.esc(me.name) + '</div>' +
        '<div class="xs muted" style="margin-top:3px">' + UI.esc(me.phone) + ' · ' + me.level + '</div></div>' +
        '<span class="tag info">青年端</span></div></div>';

      html += '<div class="sec-title">家庭关系</div><div class="list">' +
        '<div class="li"><div class="ico">👤</div><div class="grow"><div style="font-size:14.5px">' +
        UI.esc(partner ? partner.name : '未绑定') + '</div>' +
        '<div class="xs muted" style="margin-top:2px">' + UI.esc(partner ? partner.relation : '') + ' · 已绑定</div></div>' +
        '<span class="tag ok">生效中</span></div>' +
        '</div>';

      /* ---- 我的银行卡：堆叠展示，点卡进「银行卡管理」 ----
         折叠只露 1 张，不裁卡面（保持 1.586 真实比例），靠"只显示一张"来省占屏；
         展开时另外两张从第一张下面滑出来，入口是堆叠下面那行小字。
         整块卡堆点击 → 银行卡管理页，用和首页黑卡同样的全屏缩放转场。 */
      const cards = api.card.list();
      html += '<div class="sec-title">我的银行卡' +
        '<span class="more" data-cards>管理' + UI.icon('chevron', 12) + '</span></div>';
      html += '<div class="cd-wrap">' +
        '<div class="cd-stack" id="cdStack">' +
        cards.map((c, i) =>
          '<div class="cd-card" data-cd="' + i + '" data-card-id="' + c.id +
          '" style="z-index:' + (cards.length - i) + '">' +
          '<img src="' + c.img + '" alt="' + UI.esc(c.name) + '">' +
          '<div class="cd-veil"></div>' +
          '<div class="cd-foot"><span class="cd-name">' + UI.esc(c.name) + '</span>' +
          '<span class="cd-tail">•••• ' + c.tail + '</span></div>' +
          '</div>').join('') +
        '</div>' +
        '</div>';
      html += '<button class="cd-hint" id="cdHint"></button>';

      /* ---- 信息边界（本页唯一主题）---- */
      html += '<div class="sec-title">信息边界</div>';
      html += '<div class="proto" data-go="youth.mode"><div class="ph"><span class="seal">约</span>省心模式 · ' + cfg.name + '</div>' +
        '<div class="sm t2" style="line-height:1.7">' + UI.esc(cfg.desc) + '</div>' +
        '<div class="xs muted" style="margin-top:8px">单笔交易明细永不向家人开放</div></div>';

      html += '<div class="list mt12">' +
        '<div class="li" data-go="youth.funds"><div class="ico" style="background:#EAF4FF">🎯</div>' +
        '<div class="grow"><div style="font-size:14.5px">我的专项</div>' +
        '<div class="xs muted" style="margin-top:2px">' +
        (fundLive ? fundLive + ' 个进行中 · ' +
          (fundScene ? fundScene.name : '开学、实习、看病的专用钱袋')
          : '开学、实习、看病的专用钱袋') + '</div></div>' +
        (fundLive ? '<span class="tag info">' + fundLive + '</span>' : '<div class="muted">›</div>') + '</div>' +
        '<div class="li" data-go="youth.plan"><div class="ico" style="background:#EDFBF2">💠</div>' +
        '<div class="grow"><div style="font-size:14.5px">我的生活费</div>' +
        '<div class="xs muted" style="margin-top:2px">基准 ¥' + U.won(api.plan.base()) +
        ' / 月' + (planWaiting ? ' · 有方案待你确认' : '') + '</div></div>' +
        (planWaiting ? '<span class="tag warn">' + planWaiting + '</span>' : '<div class="muted">›</div>') + '</div>' +
        '<div class="li" data-go="youth.risk"><div class="ico" style="background:#FFE9E5">🛡</div>' +
        '<div class="grow"><div style="font-size:14.5px">风险预警</div>' +
        '<div class="xs muted" style="margin-top:2px">日常消费一条通知都不会发给家人</div></div>' +
        (riskBadge ? '<span class="tag danger">' + riskBadge + '</span>' : '<div class="muted">›</div>') + '</div>' +
        '<div class="li" data-go="youth.grants"><div class="ico" style="background:#EDE9FB">🔑</div>' +
        '<div class="grow"><div style="font-size:14.5px">授权中心</div>' +
        '<div class="xs muted" style="margin-top:2px">' + grants.filter(g => g.status === 'active').length + ' 项生效中</div></div><div class="muted">›</div></div>' +
        '<div class="li" data-go="common.contracts"><div class="ico" style="background:#EDE9FB">🛡</div>' +
        '<div class="grow"><div style="font-size:14.5px">权限自检</div>' +
        '<div class="xs muted" style="margin-top:2px">家人当前能看到什么、看不到什么</div></div><div class="muted">›</div></div>' +
        '<div class="li" data-go="common.audit"><div class="ico" style="background:#FFF0D4">📜</div>' +
        '<div class="grow"><div style="font-size:14.5px">留痕记录</div>' +
        '<div class="xs muted" style="margin-top:2px">谁在什么时候改了什么</div></div><div class="muted">›</div></div>' +
        '</div>';

      /* 成长相关入口已全部移除，统一走首页成长卡 */
      html += '<div class="sec-title">其他</div><div class="list">' +
        '<div class="li" data-go="common.messages"><div class="ico">🔔</div>' +
        '<div class="grow"><div style="font-size:14.5px">消息中心</div></div>' +
        (unread ? '<span class="tag danger">' + unread + '</span>' : '<div class="muted">›</div>') + '</div>' +
        '<div class="li" data-go="common.help"><div class="ico">❓</div>' +
        '<div class="grow"><div style="font-size:14.5px">帮助与说明</div></div><div class="muted">›</div></div>' +
        LJ.TOUR_ROW +
        LJ.LOGOUT_ROW +
        '</div>';

      html += '<div class="pad" style="padding:26px 4px 10px;text-align:center">' +
        '<div class="xs muted">临界 · 家庭支持协同账户 v1.0.0</div></div>';

      html += '</div>';
      return html;
    },
    mount(el, ctx) {
      LJ._bindGo(el, ctx);
      LJ.bindLogout(el);

      /* 我的银行卡：堆叠 / 展开 + 点卡进管理页
         折叠态把卡面裁扁（每张 2.25:1），否则 3 张完整卡叠起来占掉半屏；
         展开态还原银行卡真实比例 1.586:1，能看清整张卡面。 */
      const stack = el.querySelector('#cdStack');
      if (stack) {
        const n = stack.querySelectorAll('.cd-card').length;
        const GAP = 10;
        const W = stack.clientWidth || 339;
        const H = Math.round(W / 1.586);        // 银行卡真实比例，不裁
        const cards = [].slice.call(stack.querySelectorAll('.cd-card'));
        const hint = el.querySelector('#cdHint');
        const layout = (open) => {
          stack.style.height = (open ? n * H + (n - 1) * GAP : H) + 'px';
          cards.forEach((c, i) => {
            c.style.height = H + 'px';
            c.style.top = (open ? i * (H + GAP) : 0) + 'px';
            c.style.opacity = (open || i === 0) ? '1' : '0';
          });
          if (hint) {
            hint.innerHTML = open
              ? '收起 ⌃'
              : '展开全部 ' + n + ' 张 ⌄';
            hint.classList.toggle('open', open);
          }
        };
        layout(!!LJ.cardsOpen);

        /* 展开/收起只走下面那行小字，卡面本身留给「进管理页」 */
        if (hint) {
          hint.onclick = () => { LJ.cardsOpen = !LJ.cardsOpen; layout(LJ.cardsOpen); };
        }
        /* 点某张卡 → 银行卡管理，用全屏缩放转场（和首页黑卡→账单同款）。
           折叠态只有第一张可见，所以默认就是它。

           ★ 这里原来写着 `c.onclick = null;`，注释是「防止连点触发两次转场」。
           那是一次性的：第一次点完处理器就永久没了，从管理页返回后
           卡面还是同一个元素，再点**永远没反应** —— 不是 570ms 内没反应，
           是一直没反应，直到整页重新渲染。
           连点保护交给 router（它知道「正在往哪儿展开」），页面别自己摘处理器。 */
        cards.forEach((c, i) => {
          c.onclick = () => {
            if (!LJ.cardsOpen && i !== 0) return;
            /* 共享元素转场（不是全屏缩放）：卡面从卡堆位置平移进管理页的卡位，
               尺寸不变（两边都是 346x218），缩放交给背景。
               「我的」与管理页卡同尺寸是硬约束，见 app.css 里 .cm-stage 的注释。 */
            ctx.goShared('youth.cards', { id: c.getAttribute('data-card-id') }, c, '.cm-card.on');
          };
        });
      }
    }
  };

  /* ============================================================
     银行卡管理
     从「我的 → 我的银行卡」点卡进来，全屏缩放转场。
     这一页回答的不是「我有几张卡」，而是「每张卡在这里扮演什么角色」——
     角色变了，钱算哪个池子、家人能看到什么，跟着一起变。
     ============================================================ */
  /* ============================================================
     银行卡管理页里、卡组以下的那部分（基本信息 / 角色 / 家人可见）
     ------------------------------------------------------------
     单独抽出来，是为了「点尾号切换卡」时**只换这一块的内容**：
     整页重渲染（ctx.replace）会让整页滑入、其他元素全部跟着动，
     而需求是「只让银行卡滚过来，页面中其他元素不动」。
     这几块的行数固定（角色恒 3 项、家人可见恒 2 行），换内容不改高度，
     所以下面的东西不会位移。
     ============================================================ */
  function cardsRest(api, cur) {
    const meta = api.card.roleMeta(cur.role);
    let html = '';

    if (cur.frozen) {
      html += '<div class="cm-frozen-note">这张卡已冻结，暂时不能收付款。' +
        '家人只会收到一条不含明细的通知。</div>';
    }

    /* ---------- 基本信息 ---------- */
    html += '<div class="card mt16">' +
      '<div class="row between"><div style="min-width:0">' +
      '<div style="font-size:16px;font-weight:800;letter-spacing:-.02em">' + UI.esc(cur.name) + '</div>' +
      '<div class="xs muted" style="margin-top:5px">' + UI.esc(cur.bank) + '</div>' +
      '</div><span class="tag ' + (cur.frozen ? 'danger' : 'ok') + '">' +
      (cur.frozen ? '已冻结' : '正常') + '</span></div>' +
      '<div class="cm-kv"><span>卡号</span><b>•••• •••• •••• ' + cur.tail + '</b></div>' +
      '<div class="cm-kv"><span>类型</span><b>' + UI.esc(cur.kind) + '</b></div>' +
      /* 「默认扣款」这一行**必须恒渲染**（不是默认卡时显示"否"）：
         原来是非默认卡就整行不渲染，于是切换卡时这一块会高一截/矮一截，
         下面所有元素跟着上下跳 —— 需求是"其他元素不动"。
         顺带这也是更好的信息展示：一眼能看出哪张是默认扣款卡。
         同样注意别在这里加会随卡变化的行数（探针 probe-cardswitch 会抓）。 */
      '<div class="cm-kv"><span>默认扣款</span><b>' + (cur.isDefaultPay ? '是' : '否') + '</b></div>' +
      '</div>';

    /* ---------- 这张卡的角色（这一页的正题）---------- */
    html += '<div class="sec-title">这张卡的角色' +
      '<span class="more">决定钱算哪个池子</span></div>';
    html += '<div class="cm-roles">' + api.card.ROLES.map(r => {
      const owner = api.card.byRole(r.id);
      const mine = cur.role === r.id;
      const taken = !mine && owner;
      return '<button class="cm-role' + (mine ? ' on' : '') + '" data-role="' + r.id + '">' +
        '<span class="ic">' + r.icon + '</span>' +
        '<span class="tx"><b>' + r.name + '</b><i>' + r.desc + '</i></span>' +
        '<span class="mk">' + (mine ? '✓' : taken ? '⇄' : '') + '</span>' +
        '</button>';
    }).join('') + '</div>';
    if (meta) {
      html += '<div class="proto mt12"><div class="ph"><span class="seal">账</span>换了角色会怎样</div>' +
        '<div class="xs t2" style="line-height:1.8">' +
        '「' + api.card.roleName(cur.role) + '」上原来那张卡会自动接过你现在的角色，' +
        '两张卡对调 —— 这样整本账始终能被三张卡不重不漏地切开。</div></div>';
    }

    /* ---------- 家人能看到这张卡的什么 ---------- */
    html += '<div class="sec-title">家人能看到什么</div>';
    html += '<div class="list">' +
      '<div class="li"><div class="ico" style="background:#EDE9FB">👁</div>' +
      '<div class="grow"><div style="font-size:14.5px">这张卡的余额</div>' +
      '<div class="xs muted" style="margin-top:2px">' +
      (cur.familyVisible ? '家人能看到余额数字' : '家人看不到余额') + '</div></div>' +
      '<button class="switch' + (cur.familyVisible ? ' on' : '') + '" data-vis="1"></button></div>' +
      '<div class="li"><div class="ico" style="background:#FFE9E5">🔒</div>' +
      '<div class="grow"><div style="font-size:14.5px">单笔交易明细</div>' +
      '<div class="xs muted" style="margin-top:2px">任何情况下都不向家人开放</div></div>' +
      '<span class="tag">固定</span></div>' +
      '</div>';

    /* 「这张卡上的账」和「卡片状态」在详情页（cardDetail）——
       点卡面进详情，共享元素转场；这里只是入口页，别把正题压在这里。 */

    return html;
  }

  P['youth.cards'] = {
    title: '银行卡管理', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const cards = api.card.list();
      if (!cards.length) return UI.empty('💳', '还没有绑定银行卡');
      let cur = cards.find(c => c.id === ctx.params.id) || cards[0];
      const idx = cards.indexOf(cur);
      const meta = api.card.roleMeta(cur.role);

      let html = '<div class="pad">';

      /* ---------- 卡组：左右切换 ---------- */
      html += '<div class="cm-stage">' +
        cards.map((c, i) =>
          '<div class="cm-card' + (i === idx ? ' on' : '') + '" data-pick="' + c.id + '">' +
          '<img src="' + c.img + '" alt="' + UI.esc(c.name) + '">' +
          '<div class="cd-veil"></div>' +
          (c.frozen ? '<div class="cm-frozen">已冻结</div>' : '') +
          '<div class="cd-foot"><span class="cd-name">' + UI.esc(c.name) + '</span>' +
          '<span class="cd-tail">•••• ' + c.tail + '</span></div>' +
          '</div>').join('') +
        '</div>';
      html += '<div class="cm-dots">' + cards.map((c, i) =>
        '<i class="' + (i === idx ? 'on' : '') + '" data-pick="' + c.id + '">' +
        '•••• ' + c.tail + '</i>').join('') + '</div>';

      /* 卡组以下的所有区块放进一个容器：切换卡时只换它的 innerHTML ——
         不重渲染整页、不走页面转场，做到「只有卡滚过来，其他元素不动」。
         这些区块的行数都是固定的（角色恒 3 项、家人可见恒 2 行），
         换内容不会改变高度，所以下面的东西不会位移。 */
      html += '<div id="cmRest">' + cardsRest(api, cur) + '</div>';

      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      const api = ctx.api;
      const cards = api.card.list();
      const cur = () => cards.find(c => c.id === ctx.params.id) || cards[0];
      const restEl = () => el.querySelector('#cmRest');

      /* 下面那几块（角色 / 家人可见）的点击绑定抽出来 ——
         切换卡时换掉了整块 innerHTML，必须重新绑一次 */
      function bindRest() {
        el.querySelectorAll('[data-role]').forEach(n => {
          n.onclick = () => {
            const c = cur();
            const role = n.getAttribute('data-role');
            if (!c || c.role === role) return;
            const other = api.card.byRole(role);
            api.card.setRole(c.id, role);
            ctx.refreshTop();
            UI.toast(other && other.id !== c.id
              ? '已对调：' + c.name + ' ↔ ' + other.name
              : c.name + ' 现在是「' + api.card.roleName(role) + '」');
          };
        });
        el.querySelectorAll('[data-vis]').forEach(n => {
          n.onclick = () => {
            const c = cur();
            if (!c) return;
            api.card.setVisible(c.id, !c.familyVisible);
            ctx.refreshTop();
            UI.toast(c.familyVisible ? '已收回这张卡的余额可见' : '家人现在能看到这张卡的余额');
          };
        });
      }

      /* ============================================================
         点尾号切换卡：**只让卡滚动过来，页面中其他元素不动**
         ------------------------------------------------------------
         原来是 ctx.replace('youth.cards', {id}) —— 那是弹栈 + 压栈，
         整页会滑入、滚动位置归零，下面的区块全部跟着动。
         现在改成：
           · 卡组内部做横向滚动（出场的往反方向滑走，进场的从对应方向滑进来）
           · 卡组以下那一块只换 innerHTML，原地更新内容，不位移、不转场
           · 同步 ctx.params.id，否则随后任何 refreshTop（比如换角色）
             会按旧 id 重渲染，卡又跳回去
         方向跟圆点的左右顺序一致：往右边的圆点点，卡从右边进来。
         ============================================================ */
      function slideTo(id) {
        const stage = el.querySelector('.cm-stage');
        const all = [].slice.call(stage.querySelectorAll('.cm-card'));
        const from = all.findIndex(c => c.classList.contains('on'));
        const to = all.findIndex(c => c.getAttribute('data-pick') === id);
        if (to < 0 || to === from) return;

        const target = cards.find(c => c.id === id);
        if (!target) return;

        const dir = to > from ? 1 : -1;
        const W = stage.clientWidth;
        const out = all[from], inc = all[to];
        const MS = 340;
        const EASE = 'cubic-bezier(.32,.72,.24,1)';

        ctx.params.id = id;                       // 之后 refreshTop 才不会跳回旧卡

        /* 进场卡先钉到侧边（不可见），出场卡钉回原位 —— 都是起始态 */
        inc.style.transition = 'none';
        out.style.transition = 'none';
        inc.style.transform = 'translateX(' + (dir * W) + 'px)';
        inc.style.opacity = '0';
        out.style.transform = 'translateX(0)';
        out.style.opacity = '1';
        void inc.offsetWidth;                     // 起始态落地，下面才会触发过渡

        inc.classList.add('on');                  // 交出可点性（.cm-card 默认 pointer-events:none）
        out.classList.remove('on');

        const T = 'transform ' + MS + 'ms ' + EASE + ', opacity ' + MS + 'ms ease';
        inc.style.transition = T;
        out.style.transition = T;
        inc.style.transform = 'translateX(0)';
        inc.style.opacity = '1';
        out.style.transform = 'translateX(' + (-dir * W) + 'px)';
        out.style.opacity = '0';

        /* 收尾：清掉内联，交回给 .on / 默认类样式 */
        setTimeout(() => {
          [inc, out].forEach(c => {
            c.style.transition = '';
            c.style.transform = '';
            c.style.opacity = '';
          });
        }, MS + 40);

        /* 圆点高亮：圆点自己不动，只换哪一个是亮的 */
        el.querySelectorAll('.cm-dots i').forEach(d => {
          d.classList.toggle('on', d.getAttribute('data-pick') === id);
        });

        /* 卡组以下的区块：原地换内容，不动位置、不走转场 */
        const box = restEl();
        if (box) { box.innerHTML = cardsRest(api, target); bindRest(); }
      }

      /* 圆点 = 尾号：只滚动卡面，其他元素不动 */
      el.querySelectorAll('.cm-dots [data-pick]').forEach(n => {
        n.onclick = () => slideTo(n.getAttribute('data-pick'));
      });

      /* 点卡面 → 卡片详情，共享元素转场：卡面飞过去、背景连续平滑缩放。
         卡组是叠放的，只有当前卡（.on）可点，所以点卡就是「打开这张卡的详情」。 */
      el.querySelectorAll('.cm-card').forEach(n => {
        n.onclick = () => ctx.goShared('youth.cardDetail',
          { id: n.getAttribute('data-pick') || ctx.params.id }, n, '[data-detail-card]');
      });

      /* 角色 / 家人可见的绑定统一走 bindRest（切换卡会换掉那块的 innerHTML） */
      bindRest();
    }
  };

  /* ============================================================
     卡片详情
     从「银行卡管理」点卡进来 —— 共享元素转场：卡面从列表位置飞到
     这里的卡位（router.pushShared），背景与卡片容器连着一起连续缩放。
     这一页回答「这张卡本身」：卡号、它上面的账、能不能冻结。
     ============================================================ */
  P['youth.cardDetail'] = {
    title: '卡片详情', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const cards = api.card.list();
      const cur = cards.find(c => c.id === ctx.params.id) || cards[0];
      if (!cur) return UI.empty('💳', '这张卡不存在');
      const st = api.card.stat(cur.id);

      let html = '<div class="pad">';

      /* 大卡：共享元素落点（data-detail-card 与 router 的 sharedSel 对上）。
         必须和列表页卡面同一套结构（img + veil + foot），接缝才看不见。 */
      html += '<div class="cd-detail">' +
        '<div class="cd-detail-card" data-detail-card>' +
        '<img src="' + cur.img + '" alt="' + UI.esc(cur.name) + '">' +
        '<div class="cd-veil"></div>' +
        (cur.frozen ? '<div class="cm-frozen">已冻结</div>' : '') +
        '<div class="cd-foot"><span class="cd-name">' + UI.esc(cur.name) + '</span>' +
        '<span class="cd-tail">•••• ' + cur.tail + '</span></div>' +
        '</div></div>';

      /* ---------- 基本信息 ---------- */
      html += '<div class="card mt16">' +
        '<div class="row between"><div style="min-width:0">' +
        '<div style="font-size:16px;font-weight:800;letter-spacing:-.02em">' + UI.esc(cur.name) + '</div>' +
        '<div class="xs muted" style="margin-top:5px">' + UI.esc(cur.bank) + '</div>' +
        '</div><span class="tag ' + (cur.frozen ? 'danger' : 'ok') + '">' +
        (cur.frozen ? '已冻结' : '正常') + '</span></div>' +
        '<div class="cm-kv"><span>卡号</span><b>•••• •••• •••• ' + cur.tail + '</b></div>' +
        '<div class="cm-kv"><span>类型</span><b>' + UI.esc(cur.kind) + '</b></div>' +
        (cur.isDefaultPay ? '<div class="cm-kv"><span>默认扣款</span><b>是</b></div>' : '') +
        '</div>';

      /* ---------- 这张卡上的账 ---------- */
      html += '<div class="sec-title">这张卡上的账' +
        '<span class="more">' + st.count + ' 笔</span></div>';
      html += '<div class="lg-duo">' +
        '<div class="lg-card"><div class="n">¥' + U.won(st.inTotal) + '</div>' +
        '<div class="k">进账 · ' + st.inCount + ' 笔</div>' +
        (st.income.length ? '<div class="lg-line"><span>' + UI.esc(st.income[0].name) + '</span>' +
          '<b class="in">¥' + U.won(st.income[0].sum) + '</b></div>' : '') +
        '</div>' +
        '<div class="lg-card"><div class="n">¥' + U.won(st.outTotal) + '</div>' +
        '<div class="k">出账 · ' + st.outCount + ' 笔</div>' +
        (st.cats.length ? '<div class="lg-line"><span>' + st.cats[0].icon + ' ' +
          UI.esc(st.cats[0].name) + '</span>' +
          '<b class="out">¥' + U.won(st.cats[0].amount) + '</b></div>' : '') +
        '</div>' +
        '</div>';

      if (st.income.length) {
        html += '<div class="sec-title">入账来源</div><div class="list">' +
          st.income.slice(0, 3).map(s =>
            '<div class="li"><div class="ico">💰</div>' +
            '<div class="grow"><div style="font-size:14px">' + UI.esc(s.name) + '</div>' +
            '<div class="xs muted" style="margin-top:2px">' + s.n + ' 笔</div></div>' +
            '<b class="amt in">+¥' + U.won(s.sum) + '</b></div>').join('') + '</div>';
      }
      if (st.cats.length) {
        html += '<div class="sec-title">出账构成</div><div class="list">' +
          st.cats.slice(0, 5).map(c =>
            '<div class="li"><div class="ico">' + c.icon + '</div>' +
            '<div class="grow"><div style="font-size:14px">' + UI.esc(c.name) + '</div></div>' +
            '<b class="amt out">−¥' + U.won(c.amount) + '</b></div>').join('') + '</div>';
      }
      if (!st.count) {
        html += UI.empty('🧾', '这张卡还没有账', '把它的角色设置成某一项，对应的账就会归到这里。');
      }

      /* ---------- 卡片状态 ---------- */
      html += '<div class="sec-title">卡片状态</div>';
      html += '<div class="list"><div class="li" data-freeze="' +
        (cur.frozen ? '0' : '1') + '"><div class="ico" style="background:#FFE9E5">🧊</div>' +
        '<div class="grow"><div style="font-size:14.5px">' +
        (cur.frozen ? '解冻这张卡' : '冻结这张卡') + '</div>' +
        '<div class="xs muted" style="margin-top:2px">三级预警里的应急手段</div></div>' +
        '<div class="muted">›</div></div></div>';

      html += '<div class="proto mt16"><div class="ph"><span class="seal">险</span>冻结会通知谁</div>' +
        '<div class="xs t2" style="line-height:1.8">' +
        '按三级风险预案，冻结属于最高一档：双方都会收到通知，' +
        '但通知里只有「发生了什么事」和「钱是安全的」，<b>不含任何单笔明细</b>。</div></div>';

      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      const cards = ctx.api.card.list();
      const cur = () => cards.find(c => c.id === ctx.params.id) || cards[0];
      el.querySelectorAll('[data-freeze]').forEach(n => {
        n.onclick = () => {
          const c = cur();
          if (!c) return;
          const on = n.getAttribute('data-freeze') === '1';
          UI.confirm({
            title: on ? '冻结这张卡？' : '解冻这张卡？',
            desc: on
              ? c.name + ' 会立刻停止收付款，双方各收到一条不含明细的通知。'
              : c.name + ' 会恢复正常使用。',
            okText: on ? '冻结' : '解冻',
            onOk() {
              ctx.api.card.freeze(c.id, on);
              ctx.refreshTop();
              UI.toast(on ? '已冻结，双方已收到通知' : '已解冻');
            }
          });
        };
      });
      LJ._bindGo(el, ctx);
    }
  };

  /* ============================================================
     省心模式设置
     ============================================================ */
  P['youth.mode'] = {
    title: '省心模式', chrome: 'plain',
    render(ctx) {
      const cur = ctx.api.disclosure.current();
      const incoming = ctx.api.disclosure.incoming();
      const features = ctx.api.disclosure.features;
      const toggles = ctx.api.disclosure.toggles();
      let html = '<div class="pad">';

      if (incoming) {
        html += '<div class="card mt16" style="border-left:3px solid var(--accent)">' +
          '<div class="row between"><div class="sm" style="font-weight:600">' +
          UI.esc((ctx.api.partner() || {}).name || '家人') + ' 想调整查看范围</div>' +
          '<span class="tag warn">待确认</span></div>' +
          '<div class="sm t2" style="margin-top:10px;line-height:1.75">' +
          '申请调整为「' + UI.esc(LJ.disclosure.MODES[incoming.proposedMode].name) + '」——' +
          UI.esc(LJ.disclosure.MODES[incoming.proposedMode].desc) + '</div>' +
          '<div class="proto mt12" style="background:#fff">' +
          '<div class="xs t2" style="line-height:1.7">你有最终确认权。不同意不会影响你们的关系，' +
          '系统只会给对方一个中性的提示，不需要你解释理由。</div></div>' +
          '<div class="row mt16" style="gap:8px">' +
          '<button class="btn ghost sm" data-resolve="0" style="flex:1">暂时不同意</button>' +
          '<button class="btn sm" data-resolve="1" style="flex:1">同意调整</button>' +
          '</div></div>';
      }

      html += '<div class="proto mt16"><div class="ph"><span class="seal">约</span>双方确认制</div>' +
        '<div class="sm t2" style="line-height:1.7">信息范围由双方共同确认后生效，单方不可强制变更。' +
        '任何调整都会完整留痕，双方随时可查。</div></div>' +
        '<div class="mt20">' + LJ.disclosure.ORDER.map(k => {
          const m = LJ.disclosure.MODES[k];
          const on = cur.base === k;
          return '<div class="card ' + (on ? '' : 'flat') + '" data-mode="' + k + '" style="margin-bottom:12px;' +
            (on ? 'border:1.5px solid var(--navy)' : '') + '">' +
            '<div class="row between"><div><div style="font-size:15px;font-weight:700">' + m.name +
            '<span class="xs muted" style="font-weight:400;margin-left:6px">' + m.tagline + '</span></div>' +
            '<div class="sm muted mt8" style="margin-top:6px;line-height:1.6">' + m.desc + '</div></div>' +
            (on ? '<span class="tag ok">基准</span>' : '<span class="tag gray">切换</span>') + '</div>' +
            '<div class="mt12" style="margin-top:12px">' + m.shows.map(s =>
              '<span class="chip" style="margin:0 6px 6px 0">' + (LJ.disclosure.feature(s) || {}).name + '</span>').join('') +
            '</div></div>';
        }).join('') + '</div>' +

        /* ---------- 逐项自定义（文档 3.2.2）---------- */
        '<div class="sec-title">逐项调整' +
        '<span class="more">' + (cur.id === 'custom' ? '已改过' : '跟随「' + cur.name + '」') + '</span></div>' +
        '<div class="proto"><div class="ph"><span class="seal">细</span>不想整档切换，就单项调</div>' +
        '<div class="xs t2" style="line-height:1.8">' +
        '这三档只是预设。<b>你可以单独留下某一项、关掉另一项</b>，' +
        '改过任何一项之后，范围就显示为「自定义」—— 不会被下一次切档悄悄改回去' +
        '（切档会重置成那一档的预设，页面会提示）。</div></div>' +
        '<div class="list mt12">' + features.map((f, i) => {
          const on = toggles[f.id];
          return '<div class="li" style="' + (i ? 'border-top:1px solid var(--line-2)' : '') + '">' +
            '<div class="grow">' +
            '<div class="row between"><span style="font-size:14.5px;font-weight:700">' + UI.esc(f.name) +
            (f.always ? '<span class="xs muted" style="font-weight:400;margin-left:6px">固定</span>' : '') +
            '</span>' +
            (f.always ? '<span class="tag gray">不可关</span>'
              : '<button class="switch' + (on ? ' on' : '') + '" data-toggle="' + f.id + '"></button>') +
            '</div>' +
            '<div class="xs muted" style="margin-top:5px;line-height:1.65">' + UI.esc(f.desc) + '</div>' +
            (f.hint ? '<div class="xs" style="margin-top:5px;color:var(--muted)">' + UI.esc(f.hint) + '</div>' : '') +
            '</div></div>';
        }).join('') + '</div>' +

        '<div class="proto"><div class="ph"><span class="seal">永</span>永不开放</div>' +
        '<div class="sm t2" style="line-height:1.8">' +
        '· 任何一笔具体交易（金额、商户、时间）<br>· 个人自有资金的任何信息<br>· 账单定位与凭证</div>' +
        '<div class="xs muted" style="margin-top:9px;line-height:1.7">' +
        '这几项<b>没有开关</b>，不在上面那张表里 —— 它们不是"关着"，是压根不存在这个权限。</div></div>' +
        '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      el.querySelectorAll('[data-resolve]').forEach(b => {
        b.onclick = () => {
          const accept = b.getAttribute('data-resolve') === '1';
          UI.confirm({
            title: accept ? '同意这次调整？' : '暂时不同意？',
            desc: accept ? '调整会立即生效，并留下一条记录。' :
              '对方会收到一个中性的提示，不需要你解释理由。',
            okText: accept ? '同意' : '暂不同意',
            onOk() {
              ctx.api.disclosure.resolveIncoming(accept);
              UI.toast(accept ? '已同意，调整已生效' : '已回应');
              ctx.refreshTop();
            }
          });
        };
      });
      el.querySelectorAll('[data-mode]').forEach(n => {
        n.onclick = () => {
          const k = n.getAttribute('data-mode');
          if (k === ctx.api.disclosure.current().base) return;
          const m = LJ.disclosure.MODES[k];
          UI.confirm({
            title: '切换为「' + m.name + '」？',
            desc: '你是账户所有者，所以这次调整立即生效，同时会留痕并通知家人一声 —— ' +
              '但不需要等对方批准。' +
              (ctx.api.disclosure.current().id === 'custom'
                ? '注意：你逐项调过的设置会重置成这一档的预设。' : ''),
            okText: '立即切换',
            onOk() {
              ctx.api.disclosure.set(k);
              UI.toast('已切换为「' + m.name + '」');
              ctx.refreshTop();
            }
          });
        };
      });

      /* 逐项开关：改一项就存一项，即时生效 */
      el.querySelectorAll('[data-toggle]').forEach(n => {
        n.onclick = () => {
          const id = n.getAttribute('data-toggle');
          const f = LJ.disclosure.feature(id);
          const on = ctx.api.disclosure.toggles()[id];
          try {
            ctx.api.disclosure.toggle(id, !on);
            UI.toast(on ? '已关闭「' + f.name + '」，家人看不到了'
              : '已开放「' + f.name + '」');
            ctx.refreshTop();
          } catch (e) { UI.toast(e.message); }
        };
      });
    }
  };

  /* ============================================================
     授权中心
     这一页现在是**凭证视图**：每一行都对应一个真实生效/不生效的能力，
     撤回就是真的关掉（写进 binding.features），家人那边立刻拿不到。
     以前它只读写 grant 表，和权限判定完全没关系 —— 撤回只是界面变化。
     ============================================================ */
  P['youth.grants'] = {
    title: '授权中心', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const list = api.grant.list();
      const cfg = api.disclosure.current();
      const on = list.filter(g => g.status === 'active');

      let html = '<div class="pad mt16">';
      html += '<div class="proto"><div class="ph"><span class="seal">限</span>你能决定家人看到多少</div>' +
        '<div class="sm t2" style="line-height:1.75">' +
        '下面每一行都是一个<b>真实生效的权限</b>，不是一张记录 —— ' +
        '撤回之后家人那边立刻拿不到，临时授权到期也会自动收回。<br>' +
        '单笔交易明细不在这一页里，因为它<b>从来不是一项可以授予的权限</b>。</div></div>';

      html += '<div class="sec-title">当前范围<span class="more">' + cfg.name + '</span></div>';
      html += '<div class="list">' + list.map(g => {
        const active = g.status === 'active';
        const tag = g.always ? ['固定开放', 'gray']
          : g.viaTemp ? ['临时', 'warn']
            : active ? ['生效中', 'ok'] : ['已关闭', 'gray'];
        return '<div class="li"><div class="ico">' + (active ? '🔓' : '🔒') + '</div>' +
          '<div class="grow">' +
          '<div class="row between"><span style="font-size:14.5px;font-weight:700">' +
          UI.esc(g.name) + '</span><span class="tag ' + tag[1] + '">' + tag[0] + '</span></div>' +
          '<div class="xs muted" style="margin-top:5px;line-height:1.6">' + UI.esc(g.desc) + '</div>' +
          '<div class="xs" style="margin-top:7px;color:' +
          (g.expired && !active ? 'var(--muted)' : 'var(--text-2)') + '">' +
          UI.esc(g.expiryText) + '</div>' +
          (g.always ? '' :
            '<div class="row" style="gap:8px;margin-top:10px">' +
            (active
              ? '<button class="btn ghost sm" data-revoke="' + g.id + '">撤回</button>'
              : '<button class="btn soft sm" data-allow="' + g.id + '">重新开放</button>') +
            (g.temporary ? '' : '<button class="btn ghost sm" data-temp="' + g.id + '">改为临时 30 天</button>') +
            '</div>') +
          '</div></div>';
      }).join('') + '</div>';

      html += '<div class="sec-title">为什么这些项可以关，明细不行</div>';
      html += '<div class="proto"><div class="sm t2" style="line-height:1.85">' +
        '上面五项都是<b>聚合量</b>：状态、分数、大类总额、进度百分比 —— ' +
        '它们回答的是"够不够、稳不稳"，不回答"买了什么"。<br>' +
        '单笔明细回答的是后一个问题，它对于支持决策不是必要的，' +
        '所以它没有开关，只有一条写死的规则：<b>永不开放</b>。</div></div>';

      html += '<div class="xs muted" style="text-align:center;padding:18px 0 8px">' +
        '共 ' + on.length + ' / ' + list.length + ' 项生效中 · 每一次改动都会进留痕记录</div>';
      html += '<div style="height:24px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      const api = ctx.api;
      const after = (msg) => { ctx.refreshTop(); UI.toast(msg); };

      el.querySelectorAll('[data-revoke]').forEach(b => b.onclick = () => {
        const g = api.grant.list().find(x => x.id === b.getAttribute('data-revoke')) || {};
        UI.confirm({
          title: '撤回「' + g.name + '」？',
          desc: '撤回后家人在这一项上立刻拿不到数据，不是界面灰掉，是服务端不再返回。' +
            '操作会进留痕记录，随时可以重新开放。',
          okText: '确认撤回',
          onOk() { api.grant.revoke(g.id); after('已撤回，「' + g.name + '」家人看不到了'); }
        });
      });
      el.querySelectorAll('[data-allow]').forEach(b => b.onclick = () => {
        api.grant.allow(b.getAttribute('data-allow'));
        after('已重新开放');
      });
      el.querySelectorAll('[data-temp]').forEach(b => b.onclick = () => {
        const g = api.grant.list().find(x => x.id === b.getAttribute('data-temp')) || {};
        UI.confirm({
          title: '把「' + g.name + '」开放 30 天？',
          desc: '30 天后系统自动收回，你不需要记得回来关。' +
            '适合"这段时间家里确实需要知道"的场景。',
          okText: '开放 30 天',
          onOk() { api.grant.openTemporary(g.id, 30); after('已开放 30 天，到期自动收回'); }
        });
      });
    }
  };
})(window.LJ);
