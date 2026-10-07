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
    /* 024 · 四页顶栏整条隐藏（用户：首页/复盘/往来/我的 最上面的标题
       删掉，仅留下页面内容）—— tab 页顶栏里只有标题（返回键 023 已删、
       头像只在「我的」），整条不渲染什么也不丢；流水页早就 hideNav，
       五个 tab 终于长一个样。hideNav 复用既有机制（syncChrome →
       .navbar.hidden → .page-host 上收 50px）。 */
    title: '临界', chrome: 'tab', hideNav: true,
    render(ctx) {
      const api = ctx.api, d = api.dashboard();
      const me = api.profile();
      const b = d.balances;
      const pend = api.support.pending();
      const invites = api.invite.pending();
      const incomingMode = api.disclosure.incoming();
      const bp = d.budget, g = d.gap, c = d.control;
      let html = '<div class="pad">';

      /* ① 顶行：左＝本月还可用（存量），右＝开场白（教练的一句话）。
           日期不放 —— 日期是系统的事，产品只说跟钱有关的话。
           开场白三态（稳 / 紧 / 超），一律陈述句、不训人（文档 3.3.2 中性化）。
           存量（还可用）和节奏（今天还能花）是两码事，一个说"还有多少"，
           一个说"今天怎么花" —— 分开放、标签写清楚就不打架。 */
      /* ① 顶行：左＝问候语 + 本月余额（同一 hero 字号，上一版问候语的尺寸），
           右＝开场白（纯汉字、大气排版 —— 不要绿色胶囊，就放字）。
           口径：本月余额＝预算剩余（存量）；031-r2 起它是这一页**唯一的大数字**（「今天还能花 / 天后发生活费」已按用户口径随判断卡删除）。
           问候语按钟点变，测试别断言它的文案（坑 25）。 */
      const daysLeft = Math.max(0, bp.totalDays - bp.passed);
      const remaining = Math.round(bp.remaining);
      const brokeBudget = remaining < 0;
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
      html += '<div class="row between" style="padding:8px 4px 18px;align-items:flex-end">' +
        '<div class="home-hello">' +
        /* 问候语＝暖场（小字中灰），余额＝主角（超大 mono 黑），
           字号/字重/颜色三重区分 + 11px 呼吸缝 —— 别用同款大字硬堆。 */
        '<div class="hi-hello">' + (hh < 12 ? '早上好' : hh < 18 ? '下午好' : '晚上好') + '</div>' +
        /* ★ 余额滚动（006）：这个数是全屏最重的数字，数据一变就从
           "记一笔/快进/翻月"瞬变成另一个字符串，读起来像"页面重载了"。
           把数值放进 data-count-to 交给 UI.countTo：首次从 0 滚到值、
           之后只有真变了才滚、同值重渲染不动（首页是最高频页面，别刷噪音）。
           .hi-cur 的 ¥ 前缀结构保持不变，只滚数字部分 —— UI.countTo 只改
           <b> 的最后一个文本节点，不会碰这个 span。 */
        '<div class="hi-bal" data-month-left><b data-count-to="' +
        (brokeBudget ? Math.abs(remaining) : remaining) + '" data-fmt="' +
        U.wonInt(brokeBudget ? Math.abs(remaining) : remaining) + '">' +
        '<span class="hi-cur">¥</span>' +
        U.wonInt(brokeBudget ? Math.abs(remaining) : remaining) + '</b></div>' +
        '<div class="hi-k">' + (brokeBudget ? '本月已超' : '本月余额') + '</div>' +
        '</div>' +
        '<div class="coach-plain" data-coach>' + coach + '</div>' +
        '</div>';

      /* ★ 首页顶部那条风险提醒条（二级以上、未处理时出现）**已删** ——
         用户口径：「陌生平台支出这种警告不要放在首页影响观感」。
         提醒本身没丢，换了两处更合适的位置：
           · 「往来 · 待我处理」——待办清单里那条（见 todosBlock，data-todo="risk"）
           · 「我的 → 风险预警」——完整列表与处理入口（youth.risk）
         首页是「花钱参谋」的门面，一进来先挨一条告警，观感就被它定调了。 */

      /* ② 主数字行 —— 「今天还能花多少」
             余额是后视镜，日均可用才是方向盘：前者说"存量还剩多少"，
             后者说"今天可以怎么花"。把前瞻性的那个数放到第一眼，
             产品的气质才从"记账本"变成"花钱参谋"。
             下面那行小字写出算式本身（预算剩多少 ÷ 还剩几天）——
             数字不给依据，用户只会当成又一个凭空冒出来的指标；
             给了依据，用户顺手就学会了这个关系式，这本身就是财商。
         ★ 不动黑卡：037 起这张卡的克隆落点从「支出结构」顶部换成「我的」页
           顶部的资金卡（同 acctCard 函数渲染、同 346x170，坑 23 的"逐字一致"
           改由单一函数保证）—— 支出结构页那张同款 037 已删。 */
      /* 超支时主数字换成「超了多少」而不是显示 ¥0。
         一个恒为 0 的 hero 数字看起来像坏了，而且整个月都是 0、毫无信息量；
         超出额既是诚实的，也仍然是一个能驱动行动的数。
         措辞一律陈述事实（"本月已超预算"），不写"先别再花"这类祈使句 ——
         文档 3.3.2 要求中性化表达，产品不做消费道德评判。 */
      /* ② 「开支预览」卡 —— 030 起这张卡的主体是**日历热力图**（用户：「做一个
             开支预览，类似于我图片里那样，按照月份来显示，做成卡片的样式，
             把『这笔要不要花』的卡片替换掉，但是下面的『沙盘推演』按钮保留」）。
          ★ 031-r2（用户追加）：「今天还能花」和「天后发生活费」两组数字**也删掉**。
            于是这张卡只剩：开支预览热力图 + 沙盘推演按钮。
            这两个数原来还兼着别处的落点，一并搬走了（见下）：
              · 产品导览第①步的聚光灯 → 改指顶部主数字 [data-month-left]
              · 线上体检的主数字断言 → 同上
            顶部那张 hero（本月余额 + 一句节奏推演）是这一页唯一的"大数字"了。 */
      const heat = api.ledger.heat(16);
      /* 033 示能④：热力图「点格子看当天明细」首触提示 —— 只在**没点过**时渲染
         （lj.hint.heat 在下面 judge.onclick 里写）；说明用完即消失，不占常驻版面。 */
      let heatHint = false;
      try { heatHint = !localStorage.getItem('lj.hint.heat'); } catch (e) { heatHint = false; }

      /* ② 「资金」（原黑卡「还剩多少」，037 用户改名）。
         032（用户两处拍板）：标题曾从「这个月的钱花去哪了」→「还剩多少」；
         037（用户）：→「资金」，且**点击跳转从支出结构改成「我的」页**
         （钱的总览先落到钱的管理页）。共享元素转场照旧：卡面自己飞过去、
         尺寸不变，落点是「我的」页顶部的同款资金卡（data-shared-acct）。
         卡面保留 data-zoom-src：tools 里有 4 处按它取元素（app.js 的 ?zoom=1、
         shot-fly.js、probe-zoom.js、probe-shared.js），改名会连带牵动它们。 */
      html += '<div class="acct-first">' +
        acctCard(b, { tail: (me.phone || '').slice(-4), attrs: ' data-zoom-src' }) +
        '<div class="cap-note" data-cap-go>复盘一次，下个月就知道哪笔可省 ›</div>' +
        '</div>';

      /* ③ 「开支预览」卡 —— 030 起这张卡的主体是**日历热力图**（用户：「做一个
             开支预览，类似于我图片里那样，按照月份来显示，做成卡片的样式，
             把『这笔要不要花』的卡片替换掉，但是下面的『沙盘推演』按钮保留」）。
          ★ 031-r2（用户追加）：「今天还能花」和「天后发生活费」两组数字**也删掉**。
            于是这张卡只剩：开支预览热力图 + 沙盘推演按钮。
            这两个数原来还兼着别处的落点，一并搬走了（见下）：
              · 产品导览第①步的聚光灯 → 改指顶部主数字 [data-month-left]
              · 线上体检的主数字断言 → 同上
            顶部那张 hero（本月余额 + 一句节奏推演）是这一页唯一的"大数字"了。
          ★ 032（用户）：**点这张卡 = 跳进「每日收支」详情**（流水页堆叠里那张
            日历卡），用共享元素转场 —— 热力日历飞成明细日历，是同一类东西
            变详细，不是换了个页面。沙盘按钮照旧单独可点，不吃这次点击。 */
      html += '<div class="card judge mt12" data-judge data-go-daily>' +
        '<div class="jd-title">开支预览</div>' +
        '<div class="jd-sub">最近 16 周 · 每格一天 · 颜色越深花得越多</div>' +
        UI.spendHeat(heat) +
        '<div class="sp-sum" data-sp-sum>16 周共花 <span class="v-out">¥' + U.wonInt(heat.spent) +
        '</span> · 有花销 ' + heat.activeDays + ' 天 · 最高一天 <span class="v-out">¥' + U.wonInt(heat.max) + '</span></div>' +
        (heatHint ? '<div class="jd-hint" data-heat-hint>点格子看当天明细 ›</div>' : '');
      /* 沙盘推演：产品灵魂入口，从右下角浮标提成主按钮。
         016 起浮标归还记一笔，沙盘的正门就是下面这个主按钮（成长页还有一处）。 */
      html += '<button class="btn jd-btn" data-sandbox>沙盘推演</button>' +
        '</div>';

      /* 订阅卡组 → 「流水 · 明细」顶部（LJ.subsBlock）；
         缺口预警 → 「复盘」页顶部；待办 → 「往来」页「待我处理」。 */

      /* ⑥ 生成脱敏账单卡（014：从往来「常用工具」上提，占能力轨迹卡
             搬去「流水」后腾出的位置）—— 主动分享是这个产品「不用查账」
             的另一半：数据不等家人来问，自己发出去。卡面给足分量：
             天蓝色块 + 图标砖 + 份数 stat，整卡直达 youth.share。
             份数走 api.share.sent()（种子发过 1 份；0 份时如实写「还没发过」）。 */
      const sent014 = api.share.sent();
      html += '<div class="block sky mt12" data-share-card data-go="youth.share">' +
        '<div class="glow"></div>' +
        '<div class="row" style="gap:14px;position:relative;z-index:2;align-items:center">' +
        '<div class="sh-ico">🧾</div>' +
        '<div class="grow">' +
        '<div class="bk">主动分享</div>' +
        '<div style="font-size:19px;font-weight:800;margin-top:4px;letter-spacing:-.03em">' +
        '生成脱敏账单</div>' +
        '<div class="bd" style="margin-top:6px">只含宏观数据，主动同步给家人</div>' +
        '</div>' +
        '<div style="text-align:right;flex:none">' +
        '<div class="sh-n">' + sent014.length +
        '<span style="font-size:12px;font-weight:600"> 份</span></div>' +
        '<div class="bd" style="margin-top:5px">' +
        (sent014.length
          ? '已发出 · 最近 ' + String(sent014[0].at || '').slice(5, 10).replace('-', '/')
          : '还没发过') +
        '</div></div>' +
        '<div style="font-size:20px;opacity:.35">›</div>' +
        '</div></div>';

      /* 待办在往来页「待我处理」（LJ.todosBlock） */

      html += '</div>';
      return html;
    },
    mount(el, ctx) {
      UI.bindFold(el);
      /* 首页黑卡「资金」→「我的」页（037 用户点名改道，原去支出结构）。
         共享元素转场：卡面自己飞过去、**尺寸不变**（两页的卡都是 346x170），
         缩放交给背景 —— 和「我的 → 银行卡管理」完全同款。
         「我的」页顶部就是同一张资金卡（data-shared-acct），所以落点是纯平移。 */
      el.querySelectorAll('[data-zoom-src]').forEach(n => {
        n.onclick = () => ctx.goShared('youth.me', {}, n, '[data-shared-acct]');
      });
      /* 能力轨迹卡 014 搬去了「流水」页 —— 它的 zoom-push 绑定跟着搬
         （见 youth.ledger 的 mount）；首页这里只剩黑卡与分享卡。 */
      el.querySelectorAll('[data-go]').forEach(n => {
        n.onclick = () => {
          const v = n.getAttribute('data-view');
          ctx.go(n.getAttribute('data-go'), v ? { view: v } : {});
        };
      });

      /* 余额滚动（006）：语义 = 会话内首次显示从 0 滚到值（一次"落定"的
         到达感），之后只有**真变了**才从旧值滚到新值，同值重渲染不动。
         LJ._balSeen / LJ._balFrom 和 UI.fold 的 foldOpen 同一处理方式：
         模块级、不写 localStorage，刷新重置是有意的（见 js/ui.js 折叠那段的说明）。
         ★ 为什么要两个变量：记一笔会连续触发两次 refresh（store.insert 与
           store.log 各一次），两次都重建 DOM 并各跑一次 mount。
           只记"上次显示的值"的话，第一次 mount 就把新值记下了，第二次 mount
           看到"同值"直接落终值 —— 滚动被自己吃掉，用户看不到任何过渡。
           所以另记一个 _balFrom（这次滚动从哪个数起步）：只要 _balFrom 还没
           追上 to，重挂载就**继续**把这次滚动接上，而不是取消它。 */
      const balEl = el.querySelector('.hi-bal b');
      /* 滚动时长：--dur-stack（450ms）档 —— 余额是全屏最重的数字，
         比小元素的入场慢一档才压得住，也不至于让人等。 */
      const BAL_MS = UI.motion('--dur-stack');
      if (balEl) {
        const to = Number(balEl.getAttribute('data-count-to') || 0);
        const prev = LJ._balSeen;
        const from = LJ._balFrom;
        if (typeof prev !== 'number') {
          balEl.setAttribute('data-count-from', '0');   // 首次：0 → 值
          LJ._balFrom = 0;
        } else if (typeof from === 'number' && from !== to) {
          /* 上一次的滚动还没走到终值（同一次数据变更里的重复挂载）：接着滚 */
          balEl.setAttribute('data-count-from', String(from));
        } else if (prev !== to) {
          balEl.setAttribute('data-count-from', String(prev));  // 变了：旧值 → 新值
          LJ._balFrom = prev;
        }
        /* prev === to 且 from 已追上：不写 from，UI.countTo 读到 from==to
           直接写终值 —— 同值不滚 */
        UI.countTo(balEl, to, BAL_MS);
        LJ._balSeen = to;
        /* 滚动走到终值后把起点也追上，下一次同值重渲染才算"已落定" */
        if (LJ._balFrom !== to) setTimeout(() => { LJ._balFrom = to; }, BAL_MS + 80);
      }

      /* 订阅阶梯栈随首页一起搬走：行为挪进 LJ.subsMount（流水页调用），原样没改 */

      /* 判断卡的沙盘按钮（产品灵魂入口）+ 黑卡下的复盘入口。
         026：不再开单笔弹层 —— 正门直进全屏「岔路口」（plans/026 §0 用户拍板）。 */
      const sb = el.querySelector('[data-sandbox]');
      if (sb) sb.onclick = () => ctx.go('youth.sandbox');
      /* 032 · 点「开支预览」卡 → 流水页的「每日收支」日历卡（共享元素转场）。
         沙盘按钮在卡里，得先把它摘出去 —— 否则点沙盘会连开两个页面。 */
      const judge = el.querySelector('[data-go-daily]');
      if (judge) judge.onclick = e2 => {
        if (e2 && e2.target && e2.target.closest &&
          e2.target.closest('[data-sandbox]')) return;
        /* 033 示能④：点过一次卡片（首触提示的兑现时刻）→ 提示永不再现。
           ★ 提示元素**当场摘掉**（不等重渲）：点完会 push 进流水页，首页那一层
           还在栈底缓存着 —— 回来若走"同层复用"路径就不会重渲染，旧提示会诈尸。
           标记照写（重渲时也不再生成），两头都封死。 */
        const hh = el.querySelector('[data-heat-hint]');
        if (hh) hh.remove();
        try { localStorage.setItem('lj.hint.heat', '1'); } catch (e) { }
        ctx.goShared('youth.ledger', { stack: 'daily' }, judge, '[data-shared-daily]');
      };
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
        '<div class="sec-title">给家人回一句话（选填，009 回执）</div>' +
        '<textarea id="csNote" rows="2" placeholder="收到了，谢谢" ' +
        'style="width:100%;border:1px solid var(--line);border-radius:12px;padding:11px 13px;' +
        'outline:none;background:var(--card);resize:none;line-height:1.6"></textarea>' +
        '<button class="btn mt20" id="csOk">确认收到</button>' +
        '<button class="btn ghost mt12" id="csNo">暂不确认</button>',
      mount(el, close) {
        el.querySelector('#csOk').onclick = () => {
          const note = el.querySelector('#csNote').value.trim();
          ctx.api.support.confirm(id);
          if (note) ctx.api.support.receipt(id, note);
          close();
          UI.toast(note ? '已计入账本，回执已送达' : '已计入账本');
          ctx.go('youth.ledger', { view: 'list', hl: id });
        };
        el.querySelector('#csNo').onclick = () => {
          ctx.api.support.decline(id); close(); UI.toast('已回应，对方会收到提示');
        };
      }
    });
  }

  /* 定向支持核销（009 阶段二）—— 只交金额构成，不给明细：
     交代按约定花掉了，但交代本身也不越界（这一步不碰 entry）。 */
  LJ.openSettleSheet = function (ctx, id) {
    const r = ctx.api.support.list().find(x => x.id === id);
    if (!r) return;
    UI.sheet({
      title: '定向支持核销',
      sub: UI.esc(r.purpose) + ' · ¥' + U.won(r.amount) +
        (r.directedCategory ? ' · ' + UI.esc(LJ.catById(r.directedCategory).name) : ''),
      body: '<div class="proto"><div class="ph"><span class="seal">凭</span>交出去的是什么</div>' +
        '<div class="sm t2" style="line-height:1.8">只写金额构成，例如「教材 ¥520 + 网课 ¥340」。' +
        '不需要截图、不需要商户明细 —— 家人看到的就是你写的这句话。</div></div>' +
        '<div class="sec-title">脱敏凭证</div>' +
        '<textarea id="stNote" rows="3" placeholder="这笔钱是怎么按约定花的" ' +
        'style="width:100%;border:1px solid var(--line);border-radius:12px;padding:12px 14px;' +
        'outline:none;background:var(--card);resize:none;line-height:1.6"></textarea>' +
        '<button class="btn mt20" id="stOk">提交核销</button>',
      mount(el, close) {
        el.querySelector('#stOk').onclick = () => {
          const t = el.querySelector('#stNote').value.trim();
          if (!t) return UI.toast('写一句金额构成就好');
          ctx.api.support.settle(id, t);
          close();
          UI.toast('核销完成，家人会看到结果');
          if (ctx.refreshTop) ctx.refreshTop();
        };
      }
    });
  };

  /* 写回执（009 阶段二）—— 收下了，回一句话；双端时间线都看得到 */
  LJ.openReceiptSheet = function (ctx, id) {
    const r = ctx.api.support.list().find(x => x.id === id);
    if (!r) return;
    UI.sheet({
      title: '写一句回执',
      sub: UI.esc(r.purpose) + ' · ¥' + U.won(r.amount) + ' · 收下了，回一句话',
      body: '<textarea id="rcNote" rows="3" placeholder="收到了，谢谢" ' +
        'style="width:100%;border:1px solid var(--line);border-radius:12px;padding:12px 14px;' +
        'outline:none;background:var(--card);resize:none;line-height:1.6"></textarea>' +
        '<button class="btn mt20" id="rcOk">发送回执</button>' +
        '<div class="proto mt16"><div class="ph"><span class="seal">话</span>为什么要回一句</div>' +
        '<div class="sm t2" style="line-height:1.75">支持是往来的钱，回执是往来的话 —— ' +
        '它会出现在双方的时间线上，不留白。</div></div>',
      mount(el, close) {
        el.querySelector('#rcOk').onclick = () => {
          const t = el.querySelector('#rcNote').value.trim();
          if (!t) return UI.toast('写一句话再发送');
          ctx.api.support.receipt(id, t);
          close();
          UI.toast('回执已送达');
          if (ctx.refreshTop) ctx.refreshTop();
        };
      }
    });
  };

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
    /* 定向支持的核销（009）：钱收下了，还要给家人一份"按约花掉"的交代 */
    api.support.list()
      .filter(r => r.status === 'confirmed' && r.directed && !r.settleAt)
      .forEach(r => {
        todos.push({
          act: 'settle', id: r.id, icon: '📎',
          title: '定向支持待核销',
          sub: r.purpose + ' · ¥' + U.won(r.amount) + ' · 交一份脱敏凭证',
          tag: '待核销', cls: 'warn', cta: '去核销'
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

    /* 017 · 挂起项③：待办行左滑揭示 ——
       外壳 .sw（sw-acts = 行的主动作；sw-body = 原行原样）。
       ★ 揭示按钮挂**同一组 data-todo/data-id/data-to 属性**：LJ.bindTodos
         的 querySelectorAll 会把它一起绑上 —— 动作语义零份拷贝，
         行上按钮改文案/改流程，揭示层自动跟。
       ★ talk 页本来就调 UI.rowSwipe（010 C2 时间线），包上即生效。 */
    const todoRow = t => {
      const attrs = 'data-todo="' + t.act + '" data-id="' + (t.id || '') +
        '" data-to="' + (t.to || '') + '"';
      const inner = t.risk
        ? '<div class="li rk-todo l' + t.level + '" data-todo="risk" data-id="' + t.id + '">' +
        '<div class="ico" style="background:transparent;font-size:17px">' + t.icon + '</div>' +
        '<div class="grow"><div class="ellipsis" style="font-size:14px;font-weight:700">' +
        UI.esc(t.title) + '</div>' +
        '<div class="xs muted" style="margin-top:3px">' + UI.esc(t.sub) + '</div></div>' +
        '<button class="btn xs">' + UI.esc(t.cta) + '</button>' +
        '</div>'
        : '<div class="li" ' + attrs + '>' +
        '<div class="ico">' + t.icon + '</div>' +
        '<div class="grow"><div class="ellipsis" style="font-size:14px;font-weight:600">' + UI.esc(t.title) + '</div>' +
        '<div class="xs muted" style="margin-top:3px">' + UI.esc(t.sub) + '</div></div>' +
        '<button class="btn xs ' + (t.act === 'go' ? 'ghost' : '') + '">' + UI.esc(t.cta) + '</button>' +
        '</div>';
      return '<div class="sw"><div class="sw-acts">' +
        '<button class="btn sm soft" ' + attrs + '>' + UI.esc(t.cta) + '</button>' +
        '</div><div class="sw-body">' + inner + '</div></div>';
    };

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
        if (act === 'settle') return LJ.openSettleSheet(ctx, id);
        if (act === 'risk') return ctx.go('youth.riskDetail', { id });
        if (act === 'plan') return ctx.go('youth.plan', {});
      };
    });
  };

  /* ============================================================
     堆叠卡组（032 创，037 后只剩一个用户）
     ------------------------------------------------------------
     「两张卡叠在同一个位置，左右滑动切换」的**结构**只在这里出：
       · 流水页：每日收支 ↔ 订阅
       （支出结构页那组「黑卡 ↔ 每日支出趋势」037 随黑卡删除而退役 ——
        那页只剩柱子卡一张，直接渲染、不装壳；单卡传进来也会退回裸 html。）
     滑动手势/动画在 LJ.cardStack（ui.js），这函数只管 DOM。
     激活哪张由 activeKey 决定（缺省第一张）—— 首页「开支预览」跳进来时
     传 'daily'，保证落点（data-shared-daily）此刻正摆在屏幕上。
     ============================================================ */
  function stackBlock(slides, activeKey) {
    const list = (slides || []).filter(s => s && s.html);
    if (!list.length) return '';
    if (list.length < 2) return list[0].html;         /* 只剩一张就不装堆叠的壳 */
    let ai = list.findIndex(s => s.k === activeKey);
    if (ai < 0) ai = 0;
    /* 三层：.cs-wrap（整体 + 圆点）> .cs（裁切 + 高度）> .cs-track（横移）。
       圆点必须在 .cs 外面 —— .cs 的高度是定死的，放里面会被 overflow 裁掉。

       ★ 032-r3 · 环回边缘克隆（用户：「不管往哪边划都可以切换卡片，
         而不是只有一边可以」）：只有两张卡时，首张往"上一张"方向划、
         末张往"下一张"方向划本来是**没有东西**的 —— 手指下面没内容可拉，
         看着就是"只有一边能划"。所以在轨道两侧各补一张克隆：
           左 = 最后一张、右 = 第一张（绝对定位，不进 flex 流、不算高度）。
         划到头时手指拉进来的是真内容，落位后再把轨道归一到**本体** ——
         克隆与本体逐字相同，那次归一跳变是看不见的。
         ★ 右边那张要挂在**所有本体之后**（`left: n×100%`，不是 100%）：
           挂 100% 的话它会和第 2 张本体**重叠**，而克隆画在后面 ——
           一进「订阅」看到的却是日历（截图实测过，这是本版踩的第一个坑）。
         ★ 克隆里的 id 必须改名（`id="x"` → `data-oid="x"`）：不然 `#subVp`
         在 DOM 里出现两次，订阅接线（LJ.subsMount）会绑到克隆上去。
         ★ 克隆挂在**本体之后**：`document.querySelector('.cs-slide[data-k=…]`
         这类老选择器拿到的仍然是本体（DOM 顺序在前）。 */
    const deId = h => h
      /* 克隆只负责"像素"：把所有接线标记摘掉 —— 否则 DOM 里会出现两份
         #subVp / [data-dc] / [data-shared-*]，接线与共享转场的选择器
         就得赌"本体排在前面"（赌输了就是绑到克隆上）。 */
      .replace(/\sid="/g, ' data-oid="')
      .replace(/\sdata-shared-[a-z]+/g, '')
      .replace(/\sdata-dc(?=[\s>])/g, ' data-dc-x');
    const real = list.map(s =>
      '<div class="cs-slide" data-k="' + s.k + '">' + s.html + '</div>').join('');
    const edges = list.length > 1
      ? '<div class="cs-slide cs-edge" data-clone="1" data-k="' + list[list.length - 1].k +
      '" style="left:-100%">' + deId(list[list.length - 1].html) + '</div>' +
      '<div class="cs-slide cs-edge" data-clone="1" data-k="' + list[0].k +
      '" style="left:' + (list.length * 100) + '%">' + deId(list[0].html) + '</div>'
      : '';
    return '<div class="cs-wrap" data-cs data-cs-key="' + list.map(s => s.k).join('+') +
      '" data-idx="' + ai + '">' +
      '<div class="cs"><div class="cs-track">' + real + edges + '</div></div>' +
      '<div class="cs-dots">' + list.map((s, i) =>
        '<i data-k="' + s.k + '" class="' + (i === ai ? 'on' : '') + '"' +
        ' title="' + UI.esc(s.title || s.k) + '"></i>').join('') +
      '</div></div>';
  }
  LJ.stackBlock = stackBlock;

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

    /* 头部右侧是「订阅管理」直达（008）：这张卡只是个预览 ——
       暂停/移除/添加都在独立的订阅管理页里，这里给一条明路。
       按钮在 #subVp / #subHint 之外，和「展开全部」的点击不打架。 */
    return '<div class="card mt12" style="padding:16px 14px 14px">' +
      '<div class="row between" style="padding:0 4px;align-items:center">' +
      '<div class="sm" style="font-weight:700">订阅</div>' +
      '<div class="row" style="gap:10px;align-items:center">' +
      '<div class="xs muted" style="font-weight:600">每月 <span class="v-out">¥' +
      Math.round(subs.reduce((a, b) => a + (b.actualMonthly || b.amount), 0)) +
      '</span> · ' + n + ' 项</div>' +
      '<button class="sub-go" data-go="youth.subs">订阅管理<span class="sub-go-ar">›</span></button>' +
      '</div></div>' +
      '<div class="sub-viewport" id="subVp" data-open="' + (open ? 1 : 0) +
      '" style="height:' + stackH + 'px;margin-top:14px">' +
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
      vp.setAttribute('data-open', next ? '1' : '0');   /* 010 · B5：展开态才开 scroll-snap */
      hint.classList.toggle('open', next);
      hint.innerHTML = (next ? '收起' : '展开全部 ' + n + ' 项') + UI.icon('chevron', 13);
      /* 032：订阅卡在堆叠里，展开/收起会改它的高度 —— 堆叠容器（跟着当前卡走）
         必须重量一次，否则"显示订阅时"卡下面会留白/被裁。 */
      if (LJ.stackSync) LJ.stackSync(el, true);
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
    /* 010 · C3：整行包进 .sw —— 左滑露 编辑/删除（删除仍走确认弹层，拍板②） */
    return '<div class="sw"><div class="sw-acts">' +
      '<button class="btn sm soft" data-sw-act="entry-edit" data-id="' + e.id + '">编辑</button>' +
      '<button class="btn sm soft" data-sw-act="entry-del" data-id="' + e.id +
      '" style="color:var(--danger)">删除</button></div>' +
      '<div class="sw-body">' +
      '<div class="li' + (hl && e.id === hl ? ' hl' : '') + '" data-entry="' + e.id + '">' +
      /* 036 · 红进绿出：收入行的图标底/字也换红系（原薄荷绿是旧口径的"绿=好"） */
      '<div class="ico" style="background:' + (isIn ? '#FFE9E5' : c.color + '18') + ';color:' + (isIn ? '#E40101' : c.color) + '">' +
      (isIn ? '↓' : c.icon) + '</div>' +
      '<div class="grow"><div class="ellipsis" style="font-size:14px;font-weight:500">' + UI.esc(title) + '</div>' +
      '<div class="xs muted" style="margin-top:2px">' + U.ymdCN(e.date) + ' · ' + UI.esc(sub) + '</div></div>' +
      '<div class="amt ' + (isIn ? 'in' : 'out') + '">' + (isIn ? '+' : '−') + U.won(e.amount) + '</div>' +
      '</div></div></div>';
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
    '<div class="grow"><div style="font-size:14px">退出登录</div>' +
    '<div class="xs muted" style="margin-top:2px">退出后可切换其他身份</div></div>' +
    '<div class="muted">›</div></div>';

  /* 产品导览入口（036 · 统一）：副标题与功能宫格里的置顶行一字不差，
     点击也走 LJ.coachStart —— 全站只有一份"产品导览"（7 步 COACH_STEPS），
     不再有旧版5 步演示动线（demoTour 只剩 probe-demo 截图机在用）。 */
  LJ.TOUR_ROW =
    '<div class="li" data-act="tour"><div class="ico" style="background:#DFFAEC">🧭</div>' +
    '<div class="grow"><div style="font-size:14px">产品导览</div>' +
    '<div class="xs muted" style="margin-top:2px">30 秒走一遍：UI 长什么样、功能都在哪</div></div>' +
    '<div class="muted">›</div></div>';

  LJ.bindLogout = function (el) {
    const t = el.querySelector('[data-act="tour"]');
    if (t) t.onclick = () => LJ.coachStart && LJ.coachStart();
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
     037 起这张卡出现在**首页**与「我的」页（资金卡），两处同函数渲染、
     尺寸逐像素一致（346x170），首页点它是共享元素转场、飞到「我的」顶部
     当落点 —— 各写一份迟早会走岔（尺寸差 1px 就变成缩放）。
     「支出结构」页顶部那张同款 037 已删（那页只留每日支出趋势一族）；
     原来兼在卡上的资金来源选择器（opts.pick / .acct-pick）随之下岗 ——
     选择器换回 #stRest 顶部那排 chips（全部 / 家庭支持金 / 个人自有资金）。

     ★ 元素结构不能动：lbl / val / split 三块、两个 half 的顺序和嵌套层级
       都得和原来一模一样，否则高度会变（共享转场就从纯平移变成缩放）。
     ============================================================ */
  /* ============================================================
     卡面图：缺失也不给看白板
     ------------------------------------------------------------
     卡面是 <img> 贴的图（assets/card*.jpg）。这条路有三种常见坏法：
     路径不对 / 离线或漏打包 / 浏览器缓存里存着一份坏的 ——
     表现都是"卡还在、卡面却是白的"，特别容易被误判成"银行卡丢了"。
     所以：加载失败就把 img 藏掉、给容器一层渐变卡面，卡名和卡号照旧。
     ============================================================ */
  function cardFace(c) {
    return '<img src="' + (c.img || '') + '" alt="' + UI.esc(c.name) + '" data-cardface>';
  }
  LJ.cardFace = cardFace;

  LJ.bindCardFaces = function (el) {
    el.querySelectorAll('img[data-cardface]').forEach(function (im) {
      const mark = function () {
        const box = im.parentNode;
        if (box && box.classList) box.classList.add('img-fallback');
      };
      im.onerror = mark;
      /* 缓存里那份已经是坏的：不会再触发 error，得主动查一次 */
      if (im.complete && im.naturalWidth === 0) mark();
    });
  };

  function acctCard(b, o) {
    o = o || {};
    const half = (name, val) =>
      '<div class="half">' +
      '<div class="k">' + name + '</div><div class="v">¥' + U.won(val) + '</div></div>';
    return '<div class="acct"' + (o.attrs || '') + '>' +
      '<div class="cardno">•••• ' + o.tail + '</div>' +
      /* 标题两轮拍板：032「这个月的钱花去哪了」→「还剩多少」（问流量答存量，
         对不上）；037（用户）→「资金」—— 卡就是钱的总览，
         「我的」页顶部、首页都叫这一个名字。 */
      '<div class="lbl">资金</div>' +
      '<div class="val"><span class="cur">¥</span>' + U.won(b.total) + '</div>' +
      '<div class="split">' + half('家庭支持金', b.family) +
      half('个人自有资金', b.own) + '</div>' +
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
      /* ★ 这行数据必须用 micro(11px)：卡片尺寸是共享元素转场的锚点（两页同 346x122），
         而首页版右列比成长页窄 18px（多一个 chevron）—— 用 caption(12.5px) 时这行
         会在首页撑到两行、把卡顶高 16px，落点就对不上了（probe-shared 会红）。 */
      '<div class="bd" style="margin-top:6px;font-size:11px">' + dimLine + '</div>' +
      '<div style="margin-top:11px">' + UI.bar(tasks.done / tasks.total, 'rgba(0,0,0,.55)') + '</div>' +
      '</div>' +
      (o.chevron === false ? '' : '<div style="font-size:20px;opacity:.3">›</div>') +
      '</div></div>';
  }
  LJ.growCard = growCard;   // pages-youth-m2.js（成长中心）也要用

  /* 支出结构页顶部那张「每日支出趋势」画哪个月（032）：
     scope 是月份就用它，是年/没选就用当前月 —— 用户：「只呈现当月的」。
     src（资金来源）照传：换池子时柱子跟着换，和下面的环形图同一口径。 */
  function stBars(ctx, scope, src) {
    const today = (LJ.clock && LJ.clock.now) ? LJ.clock.now() : U.ymd(new Date());
    const mk = (scope && scope.length === 7) ? scope : U.monthKey(today);
    return ctx.api.ledger.daily(mk, src);
  }

  P['youth.structure'] = {
    title: '支出结构', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const scope = ctx.params.scope || '';
      const src = ctx.params.src || '';

      /* 037（用户）：「支出结构」页顶部的「还剩多少」黑卡**直接删除**，
         这页只留「每日支出趋势」与下面的结构区（环形占比等不动）。
         黑卡迁去「我的」页顶部当资金卡（同 acctCard 函数，标题 037 改「资金」）；
         原来兼在卡上的资金来源选择器（.acct-pick 两半）跟着下岗 ——
         选择器换回 #stRest 顶部那排 chips（全部 / 家庭支持金 / 个人自有资金），
         bindRest 里那条 [data-src] 线正好照接。
         柱子卡不装堆叠壳（只剩一张），外包一层 data-st-bars：
         切来源/翻月时 refresh 原地换它的 innerHTML。 */
      let html = '<div class="pad">' +
        '<div data-st-bars>' +
        UI.dailyBars(stBars(ctx, scope, src), { attrs: ' data-shared-bars' }) +
        '</div>' +
        '<div id="stRest">' + stRest(ctx, scope, src) + '</div>' +
        '</div>';
      return html;
    },
    mount(el, ctx) {
      /* 037：结构页不再有堆叠（黑卡删了、只剩柱子卡一张，stackBlock 单卡
         本来也退回裸 html），[data-cs] 恒空 —— cardStack 那行一并退役；
         卡壳为空的 null-safe 兜底加在 ui.js（别的调用方也可能空手）。 */

      /* 选资金来源 / 翻月份都**原地更新** #stRest，不重渲染整页 ——
         用户只是在切一个筛选条件，整页滑一下会像"跳走了"。柱子卡也吃
         scope/src，跟着原地换 innerHTML（外包层 data-st-bars 就是它的把手）。 */
      function refresh(scope, src) {
        ctx.params.scope = scope;
        ctx.params.src = src;
        const box = el.querySelector('#stRest');
        if (box) box.innerHTML = stRest(ctx, scope, src);
        const bars = el.querySelector('[data-st-bars]');
        if (bars) bars.innerHTML =
          UI.dailyBars(stBars(ctx, scope, src), { attrs: ' data-shared-bars' });
        bindRest();
      }

      function bindRest() {
        const box = el.querySelector('#stRest');
        if (!box) return;
        /* 037 · 选池子的 chips（全部/家庭支持金/个人自有资金）在 #stRest 顶部，
           和月份箭头、分类段落走同一条事件线 */
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

      bindRest();
    }
  };

  /* ============================================================
     012 · 支出结构的 3 色池（palOf）—— 032 起**整体退役**。
     用户 032 给了新参考图（每类一色的环形占比图），「固定二到三个配色」
     的终裁被覆盖：段色改成分类自己的颜色（CATEGORIES.color，见 stRest）。
     这里留一行字，是因为 plans/012 与 README 里记着它 —— 代码删了、账还在。
     ============================================================ */

  /* ============================================================
     支出结构页里、柱子卡以下的那部分（月份切换 / 选池 chips / 大数字 /
     环形图 / 分类列表）
     ------------------------------------------------------------
     抽出来是为了切资金来源、翻月份时**只换这一块**（原地换 innerHTML，
     整页不滑）。037 起黑卡从这一页删了 —— 它原来兼的资金来源选择器
     挪进这里的 chips（bindRest 的 [data-src] 线直接接上）。
     ============================================================ */
  function stRest(ctx, scope, src) {
    const api = ctx.api;
    const d = api.ledger.structure(scope, src);
    const label = d.isYear ? d.scope + ' 年' : Number(d.scope.slice(5)) + ' 月';
    const P = d.pools;
    /* 032：环形图按用户参考图改成**分类自己的颜色**（CATEGORIES.color）——
       012「固定 2-3 个配色（3 色斑马）」的终裁被那张参考图覆盖，palOf 一并退役。 */
    const pal = d.cats.map(c => c.color || '#161618');
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

      /* 037 · 选资金来源（黑卡两半退役，选择器回到这排 chips —— 和 032 之前
         那版同一形态）。on 态跟着 src；「全部」= data-src=""。 */
      html += '<div class="st-src">' +
        [['', '全部'], ['family', '家庭支持金'], ['own', '个人自有资金']].map(p =>
          '<button class="chip' + ((src || '') === p[0] ? ' on' : '') +
          '" data-src="' + p[0] + '">' + p[1] + '</button>').join('') +
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
        '<div class="st-donut-wrap">' + donut(d.cats, pal) + '</div>' +
        '</div>';

      /* 四版：「按分类」列表整个删除（用户拍板）—— 信息全部上移到图内
         （每段三行标注：名称 / 占比 / 金额），空间留给大图。 */

      html += '<div class="proto mt20"><div class="ph"><span class="seal">看</span>占比是怎么算的</div>' +
        '<div class="xs t2" style="line-height:1.8">只统计支出，不含收入。' +
        '点任意一类可以跳到该类在账单里的全部明细。</div></div>';
      html += '<div style="height:30px"></div>';
      return html;

      /* 环形占比图（012 那版放射辐条图已被 032 的参考图版整体替换 —— 见下方 donut） */
      function donut(cats, pal) {
        /* 032 · 用户给了新参考图（甜甜圈 + 引线 + 环外单行标签），口径三处跟着换：
           ① 角度按占比 —— 覆盖 012「等角宽、禁止角度映射数值」；
           ② 每段吃分类自己的颜色 —— 覆盖 012「固定 2-3 个配色（3 色斑马）」；
           ③ 三行标注（名称/占比/金额）收成一行「名称 46%」，金额在下面的大数字里。
           只标占比 ≥4% 且最多 6 个（参考图里那几个小扇区同样不标）；
           同侧标签做纵向避让，重叠了往下推 16px。data-cat 一点没动 ——
           点任意一段 → 该类明细（bindRest 里那条线）。 */
        const W = 344, H = 232, CX = 172, CY = 116, R = 74, r = 45;
        const GAP = 0.014;                          // 段缝（弧度）
        const f = s => Math.round(s * 100) / 100;
        const P = (a, rad) => [CX + Math.cos(a) * rad, CY + Math.sin(a) * rad];
        let acc = -Math.PI / 2;                     // 12 点起、顺时针；cats 已按金额降序
        const segs = [], pick = [];
        const isRight = it => Math.cos(it.mid) >= 0;
        cats.forEach((c, i) => {
          const sweep = Math.max(0.004, c.ratio) * 2 * Math.PI;
          const a0 = acc + GAP / 2, a1 = acc + sweep - GAP / 2;
          const big = (a1 - a0) > Math.PI ? 1 : 0;
          const s0 = P(a0, r), s1 = P(a1, r), s2 = P(a1, R), s3 = P(a0, R);
          segs.push('<path class="st-seg" data-cat="' + c.id + '" fill="' + (pal[i] || '#161618') +
            '" style="--st-i:' + Math.min(i, 5) + '" d="M' + f(s0[0]) + ' ' + f(s0[1]) +
            'A' + r + ' ' + r + ' 0 ' + big + ' 1 ' + f(s1[0]) + ' ' + f(s1[1]) +
            'L' + f(s2[0]) + ' ' + f(s2[1]) +
            'A' + R + ' ' + R + ' 0 ' + big + ' 0 ' + f(s3[0]) + ' ' + f(s3[1]) + 'Z"/>');
          if (c.ratio >= 0.04 && pick.length < 6) {
            pick.push({ c: c, i: i, mid: acc + sweep / 2, ratio: c.ratio });
          }
          acc += sweep;
        });
        /* 标签先按左右分两侧，再同侧按 y 排开做纵向避让（最小间距 16）；
           顶出画布就把整列往上收 —— 不避让的话相邻小类的标签会叠在一起。 */
        const MIN = 16, TX = R + 20;
        pick.forEach(it => {
          it.y = CY + Math.sin(it.mid) * (R + 12);
        });
        ['r', 'l'].forEach(s => {
          const a = pick.filter(it => (isRight(it) ? 'r' : 'l') === s)
            .sort((x, y) => x.y - y.y);
          let prev = -1e9;
          a.forEach(it => { it.y = Math.max(it.y, prev + MIN); prev = it.y; });
          const over = a.length ? a[a.length - 1].y - (H - 14) : 0;
          if (over > 0) {
            let nx = 1e9;
            for (let k = a.length - 1; k >= 0; k--) { a[k].y = Math.min(a[k].y, nx - MIN); nx = a[k].y; }
          }
        });
        const deco = pick.map(it => {
          const right = isRight(it);
          const p1 = P(it.mid, R + 4);
          const tx = right ? CX + TX : CX - TX;
          return '<path class="st-lead" style="--st-i:' + Math.min(it.i, 5) + '" d="M' +
            f(p1[0]) + ' ' + f(p1[1]) + 'L' + f(right ? tx - 8 : tx + 8) + ' ' + f(it.y) +
            'L' + f(right ? tx - 2 : tx + 2) + ' ' + f(it.y) + '"/>' +
            '<text class="st-lab" style="--st-i:' + Math.min(it.i, 5) + '" x="' +
            f(right ? tx + 4 : tx - 4) + '" y="' + f(it.y + 4) + '" text-anchor="' +
            (right ? 'start' : 'end') + '">' +
            '<tspan>' + UI.esc(it.c.name) + '</tspan>' +
            '<tspan class="p" dx="5">' + Math.round(it.ratio * 100) + '%</tspan></text>';
        }).join('');
        return '<svg class="st-donut" viewBox="0 0 ' + W + ' ' + H +
          '" style="width:100%;height:auto;display:block">' + segs.join('') + deco + '</svg>';
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

  /* 022：这里原来是「我的银行卡」卡堆（卡堆自己的展开/收起状态也一并退役）。
     「我的」页改成银行卡管理内容之后卡堆没有别的使用者，整段删掉。 */

  /* 账单页只剩两个视图（008）：明细 / 周期。
     「订阅」「复盘」两个转跳按钮删掉了 —— 它们各自有独立页面
     （youth.subs 订阅管理、youth.review 复盘 tab），不该再在账单里
     占一个子视图入口；engine 里的深链一并改指独立页面。
     遗留的 ?view=subs|review 深链由 normView 归一到明细：
     渲染不炸，但不再有入口。 */
  const LEDGER_VIEWS = [
    { id: 'list', name: '明细' },
    { id: 'cycle', name: '周期' }
  ];
  function normView(v) { return v === 'cycle' ? 'cycle' : 'list'; }

  /* ============================================================
     流水页（账单）—— 壳固定 + 视图体页内横移（008）
     ------------------------------------------------------------
     版式分两层：
       · 壳 = 页头 / 双统计卡 / 订阅卡 / 分段控件 —— 页内换体永远不碰它，
         点「明细」里的分类分支、切「周期」，上面一动不动（同一批节点）；
       · 视图体 = #lgStage 里的 .swap-body —— 横移只发生在这一层，
         位移/时长/曲线与切 tab、切月逐字同一套令牌。
     ★ 换体不走 ctx.replace：那是整页 push（壳会跟着横移），还带
       R.animating 互斥锁 —— 350ms 内的连点会被静默吞掉（007 的教训）。
     ============================================================ */

  /** 视图体横移换体。stage 里任何时刻只留一块 live；
      连点由 stage.swapGen 代号收口，永远由后一次接管。
      ★ 顺序契约：先收尾（清掉上一次的 ghost）再取让位对象 ——
        反过来会拿到即将 detach 的节点，连点就叠出两块裸体（007 实测）。 */
  function swapBody(stage, fresh, goLeft) {
    if (!stage || !fresh) return;
    stage.querySelectorAll('.swap-body.ghost').forEach(g => g.remove());
    stage.querySelectorAll('.swap-body.live').forEach(x => x.classList.remove('live'));
    const box = stage.querySelector('.swap-body');      // ★ 先收尾再取
    fresh.classList.add('live', goLeft ? 'enter-l' : 'enter');
    fresh.setAttribute('data-swapdir', goLeft ? 'from-left' : 'from-right');
    if (box) {
      box.classList.add('ghost', goLeft ? 'behind-r' : 'behind');
      stage.insertBefore(fresh, box.nextSibling);
    } else {
      stage.appendChild(fresh);
    }
    void fresh.offsetWidth;                             // 起始态落地，过渡才触发
    fresh.classList.remove('enter', 'enter-l');
    stage.swapGen = (stage.swapGen || 0) + 1;
    const myGen = stage.swapGen;
    setTimeout(() => {
      if (myGen !== stage.swapGen) return;              // 已被后来一次换体收口
      stage.querySelectorAll('.swap-body.ghost').forEach(g => g.remove());
      stage.querySelectorAll('.swap-body.live').forEach(x => x.classList.remove('live'));
    }, UI.motion('--dur-ui') + 10);
  }

  function mkBody(html) {
    const d = document.createElement('div');
    d.className = 'swap-body';
    d.innerHTML = html;
    return d;
  }

  /** 壳 · 页头 + 双统计卡 + 订阅卡（页内换体不碰这三样）。
      （原页头下面那张「学习预算已超支」洞察卡整块删了 —— 008 判定没用；
      连同 budget_warn 的锁卡位一起撤，engine 里对应门禁同步移除。） */
  function ledgerShell(ctx) {
    const api = ctx.api;
    const ov = api.ledger.overview(14);

    /* 页头：大标题 + 条数。记一笔的入口在这里：青年端的主按钮让给了
       「这一笔要不要花」（决策预演），记账降级成账单页里的一个动作。 */
    let html = '<div class="lg-head">' +
      '<div><div class="lg-title">我的流水</div>' +
      '<div class="lg-sub">' + ov.count.toLocaleString('en-US') + ' 条记录</div></div>' +
      '<div class="row" style="gap:8px;align-items:center">' +
      '<div class="lg-mark">' + UI.icon('receipt', 46) + '</div>' +
      '</div>' +
      '</div>';

    /* 双统计卡：左只读，右可点进「支出结构」。
       data-shared-acct：首页黑卡「家庭支持协同账户」的共享元素落点。
       同宽 346（146 vs 170，只差 14%），是这一页里最贴近的对应物。 */
    html += '<div class="lg-duo" data-shared-acct>' +
      '<div class="lg-card">' +
      '<div class="n v-out">¥' + U.won(ov.expense) + '</div>' +
      '<div class="k">' + ov.monthLabel + '总支出</div>' +
      '<div class="lg-line"><span>今日支出</span><b class="out">−¥' + U.won(ov.todayOut) + '</b></div>' +
      '<div class="lg-line"><span>今日收入</span><b class="in">¥' + U.won(ov.todayIn) + '</b></div>' +
      '</div>' +
      '<button class="lg-card lg-hit" data-structure>' +
      '<div class="n v-out">¥' + U.won(ov.avgPerDay) + '</div>' +
      '<div class="k">' + ov.monthLabel + '日均支出</div>' +
      '<div class="lg-bars">' + ov.series.map(s => {
        const h = Math.max(3, Math.round(s.amount / ov.seriesMax * 44));
        const isToday = s.date === LJ.clock.now();
        return '<i style="height:' + h + 'px' + (isToday ? ';background:var(--ink)' : '') + '"></i>';
      }).join('') + '</div>' +
      '<div class="lg-axis"><span>' + Math.round(ov.seriesMax) + '</span><span>0.0</span></div>' +
      '</button>' +
      '</div>';

    /* 订阅阶梯栈 032 起不再是"紧挨着的一张卡"，而是堆叠卡组里的**第二张**：
       第一张是「每日收支」日历（用户：「做成一个卡片放在流水页面现在『订阅』
       的位置，和订阅做一个堆叠，左右滑动可以切换不同的卡片」）。
       堆叠的壳由 stackBlock 出（两页共用），交互在 LJ.cardStack。 */
    html += stackBlock([
      { k: 'daily', title: '每日收支', html: UI.dailyCal(api.ledger.daily(), { attrs: ' data-shared-daily' }) },
      { k: 'sub', title: '订阅', html: subsBlock(api) }
    ], ctx.params.stack);

    /* 024：能力轨迹卡搬去「我的」页（用户：卡介绍卡删掉后的空位）——
       连同 data-zoom-push 的绑定一起搬进 mountCardsPage 的 bindRest。 */
    return html;
  }

  /** 分段控件：只剩 明细 / 周期（订阅、复盘两个转跳按钮已删）。
      选中态由 mount 就地换 class，壳不重渲。 */
  function ledgerSeg(view) {
    return '<div class="row" style="gap:9px;padding:18px 0 2px;align-items:center">' +
      '<div class="seg" style="flex:1">' + LEDGER_VIEWS.map(s =>
        '<button class="' + (s.id === view ? 'on' : '') + '" data-v="' + s.id + '">' + s.name + '</button>'
      ).join('') + '</div>' +
      '<button class="icon-btn" data-go="youth.ai" title="智能助手">' + UI.icon('spark', 19) + '</button>' +
      '<button class="icon-btn" data-go="youth.import" title="导入账单">' + UI.icon('download', 19) + '</button>' +
      '</div>';
  }

  /* ---------- 明细体的两段：chips 是轨道，列表才换体 ---------- */
  /** 卡筛选入参归一：库里没有这张卡（深链写错 / 卡被删了）就当「全部」——
      否则会停在"筛到 0 条"的空态上，而两条 chip 轨道里没有任何一颗亮着。 */
  function normCard(api, id) {
    if (!id) return '';
    return api.card.list().some(c => c.id === id) ? id : '';
  }

  function ledgerData(o) {
    const api = o.api;
    const ov = api.ledger.overview(14);
    let all = api.entry.list(o.cat ? { category: o.cat } : {});
    /* 023 · 按银行卡筛选：走 api.card.cardOf —— 和卡片详情「这张卡上的账」
       同一个口径（收入按资金来源进支持金卡/自有资金卡，支出一律走日常扣款卡）。 */
    if (o.card) all = all.filter(e => api.card.cardOf(e) === o.card);
    return { ov, all, list: all.slice(0, o.limit) };
  }

  /** 列表体：空结果也要**保住筛选控件** —— 所以空态只是列表体里的一块，
      不是把 chips + stage 整段替换掉（那样筛到 0 条就再也切不回来了）。 */
  function listBody(o, d) {
    if (d.all.length) return ledgerRows(o, d);
    const filtered = !!(o.card || o.cat);
    return UI.empty('🗂',
      filtered ? '这个筛选下没有记录' : '这里还没有记录',
      filtered ? '换一张卡或一个分类，或点「全部」看整本账。'
        : '记一笔之后，这里会按天汇总你的收支。');
  }

  /** 银行卡筛选行（023）：和分类 chips **分行**（两个维度可以叠加）。
      位置放在分类行**下面** —— 这样 `#lgStage .chip:nth-child(n)` / `.chip.on`
      这类「首个匹配」的老选择器仍然先命中分类行，不必给它们加修饰。 */
  function ledgerCardRow(o) {
    const cards = o.api.card.list();
    if (!cards.length) return '';
    return '<div class="row" style="gap:8px;padding:2px 2px 10px;overflow-x:auto">' +
      '<button class="chip ' + (!o.card ? 'on' : '') + '" data-card="">全部</button>' +
      cards.map(c => '<button class="chip ' + (o.card === c.id ? 'on' : '') +
        '" data-card="' + c.id + '">' + UI.esc(c.name) + '</button>').join('') +
      '</div>';
  }

  /** 明细体：分类 chips + 银行卡 chips 两条轨道 + 内层 stage
      （点 chip 只有 stage 横移：两条轨道和壳都不动） */
  function ledgerListInner(o) {
    const d = ledgerData(o);
    return '<div class="row" style="gap:8px;padding:12px 2px 4px;overflow-x:auto">' +
      '<button class="chip ' + (!o.cat ? 'on' : '') + '" data-cat="">全部</button>' +
      LJ.CATEGORIES.map(c => '<button class="chip ' + (o.cat === c.id ? 'on' : '') +
        '" data-cat="' + c.id + '">' + c.icon + ' ' + c.name + '</button>').join('') +
      '</div>' +
      ledgerCardRow(o) +
      '<div class="swap-stage lg-list-stage">' +
      '<div class="swap-body">' + listBody(o, d) + '</div></div>';
  }

  /** 分组列表 + 加载更多（内层横移只换这一块） */
  function ledgerRows(o, d) {
    const groups = {};
    d.list.forEach(e => { (groups[e.date] = groups[e.date] || []).push(e); });
    const dates = Object.keys(groups).sort().reverse();

    /* 023 · 筛选标签 + 按卡小计：选中某张卡时，把这张卡的支出与收入直接摆出来
       （用户：我看到「我的」里每张卡都有自己的角色，流水里也要能看到每张卡的收支）。
       小计算的是**当前筛选下的全部**（d.all），不是首屏那 40 条。 */
    const card = o.card ? o.api.card.get(o.card) : null;
    const moreTxt = [card ? card.name : '', o.cat ? LJ.catById(o.cat).name : '']
      .filter(Boolean).join(' · ') || '全部';

    let html = '<div class="sec-title">' + d.ov.monthLabel + '账单' +
      '<span class="more">' + UI.esc(moreTxt) + '</span></div>';
    if (card) {
      const inn = d.all.filter(e => e.direction === 'in').reduce((s, e) => s + e.amount, 0);
      const out = d.all.filter(e => e.direction === 'out').reduce((s, e) => s + e.amount, 0);
      html += '<div class="lg-cardsum" data-cardsum>' +
        '<span>' + UI.esc(card.name) + ' ••' + card.tail + ' · ' + d.all.length + ' 笔</span>' +
        '<span>支出 <b class="out">¥' + U.won(out) + '</b> · 收入 <b class="in">¥' + U.won(inn) + '</b></span>' +
        '</div>';
    }
    dates.forEach(dt => {
      const day = groups[dt];
      const out = day.filter(e => e.direction === 'out').reduce((s, e) => s + e.amount, 0);
      const income = day.filter(e => e.direction === 'in').reduce((s, e) => s + e.amount, 0);
      html += '<div class="lg-daygroup">' +
        '<div class="lg-dayhead"><span class="d">' + U.ymdCN(dt) + '</span>' +
        '<span class="s">支出:<span class="v-out">¥' + U.won(out) + '</span> | 收入:<span class="v-in">¥' + U.won(income) + '</span></span></div>' +
        '<div class="list">' + day.map(e => entryRow(e, o.ctx, o.hl)).join('') + '</div>' +
        '</div>';
    });

    if (d.all.length > d.list.length) {
      html += '<button class="btn ghost mt20" data-more>再加载 ' +
        Math.min(40, d.all.length - d.list.length) + ' 笔</button>';
    } else {
      html += '<div class="xs muted" style="text-align:center;padding:22px 0">— 已经到底了 —</div>';
    }
    return html;
  }

  /** 周期体：成长任务解锁出来的（t_record7 连续记账 7 天），
      没解锁就显示"完成任务解锁"的卡，不是把入口藏起来。 */
  function ledgerCycleInner(ctx) {
    return ctx.api.unlock.has('cycle_view')
      ? asView('youth.cycle', ctx)
      : '<div style="padding-top:14px">' + LJ.lockedCard(ctx, 'cycle_view') + '</div>';
  }

  /** 视图体（初次渲染版；页内换体时用 mkBody 同构重建） */
  function ledgerBody(ctx, view, o) {
    return '<div class="swap-body">' +
      (view === 'cycle' ? ledgerCycleInner(ctx) : ledgerListInner(o)) + '</div>';
  }

  P['youth.ledger'] = {
    title: '流水', chrome: 'tab', hideNav: true,
    render(ctx) {
      const view = normView(ctx.params.view);
      const o = {
        ctx, api: ctx.api,
        cat: ctx.params.cat || '',
        card: normCard(ctx.api, ctx.params.card),
        limit: Number(ctx.params.limit) || 40,
        hl: ctx.params.hl || null
      };
      /* 壳 → 分段控件 → 视图体：横移只发生在 #lgStage 里 */
      return '<div class="pad">' +
        ledgerShell(ctx) +
        ledgerSeg(view) +
        '<div class="swap-stage" id="lgStage">' + ledgerBody(ctx, view, o) + '</div>' +
        '</div>';
    },
    mount(el, ctx) {
      const st = {
        view: normView(ctx.params.view),
        cat: ctx.params.cat || '',
        card: normCard(ctx.api, ctx.params.card),
        limit: Number(ctx.params.limit) || 40,
        hl: ctx.params.hl || null
      };
      const stage = el.querySelector('#lgStage');
      const listOpt = () => ({
        ctx, api: ctx.api, cat: st.cat, card: st.card, limit: st.limit, hl: st.hl
      });

      /* 页内换体的状态同步回路由 params：数据变化会走 router.refresh()
         （整页按 params 重渲染），不同步的话筛选/分页会被打回初始值。 */
      const sync = () => {
        const ent = LJ.router.current && LJ.router.current();
        if (!ent || ent.name !== 'youth.ledger' || !ent.params) return;
        ent.params.view = st.view;
        ent.params.cat = st.cat;
        ent.params.card = st.card;
        if (st.limit > 40) ent.params.limit = st.limit; else delete ent.params.limit;
        delete ent.params.hl;
      };

      /* ---------- 壳层接线（点了不换体） ---------- */
      el.querySelectorAll('[data-go]').forEach(n => {
        n.onclick = () => ctx.go(n.getAttribute('data-go'));
      });
      /* 记一笔的入口 016 起统一走右下角浮标（本页右上角那个 compose 按钮已删，
         那是用户点名的重复入口）—— 这里不再为它接任何点击。 */
      /* 右卡 → 支出结构（用卡片缩放转场，和首页两张卡一致） */
      el.querySelectorAll('[data-structure]').forEach(n => {
        n.onclick = () => LJ.router.zoomPush('youth.structure', {}, n);
      });
      /* 能力轨迹卡的 zoom-push 绑定 024 跟着卡搬去了「我的」页的 bindRest ——
         本页已无 [data-zoom-push]，这里不再接线。 */
      /* 032 · 堆叠卡组（每日收支 ↔ 订阅）：跟手拖拽、松手按速度/过线落位；
         日历卡的月份箭头在这里接线（换月只换那张卡，堆叠和壳都不动）。
         ★ 顺序：cardStack 必须**先于** subsMount —— 订阅展开态可能和渲染时的
           内联高度不同，那次 layout() 要靠 stackSync 把堆叠高度重量回来
           （cardStack 没挂上时 stackSync 是空操作，高度就落在旧值上）。 */
      LJ.cardStack(el.querySelector('[data-cs]'), {
        /* 展开态的订阅视口自己能横滑（010 B5 的 scroll-snap）—— 手指落在它身上时
           让给它：否则"横滑订阅"会被堆叠抢走，两张卡一起动。 */
        ignore: e => {
          const v = e.target && e.target.closest && e.target.closest('.sub-viewport');
          return !!(v && v.getAttribute('data-open') === '1');
        }
      });
      LJ.dcBind(el, ctx.api);
      LJ.subsMount(el);   /* 订阅阶梯栈的折叠⇄展开（头部直达按钮在视口之外，不打架） */

      /* ---------- 视图体内接线（换体后对新体再调一次） ---------- */
      const bindRows = root => {
        if (!root) return;
        root.querySelectorAll('[data-entry]').forEach(n => {
          /* 018：点账单 = 从底部弹详情抽屉（用户拍板），不再整页跳转；
             youth.entryDetail 页面保留给深链与探针。 */
          n.onclick = () => LJ.openEntryDetailSheet(ctx, n.getAttribute('data-entry'));
        });
        /* 010 · C3：动作按钮（行左滑露出的那两个） */
        root.querySelectorAll('[data-sw-act]').forEach(b => {
          b.onclick = e2 => {
            e2.stopPropagation();
            const id = b.getAttribute('data-id');
            UI.swCloseAll();
            if (b.getAttribute('data-sw-act') === 'entry-edit') {
              LJ.openEditEntrySheet(ctx, id);
            } else {
              UI.confirm({
                title: '删除这笔记录？', desc: '删除后不可恢复。', okText: '删除',
                onOk() { ctx.api.entry.remove(id); UI.toast('已删除'); ctx.refreshTop(); }
              });
            }
          };
        });
        UI.rowSwipe(root);
        const more = root.querySelector('[data-more]');
        if (more) more.onclick = moreLoad;
      };
      const bindChips = root => {
        if (!root) return;
        root.querySelectorAll('[data-cat]').forEach(n => { n.onclick = () => setCat(n); });
        root.querySelectorAll('[data-card]').forEach(n => { n.onclick = () => setCard(n); });
      };
      const bindList = root => { bindChips(root); bindRows(root); };
      const bindCycle = root => {
        LJ.bindLocked(root, ctx);
        const p = LJ.pages['youth.cycle'];
        if (p && p.mount) p.mount(root, ctx);
      };

      /* chips 行和列表 stage 是兄弟；分类行和 stage 之间还夹着银行卡筛选行（023），
         所以按「往后找第一个 .swap-stage」定位，而不是 nextElementSibling。 */
      const listStageOf = row => {
        let n = row.nextElementSibling;
        while (n && !n.classList.contains('swap-stage')) n = n.nextElementSibling;
        return n;
      };

      /* ---------- 点分类 chip：只有内层列表横移，chips 和壳都不动 ----------
         方向看 chip 的**空间下标**（同切 tab / 切月），不是分类字母序。 */
      const setCat = n => {
        const row = n.parentNode;                      /* chips 轨道 —— 它不换体 */
        const chips = [].slice.call(row.querySelectorAll('[data-cat]'));
        const on = row.querySelector('.chip.on');
        const cat = n.getAttribute('data-cat');
        if (on && on.getAttribute('data-cat') === cat) return;  /* 同值不重放 */
        const listStage = listStageOf(row);
        if (!listStage) return;
        const goLeft = chips.indexOf(n) < chips.indexOf(on);
        st.cat = cat; st.hl = null; sync();
        chips.forEach(c => c.classList.toggle('on', c === n));  /* 选中态立刻挪 */
        swapBody(listStage, mkBody(listBody(listOpt(), ledgerData(listOpt()))), goLeft);
        bindRows(listStage.querySelector('.swap-body.live'));
      };

      /* ---------- 023 · 点银行卡 chip：同一套机制（只换内层列表）。
         两个筛选维度叠加：先按卡收窄，再按分类收窄，互不覆盖。 */
      const setCard = n => {
        const row = n.parentNode;
        const chips = [].slice.call(row.querySelectorAll('[data-card]'));
        const on = row.querySelector('.chip.on');
        const card = n.getAttribute('data-card');
        if (on && on.getAttribute('data-card') === card) return;
        const listStage = listStageOf(row);
        if (!listStage) return;
        const goLeft = chips.indexOf(n) < chips.indexOf(on);
        st.card = card; st.hl = null; sync();
        chips.forEach(c => c.classList.toggle('on', c === n));
        swapBody(listStage, mkBody(listBody(listOpt(), ledgerData(listOpt()))), goLeft);
        bindRows(listStage.querySelector('.swap-body.live'));
      };

      /* ---------- 加载更多：列表原地长出来（不横移 —— 横移是"换一页"的语感） ---------- */
      const moreLoad = () => {
        st.limit += 40; sync();
        const listStage = el.querySelector('.lg-list-stage');
        if (!listStage) return;
        listStage.querySelectorAll('.swap-body.ghost').forEach(g => g.remove());
        listStage.innerHTML = '<div class="swap-body">' +
          listBody(listOpt(), ledgerData(listOpt())) + '</div>';
        bindRows(listStage);
      };

      /* ---------- 切视图：方向看 LEDGER_VIEWS 的空间下标（同切 tab） ---------- */
      const setView = next => {
        if (next === st.view) return;
        const curIdx = LEDGER_VIEWS.findIndex(v => v.id === st.view);
        const nextIdx = LEDGER_VIEWS.findIndex(v => v.id === next);
        st.view = next; st.hl = null; sync();
        el.querySelectorAll('[data-v]').forEach(b =>          /* 选中态立刻挪 */
          b.classList.toggle('on', b.getAttribute('data-v') === next));
        const fresh = mkBody(next === 'cycle' ? ledgerCycleInner(ctx) : ledgerListInner(listOpt()));
        swapBody(stage, fresh, nextIdx < curIdx);
        if (next === 'cycle') bindCycle(fresh); else bindList(fresh);
      };
      el.querySelectorAll('[data-v]').forEach(n => {
        n.onclick = () => setView(n.getAttribute('data-v'));
      });

      /* B1（010）：视图体横滑切 明细/周期 —— 方向仍由空间下标派生，
         换体机制（swapBody + swapGen）一个字没动。
         起点落在行里（.sw）就让给行滑动：手指落在谁身上，谁说了算。 */
      LJ.gest.swipe(stage, {
        ignore: e => !!(e.target && e.target.closest &&
          e.target.closest('.sw, input, textarea, .sub-viewport')),
        onFire: dir => {
          const i = LEDGER_VIEWS.findIndex(v => v.id === st.view);
          const to = dir === 'left' ? i + 1 : i - 1;
          if (to >= 0 && to < LEDGER_VIEWS.length) setView(LEDGER_VIEWS[to].id);
        }
      });

      /* 初始视图体接线（壳层的 data-go 上面已绑，这里只管体内的） */
      if (st.view === 'cycle') bindCycle(stage); else bindList(stage);
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

  /* ============================================================
     026 · 全屏沙盘「岔路口」—— 决策沙盘 v2
     ------------------------------------------------------------
     需求原话：「倾向方向 B，做一个全屏的模式……像一个折线图吧，根据不同的
     消费选择出现不同的分支」。三个拍板（plans/026 §0）：顺序分岔 + 幽灵线、
     深色仪表台、判断卡直进全屏（原单笔弹层降级并入本页的快速输入）。

     为什么是"顺序分岔"而不是决策树：每个选择二分，三笔就是 8 条线，
     375px 宽的手机屏上会糊成一团。这里只有一根时间轴、一条你走的路，
     每个分岔点留下一条**幽灵支线**（你没走的那条路）——
     机会成本的形状，而不是穷举。

     ★ 不评判、不劝阻（文档 3.3.2）：页面上没有"别买了"，只有
       "全都不买第 X 天见底 / 这个选法第 Y 天见底"。
     ★ 图和文案同源：都走 LJ.engine.sandbox.math —— 023 的病根是图和字各算各的。

     030 · 机制交给用户（plans/030 §0）：
     · 四格全由用户填：起止日期、起始金额、每天基本开支（可以是 0）、
       计划天数 = 日期差。模型**不再读 api.dashboard()** ——
       "按现在的节奏"退役：节奏是用户定的数，不是历史日均的假客观。
     · 未设置 = 设置门：不画图、不给假数据，先把边界定了才推演。
     · 自定义分支：存为分支 / 点分支切换（改道动画）/ 分支线与幽灵线叠加。
     · 真实日期轴：横轴、chip、拖拽落点、游标读数都显日期，
       内部仍是相对天数，换算真源 = U.addDays(设置起始日, day)。
     ============================================================ */

  /* 这轮推演的状态（模块级：页内重渲染不丢，离开再回来也还在 ——
     "你的推演还在"；「重来」清空设置+决策+分支。探针每次全新加载，
     起点一定是"未设置"的空态）。
       SB_SET = {start,end,amount,pace} | null —— null = 未设置（设置门）
       SB_DEC = 计划支出清单；SB_BR = 存下来的分支快照 */
  let SB_SET = null;
  let SB_DEC = [];
  let SB_SEQ = 0;
  let SB_BR = [];
  let SB_BRSEQ = 0;

  /* 减弱动效：入场生长与改道插值都直接落终态（playbook §6） */
  function sbReduce() {
    try {
      return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    } catch (e) { return false; }
  }
  const sbN2 = v => Math.round(v * 100) / 100;

  /* ---------------- 030 · 推演设置（四格全由用户填） ----------------
     默认留空（用户拍板「全部留空由我填」）—— 未设置时页面只出"设置门"，
     不画图、不给假数据。校验在这里兜底，弹层只管收集。 */
  LJ.sandboxSetup = function (cfg) {
    cfg = cfg || {};
    const start = String(cfg.start || '');
    const end = String(cfg.end || '');
    const amount = Math.round(Number(cfg.amount));
    const perDay = Math.round(Number(cfg.perDay));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(start) || !/^\d{4}-\d{2}-\d{2}$/.test(end)) return null;
    if (U.diffDays(start, end) < 1) return null;          // 至少 1 天（订酒店同款：结束晚于开始）
    if (!isFinite(amount) || amount <= 0) return null;    // 起始金额必须为正
    if (!isFinite(perDay) || perDay < 0) return null;     // 每天基本开支 ≥ 0（0 合法）
    SB_SET = { start: start, end: end, amount: amount, perDay: perDay };
    return SB_SET;
  };
  LJ.sandboxSettings = function () { return SB_SET; };
  LJ.sandboxReady = function () { return !!SB_SET; };

  /** 页面的模型：030 起四格全部来自用户设置（不再读 api.dashboard）。
      remaining=起始金额，pace=每天基本开支（可 0），days=起止日期差；
      branches = 存下的分支快照（chartBranch 给每条画线）。 */
  LJ.sandboxModel = function (decisions) {
    const s = SB_SET;
    if (!s) return { ready: false, remaining: 0, pace: 0, days: 0, decisions: decisions || [], branches: SB_BR };
    return {
      ready: true,
      start: s.start,
      end: s.end,
      remaining: s.amount,
      pace: s.perDay,
      days: Math.max(1, U.diffDays(s.start, s.end)),
      decisions: decisions || [],
      branches: SB_BR
    };
  };
  /* 结论句（plans/026 §2.4 的冻结措辞 → 030 改判 head/badge/note）：
     页面与探针都从这里取，全程只有一份 */
  LJ.sandboxVerdict = function (m) { return LJ.engine.sandbox.verdict(m); };

  /* ---------------- 030 · 自定义分支 ----------------
     分支 = 支出清单的一种开闭组合（按决策 id 存快照）。
     点分支 = 把买/不买切到那套组合（改道动画复用）；删决策时从所有分支里
     摘掉它（分支里一笔都不剩就随分支一起删，否则它只是"全不买"的重影）。 */
  LJ.sandboxBranchSave = function (name) {
    if (!SB_DEC.length) { UI.toast('先加一笔，再存分支'); return null; }
    SB_BRSEQ++;
    const br = {
      id: 'b' + SB_BRSEQ,
      name: name || ('方案 ' + (SB_BR.length + 1)),
      ids: SB_DEC.filter(d => d.on).map(d => d.id)
    };
    SB_BR.push(br);
    return br;
  };
  LJ.sandboxBranches = function () { return SB_BR; };
  LJ.sandboxBranchApply = function (id) {
    const br = SB_BR.find(b => b.id === id);
    if (!br) return false;
    SB_DEC.forEach(d => { d.on = br.ids.indexOf(d.id) >= 0; });
    return true;
  };
  LJ.sandboxBranchDel = function (id) {
    SB_BR = SB_BR.filter(b => b.id !== id);
  };

  /* ?sbAmt=200 调试钩子（风格对齐 ?ava=1）：预置一笔待定消费，
     让 check-live / 探针 / 渲染测试能在真实页面里确定性地取到"有分支"的状态。
     ★ 取 DOM 前先问一句：渲染测试跑在 node 里（那份 document 没有 querySelector），
       探针/页面才有真 document —— 这里不能直接点。 */
  function sbLiveEl() {
    try {
      return (typeof document !== 'undefined' && document.querySelector)
        ? document.querySelector('[data-sb]') : null;
    } catch (e) { return null; }
  }
  LJ.sandboxSeed = function (amount, day) {
    const a = Math.round(Number(amount) || 0);
    if (!(a > 0)) return null;
    SB_SEQ++;
    const d = {
      id: 'q' + SB_SEQ, name: '这一笔', amount: a,
      day: Math.max(0, Math.round(Number(day) || 0)), on: true
    };
    SB_DEC.push(d);
    const el = sbLiveEl();
    if (el) sbPaint(el, false);
    return d;
  };
  /* 清空这轮推演（「重来」按钮与测试共用同一个出口）：设置、支出、分支一起回零 */
  LJ.sandboxReset = function () {
    SB_SET = null;
    SB_DEC = [];
    SB_BR = [];
    const el = sbLiveEl();
    if (el) sbPaint(el, false);
  };

  /* 页面根：mount 拿到的是**页面宿主**（.page-body），而 data 契约挂在渲染出来的
     .sb 根上。写证人属性时必须落到真正那一个 —— 探针与 check-live 读的是 [data-sb]。
     （027 施工时踩到：属性写到了宿主上，探针读到 null，而渲染初值恰好一样，
       "分支标记"那条断言于是变成了在验初值 —— 假绿。） */
  function sbRoot(el) {
    return (el && el.querySelector && el.querySelector('[data-sb]')) || el;
  }

  /* 航道图的高度（028 立式，030 修对容器）：用户「放大这个页面里折线图的占比」——
     图吃掉"结论以下、决策轨以上"的剩余空间。读不到宿主高度（node 渲染测试里
     没有 DOM）就用 300 的兜底值；上下限 [210,460] 免得在长屏上摊成一条空带。
     ★ 真实容器是 #app-root（= .page-layer 那个滚动容器的高），**不是 #screen**
       —— #screen 还含 54px 状态栏，page-body 另有 34px 底部内边距。
       028 拿 #screen 算预算就错了，030 加了「智能建议占位 + 分支行」77px 之后
       决策轨被裁出屏幕 15px（30c 截图实锤），而探针当时量的是 [data-sb] 这个
       假容器 —— 量错的尺子配上量错的判据 = 一路假绿。030 一起修掉。
     固定开销 404 = page-body 底距 34 + 页面自身 370（顶栏 40 + 结论区含建议占位
     + 读数图例 + 出口分流 + 分支行 + 决策轨 + 上下内边距，满载实测）。
     ★ 这个数是**实测取整**：403 时 body=783 > layer=782，正好溢 1px 让决策轨
       又滚起来（探针判据：layer.scrollHeight ≤ layer.clientHeight，容差 0）。 */
  const SB_CHART_FALLBACK = 300;
  function sbChartH() {
    try {
      const app = document.getElementById('app-root');
      const h = app && app.clientHeight ? app.clientHeight : 0;
      if (!h) return SB_CHART_FALLBACK;
      return U.clamp(Math.round(h - 404), 210, 460);
    } catch (e) { return SB_CHART_FALLBACK; }
  }

  /* 抽屉内容（028/029，030-r2 换日期选择）：只做**输入**——
     金额 + 快捷金额 + **日期（点开日历选某一天）** + 加进推演。
     ★ 030-r2（用户）：「第几天」数字输入换成日历 —— 点日期按钮弹出当月日历，
       点格子即选中（选完自动收起），换月可用 ‹ ›。日历体**复用
       `LJ.sandboxSetupBody` 的单日模式**（st.single=true）—— 两处日历一个真源，
       只是"点两下选起止"和"点一下选某天"的交互不同。
     ★ 两个出口已经搬回页面上（见 .sb-exits，029）。 */
  LJ.sandboxDrawerBody = function (picked) {
    const s = SB_SET;
    const p = picked || (s ? s.start : LJ.clock.now());
    const day = s ? U.clamp(U.diffDays(s.start, p), 0, U.diffDays(s.start, s.end)) : -1;
    const dayTxt = !s ? '选日期' : (day > 0 ? '第 ' + day + ' 天' : '起始日');
    return '<div class="sb-drawer">' +
      '<div class="ss-in"><span class="cur">¥</span>' +
      '<input id="ssAmt" type="text" inputmode="decimal" placeholder="输入金额" autocomplete="off"></div>' +
      '<div class="ss-chips">' +
      [50, 100, 200, 500].map(n =>
        '<button class="chip" data-amt="' + n + '">¥' + n + '</button>').join('') +
      '</div>' +
      '<div class="sb-dayrow">' +
      '<button type="button" class="sb-daybtn" data-sb-daybtn aria-label="选择哪天花">' +
      UI.icon('cal', 15) + '<b data-sb-daylabel>' + U.md(p) + '</b>' +
      '<span class="lb" data-sb-daynum>' + dayTxt + '</span></button>' +
      '<button class="btn sm sb-add" data-sb-add>加进推演</button></div>' +
      '<div class="sb-daycal" data-sb-daycal hidden></div>' +
      '<div class="sb-dayhint">点决策切买/不买，拖到图上改哪天</div>' +
      '</div>';
  };
  /* 选中的日期（模块级：sheet 重建 DOM 时保持）；每次开抽屉重置为起始日 */
  let SB_PICK = null;
  function sbPickDay() {
    if (!SB_SET) return LJ.clock.now();
    const all = U.diffDays(SB_SET.start, SB_SET.end);
    return U.addDays(SB_SET.start,
      U.clamp(U.diffDays(SB_SET.start, SB_PICK || SB_SET.start), 0, all));
  }

  /* ---- 029 · 「记成下期约定」：门槛可改 + 先预览 ----
     规则原文只有这一处生成（弹层预览、落库文案、判据都用它）——
     两处各写一份文案迟早会漂（023 的老教训）。 */
  LJ.sandboxRuleText = function (step) {
    return '单笔 ¥' + step + ' 以上的支出，先在沙盘里过一遍再决定';
  };
  /** 门槛默认值：取"买"的决策里最大的一笔，向上凑到 50/100/200/300/500 一档 */
  function sbRuleStep() {
    const st = LJ.engine.sandbox.math(LJ.sandboxModel(SB_DEC));
    const on = st.dec.filter(d => d.on);
    if (!on.length) return 0;
    const biggest = Math.max.apply(null, on.map(d => d.amount));
    return biggest >= 500 ? 500 : biggest >= 300 ? 300 : biggest >= 200 ? 200
      : biggest >= 100 ? 100 : 50;
  }

  /* 「记成下期约定」弹层：把要写进约定的那句话**先摆出来**（门槛可改，改一个字预览跟着变），
     确认了才落库。原来的「就这样定了」是自动拟一条规则、点完只有一个 toast ——
     用户既不知道写了什么，也几乎看不到后果（plans/029 的问题清单）。 */
  LJ.openRuleSheet = function (pageEl, ctx) {
    const step0 = sbRuleStep();
    if (!step0) { UI.toast('先加一笔待定的消费'); return; }
    UI.sheet({
      title: '记成下期约定',
      sub: '写进「下期约定」，复盘页底部能看到',
      body: '<div class="sb-rule">' +
        '<div class="sb-rule-line"><span>单笔 ¥</span>' +
        '<input id="sbrAmt" type="text" inputmode="numeric" value="' + step0 +
        '" aria-label="门槛金额"><span>以上的支出，先在沙盘里过一遍再决定</span></div>' +
        '<div class="sb-rule-prev">将写进约定：<b data-sbr-prev>' +
        UI.esc(LJ.sandboxRuleText(step0)) + '</b></div>' +
        '<button class="btn" data-sbr-ok>记进下期约定</button>' +
        '<button class="btn ghost" data-sbr-no>先不记</button>' +
        '</div>',
      mount(sheet, close) {
        const inp = sheet.querySelector('#sbrAmt');
        const prev = sheet.querySelector('[data-sbr-prev]');
        const read = () => Math.max(1, Math.round(Number(String(inp.value).replace(/[^0-9]/g, '')) || 0));
        const sync = () => { prev.textContent = LJ.sandboxRuleText(read()); };
        inp.oninput = sync;
        sheet.querySelector('[data-sbr-ok]').onclick = () => {
          const step = read();
          try {
            ctx.api.review.adopt(U.monthKey(LJ.clock.now()),
              { kind: 'rule', text: LJ.sandboxRuleText(step) });
            UI.toast('已记入下期约定：单笔 ¥' + step + ' 以上先过一遍沙盘');
          } catch (e) { UI.toast('已记下这次推演'); }
          close();
        };
        sheet.querySelector('[data-sbr-no]').onclick = close;
        setTimeout(() => {
          try { inp.focus({ preventScroll: true }); } catch (e) { /* 老浏览器就算了 */ }
        }, 320);
      }
    });
  };

  /* ---- 030 · 推演设置弹层（用户口径：像订酒店那样选起止日期 + 填两个数） ----
     日历体做成纯函数（渲染测试直接断言格子/区间/天数，不用开弹层）：
       st = { view:'YYYY-MM', start:'YYYY-MM-DD'|null, end:同|null }
     选法跟订酒店一致：点一下 = 起点，再点一下 = 终点（晚于起点才收，
     否则重开一轮）；已选区间两端实心、中间浅色。 */
  LJ.sandboxSetupBody = function (st) {
    const ym = st.view;
    const dim = U.daysInMonth(ym + '-01');
    const lead = U.parse(ym + '-01').getDay();          // 周开头 = 周日
    const today = LJ.clock.now();
    let cells = '';
    for (let i = 0; i < lead; i++) cells += '<i class="cal-pad"></i>';
    for (let d = 1; d <= dim; d++) {
      const iso = ym + '-' + U.pad(d);
      const isOn = iso === st.start || iso === st.end;
      /* 030-r2 · single 模式（抽屉"选哪天花"）：单日无区间，.in 不出现 */
      const inRg = !st.single && !!(st.start && st.end && iso > st.start && iso < st.end);
      cells += '<button class="cal-d' + (isOn ? ' on' : '') + (inRg ? ' in' : '') +
        (iso === today ? ' td' : '') + '" data-cal-d="' + iso + '">' + d + '</button>';
    }
    const span = (st.start && st.end) ? U.diffDays(st.start, st.end) : 0;
    /* single 模式摘要：只报那一天（pickedLabel = 调用方算好的「M/D · 第 N 天」） */
    const sum = st.single
      ? (st.start ? (st.pickedLabel || U.md(st.start)) : '选一天')
      : (!st.start ? '点第一天'
        : !st.end ? (U.md(st.start) + ' → 再点最后一天')
          : (U.md(st.start) + ' → ' + U.md(st.end) + ' · 共 ' + span + ' 天'));
    return '<div class="cal-hd">' +
      '<button class="cal-nav" data-cal-m="-1" aria-label="上个月">‹</button>' +
      '<b data-cal-t>' + Number(ym.slice(0, 4)) + ' 年 ' + Number(ym.slice(5, 7)) + ' 月</b>' +
      '<button class="cal-nav cal-next" data-cal-m="1" aria-label="下个月">›</button>' +
      '</div>' +
      '<div class="cal-w"><span>日</span><span>一</span><span>二</span><span>三</span>' +
      '<span>四</span><span>五</span><span>六</span></div>' +
      '<div class="cal-g">' + cells + '</div>' +
      '<div class="cal-sum" data-cal-sum>' + sum + '</div>';
  };

  LJ.openSetupSheet = function (pageEl, ctx) {
    const s = SB_SET;
    const st = {
      view: s ? s.start.slice(0, 7) : LJ.clock.now().slice(0, 7),
      start: s ? s.start : null,
      end: s ? s.end : null
    };
    UI.sheet({
      title: '先定这轮推演的边界',
      sub: '起止日期、起始金额、每天基本开支 —— 四件事都由你填',
      body: '<div class="sb-setup">' +
        '<div data-cal>' + LJ.sandboxSetupBody(st) + '</div>' +
        '<div class="ss-in"><span class="cur">¥</span>' +
        '<input id="setAmt" type="text" inputmode="decimal" placeholder="起始金额" ' +
        'value="' + (s ? s.amount : '') + '" autocomplete="off"></div>' +
        '<div class="ss-in"><span class="cur">¥</span>' +
        '<input id="setPace" type="text" inputmode="decimal" placeholder="每天基本开支（0 = 只按计划支出走）" ' +
        'value="' + (s ? s.perDay : '') + '" autocomplete="off"></div>' +
        '<button class="btn" data-set-ok>' + (s ? '保存设置' : '开始推演') + '</button>' +
        '<button class="btn ghost" data-set-no>先不推</button>' +
        '</div>',
      mount(sheet, close) {
        const cal = sheet.querySelector('[data-cal]');
        const redraw = () => { cal.innerHTML = LJ.sandboxSetupBody(st); };
        cal.addEventListener('click', ev => {
          const nav = ev.target.closest && ev.target.closest('[data-cal-m]');
          if (nav) {
            st.view = U.addMonths(st.view + '-01', Number(nav.getAttribute('data-cal-m'))).slice(0, 7);
            redraw();
            return;
          }
          const cell = ev.target.closest && ev.target.closest('[data-cal-d]');
          if (!cell) return;
          const iso = cell.getAttribute('data-cal-d');
          if (!st.start || (st.start && st.end)) { st.start = iso; st.end = null; }
          else if (iso > st.start) st.end = iso;
          else { st.start = iso; st.end = null; }   // 点得比起点还早 → 重开一轮
          redraw();
        });
        sheet.querySelector('[data-set-ok]').onclick = () => {
          const amt = sheet.querySelector('#setAmt');
          const pace = sheet.querySelector('#setPace');
          const cfg = LJ.sandboxSetup({
            start: st.start, end: st.end,
            amount: String(amt.value).trim(),
            perDay: String(pace.value).trim()
          });
          if (!cfg) {
            UI.toast(!st.start || !st.end ? '先选起止日期（点两下）'
              : !(Number(String(amt.value).replace(/[^0-9.]/g, '')) > 0) ? '起始金额要大于 0'
                : '每天基本开支填一个数（可以是 0）');
            return;
          }
          close();
          /* 设置可能把页面从「设置门」换成「有图」——整页重画，不是 sbPaint 能补的 */
          if (ctx && ctx.refreshTop) ctx.refreshTop();
          UI.toast(s ? '设置改好了' : '边界定了，开始推演');
        };
        sheet.querySelector('[data-set-no]').onclick = close;
      }
    });
  };

  /* 右下角圆点 → 底部抽屉（028 用户口径：像记账一样一个圆点，点开像抽屉弹出）。
     动效与把手和记一笔的弹层同源（UI.sheet）：下拉或点遮罩都能收。
     030-r2：日期从「第几天」数字框换成**点按钮弹日历**（复用设置日历的单日模式）。 */
  LJ.openSandboxDrawer = function (pageEl, ctx) {
    SB_PICK = null;                       // 每次开抽屉回到起始日
    UI.sheet({
      title: '加一笔待定的消费',
      sub: '按你本周期剩下的预算算，不评判，只算数',
      body: LJ.sandboxDrawerBody(sbPickDay()),
      mount(sheet, close) {
        /* 抽屉每次都是新的一棵 DOM，绑定跟着内容一起挂 */
        const amt = sheet.querySelector('#ssAmt');
        sheet.querySelector('#ssAmt').onkeydown = ev => {
          if (ev.key === 'Enter') sbAdd(pageEl, sheet, close);
        };
        sheet.querySelector('[data-sb-add]').onclick = () => sbAdd(pageEl, sheet, close);
        sheet.querySelectorAll('[data-amt]').forEach(b => {
          b.onclick = () => { amt.value = b.getAttribute('data-amt'); };
        });
        /* 030-r2 · 日期 = 点按钮弹当月日历（单日模式），点格子即选中并收起 */
        const dayBtn = sheet.querySelector('[data-sb-daybtn]');
        const calBox = sheet.querySelector('[data-sb-daycal]');
        const labDate = sheet.querySelector('[data-sb-daylabel]');
        const labDay = sheet.querySelector('[data-sb-daynum]');
        const calSt = { view: sbPickDay().slice(0, 7), start: sbPickDay(), end: null, single: true };
        const syncPick = () => {
          const p = sbPickDay();
          const n = SB_SET ? U.diffDays(SB_SET.start, p) : 0;
          labDate.textContent = U.md(p);
          labDay.textContent = !SB_SET ? '选日期' : (n > 0 ? '第 ' + n + ' 天' : '起始日');
          calSt.start = p;
          calSt.pickedLabel = U.md(p) + ' · ' + (SB_SET ? (n > 0 ? '第 ' + n + ' 天' : '起始日') : '未设置');
        };
        const drawCal = () => { calBox.innerHTML = LJ.sandboxSetupBody(calSt); };
        if (dayBtn) dayBtn.onclick = () => {
          if (calBox.hidden) { syncPick(); drawCal(); calBox.hidden = false; }
          else calBox.hidden = true;
        };
        if (calBox) calBox.onclick = ev => {
          const nav = ev.target.closest && ev.target.closest('[data-cal-m]');
          if (nav) {
            calSt.view = U.addMonths(calSt.view + '-01', Number(nav.getAttribute('data-cal-m'))).slice(0, 7);
            drawCal();
            return;
          }
          const cell = ev.target.closest && ev.target.closest('[data-cal-d]');
          if (!cell) return;
          SB_PICK = cell.getAttribute('data-cal-d');    // 选中 → 按钮与摘要跟上，日历收起
          syncPick();
          drawCal();
          calBox.hidden = true;
        };
        /* 自动聚焦输入框 —— 但**不许把页面带走**：
           .sheet 是 absolute 定位，会撑大 #screen 的滚动区，直接 focus() 会让
           手机壳整体上滚（实测 scrollTop=369，顶栏与结论被推出视口）。
           所以 preventScroll + 兜底把手机壳滚回 0。 */
        setTimeout(() => {
          try { amt.focus({ preventScroll: true }); }
          catch (e) { try { amt.focus(); } catch (e2) { /* 老浏览器：下面那句兜回来 */ } }
          try {
            const sc = document.querySelector('#screen');
            if (sc && sc.scrollTop) sc.scrollTop = 0;
          } catch (e) { /* 拿不到宿主就算了 */ }
        }, 320);
      }
    });
  };

   /* ---- 030 · 分支行（图下方一条：存为分支 + 已存的分支 chips） ----
      chip 点一下 = 切到那套组合（改道动画复用）；× = 删分支。
      当前买/不买和某条分支完全一致时，那条 chip 高亮（data-sb-active-branch 是证人）。 */
  function sbActiveBranch() {
    const on = SB_DEC.filter(d => d.on).map(d => d.id).sort().join(',');
    for (let i = 0; i < SB_BR.length; i++) {
      if (SB_BR[i].ids.slice().sort().join(',') === on) return SB_BR[i].id;
    }
    return '';
  }
  function sbBranchRowHTML() {
    return '<button class="sb-bsave" data-sb-bsave' + (SB_DEC.length ? '' : ' disabled') + '>' +
      '存为分支</button>' +
      SB_BR.map((b, i) =>
        '<span class="sb-bchip b' + (i % 3) + (b.id === sbActiveBranch() ? ' on' : '') +
        '" data-sb-branch="' + i + '" role="button" tabindex="0">' +
        UI.esc(b.name) +
        '<button class="x" data-sb-bdel="' + i + '" aria-label="删掉这个分支">×</button></span>'
      ).join('');
  }
  function sbBindBranches(el) {
    const save = el.querySelector('[data-sb-bsave]');
    if (save) save.onclick = () => LJ.openBranchSheet(el);
    el.querySelectorAll('[data-sb-branch]').forEach(chip => {
      chip.onclick = ev => {
        if (ev.target && ev.target.getAttribute && ev.target.getAttribute('data-sb-bdel') !== null) return;
        const br = SB_BR[Number(chip.getAttribute('data-sb-branch'))];
        if (!br) return;
        LJ.sandboxBranchApply(br.id);
        sbPaint(el, true);                  // 分支切换 = 换路线，走改道动画
      };
    });
    el.querySelectorAll('[data-sb-bdel]').forEach(b => {
      b.onclick = ev => {
        ev.stopPropagation();
        LJ.sandboxBranchDel(SB_BR[Number(b.getAttribute('data-sb-bdel'))].id);
        sbPaint(el, false);
      };
    });
  }
  /* 「存为分支」弹层：起个名，看一眼存的是哪几笔，确认才落库（029 同款：先看清楚再存）。 */
  LJ.openBranchSheet = function (pageEl) {
    if (!SB_DEC.length) { UI.toast('先加一笔，再存分支'); return; }
    const on = SB_DEC.filter(d => d.on);
    const def = '方案 ' + (SB_BR.length + 1);
    UI.sheet({
      title: '存为分支',
      sub: '把当前这套「买 / 不买」存成一条线，之后一键切回来',
      body: '<div class="sb-rule">' +
        '<div class="sb-rule-line"><span>名字</span>' +
        '<input id="sbbName" type="text" value="' + UI.esc(def) + '" aria-label="分支名字"></div>' +
        '<div class="sb-rule-prev">这套包含：<b>买 ' + on.length + ' 笔 · 不买 ' +
        (SB_DEC.length - on.length) + ' 笔</b></div>' +
        '<button class="btn" data-sbb-ok>存下来</button>' +
        '<button class="btn ghost" data-sbb-no>先不存</button>' +
        '</div>',
      mount(sheet, close) {
        const inp = sheet.querySelector('#sbbName');
        sheet.querySelector('[data-sbb-ok]').onclick = () => {
          const name = String(inp.value || '').trim() || def;
          LJ.sandboxBranchSave(name);
          close();
          sbPaint(pageEl, false);
          UI.toast('已存为「' + name + '」');
        };
        sheet.querySelector('[data-sbb-no]').onclick = close;
        setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (e) { } }, 320);
      }
    });
  };

  /* ---- 030 · 红点详情卡：点图上的红点，卡片贴着点弹出 ----
     卡片内容全部从 data-dot-{i}-* 读（SVG 上的机读契约），
     点卡片外任意处收起；重画会挪点，paint 里先收一次。 */
  function sbDotCardClose(el) {
    const c = el.querySelector('[data-sb-dotcard]');
    if (c) { c.hidden = true; }
    if (sbDotOut) { document.removeEventListener('click', sbDotOut, true); sbDotOut = null; }
  }
  let sbDotOut = null;
  function sbBindDots(el) {
    el.querySelectorAll('.sb-ch-dot').forEach(dot => {
      dot.addEventListener('click', ev => {
        ev.stopPropagation();
        sbDotCard(el, Number(dot.getAttribute('data-dot-i')));
      });
    });
  }
  function sbDotCard(el, i) {
    const card = el.querySelector('[data-sb-dotcard]');
    const svg = el.querySelector('.sb-ch');
    if (!card || !svg) return;
    const id = svg.getAttribute('data-dot-' + i + '-id');
    const day = Number(svg.getAttribute('data-dot-' + i + '-day'));
    const amt = Number(svg.getAttribute('data-dot-' + i + '-amt'));
    const isOn = svg.getAttribute('data-dot-' + i + '-on') === '1';
    const dec = SB_DEC.find(d => d.id === id);
    if (!dec) return;
    card.innerHTML = '<div class="nm">' + UI.esc(dec.name) + '</div>' +
      '<div class="amt">¥' + U.wonInt(amt) + '</div>' +
      '<div class="meta">' + sbDateLabel(day) + ' · ' + (isOn ? '买' : '不买') + '</div>' +
      '<button class="x" data-sb-dotclose aria-label="收起">×</button>';
    card.hidden = false;
    /* 贴着点定位：用 dot 元素的实际屏幕位置换算（cx/cy 是 viewBox 坐标，
       直接用会在缩放时偏）。卡片住在 .sb 根下 → 包含块是 .sb（position:relative），
       所以基准取 .sb 而不是 fig。卡片宽 168px，越界往回收（点在两端时才触发）。 */
    const dot = svg.querySelector('.sb-ch-dot[data-dot-i="' + i + '"]');
    const box = sbRoot(el).getBoundingClientRect();
    const db = dot.getBoundingClientRect();
    const cw = 168;
    let left = db.left - box.left + db.width / 2 - cw / 2;
    left = Math.max(0, Math.min(left, box.width - cw));
    let top = db.top - box.top - 10 - card.offsetHeight;
    if (top < 0) top = db.bottom - box.top + 10;
    card.style.left = Math.round(left) + 'px';
    card.style.top = Math.round(top) + 'px';
    card.querySelector('[data-sb-dotclose]').onclick = ev => {
      ev.stopPropagation();
      sbDotCardClose(el);
    };
    sbDotOut = ev => {
      if (card.contains(ev.target)) return;
      sbDotCardClose(el);
    };
    document.addEventListener('click', sbDotOut, true);
  }

   /* 决策 chip：030 起 .day 显真实日期（M/D）—— 内部仍是相对天数，
      data-day 是给探针/判据读的机读真源（不要从文案里抠数字）。 */
  function sbDateLabel(day) {
    return SB_SET ? U.md(U.addDays(SB_SET.start, day)) : '第 ' + day + ' 天';
  }
  function sbChipsHTML() {
    if (!SB_DEC.length) {
      return '<div class="sb-emptychip">还没有待定的消费 —— 点右下角的 ＋ 加一笔</div>';
    }
    return SB_DEC.map((d, i) =>
      '<div class="sb-chip' + (d.on ? ' on' : '') + '" data-sb-chip="' + i +
      '" data-day="' + d.day + '">' +
      '<span class="nm">' + UI.esc(d.name) + '</span>' +
      '<span class="amt">¥' + U.wonInt(d.amount) + '</span>' +
      '<span class="day">' + sbDateLabel(d.day) + '</span>' +
      '<span class="st">' + (d.on ? '买' : '不买') + '</span>' +
      '<button class="x" data-sb-del="' + i + '" aria-label="删掉这笔">×</button>' +
      '</div>').join('');
  }

  /* 重画：结论 + 航道图 + 分支行 + 决策轨。animate=true 时航线做一次"改道"插值。
     ★ 未设置时整个结构只有设置门 —— paint 直接退出（结构由 render 决定）。 */
  function sbPaint(el, animate) {
    const root = sbRoot(el);
    if (!SB_SET) { root.setAttribute('data-sb-tag', 'setup'); return null; }
    const m = LJ.sandboxModel(SB_DEC);
    m.height = sbChartH();                 // 重画也要用同一个高度（否则改道会把图缩回去）
    const v = LJ.sandboxVerdict(m);
    el.querySelector('[data-sb-head]').textContent = v.head;
    const badge = el.querySelector('[data-sb-badge]');
    badge.textContent = v.badge || '';
    badge.style.display = v.badge ? '' : 'none';
    el.querySelector('[data-sb-note]').textContent = v.note;
    /* 探针证人：这一版落在哪条分支、买了几笔 —— 不必从文案反推。
       写的是 [data-sb] 根（不是 mount 拿到的宿主），见 sbRoot 的说明。 */
    root.setAttribute('data-sb-tag', v.tag);
    root.setAttribute('data-sb-oncount', String(v.stat.onCount));
    root.setAttribute('data-sb-active-branch', sbActiveBranch());

    sbDotCardClose(el);                    // 重画会挪动红点，详情卡先收掉

    const fig = el.querySelector('[data-sb-fig]');
    const old = fig.querySelector('.sb-ch');
    const from = old ? old.getAttribute('data-route') : null;
    fig.innerHTML = UI.chartBranch(m);
    const svg = fig.querySelector('.sb-ch');
    if (svg) {
      if (animate && from) sbReroute(svg, from);
      else svg.setAttribute('data-reroute', '0');
    }
    sbBindDots(el);

    const rail = el.querySelector('[data-sb-chips]');
    rail.innerHTML = sbChipsHTML();
    sbBindChips(el);

    const brRow = el.querySelector('[data-sb-branchrow]');
    if (brRow) { brRow.innerHTML = sbBranchRowHTML(); sbBindBranches(el); }

    const read = el.querySelector('[data-sb-read]');
    read.textContent = '按住图左右拖，看那天还剩多少';
    read.removeAttribute('data-day');
    read.removeAttribute('data-bal');
    return v;
  }

  /* 把一条折线在**固定 x** 上采样成 N 个点。
     ★ 为什么不能直接插值两条折线的原始点：切换"买/不买"会让台阶消失或出现，
       点数就变了（3 点 ↔ 2 点），按点插值只能退化成硬切 —— 而改道正是全片
       唯一的动效高光，不能在最常见的操作上失效。采样到同一条时间轴之后再插值，
       拓扑怎么变都能连上；动画结束再落回那条台阶分明的精确折线。 */
  function sbSample(ptStr, n, geo) {
    const W = 340, PL = geo[0], PR = geo[1];
    const iw = W - PL - PR;
    const pts = String(ptStr).trim().split(/\s+/).map(s => {
      const p = s.split(',');
      return { x: Number(p[0]), y: Number(p[1]) };
    });
    const out = [];
    for (let k = 0; k < n; k++) {
      const x = PL + (k / (n - 1)) * iw;
      let y = pts.length ? pts[pts.length - 1].y : 0;
      for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i], b = pts[i + 1];
        if (b.x === a.x) {                       // 竖直台阶：这条 x 上取台阶之后的值
          if (x >= a.x - 0.001) y = b.y;
          continue;
        }
        if (x >= a.x - 0.001 && x <= b.x + 0.001) {
          const kk = Math.min(1, Math.max(0, (x - a.x) / (b.x - a.x)));
          y = a.y + (b.y - a.y) * kk;
          break;
        }
      }
      out.push({ x: x, y: y });
    }
    return out;
  }

  /* 「改道」：切换买/不买之后，航线从旧路径插到新路径（全片唯一的动效高光）。 */
  function sbReroute(svg, fromStr) {
    const line = svg.querySelector('.sb-ch-route');
    if (!line) return;
    const toStr = line.getAttribute('points');
    const geo = String(svg.getAttribute('data-geo') || '30,30,16,24,200').split(',').map(Number);
    if (sbReduce()) {
      line.setAttribute('points', toStr);
      svg.setAttribute('data-reroute', 'reduce');
      return;
    }
    const N = 48;
    const f = sbSample(fromStr, N, geo);
    const t = sbSample(toStr, N, geo);
    const dur = UI.motion('--dur-fill');
    let done = false;
    const finish = () => { if (done) return; done = true; line.setAttribute('points', toStr); };
    const t0 = performance.now();
    const tick = () => {
      if (done) return;
      const k = Math.min(1, (performance.now() - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      line.setAttribute('points', t.map((p, i) =>
        sbN2(f[i].x + (p.x - f[i].x) * e) + ',' + sbN2(f[i].y + (p.y - f[i].y) * e)).join(' '));
      if (k >= 1) { finish(); return; }
      requestAnimationFrame(tick);
    };
    svg.setAttribute('data-reroute', '1');   // 探针证人：这次真的走了改道动画
    tick();
    /* rAF 在无头/后台标签页会被节流（同 UI.countTo 的兜底）：到点直接落终值 */
    setTimeout(finish, dur + 60);
  }

  /* 决策 chip 的两种手势（027）：**点按 = 切买/不买**，**往上拖到图上 = 改第几天**。
     ★ 迟滞 8px：小抖动仍算点按（跟手滑动那套的 dirLock 一个道理）。
     ★ 落点判据 = 松手时指针真的在图上（拖歪了就原地不动，不改也不切）。
     ★ 拖动过之后要吞掉随后那一下**合成 click**：窗口只留 150ms（够覆盖浏览器
       在 pointerup 之后立刻补的那一下），而且**下一次按下就把窗口清零** ——
       否则"拖完马上点一下"会被误吞（自测时撞到过）。 */
  let SB_NO_TAP_UNTIL = 0;
  const SB_TAP_SWALLOW_MS = 150;
  function sbBindDrag(el) {
    el.querySelectorAll('[data-sb-chip]').forEach(chip => {
      let st0 = null, dragging = false, idx = 0, ghost = null, lastDay = null;
      const clean = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onCancel);
        chip.classList.remove('dragging');
        if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
        ghost = null;
        sbDropGuide(el, null);
      };
      const onMove = ev => {
        if (!st0) return;
        if (!dragging) {
          const dist = Math.abs(ev.clientX - st0.x) + Math.abs(ev.clientY - st0.y);
          if (dist < 8) return;                 // 迟滞：还不够格算拖动
          dragging = true;
          SB_NO_TAP_UNTIL = Date.now() + SB_TAP_SWALLOW_MS;
          chip.classList.add('dragging');
          ghost = document.createElement('div');
          ghost.className = 'sb-dragghost';
          const nm = chip.querySelector('.nm'), am = chip.querySelector('.amt');
          ghost.innerHTML = '<span>' + (nm ? nm.textContent : '') + '</span>' +
            '<b>' + (am ? am.textContent : '') + '</b><i class="d">拖到图上</i>';
          el.appendChild(ghost);
        }
        if (ghost) {
          ghost.style.transform = 'translate(' + (ev.clientX - st0.ox) + 'px,' +
            (ev.clientY - st0.oy) + 'px)';
        }
        /* 落点判据横纵都要看 —— 只传 x 的话，在决策轨里横向滑动也会"顺手"改天 */
        const t = sbDayAt(el, ev.clientX, ev.clientY);
        lastDay = t && t.inside ? t.day : null;
        const d = ghost && ghost.querySelector('.d');
        if (d) d.textContent = lastDay === null ? '拖到图上' : sbDateLabel(lastDay);
        sbDropGuide(el, lastDay);
      };
      const onUp = ev => {
        const was = dragging;
        clean();
        st0 = null;
        dragging = false;
        if (!was) return;                       // 没拖动 → 交给 click（切买/不买）
        SB_NO_TAP_UNTIL = Date.now() + SB_TAP_SWALLOW_MS;
        if (lastDay === null) return;           // 没落在图上 → 原地不动
        if (SB_DEC[idx] && SB_DEC[idx].day !== lastDay) {
          SB_DEC[idx].day = lastDay;
          /* 探针证人：这次落点真的改了第几天（值就是落点）—— 写在 [data-sb] 根上 */
          const root = sbRoot(el);
          root.setAttribute('data-sb-drag', 'day');
          root.setAttribute('data-sb-drag-day', String(lastDay));
          sbPaint(el, true);
        }
        lastDay = null;
      };
      const onCancel = () => { clean(); st0 = null; dragging = false; lastDay = null; };
      chip.addEventListener('pointerdown', ev => {
        const tg = ev.target;
        if (tg && tg.getAttribute && tg.getAttribute('data-sb-del') !== null) return;
        SB_NO_TAP_UNTIL = 0;                    // 新的一次按下：清掉上一次拖动的吞点窗口
        idx = Number(chip.getAttribute('data-sb-chip'));
        const r = chip.getBoundingClientRect();
        st0 = {
          x: ev.clientX, y: ev.clientY,
          ox: ev.clientX - r.left, oy: ev.clientY - r.top
        };
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onCancel);
      });
    });
  }

  function sbBindChips(el) {
    el.querySelectorAll('[data-sb-chip]').forEach(c => {
      c.onclick = ev => {
        if (Date.now() < SB_NO_TAP_UNTIL) return;   // 刚拖过：这一下 click 是拖动的尾巴
        const t = ev.target;
        if (t && t.getAttribute && t.getAttribute('data-sb-del') !== null) return;
        const i = Number(c.getAttribute('data-sb-chip'));
        if (!SB_DEC[i]) return;
        SB_DEC[i].on = !SB_DEC[i].on;          // 买 ⇄ 不买 = 换一条路走
        sbPaint(el, true);
      };
    });
    el.querySelectorAll('[data-sb-del]').forEach(b => {
      b.onclick = ev => {
        ev.stopPropagation();
        SB_DEC.splice(Number(b.getAttribute('data-sb-del')), 1);
        sbPaint(el, false);
      };
    });
    sbBindDrag(el);
  }

  /* 屏幕 x → 「第几天」：游标读数与拖拽落点**共用这一份换算**（一个真源）。
     返回 { day, inside, ... }：inside = 松手时指针真的在图上 ——
     ★ 横纵都要看：只看 x 的话，在决策轨里横向滑动也会"顺手"改了第几天。 */
  function sbDayAt(el, clientX, clientY) {
    const fig = el.querySelector('[data-sb-fig]');
    const svg = fig && fig.querySelector('.sb-ch');
    if (!svg) return null;
    const r = svg.getBoundingClientRect();
    if (!(r.width > 0)) return null;
    const geo = String(svg.getAttribute('data-geo') || '30,30,16,24,200').split(',').map(Number);
    const PL = geo[0], PR = geo[1], W = 340;
    const st = LJ.engine.sandbox.math(LJ.sandboxModel(SB_DEC));
    const vx = (clientX - r.left) / r.width * W;              // 屏幕 x → viewBox x
    let inside = clientX >= r.left && clientX <= r.right;
    if (inside && typeof clientY === 'number') {
      const fr = fig.getBoundingClientRect();
      /* 上方留 70px 余量：手指按在 chip 上、落点在图上时，指针往往还在图的下沿附近 */
      inside = clientY >= fr.top - 70 && clientY <= fr.bottom + 8;
    }
    return {
      day: U.clamp(Math.round((vx - PL) / (W - PL - PR) * st.days), 0, st.days),
      inside: inside,
      r: r, geo: geo, st: st
    };
  }

  /* 游标：指到图上哪一天，就读那天的余额 —— 图上那句话当场可被验证。
     公式走 engine.sandbox.balanceAt（和结论、图共用一份），页面不自己算。
     030-r2（用户）：读数拆开各归其位 —— **日期**贴在轴那行、跟着游标 x 走；
     **余额**贴在游标点旁边。旧版把两者塞在图下方左下角一行。
     `.sb-read` 行退回静态提示，但 data-day/data-bal 机读证人继续写在它身上
     （探针读的就是这两条，不动契约）。 */
  function sbBindScrub(el) {
    const fig = el.querySelector('[data-sb-fig]');
    const read = el.querySelector('[data-sb-read]');
    if (!fig || !read) return;                // 设置门：没有图也没有读数行
    let down = false;
    const at = clientX => {
      const t = sbDayAt(el, clientX);
      if (!t) return;
      const PL = t.geo[0], PT = t.geo[2], PB = t.geo[3], H = t.geo[4];
      const m = LJ.sandboxModel(SB_DEC);
      const bal = LJ.engine.sandbox.balanceAt(m, t.day);
      /* 机读证人留在 read 上（判据读它），可见文案进图 */
      read.setAttribute('data-day', String(t.day));
      read.setAttribute('data-bal', String(Math.round(bal)));
      const ih = H - PT - PB;
      const svg = fig.querySelector('.sb-ch');
      /* ★ 030-r2 截图逮到的存量缺陷（027 起）：图的比例尺**封顶过**
         （超预算 >45% 时 yBot 从 -800 提到 -450，见 data-ymin），
         而这里原来拿 st.yBot=-800 自己算 —— 两把尺子，¥0 的点浮在零线上方
         45px 处（游标点脱离航线）。修法：读图写下的 data-ymin，
         和画线用的 Y() 是同一只尺（尺子只许一份，023 的老教训）。 */
      const yTop = Math.max(t.st.rem, 1);
      const yBot = svg ? Math.min(0, Number(svg.getAttribute('data-ymin')) || 0)
        : Math.min(0, t.st.yBot);
      const span = Math.max(yTop - yBot, 1);
      const y = sbN2(PT + ((yTop - U.clamp(bal, yBot, yTop)) / span) * ih);
      const cur = svg && svg.querySelector('.sb-ch-cursor');
      const dot = svg && svg.querySelector('.sb-ch-cdot');
      const cdate = svg && svg.querySelector('.sb-ch-cdate');
      const cbal = svg && svg.querySelector('.sb-ch-cbal');
      const curX = sbN2(PL + (t.day / t.st.days) * (340 - PL - t.geo[1]));
      if (cur) {
        cur.setAttribute('x1', curX);
        cur.setAttribute('x2', curX);
        cur.style.display = '';
      }
      if (dot) { dot.setAttribute('cx', curX); dot.setAttribute('cy', y); dot.style.display = ''; }
      /* 日期：轴那行（H-5 与轴标签同高），x 跟随游标；边缘防溢出画布 */
      if (cdate) {
        cdate.setAttribute('x', String(U.clamp(curX, PL + 16, 340 - PL - 16)));
        cdate.textContent = sbDateLabel(t.day);
        cdate.style.display = '';
      }
      /* 余额：贴游标点；靠右改挂左侧、贴顶改挂下方，始终不出画布 */
      if (cbal) {
        const rightEdge = 340 - t.geo[1];          // 图右缘的 x（viewBox 坐标）
        const nearRight = curX > rightEdge - 56;   // 56 ≈ 最长读数「超 ¥12,345」宽
        cbal.setAttribute('x', String(sbN2(nearRight ? curX - 8 : curX + 8)));
        cbal.setAttribute('text-anchor', nearRight ? 'end' : 'start');
        const nearTop = y - 7 < PT + 9;
        cbal.setAttribute('y', String(sbN2(nearTop ? y + 14 : y - 7)));
        cbal.textContent = bal < 0
          ? '超 ¥' + U.wonInt(Math.abs(bal))
          : '¥' + U.wonInt(bal);
        cbal.style.display = '';
      }
    };
    fig.addEventListener('pointerdown', ev => { down = true; at(ev.clientX); });
    fig.addEventListener('pointermove', ev => { if (down) at(ev.clientX); });
    fig.addEventListener('pointerup', () => { down = false; });
    fig.addEventListener('pointercancel', () => { down = false; });
    fig.addEventListener('pointerleave', () => { down = false; });
  }

  /* 拖拽落点参考线：拖决策 chip 时在图上指出"会落在第几天" */
  function sbDropGuide(el, day) {
    const svg = el.querySelector('[data-sb-fig] .sb-ch');
    if (!svg) return;
    const line = svg.querySelector('.sb-ch-drop');
    const txt = svg.querySelector('.sb-ch-dropt');
    if (!line || !txt) return;
    if (day === null || day === undefined) {
      line.style.display = 'none';
      txt.style.display = 'none';
      return;
    }
    const geo = String(svg.getAttribute('data-geo') || '30,30,16,24,200').split(',').map(Number);
    const x = sbN2(geo[0] + (day / Math.max(1, Number(svg.getAttribute('data-days')) || 1)) *
      (340 - geo[0] - geo[1]));
    line.setAttribute('x1', x);
    line.setAttribute('x2', x);
    line.style.display = '';
    txt.setAttribute('x', U.clamp(x, geo[0] + 22, 340 - geo[1] - 22));
    txt.textContent = sbDateLabel(day);
    txt.style.display = '';
  }

  /* 「加进推演」：金额 + 日期 → 一根决策 chip（默认买 = 走那个台阶）。
     028：输入在底部抽屉里 —— pageEl 是页面宿主（重画用），box 是抽屉（读输入用）；
     成功加进去就把抽屉收起来，让图上的新分支当场露出来。
     030-r2：日期来自日历选中（SB_PICK），内部换算成相对天数存进 SB_DEC。 */
  function sbAdd(pageEl, box, close) {
    const inp = box.querySelector('#ssAmt');
    const amt = Math.round(Number(String(inp.value).replace(/[^0-9.]/g, '')) || 0);
    if (!(amt > 0)) { UI.toast('先填一个金额'); try { inp.focus(); } catch (e) {} return; }
    const st = LJ.engine.sandbox.math(LJ.sandboxModel(SB_DEC));
    const day = U.clamp(U.diffDays(SB_SET.start, sbPickDay()), 0, st.days);
    SB_SEQ++;
    SB_DEC.push({ id: 'd' + SB_SEQ, name: '消费 ' + SB_SEQ, amount: amt, day: day, on: true });
    inp.value = '';
    sbPaint(pageEl, true);
    if (close) close();
  }

  /* 「就这样定了」那版已经退役：它自动拟一条规则、点完只有一个 toast。
     029 起出口拆成两条时间轴（见页面 .sb-exits 与 LJ.openRuleSheet）：
       已经花了 → 记一笔（事后记账）；想留个规矩 → 记成下期约定（事前承诺，先预览再落库）。 */

  function sbMount(el, ctx) {
    /* 空值安全绑定：设置门（未就绪）状态下没有 fig/rail/出口/圆点 ——
       每个选择器都要问一句在不在，否则 mount 当场抛错、整页黑屏。 */
    const on = (sel, fn) => { const n = el.querySelector(sel); if (n) n.onclick = fn; };
    on('[data-sb-back]', () => {
      if (LJ.router.stack.length > 1) LJ.router.pop();
      else LJ.router.reset('youth.home');
    });
    on('[data-sb-reset]', () => {
      LJ.sandboxReset();
      UI.toast('清空了，重新推一遍');
      /* 清空会把设置一起抹掉 → 页面结构从"有图"变回"设置门"，必须整页重画，
         只 sbPaint 的话 DOM 里还留着旧图（假绿现场）。 */
      LJ.router.refreshTop();
    });
    /* ⚙ 设置（顶栏与设置门两处入口都开同一张弹层） */
    el.querySelectorAll('[data-sb-setup], [data-sb-setupgo]').forEach(b => {
      b.onclick = () => LJ.openSetupSheet(el, ctx);
    });
    /* 030 · 智能建议占位：只 toast，不接任何业务（预留位置的判据） */
    on('[data-sb-advice]', () => UI.toast('智能建议接入大模型后可用'));
    /* 028：输入区搬进了底部抽屉（见 LJ.openSandboxDrawer），页面上只留右下角圆点；
       029：两个出口搬回页面，按时间轴分流 —— 记一笔（事后）/ 记成下期约定（事前，可改门槛）。 */
    on('[data-sb-fab]', () => LJ.openSandboxDrawer(el, ctx));
    on('[data-sb-entry]', () => { if (LJ.openEntrySheet) LJ.openEntrySheet(); });
    on('[data-sb-rule]', () => LJ.openRuleSheet(el, ctx));
    sbBindChips(el);
    sbBindScrub(el);
    sbBindDots(el);
    sbBindBranches(el);

    /* 034 · 沙盘引导（coach marks）：错开入场生长动画再开（700ms 后聚光灯才量得稳）。
       只在「裸开 index.html 且首次进入」自动弹 —— 带参数的链接（测试/截图）一律不弹，
       ?sbg=1 强制弹；门态/图态各弹一次，判据在 LJ.sbGuide 里。 */
    setTimeout(() => { try { if (LJ.sbGuide) LJ.sbGuide(); } catch (e) { } }, 700);

    /* 入场：航线从左向右生长一次（stroke-dashoffset），其余一切安静 */
    const line = el.querySelector('.sb-ch-route');
    if (line && !sbReduce() && line.getTotalLength) {
      try {
        const L = line.getTotalLength();
        if (L > 0) {
          const dur = UI.motion('--dur-fill');
          line.style.strokeDasharray = L + ' ' + L;
          line.style.strokeDashoffset = String(L);
          requestAnimationFrame(() => {
            line.style.transition = 'stroke-dashoffset ' + dur + 'ms ' + UI.ease('--ease-out');
            line.style.strokeDashoffset = '0';
          });
          setTimeout(() => {
            line.style.strokeDasharray = '';
            line.style.strokeDashoffset = '';
            line.style.transition = '';
          }, dur + 140);
          sbRoot(el).setAttribute('data-sb-grow', '1');   // 探针证人：入场生长跑过
        }
      } catch (e) { /* 量不到长度就直接呈现终态 */ }
    }
  }

  P['youth.sandbox'] = {
    /* chrome:'full' = 整屏沉浸（顶栏收起，返回键在页内）。
       dark:true = 复用 016 为记账小票长出来的**整机深色**（#screen.dark + .layer-dark）——
       不另起一套"深色舞台"配色：全 app 只留一份深色真源。 */
    title: '沙盘推演', chrome: 'full', dark: true,   /* 035 统名：原「推演」——目录/首页按钮都叫沙盘推演 */
    render(ctx) {
      /* 顶栏：030 起「重来」纯文字按钮换成图标（⚙ 设置 + ↺ 重来），
         aria-label 保留给读屏与判据。 */
      const top = '<div class="sb-top">' +
        '<button class="sb-back" data-sb-back aria-label="返回">' + UI.icon('back', 20) + '</button>' +
        '<div class="sb-top-t">沙盘推演</div>' +   /* 035 统名：与目录/首页按钮同叫法（原「推演」） */
        '<button class="sb-ic" data-sb-setup aria-label="推演设置">' + UI.icon('set', 18) + '</button>' +
        '<button class="sb-ic" data-sb-reset aria-label="重来">' + UI.icon('reset', 18) + '</button>' +
        '</div>';

      /* ---- 未设置 = 设置门：不画图、不给假数据，先把边界定了才推演 ---- */
      if (!SB_SET) {
        return '<div class="sb" data-sb data-sb-ready="0" data-sb-tag="setup">' + top +
          '<div class="sb-gate">' +
          '<div class="sb-eye">开始之前</div>' +
          '<div class="sb-head">先定这轮推演的边界</div>' +
          '<div class="sb-note">起止日期、起始金额、每天基本开支 —— 四件事都由你填，图只负责画出来。</div>' +
          '<button class="btn sb-setgo" data-sb-setupgo>设置起止日期</button>' +
          '<div class="sb-note sb-gatenote">设置好之后，随时点右上角 ⚙ 修改</div>' +
          '</div>' +
          '</div>';
      }

      const m = LJ.sandboxModel(SB_DEC);
      m.height = sbChartH();                 // 028：图吃掉剩余空间（用户：放大折线图的占比）
      const v = LJ.sandboxVerdict(m);
      return '<div class="sb" data-sb data-sb-ready="1" data-sb-tag="' + v.tag +
        '" data-sb-oncount="' + v.stat.onCount + '" data-sb-active-branch="' + sbActiveBranch() + '">' +
        top +
        '<div class="sb-verdict">' +
        '<div class="sb-eye">按这个选法</div>' +
        '<div class="sb-head" data-sb-head>' + UI.esc(v.head) + '</div>' +
        '<div class="sb-badge" data-sb-badge>' + UI.esc(v.badge || '') + '</div>' +
        '<div class="sb-note" data-sb-note>' + UI.esc(v.note) + '</div>' +
        /* 030 · 智能建议占位：用户拍板「先不要做出功能，但要预留出位置」——
           固定高度一行，点击只 toast，等接大模型时版面不挪位。 */
        '<button class="sb-advice" data-sb-advice>' +
        '<i>✦</i><span>智能建议</span><em>接入大模型后可用</em></button>' +
        '</div>' +
        '<div class="sb-fig" data-sb-fig>' + UI.chartBranch(m) + '</div>' +
        /* 红点详情卡住在 fig **外面**（.sb 根下，.sb 是定位父级）：
           sbPaint 每次重画都整块换掉 fig.innerHTML —— 卡片放里面会被抹掉，
           下一次点红点就弹不出来（施工时踩过，挪出来才活）。 */
        '<div class="sb-dotcard" data-sb-dotcard hidden></div>' +
        '<div class="sb-read" data-sb-read>按住图左右拖，看那天还剩多少</div>' +
        '<div class="sb-legend">' +
        '<span class="sb-k"><i class="k-route"></i>你选的路</span>' +
        '<span class="sb-k"><i class="k-step"></i>要买的</span>' +
        '<span class="sb-k"><i class="k-ghost"></i>放弃的路</span>' +
        '<span class="sb-k"><i class="k-pace"></i>每天基本开支</span>' +
        '</div>' +
        /* 029 · 出口按**时间轴**分成两条路（用户口径：原来两个出口挤在抽屉里分不清）：
           已经花了 → 记一笔（事后）；想留个规矩 → 记成下期约定（事前，先预览再落库） */
        '<div class="sb-exits">' +
        '<span class="q">这笔已经花了？</span>' +
        '<button class="ex" data-sb-entry>记一笔</button>' +
        '<span class="q">想留个规矩？</span>' +
        '<button class="ex" data-sb-rule>记成下期约定</button>' +
        '</div>' +
        /* 030 · 分支行：存为分支 + 已存方案（点 = 换路线，× = 删） */
        '<div class="sb-branchrow" data-sb-branchrow>' + sbBranchRowHTML() + '</div>' +
        '<div class="sb-rail" data-sb-chips>' + sbChipsHTML() + '</div>' +
        '<button class="sb-fab" data-sb-fab aria-label="加一笔待定的消费">' +
        UI.icon('plus', 26) + '</button>' +
        '</div>';
    },
    mount(el, ctx) { sbMount(el, ctx); }
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
      input.style.color = '#0E9F55';            /* 036 · 默认支出模式 → 敲进去的数字是绿的 */
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
          /* 036 · 红进绿出：输入框里敲的数字跟着方向走（支出=绿、收入=红） */
          input.style.color = mode === 'in' ? '#E40101' : '#0E9F55';
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
          const what = isIn ? rec.title : LJ.catById(rec.category).name;
          /* 016 · 记完给一个「看小票打印」的选项：先按原路收起记账界面
             （弹层/整页退场约 360ms，别让选择框压在正在关的弹层上），
             再问去不去看小票 —— 两条路都收界面，区别只在去不去小票页。
             跳转必须走 LJ.router.push：openEntrySheet 的壳 ctx.go 是空操作。 */
          ctx.back();
          setTimeout(function () {
            UI.confirm({
              title: '已记入账本',
              desc: what + ' · ¥' + U.won(rec.amount) +
                (special && !isIn ? ' · 记入专项' : ''),
              okText: '看小票打印',
              cancelText: '完成',
              onOk() {
                try { LJ.router.push('youth.receipt', { id: rec.id }); } catch (e2) { }
              }
            });
          }, 380);
        } catch (e) { UI.toast(e.message); }
      };
      paintFund();
    }
  };

  /* ============================================================
     记账小票（016）—— 记完一笔的「观看动画」去处
     ------------------------------------------------------------
     参考图：黑底 + 银色出票口 + 白色锯齿边小票从出票口**向下慢慢打印**。
     ★ 数据全走 entry.get(id)：这是一张**真账单**的小票，打印出来什么
       就是记了什么；不带 id（深链/截图）取最新一笔，显式 id 无效才空态。
     ★ 条码由 id 决定性生成（不用随机数 —— 探针断言要可复现）。
     ★ dark:true：整机切深色（#screen.dark 的样式 016 第一次真的长出来），
       同时 syncChrome 会把右下角浮标藏掉，黑底上不压亮色按钮。 */
  /* ============================================================
     020 · 小票票面共享件（打印页与账单详情抽屉**同一套**样式）
     ------------------------------------------------------------
     用户：抽屉样式太丑，「拉开之后里面是打印出来的小票」——
     要保证"和打印小票一样"，唯一可靠的办法是同一段生成代码，
     不是抄一份 CSS（抄了就会漂）。
       receiptPaper(e, opt)：.rcpt 票盒内的全部内容（品牌行 → 感谢行）
         opt.stamp === false 才不带「已支付」印章（默认带：打印页与抽屉都要）
         opt.extraRows：[[标签, 值], …] 追加在「资金」行后（抽屉的 来源/备注）
       receiptTeeth()：撕票线 path（20 颗三角牙、贯穿整宽、票盒外那条）
     ============================================================ */
  /* ============================================================
     023 · 「这笔账落在哪张卡上」的唯一口径
     ------------------------------------------------------------
     一笔账属于哪张卡不是 entry 上的字段，而是由角色映射算出来的：
     api.card.cardOf(e)（收入按资金来源进 支持金卡 / 自有资金卡，支出一律走日常扣款卡）。
     这和「我的」页卡组、卡片详情「这张卡上的账」是**同一套切法** ——
     三处不许各算各的，否则票面标的卡和卡片详情里的账会对不上。
     票面（打印页 + 账单详情抽屉）、账单详情页、流水按卡筛选都调它。
     ============================================================ */
  LJ.cardOfEntry = function (e, api) {
    try {
      const a = api || (LJ.api && LJ.api.self ? LJ.api.self() : null);
      if (!a || !a.card) return null;
      const id = a.card.cardOf(e);
      return id ? a.card.get(id) : null;
    } catch (err) { return null; }
  };
  /** 「城市卡 · 上海 ••3087」；取不到卡返回空串（调用方自己决定显不显示这一行） */
  LJ.entryCardLabel = function (e, api) {
    const c = LJ.cardOfEntry(e, api);
    return c ? c.name + ' ••' + c.tail : '';
  };

  LJ.receiptPaper = function (e, opt) {
    opt = opt || {};
    const isIn = e.direction === 'in';
    const cat = isIn ? { name: e.title || '收入', icon: '💰' } : LJ.catById(e.category);
    const fund = isIn
      ? (e.fundingSource === 'family' ? '家庭支持' : '个人自有')
      : (e.fundingSource === 'own' ? '自有资金' : '家庭支持');
    /* 023 · 票面标卡（用户：详细账单上要说明是哪张银行卡付的钱，打印小票处同步添加）——
       写在共享票面里，打印页与账单详情抽屉自动同款；取不到卡就不加这一行。 */
    const cardNm = LJ.entryCardLabel(e, opt.api);
    const row = (k, v) => '<div class="rc-row"><span>' + k + '</span>' +
      '<b>' + UI.esc(String(v)) + '</b></div>';
    /* 条码：id 决定性生成的粗细序列（40 根，够像、且每次一样） */
    let bars = '';
    const seedStr = String(e.id) || 'linjie';
    for (let i = 0; i < 40; i++) {
      const h = seedStr.charCodeAt(i % seedStr.length) + i * 13;
      bars += '<i style="width:' + (h % 4 === 0 ? 3 : h % 4 === 1 ? 1 : 2) + 'px"></i>';
    }
    let extra = '';
    (opt.extraRows || []).forEach(pr => { extra += row(pr[0], pr[1]); });
    /* 021 · 圆形双圈印章（用户参考图：圆章 + 上弧品牌/下弧单号 + 中央 PAID
       + 小字日期，盖在右下偏中压着明细行与 TOTAL —— 替代 016 的右上角方章）。
       弧字用 textPath：上弧基线 r39（字朝外长到 46 贴外圈）、下弧基线 r43
       （朝内长到 37 贴内圈）—— 两条弧都落在双圈之间的环带里。 */
    const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dp = String(e.date).split('-');
    const dstr = dp.length === 3
      ? (Number(dp[2]) + ' ' + (MON[Number(dp[1]) - 1] || '') + ' ' + dp[0])
      : String(e.date);
    const stampSvg =
      '<svg viewBox="0 0 100 100">' +
      '<circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="2.4"/>' +
      '<circle cx="50" cy="50" r="36.5" fill="none" stroke="currentColor" stroke-width="1.1"/>' +
      '<path id="rcSpT" d="M 11,50 A 39,39 0 0 1 89,50" fill="none"/>' +
      '<path id="rcSpB" d="M 7,50 A 43,43 0 0 0 93,50" fill="none"/>' +
      '<text class="st-arc"><textPath href="#rcSpT" startOffset="50%" text-anchor="middle">' +
      '临界 · LINJIE</textPath></text>' +
      '<text class="st-arc"><textPath href="#rcSpB" startOffset="50%" text-anchor="middle">' +
      '· ' + UI.esc(String(e.id)) + ' ·</textPath></text>' +
      '<text class="st-c" x="50" y="51">PAID</text>' +
      '<text class="st-d" x="50" y="64">' + dstr + '</text>' +
      '</svg>';
    return '<div class="rc-brand">临界</div>' +
      '<div class="rc-kind">' + (isIn ? '收入' : '消费') + '小票 · RECEIPT</div>' +
      '<div class="rc-dash"></div>' +
      row('商户 MERCHANT', e.merchant || cat.name) +
      row('日期 DATE', e.date) +
      row('分类 CATEGORY', (cat.icon || '') + ' ' + cat.name) +
      row('资金 FUNDS', fund) +
      (cardNm ? row('银行卡 CARD', cardNm) : '') + extra +
      '<div class="rc-dash"></div>' +
      '<div class="rc-total ' + (isIn ? 'in' : 'out') + '"><span>' + (isIn ? '收入' : '支出') + '</span>' +
      '<b>¥' + U.won(e.amount) + '</b></div>' +
      '<div class="rc-paid">已记入账本 · RECORDED' +
      /* 印章：016 方章（右上角）→ 021 圆章（右下偏中，见 stampSvg 注释）。
         机制不变 —— 打印完成/抽屉打开时 mount 加 .on 按下去（放大→压实→回弹）。 */
      (opt.stamp === false ? '' :
        '<span class="rc-stamp" data-rc-stamp aria-hidden="true">' + stampSvg + '</span>') +
      '</div>' +
      '<div class="rc-dash"></div>' +
      '<div class="rc-bar">' + bars + '</div>' +
      '<div class="rc-no">' + UI.esc(String(e.id)) + '</div>' +
      '<div class="rc-thanks">一笔一票，账本自己会说话。</div>';
  };
  /* 撕票线：20 颗三角牙、贯穿整宽（viewBox 240×10 横向铺满）。
     ★ 三轮修正：SVG 必须放在**票盒外面**、和票一起动 —— 放在 .rcpt 里，
     透明三角后面是小票自己的白底，白对白根本看不见棱角；
     且被 padding 截成不贯穿的短条。 */
  LJ.receiptTeeth = function () {
    let teeth = 'M0 0';
    for (let k = 0; k < 20; k++) teeth += ' L' + (k * 12 + 6) + ' 10 L' + ((k + 1) * 12) + ' 0';
    return teeth + ' Z';
  };

  P['youth.receipt'] = {
    title: '记账小票', chrome: 'plain', dark: true,
    render(ctx) {
      const api = ctx.api;
      const e = ctx.params.id ? api.entry.get(ctx.params.id) : (api.entry.list({})[0] || null);
      if (!e) {
        return '<div class="rcpt-dark rcpt-empty">' +
          UI.empty('🧾', '小票不在了', '这笔账单可能已经被删除。') + '</div>';
      }

      return '<div class="rcpt-dark">' +
        '<div class="rc-printer"><span class="rc-logo">临界</span><i class="rc-led"></i></div>' +
        '<div class="rc-path"><div class="rc-slide">' +
        '<div class="rcpt" data-rcpt>' + LJ.receiptPaper(e, { stamp: true }) + '</div>' +
        '<svg class="rc-tk" viewBox="0 0 240 10" preserveAspectRatio="none">' +
        '<path d="' + LJ.receiptTeeth() + '" fill="#FDFDFB"/></svg>' +
        '</div></div>' +
        /* 六轮 · 底部按钮：进页即在的液态分裂结构 ——
           打印中 = 一枚 216 长条（两 blob 首尾相接 + goo 焊成一体 + hairline 描边），
           打印完成 = 从中间液态分裂成左「再次打印」(打印机图标) / 右「结束」。
           分裂与换态只由 mount 加 .split 类驱动，DOM 首帧全在场（五轮规矩沿用）。 */
        '<div class="rc-cta" data-rc-cta>' +
        '<svg width="0" height="0" aria-hidden="true" style="position:absolute;top:0;left:0"><defs>' +
        /* goo 滤镜：模糊 + alpha 阈值 → 两 blob 分离时缝隙先拉出液态细桥再断；
           最后 feComposite atop 把原始锐利 blob 盖回表面，只有桥是流体。
           color-interpolation-filters=sRGB（默认线性空间会让深灰洗成灰白）。 */
        '<filter id="rcGoo" x="-20%" y="-60%" width="140%" height="220%" color-interpolation-filters="sRGB">' +
        '<feGaussianBlur in="SourceGraphic" stdDeviation="6" result="b"/>' +
        '<feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10" result="g"/>' +
        '<feComposite in="SourceGraphic" in2="g" operator="atop"/>' +
        '</filter></defs></svg>' +
        '<span class="rc-goo" aria-hidden="true"><i class="rc-bg bg1"></i><i class="rc-bg bg2"></i></span>' +
        '<span class="rc-hair" aria-hidden="true"></span>' +
        '<span class="rc-l rc-l1">打印中……</span>' +
        '<button class="rc-side s1" data-rc-again disabled>' +
        UI.icon('printer', 15, 'rc-ic') + '再次打印</button>' +
        '<button class="rc-side s2" data-rc-end disabled>结束</button>' +
        '</div>' +
        '</div>';
    },
    mount(el, ctx) {
      const cta = el.querySelector('[data-rc-cta]');
      if (!cta) return;                       /* 空态分支没有按钮 */
      const again = cta.querySelector('[data-rc-again]');
      const endBtn = cta.querySelector('[data-rc-end]');
      const stamp = el.querySelector('[data-rc-stamp]');
      const slide = el.querySelector('.rc-slide');
      /* 动画 2.6s（CSS rcPrint）→ 2700ms 盖章 → 2920ms 液态分裂；减弱动效直接终态。
         时序：印章先按下去（完成的记号），长条随即裂开 —— 两拍比同拍更有戏。 */
      const reduce = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
      let t1 = null, t2 = null;
      function arm() {
        t1 = setTimeout(function () {
          if (stamp) stamp.classList.add('on');
        }, reduce ? 0 : 2700);
        t2 = setTimeout(function () {
          cta.classList.add('split');
          again.disabled = false;
          endBtn.disabled = false;
        }, reduce ? 0 : 2920);
      }
      /* 再次打印：液态合回长条 → 纸退回出票口重放 rcPrint → 再盖章 → 再分裂。
         animation 重启靠 none→reflow→清空三步（直接改时长不会重放）。 */
      function replay() {
        clearTimeout(t1); clearTimeout(t2);
        cta.classList.remove('split');
        if (stamp) stamp.classList.remove('on');
        again.disabled = true; endBtn.disabled = true;
        if (slide) {
          slide.style.animation = 'none';
          void slide.offsetWidth;
          slide.style.animation = '';
        }
        arm();
      }
      again.onclick = () => { if (!again.disabled) replay(); };
      endBtn.onclick = () => {
        if (endBtn.disabled) return;
        if (LJ.router.stack.length > 1) LJ.router.pop();
        else LJ.router.reset(LJ.ROOT[LJ.session.get().role]);
      };
      arm();
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
        '<div style="font-size:28px' + (isIn ? ';color:#E40101' : '') + '">' + (isIn ? '↓' : c.icon) + '</div>' +
        '<div class="big-num ' + (isIn ? 'v-in' : 'v-out') + '" style="font-size:36px;margin-top:10px">' + (isIn ? '+' : '−') + U.won(e.amount) + '</div>' +
        '<div class="sm muted mt8" style="margin-top:6px">' + UI.esc(e.merchant || e.title || c.name) + '</div>' +
        '</div>' +
        '<div class="list mt16">' +
        row('类型', isIn ? '入账' : '支出') +
        row('大类', isIn ? '—' : c.name) +
        row('资金来源', e.fundingSource === 'family' ? '家庭支持金' : '个人自有资金') +
        /* 023 · 详细账单标出这笔钱是哪张卡收付的（用户点名要）——
           口径与票面、卡片详情一致：LJ.cardOfEntry / api.card.cardOf。 */
        row('银行卡', LJ.entryCardLabel(e, ctx.api) || '—') +
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

  /* ============================================================
     018 · 账单详情抽屉（用户拍板：点流水账单从底部出来，
     动画与记账弹层同源 —— 同一条 UI.sheet 路径：抓手 + 下拉关闭 + 遮罩点击）
     ------------------------------------------------------------
     头行照参考图：标题左 + 「编辑」胶囊右（铅笔 = compose 图标）；
     编辑 → 关本抽屉 → 180ms 后接力进编辑弹层（与「已经花了？记一笔」
     同款的 close→接力，不让两层弹层叠着）。
     020 · 票面改版（用户：样式太丑，拉开后里面就该是打印出来的小票）：
       深色台面（#0B0B0D，与打印页同底）+ 276 票道（与 .rc-path 同宽同
       内边距 → 票宽同为 236）+ LJ.receiptPaper 共享票面 + 上下两道撕票
       齿线（上齿翻转）；来源/备注作为 extraRows 并进票面行。
       印章 420ms 后压下 —— 打印流程是 2700ms（有打印过程才等得），
       抽屉没有打印过程，短一点才有"刚打出来就给你看"的即时感。
     youth.entryDetail 页面保留：深链 ?p= 与探针还在用它。
     ============================================================ */
  LJ.openEntryDetailSheet = function (ctx, id) {
    const e = ctx.api.entry.get(id);
    if (!e) return;
    const src = { manual: '手动记录', seed: '历史数据', support: '支持对账', import: '账单导入' }[e.source] || e.source || '—';
    const teeth = LJ.receiptTeeth();
    const tkSvg = cls => '<svg class="rc-tk' + cls + '" viewBox="0 0 240 10" ' +
      'preserveAspectRatio="none"><path d="' + teeth + '" fill="#FDFDFB"/></svg>';
    UI.sheet({
      head: '<div class="sheet-hd"><h3>账单详情</h3>' +
        '<button class="btn sm soft" data-ed-edit>' + UI.icon('compose', 14, 'rc-ic') +
        '编辑</button></div>',
      body:
        '<div class="ed-stage"><div class="ed-path">' +
        tkSvg(' ed-tk-top') +
        '<div class="rcpt" data-rcpt>' + LJ.receiptPaper(e, {
          extraRows: [['来源 SOURCE', src]].concat(e.note ? [['备注 NOTE', e.note]] : [])
        }) + '</div>' +
        tkSvg('') +
        '</div></div>',
      mount(el, close) {
        const edit = el.querySelector('[data-ed-edit]');
        if (edit) edit.onclick = () => {
          close();
          setTimeout(() => { LJ.openEditEntrySheet(ctx, id); }, 180);
        };
        /* 020 · 印章压下（见块首注释：420ms = 抽屉自己的"刚打印完"节奏） */
        const stamp = el.querySelector('[data-rc-stamp]');
        if (stamp) setTimeout(() => { stamp.classList.add('on'); }, 420);
      }
    });
  };

  function planRow(icon, bg, title, sub, to) {
    return '<div class="li" data-go="' + to + '"><div class="ico" style="background:' + bg + '">' + icon + '</div>' +
      '<div class="grow"><div style="font-size:14px;font-weight:500">' + UI.esc(title) + '</div>' +
      '<div class="xs muted" style="margin-top:3px">' + UI.esc(sub) + '</div></div><div class="muted">›</div></div>';
  }

  /* ============================================================
     往来（009 重构：收件箱 + 开口 + 双向时间线 + 人情/工具）
     ------------------------------------------------------------
     四段从上到下：
       ① 待我处理 —— 要我动作的"现在"（收件箱，和时间线刻意分开）
       ② 开口 —— 4 个协商模板 + 预支与还款（它就是"开口"的一种，
          从「常用工具」里上提为一等入口）
       ③ 往来时间线 —— 已经发生的往来，本页主线（LJ.timelineBlock，
          双端同一副骨架；方向看 data-side，条目倒序。
           013 起默认折叠：一条轴线 + 往来圆点（点圆点出气泡），「展开明细」才见卡片）
       ④ 人情往来 + 常用工具 —— 平辈的一来一回留在本页
     「信息边界」整段搬去「我的」（那里本来就有同一批入口）——
     它是配置，不是一来一回。
     ============================================================ */
  P['youth.talk'] = {
    title: '往来', chrome: 'tab', hideNav: true,   /* 024：四页顶栏整条隐藏（同首页） */
    render(ctx) {
      const api = ctx.api;
      let html = '<div class="pad">';

      /* ① 收件箱：风险 / 确认 / 邀约 / 核销 / 方案，按优先级排 */
      html += LJ.todosBlock(api);

      /* ② 开口：标准化模板（4 个）+ 预支上提 */
      html += '<div class="sec-title">发起支持协商</div>';
      html += '<div class="grid2">' + LJ.REQUEST_TEMPLATES.slice(0, 4).map(t =>
        '<button class="card flat" data-tpl="' + t.id + '" style="text-align:left;padding:14px">' +
        '<div style="font-size:20px">' + t.icon + '</div>' +
        '<div style="font-size:14px;font-weight:600;margin-top:8px">' + t.name + '</div>' +
        '<div class="xs muted" style="margin-top:3px">标准化申请</div></button>').join('') + '</div>';
      html += '<div class="list" style="margin-top:10px">' +
        '<div class="li" data-go="youth.prepay"><div class="ico">↩️</div><div class="grow">' +
        '<div style="font-size:14px">预支与还款</div>' +
        '<div class="xs muted" style="margin-top:2px">把再一次开口变成一次资金安排</div></div>' +
        '<div class="muted">›</div></div></div>';

      /* ③ 主线：双向时间线（聚合在 E.timeline，画法在 LJ.timelineBlock；
         013 折叠 key = youth.tl，和支持人端的 sup.tl 各记各的状态） */
      html += LJ.timelineBlock(api.thread.timeline(), 'youth.tl');

      /* ④ 人情往来（平辈的一来一回，留在本页；只记事实不做评判） */
      html += '<div class="sec-title">人情往来<span class="more" data-go="youth.favor">全部</span></div>';
      const favorOv = api.favor.overview();
      html += '<div class="card" data-go="youth.favor">' +
        '<div class="row between">' +
        '<div class="stat sm"><div class="n v-out">¥' + favorOv.outTotal + '</div><div class="k">今年送出</div></div>' +
        '<div class="stat sm" style="text-align:right"><div class="n v-in">¥' + favorOv.inTotal + '</div>' +
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

      /* 常用工具 —— 预支已上提（009）、生成脱敏账单上提为首页卡（014），
         剩 4 项仍 >3，折叠照旧 */
      const toolRow = (to, ico, title, sub, tail) =>
        '<div class="li" data-go="' + to + '"><div class="ico">' + ico + '</div><div class="grow">' +
        '<div style="font-size:14px">' + title + '</div>' +
        '<div class="xs muted" style="margin-top:2px">' + sub + '</div></div>' +
        (tail || '<div class="muted">›</div>') + '</div>';
      html += '<div class="sec-title">常用工具</div><div class="list">' + UI.fold('youth.tools', [
        toolRow('youth.scripts', '💬', '边界沟通话术', '用非对抗的方式说明你的想法'),
        toolRow('youth.invites', '🎁', '收到的支持邀约', '家人主动给你的支持，可收下或谢绝',
          api.invite.pending().length ? '<span class="tag danger">' + api.invite.pending().length + '</span>' : ''),
        toolRow('youth.savings', '🎯', '共同储蓄目标', '和家人一起存一笔钱'),
        toolRow('youth.service', '🎧', '客服与紧急求助', '智能客服、反诈专线')
      ]) + '</div>';

      html += '</div>';
      return html;
    },
    mount(el, ctx) {
      LJ._bindGo(el, ctx);
      UI.bindFold(el);
      LJ.bindTodos(el, ctx);     /* 待我处理的行点击（风险/确认/邀约/核销/方案） */
      LJ.bindTimeline(el, ctx);  /* 必须在 _bindGo 之后：时间线整卡跳转要带 id 参数 */
      UI.rowSwipe(el);           /* 010 · C2：时间线动作卡左滑揭示（与卡上按钮同源） */
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

  /* 编辑一笔（010 · C3 的「编辑」按钮落点）：金额 / 商户(标题) / 分类(仅支出) / 备注，
     走已有的 entry.update。资金来源不在这里改 —— 那是记一笔和批量核对的口径。 */
  LJ.openEditEntrySheet = function (ctx, id) {
    const e = ctx.api.entry.get(id);
    if (!e) return;
    const isIn = e.direction === 'in';
    let cat = e.category || 'other';
    UI.sheet({
      title: '编辑这一笔',
      sub: (isIn ? '收入 · ' : '支出 · ') + U.ymdCN(e.date),
      body:
        '<div class="sec-title" style="margin-top:0">金额</div>' +
        '<input id="edAmt" type="number" inputmode="decimal" value="' + e.amount +
        '" style="width:100%;height:46px;border:1px solid var(--line);border-radius:12px;' +
        'padding:0 13px;font-family:var(--mono);font-size:17px;outline:none;background:var(--card)">' +
        '<div class="sec-title">' + (isIn ? '标题' : '商户') + '</div>' +
        '<input id="edTitle" value="' + UI.esc(isIn ? (e.title || '') : (e.merchant || '')) +
        '" style="width:100%;height:46px;border:1px solid var(--line);border-radius:12px;' +
        'padding:0 13px;outline:none;background:var(--card)">' +
        (isIn ? '' :
          '<div class="sec-title">分类</div><div class="row" style="gap:8px;flex-wrap:wrap">' +
          LJ.CATEGORIES.map(c => '<button class="chip ' + (cat === c.id ? 'on' : '') +
            '" data-ecat="' + c.id + '">' + c.icon + ' ' + c.name + '</button>').join('') + '</div>') +
        '<div class="sec-title">备注</div>' +
        '<input id="edNote" value="' + UI.esc(e.note || '') +
        '" style="width:100%;height:46px;border:1px solid var(--line);border-radius:12px;' +
        'padding:0 13px;outline:none;background:var(--card)">' +
        '<button class="btn mt20" id="edSave">保存修改</button>',
      mount(el, close) {
        el.querySelectorAll('[data-ecat]').forEach(b => b.onclick = () => {
          cat = b.getAttribute('data-ecat');
          el.querySelectorAll('[data-ecat]').forEach(x => x.classList.toggle('on', x === b));
        });
        el.querySelector('#edSave').onclick = () => {
          const amt = Number(el.querySelector('#edAmt').value);
          if (!(amt > 0)) return UI.toast('请填写金额');
          const patch = { amount: amt, note: el.querySelector('#edNote').value.trim() };
          const title = el.querySelector('#edTitle').value.trim();
          if (isIn) patch.title = title;
          else { patch.merchant = title; patch.category = cat; }
          ctx.api.entry.update(id, patch);
          close();
          UI.toast('已更新');
          if (ctx.refreshTop) ctx.refreshTop();
        };
      }
    });
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
        '<div class="row between"><div><div style="font-size:17px;font-weight:700">' + U.monthKey(LJ.clock.now()) + ' 月度概览</div>' +
        '<div class="xs muted" style="margin-top:3px">由本人主动分享</div></div>' +
        '<span class="stamp">已脱敏</span></div>' +
        '<div class="grid3 mt16" style="margin-top:16px">' +
        '<div class="metric"><div class="k">总支出</div><div class="v v-out">' + Math.round(d.month.expense) + '</div></div>' +
        '<div class="metric"><div class="k">结余</div><div class="v ' + (d.month.net > 0 ? 'v-in' : d.month.net < 0 ? 'v-out' : 'v-zero') + '">' + Math.round(d.month.net) + '</div></div>' +
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
        'padding:0 14px;outline:none;background:var(--card);font-size:16px">' +
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
            '<div class="row between"><span style="font-size:14px;font-weight:500">' + UI.esc(r.purpose) + '</span>' +
            '<span class="amt' + (r.status === 'declined' ? '' : ' in') + '">¥' + U.won(r.amount) + '</span></div>' +
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
        '<div class="grow"><div style="font-size:14px">信任的场景不再打扰</div>' +
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
          '<div class="grow"><div style="font-size:14px;font-weight:700">' + UI.esc(w.word) + '</div>' +
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
    /* 036 · 红进绿出：青年端视角 —— 方案逐月发的是**收到**的钱 → 红；
       支持人端同一张表是**付出** → 绿（同一件事按查看者钱包方向着色）。
       零额行 .lp-tr.zero .v 特异性更高 → 仍是灰（0=灰口径）。 */
    return '<div class="lp-tbl">' + rows.map(r => {
      const zero = r.amount === 0;
      const tag = plan.kind === 'taper' ? (zero ? '自立' : '递减')
        : zero ? '不发' : (r.amount < base ? '半给' : '');
      return '<div class="lp-tr' + (zero ? ' zero' : '') + (plan.kind === 'taper' ? ' grad' : '') + '">' +
        '<span class="m">' + Number(r.month.slice(5)) + '月</span>' +
        '<span class="bar"><i style="width:' + Math.max(zero ? 0 : 4, Math.round(r.amount / max * 100)) + '%"></i></span>' +
        '<span class="v v-in">¥' + U.won(r.amount) + '</span>' +
        '<span class="tg">' + tag + '</span></div>';
    }).join('') +
      '<div class="lp-total"><span class="k">整期合计</span>' +
      '<span class="v v-in">¥' + U.won(total) + '</span></div></div>';
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
          '按约定基准 <span class="v-in">¥' + U.won(base) + '</span> / 月发放，没有任何调整</div></div>';
      } else {
        html += live.map(p => '<div class="lp-card ' + (p.kind === 'taper' ? 'grad' : 'live') + '">' +
          '<div class="lp-h"><span class="n">' + UI.esc(p.name) + '</span>' +
          '<span class="tag ' + (p.kind === 'taper' ? 'info' : 'ok') + '">' +
          (p.kind === 'taper' ? '递减中' : '进行中') + '</span></div>' +
          '<div class="lp-sub">' + UI.esc(api.plan.summary(p)) + '</div>' +
          youthPlanTable(p, base) + youthPlanLog(p) + '</div>').join('');
      }

      /* 我的基准 —— 036 红进绿出：约定生活费/实发都是"收到的钱" → 红 */
      html += '<div class="sec-title">我的基准</div>';
      html += '<div class="card"><div class="cm-kv"><span>约定月度生活费</span>' +
        '<b class="v-in">¥' + U.won(base) + '</b></div>' +
        '<div class="cm-kv"><span>发放日</span><b>每月 1 日</b></div>' +
        '<div class="cm-kv"><span>这个月实发</span><b class="v-in">¥' + U.won(next.amount) + '</b></div>' +
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
            '<div><div style="font-size:14px;font-weight:800">' + UI.esc(p.name) + '</div>' +
            '<div class="xs muted" style="margin-top:4px">' + r.from + ' ~ ' + r.to +
            ' · ' + r.days + ' 天</div></div>' +
            '<span class="stamp">复盘</span></div>' +
            '<div class="lp-rv"><div class="rv-n">' +
            '<div><div class="k">假期支出</div><div class="v v-out">¥' + U.won(r.expense) + '</div></div>' +
            '<div><div class="k">日均</div><div class="v v-out">¥' + U.won(r.avg) + '</div></div>' +
            '<div><div class="k">放假前日均</div><div class="v v-out">¥' + U.won(r.beforeAvg) + '</div></div>' +
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
        '<div class="grow"><div style="font-size:14px">大学阶段财务成长报告</div>' +
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
      '<div><div class="k">已转入</div><div class="v v-in">¥' + U.won(p.inTotal) + '</div></div>' +
      '<div><div class="k">剩余</div><div class="v"' +
      (p.remaining < 0 ? ' style="color:var(--danger)"' : '') + '>¥' + U.won(p.remaining) + '</div></div>' +
      '</div>' +
      '<div class="fu-bar' + (over ? ' over' : '') + '">' +
      '<div class="track"><i style="width:' + Math.round(p.ratio * 100) + '%"></i></div>' +
      '<div class="cap"><span>已用 <span class="v-out">¥' + U.won(p.used) + '</span> · ' + p.count + ' 笔</span>' +
      '<span class="p">' + Math.round(p.ratio * 100) + '%</span></div></div>' +
      (f.note ? '<div class="fu-note">「' + UI.esc(f.note) + '」</div>' : '') +
      (f.periodEnd ? '<div class="fu-note" style="color:var(--muted)">有效期至 ' +
        U.ymdCN(f.periodEnd) + ' · 只能用于' + LJ.catById(f.category).name + '</div>' : '') +
      (opts && opts.see !== false ? '<div class="fu-see">' +
        '<div class="sh">家人那边看到的就是这些</div><ul>' +
        '<li>计划 ¥' + U.won(p.target) + '，已转入 <span class="v-in">¥' + U.won(p.inTotal) + '</span></li>' +
        '<li>已用 <span class="v-out">¥' + U.won(p.used) + '</span>（' + Math.round(p.ratio * 100) + '%），' + p.count + ' 笔</li>' +
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
        '<div class="metric"><div class="k">实际用了</div><div class="v v-out">¥' + U.wonInt(rv.used) + '</div></div>' +
        '<div class="metric"><div class="k">执行率</div><div class="v">' + execPct +
        '<span class="u">%</span></div></div>' +
        '</div>' +
        '<div class="mt16" style="margin-top:14px">' + UI.bar(Math.min(1, rv.executed)) + '</div>' +
        '<div class="xs muted" style="margin-top:8px">' +
        rv.days + ' 天 · 日均 <span class="v-out">¥' + U.wonInt(rv.avgPerDay) + '</span>' +
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
        '<span style="font-size:20px">🏥</span>' +
        '<div class="grow"><div style="font-size:14px;font-weight:800">应急医疗支持通道</div>' +
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
        '<div class="n">' + g.days + '<span style="font-size:17px;font-weight:700"> 天</span></div>' +
        '<div class="k">' + g.firstDate + ' 至今 · ' + g.months + ' 个月</div>' +
        '<div class="d">这期间家里累计支持 ¥' + U.won(g.familyIn) + '，' +
        '你自己挣到 / 拿到的有 ¥' + U.won(g.ownIn) +
        '（占 ' + Math.round(g.ownRatio * 100) + '%）。' +
        '这份报告只给你自己看，不含任何一笔消费的道德评价。</div>' +
        '</div>';

      html += '<div class="gr-grid">' +
        '<div class="gr-cell"><div class="k">累计支出</div><div class="v v-out">¥' + U.won(g.totalOut) + '</div>' +
        '<div class="s">月均 <span class="v-out">¥' + U.won(g.avgMonth) + '</span></div></div>' +
        '<div class="gr-cell"><div class="k">累计结余</div><div class="v ' +
        (g.net > 0 ? 'v-in' : g.net < 0 ? 'v-out' : 'v-zero') + '">¥' + U.won(g.net) + '</div>' +
        '<div class="s">收入 − 支出</div></div>' +
        '<div class="gr-cell"><div class="k">掌控指数</div><div class="v">' + g.control.score + '</div>' +
        '<div class="s">' + g.control.level + '</div></div>' +
        '<div class="gr-cell"><div class="k">完成任务</div><div class="v">' + g.tasksDone + '</div>' +
        '<div class="s">累计支持 ' + g.supportCount + ' 次</div></div>' +
        '</div>';

      html += '<div class="sec-title">花钱的节奏</div>';
      html += '<div class="card">' +
        '<div class="cm-kv"><span>前半段月均</span><b class="v-out">¥' + U.won(g.earlyAvg) + '</b></div>' +
        '<div class="cm-kv"><span>后半段月均</span><b class="v-out">¥' + U.won(g.lateAvg) + '</b></div>' +
        (g.peakMonth ? '<div class="cm-kv"><span>花得最多的一个月</span><b>' +
          g.peakMonth + ' · <span class="v-out">¥' + U.won(g.peakAmount) + '</span></b></div>' : '') +
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
        '<span class="mono v-in" style="font-weight:700">¥' + U.won(g.familyIn) + '</span></div>' +
        '<div class="mt8" style="margin-top:8px">' +
        UI.bar(g.totalIn ? g.familyIn / g.totalIn : 0, 'var(--ink)') + '</div>' +
        '<div class="row between" style="margin-top:14px"><span class="sm t2">个人自有</span>' +
        '<span class="mono v-in" style="font-weight:700">¥' + U.won(g.ownIn) + '</span></div>' +
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
     个人信息抽屉的内容（022 · 原来整段就是「我的」页体）
     ------------------------------------------------------------
     用户：「直接把『我的』页面改成『银行卡管理』页面」—— 页体让给银行卡管理
     （见文件后段 P['youth.me']），个人信息 / 家庭关系 / 信息边界 / 其他
     这几段搬进右上角头像点开的右侧抽屉。这里是那段内容的生成件。
     ============================================================ */
  LJ.meDrawerBody = function (ctx) {
      /* 025 · 两端同步：支持人端的「我的」也走这个抽屉槽位 —— 内容分流到
         pages-supporter 的 LJ.supMeDrawerBody（个人信息 / 绑定关系 / 查看范围
         / 其他），UI.drawer 的外壳、把手、先收抽屉再导航这些机制两端一份。 */
      if (ctx && ctx.role === 'supporter' && LJ.supMeDrawerBody) return LJ.supMeDrawerBody(ctx);
      const api = ctx.api, me = api.profile(), partner = api.partner();
      const cfg = api.disclosure.current();
      const unread = api.message.unread();
      const grants = api.grant.list();
      const riskBadge = api.risk.badge();
      const planWaiting = api.plan.incoming().length;
      const fundLive = api.fund.active().length;
      const fundScene = api.fund.scene();
      let html = '';

      html += '<div class="sec-title" style="margin-top:6px">个人信息</div>';
      html += '<div class="card mt16"><div class="row">' +
        '<div style="width:52px;height:52px;border-radius:50%;background:var(--navy);color:#fff;' +
        'display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600">' + UI.esc(me.avatar) + '</div>' +
        '<div class="grow"><div style="font-size:17px;font-weight:700">' + UI.esc(me.name) + '</div>' +
        '<div class="xs muted" style="margin-top:3px">' + UI.esc(me.phone) + ' · ' + me.level + '</div></div>' +
        '<span class="tag info">青年端</span></div></div>';

      html += '<div class="sec-title">家庭关系</div><div class="list">' +
        '<div class="li"><div class="ico">👤</div><div class="grow"><div style="font-size:14px">' +
        UI.esc(partner ? partner.name : '未绑定') + '</div>' +
        '<div class="xs muted" style="margin-top:2px">' + UI.esc(partner ? partner.relation : '') + ' · 已绑定</div></div>' +
        '<span class="tag ok">生效中</span></div>' +
        '</div>';

      /* 022：「我的银行卡」卡堆整段退役 —— 这一页自己就是银行卡管理页，
         旧卡堆的折叠/展开/management 入口都不需要了（见文件后段 P['youth.me']）。 */

      /* ---- 信息边界 ---- */
      html += '<div class="sec-title">信息边界</div>';
      html += '<div class="proto" data-go="youth.mode"><div class="ph"><span class="seal">约</span>省心模式 · ' + cfg.name + '</div>' +
        '<div class="sm t2" style="line-height:1.7">' + UI.esc(cfg.desc) + '</div>' +
        '<div class="xs muted" style="margin-top:8px">单笔交易明细永不向家人开放</div></div>';

      html += '<div class="list mt12">' +
        '<div class="li" data-go="youth.funds"><div class="ico" style="background:#EAF4FF">🎯</div>' +
        '<div class="grow"><div style="font-size:14px">我的专项</div>' +
        '<div class="xs muted" style="margin-top:2px">' +
        (fundLive ? fundLive + ' 个进行中 · ' +
          (fundScene ? fundScene.name : '开学、实习、看病的专用钱袋')
          : '开学、实习、看病的专用钱袋') + '</div></div>' +
        (fundLive ? '<span class="tag info">' + fundLive + '</span>' : '<div class="muted">›</div>') + '</div>' +
        '<div class="li" data-go="youth.plan"><div class="ico" style="background:#EDFBF2">💠</div>' +
        '<div class="grow"><div style="font-size:14px">我的生活费</div>' +
        '<div class="xs muted" style="margin-top:2px">基准 <span class="v-in">¥' + U.won(api.plan.base()) +
        '</span> / 月' + (planWaiting ? ' · 有方案待你确认' : '') + '</div></div>' +
        (planWaiting ? '<span class="tag warn">' + planWaiting + '</span>' : '<div class="muted">›</div>') + '</div>' +
        '<div class="li" data-go="youth.risk"><div class="ico" style="background:#FFE9E5">🛡</div>' +
        '<div class="grow"><div style="font-size:14px">风险预警</div>' +
        '<div class="xs muted" style="margin-top:2px">日常消费一条通知都不会发给家人</div></div>' +
        (riskBadge ? '<span class="tag danger">' + riskBadge + '</span>' : '<div class="muted">›</div>') + '</div>' +
        '<div class="li" data-go="youth.grants"><div class="ico" style="background:#EDE9FB">🔑</div>' +
        '<div class="grow"><div style="font-size:14px">授权中心</div>' +
        '<div class="xs muted" style="margin-top:2px">' + grants.filter(g => g.status === 'active').length + ' 项生效中</div></div><div class="muted">›</div></div>' +
        '<div class="li" data-go="common.contracts"><div class="ico" style="background:#EDE9FB">🛡</div>' +
        '<div class="grow"><div style="font-size:14px">权限自检</div>' +
        '<div class="xs muted" style="margin-top:2px">家人当前能看到什么、看不到什么</div></div><div class="muted">›</div></div>' +
        '<div class="li" data-go="common.audit"><div class="ico" style="background:#FFF0D4">📜</div>' +
        '<div class="grow"><div style="font-size:14px">留痕记录</div>' +
        '<div class="xs muted" style="margin-top:2px">谁在什么时候改了什么</div></div><div class="muted">›</div></div>' +
        '</div>';

      /* ---- 037 · 家人能看到什么（用户：「也放进侧边抽屉」—— 从「我的」页体
           整段搬进这儿，紧跟信息边界。开关作用于**当前选中的卡**
           （ctx.params.id，和卡组圆点同一个来源）；[data-vis] 的绑定在
           openMeDrawer 的 mount 里，改完原地换文案，不刷新页面。 ---- */
      const cards37 = api.card.list();
      const cur37 = cards37.find(c => c.id === ctx.params.id) || cards37[0];
      if (cur37) {
        html += '<div class="sec-title">家人能看到什么</div>';
        html += '<div class="list">' +
          '<div class="li"><div class="ico" style="background:#EDE9FB">👁</div>' +
          '<div class="grow"><div style="font-size:14px">这张卡的余额</div>' +
          '<div class="xs muted" style="margin-top:2px">' +
          (cur37.familyVisible ? '家人能看到余额数字' : '家人看不到余额') + '</div></div>' +
          '<button class="switch' + (cur37.familyVisible ? ' on' : '') + '" data-vis="1"></button></div>' +
          '<div class="li"><div class="ico" style="background:#FFE9E5">🔒</div>' +
          '<div class="grow"><div style="font-size:14px">单笔交易明细</div>' +
          '<div class="xs muted" style="margin-top:2px">任何情况下都不向家人开放</div></div>' +
          '<span class="tag">固定</span></div>' +
          '</div>';
      }

      /* 成长相关入口已全部移除，统一走首页成长卡 */
      html += '<div class="sec-title">其他</div><div class="list">' +
        '<div class="li" data-go="common.messages"><div class="ico">🔔</div>' +
        '<div class="grow"><div style="font-size:14px">消息中心</div></div>' +
        (unread ? '<span class="tag danger">' + unread + '</span>' : '<div class="muted">›</div>') + '</div>' +
        '<div class="li" data-go="common.help"><div class="ico">❓</div>' +
        '<div class="grow"><div style="font-size:14px">帮助与说明</div></div><div class="muted">›</div></div>' +
        LJ.TOUR_ROW +
        LJ.LOGOUT_ROW +
        '</div>';

      html += '<div style="padding:26px 4px 10px;text-align:center">' +
        '<div class="xs muted">临界 · 家庭支持协同账户 v1.0.0</div></div>';

      return html;
  };

  /* ============================================================
     我的（022）—— 037（用户）起和「银行卡管理」**分家**，不再是同一份页体
     ------------------------------------------------------------
     022 当时两页完全同体（用户：「直接把『我的』页面改成『银行卡管理』页面」）；
     037 的新口径：
       · 「我的」页 = 资金卡（首页那张黑卡，点它进支出结构）→ 银行卡卡组 →
         卡余额卡（038：余额 + 本月开支柱状图，随切卡变；点它进流水）→ 能力轨迹；
       · 「这张卡的角色」只在银行卡管理深链页；
       · 「家人能看到什么」整段进右侧个人信息抽屉。
     页体仍由 cardsPageBody 一个函数出（按 navAvatar 旗子分流），
     套件里 page.render 被包一层计数，两页各 render 各记一笔。
     navAvatar 旗子照旧：只有这一页挂 —— 024 起由 cardsPageBody 读它，渲染进**内容右上角**（顶栏整条隐藏；深链的银行卡管理页不挂）。
     ============================================================ */
  P['youth.me'] = {
    title: '我的', chrome: 'tab', navAvatar: true, hideNav: true,   /* 024：顶栏隐藏 → 头像把手搬进内容（meAvatarRow） */
    render(ctx) { return cardsPageBody(ctx); },
    mount(el, ctx) { mountCardsPage(el, ctx); }
  };

  /* ============================================================
     右侧个人信息抽屉（022）
     ------------------------------------------------------------
     内容 = 旧「我的」页体去掉银行卡那一段：个人信息卡 / 家庭关系 /
     信息边界（省心模式 + 六个入口）/ 其他（消息中心、帮助、导览、退出）。
     每次打开现算 —— 未读角标、风险角标、待确认方案这些数字要是当下的。
     ★ 抽屉里的行都先收抽屉再走：抽屉挂在 #sheet-root（z-index 500），
       不收就直接导航，它会盖在新页面上。
     ============================================================ */
  LJ.openMeDrawer = function (ctx) {
    if (!ctx || !ctx.api) return null;
    /* 025 · 两端同步：副标题跟着分流走（支持人端 = 绑定关系 / 查看范围） */
    const sup = ctx.role === 'supporter';
    return UI.drawer({
      side: 'right',
      head: '<div class="drawer-head"><div class="dh-row"><h3>我的</h3>' +
        '<button class="drawer-new" id="meDrClose">关闭</button></div>' +
        '<div class="dh-sub">' + (sup ? '个人信息 · 绑定关系 · 查看范围'
          : '个人信息 · 家庭关系 · 信息边界') + '</div></div>',
      body: LJ.meDrawerBody(ctx),
      mount(panel, close) {
        panel.querySelectorAll('[data-go]').forEach(n => {
          const dest = n.getAttribute('data-go');
          n.onclick = () => { close(); ctx.go(dest); };
        });
        LJ.bindLogout(panel);
        /* 037 · 家人可见开关（从卡片页体搬进抽屉）：作用于当前选中的卡 ——
           改完只动抽屉里这两处文案/态，不 refreshTop（页面上已没有这段） */
        panel.querySelectorAll('[data-vis]').forEach(n => {
          n.onclick = () => {
            const cards = ctx.api.card.list();
            const c = cards.find(x => x.id === ctx.params.id) || cards[0];
            if (!c) return;
            ctx.api.card.setVisible(c.id, !c.familyVisible);
            n.classList.toggle('on', c.familyVisible);
            const sub = n.parentNode && n.parentNode.querySelector('.xs');
            if (sub) sub.textContent = c.familyVisible ? '家人能看到余额数字' : '家人看不到余额';
            UI.toast(c.familyVisible ? '家人现在能看到这张卡的余额' : '已收回这张卡的余额可见');
          };
        });
        /* 退出 / 产品导览会往抽屉上面盖弹层 —— 先收抽屉再说 */
        ['[data-act="logout"]', '[data-act="tour"]'].forEach(sel => {
          const n = panel.querySelector(sel);
          if (!n || !n.onclick) return;
          const orig = n.onclick;
          n.onclick = () => { close(); orig(); };
        });
        const x = panel.querySelector('#meDrClose');
        if (x) x.onclick = close;
      }
    });
  };

  /* ============================================================
     卡组以下的那部分（卡余额卡 / 角色 / 能力轨迹）
     ------------------------------------------------------------
     037（用户）起两页**分家**（022 曾经完全同一份页体）：
       · 「我的」页 = 资金卡 → 卡组 → **卡余额卡（038 就地替换 037 的本月收支）**
         → 能力轨迹；
       · 银行卡管理深链页 = 卡组 → 这里（角色 + 能力轨迹）；
       · 「这张卡的角色」只属于管理页，「家人能看到什么」整段搬进右侧
         个人信息抽屉（信息边界段之后）—— 两页都不再重复。
     单独抽出来，是为了「点尾号切换卡」时**只换这一块的内容**：
     整页重渲染（ctx.replace）会让整页滑入、其他元素全部跟着动，
     而需求是「只让银行卡滚过来，页面中其他元素不动」——
     038 的「余额+柱图随卡变」正好骑在这条既有联动上（slideTo 换 innerHTML）。
     ============================================================ */
  function cardsRest(api, cur, isMe) {
    let html = '';

    if (cur.frozen) {
      html += '<div class="cm-frozen-note">这张卡已冻结，暂时不能收付款。' +
        '家人只会收到一条不含明细的通知。</div>';
    }

    /* 024 · 原来卡组下面是「基本信息」介绍卡（卡号/类型/默认扣款）——
       用户：对银行卡进行详细介绍的卡片删掉。卡号等硬信息在卡片详情
       （点卡面进去的那页）里仍有，这里不再重复一遍。 */

    /* ---------- 038 · 「我的」页第一块：卡余额卡（余额 + 本月开支柱状图）。
          放进 #cmRest 是联动的关键：点圆点/横滑切卡 → slideTo 只换这一块的
          innerHTML → 余额与柱图跟着当前卡走（管理深链页不放这张）。 */
    if (isMe) html += cardBalanceCard(api, cur);

    /* ---------- 这张卡的角色（037 只在银行卡管理页；「我的」页用户点名迁出） ---------- */
    if (!isMe) {
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
      /* 024 · 「换了角色会怎样」说明块删掉（用户点名）—— 对调规则本身还在：
         点别的角色照样对调，只是不再在这儿解释一遍。 */
    }

    /* ---------- 024 · 能力轨迹（014 落在流水页，024 搬来这儿；037 两页都留：
          「我的」排在卡余额卡下面（038），管理页排在角色下面）。
          卡内数据全是全局的（能力分 / 任务 / 动作数），跟当前卡无关 —— 所以
          换卡时这块内容逐字不变，probe-cardswitch 的「区块框不动」仍然成立；
          data-zoom-push 的绑定在 bindRest 里跟着重绑（换卡会重建 innerHTML）。 */
    html += LJ.growCard(api.dashboard().control, api.task.summary(),
      api.milestone.list().length,
      { attrs: ' data-zoom-push="youth.grow"', ev: LJ.evStats(api) });

    /* ---------- 037 · 「家人能看到什么」整段搬进右侧个人信息抽屉
         （meDrawerBody 信息边界段之后，带同一枚 data-vis 开关）——
         页面上两处都不再放，隐私边界只在抽屉里讲一遍。 */

    /* 「这张卡上的账」和「卡片状态」在详情页（cardDetail）——
       点卡面进详情，共享元素转场；这里只是入口页，别把正题压在这里。 */

    return html;
  }

  /* ============================================================
     银行卡管理页的页体与交互（022 起「我的」页也用它）
     ------------------------------------------------------------
     抽成两个具名函数而不是让「我的」页去调 P['youth.cards'].render：
     套件里 page.render 会被包一层计数，页内转调会一次渲染记两笔。
     ============================================================ */
  /* ============================================================
     024 · 「我的」页的头像把手（022 挂在顶栏右上角）
     ------------------------------------------------------------
     首页/复盘/往来/我的 四页顶栏整条隐藏（用户：最上面的标题删掉、只留
     页面内容）后，顶栏没了，把手跟着搬进内容右上角 —— id、类名、点击行为
     一字不改，?ava=1 调试钩子、probe-logout、check-live 的取法都照旧。
     navAvatar 旗子保留：只有「我的」页挂（深链的银行卡管理页不挂）。
     ============================================================ */
  function meAvatarRow(api) {
    let ava = '';
    try { ava = api.profile().avatar || ''; } catch (e) { ava = ''; }
    /* 033 示能③：头像旁边挂一个小 › 徽标 —— 老师反馈"用户不知道入口在哪"，
       头像是这一页唯一的抽屉把手，不给示能就没人知道它能点。
       徽标 pointer-events:none（纯视觉，点击仍落按钮），几何判据一条不改。 */
    return '<div class="me-ava"><button class="nav-ava" id="navAva" aria-label="个人信息">' +
      UI.esc(ava) + '</button><i class="ava-tail" aria-hidden="true">›</i></div>';
  }
  LJ.meAvatarRow = meAvatarRow;   /* 025 · 两端同步：支持人端「我的」页也用它（一个真源） */

  /* ============================================================
     038 · 「我的」页的「卡余额卡」（用户口径，替换 037 那张本月收支卡）
     ------------------------------------------------------------
     「把本月收支改成**对应银行卡的余额**，卡片上再加上**对应银行卡的
     本月开支柱状图**，卡片内容**随着切换银行卡而改变**」。

     口径（银行卡没有独立余额字段 —— 角色定池子，见 api.card.ROLES）：
       · 余额：support → 家庭支持金池 / own → 个人自有资金池 / daily → 两池合计
         （角色描述里就写着「计入家庭支持金池」「余额不进家庭视图」；
          与首页资金卡上的池数字**同一个真源**，逐字一致）；
       · 支出图：**这张卡的钱**当月逐日柱 —— support → family 池 / own → own 池 /
         daily → 全部（daily(mk, src) 与支出结构页同一个真源，柱子口径一致）；
       · 联动：本函数吃 cur —— 切卡时 slideTo 换 #cmRest 的 innerHTML 自动重渲；
       · 整卡仍可点进流水（037 起的跳转保留，bindGo 那条线接）。
     ============================================================ */
  function cardBalanceCard(api, cur) {
    const bal = api.dashboard().balances;
    const meta = api.card.roleMeta(cur.role) || { name: '未设定', icon: '' };
    /* 角色 → 资金池：support=家庭支持金、own=自有资金、daily=哪边都付（两池合计） */
    const src = cur.role === 'support' ? 'family' : cur.role === 'own' ? 'own' : '';
    const amount = cur.role === 'support' ? bal.family : cur.role === 'own' ? bal.own : bal.total;
    const d = api.ledger.daily(null, src);
    /* 脚注写清口径：池子卡写「XX 支出」，日常卡就叫「本月支出」 */
    const cap = src === 'family' ? '家庭支持金支出'
      : src === 'own' ? '个人自有资金支出' : '本月支出';
    return '<div class="card cb-card" data-go="youth.ledger">' +
      '<div class="cb-t">' + meta.icon + ' ' + UI.esc(meta.name) + '</div>' +
      '<div class="cb-l">余额</div>' +
      '<div class="cb-v">¥' + U.won(amount) + '</div>' +
      '<div class="db-h">本月开支柱状图<span>' + d.yearLabel + '</span></div>' +
      UI.dailyBars(d, { bare: true }) +
      '<div class="cb-cap"><span>' + cap + ' <b class="v-out">¥' + U.won(d.outTotal) +
      '</b> · ' + d.activeDays + ' 天有花销</span>' +
      '<span class="cb-go">查看 ›</span></div>' +
      '</div>';
  }

  function cardsPageBody(ctx) {
      const api = ctx.api;
      /* 024 · 头像把手（详见上方 meAvatarRow）：靠页 def 上的 navAvatar
         旗子认页面 —— ctx.page 就是页 def，深链的银行卡管理页不挂。 */
      const ava = (ctx.page && ctx.page.navAvatar) ? meAvatarRow(api) : '';
      let cards = api.card.list();
      /* 032 · 显示级自愈（用户：「我的里银行卡又显示不出来了，这是个老毛病」）：
         库里明明有卡行、这个身份却看到 0 张 —— 归属出了问题（坑 41 的老毛病，
         兜底到谁谁的卡就消失）。先 heal 再重读；heal 也救不回来才真的是没卡。
         这道锁放在**渲染时**而不只放在启动时：切身份、导入、老 localStorage
         这些"会话中途才坏掉"的路径都得兜住 —— 光在 boot 修一次是修不完的。 */
      if (!cards.length && LJ.store.all('bankCard').length && LJ.seed && LJ.seed.heal) {
        LJ.seed.heal();
        cards = api.card.list();
      }
      if (!cards.length) return ava + UI.empty('💳', '还没有绑定银行卡');
      let cur = cards.find(c => c.id === ctx.params.id) || cards[0];
      const idx = cards.indexOf(cur);
      /* 037 · 分流：「我的」页多两块（顶部资金卡 + cmRest 里的卡余额卡），
         管理深链页不挂头像 → isMe 就是 navAvatar 旗子（和 ava 同一个判据）。 */
      const isMe = !!(ctx.page && ctx.page.navAvatar);

      let html = ava + '<div class="pad">';

      /* ---------- 037 · 「我的」顶部：资金卡（首页那张黑卡同款，
            data-shared-acct = 首页点它飞过来的共享落点；
            点它 → 支出结构（资金去哪了），绑在 mountCardsPage 里） ---------- */
      if (isMe) {
        html += '<div class="mt12">' + acctCard(api.dashboard().balances, {
          tail: (api.profile().phone || '').slice(-4),
          attrs: ' data-shared-acct'
        }) + '</div>';
      }

      /* ---------- 卡组：左右切换 ---------- */
      html += '<div class="cm-stage t-tilt">' +
        cards.map((c, i) =>
          '<div class="cm-card t-tilt-card' + (i === idx ? ' on' : '') + '" data-pick="' + c.id + '">' +
          LJ.cardFace(c) +
          '<div class="cd-veil"></div>' +
          (c.frozen ? '<div class="cm-frozen">已冻结</div>' : '') +
          '<div class="cd-foot"><span class="cd-name">' + UI.esc(c.name) + '</span>' +
          '<span class="cd-tail">•••• ' + c.tail + '</span></div>' +
          /* 011 · 3D tilt 光斑：贴在卡面内容之后（screen 混合压在卡面上）、
             pointer-events:none 不挡点卡进详情；转场克隆体带着它飞但拿不到
             变量（脱离舞台）→ opacity 恒 0，飞行干净。 */
          '<div class="t-tilt-glare"></div>' +
          '</div>').join('') +
        '</div>';
      html += '<div class="cm-dots">' + cards.map((c, i) =>
        '<i class="' + (i === idx ? 'on' : '') + '" data-pick="' + c.id + '">' +
        '•••• ' + c.tail + '</i>').join('') + '</div>';

      /* ---------- 038 · 「我的」页：卡余额卡（余额 + 本月开支柱状图）住在
            #cmRest 里（cardsRest 第一块）—— 切卡时 slideTo 换 cmRest 的
            innerHTML，卡面内容跟着换，这正是用户要的「随切换改变」。
            （037 那张独立的本月收支卡就地替换，位置不变：卡组下面。） */

      /* 卡组以下的所有区块放进一个容器：切换卡时只换它的 innerHTML ——
         不重渲染整页、不走页面转场，做到「只有卡滚过来，其他元素不动」。
         037 起内容按页分流：我的 = 能力轨迹；管理页 = 角色 + 能力轨迹
         （角色行恒 3 项，换内容不改高度，所以下面的东西不会位移）。 */
      html += '<div id="cmRest">' + cardsRest(api, cur, isMe) + '</div>';

      html += '<div style="height:30px"></div></div>';
      return html;
  }

  function mountCardsPage(el, ctx) {
      const api = ctx.api;
      const cards = api.card.list();
      LJ.bindCardFaces(el);
      const cur = () => cards.find(c => c.id === ctx.params.id) || cards[0];
      const restEl = () => el.querySelector('#cmRest');
      /* 037 · 分流（同 cardsPageBody 的判据）：我的页才有的两块接线 */
      const isMe = !!(ctx.page && ctx.page.navAvatar);

      /* 下面那几块（角色 / 能力轨迹）的点击绑定抽出来 ——
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
        /* 037 · [data-vis]（家人可见开关）搬去右侧个人信息抽屉 ——
           绑定跟着搬进 LJ.openMeDrawer 的 mount，这里不再有它 */
        /* 024 · 能力轨迹卡 → 成长中心（卡搬来「我的」页，绑定也跟着搬：
           它在 #cmRest 里，换卡会重建 innerHTML，必须每次都重绑） */
        el.querySelectorAll('#cmRest [data-zoom-push]').forEach(n => {
          n.onclick = () => ctx.goShared(n.getAttribute('data-zoom-push'), {}, n, '[data-shared-grow]');
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
        const EASE = UI.ease('--ease-ui');

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
        if (box) { box.innerHTML = cardsRest(api, target, isMe); bindRest(); }
      }

      /* 圆点 = 尾号：只滚动卡面，其他元素不动 */
      el.querySelectorAll('.cm-dots [data-pick]').forEach(n => {
        n.onclick = () => slideTo(n.getAttribute('data-pick'));
      });

      /* B3（010）：卡组横滑切换 —— 复用点尾号的 slideTo（只让卡滚过来） */
      const cmStage = el.querySelector('.cm-stage');
      if (cmStage) UI.tilt(cmStage);   /* 011 · 3D tilt（transitions.dev card-tilt） */
      if (cmStage) LJ.gest.swipe(cmStage, {
        onFire: dir => {
          const all = [].slice.call(cmStage.querySelectorAll('.cm-card'));
          const i = all.findIndex(c => c.classList.contains('on'));
          if (i < 0) return;
          const to = dir === 'left' ? i + 1 : i - 1;
          if (to >= 0 && to < all.length) slideTo(all[to].getAttribute('data-pick'));
        }
      });

      /* 点卡面 → 卡片详情，共享元素转场：卡面飞过去、背景连续平滑缩放。
         卡组是叠放的，只有当前卡（.on）可点，所以点卡就是「打开这张卡的详情」。 */
      el.querySelectorAll('.cm-card').forEach(n => {
        n.onclick = () => ctx.goShared('youth.cardDetail',
          { id: n.getAttribute('data-pick') || ctx.params.id }, n, '[data-detail-card]');
      });

      /* 024 · 头像把手（022 的抽屉入口，顶栏隐藏后在内容里）——
         它不在 #cmRest 里，换卡不会重建，挂一次就够 */
      const avaBtn = el.querySelector('#navAva');
      if (avaBtn) avaBtn.onclick = () => LJ.openMeDrawer(ctx);

      /* ---------- 037 · 「我的」页两块的接线（都不在 #cmRest 里，挂一次） ----------
         ① 资金卡 → 支出结构（卡片缩放转场，和流水页那颗结构入口同一个机制；
            共享目标 [data-shared-acct] 已随黑卡从结构页删掉，所以这里用 zoomPush）；
         ② 卡余额卡（038）data-go → 流水（bindGo 一条线管全页 [data-go]）。 */
      const funds = el.querySelector('[data-shared-acct]');
      if (funds) funds.onclick = () => LJ.router.zoomPush('youth.structure', {}, funds);
      bindGo(el, ctx);

      /* 角色 / 能力轨迹的绑定统一走 bindRest
         （切换卡会换掉 #cmRest 的 innerHTML） */
      bindRest();

      /* 030 · 卡片详情首帧预热：**第一次**进详情页要 100ms+（样式首算 + JIT +
         图片解码），真机上就是"第一下卡一下"——CDP 实测首次 107ms、之后 6ms。
         空闲时先把这一页建一次、逼一次布局再丢掉，把首算成本挪到看不见的时候。
         只做一次；失败不影响功能（预热不该有能力改变任何东西）。 */
      const idle = window.requestIdleCallback || (fn => setTimeout(fn, 600));
      idle(() => {
        if (warmedDetail || !LJ.router || !LJ.router._build) return;
        warmedDetail = true;
        try {
          const on = document.querySelector('.cm-card.on');
          const id = on ? on.getAttribute('data-pick') : null;
          const b = LJ.router._build('youth.cardDetail', id ? { id: id } : {});
          if (!b || !b.el) return;
          /* 挂进**真宿主**（不是随便找个屏外容器）：样式首算之外，布局也要在
             真壳的父链里算一遍 —— 挂在 body 屏外只有样式缓存生效，布局照样重算
             （第一版就这么挂的，实测首帧没降下来）。visibility:hidden 不画，
             但参与布局。 */
          const host = LJ.router.host || document.body;
          b.el.style.cssText = 'position:absolute;inset:0;visibility:hidden;pointer-events:none';
          host.appendChild(b.el);
          void b.el.offsetWidth;                       // 逼一次样式首算 + 布局
          const img = b.el.querySelector('img');
          if (img && img.decode) { img.decode().catch(() => {}); }
          setTimeout(() => b.el.remove(), 80);
        } catch (e) { /* 预热失败就当没发生 */ }
      });
  }
  /* 预热只做一次（整机重建时重新插旗 —— 见 App.enter 的重建路径） */
  let warmedDetail = false;

  P['youth.cards'] = {
    title: '银行卡管理', chrome: 'plain',
    render: cardsPageBody,
    mount: mountCardsPage
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
        LJ.cardFace(cur) +
        '<div class="cd-veil"></div>' +
        (cur.frozen ? '<div class="cm-frozen">已冻结</div>' : '') +
        '<div class="cd-foot"><span class="cd-name">' + UI.esc(cur.name) + '</span>' +
        '<span class="cd-tail">•••• ' + cur.tail + '</span></div>' +
        '</div></div>';

      /* ---------- 基本信息 ---------- */
      html += '<div class="card mt16">' +
        '<div class="row between"><div style="min-width:0">' +
        '<div style="font-size:17px;font-weight:800;letter-spacing:-.02em">' + UI.esc(cur.name) + '</div>' +
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
        '<div class="lg-card"><div class="n v-in">¥' + U.won(st.inTotal) + '</div>' +
        '<div class="k">进账 · ' + st.inCount + ' 笔</div>' +
        (st.income.length ? '<div class="lg-line"><span>' + UI.esc(st.income[0].name) + '</span>' +
          '<b class="in">¥' + U.won(st.income[0].sum) + '</b></div>' : '') +
        '</div>' +
        '<div class="lg-card"><div class="n v-out">¥' + U.won(st.outTotal) + '</div>' +
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
        '<div class="grow"><div style="font-size:14px">' +
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
      LJ.bindCardFaces(el);
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
            '<div class="row between"><span style="font-size:14px;font-weight:700">' + UI.esc(f.name) +
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
          '<div class="row between"><span style="font-size:14px;font-weight:700">' +
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
