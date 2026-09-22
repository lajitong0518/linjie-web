/* ============================================================
   api.js —— 服务层（权限在这里真实生效）

   核心设计：
     youthApi     = { entry:{...}, ... }   可以读明细
     supporterApi = { status, health, ... } 没有 entry 命名空间

   —— 不是"调用被拒绝"，是"这个方法不存在"。
   —— 将来换成真后端时，这一层的契约原样保留。
   ============================================================ */
(function (LJ) {
  'use strict';
  const U = LJ.util;
  const M = LJ.metrics;
  const E = LJ.engine;

  /* ============================================================
     披露配置：三档省心模式 + 逐项自定义 + 授权凭证
     ============================================================
     核心原则：**家人能看到什么，最终只由 binding.features 这一张表决定。**

       省心模式     = 这张表的「预设值」（一键切档）
       逐项自定义   = 这张表的「编辑器」（单项开关）
       授权中心     = 这张表的「凭证视图」（每项一条，可撤回）
       临时授权     = 表里的一项 + 一个到期日，到期 can() 直接返回 false

     以前 configFor() 只读 infoMode 和 customRules，**从来不看 grant 表** ——
     点「撤回授权」界面显示已撤回，家人那边照样看得到，和"权限真实生效"自相矛盾。
     ============================================================ */
  /* ============================================================
     消息类型表
     ============================================================
     「订阅设置」要有一份可枚举的类型清单，用户才知道自己能静音什么。
     顺序 = 消息中心里分组的顺序，也是设置页的顺序。 */
  LJ.MSG_TYPES = {
    support: '支持与对账',
    request: '协商与申请',
    share: '主动分享',
    risk: '风险提醒',
    system: '系统与成长'
  };

  LJ.disclosure = {
    /* 五个能力开关。status 是不可关的那一项：状态是支持决策的最低必要信息，
       全关掉父母端就空了，"最小必要"也不等于"什么都不给"。 */
    FEATURES: [
      {
        id: 'status', name: '支持状态', always: true,
        desc: '本月支持是否正常、资金是否充足', hint: '四色状态总览'
      },
      {
        id: 'health', name: '三项健康度',
        desc: '消费平稳度、资金可持续天数、结构健康度', hint: '三个分数，不含任何一笔'
      },
      {
        id: 'categoryMonthly', name: '大类月度总额',
        desc: '按支出大类看本月总额与环比', hint: '粒度到「类」，永远不到「笔」'
      },
      {
        id: 'directedProgress', name: '大额专项进度',
        desc: '专项支持用了多少、还剩多少', hint: '只有百分比和笔数'
      },
      {
        id: 'budgetProgress', name: '分类预算执行率',
        desc: '各大类的预算用了百分之多少', hint: '比总额更细一档'
      }
    ],
    feature: function (id) { return LJ.disclosure.FEATURES.find(f => f.id === id) || null; },

    MODES: {
      minimal: {
        id: 'minimal', name: '极简', tagline: '只看状态，不看数字',
        shows: ['status'],
        desc: '只同步本月支持状态与资金是否充足。'
      },
      standard: {
        id: 'standard', name: '标准', tagline: '知道情况，不知道细节',
        shows: ['status', 'health', 'categoryMonthly', 'directedProgress'],
        desc: '状态 + 三项健康度 + 大类月度总额 + 大额专项进度，不含单笔明细。'
      },
      loose: {
        id: 'loose', name: '宽松', tagline: '多知道一点节奏',
        shows: ['status', 'health', 'categoryMonthly', 'directedProgress', 'budgetProgress'],
        desc: '在标准基础上，再增加分类预算执行率。'
      }
    },
    ORDER: ['minimal', 'standard', 'loose'],
    mode: function (id) { return LJ.disclosure.MODES[id] || LJ.disclosure.MODES.standard; },

    /** 某个模式预设的能力表 */
    presetOf(modeId) {
      const preset = LJ.disclosure.mode(modeId).shows;
      const on = {};
      LJ.disclosure.FEATURES.forEach(f => { on[f.id] = preset.indexOf(f.id) >= 0; });
      return on;
    },

    /** 逐项目前是开还是关（binding.features 优先；老数据没有就回落到模式预设） */
    featuresOf(binding) {
      const saved = binding && binding.features;
      const preset = LJ.disclosure.presetOf((binding && binding.infoMode) || 'standard');
      const on = {};
      LJ.disclosure.FEATURES.forEach(f => {
        if (f.always) { on[f.id] = true; return; }
        on[f.id] = (saved && typeof saved[f.id] === 'boolean') ? saved[f.id] : preset[f.id];
      });
      return on;
    },

    /** 挂在这个能力上的临时授权：返回到期日，'expired' 表示已经作废，null 表示没有临时授权 */
    expiryOf(feature) {
      const today = (LJ.clock && LJ.clock.now()) || '9999-12-31';
      const rows = LJ.store.all('grant').filter(g => g.feature === feature);
      if (!rows.length) return null;
      const live = rows.filter(g => g.status === 'active' && (!g.expiresAt || g.expiresAt >= today));
      return live.length ? (live[0].expiresAt || null) : 'expired';
    },

    /**
     * 这个能力现在到底生效不生效 —— 权限判定的唯一入口
     * 顺序很重要：**先看有没有生效中的临时授权**。
     * 临时授权的用途正是"给一项基准里没有的能力"，所以它必须能单独开门；
     * 到期之后自然落回到 features/预设，也就是自动收回。
     */
    can(binding, feature) {
      const exp = LJ.disclosure.expiryOf(feature);
      if (exp && exp !== 'expired') return true;
      return !!LJ.disclosure.featuresOf(binding)[feature];
    },

    /** 当前生效的披露配置（页面和状态聚合都读它） */
    configFor(binding) {
      const modeId = (binding && binding.infoMode) || 'standard';
      const base = LJ.disclosure.mode(modeId);
      const preset = LJ.disclosure.presetOf(modeId);
      const on = LJ.disclosure.featuresOf(binding);
      const shows = LJ.disclosure.FEATURES
        .filter(f => on[f.id] && LJ.disclosure.can(binding, f.id))
        .map(f => f.id);
      /* 和预设比一遍：任何一项被改过就显示「自定义」 */
      const isCustom = LJ.disclosure.FEATURES.some(f => !f.always && on[f.id] !== preset[f.id]);
      return {
        id: isCustom ? 'custom' : modeId,
        name: isCustom ? '自定义' : base.name,
        tagline: isCustom ? '你在「' + base.name + '」上逐项调过' : base.tagline,
        desc: isCustom ? '按你自己逐项设定的范围开放，改动即时生效。' : base.desc,
        shows: shows,
        base: modeId
      };
    },

    /** 能力表 → 授权中心用的凭证列表 */
    grantRows(binding) {
      const on = LJ.disclosure.featuresOf(binding);
      const preset = LJ.disclosure.presetOf((binding && binding.infoMode) || 'standard');
      return LJ.disclosure.FEATURES.map(f => {
        const exp = LJ.disclosure.expiryOf(f.id);
        const expired = exp === 'expired';
        const viaTemp = !!(exp && !expired);
        /* 生效与否直接问 can()，避免这里和权限判定各写一套逻辑 */
        const effectiveOn = LJ.disclosure.can(binding, f.id);
        return {
          id: f.id, name: f.name, desc: f.desc, hint: f.hint,
          always: !!f.always,
          status: effectiveOn ? 'active' : 'off',
          fromPreset: on[f.id] === preset[f.id],
          presetOn: !!preset[f.id],
          viaTemp: viaTemp,
          expiresAt: viaTemp ? exp : null,
          expired: expired,
          temporary: !!exp,
          /* 状态文案：把"为什么现在是这个状态"说清楚 */
          expiryText: viaTemp ? '临时授权 · 有效期至 ' + exp + '，到期自动收回'
            : expired ? (on[f.id]
              ? '临时授权已到期，但你后来自己开放了这项，所以仍然生效'
              : '临时授权已到期，已自动收回')
              : '长期有效'
        };
      });
    }
  };

  /* ============================================================
     协商申请模板
     ============================================================ */
  LJ.REQUEST_TEMPLATES = [
    { id: 'cert', name: '考证报名', icon: '📘', category: 'study', placeholder: '证书名称、报名截止时间' },
    { id: 'rent', name: '房租押金', icon: '🏠', category: 'daily', placeholder: '租房城市、押付方式' },
    { id: 'school', name: '开学采购', icon: '🎒', category: 'daily', placeholder: '需要采购的物品大类' },
    { id: 'medical', name: '生病就医', icon: '🏥', category: 'daily', placeholder: '就诊医院与大致费用' },
    { id: 'other', name: '其他用途', icon: '✏️', category: 'daily', placeholder: '简单说明用途' }
  ];

  /** 响应话术（温和、非对抗） */
  LJ.RESPONSE_SCRIPTS = {
    full: [
      '钱已经转过去了，够不够再跟我说。',
      '好的，这次全额支持，注意别太省。'
    ],
    partial: [
      '先转一部分，剩下的你先垫一下，回头告诉我够不够。',
      '这次给你一半，另外一半我们一起看看能不能省出来。'
    ],
    defer: [
      '这个月手头有点紧，下个月初我一起给你，可以吗？',
      '先缓一缓，等我看下这个月的安排，晚点回你。'
    ],
    reject: [
      '这次先不给啦，你自己想想有没有别的办法，需要的话我们再聊。',
      '暂时不支持这笔，不过我很想听听你为什么想买。'
    ]
  };

  /* ============================================================
     内部：服务端助手（视图层拿不到）
     ============================================================ */
  /* ---------- 多子女：谁在被看 ----------
     两种来源，优先级从高到低：
     ① SCOPE —— 显式指定。`LJ.api.youth(某个 id)` 的每次调用都会把自己圈进 SCOPE，
        所以"帮某个孩子算指标"永远算的是他，跟当前在看谁无关。
        这一条不能省：支持人停在看妹妹时，系统仍然要同步哥哥的风险事件，
        少了它就会拿妹妹的账本去算哥哥的指标（实测被断言逮到过）。
     ② 会话 —— 青年端看自己；支持人端看 meta.activeChildId。
     老数据里 entry 没有 userId，一律算作第一个孩子的（向后兼容）。 */
  let SCOPE = null;
  function scopeTo(who, fn) {
    const prev = SCOPE;
    SCOPE = who;
    try { return fn(); } finally { SCOPE = prev; }
  }
  /** 把一个 API 对象的所有方法都圈进某个孩子的范围 */
  function scopeApi(obj, who) {
    Object.keys(obj).forEach(k => {
      const v = obj[k];
      if (typeof v === 'function') {
        obj[k] = function () {
          const args = arguments;
          return scopeTo(who, () => v.apply(obj, args));
        };
      } else if (v && typeof v === 'object' && !Array.isArray(v)) {
        Object.keys(v).forEach(k2 => {
          if (typeof v[k2] !== 'function') return;
          const f = v[k2];
          v[k2] = function () {
            const args = arguments;
            return scopeTo(who, () => f.apply(v, args));
          };
        });
      }
    });
    return obj;
  }

  const S = {
    /* ---------- 多子女：谁在被看（见上面 SCOPE 的说明）---------- */
    bindings() { return LJ.store.all('binding'); },
    primaryYouthId() {
      const b = LJ.store.all('binding')[0];
      return b ? b.youthId : null;
    },
    activeYouthId() {
      if (SCOPE) return SCOPE;
      const list = LJ.store.all('binding');
      if (!list.length) return null;
      const s = LJ.session.get();
      if (s.role === 'youth') {
        const mine = list.find(b => b.youthId === s.userId);
        return mine ? mine.youthId : list[0].youthId;
      }
      const want = LJ.store.meta().activeChildId;
      const hit = list.find(b => b.youthId === want);
      return hit ? hit.youthId : list[0].youthId;
    },
    /** 某张表里的一行属不属于当前在看的孩子 */
    ownedBy(row, who) {
      return (row.userId || row.youthId || S.primaryYouthId()) === who;
    },
    /** 支持人侧的子女列表（派生，不是新表） */
    children() {
      const s = LJ.session.get();
      const me = s.userId;
      return LJ.store.all('binding').filter(b => b.supporterId === me).map(b => {
        const u = LJ.store.find('user', b.youthId) || {};
        return {
          id: b.youthId, bindingId: b.id, name: u.name || '未命名',
          nickname: u.nickname || u.name || '', avatar: u.avatar || '?',
          level: u.level || '', infoMode: b.infoMode || 'standard'
        };
      });
    },
    switchChild(id) {
      LJ.store.setMeta({ activeChildId: id });
      return S.binding();
    },

    binding() {
      const list = LJ.store.all('binding');
      const who = S.activeYouthId();
      return list.find(b => b.youthId === who) || list[0] || null;
    },
    /** 当前孩子的账本条目（多子女隔离在这一行） */
    entries() {
      const who = S.activeYouthId();
      return LJ.store.all('entry').filter(e => S.ownedBy(e, who));
    },
    /** 把一张表过滤成「当前在看的孩子」的行 */
    mine(list) {
      const who = S.activeYouthId();
      return (list || []).filter(r => S.ownedBy(r, who));
    },
    /** 不带归属过滤的全量账本 —— 只有时间机器和导出会用 */
    allEntries() { return LJ.store.all('entry'); },
    today() { return LJ.clock.now(); },
    sorted(list) { return list.slice().sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : 0); },
    monthOf(d) { return U.monthKey(d); },

    /** 上月同期的分类总额，用于算环比 */
    categoryDelta(catId, from, to) {
      const e = S.entries();
      const cur = M.inRange(e, from, to).filter(x => x.direction === 'out' && x.category === catId)
        .reduce((s, x) => s + x.amount, 0);
      const span = U.diffDays(from, to);
      const pTo = U.addDays(from, -1), pFrom = U.addDays(pTo, -span);
      const prev = M.inRange(e, pFrom, pTo).filter(x => x.direction === 'out' && x.category === catId)
        .reduce((s, x) => s + x.amount, 0);
      return prev > 0 ? (cur - prev) / prev : (cur > 0 ? 1 : 0);
    },

    /** 待办数量（支持人视角） */
    pendingCount() {
      return LJ.store.where('request', r => r.status === 'pending').length;
    }
  };

  /* ============================================================
     后端聚合：只产出聚合结果，明细字段在这里被彻底剥离
     ============================================================ */
  function computeStatus() {
    const e = S.entries(), today = S.today(), binding = S.binding();
    const st = M.statusColor(e, today, { pendingCount: S.pendingCount() });
    return {
      key: st.key, title: st.title, desc: st.desc,
      updatedAt: today
    };
  }

  function computeHealth() {
    const e = S.entries(), today = S.today();
    const h = M.health(e, today);
    return {
      steady: h.steady, runway: h.runway, structure: h.structure,
      avgDaily: h.avgDaily
    };
  }

  /** 六大类月度总额——只给数字，不给任何一笔交易 */
  function computeCategoryMonthly() {
    const e = S.entries(), today = S.today();
    const from = U.startOfMonth(today);
    const list = M.categoryTotals(e, from, today);
    return list.map(c => ({
      id: c.id, name: c.name, icon: c.icon, color: c.color,
      amount: Math.round(c.amount),
      ratio: Math.round(c.ratio * 100),
      delta: Math.round(S.categoryDelta(c.id, from, today) * 100)
    }));
  }

  /** 分类预算执行率（宽松档才给） */
  function computeBudgetProgress() {
    const e = S.entries(), today = S.today();
    const b = LJ.store.all('budget')[0];
    if (!b) return [];
    const p = M.budgetProgress(e, b, today);
    return p.categories.map(c => ({
      id: c.id, name: c.name, icon: c.icon,
      budget: c.budget, spent: Math.round(c.spent),
      ratio: Math.round(c.ratio * 100)
    }));
  }

  /** 大额专项的使用进度：只给百分比，不给明细 */
  /**
   * 大额专项进度（标准档及以上）
   * 只给「进度」，不给转账明细：没有日期、没有每一笔的金额、没有用途描述 ——
   * 和专项资金页（fund.overview）保持同一套口径。
   * 以前这里返回的是 supportRecord 原文（含 date/purpose/amount 逐条），
   * 等于把"你什么时候给我转了多少钱"逐条列出来，不算明细但也没必要。
   */
  function computeDirectedProgress() {
    const funds = LJ.store.all('fund');
    const e = S.entries(), today = S.today();
    const rows = LJ.store.where('supportRecord', r => r.directed);
    const out = funds.map(f => {
      const p = E.fundProgress(f, e, today);
      return {
        name: f.name, icon: E.fundKind(f.kind).icon,
        categoryName: LJ.catById(f.category).name,
        inTotal: p.inTotal, used: p.used, remaining: p.remaining,
        ratio: Math.round(p.ratio * 100), count: p.count,
        status: f.status
      };
    });
    /* 没有专项记录的老数据（只有一条 directed 对账），退化成一条汇总 */
    if (!out.length && rows.length) {
      const total = rows.reduce((s, r) => s + r.amount, 0);
      out.push({
        name: '定向用途支持', icon: '🎯', categoryName: '—',
        inTotal: total, used: 0, remaining: total,
        ratio: 0, count: rows.length, status: 'active'
      });
    }
    return out;
  }

  /* ============================================================
     青年端 API
     ============================================================ */
  function makeYouthApi(userId) {
    const api = {
      role: 'youth',
      userId,

      profile() { return LJ.store.find('user', userId); },
      binding() { return S.binding(); },
      partner() {
        const b = S.binding(); if (!b) return null;
        return LJ.store.find('user', b.supporterId);
      },

      /* ---- 账本：明细接口只存在于这一侧 ---- */
      entry: {
        list(filter) {
          filter = filter || {};
          let list = S.entries();
          if (filter.category) list = list.filter(e => e.category === filter.category);
          if (filter.direction) list = list.filter(e => e.direction === filter.direction);
          if (filter.fundingSource) list = list.filter(e => e.fundingSource === filter.fundingSource);
          if (filter.from) list = list.filter(e => e.date >= filter.from);
          if (filter.to) list = list.filter(e => e.date <= filter.to);
          if (filter.keyword) {
            const k = filter.keyword.toLowerCase();
            list = list.filter(e => ((e.merchant || '') + (e.title || '') + (e.note || '')).toLowerCase().includes(k));
          }
          return S.sorted(list);
        },
        byMonth(mk) { return S.sorted(S.entries().filter(e => U.monthKey(e.date) === mk)); },
        get(id) { return LJ.store.find('entry', id); },

        create(row) {
          if (!row.amount || row.amount <= 0) throw new Error('金额需要大于 0');
          if (!row.category && row.direction !== 'in') throw new Error('请选择支出大类');
          const rec = LJ.store.insert('entry', {
            userId: row.userId || userId,
            date: row.date || S.today(),
            amount: Math.round(row.amount * 100) / 100,
            direction: row.direction || 'out',
            category: row.category || null,
            title: row.title || null,
            merchant: row.merchant || '',
            note: row.note || '',
            fundingSource: row.fundingSource || 'family',
            source: row.source || 'manual',
            /* 挂在哪个专项资金下（没有就是 null）。
               家人侧的专项进度只按 fundId 汇总，所以这是"能不能被统计到"的唯一凭据。 */
            fundId: row.fundId || null
          });
          LJ.store.log(userId, '记一笔', `${LJ.catById(rec.category).name} ¥${U.won(rec.amount)}` +
            (rec.fundId ? '（专项）' : ''));
          return rec;
        },
        update(id, patch) { return LJ.store.update('entry', id, patch); },
        remove(id) { return LJ.store.remove('entry', id); }
      },

      /* ---- 看板 ---- */
      dashboard() {
        const e = S.entries(), today = S.today();
        const b = LJ.store.all('budget')[0] || { total: 2200, categories: {} };
        return {
          balances: M.balances(e),
          control: M.controlIndex(e, { today, budgetMonthly: b.total }),
          month: M.monthTotals(e, U.monthKey(today)),
          budget: M.budgetProgress(e, b, today),
          gap: M.gapForecast(e, today, b.total),
          health: M.health(e, today),
          status: M.statusColor(e, today, { pendingCount: 0 }),
          daily: M.dailySeries(e, today, 14),
          categories: M.categoryTotals(e, U.startOfMonth(today), today),
          daysToPayday: M.daysToPayday(today)
        };
      },

      budget: {
        get() { return LJ.store.all('budget')[0] || null; },
        set(patch) {
          const b = LJ.store.all('budget')[0];
          /* 留痕：调预算是一项真实的财务动作，要能被「近 7 天动作」和
             父母端能力证据读到。以前这里不写日志，所以"主动调过预算"
             这个证据根本不存在。 */
          if (b) {
            LJ.store.log(userId, '调整预算',
              '总额 ¥' + U.wonInt(patch.total != null ? patch.total : b.total));
            return LJ.store.update('budget', b.id, patch);
          }
          LJ.store.log(userId, '调整预算', '首次设置 ¥' + U.wonInt(patch.total || 2200));
          return LJ.store.insert('budget', {
            periodStart: U.startOfMonth(S.today()),
            periodEnd: U.endOfMonth(S.today()),
            total: 2200, categories: {}, ...patch
          });
        }
      },

      /* ---- 支持登记对账 ---- */
      support: {
        pending() { return LJ.store.where('supportRecord', r => r.status === 'pending'); },
        list() { return S.sorted(LJ.store.all('supportRecord')); },
        confirm(id) {
          const r = LJ.store.find('supportRecord', id);
          if (!r) throw new Error('记录不存在');
          LJ.store.update('supportRecord', id, {
            status: 'confirmed', confirmedAt: new Date().toISOString()
          });
          LJ.store.insert('entry', {
            date: r.date, amount: r.amount, direction: 'in', category: null,
            title: r.purpose, merchant: '', note: '来自 ' + (LJ.store.find('user', r.providerId) || {}).name,
            fundingSource: 'family', source: 'support'
          });
          LJ.store.log(userId, '确认支持', `${r.purpose} ¥${U.won(r.amount)}`);
          return true;
        },
        decline(id) {
          LJ.store.update('supportRecord', id, { status: 'declined' });
          LJ.store.log(userId, '谢绝支持', '已礼貌回应');
          return true;
        }
      },

      /* ---- 协商申请 ---- */
      request: {
        mine() { return S.sorted(LJ.store.where('request', r => r.youthId === userId)); },
        create(row) {
          const rec = LJ.store.insert('request', {
            familyId: (S.binding() || {}).familyId,
            youthId: userId, template: row.template, name: row.name,
            amount: row.amount, reason: row.reason || '', note: row.note || '',
            installment: !!row.installment, status: 'pending',
            date: S.today()
          });
          LJ.store.log(userId, '发起支持申请', `${row.name} ¥${U.won(row.amount)}`);
          LJ.store.insert('message', {
            userId: (S.binding() || {}).supporterId, type: 'request',
            title: '收到一笔支持申请', body: `${row.name} ¥${U.won(row.amount)}`,
            read: false, at: new Date().toISOString()
          });
          return rec;
        }
      },

      /* ---- 授权与留痕 ---- */
      /* ---- 授权中心 ----
         以前这里只是读写 grant 表，**和权限判定完全没关系**（configFor 根本不看它），
         所以「撤回授权」只是界面变化。现在两者是同一张表：
         列表是从 binding.features 反推出来的凭证，撤回就是真的把那一项关掉。 */
      grant: {
        /** 凭证列表（每一项都对应一个真实生效/不生效的能力） */
        list() { return LJ.disclosure.grantRows(S.binding()); },

        /** 撤回：真的关掉这个能力，家人立刻看不到 */
        revoke(featureId) {
          const f = LJ.disclosure.feature(featureId);
          if (!f) return false;
          if (f.always) throw new Error('「' + f.name + '」是最低必要信息，不能撤回');
          const b = S.binding();
          const next = LJ.disclosure.featuresOf(b);
          next[featureId] = false;
          LJ.store.update('binding', b.id, { features: next });
          LJ.store.log(userId, '撤回授权', f.name + '（家人立即失去这个范围）');
          return true;
        },

        /** 重新开放 */
        allow(featureId) {
          const f = LJ.disclosure.feature(featureId);
          if (!f) return false;
          const b = S.binding();
          const next = LJ.disclosure.featuresOf(b);
          next[featureId] = true;
          LJ.store.update('binding', b.id, { features: next });
          LJ.store.log(userId, '重新开放授权', f.name);
          return true;
        },

        /**
         * 开一项临时授权：带到期日，到期后 can() 直接返回 false。
         * 这是文档 3.2.3 第 4 层"临时授权层：到期自动收回"。
         */
        openTemporary(featureId, days) {
          const f = LJ.disclosure.feature(featureId);
          if (!f) return null;
          const b = S.binding();
          const n = Number(days) || 30;
          const until = U.addDays(S.today(), n);
          const next = LJ.disclosure.featuresOf(b);
          next[featureId] = true;
          LJ.store.update('binding', b.id, { features: next });
          /* 先把同一项上还没到期的临时授权作废，避免多条打架 */
          LJ.store.all('grant').filter(g => g.feature === featureId && g.status === 'active')
            .forEach(g => LJ.store.update('grant', g.id, { status: 'superseded' }));
          const rec = LJ.store.insert('grant', {
            id: LJ.store.uid('gr'), familyId: b.familyId, youthId: b.youthId,
            feature: featureId, scope: featureId, label: f.name,
            type: 'temporary', value: [featureId],
            expiresAt: until, status: 'active', createdAt: LJ.clock.nowISO()
          });
          LJ.store.log(userId, '开放临时授权', f.name + ' · ' + n + ' 天 · 至 ' + until);
          return rec;
        },

        /** 到期自动收回的预览：还有几天 */
        temporary() {
          return LJ.disclosure.grantRows(S.binding())
            .filter(r => r.temporary).map(r => ({
              feature: r.id, name: r.name, expiresAt: r.expiresAt,
              expired: r.expired, days: r.expiresAt ? U.diffDays(S.today(), r.expiresAt) : 0
            }));
        }
      },
      audit: { list() { return S.sorted(LJ.store.all('auditLog').map(a => ({ ...a, date: (a.at || '').slice(0, 10) }))); } },

      message: {
        /* ★ 订阅偏好在这里生效。
           消息中心是**通知渠道**，不是留痕 —— 订阅设置决定"哪些类型的提醒
           进入这个渠道"，被静音的类型不进列表也不计未读。
           底层事件仍在（留痕、账本、申请都照常），只是不打扰你。
           这正是"订阅"这个词的语义，不是把数据藏起来。 */
        list() {
          const prefs = LJ.store.meta().notifyPrefs || {};
          return S.sorted(LJ.store.where('message', m => m.userId === userId)
            .filter(m => prefs[m.type] !== false)
            .map(m => ({ ...m, date: (m.at || '').slice(0, 10) })));
        },
        unread() {
          const prefs = LJ.store.meta().notifyPrefs || {};
          return LJ.store.where('message', m => m.userId === userId && !m.read &&
            prefs[m.type] !== false).length;
        },
        read(id) { return LJ.store.update('message', id, { read: true }); },
        /** 全部已读：消息多了以后一条条点太累 */
        readAll() {
          const prefs = LJ.store.meta().notifyPrefs || {};
          LJ.store.where('message', m => m.userId === userId && !m.read &&
            prefs[m.type] !== false).forEach(m => LJ.store.update('message', m.id, { read: true }));
          return true;
        },
        /** 订阅偏好：{ 类型: false } 表示静音。没配过的类型默认提醒 */
        prefs() { return Object.assign({}, LJ.store.meta().notifyPrefs || {}); },
        setPref(type, on) {
          const p = Object.assign({}, LJ.store.meta().notifyPrefs || {});
          if (on) delete p[type]; else p[type] = false;
          LJ.store.setMeta({ notifyPrefs: p });
          LJ.store.log(userId, on ? '开启消息提醒' : '静音消息提醒', LJ.MSG_TYPES[type] || type);
          return p;
        }
      },

      /* ---- 脱敏账单分享（3.3.3）----
         闭环三段：本人生成并发送 → 对方在消息中心收到 → 对方确认收到，
         确认后本人会收到一条回执。缺任何一段，这个功能就只是"点一下弹个提示"。 */
      share: {
        /** 发送：存快照 + 给对方发消息 */
        send(note) {
          const b = S.binding();
          if (!b) throw new Error('还没有绑定关系');
          const d = api.dashboard();
          const mk = U.monthKey(S.today());
          const cats = d.categories.filter(c => c.amount > 0)
            .sort((x, y) => y.amount - x.amount)
            .map(c => ({ name: c.name, ratio: Math.round(c.ratio * 1000) / 1000, color: c.color }));
          if (!cats.length) throw new Error('这个月还没有可分享的数据');
          const nowISO = new Date().toISOString();
          const rec = LJ.store.insert('shareCard', {
            fromId: userId, toId: b.supporterId, month: mk,
            note: (note || '').trim(),
            at: nowISO, ackAt: null, ackNote: '',
            /* 快照而不是实时引用：对方看到的必须是按下发送那一刻的数 */
            snapshot: {
              month: mk,
              expense: Math.round(d.month.expense),
              net: Math.round(d.month.net),
              control: d.control.score,
              cats: cats
            }
          });
          LJ.store.insert('message', {
            userId: b.supporterId, type: 'share',
            title: '孩子主动分享了一份账单',
            body: mk + ' 月度概览 · 只含宏观数据，没有单笔明细',
            shareCardId: rec.id, read: false, at: nowISO
          });
          LJ.store.log(userId, '主动分享脱敏账单', mk + (note ? ' · ' + note : ''));
          return rec;
        },
        /** 我发出去的 */
        sent() {
          return S.sorted(LJ.store.where('shareCard', c => c.fromId === userId));
        },
        get(id) { return LJ.store.find('shareCard', id); }
      },

      /* ---- 阶梯式金融服务引导（3.3.4 第 2 条）----
         只到"类型"、不给产品名、不给收益数字，准入条件由数据算。
         这里没有任何下单/开通方法 —— 真正的交易在手机银行里，
         这个产品只负责"让你知道该了解哪一类"。 */
      finance: {
        guide() { return E.financeGuide(S.entries(), S.today()); },
        readiness() { return E.financeReadiness(S.entries(), S.today()); }
      },

      disclosure: {
        features: LJ.disclosure.FEATURES,
        /** 逐项开关的当前状态 */
        toggles() { return LJ.disclosure.featuresOf(S.binding()); },
        current() { return LJ.disclosure.configFor(S.binding()); },

        /** 一键切档：把能力表重置成该模式的预设 */
        set(mode) {
          const b = S.binding();
          const from = LJ.disclosure.configFor(b).name;
          LJ.store.update('binding', b.id, {
            infoMode: mode, features: null, customRules: null, pendingBy: null
          });
          LJ.store.log(userId, '调整省心模式', from + ' → ' + LJ.disclosure.mode(mode).name +
            '（逐项设置重置为该档预设）');
          /* 青年是账户所有者，改完即时生效；但仍然通知对方一声，
             不让家人"某天发现范围变了"—— 正规流程 + 全程留痕，只是不需要审批。 */
          if (b.supporterId !== userId) {
            LJ.store.insert('message', {
              userId: b.supporterId, type: 'system', title: '信息范围有调整',
              body: '已切换为「' + LJ.disclosure.mode(mode).name + '」。' +
                '这是账户所有者自己定的，你可以在「查看范围」里看到当前状态。',
              read: false, at: LJ.clock.nowISO()
            });
          }
          return true;
        },

        /**
         * 逐项自定义一个能力 —— 文档 3.2.2 说的"用户也可逐项自定义信息开放维度"。
         * 青年是账户所有者，所以青年改即时生效；家长只能申请（见 propose）。
         */
        toggle(featureId, on) {
          const f = LJ.disclosure.feature(featureId);
          if (!f) throw new Error('没有这个能力项');
          if (f.always) throw new Error('「' + f.name + '」是最低必要信息，不能关闭');
          const b = S.binding();
          const next = LJ.disclosure.featuresOf(b);
          next[featureId] = !!on;
          LJ.store.update('binding', b.id, { features: next });
          LJ.store.log(userId, on ? '逐项开放信息' : '逐项关闭信息', f.name);
          return LJ.disclosure.configFor(S.binding());
        },

        /** 由家长端发起变更，需对方确认（青年是所有者，改方向是单向的） */
        propose(mode) {
          const b = S.binding();
          LJ.store.update('binding', b.id, { proposedMode: mode, proposedBy: userId });
          LJ.store.log(userId, '发起信息范围调整', LJ.disclosure.mode(mode).name + '（待对方确认）');
          return true;
        },
        /** 等待我确认的调整申请 */
        incoming() {
          const b = S.binding();
          return b && b.proposedMode && b.proposedBy !== userId ? b : null;
        },
        resolveIncoming(accept) {
          const b = S.binding();
          if (!b || !b.proposedMode) return false;
          // 注意：store.update 是就地修改，必须先把值取出来
          const mode = b.proposedMode;
          const label = LJ.disclosure.mode(mode).name;
          if (accept) {
            LJ.store.update('binding', b.id, {
              infoMode: mode, features: null, proposedMode: null, proposedBy: null, customRules: null
            });
            LJ.store.log(userId, '确认信息范围调整', label + '（逐项设置重置为该档预设）');
            LJ.store.insert('message', {
              userId: b.supporterId, type: 'system', title: '信息范围调整已生效',
              body: '已按你的申请调整为「' + label + '」。', read: false, at: new Date().toISOString()
            });
          } else {
            LJ.store.update('binding', b.id, { proposedMode: null, proposedBy: null });
            LJ.store.log(userId, '驳回信息范围调整', label);
            LJ.store.insert('message', {
              userId: b.supporterId, type: 'system', title: '信息范围调整未通过',
              body: '对方暂时没有同意这次调整。这个决定不需要解释，你可以过一段时间再聊。',
              read: false, at: new Date().toISOString()
            });
          }
          return true;
        }
      },

      /* ============================================================
         订阅管理
         ============================================================ */
      subscription: {
        list() {
          const subs = LJ.store.all('subscription');
          const detected = E.subscriptions(S.entries(), S.today());
          return subs.map(s => {
            const d = detected.find(x => x.name === s.name) || null;
            return {
              ...s, detected: !!d,
              nextDate: d ? d.nextDate : null,
              daysToNext: d ? d.daysToNext : null,
              actualMonthly: d ? d.monthly : s.amount
            };
          });
        },
        detect() { return E.detectSubscriptions(S.entries(), LJ.store.all('subscription')); },
        add(row) {
          const rec = LJ.store.insert('subscription', {
        userId: userId,
            name: row.name, amount: Number(row.amount) || 0,
            cycle: row.cycle || 'month', day: row.day || U.parse(S.today()).getDate(),
            category: 'sub', status: 'active', tracked: true
          });
          LJ.store.log(userId, '新增订阅', row.name + ' ¥' + U.won(row.amount));
          return rec;
        },
        remove(id) {
          const s = LJ.store.find('subscription', id);
          LJ.store.log(userId, '移除订阅', s ? s.name : id);
          return LJ.store.remove('subscription', id);
        },
        toggle(id) {
          const s = LJ.store.find('subscription', id);
          if (!s) return null;
          const status = s.status === 'active' ? 'paused' : 'active';
          LJ.store.log(userId, status === 'active' ? '恢复订阅' : '暂停订阅', s.name);
          return LJ.store.update('subscription', id, { status });
        },
        summary() {
          const list = api.subscription.list();
          const active = list.filter(s => s.status === 'active');
          const monthly = active.reduce((a, b) => a + (b.actualMonthly || b.amount), 0);
          return {
            count: list.length, activeCount: active.length,
            monthly: Math.round(monthly * 100) / 100,
            annual: Math.round(monthly * 12 * 100) / 100,
            next: list.filter(s => s.nextDate).sort((a, b) => a.daysToNext - b.daysToNext)[0] || null
          };
        }
      },

      /* ============================================================
         周期复盘
         ============================================================ */
      review: {
        available() {
          const dates = S.entries().map(e => e.date).sort();
          if (!dates.length) return [];
          const out = [];
          let cur = U.startOfMonth(dates[0]);
          const last = U.startOfMonth(S.today());
          let guard = 0;
          while (cur <= last && guard++ < 36) { out.push(U.monthKey(cur)); cur = U.addMonths(cur, 1); }
          return out.reverse();
        },
        period(mk) {
          const today = S.today();
          const anchor = (mk || U.monthKey(U.addMonths(today, -1))) + '-01';
          const from = U.startOfMonth(anchor);
          const endOfM = U.endOfMonth(anchor);
          const to = endOfM > today ? today : endOfM;
          return E.periodReview(S.entries(), from, to, LJ.store.all('budget')[0]);
        },
        isReviewed(mk) { return (LJ.store.meta().reviewedPeriods || []).indexOf(mk) >= 0; },
        markReviewed(mk) {
          const list = (LJ.store.meta().reviewedPeriods || []).slice();
          if (list.indexOf(mk) < 0) list.push(mk);
          LJ.store.setMeta({ reviewedPeriods: list });
          LJ.store.log(userId, '完成周期复盘', mk);
          return true;
        }
      },

      /* ============================================================
         AI 智能助手（本地规则引擎）
         ============================================================ */
      ai: {
        suggestions() {
          return E.suggestions({
            entries: S.entries(), today: S.today(),
            budget: LJ.store.all('budget')[0]
          });
        },
        activeScenarios() { return E.activeScenarios(S.today()); },
        allScenarios() { return E.SCENARIOS; },
        plan(id) {
          return E.scenarioPlan(id, S.entries(), S.today(), LJ.store.all('budget')[0]);
        },
        applyScenario(id) {
          const list = (LJ.store.meta().appliedScenarios || []).slice();
          if (list.indexOf(id) < 0) list.push(id);
          LJ.store.setMeta({ appliedScenarios: list });
          LJ.store.insert('scenarioPlan', { userId, scenarioId: id, appliedAt: S.today() });
          LJ.store.log(userId, '采纳场景化规划', (E.SCENARIOS.find(s => s.id === id) || {}).name || id);
          return true;
        },
        applied() { return LJ.store.meta().appliedScenarios || []; },
        lifeStage() { return E.lifeStage(S.today()); },
        streak() { return E.streak(S.entries(), S.today()); },
        quickAsks() { return E.QUICK_ASKS; },
        caps() { return E.AI_CAPS; },
        /** 自然语言提问 → { title, body, stats, actions } */
        ask(text) {
          return E.ask(text, {
            entries: S.entries(), today: S.today(),
            budget: LJ.store.all('budget')[0],
            favorOverview: () => api.favor.overview()
          });
        }
      },

      /* ============================================================
         成长任务
         ============================================================ */
      task: {
        context() {
          return E.taskContext(S.entries(), S.today(), {
            budget: LJ.store.all('budget')[0],
            confirmedCount: LJ.store.where('supportRecord', r => r.status === 'confirmed').length,
            reviewedOnce: (LJ.store.meta().reviewedPeriods || []).length > 0,
            scenarioUsed: (LJ.store.meta().appliedScenarios || []).length
          });
        },
        list() { return E.evaluateTasks(api.task.context(), LJ.store.all('taskProgress')); },
        summary() { return E.taskSummary(api.task.list()); },

        /** 本人的留痕流水（按 actorId 圈定）。
            ★ 必须圈定：LJ.store.all('auditLog') 是**全库**的，
              里面还有另一个孩子和家长的动作 —— 不圈定就会把妹妹的动作
              算成哥哥的成长证据（同坑：多子女数据串台）。 */
        events() { return LJ.store.where('auditLog', e => e.actorId === userId); },

        /** 近 7 天的动作任务完成情况 */
        actions() { return E.actionWeek(api.task.events(), S.today()); },

        /** 某个区间的能力证据（父母端月报用） */
        evidence(from, to) { return E.actionEvidence(api.task.events(), from, to); },
        claim(taskId) {
          const t = E.TASKS.find(x => x.id === taskId);
          if (!t) throw new Error('任务不存在');
          if (LJ.store.all('taskProgress').some(p => p.taskId === taskId)) return false;
          LJ.store.insert('taskProgress', { userId, taskId, status: 'done', at: S.today() });
          LJ.store.log(userId, '达成成长任务', t.name);
          LJ.store.insert('message', {
            userId, type: 'system', title: '成长任务达成',
            body: t.name + ' · 解锁：' + t.reward, read: false, at: new Date().toISOString()
          });
          return true;        }
      },

      /* ============================================================
         认证报告 / 里程碑 / 纪念册
         ============================================================ */
      cert: {
        get() {
          const u = LJ.store.find('user', userId);
          return E.certification(S.entries(), S.today(), LJ.store.all('budget')[0],
            { name: u ? u.name : '' });
        }
      },
      milestone: { list() { return E.milestones(S.entries(), S.today()); } },
      album: {
        list() {
          const ms = E.milestones(S.entries(), S.today()).map(m => ({
            kind: 'milestone', date: m.date, icon: m.icon, title: m.name, desc: m.desc
          }));
          const sup = S.sorted(LJ.store.all('supportRecord')).map(r => ({
            kind: 'support', date: r.date, icon: '💠', title: r.purpose,
            amount: r.amount,
            desc: ({ confirmed: '已完成对账', pending: '待对账', declined: '已谢绝' }[r.status] || r.status) +
              (r.directed ? ' · 定向用途' : '')
          }));
          const goals = LJ.store.all('savingGoal').map(g => ({
            kind: 'goal', date: g.startDate, icon: g.icon || '🎯', title: g.title,
            desc: '共同目标 · 目标 ¥' + U.won(g.target)
          }));
          return ms.concat(sup, goals).sort((a, b) => a.date < b.date ? 1 : -1);
        },
        stats() {
          const e = S.entries();
          const dates = e.map(x => x.date).sort();
          return {
            from: dates[0] || S.today(), to: S.today(),
            days: dates.length ? U.diffDays(dates[0], S.today()) : 0,
            entries: e.length,
            supportCount: LJ.store.all('supportRecord').length,
            supportTotal: LJ.store.all('supportRecord').filter(r => r.status === 'confirmed')
              .reduce((s, r) => s + r.amount, 0)
          };
        }
      },

      /* ============================================================
         共同储蓄目标
         ============================================================ */
      savings: {
        list() { return LJ.store.all('savingGoal').map(E.savingProgress); },
        get(id) { const g = LJ.store.find('savingGoal', id); return g ? E.savingProgress(g) : null; },
        create(row) {
          const b = S.binding();
          const rec = LJ.store.insert('savingGoal', {
            familyId: b.familyId, title: row.title, icon: row.icon || '🎯',
            target: Number(row.target), startDate: S.today(),
            dueDate: U.addMonths(S.today(), row.months || 6),
            createdBy: userId, status: 'active',
            shares: row.shares || { [userId]: 0.5, [b.supporterId]: 0.5 },
            contributions: []
          });
          LJ.store.log(userId, '发起共同储蓄目标', row.title + ' ¥' + U.won(row.target));
          LJ.store.insert('message', {
            userId: b.supporterId, type: 'system', title: '有了一个新的共同目标',
            body: row.title + ' · 目标 ¥' + U.won(row.target), read: false, at: new Date().toISOString()
          });
          return rec;
        },
        contribute(id, amount, note) {
          const g = LJ.store.find('savingGoal', id);
          if (!g) throw new Error('目标不存在');
          if (!(amount > 0)) throw new Error('金额需要大于 0');
          g.contributions = g.contributions || [];
          g.contributions.push({ id: LJ.store.uid('c'), userId, amount: Number(amount), date: S.today(), note: note || '' });
          LJ.store.save('savingGoal');
          LJ.store.log(userId, '向共同目标存入', g.title + ' ¥' + U.won(amount));
          return E.savingProgress(g);
        },
        remove(id) {
          const g = LJ.store.find('savingGoal', id);
          LJ.store.log(userId, '结束共同目标', g ? g.title : id);
          return LJ.store.remove('savingGoal', id);
        }
      },

      /* ============================================================
         收到的支持邀约
         ============================================================ */
      invite: {
        list() {
          return S.sorted(LJ.store.where('invite', i => i.toId === userId));
        },
        pending() { return api.invite.list().filter(i => i.status === 'pending'); },
        accept(id) {
          const inv = LJ.store.find('invite', id);
          if (!inv) throw new Error('邀约不存在');
          LJ.store.update('invite', id, { status: 'accepted', resolvedAt: new Date().toISOString() });
          LJ.store.insert('supportRecord', {
            date: inv.date, amount: inv.amount, purpose: inv.title, cycle: 'once',
            providerId: inv.fromId, receiverId: userId,
            status: 'confirmed', confirmedAt: new Date().toISOString(),
            note: inv.note || '', directed: false
          });
          LJ.store.insert('entry', {
            date: inv.date, amount: inv.amount, direction: 'in', category: null,
            title: inv.title, merchant: '', note: inv.note || '',
            fundingSource: 'family', source: 'support'
          });
          LJ.store.log(userId, '收下支持邀约', inv.title + ' ¥' + U.won(inv.amount));
          return true;
        },
        decline(id, reason) {
          const inv = LJ.store.find('invite', id);
          LJ.store.update('invite', id, { status: 'declined', declineReason: reason || '', resolvedAt: new Date().toISOString() });
          LJ.store.log(userId, '谢绝支持邀约', (inv ? inv.title : id) + (reason ? ' · ' + reason : ''));
          const b = S.binding();
          LJ.store.insert('message', {
            userId: b.supporterId, type: 'system', title: '孩子谢绝了这次支持',
            body: '这是正常的边界表达，系统已记录，不需要追问。', read: false, at: new Date().toISOString()
          });
          return true;
        },
        /** 用一句话礼貌回应，不必解释太多 */
        SHORT_REPLIES: null
      },

      /* ============================================================
         账单主页 / 支出结构
         ============================================================ */
      ledger: {
        /** 主页顶部用的汇总：本月、今日、近 N 天柱状图 */
        overview(days) {
          days = days || 14;
          const e = S.entries(), today = S.today();
          const mk = U.monthKey(today);
          const m = M.monthTotals(e, mk);
          const passed = Math.max(1, U.parse(today).getDate());
          const todayOut = e.filter(x => x.date === today && x.direction === 'out')
            .reduce((s, x) => s + x.amount, 0);
          const todayIn = e.filter(x => x.date === today && x.direction === 'in')
            .reduce((s, x) => s + x.amount, 0);
          const series = [];
          for (let i = days - 1; i >= 0; i--) {
            const d = U.addDays(today, -i);
            series.push({
              date: d,
              amount: e.filter(x => x.date === d && x.direction === 'out')
                .reduce((s, x) => s + x.amount, 0)
            });
          }
          const totalCount = e.length;
          const n = U.ymdCN(today);
          return {
            month: mk, monthLabel: (U.parse(today).getMonth() + 1) + ' 月',
            expense: m.expense, income: m.income,
            avgPerDay: m.expense / passed,
            todayOut: todayOut, todayIn: todayIn,
            series: series, seriesMax: Math.max(1, ...series.map(s => s.amount)),
            count: totalCount,
            /* 本月有记录的每一天，用于"9月账单"标题 */
            monthCount: e.filter(x => String(x.date).slice(0, 7) === mk).length
          };
        },

        /** 支出结构（月/年通用）：分类占比 + 明细
            source: '' 全部 / 'family' 只看家庭支持金 / 'own' 只看个人自有资金
            归属是用户记账时确认的，不是系统按比例分摊的 */
        structure(scope, source) {
          const e = S.entries(), today = S.today();
          const mk = scope || U.monthKey(today);
          const isYear = mk.length === 4;
          const match = x => isYear
            ? String(x.date).slice(0, 4) === mk
            : String(x.date).slice(0, 7) === mk;
          let rows = e.filter(match);
          if (source) rows = rows.filter(x => (x.fundingSource || 'family') === source);
          const out = rows.filter(x => x.direction === 'out');
          const inn = rows.filter(x => x.direction === 'in');
          const total = out.reduce((s, x) => s + x.amount, 0);
          const cats = LJ.CATEGORIES.map(c => {
            const list = out.filter(x => x.category === c.id);
            const amt = list.reduce((s, x) => s + x.amount, 0);
            return {
              id: c.id, name: c.name, icon: c.icon, color: c.color,
              amount: Math.round(amt), count: list.length,
              ratio: total > 0 ? amt / total : 0
            };
          }).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

          const months = [];
          for (let i = 5; i >= 0; i--) months.push(U.monthKey(U.addMonths(today, -i)));

          /* 两个池子的当月情况，供视角切换时显示 */
          const poolOf = src => {
            const r = e.filter(x => match(x) && (x.fundingSource || 'family') === src);
            return {
              out: Math.round(r.filter(x => x.direction === 'out').reduce((s, x) => s + x.amount, 0)),
              count: r.filter(x => x.direction === 'out').length
            };
          };

          return {
            scope: mk, isYear, source: source || '',
            total: Math.round(total),
            income: Math.round(inn.reduce((s, x) => s + x.amount, 0)),
            cats: cats, count: rows.length, months: months,
            pools: { family: poolOf('family'), own: poolOf('own') },
            /* 有没有自有资金的支出 —— 没有的话视角按钮要给个说明 */
            ownUsed: poolOf('own').count > 0
          };
        }
      },

      /* ============================================================
         账户详情（双账户拆解）
         ============================================================ */
      account: {
        detail() {
          const e = S.entries();
          const b = M.balances(e);
          const by = fund => {
            const list = e.filter(x => x.fundingSource === fund);
            const inn = list.filter(x => x.direction === 'in');
            const out = list.filter(x => x.direction === 'out');
            const sum = a => Math.round(a.reduce((s, x) => s + x.amount, 0));
            return {
              inTotal: sum(inn), outTotal: sum(out),
              inCount: inn.length, outCount: out.length,
              recent: S.sorted(list).slice(0, 10),
              /* 转入来源 */
              sources: Object.values(inn.reduce((m, x) => {
                const k = x.title || '转入';
                m[k] = m[k] || { name: k, n: 0, sum: 0 };
                m[k].n++; m[k].sum += x.amount;
                return m;
              }, {})).sort((a, c) => c.sum - a.sum)
            };
          };
          /* 按大类看支持金花在哪 */
          const famOut = e.filter(x => x.fundingSource === 'family' && x.direction === 'out');
          const totalFamOut = famOut.reduce((s, x) => s + x.amount, 0) || 1;
          const cats = LJ.CATEGORIES.map(c => {
            const sum = famOut.filter(x => x.category === c.id).reduce((s, x) => s + x.amount, 0);
            return { id: c.id, name: c.name, icon: c.icon, color: c.color, amount: Math.round(sum), ratio: sum / totalFamOut };
          }).filter(c => c.amount > 0).sort((a, c) => c.amount - a.amount);

          return {
            balances: b,
            family: by('family'),
            own: by('own'),
            spendByCat: cats,
            supportCount: LJ.store.all('supportRecord').length
          };
        }
      },

      /* ============================================================
         银行卡管理
         重点不是「有几张卡」，而是「每张卡在临界里扮演什么角色」——
         角色定了，钱从哪来算哪个池子就定了，家人能看到的范围也定了。
         所以这一页改一个开关，账本的口径跟着变。
         ============================================================ */
      card: {
        ROLES: [
          {
            id: 'support', name: '家庭支持金入账卡', icon: '🏦',
            desc: '父母转来的生活费打在这张卡上，计入家庭支持金池'
          },
          {
            id: 'own', name: '个人自有资金卡', icon: '🎒',
            desc: '奖学金、红包、兼职收入放这张卡，余额不进家庭视图'
          },
          {
            id: 'daily', name: '日常消费扣款卡', icon: '💳',
            desc: '平时买东西默认从这张卡付，记账时算日常支出'
          }
        ],

        list() { return S.mine(LJ.store.all('bankCard')); },
        get(id) { return LJ.store.find('bankCard', id); },
        roleName(role) {
          const r = api.card.ROLES.find(x => x.id === role);
          return r ? r.name : '未设定';
        },
        roleMeta(role) { return api.card.ROLES.find(x => x.id === role) || null; },

        /* 当前各角色落在哪张卡上 */
        byRole(role) { return LJ.store.all('bankCard').find(c => c.role === role) || null; },

        /* 一笔账该算到哪张卡上。整本账按这个映射被三张卡切完，不重不漏 */
        cardOf(e) {
          const role = (e.direction === 'in')
            ? (e.fundingSource === 'family' ? 'support' : 'own')
            : 'daily';
          const c = api.card.byRole(role);
          return c ? c.id : null;
        },

        /* 这张卡承接了多少 —— 从账本里真算，不是编的 */
        stat(id) {
          const all = S.entries().filter(e => api.card.cardOf(e) === id);
          const inn = all.filter(e => e.direction === 'in');
          const out = all.filter(e => e.direction === 'out');
          const sum = a => Math.round(a.reduce((s, x) => s + x.amount, 0));
          /* 收入按名目拆开：生活费多少、红包多少 */
          const inc = Object.values(inn.reduce((m, x) => {
            const k = x.title || '转入';
            m[k] = m[k] || { name: k, n: 0, sum: 0 };
            m[k].n++; m[k].sum += x.amount;
            return m;
          }, {})).sort((a, b) => b.sum - a.sum);
          /* 支出按大类拆开 */
          const byCat = {};
          out.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
          const cats = LJ.CATEGORIES.map(c => ({
            id: c.id, name: c.name, icon: c.icon,
            amount: Math.round(byCat[c.id] || 0)
          })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);
          return {
            count: all.length, inCount: inn.length, outCount: out.length,
            inTotal: sum(inn), outTotal: sum(out),
            net: sum(inn) - sum(out),
            income: inc, cats: cats,
            recent: S.sorted(all).slice(0, 4)
          };
        },

        /* 换角色。角色不能重复 —— 撞了就和原来占着的那张卡对调，
           这样「三张卡切开整本账」的前提永远成立。 */
        setRole(id, role) {
          const c = LJ.store.find('bankCard', id);
          if (!c || c.role === role) return c;
          const other = api.card.byRole(role);
          const old = c.role;
          if (other && other.id !== id) LJ.store.update('bankCard', other.id, { role: old });
          LJ.store.update('bankCard', id, { role });
          LJ.store.log(userId, '调整银行卡角色', c.name + ' → ' + api.card.roleName(role));
          return LJ.store.find('bankCard', id);
        },

        setVisible(id, val) {
          const c = LJ.store.find('bankCard', id);
          if (!c) return null;
          LJ.store.log(userId, val ? '开放余额给家人' : '收回余额可见', c.name);
          return LJ.store.update('bankCard', id, { familyVisible: !!val });
        },

        setDefaultPay(id) {
          LJ.store.all('bankCard').forEach(c =>
            LJ.store.update('bankCard', c.id, { isDefaultPay: c.id === id }));
          return LJ.store.find('bankCard', id);
        },

        /* 冻结：三级预警里的应急手段，是这一页唯一"重"的操作 */
        freeze(id, on) {
          const c = LJ.store.find('bankCard', id);
          if (!c) return null;
          LJ.store.log(userId, on ? '冻结银行卡' : '解冻银行卡', c.name);
          return LJ.store.update('bankCard', id, { frozen: !!on });
        }
      },

      /* ============================================================
         三级风险预警
         规则判定全部在 engine.js（纯函数），这里只负责：落库、闭环、通知。
         最要紧的一条：家人拿到的通知走 E.riskSupporterNotice()，
         里面没有金额、没有商户、没有日期。一级事件家人根本收不到东西。
         ============================================================ */
      risk: {
        levels: E.RISK_LEVELS,
        level: id => E.riskLevel(id),
        tags: E.RISK_TAGS,

        whitelist() { return LJ.store.meta().riskWhitelist || []; },

        /** 扫描一遍并落库。没有新东西就不写、不发事件（否则会渲染循环） */
        sync() {
          const budget = LJ.store.all('budget')[0] || {};
          const today = S.today();
          const nowISO = LJ.clock.nowISO();
          const rows = LJ.store.table('riskEvent');
          const have = {};
          rows.forEach(r => { have[r.key] = r; });

          const found = E.riskScan({
            entries: S.entries(), budget, today,
            whitelist: api.risk.whitelist()
          });

          const fresh = found.filter(f => !have[f.key]);
          let changed = false;

          fresh.forEach(f => {
            const lv = E.riskLevel(f.level);
            const at = api.risk._atISO(f.date, nowISO);
            const row = {
              key: f.key, rule: f.rule, level: f.level, subtype: f.subtype,
              title: f.title, detail: f.detail, why: f.why, evidence: f.evidence,
              amount: f.amount, date: f.date, merchant: f.merchant, entryId: f.entryId,
              at: at,
              /* 一级只提醒本人；二级进入 24 小时缓冲；三级立即通知双方 */
              status: f.level === 3 ? 'notified' : f.level === 2 ? 'pending_parent' : 'open',
              deadline: f.level === 2 ? api.risk._plus24h(at) : null,
              youthRead: false, explain: '', notifyAt: f.level === 3 ? at : null,
              timeline: [{
                at: at, actor: 'system', level: f.level,
                action: '系统判定为' + lv.short + '事件',
                note: lv.policy
              }]
            };
            if (f.level === 3) {
              row.timeline.push({
                at: at, actor: 'system', action: '已同步家人',
                note: '通知只说明存在风险，不含金额与明细'
              });
            }
            row.id = LJ.store.uid('risk');
            row.createdAt = new Date().toISOString();
            rows.push(row);
            changed = true;
          });

          /* 二级到期：24 小时没回应，才把脱敏提示同步给家人 */
          const due = E.riskEscalations(rows, Date.parse(nowISO));
          due.forEach(r => {
            r.status = 'notified';
            r.notifyAt = nowISO;
            r.timeline.push({
              at: nowISO, actor: 'system', action: '超时未回应，已同步家人',
              note: '通知只说明存在异常，不含金额与明细'
            });
            api.risk._notifySupporter(r, nowISO);
            changed = true;
          });

          if (changed) {
            LJ.store.save('riskEvent');
            due.forEach(r => LJ.store.log(userId, '风险事件同步家人',
              '#' + r.id + ' ' + E.riskLevel(r.level).short));
          }
          return { added: fresh.length, escalated: due.length };
        },

        /** 事件时刻：用模拟日期 + 当天真实时间，这样快进一天倒计时真的会到期 */
        _atISO(date, nowISO) {
          const d = date || S.today();
          const hhmmss = String(nowISO).slice(11) || '09:00:00';
          return d + 'T' + hhmmss;
        },
        _plus24h(iso) {
          const d = U.addDays(String(iso).slice(0, 10), 1);
          return d + 'T' + String(iso).slice(11);
        },

        /** 给家人写通知：**脱敏后的内容**，明细一个字段都不带 */
        _notifySupporter(r, iso) {
          const notice = E.riskSupporterNotice(r);
          if (!notice) return null;
          const b = S.binding();
          return LJ.store.insert('message', {
            userId: b.supporterId, type: 'risk',
            title: notice.title, body: notice.body,
            riskLevel: notice.level, riskEventId: r.id,
            read: false, at: iso
          });
        },

        list() { return S.mine(LJ.store.all('riskEvent')).sort((a, b) => String(b.at).localeCompare(String(a.at))); },
        get(id) { return LJ.store.find('riskEvent', id); },
        active() { return api.risk.list().filter(r => r.status === 'open' || r.status === 'pending_parent'); },
        history() { return api.risk.list().filter(r => r.status !== 'open' && r.status !== 'pending_parent'); },
        openCount() { return api.risk.active().length; },
        /** 还没读过、需要引起注意的（首页角标用） */
        badge() {
          return api.risk.active().filter(r => !r.youthRead).length +
            api.risk.list().filter(r => r.status === 'notified' && !r.youthRead).length;
        },

        /** 倒计时：返回 { text, ms, due } */
        countdown(r) {
          if (!r || r.status !== 'pending_parent' || !r.deadline) return null;
          const ms = Date.parse(r.deadline) - Date.parse(LJ.clock.nowISO());
          const h = Math.max(0, Math.round(ms / 3600000));
          return {
            ms: ms, due: ms <= 0,
            text: ms <= 0 ? '已到期' : (h >= 1 ? '还剩约 ' + h + ' 小时' : '不到 1 小时'),
            dateText: U.ymdCN(String(r.deadline).slice(0, 10))
          };
        },

        /** 家人会看到什么 —— 青年端拿它做预览，让"不给明细"这件事看得见 */
        supporterPreview(r) { return E.riskSupporterNotice(r); },

        markRead(id) {
          const r = LJ.store.find('riskEvent', id);
          if (r && !r.youthRead) LJ.store.update('riskEvent', id, { youthRead: true });
          return r;
        },

        /** 我来说明 —— 二级事件在倒计时内说明，家人就不会收到任何通知 */
        explain(id, text) {
          const r = LJ.store.find('riskEvent', id);
          if (!r) return null;
          const iso = LJ.clock.nowISO();
          const was = r.status;
          r.timeline.push({
            at: iso, actor: 'youth', action: '我来说明',
            note: text || '（未填写说明）'
          });
          if (was === 'pending_parent') {
            r.timeline.push({
              at: iso, actor: 'system', action: '倒计时已停止',
              note: '你在 24 小时内回应了，家人没有收到任何通知'
            });
          }
          r.status = 'resolved';
          r.explain = text || '';
          r.youthRead = true;
          LJ.store.save('riskEvent');
          LJ.store.log(userId, '回应风险事件', '#' + r.id + ' ' + r.title);
          return r;
        },

        /** 直接标记已处理 */
        resolve(id, note) {
          const r = LJ.store.find('riskEvent', id);
          if (!r) return null;
          const iso = LJ.clock.nowISO();
          r.timeline.push({ at: iso, actor: 'youth', action: '标记已处理', note: note || '' });
          if (r.status === 'pending_parent') {
            r.timeline.push({
              at: iso, actor: 'system', action: '倒计时已停止',
              note: '家人没有收到任何通知'
            });
          }
          r.status = 'resolved';
          r.youthRead = true;
          LJ.store.save('riskEvent');
          return r;
        },

        /** 这很正常 —— 加进白名单，同类不再触发；顺手把当前这条也结掉 */
        whitelistAdd(word, note) {
          const w = String(word || '').trim();
          if (!w) return null;
          const list = api.risk.whitelist().slice();
          if (!list.some(x => x.word === w)) {
            list.push({ id: LJ.store.uid('wl'), word: w, note: note || '', at: LJ.clock.now() });
          }
          LJ.store.setMeta({ riskWhitelist: list });
          LJ.store.log(userId, '风险白名单新增', w + (note ? '（' + note + '）' : ''));
          /* 当前这条如果就是这个商户，一并结掉 */
          api.risk.active().forEach(r => {
            const t = (r.merchant || '') + ' ' + (r.title || '');
            if (t.indexOf(w) >= 0) api.risk.resolve(r.id, '已加入白名单');
          });
          return list;
        },
        whitelistRemove(id) {
          const list = api.risk.whitelist().filter(x => x.id !== id);
          LJ.store.setMeta({ riskWhitelist: list });
          return list;
        },

        /** 主动告诉家人（青年可自主选择提前同步，不用等 24 小时） */
        notifyNow(id, note) {
          const r = LJ.store.find('riskEvent', id);
          if (!r) return null;
          const iso = LJ.clock.nowISO();
          r.timeline.push({
            at: iso, actor: 'youth', action: '我主动告诉了家人',
            note: note || '由你自己选择同步，不用等倒计时'
          });
          r.status = 'notified';
          r.notifyAt = iso;
          r.youthRead = true;
          api.risk._notifySupporter(r, iso);
          LJ.store.save('riskEvent');
          LJ.store.log(userId, '主动同步风险事件给家人', '#' + r.id);
          return r;
        },

        /** 三级：家人可申请紧急临时冻结；青年端这边是自己先冻上，抢占时间 */
        freezeCard(cardId, id) {
          const c = api.card.freeze(cardId, true);
          const r = id ? LJ.store.find('riskEvent', id) : null;
          if (r) {
            r.timeline.push({
              at: LJ.clock.nowISO(), actor: 'youth', action: '冻结了银行卡',
              note: (c ? c.name : cardId) + '，先止血'
            });
            LJ.store.save('riskEvent');
          }
          return c;
        },

        /** 紧急通道：96110 + 银行客服，真实号码 */
        HOTLINE: [
          { name: '国家反诈专线', tel: '96110', note: '涉诈资金、可疑转账' },
          { name: '工商银行客服', tel: '95588', note: '银行卡挂失、临时冻结' },
          { name: '校园报警 / 派出所', tel: '110', note: '已经转出去的钱' }
        ],

        /* ---- 家人侧：只拿得到脱敏通知，拿不到事件明细 ---- */
        supporterNotices() {
          const b = S.binding();
          return LJ.store.where('message', m => m.userId === b.supporterId && m.type === 'risk')
            .sort((a, c) => String(c.at).localeCompare(String(a.at)));
        }
      },

      /* ============================================================
         生活费方案（3.5.3 寒暑假调整 / 3.5.5 毕业过渡递减）
         方案是双方的事：谁都可以发起，但必须对方确认才生效。
         生效后时间机器按方案发放，账本跟着变 —— 不是一个装饰性的设置项。
         ============================================================ */
      plan: {
        kinds: E.LIFE_PLAN_KINDS,
        modes: E.LIFE_PLAN_MODES,
        /** 约定好的月度生活费基准 */
        base() {
          const b = S.binding();
          return Number((b && b.supportAmount) || 0) || 2900;
        },
        list() {
          return S.mine(LJ.store.all('lifePlan')).sort((a, b) =>
            String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        },
        get(id) { return LJ.store.find('lifePlan', id); },
        active() { return api.plan.list().filter(p => p.status === 'active'); },
        /** 别人发起、等我确认的 */
        incoming() {
          return api.plan.list().filter(p => p.status === 'pending' && p.proposedRole !== 'youth');
        },
        /** 我发起、等对方确认的 */
        outgoing() {
          return api.plan.list().filter(p => p.status === 'pending' && p.proposedRole === 'youth');
        },
        schedule(plan) { return E.planSchedule(plan); },
        summary(plan) { return E.planSummary(plan); },
        amountOn(monthKey, plans) {
          return E.supportFor(monthKey, plans || api.plan.active(), api.plan.base());
        },
        /** 假期结束后的复盘（没结束返回 null） */
        review(plan) { return E.holidayReview(plan, S.entries(), S.today()); },

        _push(plan, actor, action, note) {
          plan.log = plan.log || [];
          plan.log.push({ at: LJ.clock.nowISO(), actor: actor, action: action, note: note || '' });
        },

        /** 发起一个方案 */
        create(row) {
          const b = S.binding();
          const rec = LJ.store.insert('lifePlan', {
            familyId: b.familyId, youthId: b.youthId, kind: row.kind || 'holiday',
            name: row.name || '生活费调整',
            from: row.from || S.today(), to: row.to || U.addMonths(S.today(), 1),
            startMonth: row.startMonth || S.today().slice(0, 7),
            months: Number(row.months) || 6,
            mode: row.mode || 'half', base: api.plan.base(),
            proposedBy: userId, proposedRole: 'youth', status: 'pending',
            note: row.note || '', decidedAt: null, review: null,
            log: [{ at: LJ.clock.nowISO(), actor: 'youth', action: '发起方案', note: row.note || '' }]
          });
          const other = userId === b.youthId ? b.supporterId : b.youthId;
          LJ.store.insert('message', {
            userId: other, type: 'plan', title: '有一份生活费方案等你确认',
            body: E.planSummary(rec) + '。确认后从生效月起按新方案发放。',
            read: false, at: LJ.clock.nowISO()
          });
          LJ.store.log(userId, '发起生活费方案', E.planSummary(rec));
          return rec;
        },

        /** 确认生效 */
        confirm(id) {
          const p = LJ.store.find('lifePlan', id);
          if (!p) return null;
          api.plan._push(p, 'youth', '确认生效', '从 ' + (p.kind === 'taper' ? p.startMonth : p.from) + ' 起按方案发放');
          p.status = 'active';
          p.decidedAt = LJ.clock.nowISO();
          LJ.store.save('lifePlan');
          const b = S.binding();
          LJ.store.insert('message', {
            userId: b.supporterId, type: 'plan', title: '生活费方案已确认',
            body: E.planSummary(p) + '。已从生效月起执行。',
            read: false, at: LJ.clock.nowISO()
          });
          LJ.store.log(userId, '确认生活费方案', E.planSummary(p));
          return p;
        },

        /** 婉拒 / 想再聊聊。不生效，但把理由记下来推给对方 */
        decline(id, reason) {
          const p = LJ.store.find('lifePlan', id);
          if (!p) return null;
          api.plan._push(p, 'youth', '想再聊聊', reason || '（未填写）');
          p.status = 'declined';
          p.decidedAt = LJ.clock.nowISO();
          LJ.store.save('lifePlan');
          const b = S.binding();
          LJ.store.insert('message', {
            userId: b.supporterId, type: 'plan', title: '生活费方案被婉拒了',
            body: '孩子想再聊聊：' + (reason || '（未填写理由）'),
            read: false, at: LJ.clock.nowISO()
          });
          LJ.store.log(userId, '婉拒生活费方案', reason || '');
          return p;
        },

        /** 结束一个方案（提前恢复） */
        end(id) {
          const p = LJ.store.find('lifePlan', id);
          if (!p) return null;
          api.plan._push(p, 'youth', '提前结束', '恢复按基准发放');
          p.status = 'done';
          LJ.store.save('lifePlan');
          return p;
        },

        /** 假期结束就顺手把复盘存下来；跑完的递减方案标记为已完成（幂等） */
        syncReview() {
          let n = 0;
          api.plan.list().forEach(p => {
            /* 递减跑完 → 收尾，状态改成 done。
               不改的话它会一直挂着"进行中"，而且 supportFor 靠 done 判断
               "这个人已经过渡完了、不该再发生活费"。 */
            if (p.kind === 'taper' && p.status === 'active' && E.planFinishedBefore(p, S.today().slice(0, 7))) {
              api.plan._push(p, 'system', '递减计划已完成', '从这个月起不再发放生活费');
              p.status = 'done';
              LJ.store.save('lifePlan');
              n++;
              return;
            }
            if (p.kind !== 'holiday' || p.review) return;
            const rv = E.holidayReview(p, S.entries(), S.today());
            if (!rv) return;
            p.review = rv;
            api.plan._push(p, 'system', '假期结束，自动生成消费复盘',
              '假期 ' + rv.days + ' 天 · 支出 ¥' + rv.expense + ' · 日均 ¥' + rv.avg);
            LJ.store.save('lifePlan');
            n++;
          });
          return n;
        }
      },

      /* ============================================================
         成长任务的解锁（3.3.4）
         以前 reward 只是通知里的一句话，没有任何门禁。
         现在 UI 用 api.unlock.has(key) 判断，未解锁显示"完成任务解锁"的卡。
         ============================================================ */
      unlock: {
        list() {
          const tasks = api.task.list();
          return E.UNLOCKS.map(u => {
            const t = tasks.find(x => x.id === u.taskId) || {};
            return {
              key: u.key, name: u.name, where: u.where,
              taskId: u.taskId, taskName: t.name || '', taskDesc: t.desc || '',
              taskGo: t.go || null, taskGoLabel: t.goLabel || '去做',
              done: !!t.done
            };
          });
        },
        has(key) {
          if (!E.unlockOf(key)) return true;
          return E.unlocked(api.task.list(), key);
        },
        locked(key) { return !api.unlock.has(key); },
        /** 未解锁时给 UI 用的一句说明 */
        reason(key) {
          const u = E.unlockOf(key);
          if (!u) return '';
          const t = api.task.list().find(x => x.id === u.taskId) || {};
          return '完成「' + (t.name || u.name) + '」解锁';
        },
        /** 未解锁时 UI 要显示的任务信息 */
        pending(key) { return api.unlock.list().find(x => x.key === key) || null; }
      },

      /* ============================================================
         大学阶段财务成长报告（3.5.5）
         ============================================================ */
      grad: {
        report() {
          return E.gradReport(S.entries(), LJ.store.all('supportRecord'),
            LJ.store.where('taskProgress', t => t.status === 'done'), S.today());
        }
      },

      /* ============================================================
         专项资金（3.5.1 开学季 / 3.5.2 实习求职季 / 3.5.4 应急医疗）
         钱只能花在约定的大类上；家人只看到"用了多少"，看不到买了什么。
         ============================================================ */
      fund: {
        kinds: E.FUND_KINDS,
        list() {
          return LJ.store.all('fund').slice().sort((a, b) =>
            String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        },
        get(id) { return LJ.store.find('fund', id); },
        active() { return api.fund.list().filter(f => f.status === 'active'); },
        /** 当前该推的场景（3.5.1/3.5.2 的"自动识别时间节点"） */
        scene() { return E.fundScene(S.today()); },
        progress(fund) { return E.fundProgress(fund, S.entries(), S.today()); },
        /** 某个大类的支出该从哪个专项扣（记一笔时用） */
        matchFor(category) { return E.fundFor(category, api.fund.active(), S.today()); },

        /** 专项结束后的复盘（3.5.1/3.5.2/3.5.5 要求"场景结束后自动生成复盘"） */
        review(id) {
          const f = LJ.store.find('fund', id);
          if (!f) return null;
          /* 已生成过就直接用存下来的那份 —— 复盘是"那一刻的结论"，
             账本后来再变也不该改写历史结论（和分享卡片快照同一个道理）。 */
          if (f.review) return f.review;
          return E.fundReview(f, S.entries(), S.today());
        },
        /** 有复盘的专项（按时间倒序） */
        reviewed() {
          return api.fund.list().filter(f => f.review || E.fundReview(f, S.entries(), S.today()));
        },
        /** 巡检：专项一结束就把复盘存下来（幂等，同 plan.syncReview） */
        syncReview() {
          let n = 0;
          api.fund.list().forEach(f => {
            if (f.review) return;
            const rv = E.fundReview(f, S.entries(), S.today());
            if (!rv) return;
            f.review = rv;
            (f.log = f.log || []).push({
              at: LJ.clock.nowISO(), actor: 'system', action: '专项结束，自动生成复盘',
              note: '用了 ¥' + U.wonInt(rv.used) + ' / 计划 ¥' + U.wonInt(rv.target)
            });
            LJ.store.save('fund');
            LJ.store.insert('message', {
              userId: userId, type: 'support', title: '一个专项结束了',
              body: '「' + rv.name + '」复盘已生成：执行率 ' + Math.round(rv.executed * 100) + '%',
              read: false, at: LJ.clock.nowISO()
            });
            LJ.store.log(userId, '查看专项复盘', rv.name);
            n++;
          });
          return n;
        },
        /** 记一笔时挑一个可用的专项（供弹层展示） */
        usable() {
          const today = S.today();
          return api.fund.active().filter(f => f.category &&
            (!f.periodStart || f.periodStart <= today) &&
            (!f.periodEnd || f.periodEnd >= today));
        },

        /**
         * 家人转入一笔专项金：同时生成账本收入，钱才算真的在池子里。
         * 这是 3.5.1 说的"一键转入开学专项金，单独记账管理"。
         */
        topUp(id, amount, note) {
          const f = LJ.store.find('fund', id);
          if (!f) return null;
          const amt = Number(amount);
          if (!(amt > 0)) throw new Error('金额需要大于 0');
          const date = S.today();
          const e = LJ.store.insert('entry', {
            date: date, amount: amt, direction: 'in', category: null,
            title: f.name, merchant: '', note: note || '',
            fundingSource: 'family', source: 'fund', fundId: f.id
          });
          LJ.store.insert('supportRecord', {
            id: LJ.store.uid('sr'), date: date, amount: amt, purpose: f.name,
            cycle: 'once', providerId: userId, receiverId: f.receiverId,
            status: 'confirmed', confirmedAt: LJ.clock.nowISO(),
            note: '专项支持 · ' + (note || ''), directed: true,
            directedCategory: f.category || null, fundId: f.id
          });
          f.log = f.log || [];
          f.log.push({
            at: LJ.clock.nowISO(), actor: 'supporter', action: '转入专项金',
            note: '¥' + U.won(amt) + (note ? ' · ' + note : '')
          });
          LJ.store.save('fund');
          LJ.store.log(userId, '转入专项金', f.name + ' ¥' + U.won(amt));
          LJ.store.insert('message', {
            userId: f.receiverId, type: 'support', title: '专项金已到账',
            body: '「' + f.name + '」¥' + U.won(amt) + ' 已到账，只能用于' +
              (LJ.catById(f.category).name || '约定用途') + '。',
            read: false, at: LJ.clock.nowISO()
          });
          return e;
        },

        /** 结项：把钱结清，剩余留给下一个专项或退回 */
        close(id) {
          const f = LJ.store.find('fund', id);
          if (!f) return null;
          const p = E.fundProgress(f, S.entries(), S.today());
          f.status = 'closed';
          f.closedAt = LJ.clock.nowISO();
          f.log = f.log || [];
          f.log.push({
            at: LJ.clock.nowISO(), actor: 'supporter', action: '结项',
            note: '共转入 ¥' + U.won(p.inTotal) + '，用掉 ¥' + U.won(p.used)
          });
          LJ.store.save('fund');
          return f;
        },

        /** 家人侧的进度视图：**只有金额和笔数，没有明细** */
        overview(fund) {
          const p = api.fund.progress(fund);
          return {
            id: fund.id, name: fund.name, kind: fund.kind,
            category: fund.category, categoryName: LJ.catById(fund.category).name,
            periodStart: fund.periodStart, periodEnd: fund.periodEnd,
            status: fund.status,
            inTotal: p.inTotal, used: p.used, remaining: p.remaining,
            ratio: p.ratio, target: p.target, count: p.count, over: p.over
          };
        }
      },

      /* ============================================================
         人物与人情往来
         ============================================================ */
      person: {
        list() { return LJ.store.all('person'); },
        get(id) { return LJ.store.find('person', id); },
        create(row) {
          const rec = LJ.store.insert('person', {
            name: row.name,
            relation: row.relation || '朋友',
            avatar: String(row.name || '?').slice(0, 1),
            birthday: row.birthday || '',
            tags: row.tags || []
          });
          LJ.store.log(userId, '添加一位朋友', row.name);
          return rec;
        },
        remove(id) {
          const p = LJ.store.find('person', id);
          LJ.store.log(userId, '移除朋友', p ? p.name : id);
          return LJ.store.remove('person', id);
        }
      },

      favor: {
        list(filter) {
          filter = filter || {};
          let list = LJ.store.all('favor');
          if (filter.personId) list = list.filter(f => f.personId === filter.personId);
          if (filter.direction) list = list.filter(f => f.direction === filter.direction);
          return list.slice().sort((a, b) => a.date < b.date ? 1 : -1);
        },
        create(row) {
          if (!row.personId) throw new Error('请选择对象');
          const rec = LJ.store.insert('favor', {
            personId: row.personId,
            direction: row.direction || 'out',
            kind: row.kind || 'gift',
            occasion: row.occasion || '日常',
            amount: Number(row.amount) || 0,
            item: row.item || '',
            date: row.date || S.today(),
            note: row.note || '',
            returned: false
          });
          const p = LJ.store.find('person', row.personId) || {};
          LJ.store.log(userId, row.direction === 'in' ? '记一笔收到的礼' : '记一笔送出的礼',
            (p.name || '') + ' · ' + (row.occasion || '日常'));
          return rec;
        },
        remove(id) { return LJ.store.remove('favor', id); },
        markReturned(id) { return LJ.store.update('favor', id, { returned: true }); },
        byPerson(id) { return E.favorByPerson(id, LJ.store.all('favor'), S.today()); },
        overview() { return E.favorOverview(LJ.store.all('person'), LJ.store.all('favor'), S.today()); },
        reminders() { return api.favor.overview().pending; },
        kindLabel(kind) {
          return ({ meal: '一起吃饭', gift: '礼物', redpacket: '随礼 / 红包', cash: '现金', help: '帮忙', other: '其他' })[kind] || kind;
        }
      },

      /* ============================================================
         预支与还款
         ============================================================ */
      prepay: {
        list() { return LJ.store.where('prepayPlan', p => p.userId === userId).map(p => E.prepayPlan(p, S.today())); },
        get(id) { const p = LJ.store.find('prepayPlan', id); return p ? E.prepayPlan(p, S.today()) : null; },
        create(row) {
          const b = S.binding();
          const periods = Math.max(1, Number(row.periods) || 1);
          const rec = LJ.store.insert('prepayPlan', {
            familyId: b.familyId, userId, providerId: b.supporterId,
            amount: Number(row.amount), purpose: row.purpose, periods,
            perPeriod: Math.round(Number(row.amount) / periods * 100) / 100,
            startDate: S.today(), status: 'active', repayments: [],
            expectConfirm: true
          });
          LJ.store.log(userId, '申请预支', row.purpose + ' ¥' + U.won(row.amount) + ' · 分 ' + periods + ' 期');
          LJ.store.insert('message', {
            userId: b.supporterId, type: 'request', title: '收到一笔预支申请',
            body: row.purpose + ' ¥' + U.won(row.amount) + ' · 计划分 ' + periods + ' 期归还',
            read: false, at: new Date().toISOString()
          });
          return rec;
        },
        repay(id, amount, note) {
          const p = LJ.store.find('prepayPlan', id);
          if (!p) throw new Error('预支计划不存在');
          if (!(amount > 0)) throw new Error('金额需要大于 0');
          p.repayments = p.repayments || [];
          p.repayments.push({
            id: LJ.store.uid('r'), period: p.repayments.length + 1,
            amount: Number(amount), date: S.today(), note: note || ''
          });
          LJ.store.save('prepayPlan');
          LJ.store.log(userId, '归还预支', p.purpose + ' ¥' + U.won(amount));
          return E.prepayPlan(p, S.today());
        },
        cancel(id) {
          LJ.store.update('prepayPlan', id, { status: 'cancelled' });
          LJ.store.log(userId, '终止预支计划', id);
          return true;
        }
      },

      /* ============================================================
         账单导入
         ============================================================ */
      import: {
        sample() { return E.sampleStatement(S.today()); },
        parse(text) { return E.parseStatement(text); },
        commit(rows) {
          if (!rows || !rows.length) throw new Error('没有可导入的记录');
          let n = 0;
          rows.forEach(r => {
            const isSupport = r.direction === 'in' && /生活费|妈妈|爸爸|母亲|父亲|家人/.test((r.merchant || '') + (r.note || ''));
            LJ.store.insert('entry', {
              date: r.date, amount: r.amount, direction: r.direction,
              category: r.direction === 'in' ? null : (r.category || 'daily'),
              title: r.direction === 'in' ? (r.merchant || '入账') : null,
              merchant: r.merchant || '', note: r.note || '账单导入',
              /* 用户在批量核对里改过的归属优先；没改过的走启发式判断
               （生活费关键词 → 支持金；其他收入 → 自有；支出 → 支持金） */
            fundingSource: r.fundingSource ||
              (isSupport ? 'family' : (r.direction === 'in' ? 'own' : 'family')),
              source: 'import'
            });
            n++;
          });
          LJ.store.log(userId, '导入账单', n + ' 条记录');
          LJ.store.insert('message', {
            userId, type: 'system', title: '账单导入完成',
            body: '已导入 ' + n + ' 条记录，可在账单页按分类查看。',
            read: false, at: new Date().toISOString()
          });
          return n;
        }
      },

      /* ============================================================
         智能客服 / 帮助
         ============================================================ */
      service: {
        FAQ: [
          { q: '家人能看到我的每一笔消费吗？', a: '不能。单笔交易明细在服务端就不会下发到支持人端。对方只能看到你按约定开放的范围，通常是六大类的月度总额。', tags: ['隐私', '明细', '家人', '看到'] },
          { q: '信息范围是谁定的？', a: '双方共同确认。你可以在「我的 → 省心模式」里发起调整，对方也可以发起，但都需要另一方确认后才生效，且全程留痕。', tags: ['范围', '授权', '省心模式', '调整'] },
          { q: '家庭支持资金和个人自有资金有什么区别？', a: '家庭支持资金是家人转来的部分，可按约定开放宏观状态；个人自有资金（奖学金、红包等）默认完全独立，不对家人开放任何信息。', tags: ['双账户', '资金', '自有', '支持金'] },
          { q: '为什么要做支持对账？', a: '因为口头说不清。每一笔支持由双方共同确认后才计入账本，边界清楚，也避免了「我以为给了」这类误会。', tags: ['对账', '支持', '确认'] },
          { q: '如果我不想接受一笔支持？', a: '可以直接暂不确认，或者在收到的邀约里选择谢绝。对方会收到一个中性的提示，不会有对抗性的表达。', tags: ['拒绝', '邀约', '谢绝', '不想'] },
          { q: '撤回授权之后会怎样？', a: '对方立即失去对应范围的读取权限。历史留痕仍然保留，因为留痕本身也是保护你的。', tags: ['撤回', '授权', '留痕'] },
          { q: '掌控指数是怎么算出来的？', a: '由四个维度加权：预算执行率 30%、储蓄率 25%、支出平稳度 25%、风险抵御力 20%。用滚动 90 天的数据计算，避免短期波动造成误判。', tags: ['掌控指数', '分数', '算法', '怎么算'] },
          { q: '预支和还款是怎么回事？', a: '当你在生活费周期中段需要一笔额外资金时，可以发起预支，约定分几期从后续生活费里归还。它把「再要一次钱」变成了一次对等的资金安排。', tags: ['预支', '还款', '借款'] },
          { q: '订阅管理是做什么的？', a: '自动从你的账单里识别周期性扣费（会员、云盘等），汇总每个月的固定支出，并在续费前提醒你。很多人的钱就是这样悄悄流走的。', tags: ['订阅', '会员', '扣费'] },
          { q: '账单怎么导入？', a: '在「微信支付」公众号下载账单，发到文件传输助手，然后在账单页选择导入，把文件内容粘贴进来即可。支付宝账单同理。', tags: ['导入', '账单', 'csv', '微信'] }
        ],
        ask(q) {
          const t = String(q || '').toLowerCase();
          if (!t.trim()) return null;
          let best = null, bestScore = 0;
          api.service.FAQ.forEach(f => {
            let score = 0;
            f.tags.forEach(tag => { if (t.indexOf(tag.toLowerCase()) >= 0) score += 2; });
            if (t.indexOf(f.q.slice(0, 4)) >= 0) score += 3;
            if (score > bestScore) { bestScore = score; best = f; }
          });
          return best;
        },
        hotline() {
          return [
            { name: '96110 反诈专线', tel: '96110', desc: '怀疑遇到诈骗时优先拨打' },
            { name: '银行客服专线', tel: '95588', desc: '账户异常、卡片挂失' },
            { name: '校园心理支持', tel: '', desc: '因家庭经济问题感到压力时，可以找辅导员或心理中心聊聊' }
          ];
        },

        /* ---- 人工客服 ----
           以前这一页只有 FAQ，"需要人工协助"只是一句话，连按钮都没有。
           现在有真入口：提交工单会落一条留痕 + 一条回执，回执进消息中心，
           下面的列表读的就是这些回执 —— 不是弹个 toast 就完事。 */
        AGENTS: [
          { id: 'online', name: '在线客服', icon: '💬', desc: '9:00 – 21:00 · 平均 2 分钟接入' },
          { id: 'phone', name: '电话客服', icon: '📞', desc: '95588 转 0 · 7×24 小时' },
          { id: 'risk', name: '风险与反诈', icon: '🛡', desc: '96110 · 涉诈资金优先处理' }
        ],

        /** 我提过的工单（就是带 type:'service' 的消息） */
        tickets() {
          return LJ.store.where('message', m => m.userId === userId && m.type === 'service')
            .sort((a, b) => String(b.at).localeCompare(String(a.at)))
            .map(m => ({
              id: m.id, ticketNo: m.ticketNo, title: m.title, body: m.body,
              status: m.status || 'open', at: m.at,
              date: (m.at || '').slice(0, 10),
              replyIn: m.replyIn || '2 小时内',
              reply: m.reply || null
            }));
        },

        /**
         * 提交工单。分类决定走哪条线，也决定承诺的响应时间 ——
         * 反诈类直接标"立即接入"，其他按工作时间算。
         */
        submitWorkOrder(question, category) {
          const q = String(question || '').trim();
          if (!q) throw new Error('写一句问题描述');
          const cat = category || 'online';
          const urgent = cat === 'risk' || cat === 'phone';
          const no = 'LJ' + String(Date.now()).slice(-8);
          const rec = LJ.store.insert('message', {
            userId: userId, type: 'service', ticketNo: no, status: 'open',
            title: '工单已受理 · ' + no,
            body: q, category: cat,
            replyIn: urgent ? '优先接入，请留意来电' : '2 小时内（9:00–21:00）',
            at: LJ.clock.nowISO()
          });
          LJ.store.log(userId, '提交客服工单', no + ' · ' + (cat === 'risk' ? '反诈' : cat) + ' · ' + q.slice(0, 24));
          return { id: rec.id, ticketNo: no, replyIn: rec.replyIn, urgent: urgent, category: cat };
        },

        closeTicket(id) {
          const m = LJ.store.find('message', id);
          if (!m) return false;
          LJ.store.update('message', id, { status: 'closed' });
          return true;
        }
      }
    };
    return scopeApi(api, userId);
  }

  /* ============================================================
     支持人端 API —— 注意：这个对象上没有 entry，也没有任何明细接口
     ============================================================ */
  function makeSupporterApi(userId) {
    const api = {
      role: 'supporter',
      userId,

      profile() { return LJ.store.find('user', userId); },
      binding() { return S.binding(); },
      youth() {
        const b = S.binding(); if (!b) return null;
        const u = LJ.store.find('user', b.youthId);
        return u ? { id: u.id, name: u.name, nickname: u.nickname, avatar: u.avatar } : null;
      },

      /* ---- 多子女切换（3.4.1.1）----
         支持人可能同时在支持几个孩子。"当前在看谁"记在 meta.activeChildId，
         切完之后下面所有接口都跟着换人 —— 不是在前端做过滤，
         而是 S.binding() / S.entries() 本身就换了人。 */
      children() { return S.children(); },
      activeChild() { return S.activeYouthId(); },
      switchChild(id) {
        const list = S.children();
        const c = list.find(x => x.id === id);
        if (!c) throw new Error('没有这个孩子');
        S.switchChild(id);
        LJ.store.log(userId, '切换查看的孩子', c.name);
        return c;
      },

      /* ---- 状态：四色 + 健康度，全部是聚合结果 ---- */
      status() {
        const cfg = LJ.disclosure.configFor(S.binding());
        const out = { mode: cfg.id, modeName: cfg.name, shows: cfg.shows };
        out.status = computeStatus();
        if (LJ.disclosure.can(S.binding(), 'health')) out.health = computeHealth();
        if (LJ.disclosure.can(S.binding(), 'categoryMonthly')) out.categories = computeCategoryMonthly();
        if (LJ.disclosure.can(S.binding(), 'budgetProgress')) out.budget = computeBudgetProgress();
        if (LJ.disclosure.can(S.binding(), 'directedProgress')) out.directed = computeDirectedProgress();
        return out;
      },

      /* ---- 发放管理 ---- */
      payout: {
        history() {
          return S.sorted(LJ.store.where('supportRecord', r => r.cycle === 'month'))
            .map(r => ({ id: r.id, date: r.date, amount: r.amount, purpose: r.purpose, status: r.status }));
        },
        /* 下次发放读 binding.supportAmount，不再写死 2400 ——
           那是早期遗留的硬编码，和种子的 2900 对不上，
           支持人端页面上会少显示 500。多子女下每个孩子还各不相同。 */
        next() {
          const b = S.binding();
          return {
            date: M.nextPayday(S.today()),
            days: M.daysToPayday(S.today()),
            amount: Number((b && b.supportAmount) || 0) || 2900
          };
        }
      },

      /* ---- 支持登记 ---- */
      support: {
        register(row) {
          const b = S.binding();
          const rec = LJ.store.insert('supportRecord', {
            date: row.date || S.today(), amount: row.amount, purpose: row.purpose,
            cycle: row.cycle || 'once', providerId: userId, receiverId: b.youthId,
            status: 'pending', confirmedAt: null, note: row.note || '',
            directed: !!row.directed, directedCategory: row.directedCategory || null
          });
          LJ.store.log(userId, '登记一笔支持', `${row.purpose} ¥${U.won(row.amount)}`);
          LJ.store.insert('message', {
            userId: b.youthId, type: 'support', title: '有一笔支持待对账',
            body: `${row.purpose} ¥${U.won(row.amount)}`, read: false, at: new Date().toISOString()
          });
          return rec;
        },
        list() {
          return S.sorted(LJ.store.where('supportRecord', r => r.providerId === userId))
            .map(r => ({ id: r.id, date: r.date, amount: r.amount, purpose: r.purpose, status: r.status, directed: r.directed }));
        }
      },

      /* ---- 协商响应 ---- */
      request: {
        list() {
          return S.sorted(LJ.store.where('request', r => r.youthId === ((S.binding() || {}).youthId)))
            .map(r => ({
              id: r.id, name: r.name, amount: r.amount, reason: r.reason,
              date: r.date, status: r.status,
              responseAmount: r.responseAmount, responseNote: r.responseNote
            }));
        },
        pending() { return api.request.list().filter(r => r.status === 'pending'); },
        respond(id, opt) {
          const r = LJ.store.find('request', id);
          if (!r) throw new Error('申请不存在');
          LJ.store.update('request', id, {
            status: opt.action, responseAmount: opt.amount != null ? opt.amount : null,
            responseNote: opt.note || '', respondedAt: new Date().toISOString()
          });
          LJ.store.log(userId, '响应对账申请', `${r.name} → ${opt.action}`);

          if (opt.action === 'full' || opt.action === 'partial') {
            const amt = opt.action === 'full' ? r.amount : opt.amount;
            LJ.store.insert('supportRecord', {
              date: S.today(), amount: amt, purpose: r.name, cycle: 'once',
              providerId: userId, receiverId: r.youthId,
              status: 'pending', confirmedAt: null,
              note: opt.note || '', directed: false
            });
          }
          LJ.store.insert('message', {
            userId: r.youthId, type: 'request',
            title: '你的支持申请有了回应',
            body: `${r.name} · ${({ full: '全额支持', partial: '部分支持', defer: '暂缓支持', reject: '暂不处理' })[opt.action]}`,
            read: false, at: new Date().toISOString()
          });
          return true;
        }
      },

      /* ---- 信息范围 ---- */
      disclosure: {
        current() { return LJ.disclosure.configFor(S.binding()); },
        /** 支持人只能发起申请，不能直接改 */
        propose(mode) {
          const b = S.binding();
          LJ.store.update('binding', b.id, { proposedMode: mode, proposedBy: userId });
          LJ.store.log(userId, '发起信息范围调整申请', LJ.disclosure.MODES[mode].name + '（待子女确认）');
          LJ.store.insert('message', {
            userId: b.youthId, type: 'system', title: '家人想调整信息范围',
            body: '调整为「' + LJ.disclosure.MODES[mode].name + '」，需要你确认后生效。',
            read: false, at: new Date().toISOString()
          });
          return true;
        },
        grants() { return LJ.disclosure.grantRows(S.binding()); }
      },

      /* ---- 主动支持邀约 ---- */
      invite: {
        list() { return S.sorted(LJ.store.where('invite', i => i.fromId === userId)); },
        create(row) {
          const b = S.binding();
          const rec = LJ.store.insert('invite', {
            familyId: b.familyId, fromId: userId, toId: b.youthId,
            kind: row.kind || 'gift', title: row.title, amount: Number(row.amount),
            note: row.note || '', occasion: row.occasion || '',
            status: 'pending', date: S.today()
          });
          LJ.store.log(userId, '发起主动支持邀约', row.title + ' ¥' + U.won(row.amount));
          LJ.store.insert('message', {
            userId: b.youthId, type: 'support', title: '收到一份主动支持',
            body: row.title + ' ¥' + U.won(row.amount) + ' · 你可以选择收下或谢绝',
            read: false, at: new Date().toISOString()
          });
          return rec;
        }
      },

      /* ---- 共同储蓄目标 ---- */
      savings: {
        list() { return LJ.store.all('savingGoal').map(E.savingProgress); },
        contribute(id, amount, note) {
          const g = LJ.store.find('savingGoal', id);
          if (!g) throw new Error('目标不存在');
          if (!(amount > 0)) throw new Error('金额需要大于 0');
          g.contributions = g.contributions || [];
          g.contributions.push({ id: LJ.store.uid('c'), userId, amount: Number(amount), date: S.today(), note: note || '' });
          LJ.store.save('savingGoal');
          LJ.store.log(userId, '向共同目标存入', g.title + ' ¥' + U.won(amount));
          return E.savingProgress(g);
        }
      },

      /* ---- 成长纪念册 ---- */
      album: {
        list() {
          const b = S.binding();
          const y = LJ.store.find('user', b.youthId) || {};
          const ms = E.milestones(S.entries(), S.today()).map(m => ({
            kind: 'milestone', date: m.date, icon: m.icon, title: m.name, desc: m.desc
          }));
          const sup = S.sorted(LJ.store.all('supportRecord')).map(r => ({
            kind: 'support', date: r.date, icon: '💠', title: r.purpose, amount: r.amount,
            desc: ({ confirmed: '已完成对账', pending: '待对账', declined: '已谢绝' }[r.status] || r.status)
          }));
          return ms.concat(sup).sort((a, c) => a.date < c.date ? 1 : -1);
        }
      },

      audit: {
        list() { return S.sorted(LJ.store.all('auditLog').map(a => ({ ...a, date: (a.at || '').slice(0, 10) }))); },
        /** 记录一次查看行为 */
        markViewed(page) { LJ.store.log(userId, '查看', page); }
      },

      message: {
        /* 订阅偏好在两端都生效 —— 家长也会被"孩子每天的记账"烦到 */
        list() {
          const prefs = LJ.store.meta().notifyPrefs || {};
          return S.sorted(LJ.store.where('message', m => m.userId === userId)
            .filter(m => prefs[m.type] !== false)
            .map(m => ({ ...m, date: (m.at || '').slice(0, 10) })));
        },
        unread() {
          const prefs = LJ.store.meta().notifyPrefs || {};
          return LJ.store.where('message', m => m.userId === userId && !m.read &&
            prefs[m.type] !== false).length;
        },
        read(id) { return LJ.store.update('message', id, { read: true }); },
        readAll() {
          const prefs = LJ.store.meta().notifyPrefs || {};
          LJ.store.where('message', m => m.userId === userId && !m.read &&
            prefs[m.type] !== false).forEach(m => LJ.store.update('message', m.id, { read: true }));
          return true;
        },
        prefs() { return Object.assign({}, LJ.store.meta().notifyPrefs || {}); },
        setPref(type, on) {
          const p = Object.assign({}, LJ.store.meta().notifyPrefs || {});
          if (on) delete p[type]; else p[type] = false;
          LJ.store.setMeta({ notifyPrefs: p });
          LJ.store.log(userId, on ? '开启消息提醒' : '静音消息提醒', LJ.MSG_TYPES[type] || type);
          return p;
        }
      },

      /* ---- 收到的脱敏账单：查看 + 确认收到 ----
         确认这一步是闭环的关键：孩子那边会收到一条回执，
         "我主动说了" 才有回应。没有这一步，主动分享就只是往空气里发。 */
      share: {
        /** 我收到的全部（按收件人聚合，不按"当前在看谁"）。
            ★ 为什么不按 activeChildId 圈定：家长本来就是收件人，
              消息中心也是**按家长聚合**的（message.list() 只按 userId 过滤），
              一进消息中心两个孩子的消息都在。如果列表按孩子圈、而打开卡片
              按家长放行，两者就自相矛盾。
              真正的边界只有一条：**不是发给我的，就打不开**。 */
        inbox() {
          return S.sorted(LJ.store.where('shareCard', c => c.toId === userId));
        },
        get(id) {
          const c = LJ.store.find('shareCard', id);
          /* 只给"发给我的" —— 别的家长的分享不该从这里漏出去。
             同一个家长的两个孩子都能打开，因为他就是收件人。 */
          if (!c || c.toId !== userId) return null;
          return c;
        },
        /** 确认收到：记时间 + 给孩子回一条回执 */
        ack(id, note) {
          const c = api.share.get(id);
          if (!c) throw new Error('没有这份分享');
          if (c.ackAt) return c;
          const nowISO = new Date().toISOString();
          LJ.store.update('shareCard', id, { ackAt: nowISO, ackNote: (note || '').trim() });
          LJ.store.insert('message', {
            userId: c.fromId, type: 'share',
            title: '家人收到了你分享的账单',
            body: (c.month || '') + ' 月度概览' + (note ? ' · ' + note : ' · 已确认收到'),
            shareCardId: id, read: false, at: nowISO
          });
          LJ.store.log(userId, '确认收到孩子的账单分享', c.month || '');
          return LJ.store.find('shareCard', id);
        }
      },

      /* ---- 发放前余额提醒（3.4.1）----
         文档原文："提供智能发放前提醒，避免余额不足导致的发放失败"。
         家长侧原来完全没有这个概念 —— 缺口预警都在孩子那边
         （"到下次发放还差多少"），家长这边没有任何"你可能发不出来"的提示。 */
      payoutCheck: {
        balance() { return Number(LJ.store.meta().supporterBalance || 0); },
        /** 下次发放是否够发。返回 { enough, short, amount, balance, days } */
        check() {
          const p = api.payout.next();
          const bal = api.payoutCheck.balance();
          const short = Math.max(0, Math.round(p.amount - bal));
          return {
            enough: short <= 0, short: short,
            amount: p.amount, balance: bal, days: p.days, date: p.date
          };
        },
        /** 补足余额（模拟转入） */
        topUp(amount) {
          const add = Number(amount) || 0;
          if (!(add > 0)) throw new Error('请填写转入金额');
          LJ.store.setMeta({ supporterBalance: api.payoutCheck.balance() + add });
          LJ.store.log(userId, '向支持账户转入', '¥' + U.wonInt(add));
          return api.payoutCheck.check();
        },
        /** 巡检：余额不够发下次生活费时，给家长留一条提醒。
            幂等 —— 同一次发放日只提醒一次，否则每进一次页面就多一条，
            消息中心会被自己刷屏（和 risk.sync 一样是幂等的）。 */
        remind() {
          const c = api.payoutCheck.check();
          if (c.enough) return null;
          const key = 'payout-' + c.date;
          if (LJ.store.where('message', m => m.userId === userId && m.payoutKey === key).length) return null;
          return LJ.store.insert('message', {
            userId: userId, type: 'support',
            title: '下次生活费可能发不出来',
            body: c.date + ' 要发 ¥' + U.wonInt(c.amount) +
              '，支持账户余额 ¥' + U.wonInt(c.balance) + '，还差 ¥' + U.wonInt(c.short) + '。',
            payoutKey: key, read: false, at: new Date().toISOString()
          });
        }
      },

      /* ---- 风险兜底（3.4.4）----
         注意这里**没有任何能拿到风险事件明细的方法**：
         拿不到 merchant、拿不到 amount、拿不到 date，也拿不到一级事件。
         和 entry 命名空间一样，是"方法不存在"，不是"调用被拒绝"。
         家人看到的只有脱敏后的通知。 */
      risk: {
        /** 家人收到的全部风险提示（只有等级和"存在异常"） */
        notices() {
          return S.sorted(LJ.store.where('message', m => m.userId === userId && m.type === 'risk')
            .map(m => ({
              id: m.id, date: (m.at || '').slice(0, 10), at: m.at,
              level: m.riskLevel, title: m.title, body: m.body, read: !!m.read
            })));
        },
        unread() {
          return LJ.store.where('message', m => m.userId === userId && m.type === 'risk' && !m.read).length;
        },
        /** 三级事件的等级与建议动作说明（依然不含明细） */
        policy(level) {
          const lv = E.riskLevel(level);
          return { level: lv.id, name: lv.name, policy: lv.policy, canFreeze: lv.canFreeze };
        },
        /** 紧急兜底通道：申请临时冻结，24 小时内银行客服介入核实，全程留痕 */
        requestFreeze(level, reason) {
          const b = S.binding();
          const rec = LJ.store.insert('riskEvent', {
            id: LJ.store.uid('risk'), youthId: b.youthId, key: 'freeze|' + Date.now(), rule: 'freeze_request',
            level: 3, subtype: 'freeze_request', status: 'notified',
            title: '家人申请紧急临时冻结',
            detail: '凭身份验证与风险说明发起，24 小时内银行客服介入核实。',
            why: reason || '（未填写说明）', evidence: [],
            amount: null, date: S.today(), merchant: '', at: LJ.clock.nowISO(),
            youthRead: false, explain: '', notifyAt: LJ.clock.nowISO(),
            timeline: [
              { at: LJ.clock.nowISO(), actor: 'supporter', action: '申请临时冻结', note: reason || '' },
              { at: LJ.clock.nowISO(), actor: 'system', action: '等待银行客服核实', note: '24 小时内介入' }
            ]
          });
          LJ.store.insert('message', {
            userId: b.youthId, type: 'risk', title: '家人申请了临时冻结',
            body: '家人就一条风险事件申请了紧急临时冻结。你可以查看说明，或直接联系家人。' +
              '本提示不含金额与交易明细。',
            riskLevel: 3, riskEventId: rec.id, read: false, at: LJ.clock.nowISO()
          });
          LJ.store.log(userId, '申请紧急临时冻结', reason || '');
          return rec;
        }
      },

      /* ---- 成长数据月报（3.4.3.1）----
         家长侧的月度/季度成长报告：指数曲线 + 每月要点。
         刻意**不含消费细节** —— 只有金额、指数、任务数这些成长类数据。 */
      report: {
        /** 当前在看的那个孩子的留痕流水（按 actorId 圈定）。
            ★ 两个必须：① 按 activeChildId 圈到当前孩子 —— 否则会把妹妹的动作
              算成哥哥的；② 只取 actorId 是孩子的行 —— 家长自己的动作
              （切换孩子、发申请）不能混进"孩子的成长证据"里。 */
        childEvents() {
          const who = S.activeYouthId();
          if (!who) return [];
          return LJ.store.where('auditLog', e => e.actorId === who);
        },
        months(n) {
          const b = LJ.store.all('budget')[0] || {};
          return E.monthlyReports(S.entries(), S.today(), {
            months: Number(n) || 6,
            budgetMonthly: Number(b.total) || 2600,
            taskProgress: LJ.store.all('taskProgress'),
            milestones: E.milestones(S.entries(), S.today()),
            events: api.report.childEvents()
          });
        },
        latest() {
          const m = api.report.months(6);
          return m.length ? m[m.length - 1] : null;
        },
        /** 指数变化：起点 / 终点 / 变化量 */
        trend(n) {
          const m = api.report.months(n);
          if (!m.length) return null;
          const from = m[0].control, to = m[m.length - 1].control;
          return {
            months: m.length, from: from, to: to, delta: to - from,
            points: m.map(r => ({ month: r.month, control: r.control })),
            best: m.slice().sort((a, b) => b.control - a.control)[0],
            worst: m.slice().sort((a, b) => a.control - b.control)[0]
          };
        },
        quarters() { return E.quarterlyRollup(api.report.months(12)); }
      },

      /* ---- 成长解锁状态（只读）----
         家长要知道"月报能不能看"，但拿不到任务明细之外的任何东西：
         这里只暴露 has/pending，没有写入方法。 */
      unlock: {
        _tasks() {
          const b = S.binding();
          return E.evaluateTasks(E.taskContext(S.entries(), S.today(), {
            budget: LJ.store.all('budget')[0],
            confirmedCount: LJ.store.where('supportRecord', r => r.status === 'confirmed').length,
            reviewedOnce: (LJ.store.meta().reviewedPeriods || []).length > 0,
            scenarioUsed: (LJ.store.meta().appliedScenarios || []).length
          }), LJ.store.all('taskProgress'));
        },
        has(key) {
          if (!E.unlockOf(key)) return true;
          return E.unlocked(api.unlock._tasks(), key);
        },
        locked(key) { return !api.unlock.has(key); }
      },

      /* ---- 生活费方案（支持人端发起 · 3.5.3 寒暑假 / 3.5.5 毕业过渡）----
         家长有发起权，孩子有确认权；也可以反过来（incoming 里会收到）。 */
      plan: {
        kinds: E.LIFE_PLAN_KINDS,
        modes: E.LIFE_PLAN_MODES,
        base() {
          const b = S.binding();
          return Number((b && b.supportAmount) || 0) || 2900;
        },
        list() {
          return S.mine(LJ.store.all('lifePlan')).sort((a, b) =>
            String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        },
        get(id) { return LJ.store.find('lifePlan', id); },
        active() { return LJ.store.all('lifePlan').filter(p => p.status === 'active'); },
        /** 我发起、等孩子确认的 */
        outgoing() {
          return LJ.store.all('lifePlan').filter(p =>
            p.status === 'pending' && p.proposedRole === 'supporter');
        },
        /** 孩子发起、等我确认的 */
        incoming() {
          return LJ.store.all('lifePlan').filter(p =>
            p.status === 'pending' && p.proposedRole === 'youth');
        },
        schedule(plan) { return E.planSchedule(plan); },
        summary(plan) { return E.planSummary(plan); },
        amountOn(monthKey, plans) {
          return E.supportFor(monthKey, plans || api.plan.active(), api.plan.base());
        },
        /** 假期结束后的复盘（没结束返回 null） */
        review(plan) { return E.holidayReview(plan, S.entries(), S.today()); },

        /** 发起：寒暑假调整 / 毕业过渡递减 */
        create(row) {
          const b = S.binding();
          const rec = LJ.store.insert('lifePlan', {
            familyId: b.familyId, youthId: b.youthId, kind: row.kind || 'holiday',
            name: row.name || '生活费调整',
            from: row.from || S.today(), to: row.to || U.addMonths(S.today(), 2),
            startMonth: row.startMonth || S.today().slice(0, 7),
            months: Number(row.months) || 6,
            mode: row.mode || 'half', base: api.plan.base(),
            proposedBy: userId, proposedRole: 'supporter', status: 'pending',
            note: row.note || '', decidedAt: null, review: null,
            log: [{ at: LJ.clock.nowISO(), actor: 'supporter', action: '发起方案', note: row.note || '' }]
          });
          LJ.store.insert('message', {
            userId: b.youthId, type: 'plan', title: '家人想调整你的生活费',
            body: E.planSummary(rec) + '。你确认之后才生效。',
            read: false, at: LJ.clock.nowISO()
          });
          LJ.store.log(userId, '发起生活费方案', E.planSummary(rec));
          return rec;
        },

        /** 撤回自己发起的、还没被确认的 */
        cancel(id) {
          const p = LJ.store.find('lifePlan', id);
          if (!p || p.status !== 'pending') return null;
          p.status = 'declined';
          p.decidedAt = LJ.clock.nowISO();
          p.log = p.log || [];
          p.log.push({ at: LJ.clock.nowISO(), actor: 'supporter', action: '撤回方案', note: '' });
          LJ.store.save('lifePlan');
          return p;
        },

        /** 结束一个生效中的方案，恢复按基准发放 */
        end(id) {
          const p = LJ.store.find('lifePlan', id);
          if (!p) return null;
          p.status = 'done';
          p.log = p.log || [];
          p.log.push({ at: LJ.clock.nowISO(), actor: 'supporter', action: '结束方案', note: '恢复按基准发放' });
          LJ.store.save('lifePlan');
          return p;
        },

        /** 同意孩子发起的方案 */
        confirm(id) {
          const p = LJ.store.find('lifePlan', id);
          if (!p) return null;
          p.log = p.log || [];
          p.log.push({ at: LJ.clock.nowISO(), actor: 'supporter', action: '同意孩子发起的方案', note: '' });
          p.status = 'active';
          p.decidedAt = LJ.clock.nowISO();
          LJ.store.save('lifePlan');
          LJ.store.log(userId, '同意生活费方案', E.planSummary(p));
          return p;
        }
      },

      /* ---- 专项资金（3.5.1 开学季 / 3.5.2 实习求职 / 3.5.4 应急医疗）----
         家人有发起和转入权，但**看不到钱买的是什么**：
         这里能拿到的只有"转入多少、用掉多少、还剩多少、几笔"。 */
      fund: {
        kinds: E.FUND_KINDS,
        scene() { return E.fundScene(S.today()); },
        list() {
          return LJ.store.all('fund').slice().sort((a, b) =>
            String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
        },
        get(id) { return LJ.store.find('fund', id); },
        active() { return api.fund.list().filter(f => f.status === 'active'); },

        /** 发起一个专项（不动钱，钱要另外转入） */
        create(row) {
          const b = S.binding();
          const k = E.fundKind(row.kind);
          const rec = LJ.store.insert('fund', {
            id: LJ.store.uid('fund'), familyId: b.familyId,
            kind: k.id, name: row.name || k.name,
            category: row.category != null ? row.category : k.category,
            target: Number(row.target) || k.range[0],
            providerId: userId, receiverId: b.youthId,
            periodStart: row.periodStart || S.today(),
            periodEnd: row.periodEnd || U.addMonths(S.today(), 4),
            status: 'active', note: row.note || '',
            createdAt: LJ.clock.nowISO(),
            log: [{ at: LJ.clock.nowISO(), actor: 'supporter', action: '开立专项', note: row.note || '' }]
          });
          LJ.store.insert('message', {
            userId: b.youthId, type: 'support', title: '家人为你开了一个专项',
            body: '「' + rec.name + '」计划 ¥' + U.won(rec.target) + '，' +
              '只能用于' + LJ.catById(rec.category).name + '。转入之后就能用了。',
            read: false, at: LJ.clock.nowISO()
          });
          LJ.store.log(userId, '开立专项', rec.name + ' · ' + LJ.catById(rec.category).name);
          return rec;
        },

        topUp(id, amount, note) {
          const b = S.binding();
          const f = LJ.store.find('fund', id);
          if (!f) return null;
          const amt = Number(amount);
          if (!(amt > 0)) throw new Error('金额需要大于 0');
          LJ.store.insert('entry', {
            date: S.today(), amount: amt, direction: 'in', category: null,
            title: f.name, merchant: '', note: note || '',
            fundingSource: 'family', source: 'fund', fundId: f.id
          });
          LJ.store.insert('supportRecord', {
            id: LJ.store.uid('sr'), date: S.today(), amount: amt, purpose: f.name,
            cycle: 'once', providerId: userId, receiverId: b.youthId,
            status: 'confirmed', confirmedAt: LJ.clock.nowISO(),
            note: '专项支持 · ' + (note || ''), directed: true,
            directedCategory: f.category || null, fundId: f.id
          });
          f.log = f.log || [];
          f.log.push({
            at: LJ.clock.nowISO(), actor: 'supporter', action: '转入专项金',
            note: '¥' + U.won(amt) + (note ? ' · ' + note : '')
          });
          LJ.store.save('fund');
          LJ.store.log(userId, '转入专项金', f.name + ' ¥' + U.won(amt));
          LJ.store.insert('message', {
            userId: b.youthId, type: 'support', title: '专项金已到账',
            body: '「' + f.name + '」¥' + U.won(amt) + ' 已到账。',
            read: false, at: LJ.clock.nowISO()
          });
          return f;
        },

        close(id) {
          const f = LJ.store.find('fund', id);
          if (!f) return null;
          const p = E.fundProgress(f, S.entries(), S.today());
          f.status = 'closed';
          f.closedAt = LJ.clock.nowISO();
          f.log = f.log || [];
          f.log.push({
            at: LJ.clock.nowISO(), actor: 'supporter', action: '结项',
            note: '共转入 ¥' + U.won(p.inTotal) + '，用掉 ¥' + U.won(p.used)
          });
          LJ.store.save('fund');
          return f;
        },

        /** 家人侧拿到的进度：**只有金额和笔数** */
        overview(fund) { return api.fund._ov(fund); },
        /** 家人侧的专项复盘：**只有计划 vs 执行，没有大类构成**。
            专项的披露口径一直是"看进度、不看买了什么" ——
            复盘如果带上大类明细，等于绕开这条口径把消费结构漏出去。 */
        review(fund) {
          const rv = E.fundReview(fund, S.entries(), S.today());
          return E.fundReviewForSupporter(rv);
        },
        _ov(fund) {
          const p = E.fundProgress(fund, S.entries(), S.today());
          return {
            id: fund.id, name: fund.name, kind: fund.kind,
            categoryName: LJ.catById(fund.category).name,
            periodEnd: fund.periodEnd, status: fund.status,
            inTotal: p.inTotal, used: p.used, remaining: p.remaining,
            ratio: p.ratio, target: p.target, count: p.count, over: p.over
          };
        }
      }
    };
    return api;
  }

  /* ============================================================
     出口
     ============================================================ */
  LJ.api = {
    youth: makeYouthApi,
    supporter: makeSupporterApi,

    /** 当前会话对应的 API */
    self() {
      const s = LJ.session.get();
      if (!s.userId) return null;
      return s.role === 'supporter' ? makeSupporterApi(s.userId) : makeYouthApi(s.userId);
    },

    /** 权限自检用：两端各自暴露的方法清单 */
    contracts() {
      const y = makeYouthApi('__probe__');
      const s = makeSupporterApi('__probe__');
      function walk(obj, prefix, out) {
        Object.keys(obj).forEach(k => {
          const v = obj[k];
          if (typeof v === 'function') out.push(prefix + k + '()');
          else if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, prefix + k + '.', out);
        });
        return out;
      }
      return {
        youth: walk(y, '', []),
        supporter: walk(s, '', []),
        difference: walk(y, '', []).filter(x => walk(s, '', []).indexOf(x) < 0),
        /** 账本明细接口——这些只在青年端存在 */
        detailOnly: walk(y, '', []).filter(x => x.indexOf('entry.') === 0)
      };
    }
  };
})(window.LJ);
