/* ============================================================
   metrics.js —— 指标引擎（纯函数，不依赖 UI）
   所有对账本的分析都在这里算，供两端各自的 API 调用
   ============================================================ */
(function (LJ) {
  'use strict';
  const U = LJ.util;
  const M = LJ.metrics = {};

  /* ---------------- 基础聚合 ---------------- */

  /** 双账户余额：按资金来源分账 */
  M.balances = function (entries) {
    let family = 0, own = 0;
    for (const e of entries) {
      const isFamily = e.fundingSource === 'family';
      const sign = e.direction === 'in' ? 1 : -1;
      if (isFamily) family += sign * e.amount; else own += sign * e.amount;
    }
    return { family, own, total: family + own };
  };

  M.inRange = function (entries, from, to) {
    return entries.filter(e => e.date >= from && e.date <= to);
  };

  M.monthEntries = function (entries, monthKey) {
    return entries.filter(e => U.monthKey(e.date) === monthKey);
  };

  /** 某月 收入 / 支出 */
  M.monthTotals = function (entries, monthKey) {
    const list = M.monthEntries(entries, monthKey);
    let income = 0, expense = 0, familyIn = 0, ownIn = 0;
    for (const e of list) {
      if (e.direction === 'in') {
        income += e.amount;
        if (e.fundingSource === 'family') familyIn += e.amount; else ownIn += e.amount;
      } else expense += e.amount;
    }
    return { income, expense, net: income - expense, familyIn, ownIn, count: list.length };
  };

  /** 按大类汇总支出 */
  M.categoryTotals = function (entries, from, to) {
    const list = M.inRange(entries, from, to).filter(e => e.direction === 'out');
    const total = list.reduce((s, e) => s + e.amount, 0) || 1;
    return LJ.CATEGORIES.map(c => {
      const items = list.filter(e => e.category === c.id);
      const amount = items.reduce((s, e) => s + e.amount, 0);
      return {
        id: c.id, name: c.name, icon: c.icon, color: c.color,
        amount, ratio: amount / total, count: items.length
      };
    }).sort((a, b) => b.amount - a.amount);
  };

  /** 近 N 天的日支出序列 */
  M.dailySeries = function (entries, today, days) {
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = U.addDays(today, -i);
      const amt = entries
        .filter(e => e.date === d && e.direction === 'out')
        .reduce((s, e) => s + e.amount, 0);
      out.push({ date: d, amount: amt });
    }
    return out;
  };

  /** 周支出序列（用于平稳度） */
  M.weeklySeries = function (entries, today, weeks) {
    const out = [];
    for (let i = weeks - 1; i >= 0; i--) {
      const end = U.addDays(today, -i * 7);
      const start = U.addDays(end, -6);
      const amt = M.inRange(entries, start, end)
        .filter(e => e.direction === 'out')
        .reduce((s, e) => s + e.amount, 0);
      out.push({ start, end, amount: amt });
    }
    return out;
  };

  function cv(list) {
    const vals = list.map(x => x.amount);
    const n = vals.length;
    if (!n) return 0;
    const mean = vals.reduce((a, b) => a + b, 0) / n;
    if (mean <= 0) return 0;
    const varr = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    return Math.sqrt(varr) / mean;
  }

  /** 由周支出变异系数换算平稳度得分（学生正常波动约 0.3~0.5） */
  function steadyFromCv(c) { return U.clamp(100 - (c - 0.15) * 95, 30, 100); }

  /** 月均支出（近 N 个月） */
  M.monthlyExpenseAvg = function (entries, today, months) {
    let sum = 0;
    for (let i = 0; i < months; i++) {
      const mk = U.monthKey(U.addMonths(today, -i));
      sum += M.monthTotals(entries, mk).expense;
    }
    return sum / months;
  };

  /** 近 N 天的日均支出 */
  M.dailyExpenseAvg = function (entries, today, days) {
    const from = U.addDays(today, -(days - 1));
    const sum = M.inRange(entries, from, today)
      .filter(e => e.direction === 'out')
      .reduce((s, e) => s + e.amount, 0);
    return sum / days;
  };

  /* ---------------- 财务掌控指数 ---------------- */
  /**
   * 四维：预算执行率 / 储蓄率 / 支出平稳度 / 风险抵御力
   * 全部基于真实账本，滚动 90 天窗口
   */
  M.controlIndex = function (entries, opt) {
    const today = opt.today;
    const budgetMonthly = opt.budgetMonthly || 2000;
    const from = U.addDays(today, -89);
    const window = M.inRange(entries, from, today);

    // 1. 预算执行率：以「月支出的 85%」为理想点
    const monthlyExpense = window.filter(e => e.direction === 'out').reduce((s, e) => s + e.amount, 0) / 3;
    const ratio = monthlyExpense / budgetMonthly;
    const budgetScore = U.clamp(100 - Math.abs(ratio - 0.85) * 130, 0, 100);

    // 2. 储蓄率
    /* 专项资金（source:'fund'）的转入不算"收入结余"：
       那笔钱是家里指定用途的，池子里剩多少都不能算你攒下来的 ——
       算进去会让掌控指数虚高（实测一个 ¥3,800 的开学专项能把指数从 63 抬到 70）。 */
    const realIncome = window_in => window_in.filter(e => e.source !== 'fund');
    const income = realIncome(window.filter(e => e.direction === 'in')).reduce((s, e) => s + e.amount, 0);
    const expense = window.filter(e => e.direction === 'out').reduce((s, e) => s + e.amount, 0);
    const saveRate = income > 0 ? (income - expense) / income : 0;
    const saveScore = U.clamp(saveRate / 0.35 * 100, 0, 100);

    // 3. 支出平稳度（周支出变异系数）
    const c = cv(M.weeklySeries(entries, today, 8));
    const steadyScore = steadyFromCv(c);

    // 4. 风险抵御力（自有资金可支撑的月数，3 个月为满分）
    /* 余额必须取「截至 today」的，不能拿全量账本算 ——
       月度成长报告会把每个月的月末当成 today 重算一次，
       用全量余额的话，历史月份会拿"后来的钱"去撑抵抗能力，
       曲线就成了假的（实测：这样算出来的曲线是 52→69→38 这种乱跳）。
       当前日期的数据里没有未来条目，所以这个过滤对现值没有影响。 */
    const bal = M.balances(entries.filter(e => e.date <= today));
    const resilRatio = monthlyExpense > 0 ? bal.own / monthlyExpense : 0;
    const resilScore = U.clamp(resilRatio / 3 * 100, 0, 100);

    const dims = [
      { key: 'budget', name: '预算执行率', score: budgetScore, weight: .30, desc: '月均支出 ' + Math.round(monthlyExpense) + ' / 预算 ' + budgetMonthly },
      { key: 'save', name: '储蓄率', score: saveScore, weight: .25, desc: '近 90 天结余率 ' + Math.round(saveRate * 100) + '%' },
      { key: 'steady', name: '支出平稳度', score: steadyScore, weight: .25, desc: '周支出波动 ' + Math.round(c * 100) + '%' },
      { key: 'resil', name: '风险抵御力', score: resilScore, weight: .20, desc: '自有资金可支撑 ' + resilRatio.toFixed(1) + ' 个月' }
    ];
    const score = Math.round(dims.reduce((s, d) => s + d.score * d.weight, 0));

    return {
      score, dims, saveRate, monthlyExpense, ratio,
      level: score >= 80 ? '自主期' : score >= 60 ? '成长期' : '启蒙期',
      levelIndex: score >= 80 ? 2 : score >= 60 ? 1 : 0
    };
  };

  M.LEVELS = [
    { name: '启蒙期', min: 0, desc: '开始有意识地观察自己的收支' },
    { name: '成长期', min: 60, desc: '能按预算安排支出，并留出结余' },
    { name: '自主期', min: 80, desc: '资金结构稳定，具备独立管理能力' }
  ];

  /* ---------------- 三项健康度（支持人端可见） ---------------- */

  // 支出结构理想区间（占总支出的比例）
  const IDEAL = {
    food: [0.30, 0.45], traffic: [0.04, 0.14], study: [0.05, 0.20],
    fun: [0.08, 0.25], sub: [0.00, 0.10], daily: [0.10, 0.28]
  };

  M.health = function (entries, today) {
    // 消费平稳度
    const c = cv(M.weeklySeries(entries, today, 8));
    const steady = steadyFromCv(c);

    // 资金可持续天数
    const bal = M.balances(entries);
    const daily = M.dailyExpenseAvg(entries, today, 30);
    const runway = daily > 0 ? bal.family / daily : 999;

    // 支出结构健康度
    const from = U.addDays(today, -29);
    const cats = M.categoryTotals(entries, from, today);
    let penalty = 0;
    cats.forEach(c2 => {
      const rng = IDEAL[c2.id]; if (!rng) return;
      if (c2.ratio < rng[0]) penalty += (rng[0] - c2.ratio) * 100;
      else if (c2.ratio > rng[1]) penalty += (c2.ratio - rng[1]) * 100;
    });
    const structure = U.clamp(100 - penalty * 3, 0, 100);

    return {
      steady: Math.round(steady),
      runway: Math.round(runway),
      structure: Math.round(structure),
      avgDaily: Math.round(daily)
    };
  };

  /* ---------------- 生活费发放周期 ---------------- */

  /** 下次生活费发放日：每月 1 日 */
  M.nextPayday = function (today) {
    const d = U.parse(today);
    const nm = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return U.ymd(nm);
  };

  M.daysToPayday = function (today) { return U.diffDays(today, M.nextPayday(today)); };

  /* ---------------- 四色支持状态 ---------------- */

  /**
   * 优先级：橙（有待处理） > 黄（潜在缺口） > 蓝（自主充足） > 绿（支持正常）
   */
  M.statusColor = function (entries, today, opt) {
    opt = opt || {};
    const bal = M.balances(entries);
    const h = M.health(entries, today);
    const dl = U.addDays(today, -29);
    const w = M.inRange(entries, dl, today);
    const ownIn = w.filter(e => e.direction === 'in' && e.fundingSource === 'own').reduce((s, e) => s + e.amount, 0);
    const allIn = w.filter(e => e.direction === 'in').reduce((s, e) => s + e.amount, 0);
    const ownRatio = allIn > 0 ? ownIn / allIn : 0;
    const monthly = M.monthlyExpenseAvg(entries, today, 3);
    const daysToPay = M.daysToPayday(today);

    let key = 'green', title = '支持正常',
      desc = '本月支持资金充足，支出节奏平稳。';

    if (opt.pendingCount > 0) {
      key = 'orange'; title = '有待处理';
      desc = '有 ' + opt.pendingCount + ' 项待响应，处理后可恢复常规状态。';
    } else if (h.runway < daysToPay) {
      key = 'yellow'; title = '潜在缺口';
      desc = '按当前节奏，支持资金预计在下次发放前 ' + h.runway + ' 天用完。';
    } else if (ownRatio >= 0.35 && bal.own >= monthly) {
      key = 'blue'; title = '自主充足';
      desc = '自有资金占比连续保持较高水平，已具备减少支持的条件。';
    }

    return { key, title, desc, ownRatio, runway: h.runway, daysToPay, monthly, bal, health: h };
  };

  M.STATUS_META = {
    green: { title: '支持正常', order: 0 },
    yellow: { title: '潜在缺口', order: 1 },
    orange: { title: '有待处理', order: 2 },
    blue: { title: '自主充足', order: 3 }
  };

  /* ---------------- 预算 ---------------- */

  M.budgetProgress = function (entries, budget, today) {
    const from = budget.periodStart || U.startOfMonth(today);
    const to = budget.periodEnd || U.endOfMonth(today);
    const spentMap = {};
    M.inRange(entries, from, today).filter(e => e.direction === 'out').forEach(e => {
      spentMap[e.category] = (spentMap[e.category] || 0) + e.amount;
    });
    const total = budget.total || 0;
    const spent = Object.values(spentMap).reduce((a, b) => a + b, 0);
    const totalDays = U.diffDays(from, to) + 1;
    const passed = U.diffDays(from, today) + 1;
    const ideal = total * (passed / totalDays);
    return {
      from, to, spent, total, remaining: total - spent, ideal, passed, totalDays,
      ratio: total > 0 ? spent / total : 0,
      over: spent > ideal,
      categories: LJ.CATEGORIES.map(c => {
        const b = (budget.categories || {})[c.id] || 0;
        const s = spentMap[c.id] || 0;
        return { ...c, budget: b, spent: s, ratio: b > 0 ? s / b : 0, remaining: b - s };
      })
    };
  };

  /* ---------------- 缺口预测（本地规则引擎） ---------------- */

  M.gapForecast = function (entries, today, budgetMonthly) {
    const bal = M.balances(entries);
    const daily = M.dailyExpenseAvg(entries, today, 30);
    const daysToPay = M.daysToPayday(today);
    const need = daily * daysToPay;
    const gap = need - bal.family;
    const ratio = need > 0 ? bal.family / need : 1;

    let level = 'none', label = '资金充足';
    if (gap > 0) {
      if (ratio < 0.5) { level = 'urgent'; label = '紧急'; }
      else if (ratio < 0.8) { level = 'medium'; label = '中度'; }
      else { level = 'light'; label = '轻度'; }
    }
    return {
      level, label, gap: Math.max(0, gap), need, available: bal.family,
      daily: Math.round(daily), daysToPay, runway: daily > 0 ? Math.floor(bal.family / daily) : 999
    };
  };
})(window.LJ);
