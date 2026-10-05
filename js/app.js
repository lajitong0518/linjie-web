/* ============================================================
   app.js —— 外壳、登录、状态栏、TabBar、开发面板
   ============================================================ */
(function (LJ) {
  'use strict';
  const U = LJ.util, UI = LJ.ui;

  /* ---------------- 导航配置 ---------------- */
  /* 4 个 tab + 1 个悬浮 FAB，对应参考图的「胶囊导航 + 黑色圆形按钮」 */
  LJ.TABS = {
    /* 命名走「方案乙」：5 个 tab 不减，把账本味的词换掉。
       账单 → 流水（它就是流水，但"流水"不像门口的招牌）；
       问问 → 复盘：导航上该站着产品主张（回头看、向前看），
       问句入口退到复盘页里 —— 推演（沙盘）比提问更像教练。 */
    youth: [
      { id: 'home', name: '首页', icon: 'home', page: 'youth.home' },
      { id: 'ledger', name: '流水', icon: 'list', page: 'youth.ledger' },
      { id: 'review', name: '复盘', icon: 'chart', page: 'youth.review' },
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
  /* 悬浮按钮：青年端=记一笔（016 换回"添加账单"），支持人端=登记支持。
     青年端浮标的历史：记一笔 → 批次五换成决策预演（沙盘）→ 016 用户拍板换回
     记一笔。沙盘没有丢 —— 判断卡上的「沙盘推演」主按钮（[data-sandbox]，
     成长页也有一处）才是它的正门，浮标这份本来就是重复入口。 */
  LJ.FAB = {
    youth: { icon: 'compose', label: '记一笔' },
    supporter: { icon: 'plus', label: '登记支持' }
  };
  LJ.ROOT = { youth: 'youth.home', supporter: 'supporter.status' };
  LJ.ROLE_LABEL = { youth: '青年端', supporter: '支持人端' };

  /* ============================================================
     033 · 全站功能目录（LJ.FEATURES —— 单一真源）
     ------------------------------------------------------------
     老师反馈：「界面友好度不够、每个功能不清晰、用户不知道入口在哪」。
     解法是**入口集中**：首页右上角一个悬浮图标 → 底部抽屉拉起覆盖首页，
     抽屉里就是下面这份目录（单列行 = 图标 + 名字 + 一句话说明，按页面/
     功能域分 6 区）。静态界面不加一个字 —— 密度全进抽屉。

     收录规则（写死，render 契约逐条验）：
       ① 只收「可主动发起的功能」；详情页/中间页/向导页不进目录
          （小票、账单详情、卡片详情、风险事件、各 *New）；
       ② name = 全站唯一名字，**与目标页 title 同名**（能同名就同名 ——
          少数几处页面 title 不是功能名，记在 plans/033 的命名盘点里）；
       ③ desc 一句话 ≤14 字，写"它是什么"，不写营销话；
       ④ go 必须存在于 LJ.pages（死入口 = 红）；支持人端按信息边界独立成册，
          一条 youth.* 都不许出现（反之亦然）。 */
  LJ.FEATURES = {
    youth: [
      { g: '记账 · 账单', items: [
        { name: '记一笔', desc: '记录一笔收支，生成小票', icon: 'compose', go: 'youth.entry' },
        { name: '流水', desc: '全部账单，按分类与银行卡筛', icon: 'list', go: 'youth.ledger', params: { view: 'list' } },
        { name: '本周期节奏', desc: '这个周期每天花了多少', icon: 'status', go: 'youth.ledger', params: { view: 'cycle' } },
        { name: '每日收支', desc: '日历上看每天的净收支', icon: 'cal', go: 'youth.ledger', params: { stack: 'daily' } },
        { name: '订阅管理', desc: '周期扣费的识别与提醒', icon: 'reset', go: 'youth.subs' },
        { name: '导入账单', desc: '从 CSV 导入银行账单', icon: 'download', go: 'youth.import' },
        { name: '脱敏账单', desc: '生成脱敏账单分享给家人', icon: 'receipt', go: 'youth.share' }
      ] },
      { g: '规划 · 推演', items: [
        { name: '沙盘推演', desc: '花之前先演一遍，看哪天见底', icon: 'scale', go: 'youth.sandbox' },
        { name: '情景沙盘', desc: '已存方案的分支对比', icon: 'spark', go: 'youth.scenario' },
        { name: '我的生活费', desc: '生活费方案与节奏安排', icon: 'plan', go: 'youth.plan' },
        { name: '预算设置', desc: '给每类消费设个限额', icon: 'set', go: 'youth.budget' },
        { name: '共同储蓄目标', desc: '和家人一起存一笔钱', icon: 'check', go: 'youth.savings' },
        { name: '专项资金', desc: '专款专用的钱', icon: 'shield', go: 'youth.funds' },
        { name: '预支与还款', desc: '先花后还的钱怎么安排', icon: 'menu', go: 'youth.prepay' },
        { name: '临界顾问', desc: '问它钱的事，给行动建议', icon: 'sparkle', go: 'youth.ai' }
      ] },
      { g: '复盘 · 成长', items: [
        { name: '周期复盘', desc: '结论 → 依据 → 下一步', icon: 'chart', go: 'youth.review' },
        { name: '财务掌控力', desc: '你的自主支配度与提升路径', icon: 'status', go: 'youth.control' },
        { name: '成长中心', desc: '任务、认证、档案的入口', icon: 'spark', go: 'youth.grow' },
        { name: '成长任务', desc: '练一次，攒能力证据', icon: 'check', go: 'youth.tasks' },
        { name: '掌控力认证', desc: '把能力变成可验证的凭证', icon: 'shield', go: 'youth.cert' },
        { name: '成长纪念册', desc: '能力轨迹与里程碑', icon: 'receipt', go: 'youth.album' },
        { name: '理财阶梯', desc: '按阶段分层的理财科普', icon: 'plan', go: 'youth.finance' },   /* 035 统名：原「理财知识引导」 */
        { name: '大学阶段财务成长报告', desc: '阶段性的成长总结', icon: 'list', go: 'youth.gradReport' }
      ] },
      { g: '家庭 · 往来', items: [
        { name: '往来', desc: '家里的每一笔与回应', icon: 'chat', go: 'youth.talk' },
        { name: '发起协商', desc: '发起一次额度或支持的协商', icon: 'send', go: 'youth.requestNew' },
        { name: '收到的支持', desc: '家人主动给你的支持', icon: 'heart', go: 'youth.invites' },
        { name: '人情往来', desc: '人情记账与还礼', icon: 'user', go: 'youth.favor' },
        { name: '边界沟通话术', desc: '非对抗的沟通模板', icon: 'mic', go: 'youth.scripts' },
        { name: '支持对账', desc: '和家人核对约定的支持', icon: 'check', go: 'youth.support' }
      ] },
      { g: '安全 · 风险', items: [
        { name: '风险预警', desc: '三级风险提醒与处理', icon: 'shield', go: 'youth.risk' },
        { name: '风险白名单', desc: '哪些场景不再提醒', icon: 'check', go: 'youth.riskWhitelist' },
        { name: '权限自检', desc: '家人能看到什么，一查便知', icon: 'list', go: 'common.contracts' },
        { name: '信息边界', desc: '个人信息与家人可见范围', icon: 'user', go: 'youth.me', drawer: true },
        { name: '省心模式', desc: '减少打扰的模式', icon: 'set', go: 'youth.mode' },
        { name: '授权中心', desc: '授权给谁、授了什么', icon: 'spark', go: 'youth.grants' }
      ] },
      { g: '账户 · 设置', items: [
        { name: '银行卡管理', desc: '卡组、卡详情与角色', icon: 'card', go: 'youth.me' },
        { name: '消息中心', desc: '通知与分享都在这', icon: 'chat', go: 'common.messages' },
        { name: '订阅设置', desc: '提醒的开关集中管理', icon: 'reset', go: 'common.notifyPrefs' },
        { name: '留痕记录', desc: '每一步操作都有记录', icon: 'list', go: 'common.audit' },
        { name: '帮助与说明', desc: '常见问题与说明', icon: 'help', go: 'common.help' },
        { name: '客服与帮助', desc: '智能客服与紧急求助', icon: 'mic', go: 'youth.service' }
      ] }
    ],
    /* 支持人端：按信息边界裁剪（银行卡/流水/订阅/记账类一条不进）+ 专属项 */
    supporter: [
      { g: '状态 · 支持', items: [
        { name: '状态', desc: '余额、发放与风险一览', icon: 'status', go: 'supporter.status' },
        { name: '支持', desc: '登记、响应与邀约', icon: 'plus', go: 'supporter.support' },
        { name: '发放记录', desc: '每笔生活费的去向', icon: 'list', go: 'supporter.payout' }
      ] },
      { g: '方案 · 发放', items: [
        { name: '生活费方案', desc: '每月怎么发、发多少', icon: 'plan', go: 'supporter.plan' },
        { name: '发起生活费方案', desc: '新建或调整一个方案', icon: 'compose', go: 'supporter.planNew' },
        { name: '专项支持', desc: '专款专用的支持', icon: 'shield', go: 'supporter.fund' }
      ] },
      { g: '陪伴 · 成长', items: [
        { name: '陪伴', desc: '家庭互动与时间线', icon: 'heart', go: 'supporter.company' },
        { name: '成长月报', desc: '他这个月的成长', icon: 'chart', go: 'supporter.report' }
      ] },
      { g: '我的 · 边界', items: [
        { name: '我的', desc: '账户与个人信息', icon: 'user', go: 'supporter.me' },
        { name: '查看范围', desc: '你能看到哪些数据', icon: 'download', go: 'supporter.disclosure' }
      ] }
    ]
  };
  const featGroups = role => LJ.FEATURES[role] || LJ.FEATURES.youth;
  const featAll = role => featGroups(role).reduce((a, g) => a.concat(g.items), []);
  /* 034 · 条目键 = go + 参数（「最近使用」按它记人；两个入口指向同一页就并成一条，
     信息边界与银行卡管理同落 youth.me 就是这个道理 —— 记的是去处不是文案）。 */
  const featKey = it => it.go + (it.params && Object.keys(it.params).length
    ? '|' + JSON.stringify(it.params) : '');
  const featFind = (role, key) => featAll(role).filter(it => featKey(it) === key)[0] || null;

  /* ---- 034 · 最近使用：最多 5 条、去重、最新在前；
     只渲染**当前角色目录里还在**的键（支持人端看不到青年端的足迹）。 ---- */
  LJ.featRecent = function (role) {
    let keys = [];
    try { keys = JSON.parse(localStorage.getItem('lj.feat.recent') || '[]'); } catch (e) { keys = []; }
    return (Array.isArray(keys) ? keys : [])
      .map(k => featFind(role || 'youth', k)).filter(Boolean).slice(0, 5);
  };
  function featRecentPush(role, key) {
    try {
      let keys = [];
      try { keys = JSON.parse(localStorage.getItem('lj.feat.recent') || '[]'); } catch (e) { keys = []; }
      if (!Array.isArray(keys)) keys = [];
      keys = [key].concat(keys.filter(k => k !== key)).slice(0, 5);
      localStorage.setItem('lj.feat.recent', JSON.stringify(keys));
    } catch (e) { }
  }

  /* ---- 034 · 搜索：名字 / 说明 / 所属分区 三处匹配；035 加同义词 ----
     「小票」只出现在「记一笔」的**说明**里 —— 只搜名字的实现会漏掉它，
     render 契约与探针专门钉了这条（变异：只搜名字 → 红）。
     ★ 同义词（035 用户口径「搜索要做同义词」）：查询**整词**命中左列时，
       右列的叫法也算数 —— 「记账」找不到「记一笔」、「反诈」找不到「风险预警」，
       这两个词在界面上各说各话，全靠这张表接上。表是"用户会打什么"的白名单，
       不做词干/拼音（41 条的量级，子串 + 这张表够用）。 */
  const FEAT_SYN = {
    '记账': ['记一笔', '流水'],
    '账单': ['流水', '脱敏账单'],
    '分享': ['脱敏账单'],
    '反诈': ['风险'],
    '理财': ['阶梯'],
    '知识': ['阶梯'],
    '提醒': ['订阅'],
    '通知': ['订阅', '消息'],
    '帮助': ['客服'],
    '客服': ['帮助'],
    '家人': ['家庭', '协商', '支持'],
    '家庭': ['家人', '协商'],
    '存钱': ['储蓄'],
    '钱': ['储蓄', '生活费', '预算'],
    '隐私': ['权限', '信息边界', '留痕'],
    '查账': ['留痕', '权限自检'],
    '余额': ['生活费', '还剩']
  };
  LJ.featSearch = function (role, query) {
    const s = (String(query || '')).trim().toLowerCase();
    if (!s) return featAll(role);
    const gs = featGroups(role);
    const syn = (FEAT_SYN[s] || []).map(t => String(t).toLowerCase());
    const hay = it => (it.name + ' ' + it.desc + ' ' +
      gs.filter(g => g.items.indexOf(it) >= 0).map(g => g.g).join(' ')).toLowerCase();
    return featAll(role).filter(it => {
      const h = hay(it);
      if (h.indexOf(s) >= 0) return true;
      return syn.some(t => h.indexOf(t) >= 0);
    });
  };

  /* ---- 抽屉的头（把手区里 sticky 的那块）：标题 + 关闭 + 搜索 + 分区 chip ---- */
  function featHead(groups) {
    return '<div class="feat-hd"><h3>全部功能</h3>' +
      '<button class="feat-x" data-feat-x aria-label="关闭">✕</button></div>' +
      '<div class="feat-q"><input data-feat-q type="search" autocomplete="off" ' +
      'placeholder="搜功能：名字或关键词，如「预算」「小票」"></div>' +
      '<div class="feat-chips">' + groups.map((g, i) =>
        '<i data-fchip="' + i + '"' + (i === 0 ? ' class="on"' : '') + '>' +
        UI.esc(g.g) + '</i>').join('') + '</div>';
  }
  /* ---- 单列行条目 / 分区（最近使用、常规分区、搜索结果共用一套渲染） ---- */
  function featRow(it) {
    return '<button class="feat-item" data-fgo="' + it.go + '"' +
      (it.drawer ? ' data-fdrawer="1"' : '') +
      " data-fp='" + JSON.stringify(it.params || {}) + "'>" +
      '<span class="feat-ic">' + UI.icon(it.icon, 18) + '</span>' +
      '<span class="feat-tx"><b>' + UI.esc(it.name) + '</b>' +
      '<i>' + UI.esc(it.desc) + '</i></span>' +
      '<span class="feat-ar">›</span></button>';
  }
  function featSec(key, title, items) {
    return '<div class="feat-sec" data-fsec="' + key + '">' +
      '<div class="fs-t">' + UI.esc(title) + '</div>' +
      '<div class="feat-list">' + items.map(featRow).join('') + '</div></div>';
  }
  /* 035 · 「产品导览」置顶行（用户：「导览按钮藏得太深了」—— 它原来只在开发
     面板里）。钉在抽屉 body 最上面（不进 LJ.FEATURES：条目数/分区数的判据不动，
     搜索也不用覆盖它 —— 它永远在第一行，搜出来反而多余）。 */
  const FEAT_GUIDE_ROW = '<button class="feat-guide" data-fact="tour">' +
    '<span class="feat-ic">' + UI.icon('spark', 18) + '</span>' +
    '<span class="feat-tx"><b>产品导览</b>' +
    '<i>30 秒走一遍：UI 长什么样、功能都在哪</i></span>' +
    '<span class="feat-ar">▶</span></button>';
  function featBody(groups, role) {
    const rec = LJ.featRecent(role || 'youth');
    return FEAT_GUIDE_ROW +
      (rec.length ? featSec('recent', '最近使用', rec) : '') +
      groups.map((g, i) => featSec(i, g.g, g.items)).join('');
  }
  LJ.featuresHead = role => featHead(featGroups(role));
  LJ.featuresBody = role => featBody(featGroups(role), role);
  /* 搜索态的体：命中 = 单个「搜索结果」分区；没命中 = 一句话空态 */
  LJ.featuresBodyQuery = function (role, query) {
    const hits = LJ.featSearch(role, query);
    if (!hits.length) return '<div class="feat-none">没找到「' + UI.esc(query) +
      '」—— 换个说法试试，比如「预算」「小票」「分享」</div>';
    return featSec('q', '搜索结果 · ' + hits.length, hits);
  };

  /* ---- 打开抽屉（overlay，不进路由栈） ----
     034 · 点击改**事件委托**（sheet 上一个 listener）：搜索会整块重画 body，
     逐条 onclick 一重画就掉线 —— 委托的监听挂在外层，重画多少次都活着。 */
  LJ.featuresOpen = function () {
    if (LJ._featSheet) return LJ._featSheet;
    if (LJ.router && LJ.router.animating) return null;      /* 转场期间不接（030① 同款） */
    const role = (LJ.session && LJ.session.get && LJ.session.get().role) || 'youth';
    const groups = featGroups(role);
    const sh = UI.sheet({
      full: true,
      head: featHead(groups),
      body: '<div data-fbody>' + featBody(groups, role) + '</div>',
      mount(sheet, close) {
        const nav = b => {
          const page = b.getAttribute('data-fgo');
          let params = {};
          try { params = JSON.parse(b.getAttribute('data-fp') || '{}'); } catch (e) { params = {}; }
          featRecentPush(role, featKey({ go: page, params: params }));   /* 034 · 最近使用 */
          const deepDrawer = b.getAttribute('data-fdrawer') === '1';
          close();                                    /* 先收抽屉，再转场（两个动画不打架） */
          setTimeout(() => {
            try {
              const tabs = LJ.TABS[(LJ.session.get() || {}).role] || [];
              const isTab = tabs.some(t => t.page === page);
              if (isTab) LJ.router.reset(page, params);   /* tab 页不往栈里堆 */
              else LJ.router.push(page, params);
            } catch (e) { }
            if (deepDrawer) setTimeout(() => {          /* 信息边界 → 「我的」+ 右侧抽屉 */
              const a = document.getElementById('navAva');
              if (a) a.click();
            }, 430);
          }, 170);
        };
        sheet.addEventListener('click', e => {
          const t = e.target;
          if (!t || !t.closest) return;
          if (t.closest('[data-feat-x]')) { close(); return; }
          /* 035 · 置顶「产品导览」行：先收抽屉再开导览（两个动画不打架）。
             act 类条目不走路由 —— 这是 catalog 里唯一一条"点了不跳页"的入口。 */
          if (t.closest('[data-fact="tour"]')) {
            close();
            setTimeout(() => { try { LJ.coachStart(); } catch (e) { } }, 220);
            return;
          }
          const chip = t.closest('[data-fchip]');
          if (chip) {
            const sec = sheet.querySelector('[data-fsec="' + chip.getAttribute('data-fchip') + '"]');
            if (!sec) return;
            sheet.querySelectorAll('[data-fchip]').forEach(x => x.classList.remove('on'));
            chip.classList.add('on');
            const head = sheet.querySelector('.sheet-gz');
            sheet.style.scrollBehavior = 'smooth';
            /* 对齐到把手区下方（sticky 会盖住 section 标题，扣掉它的高） */
            sheet.scrollTop = Math.max(0, sec.offsetTop - (head ? head.offsetHeight : 0) - 8);
            return;
          }
          const item = t.closest('[data-fgo]');
          if (item) nav(item);
        });
        /* 034 · 搜索：边打边筛（输入框在把手区里，重画只动 [data-fbody]，
           焦点不丢）；有查询时 chip 轨道让位（.feating），清空即恢复全册。 */
        const inp = sheet.querySelector('[data-feat-q]');
        if (inp) inp.addEventListener('input', () => {
          const qv = inp.value.trim();
          const body = sheet.querySelector('[data-fbody]');
          if (!body) return;
          sheet.classList.toggle('feating', !!qv);
          body.innerHTML = qv ? LJ.featuresBodyQuery(role, qv) : featBody(groups, role);
        });
      },
      onClose() { LJ._featSheet = null; }
    });
    LJ._featSheet = sh;
    return sh;
  };
  LJ.featuresToggle = function () {
    if (LJ._featSheet) LJ._featSheet.close();
    else LJ.featuresOpen();
  };

  /* ============================================================
     左缘右滑返回（010 · G5）
     ------------------------------------------------------------
     屏幕左缘 24px 内起手、认轴为横且向右才接管；拖动时顶层跟手 1:1、
     下层从 -24% 视差归位、透明度同步；松手「过 4 成宽 或 快甩」就返回。
     收尾值直接对齐 CSS 的 pop / behind 移除态 —— 调 R.pop() 时 inline 与
     类同值，不会跳变（动画途中可再抓住：matrixX 从屏幕当前值接续）。
     ★ shared / zoomFrom 页也接（010 遗留第 ④ 条滑动机会，用户拍板要做）：
       commit 时给 pop 传 {edge:true} —— shared 页走 popShared 的边缘分支
       （层状态不重置、克隆从卡的当前可见位置起飞、下层渐进归位不瞬跳）；
       zoom 页走普通横移收尾（_playClose 第一帧是整屏实心块，跟手 40% 后
       突然铺满就是跳变；跟手方向本身就是"推走"，横移即收尾、舍覆盖层缩回）。
     ★ prev 跟手必须相对它的起点（basePrev/basePrevOp）：普通/shared 页从
       behind 态（-24%/.5）归位，zoom 页的下层是 _pushSilent 压进来的、
       没有 behind（本来就在 0/1）—— 旧的绝对公式会让它第一帧瞬跳。
     ★ 弹层/抽屉开着时不接（左缘归它们）；拖动期挂 R.animating 挡别的转场，
       commit 前复位放行 pop()；mouse 指针不接（桌面别抢文本选择）。 */
  let edgeBoundScreen = null;
  let edgeCancelTimer = null;
  function bindEdgeBack() {
    const screen = document.getElementById('screen');
    if (!screen || edgeBoundScreen === screen) return;
    edgeBoundScreen = screen;
    const R = LJ.router, GS = LJ.gest;
    let dr = null;
    const T = () => 'transform ' + UI.motion('--dur-ui') + 'ms ' + UI.ease('--ease-ui') +
      ', opacity ' + UI.motion('--dur-ui') + 'ms ' + UI.ease('--ease-ui');

    screen.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse') return;
      if (dr) return;
      if (edgeCancelTimer) {                 /* 回弹途中再抓住：从当前值接续 */
        clearTimeout(edgeCancelTimer); edgeCancelTimer = null;
        R.animating = false;
      }
      if (R.animating || R._zoom) return;
      if (R.stack.length <= 1) return;
      const sr = document.getElementById('sheet-root');
      if (sr && sr.childNodes.length) return;          /* 弹层/抽屉开着：左缘归它们 */
      const rect = screen.getBoundingClientRect();
      if (e.clientX - rect.left > 24) return;          /* 只认左缘 24px */
      const cur = R.current();
      if (!cur) return;                        /* shared / zoomFrom 页也接：见块首注释 */
      const prevEnt = R.stack[R.stack.length - 2];
      if (!cur.layer || !prevEnt || !prevEnt.layer) return;
      dr = {
        id: e.pointerId, x0: e.clientX, y0: e.clientY, claimed: false,
        top: cur.layer, prev: prevEnt.layer,
        W: screen.clientWidth || 375, x: 0,
        pts: [{ x: e.clientX, y: e.clientY, t: Date.now() }]
      };
      try { screen.setPointerCapture(e.pointerId); } catch (err) { }
    }, true);

    screen.addEventListener('pointermove', e => {
      if (!dr || e.pointerId !== dr.id) return;
      const dx0 = e.clientX - dr.x0, dy0 = e.clientY - dr.y0;
      dr.pts.push({ x: e.clientX, y: e.clientY, t: Date.now() });
      if (dr.pts.length > 12) dr.pts.shift();
      if (!dr.claimed) {
        const ax = GS.dirLock(dx0, dy0);
        if (!ax) return;
        if (ax !== 'x' || dx0 <= GS.TH) { if (ax === 'y' || dx0 < -GS.TH) dr = null; return; }
        dr.claimed = true;
        GS.edgeActive = true;      /* 本指针归边缘返回：G.track 在同一事件里会让路 */
        R.animating = true;
        dr.base = GS.matrixX(dr.top); dr.basePrev = GS.matrixX(dr.prev);
        dr.basePrevOp = parseFloat(getComputedStyle(dr.prev).opacity) || 0.5;
        dr.top.style.transition = 'none';
        dr.prev.style.transition = 'none';
      }
      let x = dr.base + dx0;
      if (x > dr.W) x = dr.W + GS.rubberband(x - dr.W, dr.W);
      if (x < 0) x = 0;
      dr.x = x;
      const p = Math.max(0, Math.min(1, x / dr.W));
      dr.top.style.transform = 'translateX(' + x + 'px)';
      dr.top.style.opacity = String(1 - 0.6 * p);
      /* prev 相对它的起点插值（块首注释）：普通/shared 页 basePrev=-24%、
         zoom 页 =0 —— 绝对公式会让 zoom 页下层第一帧瞬跳 -24%/.5 */
      dr.prev.style.transform = 'translateX(' + (dr.basePrev * (1 - p)) + 'px)';
      dr.prev.style.opacity = String(dr.basePrevOp + (1 - dr.basePrevOp) * p);
    }, true);

    const settleEdge = (d, commit) => {
      const dur = UI.motion('--dur-ui');
      d.top.style.transition = T(); d.prev.style.transition = T();
      if (commit) {
        d.top.style.transform = 'translateX(' + d.W + 'px)';
        d.top.style.opacity = '0.4';
        d.prev.style.transform = 'translateX(0)';
        d.prev.style.opacity = '1';
        R.animating = false;                 /* pop 的互斥检查要放行 */
        /* edge 标记：shared 页 → popShared 边缘分支（层不重置、克隆从当前
           位置起飞）；zoom 页 → 普通横移收尾（覆盖层收尾会整屏铺满=跳变） */
        R.pop({ edge: true });               /* 普通页 inline 与 .pop / behind 移除态同值 → 不跳 */
        const pv = d.prev;
        setTimeout(() => {
          if (pv.parentNode) {
            pv.style.transition = ''; pv.style.transform = ''; pv.style.opacity = '';
          }
        }, dur + 30);
      } else {
        d.top.style.transform = 'translateX(0)';
        d.top.style.opacity = '1';
        d.prev.style.transform = 'translateX(' + d.basePrev + 'px)';   /* 回各自起点 */
        d.prev.style.opacity = String(d.basePrevOp);
        edgeCancelTimer = setTimeout(() => {
          edgeCancelTimer = null;
          [d.top, d.prev].forEach(l => {
            if (!l.parentNode) return;
            l.style.transition = ''; l.style.transform = ''; l.style.opacity = '';
          });
          R.animating = false;
        }, dur + 10);
      }
    };

    const end = (e, cancelled) => {
      if (!dr || (e && e.pointerId !== dr.id)) return;
      const d = dr; dr = null;
      GS.edgeActive = false;
      try { screen.releasePointerCapture(d.id); } catch (err) { }
      if (!d.claimed) return;
      GS.swallowClick();
      if (cancelled) { settleEdge(d, false); return; }
      const v = GS.velocity(d.pts, Date.now());
      /* 阈值用**手势增量**（clientX-x0，天然不受入场基线/橡皮筋钳制影响）：
         抓在页面入场动画中途时，matrix 基线带着入场进度、x 还可能被橡皮筋
         钳过 —— 拿 d.x-d.base 判会把大拖判不足（010 探针 ⑤ 抓过）。 */
      const delta = e && typeof e.clientX === 'number' ? e.clientX - d.x0 : d.x - d.base;
      settleEdge(d, delta >= 0.4 * d.W || (v.vx >= GS.FLING && delta > 4));
    };
    screen.addEventListener('pointerup', e => end(e, false), true);
    screen.addEventListener('pointercancel', e => end(e, true), true);
  }

  /* ============================================================
     017 · 横滑切 Tab（挂起项①）+ 下拉刷新（挂起项②）
     ------------------------------------------------------------
     用户拍板：010 挂起的三条滑动机会全部落地（tab 横滑 / 下拉刷新 /
     待办·订阅行左滑 —— 后者的接线在页面侧，这里只管前两条）。

     tab 横滑：
     · 与 010 的 B1-B4 同哲学 —— 手势只是「点相邻 tab 按钮」的快捷方式，
       不另写转场：认轴（10px 迟滞）→ 松手过线/快甩 → click 相邻
       [data-tab]，整屏横移复用 slideTo（004 恢复的那套，可打断）。
     · 起点闸（ignore，010 的 ignore 规则照搬 + 屏幕级补全）：
       .sw 行滑 / #lgStage .rv-stage .cm-stage 页内横滑 / chips 轨道 /
       .sub-viewport 原生横滚 / data-swipe-none（页面级横滑自报：
       favorPerson 的 B4 就挂在这类层上）/ tabbar·fab 点按区 —— 归它们。
     · 位置闸：当前页必须正好是某个 tab 的根页（深层页横滑是边缘返回和
       页内横滑的地盘）；首尾 tab 不循环，滑了不动。
     · mouse 不接：桌面横拖是文本选择手势（与边缘返回同一条理由）。
     · 阈值：|dx| ≥ 64px 或 |vx| ≥ FLING —— 快甩看速度符号、慢放看距离
       （Apple 规则，和 settle 同源）。
     · 捕获走 lazyCapture（见 ui.js G.track）：认轴成功才 setPointerCapture，
       不会抢走元素级手势已经拿到的指针。

     下拉刷新：
     · 只在栈顶 scrollTop==0 且**向下**拉时认（010 G2 同一条铁律）：认轴
       为 y 且 dy>0 才接管，否则撒手交还原生滚动。
     · 跟手：.page-body 下移 0.5×（上限 120px），顶上露出 .ptr 指示器随
       进度转圈，过 56px 变 armed；松手过线（或快甩向下）→ 转圈 650ms →
       归位 → R.refresh()（数据总线用的同一个）+ toast「已刷新」。
       本地数据是即时的，650ms 是「让手指看见发生了什么」的最短演出。
     · 弹层/抽屉、转场中、内嵌滚动区（.ai-body 聊天）、输入法目标不认。
     · 见证人：#screen[data-ptr] 每成功刷新一次自增（探针红绿的锚点）。 */
  const TAB_SWIPE_MIN = 64;   /* 横滑 commit 最小位移（px） */
  const PTR_LINE = 56;        /* 下拉过线（px，跟手后） */
  const PTR_MAX = 120;        /* 下拉跟手上限（px） */

  const gestureZones =
    '.sw, #lgStage, .rv-stage, .cm-stage, .sub-viewport,' +
    /* 032 · 堆叠卡组（流水页 每日收支↔订阅、支出结构页 黑卡↔柱状图）：横滑归它，
       不加这一条的话屏幕级 tab 横滑会把"切卡"吃成"切 tab"（探针实测：拖到一半
       页面直接换了一页，堆叠从 DOM 里消失 —— 变异测试里这条红过）。 */
    '.cs-wrap,' +
    '[data-swipe-none], .tabbar, .fab, .drawer';

  let tabBoundScreen = null;
  function bindTabSwipe() {
    const screen = document.getElementById('screen');
    if (!screen || tabBoundScreen === screen) return;
    tabBoundScreen = screen;
    const GS = LJ.gest, R = LJ.router;
    const curTabIdx = () => {
      const tabs = LJ.TABS[LJ.session.get().role] || [];
      const cur = R.current();
      if (!cur) return { tabs, ci: -1 };
      return { tabs, ci: tabs.findIndex(t => t.page === cur.name) };
    };
    GS.track(screen, {
      axis: 'x',
      lazyCapture: true,
      ignore: e => {
        if (e.pointerType === 'mouse') return true;
        if (e.target && e.target.closest &&
          e.target.closest(gestureZones + ', [data-m], [data-cat]')) return true;
        const sr = document.getElementById('sheet-root');
        if (sr && sr.childElementCount) return true;
        return curTabIdx().ci < 0;   /* 深层页：横滑不归本手势（在 ignore 就撤，不捕获） */
      },
      onEnd(d) {
        if (!d.axis) return;
        const { tabs, ci } = curTabIdx();
        if (ci < 0) return;
        let goNext;
        if (Math.abs(d.vx) >= GS.FLING) goNext = d.vx < 0;
        else if (Math.abs(d.dx) >= TAB_SWIPE_MIN) goNext = d.dx < 0;
        else return;
        const ni = goNext ? ci + 1 : ci - 1;
        if (ni < 0 || ni >= tabs.length) return;   /* 边界不循环 */
        const btn = document.querySelector('.tabbar [data-tab="' + tabs[ni].id + '"]');
        /* silentClick：finish 先吞了 350ms 再进本回调，自家合成的点击要放行 */
        if (btn) GS.silentClick(() => btn.click());
      }
    });
  }

  let ptrBoundScreen = null;
  function bindPullRefresh() {
    const screen = document.getElementById('screen');
    if (!screen || ptrBoundScreen === screen) return;
    ptrBoundScreen = screen;
    const GS = LJ.gest, R = LJ.router;
    let busy = false;
    let ps = null;   /* { layer, body, ptr, pull } */

    const makePtr = layer => {
      let p = layer.querySelector(':scope > .ptr');
      if (!p) {
        p = document.createElement('div');
        p.className = 'ptr';
        p.innerHTML = '<i></i>';
        layer.insertBefore(p, layer.firstChild);
      }
      return p;
    };
    const clearPtr = p => {
      if (p) p.classList.remove('on', 'armed', 'spin');
    };
    /* 归位：transform 清回 0（带令牌过渡），指示器淡出 */
    const snapBack = (p, removeAfter) => {
      if (!p) return;
      const dur = UI.motion('--dur-ui');
      p.body.style.transition = 'transform ' + dur + 'ms ' + UI.ease('--ease-ui');
      p.body.style.transform = '';
      clearPtr(p.ptr);
      const body = p.body, ptr = p.ptr;
      setTimeout(() => {
        if (body && body.parentNode) body.style.transition = '';
        if (removeAfter && ptr && ptr.parentNode) ptr.remove();
      }, dur + 60);
    };

    GS.track(screen, {
      axis: 'y',
      lazyCapture: true,
      ignore: e => {
        if (e.pointerType === 'mouse') return true;
        if (busy || ps) return true;
        if (R.animating || R._zoom) return true;
        if (e.target && e.target.closest &&
          e.target.closest(gestureZones + ', .ai-body, input, textarea, select, [contenteditable]')) return true;
        const sr = document.getElementById('sheet-root');
        if (sr && sr.childElementCount) return true;
        const cur = R.current();
        if (!cur || !cur.layer || cur.layer.scrollTop > 0) return true;   /* 只在顶部 */
        return false;
      },
      onClaim(d) {
        if (d.dy <= 0) return;                       /* 只认向下 */
        const cur = R.current();
        if (!cur || !cur.layer || cur.layer.scrollTop > 0) return;
        const body = cur.layer.querySelector('.page-body');
        if (!body) return;
        const ptr = makePtr(cur.layer);
        ps = { layer: cur.layer, body, ptr, pull: 0 };
        body.style.transition = 'none';
        ptr.classList.add('on');
      },
      onMove(d) {
        if (!ps || d.dy <= 0) return;
        let pull = d.dy * 0.5;
        if (pull > PTR_MAX) pull = PTR_MAX;
        ps.pull = pull;
        ps.body.style.transform = 'translateY(' + pull + 'px)';
        ps.ptr.classList.toggle('armed', pull >= PTR_LINE);
        ps.ptr.querySelector('i').style.transform =
          'rotate(' + Math.min(360, Math.round(pull / PTR_LINE * 360)) + 'deg)';
      },
      onEnd(d) {
        const p = ps; ps = null;
        if (!d.axis || !p) return;
        const commit = p.pull >= PTR_LINE || (d.vy >= GS.FLING && d.dy > 30);
        if (!commit) { snapBack(p, true); return; }
        busy = true;
        const scr = document.getElementById('screen');
        if (scr) {
          scr.setAttribute('data-ptr',
            String((parseInt(scr.getAttribute('data-ptr'), 10) || 0) + 1));
        }
        p.ptr.classList.add('spin');
        /* 清掉拖动期写死的 rotate（360° 的隐式 from==to 会让关键帧原地不动） */
        const spinI = p.ptr.querySelector('i');
        if (spinI) spinI.style.transform = '';
        setTimeout(() => {
          snapBack(p, false);
          setTimeout(() => {
            try { R.refresh(); } catch (err) { /* 页面已换，无碍 */ }
            UI.toast('已刷新');
            busy = false;
            if (p.ptr && p.ptr.parentNode) p.ptr.remove();   /* refresh 会重建层内 DOM，兜底 */
          }, UI.motion('--dur-ui') + 80);
        }, 650);
      },
      onCancel() {
        const p = ps; ps = null;
        if (p) snapBack(p, true);
      }
    });
  }

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
      /* 032 · 数据自愈：版本对得上但数据本身缺归属/缺卡（坑 41 那类老毛病）——
         升级路径修不到它们，这里每次都把不变量补回实处（幂等、写实才算数）。 */
      try { if (LJ.seed.heal) LJ.seed.heal(); } catch (e) { console.warn('heal 失败', e); }

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
        /* 033 · 首页右上角「全部功能」悬浮入口（唯一新增常驻元素；显隐由
           syncChrome 按「当前页是不是本角色根页」切换，样式 .hd-feat） */
        '<button class="hd-feat hidden" id="hdFeat" aria-label="全部功能">' +
        UI.icon('grid', 34, 'feat-grid') + '</button>' +
        '</div></div></div>';

      this.screen = document.getElementById('screen');
      this.hdFeat = document.getElementById('hdFeat');
      if (this.hdFeat) this.hdFeat.onclick = () => LJ.featuresToggle();
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
      /* ?shared=1 / ?zoom=1 / ?zoom2=1 ：进首页后自动点卡片，便于截转场中间帧。
         024：能力轨迹卡从流水页搬去了「我的」页 —— zoom2 先保证到位再点（当前页
         找不到 [data-zoom-push] 就 reset 到「我的」），老 URL 和手敲 ?zoom2=1
         都不再哑火。 */
      const findGrowCard = () => {
        let c = document.querySelector('[data-zoom-push]');
        if (!c) {
          try { LJ.router.reset('youth.me'); } catch (e) { }
          c = document.querySelector('[data-zoom-push]');
        }
        return c;
      };
      if (q && (q.get('shared') || q.get('zoom') || q.get('zoom2'))) {
        setTimeout(() => {
          const c = q.get('zoom2') ? findGrowCard() : document.querySelector('[data-zoom-src]');
          if (c) c.click();
        }, 60);
      }
      /* ?zoom2back=1 ：展开成长中心后再点返回，验证收回落点 */
      if (q && q.get('zoom2back')) {
        setTimeout(() => {
          const c = findGrowCard();
          if (c) c.click();
        }, 60);
        setTimeout(() => {
          const b = document.getElementById('navBack');
          if (b) b.click();
        }, 1400);
      }
      /* ?tab=ai,home ：依次点若干底栏 tab（间隔 250ms），便于验证滑动方向
         每次点击后 120ms 自报告一次层状态到 #tabmark（data-tap0/1…、data-active0/1…）。
         ★ 为什么要自报告：probe-tab 用 --dump-dom 采样时，预算锚在**导航**、
           而这里的定时器锚在**脚本执行** —— 冷启动慢一点（比如 me 页要解 3 张
           卡面 JPEG），第二次点击就落在采样点之后，探针会抖。
           锚点改成"点击之后 120ms"，采样就跟加载快慢无关了。 */
      if (q && q.get('tab')) {
        const tabMark = () => {
          let d = document.getElementById('tabmark');
          if (!d) { d = document.createElement('div'); d.id = 'tabmark'; document.body.appendChild(d); }
          return d;
        };
        q.get('tab').split(',').forEach((id, i) => {
          setTimeout(() => {
            const b = document.querySelector('[data-tab="' + id.trim() + '"]');
            if (b) b.click();
            setTimeout(() => {
              const m = tabMark();
              m.setAttribute('data-tap' + i,
                [].slice.call(document.querySelectorAll('#app-host .page-layer'))
                  .map(l => l.className).join(' | '));
              const act = document.querySelector('.tabbar button.active');
              m.setAttribute('data-active' + i, act ? (act.getAttribute('data-tab') || '?') : '?');
            }, 120);
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
      /* ?zoom3=1 ：进「我的」后自动点卡组（022 起「我的」页就是银行卡管理内容，
         点卡直接进卡片详情 —— 验的是共享元素转场的落位） */
      if (q && q.get('zoom3')) {
        setTimeout(() => {
          const c = document.querySelector('.cm-card.on');
          if (c) c.click();
        }, 400);
      }
      /* ?ava=1 ：进「我的」后自动点右上角头像，开右侧个人信息抽屉。
         无头浏览器不推进 CSS 过渡，抽屉会停在屏幕外 —— 这里把它钉到终态
         （截图与 DOM 取证都要它：退出登录、消息中心都在抽屉里）。
         只影响带 ?ava= 的调试链接。 */
      if (q && q.get('ava')) {
        setTimeout(() => {
          const b = document.getElementById('navAva');
          if (b) b.click();
        }, 700);
        setTimeout(() => {
          const p = document.querySelector('#sheet-root .drawer');
          const m = document.querySelector('#sheet-root .drawer-mask');
          if (p) { p.style.transition = 'none'; p.classList.add('on'); }
          if (m) { m.style.transition = 'none'; m.classList.add('on'); }
        }, 1400);
      }
      /* ?sbset=1 ：预置推演设置（起止日期 = 今天起 14 天，起始 ¥1000，每天基本开支 ¥100）。
         030 起沙盘默认是"设置门"（不给假数据），check-live / 探针 / 截图要图上的
         确定性状态就带这个参数 —— 必须跑在 ?sbAmt 之前：先有边界，再种决策。
         只影响带这个参数的调试链接。 */
      if (q && q.get('sbset') && LJ.sandboxSetup) {
        const t0 = LJ.clock.now();
        LJ.sandboxSetup({
          start: t0, end: U.addDays(t0, 14),
          amount: 1000, perDay: 100
        });
      }
      /* ?sbAmt=200 ：在推演页预置一笔待定消费（可带 &sbDay=3 指定第几天）。
         026 的沙盘是全屏页，链接直接落在 ?p=youth.sandbox&sbAmt=200 就能
         确定性地取到"有分支"的状态 —— check-live 与探针都靠它，
         风格对齐上面的 ?ava=1。只影响带这个参数的调试链接。 */
      if (q && q.get('sbAmt') && LJ.sandboxSeed) {
        LJ.sandboxSeed(q.get('sbAmt'), q.get('sbDay') || 0);
      }
      /* ?sbbr=1 ：把当前这套买/不买存成一条分支（要带 sbAmt 先种一笔）——
         线上体检要看到图上真的画着一条自定义分支线。只影响带这个参数的调试链接。 */
      if (q && q.get('sbbr') && LJ.sandboxBranchSave) {
        LJ.sandboxBranchSave('省钱版');
      }
      /* 弹层终态钉住（同 ?ava=1 的做法）：无头浏览器不推进 CSS 过渡，
         截图会抓到"刚滑上来一半"的弹层 —— 只影响带这些参数的调试链接。 */
      const pinSheets = () => {
        const sh = document.querySelector('#sheet-root .sheet');
        const mk = document.querySelector('#sheet-root .sheet-mask');
        if (sh) { sh.style.transition = 'none'; sh.classList.add('on'); }
        if (mk) { mk.style.transition = 'none'; mk.classList.add('on'); }
      };
      /* ?sbrule=1 ：推演页自动点「记成下期约定」，把（门槛可改 + 先预览）那个弹层打开 */
      if (q && q.get('sbrule')) {
        setTimeout(() => {
          const r = document.querySelector('[data-sb-rule]');
          if (r) r.click();
        }, 700);
        setTimeout(pinSheets, 1200);
      }
      /* ?sbdrawer=1 ：推演页自动点右下角圆点，把输入抽屉打开
         （028 起输入在抽屉里；截图与线上取证都要它） */
      if (q && q.get('sbdrawer')) {
        setTimeout(() => {
          const f = document.querySelector('[data-sb-fab]');
          if (f) f.click();
        }, 700);
        setTimeout(pinSheets, 1200);
      }
      /* ?sbsetup=1 ：推演页自动打开「推演设置」弹层（订酒店式日历，
         030 新件 —— 截图与线上取证要它）。和上面两个钩子同款时序。 */
      if (q && q.get('sbsetup')) {
        setTimeout(() => {
          const s = document.querySelector('[data-sb-setup]');
          if (s) s.click();
        }, 700);
        setTimeout(pinSheets, 1200);
      }
      /* ?feat=1 ：直接拉起「全部功能」抽屉（截图与线上取证；时序对齐 ?ava=1：
         700ms 点开 → 1200ms 把弹层钉到终态 —— 无头浏览器不推进 CSS 过渡）。
         034 加 ?featq=xx：开完顺手把搜索词打进输入框（截图「搜索结果」态）。 */
      if (q && q.get('feat')) {
        setTimeout(() => { if (LJ.featuresOpen) LJ.featuresOpen(); }, 700);
        if (q.get('featq')) setTimeout(() => {
          const i = document.querySelector('#sheet-root [data-feat-q]');
          if (i) { i.value = q.get('featq'); i.dispatchEvent(new Event('input')); }
        }, 1050);
        setTimeout(pinSheets, 1550);
      }
      /* 034 · 导览三兄弟的开场开关：
           ?coach=1/0 —— 功能导览强制弹 / 强制不弹（缺省：裸开才自动弹一次）
           ?sbg=1     —— 沙盘引导强制弹（缺省：裸开 + 首次进入才自动弹）
         ★ "裸开" = 无参数 **且不在 tools/ 里** —— `_probe-*.html` / `_shot.html`
           这些宿主页也是"无参数"，不排除的话 coach 会盖在探针头上（6 个探针
           第一版就这么被它挡了）；带参数的链接一律不自动弹（判据的护身符）。 */
      const bareOpen = !location.search && !/\/tools\//.test(location.pathname);
      if (q && q.get('coach') != null) this._coachWant = q.get('coach') === '1' ? 'force' : 0;
      else this._coachWant = bareOpen ? 'auto' : 0;
      if (q && q.get('sbg')) LJ._sbgForce = q.get('sbg') === '1';
      /* ?sbcday=1 ：开抽屉 + 点日期按钮，把抽屉里的当月日历展开
         （030-r2 抽屉日期换日历的截图与线上取证） */
      if (q && q.get('sbcday')) {
        setTimeout(() => {
          const f = document.querySelector('[data-sb-fab]');
          if (f) f.click();
        }, 700);
        setTimeout(() => {
          const d = document.querySelector('[data-sb-daybtn]');
          if (d) d.click();
        }, 1100);
        setTimeout(pinSheets, 1600);
      }
      /* ?sbcur=1 ：把指针按到图中段再抬起 —— 游标与"日期在轴行/余额贴点"的
         读数要留着（030-r2 截图与线上取证；headless 截图没有真人指针，得模拟） */
      if (q && q.get('sbcur')) {
        setTimeout(() => {
          const svg = document.querySelector('[data-sb-fig] .sb-ch');
          if (!svg) return;
          const r = svg.getBoundingClientRect();
          const x = r.left + r.width * 0.45;
          ['pointerdown', 'pointermove', 'pointerup'].forEach(t => {
            svg.dispatchEvent(new PointerEvent(t, { clientX: x, bubbles: true }));
          });
        }, 900);
        setTimeout(pinSheets, 1500);
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
        '<div class="hero" style="font-size:44px;margin-top:16px">临界</div>' +
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
          'display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:700;flex:none">' +
          UI.esc(u.avatar) + '</span>' +
          '<span style="flex:1;min-width:0"><span style="display:block;font-size:17px;font-weight:800">' + UI.esc(u.name) + '</span>' +
          '<span style="display:block;font-size:12.5px;color:var(--muted);margin-top:3px;font-weight:500">' +
          LJ.ROLE_LABEL[u.role] + ' · ' + UI.esc(u.nickname) + '</span></span>' +
          '<span style="color:var(--muted);font-size:17px">›</span></button>').join('') +
        '<div class="xs muted" style="margin-top:14px;line-height:1.7;text-align:center">' +
        '数据仅保存在本机浏览器，不会上传服务器</div>' +
        '</div></div>';

      root.querySelectorAll('[data-login]').forEach(b => {
        b.onclick = () => {
          const id = b.getAttribute('data-login');
          const u = LJ.store.find('user', id);
          LJ.session.set(id, u.role);
          /* 035 · 用户口径「登录的时候自动出现产品导览」：登录这一刻预备上，
             落到根页时 maybeCoach 开跑（lj.coach.seen 挡第二遍）。
             深链 ?u= 自动进入的不走登录页 → 不预备 → 测试/截图永远不被打扰。 */
          App._coachWant = 'auto';
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
          '<span>' + t.name + '</span>' +
          '<i class="tab-badge" data-badge="' + t.id + '" hidden></i></button>').join('') +
        '</nav>';

      this.navbar = document.getElementById('navbar');
      this.host = document.getElementById('page-host');
      this.tabbar = document.getElementById('tabbar');
      this.fab = document.getElementById('fab');

      LJ.router.init(this.host);
      bindEdgeBack();   /* 010 · 左缘右滑返回：#screen 每次 enter 都在，幂等打标 */
      bindTabSwipe();   /* 017 · 横滑切 Tab（挂起项①），同上幂等 */
      bindPullRefresh();/* 017 · 下拉刷新（挂起项②），同上幂等 */

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

          /* 跨 tab：整屏横移，方向按 tab 的左右位置（跟翻页一个直觉）。
             plans/003 曾改瞬切，用户否决后恢复 —— 但走动效令牌，不再手写时长/曲线。 */
          const curIdx = tabs.findIndex(x => x.page === curName);
          const nextIdx = tabs.findIndex(x => x.id === t.id);
          const dir = curIdx >= 0 && nextIdx < curIdx ? 'right' : 'left';
          LJ.router.slideTo(t.page, {}, dir);
        };
      });

      /* 悬浮按钮：青年端 = 记一笔（016），支持人端进支持页 */
      this.fab.onclick = () => {
        if (role === 'youth') {
          if (LJ.openEntrySheet) LJ.openEntrySheet();
          /* 兜底：记账入口万一不在，落到全屏沙盘（026 起 openSpendSheet 已并入页面） */
          else LJ.router.reset('youth.sandbox');
          return;
        }
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
          /* 专项结束了也生成复盘（开学季/求职季/应急医疗共用一套，幂等） */
          y.fund.syncReview();
        } catch (e) { /* 不影响进入 */ }
      });
      /* 发放前余额巡检：余额不够发下次生活费时给家长留提醒。
         只对支持人端有意义（余额是家长的），而且同样是幂等的。 */
      try {
        LJ.store.all('user').filter(function (u) { return u.role === 'supporter'; })
          .forEach(function (u) { LJ.api.supporter(u.id).payoutCheck.remind(); });
      } catch (e) { /* 不影响进入 */ }
    },

    /* ============================================================
       018 · 退场 chrome 同拍（用户：出小票页进流水那一刻"跳一下"）
       ------------------------------------------------------------
       取证（_tmp-diag 逐帧采样）：pop 的 route emit 在**收尾那一帧**才跑
       syncChrome —— 落页瞬间 navbar display:none（page-host 一夜长高 50px）
       + tabbar/fab 凭空出现，三处布局同一帧硬切 = 那一跳。
       修法：布局三件套提前到**退场第一帧**换（此刻出场页还整屏盖着）：
       · navbar 收拢走 .gone 过渡（高度摊在整段横移里，落页无突变）；
       · 反向（非导航页→导航页）摘 .hidden 走 .arriving 同款长回来；
       · tabbar/fab 摘 .hidden 即出现，入场由 CSS :not(.hidden) chromeIn 播；
       · 收尾那次 syncChrome 幂等落终态（display:none）并清 .gone/.arriving。 */
    chromePopStart(prev) {
      if (!this.navbar) return;
      const page = (prev && prev.page) || {};
      const chrome = page.chrome || 'plain';
      const navHidden = this.navbar.classList.contains('hidden');
      const navWantHidden = chrome === 'full' || !!page.hideNav;
      if (!navHidden && navWantHidden) this.navbar.classList.add('gone');
      else if (navHidden && !navWantHidden) {
        this.navbar.classList.remove('hidden');
        this.navbar.classList.add('arriving');
      }
      const tbHidden = this.tabbar.classList.contains('hidden');
      const tbWant = chrome === 'tab';
      if (tbHidden === tbWant) this.tabbar.classList.toggle('hidden', !tbWant);
      if (this.fab) {
        const fabHidden = this.fab.classList.contains('hidden');
        const fabWant = chrome === 'tab' && !page.dark;
        if (fabHidden === fabWant) this.fab.classList.toggle('hidden', !fabWant);
      }
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
      this.navbar.classList.remove('gone', 'arriving');   /* 018：收尾落终态，清过渡类 */
      this.tabbar.classList.toggle('hidden', chrome !== 'tab');
      if (this.fab) this.fab.classList.toggle('hidden', chrome !== 'tab' || !!page.dark);
      /* 033 · 「全部功能」悬浮入口只在本角色的根页露面（青年端首页 /
         支持人端状态页 —— 025 两端同步的口径：一端有的入口另一端也要有，
         内容按 LJ.FEATURES[role] 裁）。子页、沙盘全屏页、共享转场里一律藏；
         抽屉开着时它也留着（z 比遮罩高，再点一次 = 收起）。 */
      if (this.hdFeat) {
        this.hdFeat.classList.toggle('hidden',
          entry.name !== LJ.ROOT[LJ.session.get().role]);
      }

      /* 深色页面（智能助手）整机切深色：状态栏 / 导航栏 / 导航胶囊 */
      const screen = document.getElementById('screen');
      if (screen) screen.classList.toggle('dark', !!page.dark);

      document.getElementById('navTitle').textContent = page.title || '';

      /* 024 · 顶栏右上角的头像退役（022 放这儿，024 四页顶栏整条隐藏后跟着搬进内容）——
         把手改由「我的」页自己渲染在内容右上角（pages-youth 的 meAvatarRow），
         这里不再碰 navRight，也就不存在"留上一页头像残影"这回事了。 */
      /* 023 · 一级页（tab 页）不挂返回键 —— 用户：复盘/往来/我的为什么会有返回？
         一级页有底栏、永远横着走得到；返回键在那儿既没有去处（栈里往往只有它自己，
         点一下只会被 reset 回首页）又暗示了一层并不存在的层级。删掉。
         非 tab 页保持原判据：压栈进来的要能退，深链落到单层子页的要能回根页。 */
      const isRoot = entry.name === LJ.ROOT[LJ.session.get().role];
      const isFirstLevel = (LJ.TABS[LJ.session.get().role] || []).some(t => t.page === entry.name);
      document.getElementById('navBack').style.visibility =
        (!isFirstLevel && (LJ.router.stack.length > 1 || !isRoot)) ? 'visible' : 'hidden';

      // tab 高亮
      if (this.tabbar) {
        const tabsOf = LJ.TABS[LJ.session.get().role] || [];
        const rootEntry = LJ.router.stack[0];
        const rootName = rootEntry ? rootEntry.name : '';
        /* 032-r2：老规则只看**栈底**（rootName）—— 于是"从首页 push 进流水页"
           （点开支预览那条路）底下 tab 还亮着「首页」，页面和 tab 对不上。
           新规则：**当前页自己就是 tab 页 → 亮它**；当前页是子页（卡片详情 /
           支出结构这类）→ 仍然亮栈底那个 tab，表达"我是从哪儿进来的"。 */
        const curName = entry.name;
        const activeName = tabsOf.some(t => t.page === curName) ? curName : rootName;
        this.tabbar.querySelectorAll('[data-tab]').forEach(b => {
          const t = tabsOf.find(x => x.id === b.getAttribute('data-tab'));
          b.classList.toggle('active', !!t && t.page === activeName);
        });
      }
      App.syncBadge();
      document.getElementById('deviceLabel').textContent =
        LJ.ROLE_LABEL[LJ.session.get().role] + ' · ' +
        (LJ.session.currentUser() || {}).name;
      /* 034 · 功能导览的开场时机：只在「落到青年端首页」这一刻开一次。
         boot 把意图写进 this._coachWant：裸开 = 'auto'（首开弹一次，看过不弹）、
         ?coach=1 = 'force'（取证用）、带其它参数 = 0（测试/截图一律不被打扰）。 */
      try { this.maybeCoach(); } catch (e) { }
    },

    maybeCoach() {
      const want = this._coachWant;
      if (!want || want === 'done') return;
      const role = LJ.session.get().role;
      const cur = LJ.router.current();
      /* 035：落到**任一角色的根页**都算（登录触发 —— 支持人端登录也弹，
         导览自己会切角色走完两端，tourEnd 还原出发身份）。 */
      if (!cur || cur.name !== LJ.ROOT[role]) return;
      if (LJ._tourState) { this._coachWant = 'done'; return; }   /* 别的导览在跑就不叠加 */
      if (want === 'auto') {
        let seen = false;
        try { seen = localStorage.getItem('lj.coach.seen') === '1'; } catch (e) { seen = true; }
        if (seen) { this._coachWant = 'done'; return; }
      }
      this._coachWant = 'done';
      /* 给首页一点落地时间（余额滚动/卡堆轻推都在头 500ms 内，聚光灯别抢拍） */
      setTimeout(() => { try { LJ.coachStart(); } catch (e) { } }, want === 'force' ? 450 : 1300);
    },

    /* 未读消息角标：挂在「我的」tab 上（消息中心就在那一页里）。
       为什么要有它：消息中心埋在「我的」二级页，不点进去根本不知道有东西来了。
       通知这件事的价值全在"不用主动去找" —— 没有角标，收到的分享和提醒
       就只是安静地躺在三层菜单里，等于没通知。 */
    syncBadge() {
      if (!this.tabbar) return;
      const role = LJ.session.get().role;
      const cur = LJ.session.currentUser();
      let n = 0;
      try {
        if (cur) n = (role === 'supporter' ? LJ.api.supporter(cur.id) : LJ.api.youth(cur.id))
          .message.unread();
      } catch (e) { n = 0; }
      /* 消息中心在「我的」页里，两端都一样 */
      this.tabbar.querySelectorAll('[data-badge]').forEach(el => {
        const on = el.getAttribute('data-badge') === 'me' && n > 0;
        el.hidden = !on;
        el.textContent = on ? (n > 9 ? '9+' : String(n)) : '';
      });
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
        '<button data-act="tour">产品导览（30 秒演示动线）</button>' +
        '<div class="note">一次判断 → 沙盘推演 → 能力轨迹 → 切支持人端看同一份证据。</div>' +
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
          else if (a === 'tour') LJ.demoTour();
          else if (a === 'reseed') {
            UI.confirm({
              title: '重新生成种子数据？',
              desc: '将清空现有记录，重新生成 6 个月的账本数据。每次都换一颗随机种子 —— ' +
                '生成的账本每次都不一样（首次打开看到的那份标准数据不受影响）。',
              okText: '重新生成',
              onOk() {
                const mix = 1 + Math.floor(Math.random() * 999999);
                LJ.store.clearAll();
                LJ.seed.install(U.ymd(new Date()), { mix });
                LJ.session.set('u_youth_lin', 'youth');
                App.enter('youth');
                UI.toast('已生成新的一份账本（种子 #' + mix + '）');
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

  /* ============================================================
     产品导览 · 演示动线（30 秒讲清这个产品）
     ------------------------------------------------------------
     聚光灯式的分步导览：①今天还能花 → ②沙盘推演 → ③能力轨迹
     （014 起这张卡在流水页，导览跟着翻页）→ ④今天练一次 → ⑤切支持人端看同一份证据。

     为什么要有它：功能都在，但评委第一眼只看到账 ——
     动线就是把"这个产品在培养能力"这件事**按顺序演给他看**，
     30 秒走完产品主张的闭环。

     ★ 导览层挂在 #screen 上而不是 #app-root：第 ⑤ 步会切换角色、
       整机重建（App.enter 只换 #app-root），挂错了会被顺手销毁。
     ============================================================ */
  const TOUR_STEPS = [
    /* 031-r2：聚光灯从「今天还能花」改成顶部主数字 —— 那两组数已随判断卡删除，
       这一页的大数字只剩「本月余额」+ 旁边那句节奏推演。文案跟着改诚实。 */
    { role: 'youth', page: 'youth.home', sel: '[data-month-left]', title: '第一眼：这个月还剩多少',
      text: '首页最大的数就是这个月还剩多少；紧挨着那句是这个节奏推下去的结果（会提前花完，还是花得完）。' },
    { role: 'youth', page: 'youth.home', sel: '[data-sandbox]', title: '花之前，先称一称',
      text: '「开支预览」看过去怎么花，「沙盘推演」算这一笔要不要花：能力是在做决定的地方长出来的，不是在记账的地方。' },
    /* 024：能力轨迹卡从流水页搬去了「我的」页（卡介绍卡删掉后的空位），
       导览第三步跟着翻页。 */
    { role: 'youth', page: 'youth.me', sel: '[data-zoom-push]', title: '能力轨迹',
      text: '每次主动动作都留痕、可核验。点这张卡会飞进成长中心 —— 共享元素转场。' },
    { role: 'youth', page: 'youth.grow', sel: '[data-tour-actions]', title: '今天练一次',
      text: '每周几个小动作，做完当天有反馈。能力是练出来的，不是打分打出来的。' },
    { role: 'supporter', page: 'supporter.report', sel: '[data-tour-proof]', title: '同一份证据，换个身份看',
      text: '支持人端看不到任何一笔消费明细，看到的是他主动做过的事 —— 这就是让家长放手的理由。' }
  ];
  /* ============================================================
     034 · 功能导览（coach marks）与沙盘引导 —— 复用上面这套导览机器，
     只换"步子"和"身份"：tourSteps/tourMode 决定这次走哪套。
     · demo = 开发面板里的产品导览（原有行为一字不改，probe-demo 照旧）；
     · coach = 首次打开的功能导览（只在**裸开** index.html 时自动弹一次）；
     · sg    = 沙盘三步/两步引导（进沙盘时按状态弹，各弹一次）。
     ============================================================ */
  /* 035 · 产品导览 = 034 的四步入口位 + demo 导览的三个产品叙事步，合成 7 步：
     用户口径「登录的时候自动出现产品导览，引导用户熟悉产品 UI 以及功能在哪」——
     既要"在哪点"（1–5，全在首页），也要"产品是什么"（6 能力轨迹、7 两端同一份证据，
     后两步会翻页/换角色，tourGo 本来就干这个）。demo 的 5 步演示动线一字未动。 */
  const COACH_STEPS = [
    { role: 'youth', page: 'youth.home', sel: '[data-month-left]', title: '第一眼：这个月还剩多少',
      text: '首页最大的数就是这个月还剩多少；旁边那句是按这个节奏推下去的结果。' },
    { role: 'youth', page: 'youth.home', sel: '#hdFeat', title: '功能都在这儿',
      text: '全站功能收在右上角这个宫格里：按页面分好区、每条一句话说明，还能直接搜 —— 找什么都不用记路径。' },
    { role: 'youth', page: 'youth.home', sel: '#fab', title: '随手记一笔',
      text: '右下角的 ＋ 记一笔收支，记完当场出一张小票。' },
    { role: 'youth', page: 'youth.home', sel: '[data-go-daily]', title: '过去怎么花',
      text: '开支预览整卡可点，进「每日收支」日历；这张卡还能左右滑，翻到支出结构。' },
    { role: 'youth', page: 'youth.home', sel: '[data-sandbox]', title: '花钱前，先称一称',
      text: '沙盘推演换条路走走，看哪天见底 —— 决定是在这儿变聪明的。' },
    { role: 'youth', page: 'youth.me', sel: '[data-zoom-push]', title: '能力轨迹',
      text: '每次主动动作都留痕、可核验。点这张卡会飞进成长中心 —— 共享元素转场。' },
    { role: 'supporter', page: 'supporter.report', sel: '[data-tour-proof]', title: '同一份证据，换个身份看',
      text: '支持人端看不到任何一笔消费明细，看到的是他主动做过的事 —— 这就是让家长放手的理由。' }
  ];
  /* 沙盘引导分状态（各弹一次，两个独立的记忆键）：
     门态（还没定边界）两步；图态三步（拖图看每天 / 换路 / 两条出口）。 */
  const SB_GATE_STEPS = [
    { role: 'youth', page: 'youth.sandbox', sel: '[data-sb-setupgo]', title: '先定边界',
      text: '起止日期、起始金额、每天基本开支 —— 四件事你来填，图只负责画出来。' },
    { role: 'youth', page: 'youth.sandbox', sel: '[data-sb-setup]', title: '随时能改',
      text: '定好之后，右上角 ⚙ 随时修改边界，↺ 重来。' }
  ];
  const SB_RUN_STEPS = [
    { role: 'youth', page: 'youth.sandbox', sel: '[data-sb-fig]', title: '拖着图看每一天',
      text: '按住折线左右拖 —— 游标告诉你走到哪天、那天还剩多少。' },
    { role: 'youth', page: 'youth.sandbox', sel: '[data-sb-chips]', title: '换一条路试试',
      text: '点 chip 切换买 / 不买；按住拖到图上，改的是「第几天买」。' },
    { role: 'youth', page: 'youth.sandbox', sel: '.sb-exits', title: '两条出口',
      text: '花过了就「记一笔」（事后）；想留个规矩就「记成下期约定」（事前，先预览再落库）。' }
  ];
  LJ.coachSteps = COACH_STEPS;
  LJ.sbGuideSteps = ready => ready ? SB_RUN_STEPS : SB_GATE_STEPS;
  let tourSteps = TOUR_STEPS;
  let tourMode = 'demo';
  let tourIdx = 0;
  let tourOrigin = null;
  /* 导览层的宿主：优先手机壳 #screen（弹层都挂在它里面），
     探针壳里没有时退到 #stage —— 坐标都相对宿主算，换哪个都成立。 */
  function tourHost() {
    return document.getElementById('screen') || document.getElementById('stage') || document.body;
  }

  /* 量聚光灯目标的矩形。
     ★ 目标里若套着**正在滚动的主数字**（`.hi-bal b[data-count-to]`，UI.countTo
       约 450ms 从 0 滚到值），直接量会量到"滚到一半的宽度" —— 洞按那个宽度挖，
       数字一到终值就差一格（实测 dw=21.125px ≈ 一个等宽字位，忽红忽绿就是它）。
       办法：量之前把那个文本节点临时换成 `data-fmt`（终值）再量，量完立刻还原 ——
       全程同步、不跨帧，countTo 下一帧照常写它自己的值，两边互不打扰。 */
  function tourRect(el) {
    const cnt = el.querySelector ? el.querySelector('[data-count-to]') : null;
    const fin = cnt && cnt.getAttribute('data-fmt');
    if (!fin) return el.getBoundingClientRect();
    let node = null;
    for (let i = cnt.childNodes.length - 1; i >= 0; i--) {
      const c = cnt.childNodes[i];
      if (c.nodeType === 3 && c.nodeValue.trim()) { node = c; break; }
    }
    if (!node) return el.getBoundingClientRect();
    const prev = node.nodeValue;
    node.nodeValue = fin;
    const r = el.getBoundingClientRect();
    node.nodeValue = prev;
    return r;
  }

  function tourGo() {
    const step = tourSteps[tourIdx];    const screen = tourHost();
    if (!screen) return;

    /* 落到正确的角色与页面。换角色＝整机重建，所以先换角色再找元素。 */
    const sess = LJ.session.get();
    if (sess.role !== step.role) {
      const u = LJ.store.all('user').filter(x => x.role === step.role)[0];
      if (u) { LJ.session.set(u.id, u.role); App.enter(u.role); }
    }
    const cur = LJ.router.current();
    if (!cur || cur.name !== step.page) {
      if (step.page === LJ.ROOT[step.role]) LJ.router.reset(step.page);
      else { LJ.router.reset(LJ.ROOT[step.role]); LJ.router.push(step.page, {}); }
    }
    LJ._tourState = { i: tourIdx, total: tourSteps.length, page: step.page,
      title: step.title, mode: tourMode };

    setTimeout(function () {
      const root = document.getElementById('tourRoot');
      if (!root) return;                       // 80ms 内被关掉了就算了
      const el = screen.querySelector('#page-host ' + step.sel) || screen.querySelector(step.sel);
      let holeBox = '';
      let bubbleTop = 96;
      if (el) {
        el.scrollIntoView({ block: 'center' });
        const sr = screen.getBoundingClientRect();
        const r = tourRect(el);
        const x = r.left - sr.left - 6, y = r.top - sr.top - 6;
        holeBox = 'left:' + x + 'px;top:' + y + 'px;width:' + (r.width + 12) + 'px;height:' + (r.height + 12) + 'px';
        bubbleTop = y + r.height + 20;
        if (bubbleTop + 190 > sr.height) bubbleTop = Math.max(60, y - 200);
      }
      /* 034 · coach/sg 是**模态**的（.tour.coach/.tour.sg 抓点击、z 在悬浮钮与
         抽屉之上）：引导期间页面别处点不动，走完/跳过才放行 —— 否则用户能一边
         看导览一边把页面点走，聚光灯就对不上了。demo 保持原样（非模态，probe-demo 依赖）。 */
      root.className = 'tour' + (tourMode === 'demo' ? '' : ' ' + tourMode);
      root.innerHTML =
        (holeBox ? '<div class="tour-hole" style="' + holeBox + '"></div>' : '<div class="tour-hole empty"></div>') +
        '<div class="tour-card" data-tour-card style="top:' + bubbleTop + 'px">' +
        '<div class="tour-n">' + (tourIdx + 1) + ' / ' + tourSteps.length + '</div>' +
        '<div class="tour-title">' + UI.esc(step.title) + '</div>' +
        '<div class="tour-text">' + UI.esc(step.text) + '</div>' +
        '<div class="tour-btns">' +
        '<button class="btn ghost sm" data-tour-prev' + (tourIdx === 0 ? ' disabled' : '') + '>上一步</button>' +
        '<button class="btn ghost sm" data-tour-quit>' + (tourMode === 'demo' ? '退出' : '跳过') + '</button>' +
        '<button class="btn sm" data-tour-next>' +
        (tourIdx === tourSteps.length - 1 ? (tourMode === 'demo' ? '完成' : '知道了') : '下一步') + '</button>' +
        '</div></div>';
      const q = s => root.querySelector(s);
      const prev = q('[data-tour-prev]');
      if (prev) prev.onclick = function () { if (tourIdx > 0) { tourIdx--; tourGo(); } };
      q('[data-tour-quit]').onclick = tourEnd;
      q('[data-tour-next]').onclick = function () {
        if (tourIdx >= tourSteps.length - 1) return tourEnd();
        tourIdx++; tourGo();
      };
    }, 80);
  }

  function tourEnd() {
    const root = document.getElementById('tourRoot');
    if (root) root.parentNode.removeChild(root);
    const wasLast = tourIdx >= tourSteps.length - 1;
    LJ._tourState = null;
    /* 034 · coach：退出也算"看过"（跳过是明确的决定，别下次又弹）。
       沙盘引导不同：它的记忆键在**开跑时**就写（sbMount 会因重画反复触发，
       结束才写的话重画一次就再弹一遍），所以这里不碰它。 */
    try {
      if (tourMode === 'coach') localStorage.setItem('lj.coach.seen', '1');
    } catch (e) { }
    /* ★ 回到出发前的身份：导览第⑤步会切换登录身份（切到支持人端看证据），
       不还原的话用户看完导览就"变成了另一个人"—— 卡、账本、消息全换人，
       看起来像数据丢了（坑 41 的引信）。 */
    const now = LJ.session.currentUser();
    if (tourOrigin && (!now || now.id !== tourOrigin.id)) {
      LJ.session.set(tourOrigin.id, tourOrigin.role);
      App.enter(tourOrigin.role);
    }
    tourOrigin = null;
    UI.toast(tourMode === 'demo'
      ? (wasLast ? '导览结束：两端看的是同一份证据' : '导览已退出')
      : '好了，随时可以再看：' + (tourMode === 'coach' ? '右上角宫格 · 全部功能' : '沙盘右上角 ⚙ 里有说明'));
  }

  /* 以一套步子开导览（mode: coach / sg）；demo 走下面的 LJ.demoTour */
  function guideStart(steps, mode) {
    tourSteps = steps; tourMode = mode;
    tourIdx = 0;
    const u0 = LJ.session.currentUser();
    tourOrigin = u0 ? { id: u0.id, role: (LJ.session.get() || {}).role } : null;
    const screen = tourHost();
    if (!screen) return false;
    let root = document.getElementById('tourRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'tourRoot';
      root.className = 'tour';
      screen.appendChild(root);
    }
    tourGo();
    return true;
  }
  /* coach 的入口（由 syncChrome 挑时机：落到青年端首页时才开） */
  LJ.coachStart = function () { return guideStart(COACH_STEPS, 'coach'); };
  /* 沙盘引导的入口（sandbox mount 里调）：裸开自动、?sbg=1 强制；
     门态/图态各弹一次（两个记忆键），图态与门态不重复打扰。 */
  LJ.sbGuide = function () {
    if (LJ._tourState) return false;                 /* 已有导览在跑就不叠加 */
    const sb = document.querySelector('[data-sb]');
    const ready = !!sb && sb.getAttribute('data-sb-ready') === '1';
    const key = ready ? 'lj.sbguide.ready' : 'lj.sbguide.gate';
    const forced = LJ._sbgForce === true;
    if (!forced) {
      /* 带参数 = 测试/截图；tools/ 里的宿主页（_probe-*.html / _shot.html）
         同样不算"真实打开" —— 它们也是无参数的，探针的沙盘判据不许被引导盖住 */
      if (location.search !== '' || /\/tools\//.test(location.pathname)) return false;
      try { if (localStorage.getItem(key) === '1') return false; } catch (e) { return false; }
    }
    /* ★ 记忆键**开跑时就写**（自动与强制都写）：sbMount 会因数据重画反复触发，
       不在这儿封住的话，引导一结束、下一次重画又弹一遍。强制弹也不豁免 ——
       探针每轮都是全新 profile，写不写不影响复现。 */
    try { localStorage.setItem(key, '1'); } catch (e) { }
    return guideStart(LJ.sbGuideSteps(ready), 'sg');
  };

  LJ.demoTour = function (startAt) {
    tourSteps = TOUR_STEPS; tourMode = 'demo';       /* 034：切回演示那一套（probe-demo 依赖） */
    tourIdx = Math.max(0, Math.min(TOUR_STEPS.length - 1, startAt || 0));
    const u0 = LJ.session.currentUser();
    tourOrigin = u0 ? { id: u0.id, role: (LJ.session.get() || {}).role } : null;
    const screen = tourHost();
    if (!screen) return;
    let root = document.getElementById('tourRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'tourRoot';
      root.className = 'tour';
      screen.appendChild(root);
    }
    tourGo();
  };

  /* ---------------- 启动 ---------------- */
  document.addEventListener('DOMContentLoaded', () => LJ.app.boot());
  if (document.readyState !== 'loading') LJ.app.boot();
})(window.LJ);
