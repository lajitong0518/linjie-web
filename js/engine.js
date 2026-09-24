/* ============================================================
   engine.js —— 规则引擎（M2）
   本地规则 + 文案模板，不依赖任何外部模型。
   覆盖：AI 建议 / 场景化规划 / 成长任务 / 认证 / 里程碑 /
         订阅识别 / 周期复盘 / 生命周期 / 共同储蓄
   ============================================================ */
(function (LJ) {
  'use strict';
  const U = LJ.util, M = LJ.metrics;
  const E = LJ.engine = {};

  /* ============================================================
     一、订阅识别与管理
     ============================================================ */
  const SUB_KEYWORDS = ['Spotify', 'ChatGPT', 'OpenAI', '百度网盘', '会员', 'iCloud', 'Netflix',
    '腾讯视频', '爱奇艺', '哔哩哔哩', 'WPS', '语雀', 'Notion'];
  const SUB_NAMES = { 'chatgpt plus': 'ChatGPT Plus', 'chatgpt': 'ChatGPT Plus', 'spotify': 'Spotify', '百度网盘': '百度网盘' };

  E.subscriptions = function (entries, today) {
    const map = {};
    entries.filter(e => e.direction === 'out').forEach(e => {
      const name = e.merchant || '';
      const hit = SUB_KEYWORDS.some(k => name.indexOf(k) >= 0) || e.category === 'sub';
      if (!hit) return;
      const key = name || '未命名订阅';
      if (!map[key]) map[key] = { name: key, amounts: [], dates: [], category: 'sub' };
      map[key].amounts.push(e.amount);
      map[key].dates.push(e.date);
    });

    return Object.values(map).map(s => {
      s.dates.sort();
      const amounts = s.amounts.slice(-3);
      const amount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const last = s.dates[s.dates.length - 1];
      const lastD = U.parse(last);
      const next = U.ymd(new Date(lastD.getFullYear(), lastD.getMonth() + 1, lastD.getDate()));
      // 周期推断
      let cycle = 'month';
      if (s.dates.length >= 2) {
        const gaps = [];
        for (let i = 1; i < s.dates.length; i++) gaps.push(U.diffDays(s.dates[i - 1], s.dates[i]));
        const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
        cycle = avg > 300 ? 'year' : avg > 25 ? 'month' : avg > 6 ? 'week' : 'day';
      }
      const monthly = cycle === 'year' ? amount / 12 : cycle === 'week' ? amount * 4.33 : cycle === 'day' ? amount * 30 : amount;
      return {
        name: s.name, amount: Math.round(amount * 100) / 100, cycle,
        lastDate: last, nextDate: next,
        daysToNext: U.diffDays(today, next),
        count: s.dates.length,
        monthly: Math.round(monthly * 100) / 100,
        annual: Math.round(monthly * 12 * 100) / 100
      };
    }).sort((a, b) => b.monthly - a.monthly);
  };

  /** 从账本里识别可能是订阅、但还没有被管理的商户 */
  E.detectSubscriptions = function (entries, tracked) {
    const trackedNames = (tracked || []).map(t => t.name);
    const map = {};
    entries.filter(e => e.direction === 'out' && e.merchant).forEach(e => {
      if (!map[e.merchant]) map[e.merchant] = { name: e.merchant, dates: [], amounts: [] };
      map[e.merchant].dates.push(e.date);
      map[e.merchant].amounts.push(e.amount);
    });
    return Object.values(map).filter(s => {
      if (s.dates.length < 3) return false;
      if (trackedNames.indexOf(s.name) >= 0) return false;
      const uniqDates = Array.from(new Set(s.dates)).sort();
      const gaps = [];
      for (let i = 1; i < uniqDates.length; i++) gaps.push(U.diffDays(uniqDates[i - 1], uniqDates[i]));
      const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      // 间隔稳定在 25~35 天，且金额稳定
      const amtVar = Math.max.apply(null, s.amounts) - Math.min.apply(null, s.amounts);
      return avg >= 24 && avg <= 36 && amtVar <= 3 && s.amounts[0] < 200;
    }).map(s => ({
      name: s.name,
      amount: s.amounts[s.amounts.length - 1],
      cycle: 'month',
      count: s.dates.length
    }));
  };

  /* ============================================================
     二、周期复盘
     ============================================================ */
  E.periodReview = function (entries, from, to, budget) {
    const cur = M.inRange(entries, from, to);
    const span = U.diffDays(from, to);
    const pTo = U.addDays(from, -1), pFrom = U.addDays(pTo, -span);
    const prev = M.inRange(entries, pFrom, pTo);

    const sum = (list, dir) => list.filter(e => e.direction === dir).reduce((s, e) => s + e.amount, 0);
    const income = sum(cur, 'in'), expense = sum(cur, 'out');
    const prevIncome = sum(prev, 'in'), prevExpense = sum(prev, 'out');

    const cats = M.categoryTotals(entries, from, to).map(c => {
      const prevAmt = M.categoryTotals(entries, pFrom, pTo).find(x => x.id === c.id).amount;
      return {
        ...c, prevAmount: prevAmt,
        delta: prevAmt > 0 ? (c.amount - prevAmt) / prevAmt : (c.amount > 0 ? 1 : 0),
        diff: c.amount - prevAmt
      };
    });

    const days = span + 1;
    const budgetTotal = budget ? budget.total : 0;
    const idealPerDay = budgetTotal / U.daysInMonth(from);
    const avgPerDay = expense / days;
    const over = cats.filter(c => c.diff > 30).sort((a, b) => b.diff - a.diff);
    const saved = cats.filter(c => c.diff < -30).sort((a, b) => a.diff - b.diff);

    // 记账活跃度
    const activeDays = new Set(cur.filter(e => e.direction === 'out').map(e => e.date)).size;

    const points = [];
    if (expense > prevExpense * 1.15) points.push({ k: 'up', t: '支出比上期增加 ' + Math.round((expense / prevExpense - 1) * 100) + '%' });
    else if (expense < prevExpense * 0.85) points.push({ k: 'down', t: '支出比上期减少 ' + Math.round((1 - expense / prevExpense) * 100) + '%' });
    else points.push({ k: 'flat', t: '支出与上期基本持平' });

    /* 逐日累计支出 —— 画「累计支出 vs 预算线」折线用。
       一条画到周期末尾的投影线，比任何一句"照这个节奏会超支"都有说服力：
       用户看到曲线要穿破预算线的那一刻，不用谁去问，他自己就懂了。
       所以除了已经发生的累计，还要给出「按当前日均外推到周期末」的落点。
       periodDays 用 daysInMonth(from) 而不是 span+1 —— 必须和上面 idealPerDay
       的分母一致，否则预算线和 idealPerDay 会各说各话。 */
    const dayMap = {};
    cur.filter(e => e.direction === 'out').forEach(e => {
      dayMap[e.date] = (dayMap[e.date] || 0) + e.amount;
    });
    const daily = [];
    let acc = 0;
    for (let i = 0; i <= span; i++) {
      const d = U.addDays(from, i);
      acc += dayMap[d] || 0;
      daily.push({ d: i + 1, date: d, cum: acc, amount: dayMap[d] || 0 });
    }
    const periodDays = U.daysInMonth(from);
    const restDays = Math.max(0, periodDays - days);
    const projectedEnd = acc + avgPerDay * restDays;

    return {
      from, to, days, income, expense, net: income - expense,
      prevIncome, prevExpense,
      expenseDelta: prevExpense > 0 ? (expense - prevExpense) / prevExpense : 0,
      incomeDelta: prevIncome > 0 ? (income - prevIncome) / prevIncome : 0,
      saveRate: income > 0 ? (income - expense) / income : 0,
      prevSaveRate: prevIncome > 0 ? (prevIncome - prevExpense) / prevIncome : 0,
      avgPerDay, idealPerDay,
      pace: idealPerDay > 0 ? avgPerDay / idealPerDay : 1,
      activeDays, totalDays: days,
      cats, over, saved, points,
      budgetTotal,
      /* 图表用 */
      daily, periodDays, restDays, projectedEnd,
      overBudgetBy: Math.max(0, projectedEnd - budgetTotal)
    };
  };

  /* ============================================================
     二·B、决定时间线 —— 复盘「看决定」那一维
     ============================================================
     账本能算清"花了多少"，算不清"哪些是我主动做的决定"。
     复盘人，不复盘钱：这一维只回答两件事 ——
       ① 这一期我做过几个值得记住的决定？
       ② 哪些是事先推演过的，哪些是顺手就花了？

     ★ 标签由规则判定，规则就写在下面的 E.DECISION 里。
       判据必须是**账本里已有的字段**，不新增表 —— 规则和探针读同一份常量，
       改规则时两边一起改，不会出现"图上写着推演过、其实没人推演过"。

     每笔都带一个 after：这笔花掉之后，这一期剩下的日子每天只剩多少。
     "然后呢"必须落在每一笔上，否则时间线只是一串好看的流水。
     ============================================================ */
  E.DECISION = {
    THRESH: 150,     /* 多少钱以上才算得上一个"决定" */
    MAX: 6,          /* 最多画几个（取金额最大的）。再多就不是"决定"是流水了 */
    LINK_DAYS: 7,    /* 场景规划记录和这笔支出差几天之内算"推演过" */
    GAP_DAYS: 3,     /* 相邻两个决定隔几天之内算"连着来" */
    PLANNED: ['study', 'daily', 'medical', 'traffic', 'sub', 'sport']
  };
  E.DECISION_TAG = { simulated: '推演过', planned: '计划内', impulse: '临时起意' };

  E.decisionTimeline = function (entries, from, to, opt) {
    opt = opt || {};
    const cfg = E.DECISION;
    const thresh = opt.thresh || cfg.THRESH;
    const plans = (opt.plans || []).filter(p => p && p.appliedAt);
    const periodDays = opt.periodDays || U.daysInMonth(from);
    const budgetTotal = opt.budgetTotal || 0;
    const outs = (entries || []).filter(e =>
      e.direction === 'out' && e.date >= from && e.date <= to &&
      e.amount >= thresh && e.category !== 'sub');   /* 订阅是自动扣的，不是"做的决定" */

    const picked = outs.slice().sort((a, b) => b.amount - a.amount)
      .slice(0, opt.max || cfg.MAX)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

    const spent = (entries || []).filter(e =>
      e.direction === 'out' && e.date >= from && e.date <= to)
      .reduce((s, e) => s + e.amount, 0);

    const byTag = { simulated: { n: 0, amount: 0 }, planned: { n: 0, amount: 0 }, impulse: { n: 0, amount: 0 } };
    let cum = 0;
    const items = picked.map(e => {
      const d = U.diffDays(from, e.date) + 1;
      /* 「推演过」的判据：同商户 + 场景规划记录在 7 天之内。
         只按日期邻近会误判（同一周里总有不相关的大额），
         商户名对上才算这一笔事先被推演过。 */
      const linked = plans.some(p => {
        const pd = String(p.appliedAt).slice(0, 10);
        if (Math.abs(U.diffDays(pd, e.date)) > cfg.LINK_DAYS) return false;
        return !p.plannedMerchant || p.plannedMerchant === e.merchant;
      });
      const tag = linked ? 'simulated'
        : (e.fundId || cfg.PLANNED.indexOf(e.category) >= 0) ? 'planned' : 'impulse';
      cum += e.amount;
      byTag[tag].n++;
      byTag[tag].amount += e.amount;
      const restDays = Math.max(0, periodDays - d);
      const after = (budgetTotal > 0 && restDays > 0)
        ? Math.floor(Math.max(0, budgetTotal - cum) / restDays) : null;
      const cat = LJ.catById(e.category);
      return {
        id: e.id, date: e.date, d, amount: e.amount, cum,
        merchant: e.merchant || e.title || cat.name,
        category: e.category, catName: cat.name, tag,
        tagName: E.DECISION_TAG[tag], after, restDays
      };
    });

    /* 连着来的几个决定：挨得太近的那几笔合起来才是"这件事的代价"，
       单看每一笔都"还好"。 */
    const clusters = [];
    items.forEach(it => {
      const last = clusters[clusters.length - 1];
      if (last && it.d - last.lastD <= cfg.GAP_DAYS) {
        last.n++; last.lastD = it.d; last.to = it.date; last.amount += it.amount;
      } else {
        clusters.push({ from: it.date, to: it.date, fromD: it.d, lastD: it.d, n: 1, amount: it.amount });
      }
    });
    const bigClusters = clusters.filter(c => c.n >= 2);

    const max = items.reduce((a, b) => Math.max(a, b.amount), 1);
    return {
      items, count: items.length, thresh, max, spent,
      periodDays, from, to,
      byTag,
      clusters: bigClusters,
      /* 临时起意占本期支出的比例 —— 「看决定」那一维的结论句就落在这个数上 */
      impulseShare: spent > 0 ? byTag.impulse.amount / spent : 0,
      biggest: items.slice().sort((a, b) => b.amount - a.amount)[0] || null
    };
  };

  /* ============================================================
     二·C、收入来源 —— 复盘「看开源」那一维
     ============================================================
     这一维为什么必须独立：预算是别人给的数，**收入是自己能改的数**。
     只有节流的产品会把人越管越紧；把"开源"单独摆出来，才有第二条路。

     三档，判据全部来自账本字段（title / fundingSource），不猜：
       earned 自己挣的 —— 奖学金 / 兼职 / 比赛奖金 / 实习补贴…
       family 家庭支持 —— 生活费
       gift   人情往来 —— 红包（不是劳动所得，也不算"家庭支持的常态"）
     ============================================================ */
  E.EARNED_RE = /奖|兼职|实习|稿费|比赛|工资|补助|项目|接单|家教|助研|分成/;

  E.incomeSources = function (entries, from, to, opt) {
    opt = opt || {};
    const ins = (entries || []).filter(e =>
      e.direction === 'in' && e.date >= from && e.date <= to);
    const map = {};
    ins.forEach(e => {
      const name = e.title || '其他收入';
      const kind = E.EARNED_RE.test(name) ? 'earned'
        : (e.fundingSource === 'own' ? 'gift' : 'family');
      const key = kind + '|' + name;
      if (!map[key]) map[key] = { name, kind, amount: 0, count: 0 };
      map[key].amount += e.amount;
      map[key].count++;
    });
    const items = Object.keys(map).map(k => map[k])
      .sort((a, b) => b.amount - a.amount);
    const sum = k => items.filter(i => i.kind === k).reduce((s, i) => s + i.amount, 0);
    const total = items.reduce((s, i) => s + i.amount, 0);
    const earned = sum('earned');
    /* 「能不能重复」必须跨期看，不能只看这一期：
       家教兼职每期只记一笔，在单期里永远长得像一次性收入 ——
       上一期也有同名进项，才算"能重复的收入"。 */
    const prevNames = opt.prevNames || [];
    const recurring = items.filter(i => i.kind === 'earned' && prevNames.indexOf(i.name) >= 0);
    return {
      items, total, earned, family: sum('family'), gift: sum('gift'),
      count: ins.length,
      earnedShare: total > 0 ? earned / total : 0,
      recurring,
      best: items.filter(i => i.kind === 'earned').sort((a, b) => b.amount - a.amount)[0] || null
    };
  };

  /* ============================================================
     二·D、复盘 → 下期规划（建议引擎）
     ============================================================
     复盘不该以"完成"收尾，该以"改一件事"收尾。
     所以这里产出的不是结论，是**可以被执行的具体改动**：

       每条建议都必须带 change（要动的那个参数）和 diff（改前 → 改后）。
       没有 change 的建议一律不许进来 —— "要注意控制消费"这种话
       用户点了也什么都没发生，等于把复盘做成了读后感。

     priority 决定展示顺序（越小越先出），最后只留 PRIORITY_KEEP 条：
     给五条建议 = 没给建议，用户一条都不会做。
     ============================================================ */
  E.PRIORITY_KEEP = 4;

  const r10 = n => Math.round(n / 10) * 10;
  const r50 = n => Math.round(n / 50) * 50;
  const yuan = n => '¥' + U.wonInt(n);

  E.reviewPlan = function (ctx) {
    ctx = ctx || {};
    const r = ctx.r || {};
    const tl = ctx.timeline || { byTag: {}, clusters: [], impulseShare: 0 };
    const inc = ctx.income || { items: [] };
    const budget = ctx.budget || {};
    const total = Number(budget.total) || 0;
    const cats = budget.categories || {};
    const subs = (ctx.subs || []).filter(s => s.status === 'active');
    const out = [];

    /* ① 预算：把"标尺"调成真事。
       超了就别硬撑 —— 每个月都超的预算不是自律问题，是数字定错了。 */
    if (total > 0 && r.projectedEnd > 0) {
      const proj = r.projectedEnd;
      /* 目标值和现状差不到 ¥50 就不给这条建议 —— 一条"改了等于没改"的建议
         会让整个建议列表显得敷衍（而且它会出现两次，采纳之后还在）。 */
      const noop = Math.abs(r50(proj) - total) < 50;
      if (proj > total && !noop) {
        const target = r50(proj);
        out.push({
          id: 'budget_real', priority: 1, icon: '🎯', kind: 'budget', tone: 'warn',
          title: '下期预算调到 ' + yuan(target),
          why: '照这一期的节奏会落到 ' + yuan(proj) + '，比预算多 ' + yuan(proj - total) +
            '。如果这个数更接近真实情况，就把预算改成真事 —— 预算的意义是标尺，不是许愿。',
          effect: '月度预算 ' + yuan(total) + ' → ' + yuan(target) +
            '；超支提醒、「今天还能花」都按新数字算。',
          diff: [{ k: '月度预算', from: yuan(total), to: yuan(target) }],
          change: { kind: 'budget', total: target, from: total }
        });
      } else if (!noop) {
        const target = r50(proj);
        out.push({
          id: 'budget_tight', priority: 1, icon: '🪙', kind: 'budget', tone: 'ok',
          title: '下期预算定到 ' + yuan(target),
          why: '这一期落在 ' + yuan(proj) + ' 附近，预算还剩 ' + yuan(total - proj) +
            ' 没花到。把这部分从预算里拿出来，它才会真的被省下来 —— 留在预算里，下个月就会花掉。',
          effect: '月度预算 ' + yuan(total) + ' → ' + yuan(target) + '，省出来的 ' +
            yuan(total - target) + ' 可以转进共同目标。',
          diff: [{ k: '月度预算', from: yuan(total), to: yuan(target) }],
          change: { kind: 'budget', total: target, from: total }
        });
      }
    }

    /* ② 分类上限：超得最多的那一类，下期把上限定在"够得着但会拦你一下"的位置。
       三个条件缺一不可：
         · 上限本身是个真在用的数（≥ ¥100）—— 「其他 ¥25」这种凑数上限，
           超了也说明不了消费有问题；
         · 超了 ¥40 以上；
         · 这一类期内有 5 笔以上 —— 五笔以上撑起来的超支才是习惯；
           一两笔（比如一张机票）撑起来的，该去改预算或设单笔闸；
         · 没超到上限的 3 倍 —— 超了 3 倍说明这个上限从来就没生效过，
           它不是"该调一调"，是"当初随便填的"，那属于另一个问题。 */
    const overCats = (r.cats || []).filter(c => {
      const cap = cats[c.id];
      return cap >= 100 && c.amount > cap && c.amount - cap > 40 &&
        c.count >= 5 && c.amount <= cap * 3;
    }).sort((a, b) => (b.amount - cats[b.id]) - (a.amount - cats[a.id]));
    if (overCats.length) {
      const c = overCats[0];
      const target = r10(c.amount * 0.9);
      out.push({
        id: 'cap_' + c.id, priority: 2, icon: '🚧', kind: 'catCap', tone: 'warn',
        title: '把「' + c.name + '」下期上限定在 ' + yuan(target),
        why: c.name + '这一期 ' + yuan(c.amount) + '（' + c.count + ' 笔），上限是 ' +
          yuan(cats[c.id]) + '，超了 ' + yuan(c.amount - cats[c.id]) +
          '。定在比实际低一成的位置：够得着，但会在你快到头的时候拦你一下。',
        effect: '「' + c.name + '」上限 ' + yuan(cats[c.id]) + ' → ' + yuan(target) +
          '，月度预算总额不变。',
        diff: [{ k: '分类上限 · ' + c.name, from: yuan(cats[c.id]), to: yuan(target) }],
        change: { kind: 'catCap', cat: c.id, cap: target, from: cats[c.id] }
      });
    }

    /* ③ 订阅：占比最大的那一项先停。
       "暂停"是个低风险动作（内容一条不删、随时开回来），
       所以它适合当第一个"我真的动手了"的证据。 */
    const subMonthly = subs.reduce((s, x) => s + (x.amount || 0), 0);
    const bigSub = subs.slice().sort((a, b) => (b.amount || 0) - (a.amount || 0))[0];
    if (bigSub && bigSub.amount >= 60 && subs.length >= 2) {
      out.push({
        id: 'sub_hold', priority: 3, icon: '🔕', kind: 'sub', tone: 'info',
        title: '先暂停 ' + bigSub.name,
        why: '订阅 ' + subs.length + ' 项每月 ' + yuan(subMonthly) + '，' + bigSub.name +
          ' 一项就占 ' + yuan(bigSub.amount) + '（' + Math.round(bigSub.amount / subMonthly * 100) +
          '%）。暂停不会删掉任何东西，想用随时开回来 —— 但你会先看清它值不值。',
        effect: '每月少扣 ' + yuan(bigSub.amount) + '，一年 ' + yuan(bigSub.amount * 12) +
          '；这一项在订阅清单里变成「已暂停」。',
        diff: [{ k: '订阅 · ' + bigSub.name, from: yuan(bigSub.amount) + '/月', to: '暂停' }],
        change: { kind: 'sub', ids: [bigSub.id], names: [bigSub.name], monthly: bigSub.amount }
      });
    }

    /* ④ 开源：这一期唯一能把天花板抬高的方向。
       有收入 → 给它单独立个池子（混在生活费里会按生活费的节奏花掉）；
       没收入 → 定一个够小的目标，小到下周就能试一次。

       ★ 重复出现的收入（家教兼职）和一次性的（奖学金、红包）给的目标不一样：
         前者按"每月都能进这么多"立半年池子；后者只把一半留住 ——
         把一笔一次性的奖金当成稳定收入去规划，是这个维度最容易犯的错。 */
    if (inc.earned > 0) {
      const rec = (inc.recurring || [])[0];
      const src = rec ? rec.name : ((inc.best && inc.best.name) || '自有收入');
      const target = rec
        ? r50(Math.round(inc.items.find(i => i.name === rec.name).amount / rec.count) * 6)
        : r50(inc.earned * 0.5);
      out.push({
        id: 'open_pool', priority: 4, icon: '🌱', kind: 'pool', tone: 'ok',
        title: rec ? '给「' + src + '」立一个池子' : '把「' + src + '」的一半留住',
        why: '这一期自己挣了 ' + yuan(inc.earned) + '（占收入 ' +
          Math.round(inc.earnedShare * 100) + '%），' + (rec
            ? '而且「' + src + '」上一期也有 —— 这是能重复的收入，不是运气。'
            : '但「' + src + '」是一次性的，下期不一定还有。') +
          '这笔钱现在和生活费混在一起 —— 混在一起的钱，会按生活费的节奏花掉。',
        effect: '新建共同目标「' + (rec ? src + '池' : src + '留存池') + '」（目标 ' + yuan(target) +
          '，6 个月）；下期这笔钱进账后先进池子，再当生活费花。',
        diff: [{
          k: '自有收入 ' + yuan(inc.earned),
          from: '混在生活费里',
          to: rec ? '每月进池子' : '先留 ' + yuan(target) + ' 进池子'
        }],
        change: {
          kind: 'pool', title: rec ? src + '池' : src + '留存池',
          target: target, months: 6, per: rec ? r10(target / 6) : r10(target)
        }
      });
    } else {
      const famShare = inc.total > 0 ? Math.round((inc.family || 0) / inc.total * 100) : 0;
      out.push({
        id: 'open_start', priority: 4, icon: '🌱', kind: 'rule', tone: 'info',
        title: '下期试一次开源',
        why: (inc.total > 0
          ? '这一期的收入 ' + famShare + '% 来自家庭支持。'
          : '这一期账本里没有收入记录。') +
          '节流有下限，开源没有 —— 预算是别人给的数，收入是自己能改的数。',
        effect: '登记成下期约定：用一项能拿得出手的技能换第一笔收入（家教 / 接单 / 助研），' +
          '目标 ' + yuan(300) + '。',
        diff: [{ k: '自有收入', from: yuan(0) + '（全靠家庭支持）', to: '目标 ' + yuan(300) }],
        change: { kind: 'rule', text: '下期用一项技能换第一笔收入，目标 ¥300' }
      });
    }

    /* ⑤ 决定：临时起意占得太多，或几个大额挤在一起。
       给的是**动作规则**而不是金额 —— 因为问题不在数字，在"花之前有没有停一下"。 */
    if (tl.impulseShare >= 0.3 && (tl.byTag.impulse || {}).n >= 2) {
      const imp = tl.byTag.impulse;
      out.push({
        id: 'impulse_gate', priority: 5, icon: '⚖', kind: 'rule', tone: 'warn',
        title: '给单笔大额设一道闸',
        why: '这一期 ' + tl.count + ' 个决定里，' + imp.n + ' 个是临时起意，合计 ' + yuan(imp.amount) +
          '（占支出 ' + Math.round(tl.impulseShare * 100) + '%）。它们不是"贵"，是"没停一下"。',
        effect: '登记成下期约定：单笔 ≥ ¥300 的支出，先在沙盘里过一遍再决定。',
        diff: [{ k: '单笔 ≥ ¥300', from: '直接花', to: '先过一遍沙盘' }],
        change: { kind: 'rule', text: '单笔 ¥300 以上的支出，先在沙盘里过一遍再花' }
      });
    }
    if (tl.clusters.length) {
      const cl = tl.clusters[0];
      out.push({
        id: 'batch_week', priority: 6, icon: '📅', kind: 'rule', tone: 'info',
        title: '把大额支出挪到到账后第一周',
        why: cl.n + ' 笔大额挤在 ' + cl.from.slice(5).replace('-', '/') + ' ~ ' +
          cl.to.slice(5).replace('-', '/') + '，合计 ' + yuan(cl.amount) +
          '。前半月被拿空，后半月再省也来不及。',
        effect: '登记成下期约定：大额支出集中在生活费到账后的第一周安排。',
        diff: [{ k: '大额支出安排', from: '哪天花哪天', to: '集中在到账后第一周' }],
        change: { kind: 'rule', text: '大额支出集中在生活费到账后的第一周安排' }
      });
    }

    return out.sort((a, b) => a.priority - b.priority);
  };

  /* ============================================================
     二·E、用户自己说的一条调整 → 翻译成可执行改动
     ============================================================
     不给用户"只能选我们给的建议"这种局面：他说什么，助手负责把它
     翻译成一个**具体的参数改动**，再拿回来给他审核。
     翻译不出来也不假装听懂 —— 直接记成一条下期约定（kind: 'rule'）。
     ============================================================ */
  const ADJ_RULES = [
    { re: /预算|总额|每月给|生活费/, kind: 'budget' },
    { re: /订阅|会员|续费|自动扣/, kind: 'sub' },
    { re: /池子|存|攒|储蓄|目标|基金/, kind: 'pool' },
    { re: /外卖|奶茶|吃饭|餐饮|食堂/, cat: 'food' },
    { re: /购物|衣服|鞋|化妆品|美妆|装备/, cat: 'shop' },
    { re: /娱乐|游戏|电影|演出|聚会/, cat: 'fun' },
    { re: /旅行|出行|旅游/, cat: 'travel' },
    { re: /大额|沙盘|推演|先想/, kind: 'rule' }
  ];

  E.classifyAdjust = function (text, ctx) {
    ctx = ctx || {};
    const s = String(text || '').trim();
    if (!s) return null;
    const budget = ctx.budget || {};
    const cats = budget.categories || {};
    const nums = s.match(/\d+(\.\d+)?/g) || [];
    const num = nums.length ? Number(nums[0]) : null;

    /* 先按**订阅名**认：「停掉 Spotify」这种人话里没有"订阅"两个字，
       但它比任何关键词都更明确。名字对得上就直接停它，不猜。 */
    const activeSubs = (ctx.subs || []).filter(x => x.status === 'active');
    const namedSub = activeSubs.find(x => s.indexOf(x.name) >= 0);
    const hit = namedSub ? { kind: 'sub' } : ADJ_RULES.find(x => x.re.test(s));

    /* 具体金额优先：用户说"下个月预算 3000"就照 3000 改，不做二次猜测 */
    if (hit && hit.kind === 'budget') {
      const cur = Number(budget.total) || 0;
      const target = num && num >= 200 ? num : r50((ctx.period && ctx.period.expense) || cur);
      return {
        kind: 'budget', change: { kind: 'budget', total: target, from: cur },
        note: '按你说的数字改月度预算。',
        diff: [{ k: '月度预算', from: yuan(cur), to: yuan(target) }]
      };
    }
    if (hit && hit.kind === 'sub') {
      const subs = (ctx.subs || []).filter(x => x.status === 'active');
      const named = subs.find(x => s.indexOf(x.name) >= 0);
      const pick = named || subs.slice().sort((a, b) => (b.amount || 0) - (a.amount || 0))[0];
      if (!pick) return null;
      return {
        kind: 'sub', change: { kind: 'sub', ids: [pick.id], names: [pick.name], monthly: pick.amount },
        note: named ? '你点名了 ' + pick.name + '，就停它。' : '你没点名，我先停最贵的那一项（' + pick.name + '）。',
        diff: [{ k: '订阅 · ' + pick.name, from: yuan(pick.amount) + '/月', to: '暂停' }]
      };
    }
    if (hit && hit.kind === 'pool') {
      const inc = ctx.income || {};
      const target = num && num >= 50 ? num : r50(Math.max(inc.earned || 0, 200) * 6);
      return {
        kind: 'pool',
        change: { kind: 'pool', title: '我的储蓄池', target: target, months: 6, per: num || r10(target / 6) },
        note: '把"存钱"落成一个能看见进度的目标。',
        diff: [{ k: '共同目标', from: '没有这一项', to: yuan(target) + ' / 6 个月' }]
      };
    }
    if (hit && hit.cat) {
      const cur = cats[hit.cat] || 0;
      const c = LJ.catById(hit.cat);
      const target = num && num >= 20 ? num : r10(Math.max(cur * 0.9, 50));
      return {
        kind: 'catCap', change: { kind: 'catCap', cat: hit.cat, cap: target, from: cur },
        note: '你说的是「' + c.name + '」，我按这一类改上限。',
        diff: [{ k: '分类上限 · ' + c.name, from: yuan(cur), to: yuan(target) }]
      };
    }
    return {
      kind: 'rule', change: { kind: 'rule', text: s },
      note: '这条不改数字，我把它记成下期的约定 —— 下期复盘时它会出现在这里。',
      diff: [{ k: '下期约定', from: '还没有这条', to: s }]
    };
  };

  /* ============================================================
     三、AI 建议（规则引擎）
     ============================================================ */
  E.suggestions = function (ctx) {
    const { entries, today, budget } = ctx;
    const out = [];
    const monthKey = U.monthKey(today);
    const mStart = U.startOfMonth(today);
    const mt = M.monthTotals(entries, monthKey);
    const gap = M.gapForecast(entries, today, budget ? budget.total : 2300);
    const bal = M.balances(entries);

    /* 1. 资金缺口 */
    if (gap.level !== 'none') {
      out.push({
        id: 'gap', level: gap.level === 'urgent' ? 'high' : gap.level === 'medium' ? 'mid' : 'low',
        icon: '⚠️', title: gap.label + '资金缺口',
        body: '按近 30 天日均 ¥' + gap.daily + ' 计算，到下次发放前需要 ¥' + U.won(gap.need) +
          '，当前可用 ¥' + U.won(gap.available) + '，预计差 ¥' + U.won(gap.gap) + '。',
        options: [
          { label: '看本周期节奏', to: 'youth.ledger', params: { view: 'cycle' } },
          { label: '调整分类预算', to: 'youth.budget' },
          { label: '发起一次支持协商', to: 'youth.talk' }
        ]
      });
    }

    /* 2. 大类超预算 */
    if (budget) {
      const spent = {};
      M.inRange(entries, mStart, today).filter(e => e.direction === 'out')
        .forEach(e => { spent[e.category] = (spent[e.category] || 0) + e.amount; });
      const totalDays = U.daysInMonth(today), passed = U.parse(today).getDate();
      Object.keys(budget.categories || {}).forEach(cid => {
        const b = budget.categories[cid];
        const s = spent[cid] || 0;
        if (b > 0 && s / b > 0.9 && passed / totalDays < 0.9) {
          out.push({
            id: 'over_' + cid, level: s > b ? 'mid' : 'low',
            icon: LJ.catById(cid).icon,
            title: LJ.catById(cid).name + '预算' + (s > b ? '已超支' : '快用完了'),
            body: '本月该类已支出 ¥' + U.won(s) + '，预算 ¥' + U.won(b) + '，' +
              '距离月底还有 ' + (totalDays - passed) + ' 天。',
            options: [
              { label: '调整预算', to: 'youth.budget' },
              { label: '查看该类明细', to: 'youth.ledger', params: { cat: cid } }
            ]
          });
        }
      });
    }

    /* 3. 支出节奏 */
    const passed = U.parse(today).getDate(), totalDays = U.daysInMonth(today);
    const paceRatio = mt.expense / (budget ? budget.total : 2300);
    if (paceRatio > passed / totalDays * 1.25 && mt.expense > 100) {
      out.push({
        id: 'pace', level: 'low', icon: '⏱',
        title: '支出节奏偏快',
        body: '本月已过 ' + passed + ' / ' + totalDays + ' 天，预算用了 ' + Math.round(paceRatio * 100) +
          '%。按这个节奏，月底可能会超。',
        options: [{ label: '看本周期节奏', to: 'youth.ledger', params: { view: 'cycle' } }]
      });
    }

    /* 4. 订阅总额 */
    const subs = E.subscriptions(entries, today);
    const subMonthly = subs.reduce((s, x) => s + x.monthly, 0);
    if (subMonthly > 60) {
      out.push({
        id: 'subs', level: 'low', icon: '🔔',
        title: '订阅支出 ' + subs.length + ' 项，每月约 ¥' + Math.round(subMonthly),
        body: '一年合计约 ¥' + Math.round(subMonthly * 12) + '。' +
          (subMonthly > 120 ? '建议检查一下有没有不常用的。' : '金额还在合理范围内。'),
        options: [{ label: '管理订阅', to: 'youth.subs' }]
      });
    }

    /* 5. 储蓄率下滑 */
    const c90 = M.inRange(entries, U.addDays(today, -89), today);
    const inc = c90.filter(e => e.direction === 'in').reduce((s, e) => s + e.amount, 0);
    const exp = c90.filter(e => e.direction === 'out').reduce((s, e) => s + e.amount, 0);
    const saveRate = inc > 0 ? (inc - exp) / inc : 0;
    if (saveRate < 0.1 && inc > 0) {
      out.push({
        id: 'save', level: 'low', icon: '🏦',
        title: '结余率偏低',
        body: '近 90 天结余率 ' + Math.round(saveRate * 100) + '%。留一点结余，遇到突发情况会从容很多。',
        options: [{ label: '设定储蓄目标', to: 'youth.savings' }]
      });
    }

    /* 6. 自有资金占比上升（正向反馈） */
    const ownIn = c90.filter(e => e.direction === 'in' && e.fundingSource === 'own').reduce((s, e) => s + e.amount, 0);
    if (inc > 0 && ownIn / inc >= 0.25) {
      out.push({
        id: 'own', level: 'good', icon: '🌱',
        title: '自有资金占比 ' + Math.round(ownIn / inc * 100) + '%',
        body: '近 90 天你的收入里有 ' + Math.round(ownIn / inc * 100) + '% 来自奖学金、红包等自有来源。' +
          '这个比例越高，你在家庭支持上的依赖就越少。',
        options: [{ label: '查看掌控指数', to: 'youth.control' }]
      });
    }

    /* 7. 场景提示 */
    const scenes = E.activeScenarios(today);
    scenes.forEach(s => {
      out.push({
        id: 'scene_' + s.id, level: 'info', icon: s.icon,
        title: s.name + '到了',
        body: s.hint,
        options: [{ label: '生成规划方案', to: 'youth.scenario', params: { id: s.id } }]
      });
    });

    /* 8. 记账习惯 */
    const streak = E.streak(entries, today);
    if (streak === 0) {
      out.push({
        id: 'idle', level: 'low', icon: '📝',
        title: '有几天没记账了',
        body: '连续记录是形成习惯最有效的办法。补记一下最近几天的支出就好。',
        options: [{ label: '去记一笔', to: 'youth.entry' }]
      });
    } else if (streak >= 7) {
      out.push({
        id: 'streak', level: 'good', icon: '🔥',
        title: '已连续记账 ' + streak + ' 天',
        body: '坚持记录是理财能力里最难也最有价值的一环。',
        options: [{ label: '查看成长任务', to: 'youth.tasks' }]
      });
    }

    const ORDER = { high: 0, mid: 1, low: 2, info: 3, good: 4 };
    return out.sort((a, b) => ORDER[a.level] - ORDER[b.level]);
  };

  /** 连续记账天数 */
  E.streak = function (entries, today) {
    const dates = new Set(entries.filter(e => e.direction === 'out').map(e => e.date));
    let n = 0;
    for (let i = 0; i < 400; i++) {
      const d = U.addDays(today, -i);
      if (dates.has(d)) n++;
      else if (i > 0) break;
    }
    return n;
  };

  /* ============================================================
     四、场景化资金规划
     ============================================================ */
  E.SCENARIOS = [
    {
      id: 'term_start', name: '开学季', icon: '🎒', months: [8, 9],
      hint: '学费、住宿、教材、生活采购集中在这个阶段，建议提前把钱分开管。',
      items: [
        { category: 'study', name: '教材与学习用品', ratio: 0.28 },
        { category: 'daily', name: '生活采购', ratio: 0.34 },
        { category: 'food', name: '餐饮（前两周会偏高）', ratio: 0.24 },
        { category: 'traffic', name: '返校交通', ratio: 0.14 }
      ]
    },
    {
      id: 'winter_summer', name: '寒暑假', icon: '☀️', months: [1, 2, 7],
      hint: '在校支出减少，但出行和娱乐会上升。建议把生活费按天而不是按月来安排。',
      items: [
        { category: 'fun', name: '出行与娱乐', ratio: 0.32 },
        { category: 'food', name: '餐饮（在家为主）', ratio: 0.34 },
        { category: 'traffic', name: '往返交通', ratio: 0.22 },
        { category: 'daily', name: '日常', ratio: 0.12 }
      ]
    },
    {
      id: 'job_hunt', name: '实习求职季', icon: '💼', months: [3, 4, 5, 10, 11],
      hint: '异地实习、面试出行、正装和证件照都是额外支出，建议单独开一个专项。',
      items: [
        { category: 'traffic', name: '面试与通勤交通', ratio: 0.30 },
        { category: 'daily', name: '正装与形象', ratio: 0.26 },
        { category: 'study', name: '证书与材料', ratio: 0.24 },
        { category: 'food', name: '在外就餐', ratio: 0.20 }
      ]
    },
    {
      id: 'graduation', name: '毕业过渡季', icon: '🎓', months: [5, 6],
      hint: '毕业照、论文、租房押金、搬家会集中出现。建议提前两个月开始留出缓冲。',
      items: [
        { category: 'daily', name: '租房押金与搬家', ratio: 0.42 },
        { category: 'fun', name: '毕业纪念', ratio: 0.20 },
        { category: 'traffic', name: '搬迁与出行', ratio: 0.20 },
        { category: 'study', name: '论文与材料', ratio: 0.18 }
      ]
    }
  ];

  E.activeScenarios = function (today) {
    const m = U.parse(today).getMonth() + 1;
    return E.SCENARIOS.filter(s => s.months.indexOf(m) >= 0);
  };

  /** 基于历史数据生成参考分配方案 */
  E.scenarioPlan = function (scenarioId, entries, today, budget) {
    const sc = E.SCENARIOS.find(s => s.id === scenarioId);
    if (!sc) return null;
    const base = budget ? budget.total : Math.round(M.monthlyExpenseAvg(entries, today, 3)) || 2300;
    const hist = M.categoryTotals(entries, U.addDays(today, -89), today);

    const items = sc.items.map(it => {
      const amount = Math.round(base * it.ratio);
      const h = hist.find(x => x.id === it.category);
      return {
        category: it.category, name: it.name, color: LJ.catById(it.category).color,
        icon: LJ.catById(it.category).icon,
        amount, ratio: it.ratio,
        histAmount: h ? Math.round(h.amount / 3) : 0,
        note: h && h.amount > 0
          ? '你的历史月均约 ¥' + Math.round(h.amount / 3) + '，方案' + (amount > h.amount / 3 ? '偏紧' : '偏宽')
          : '暂无历史数据'
      };
    });
    return { scenario: sc, base, items, total: items.reduce((s, i) => s + i.amount, 0) };
  };

  /* ============================================================
     五、成长任务体系
     ============================================================ */
  E.LEVELS = [
    { id: 'entry', name: '入门', desc: '建立记录习惯，知道钱花在哪里' },
    { id: 'mid', name: '进阶', desc: '能按预算安排支出，开始有结余' },
    { id: 'high', name: '高阶', desc: '结构稳定，具备独立管理能力' }
  ];

  E.TASKS = [
    { id: 't_record7', level: 'entry', name: '连续记账 7 天', desc: '记录是理财能力的第一步', reward: '解锁「收支节奏」视图',
      go: 'youth.entry', goLabel: '去记一笔', check: c => c.streak >= 7 },
    { id: 't_budget', level: 'entry', name: '设置一次分类预算', desc: '给每个大类定一个数', reward: '解锁预算偏差提醒',
      go: 'youth.budget', goLabel: '去设预算', check: c => c.hasBudget },
    { id: 't_confirm', level: 'entry', name: '完成一次支持对账', desc: '把家庭支持记清楚', reward: '支持记录进入成长册',
      go: 'youth.talk', goLabel: '去对账', check: c => c.confirmedCount >= 1 },
    /* ★ 「完成一次周期复盘」的判据是 reviewedOnce，而 reviewedOnce 现在只由
       **采纳一条调整**写入（复盘页那个"标记已复盘"按钮已经删了）。
       所以文案和跳转都跟着改：跳的是复盘这个主导航页，不是账单页的子视图。
       ★ 奖励也不再是「解锁周期对比」：单月数字本来就需要参照系，
         拿答案当奖励等于把答案扣在自己手里 —— 周期对比已经改成常开（E.UNLOCKS 里
         不再给它留门禁）。 */
    { id: 't_review', level: 'entry', name: '完成一次周期复盘', desc: '看完四个维度，把下期的一个数字改掉', reward: '把复盘结论记进成长档案',
      go: 'youth.review', goLabel: '去复盘', check: c => c.reviewedOnce },

    { id: 't_record30', level: 'mid', name: '连续记账 30 天', desc: '习惯成型需要一个月', reward: '解锁成长月报',
      go: 'youth.entry', goLabel: '去记一笔', check: c => c.streak >= 30 },
    { id: 't_nobust', level: 'mid', name: '有一个月没有超预算', desc: '按计划花钱', reward: '解锁等级徽章',
      go: 'youth.ledger', goParams: { view: 'cycle' }, goLabel: '看本周期', check: c => c.monthsUnderBudget >= 1 },
    { id: 't_save15', level: 'mid', name: '结余率达到 15%', desc: '留出缓冲', reward: '解锁共同储蓄目标',
      go: 'youth.savings', goLabel: '设储蓄目标', check: c => c.saveRate >= 0.15 },
    { id: 't_scenario', level: 'mid', name: '完成一次场景化规划', desc: '开学、假期、求职季提前安排', reward: '解锁场景提醒',
      go: 'youth.ai', goLabel: '去做规划', check: c => c.scenarioUsed >= 1 },

    { id: 't_budget3', level: 'high', name: '连续 3 个月预算执行率 > 85%', desc: '稳定的执行力', reward: '解锁进阶认证',
      go: 'youth.review', goLabel: '查看复盘', check: c => c.monthsUnderBudget >= 3 },
    { id: 't_ownup', level: 'high', name: '自有资金占比连续上升', desc: '自主能力在形成', reward: '解锁成长里程碑',
      go: 'youth.control', goLabel: '看掌控指数', check: c => c.ownRatioTrend >= 2 },
    { id: 't_indep', level: 'high', name: '掌控指数进入自主期', desc: '具备独立管理能力', reward: '解锁财务掌控力认证报告',
      go: 'youth.control', goLabel: '看差距在哪', check: c => c.controlScore >= 80 },
    { id: 't_span6', level: 'high', name: '保有一份 6 个月以上的完整账本', desc: '长期主义', reward: '解锁完整成长档案',
      go: 'youth.album', goLabel: '看成长档案', check: c => c.spanDays >= 180 }
  ];

  /* ============================================================
     成长任务的"解锁"是真门禁
     ============================================================
     reward 字段以前只被拼进通知正文（'解锁：' + t.reward），**没有任何门槛**，
     任务没做完也能用所有功能。这里给需要门禁的能力配上 key，
     UI 用 E.unlocked() 判断 —— 文档 3.3.4 说的是"完成对应任务可解锁…"。

     未解锁时**不隐藏**，而是显示一张"完成任务解锁"的卡：
     看得见才有奔头，藏起来只会让人以为产品缺了功能。
     ============================================================ */
  E.UNLOCKS = [
    { taskId: 't_record7', key: 'cycle_view', name: '收支节奏视图', where: '账单 → 周期' },
    /* 「预算偏差提醒」的门禁整个撤了（008）：账单页那张洞察卡删掉后，
       这把锁全站没有落点 —— 留着它只会让任务卡挂一个骗人的「未解锁」标。
       奖励文案仍然成立：设了分类预算，问问的超支回答和周期页的
       「支出快于时间进度」才会出现 —— 这由数据本身兑现，不需要锁。 */
    /* 「周期对比」不再上锁：单月数字需要参照系，答案不该当奖励发。
       门禁一撤，unlock.locked('period_compare') 就恒为 false，页面直接显示。 */
    { taskId: 't_record30', key: 'monthly_report', name: '成长月报', where: '成长中心 / 陪伴' },
    { taskId: 't_save15', key: 'savings_goal', name: '共同储蓄目标', where: '协商 → 共同储蓄' },
    { taskId: 't_scenario', key: 'scene_remind', name: '场景提醒', where: '首页 / 问问' },
    { taskId: 't_indep', key: 'cert_report', name: '财务掌控力认证', where: '成长中心 → 认证' },
    { taskId: 't_span6', key: 'full_archive', name: '完整成长档案', where: '成长中心 → 纪念册' }
  ];
  E.unlockOf = function (key) { return E.UNLOCKS.find(u => u.key === key) || null; };

  /** 这个能力解锁了没有。没配门禁的一律算解锁 */
  E.unlocked = function (tasks, key) {
    const u = E.unlockOf(key);
    if (!u) return true;
    const t = (tasks || []).find(x => x.id === u.taskId);
    return !!(t && t.done);
  };

  /** 汇总任务判定所需的所有事实 */
  E.taskContext = function (entries, today, opt) {    opt = opt || {};
    const budget = opt.budget;
    const streak = E.streak(entries, today);
    const c90 = M.inRange(entries, U.addDays(today, -89), today);
    const inc = c90.filter(e => e.direction === 'in').reduce((s, e) => s + e.amount, 0);
    const exp = c90.filter(e => e.direction === 'out').reduce((s, e) => s + e.amount, 0);

    // 每个月的预算执行情况
    let monthsUnderBudget = 0;
    for (let i = 1; i <= 6; i++) {
      const mk = U.monthKey(U.addMonths(today, -i));
      const mt = M.monthTotals(entries, mk);
      const b = budget ? budget.total : 2300;
      if (mt.total === undefined && mt.expense > 0 && mt.expense <= b * 0.95 && mt.count > 8) monthsUnderBudget++;
    }

    // 自有资金占比趋势
    const ratios = [];
    for (let i = 0; i < 4; i++) {
      const from = U.addDays(today, -(i + 1) * 30 + 1), to = U.addDays(today, -i * 30);
      const seg = M.inRange(entries, from, to).filter(e => e.direction === 'in');
      const all = seg.reduce((s, e) => s + e.amount, 0);
      const own = seg.filter(e => e.fundingSource === 'own').reduce((s, e) => s + e.amount, 0);
      if (all > 0) ratios.unshift(own / all);
    }
    let ownRatioTrend = 0;
    for (let i = 1; i < ratios.length; i++) if (ratios[i] > ratios[i - 1]) ownRatioTrend++;

    const dates = entries.map(e => e.date).sort();
    const spanDays = dates.length ? U.diffDays(dates[0], today) : 0;
    const ctl = M.controlIndex(entries, { today, budgetMonthly: budget ? budget.total : 2300 });

    return {
      streak,
      saveRate: inc > 0 ? (inc - exp) / inc : 0,
      hasBudget: !!(budget && budget.total > 0 && Object.keys(budget.categories || {}).length > 0),
      confirmedCount: opt.confirmedCount || 0,
      reviewedOnce: opt.reviewedOnce || false,
      scenarioUsed: opt.scenarioUsed || 0,
      monthsUnderBudget,
      ownRatioTrend,
      controlScore: ctl.score,
      spanDays
    };
  };

  E.evaluateTasks = function (ctx, progress) {
    const done = {};
    (progress || []).forEach(p => { if (p.status === 'done') done[p.taskId] = true; });
    return E.TASKS.map(t => {
      let pass = false;
      try { pass = !!t.check(ctx); } catch (e) { pass = false; }
      return {
        ...t,
        done: pass || !!done[t.id],
        claimed: !!done[t.id]
      };
    });
  };

  E.taskSummary = function (tasks) {
    const byLevel = {};
    E.LEVELS.forEach(l => {
      const list = tasks.filter(t => t.level === l.id);
      byLevel[l.id] = {
        ...l, total: list.length,
        done: list.filter(t => t.done).length,
        list
      };
    });
    return {
      levels: byLevel,
      total: tasks.length,
      done: tasks.filter(t => t.done).length,
      entryDone: byLevel.entry.done === byLevel.entry.total,
      midDone: byLevel.mid.done === byLevel.mid.total
    };
  };

  /* ============================================================
     六、能力证据（从留痕流水里抽出「他做过的财务动作」）
     ============================================================
     成长的证据不是"指数多少分"，而是"他主动做过什么"：
     调过预算、砍过订阅、做过复盘、往目标里存过钱、主动说明过风险事件。

     为什么必须是**白名单**（而不是把"非查看类"都算进来）：
       留痕表里 50 多种动作，绝大多数和财务能力无关 ——
       撤回授权、调整省心模式、逐项开放信息这些是**边界操作**，
       把「他改过 3 次信息范围」当成成长证据给家长看，
       等于把隐私边界本身变成了家长围观的对象，和产品哲学直接冲突。
       黑名单会随着新动作不断漏；白名单只漏"我们没想到的好动作"，
       而漏掉一个证据只是少一条，不会越界。
     ============================================================ */
  E.EVIDENCE = [
    { id: 'budget_edit', dim: '预算管理', actions: ['调整预算'],
      text: n => '主动调整预算 ' + n + ' 次' },
    { id: 'scenario', dim: '预算管理', actions: ['采纳场景化规划'],
      text: n => '采纳场景化规划 ' + n + ' 次' },
    { id: 'review', dim: '消费认知', actions: ['完成周期复盘'],
      text: n => '完成周期复盘 ' + n + ' 次' },
    /* 复盘闭环的那一步：看完五个维度之后，真的动手改了一个参数。
       这是"复盘"和"读后感"的分界线，所以在证据里单独占一条。 */
    { id: 'plan_adopt', dim: '预算管理', actions: ['采纳复盘建议'],
      text: n => '按复盘结论调整下期规划 ' + n + ' 次' },
    { id: 'sub_cut', dim: '消费认知', actions: ['暂停订阅', '移除订阅'],
      text: n => '停掉不再用的订阅 ' + n + ' 项' },
    { id: 'save_goal', dim: '储蓄习惯', actions: ['向共同目标存入', '发起共同储蓄目标'],
      text: n => '往共同目标里存了 ' + n + ' 次' },
    { id: 'risk_respond', dim: '风险抵御', actions: ['回应风险事件'],
      text: n => '主动说明风险事件 ' + n + ' 次' },
    { id: 'prepay_back', dim: '储蓄习惯', actions: ['归还预支'],
      text: n => '按计划归还预支 ' + n + ' 次' }
  ];

  /* 明确排除、并在这里写清楚为什么 —— 免得以后有人"顺手"把它们加回来：
       · '查看'      ：浏览行为。家长看到"他看了 12 次账单"是监控，不是能力证据。
       · '记一笔'    ：数据录入。记账是脚手架（真实形态下流水自动进来），
                       而且它衡量的是勤奋，不是能力。
       · 一切权限/披露类动作（撤回授权 / 调整省心模式 / 逐项开放信息…）：
                       那是边界操作。给家长看等于把隐私边界变成围观对象。 */

  /** 从留痕里抽能力证据。events = auditLog 行（必须已按 actorId 圈定到本人） */
  E.actionEvidence = function (events, from, to) {
    const rows = (events || []).filter(e => {
      const d = String(e.at || '').slice(0, 10);
      return d >= from && d <= to;
    });
    const out = [];
    E.EVIDENCE.forEach(def => {
      const n = rows.filter(e => def.actions.indexOf(e.action) >= 0).length;
      if (n > 0) out.push({ id: def.id, dim: def.dim, count: n, text: def.text(n) });
    });
    return out;
  };

  /** 证据按维度归组（给父母端月报用） */
  E.evidenceByDim = function (evidence) {
    const dims = {};
    (evidence || []).forEach(e => {
      (dims[e.dim] = dims[e.dim] || []).push(e);
    });
    return dims;
  };

  /* ============================================================
     七、近 7 天的动作任务
     ============================================================
     原来的 12 项任务全是「结果达标」——"连续 3 个月预算执行率 > 85%"，
     要等三个月才知道做没做。动作任务反过来：**这周做了没有**，
     当天就能看到反馈。任务从"考勤"变成"作业"。

     窗口用**滚动 7 天**而不是自然周：自然周一到周一就清零，
     用户看到的是"你什么都没做"，实际是刚重置，体验很差。
     ============================================================ */
  E.ACTIONS = [
    { id: 'a_budget', evidence: 'budget_edit', name: '主动调整过一次预算',
      why: '预算不是设一次就完事，跟着实际情况改才算在用',
      go: 'youth.budget', goLabel: '去调整' },
    { id: 'a_sub', evidence: 'sub_cut', name: '停掉一项不再用的订阅',
      why: '能砍掉自己不需要的东西，是消费认知里最难的一步',
      go: 'youth.subs', goLabel: '看订阅' },
    { id: 'a_review', evidence: 'review', name: '做过一次周期复盘',
      why: '回头看一次，比再记一个月账有用',
      go: 'youth.review', goLabel: '去复盘' },
    { id: 'a_save', evidence: 'save_goal', name: '往共同目标里存了一笔',
      why: '储蓄习惯靠的是重复动作，不是一次决心',
      go: 'youth.savings', goLabel: '去看看' },
    { id: 'a_risk', evidence: 'risk_respond', name: '主动说明过一次风险事件',
      why: '自己说清楚，比系统替你开口强得多',
      go: 'youth.risk', goLabel: '去看看' }
  ];

  /** 近 7 天的动作完成情况 */
  E.actionWeek = function (events, today) {
    const from = U.addDays(today, -6);
    const ev = E.actionEvidence(events, from, today);
    const byId = {};
    ev.forEach(e => { byId[e.id] = e; });
    const list = E.ACTIONS.map(a => ({
      ...a,
      count: byId[a.evidence] ? byId[a.evidence].count : 0,
      done: !!byId[a.evidence]
    }));
    return {
      from, to: today,
      list,
      done: list.filter(a => a.done).length,
      total: list.length
    };
  };

  /* ============================================================
     八、成长里程碑
     ============================================================ */
  E.milestones = function (entries, today) {
    const out = [];
    const dates = entries.map(e => e.date).sort();
    if (!dates.length) return out;

    out.push({ id: 'm_first', icon: '🌱', name: '第一次记账', date: dates[0], desc: '从这一刻开始，你开始看见自己的钱' });

    const bal = M.balances(entries);
    const ctl = M.controlIndex(entries, { today, budgetMonthly: 2300 });

    if (ctl.score >= 60) {
      const d = E._firstDateWhere(entries, today, e => M.controlIndex(e, { today, budgetMonthly: 2300 }).score >= 60);
      if (d) out.push({ id: 'm_grow', icon: '📈', name: '进入成长期', date: d, desc: '掌控指数突破 60' });
    }
    if (ctl.score >= 80) {
      const d = E._firstDateWhere(entries, today, e => M.controlIndex(e, { today, budgetMonthly: 2300 }).score >= 80);
      if (d) out.push({ id: 'm_auto', icon: '🎯', name: '进入自主期', date: d, desc: '掌控指数突破 80' });
    }
    if (bal.own >= 3000) {
      out.push({ id: 'm_own3k', icon: '💎', name: '自有资金超过 ¥3,000', date: dates[dates.length - 1], desc: '奖学金、红包慢慢积累起来了' });
    }
    const subCount = entries.filter(e => e.direction === 'in' && /奖学金/.test(e.title || '')).length;
    if (subCount) {
      const d = entries.filter(e => e.direction === 'in' && /奖学金/.test(e.title || '')).map(e => e.date).sort()[0];
      out.push({ id: 'm_scholar', icon: '🏅', name: '第一次拿到奖学金', date: d, desc: '这是自有资金的重要来源' });
    }
    const span = U.diffDays(dates[0], today);
    if (span >= 90) out.push({ id: 'm_90', icon: '🗓', name: '记账满 3 个月', date: U.addDays(dates[0], 90), desc: '习惯开始成形' });
    if (span >= 180) out.push({ id: 'm_180', icon: '🏆', name: '记账满 6 个月', date: U.addDays(dates[0], 180), desc: '你已经有了完整的财务轨迹' });

    return out.sort((a, b) => a.date < b.date ? 1 : -1);
  };

  E._firstDateWhere = function (entries, today, predFn) {
    // 从最早开始，每周采样，找到第一个满足条件的日期
    const dates = entries.map(e => e.date).sort();
    if (!dates.length) return null;
    const start = dates[0];
    const span = U.diffDays(start, today);
    for (let i = 7; i <= span; i += 7) {
      const d = U.addDays(start, i);
      if (predFn(entries.filter(e => e.date <= d))) return d;
    }
    return null;
  };

  /* ============================================================
     九、成长认证报告
     ============================================================ */
  E.certification = function (entries, today, budget, extra) {
    const ctl = M.controlIndex(entries, { today, budgetMonthly: budget ? budget.total : 2300 });
    const dates = entries.map(e => e.date).sort();
    const bal = M.balances(entries);
    const h = M.health(entries, today);

    if (ctl.score < 80) {
      return {
        eligible: false, score: ctl.score,
        need: 80 - ctl.score,
        level: ctl.level, dims: ctl.dims,
        message: '掌控指数达到 80 分（自主期）后即可生成认证报告。目前 ' + ctl.score + ' 分，还差 ' + (80 - ctl.score) + ' 分。'
      };
    }

    const cat = M.categoryTotals(entries, dates[0], today);
    return {
      eligible: true,
      id: 'cert_' + today,
      issuedAt: today,
      holder: extra && extra.name ? extra.name : '',
      period: { from: dates[0], to: today, days: U.diffDays(dates[0], today) },
      score: ctl.score, level: ctl.level, dims: ctl.dims,
      health: h, balances: bal,
      topCategory: cat[0],
      categoryCount: cat.filter(c => c.amount > 0).length,
      conclusion: ctl.score >= 90
        ? '财务状况稳定，收支结构合理，具备独立管理个人财务的能力。'
        : '已形成稳定的记账与预算习惯，收支结构健康，具备独立管理个人财务的能力。'
    };
  };

  /* ============================================================
     十、生命周期阶段
     ============================================================ */
  E.LIFE_STAGES = [
    { id: 'freshman', name: '入学适应期', months: [8, 9, 10], icon: '🎒', tip: '重点是建立记账习惯，先把钱花在哪里搞清楚。' },
    { id: 'steady', name: '稳定学习期', months: [11, 12, 3, 4], icon: '📚', tip: '重点是预算执行和结余积累。' },
    { id: 'vacation', name: '假期调整期', months: [1, 2, 7], icon: '☀️', tip: '在校支出减少，适合调整生活费安排。' },
    { id: 'transition', name: '求职过渡期', months: [5, 6], icon: '💼', tip: '重点是租房、通勤、正装这类过渡性支出的提前准备。' }
  ];

  E.lifeStage = function (today) {
    const m = U.parse(today).getMonth() + 1;
    return E.LIFE_STAGES.find(s => s.months.indexOf(m) >= 0) || E.LIFE_STAGES[1];
  };

  /* ============================================================
     十一、共同储蓄目标
     ============================================================ */
  E.savingProgress = function (goal) {
    const contributed = (goal.contributions || []).reduce((s, c) => s + c.amount, 0);
    return {
      ...goal,
      contributed,
      remaining: Math.max(0, goal.target - contributed),
      ratio: goal.target > 0 ? Math.min(1, contributed / goal.target) : 0,
      done: contributed >= goal.target
    };
  };

  /* ============================================================
     十二、预支与还款
     ============================================================ */
  E.prepayPlan = function (plan, today) {
    const repaid = (plan.repayments || []).reduce((s, r) => s + r.amount, 0);
    const remaining = Math.max(0, plan.amount - repaid);
    const perPeriod = plan.periods > 0 ? plan.amount / plan.periods : plan.amount;
    const paidPeriods = Math.min(plan.periods, Math.floor(repaid / perPeriod));
    return {
      ...plan,
      repaid, remaining, perPeriod: Math.round(perPeriod * 100) / 100,
      paidPeriods, remainingPeriods: Math.max(0, plan.periods - paidPeriods),
      ratio: plan.amount > 0 ? Math.min(1, repaid / plan.amount) : 0,
      done: remaining <= 0.01,
      nextDue: E._nextDueDate(plan, today)
    };
  };

  E._nextDueDate = function (plan, today) {
    const start = U.parse(plan.startDate || today);
    const d = new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
    return U.ymd(d);
  };

  /* ============================================================
     十三、账单文件导入（微信支付 / 支付宝 导出 CSV）
     ============================================================ */

  /** 商户名 → 大类 */
  const CAT_WORDS = [
    ['sub', ['云盘', '网易云', '腾讯视频', '爱奇艺', '哔哩哔哩', 'bilibili', 'iCloud', '会员服务', '订阅']],
    ['food', ['食堂', '餐饮', '美团', '饿了么', '餐厅', '饭店', '咖啡', '奶茶', '蜜雪', '瑞幸', '肯德基',
      '麦当劳', '星巴克', '沙县', '面馆', '烧烤', '火锅', '食品', '便利', '超市发', '小吃', '轻食']],
    ['traffic', ['地铁', '公交', '滴滴', '出行', '单车', '哈啰', '青桔', '铁路', '12306', '航空',
      '机票', '火车', '打车', '高德', '加油', '高速']],
    ['study', ['书店', '图书', '教材', '打印', '文印', '知网', '网课', '教育', '培训', '考试',
      '报名', '文具', '学习', '大学', '课程']],
    ['fun', ['电影', '影城', '游戏', 'steam', 'ktv', '娱乐', '剧本', '密室', '演出', '票务',
      '猫眼', '淘票票', '音乐', '台球', '桌游', '剧本杀']],
    ['daily', ['超市', '永辉', '沃尔玛', '屈臣氏', '药房', '药店', '理发', '快递', '菜鸟',
      '话费', '中国移动', '联通', '电信', '洗护', '医院', '诊所', '服饰', '美妆', '宜家']]
  ];

  E.guessCategory = function (text) {
    const t = String(text || '').toLowerCase();
    for (const [cat, words] of CAT_WORDS) {
      if (words.some(w => t.indexOf(w.toLowerCase()) >= 0)) return cat;
    }
    return 'daily';
  };

  /** 极简 CSV 解析（支持引号包裹与逗号转义） */
  function parseCSVLine(line) {
    const out = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"') {
          if (line[i + 1] === '"') { cur += '"'; i++; }
          else inQ = false;
        } else cur += ch;
      } else {
        if (ch === '"') inQ = true;
        else if (ch === ',') { out.push(cur); cur = ''; }
        else cur += ch;
      }
    }
    out.push(cur);
    return out.map(s => s.trim());
  }

  const HEADER_MAP = [
    ['date', ['交易时间', '交易创建时间', '交易日期', '付款时间', '时间', '日期', '记账日期']],
    ['merchant', ['交易对方', '对方', '商户', '商品说明', '商品名称', '商品', '交易描述', '摘要']],
    ['amount', ['金额(元)', '金额（元）', '金额', '发生额', '交易金额']],
    ['direction', ['收/支', '收支', '资金流向', '收支类型']],
    ['type', ['交易类型', '类型', '交易分类']],
    ['method', ['支付方式', '付款方式', '资金来源']],
    ['status', ['当前状态', '交易状态', '状态']],
    ['note', ['备注']]
  ];

  function normDate(s) {
    const m = String(s).match(/(\d{4})[-/年](\d{1,2})[-/月](\d{1,2})/);
    if (!m) return null;
    return m[1] + '-' + U.pad(m[2]) + '-' + U.pad(m[3]);
  }
  function normAmount(s) {
    const m = String(s).replace(/[¥￥,\s]/g, '').match(/-?\d+(\.\d+)?/);
    return m ? Math.abs(Number(m[0])) : 0;
  }

  /**
   * 解析账单文本
   * 返回 { rows:[{date,merchant,amount,direction,category,method,note,raw}], skipped, encoding }
   */
  E.parseStatement = function (text) {
    const lines = String(text).split(/\r?\n/).filter(l => l.trim().length > 0);
    if (!lines.length) return { rows: [], skipped: 0, error: '文件是空的' };

    // 找表头行
    let headerIdx = -1, cols = {};
    for (let i = 0; i < Math.min(lines.length, 30); i++) {
      const cells = parseCSVLine(lines[i]);
      const map = {};
      cells.forEach((c, j) => {
        HEADER_MAP.forEach(([key, names]) => {
          if (map[key] === undefined && names.some(n => c.replace(/\s/g, '').indexOf(n) >= 0)) map[key] = j;
        });
      });
      if (map.date !== undefined && map.amount !== undefined) {
        headerIdx = i; cols = map; break;
      }
    }
    if (headerIdx < 0) {
      return { rows: [], skipped: lines.length, error: '没找到表头，请确认导出的是微信支付或支付宝的账单 CSV' };
    }

    const rows = [];
    let skipped = 0;
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const cells = parseCSVLine(lines[i]);
      if (cells.length < 2) { skipped++; continue; }

      const date = normDate(cells[cols.date]);
      const amount = normAmount(cells[cols.amount]);
      if (!date || !amount) { skipped++; continue; }

      const dirRaw = cols.direction !== undefined ? (cells[cols.direction] || '') : '';
      let direction = 'out';
      if (/收入|收/.test(dirRaw) && !/支出/.test(dirRaw)) direction = 'in';
      else if (/不计收支/.test(dirRaw)) { skipped++; continue; }
      else if (cols.direction === undefined) direction = 'out';

      const merchant = (cols.merchant !== undefined ? cells[cols.merchant] : '') || '';
      const type = (cols.type !== undefined ? cells[cols.type] : '') || '';
      const note = (cols.note !== undefined ? cells[cols.note] : '') || '';

      // 转账/红包这类不算支出
      if (/转账|红包|零钱通|余额宝|还款/.test(type) && amount > 3000) { skipped++; continue; }

      const guessText = merchant + ' ' + type + ' ' + note;
      rows.push({
        date, merchant: merchant || type || '未知商户', amount,
        direction,
        category: direction === 'in' ? null : E.guessCategory(guessText),
        method: (cols.method !== undefined ? cells[cols.method] : '') || '',
        note,
        title: direction === 'in' ? (merchant || '入账') : null
      });
    }

    rows.sort((a, b) => a.date < b.date ? 1 : -1);
    return { rows, skipped, headerIdx };
  };

  /** 生成一份可导入的样例账单文本（内置演示用） */
  E.sampleStatement = function (today) {
    const lines = ['交易时间,交易类型,交易对方,商品,收/支,金额(元),支付方式,当前状态,备注'];
    const demo = [
      ['商户消费', '第一食堂', '餐饮', '支出', '18.00', '零钱'],
      ['商户消费', '美团外卖', '外卖订单', '支出', '32.50', '零钱'],
      ['商户消费', '地铁 2 号线', '乘车码', '支出', '3.00', '零钱'],
      ['商户消费', '瑞幸咖啡', '生椰拿铁', '支出', '16.00', '零钱'],
      ['商户消费', '永辉超市', '日用', '支出', '88.40', '零钱'],
      ['商户消费', '万达影城', '电影票', '支出', '59.00', '零钱'],
      ['商户消费', '文印店', '打印装订', '支出', '24.00', '零钱'],
      ['商户消费', '屈臣氏', '洗护用品', '支出', '76.00', '零钱'],
      ['转账', '妈妈', '生活费', '收入', '2400.00', '零钱'],
      ['商户消费', '哈啰单车', '骑行', '支出', '1.50', '零钱'],
      ['商户消费', '教材书店', '专业教材', '支出', '128.00', '零钱'],
      ['商户消费', '蜜雪冰城', '柠檬水', '支出', '6.00', '零钱']
    ];
    demo.forEach((d, i) => {
      const day = Math.max(1, 28 - i * 2);
      const date = U.monthKey(today) + '-' + U.pad(day) + ' 12:' + U.pad(i % 60);
      lines.push([date, d[0], d[1], d[2], d[3], d[4], d[5], '支付成功', ''].join(','));
    });
    return lines.join('\n');
  };

  /* ---------------- 人情往来 ---------------- */

  /** 距生日还有多少天（birthday 形如 '10-24'） */
  E.daysToBirthday = function (birthday, today) {
    if (!birthday) return null;
    const p = String(birthday).split('-');
    const md = { m: Number(p[0]), d: Number(p[1]) };
    if (!md.m || !md.d) return null;
    const y = U.parse(today).getFullYear();
    let b = new Date(y, md.m - 1, md.d);
    if (U.ymd(b) < today) b = new Date(y + 1, md.m - 1, md.d);
    return U.diffDays(today, U.ymd(b));
  };

  /** 某个人的人情账（双向往来，不做价值判断） */
  E.favorByPerson = function (personId, favors, today) {
    const mine = favors.filter(f => f.personId === personId)
      .sort((a, b) => a.date < b.date ? 1 : -1);
    const out = mine.filter(f => f.direction === 'out');
    const inn = mine.filter(f => f.direction === 'in');
    const pick = (list, kind) => list.filter(f => f.kind === kind).length;
    return {
      personId,
      list: mine,
      outCount: out.length, inCount: inn.length,
      outTotal: Math.round(out.reduce((s, f) => s + (f.amount || 0), 0)),
      inTotal: Math.round(inn.reduce((s, f) => s + (f.amount || 0), 0)),
      mealOut: pick(out, 'meal'), mealIn: pick(inn, 'meal'),
      giftOut: pick(out, 'gift') + pick(out, 'redpacket'),
      giftIn: pick(inn, 'gift') + pick(inn, 'redpacket'),
      last: mine[0] || null,
      lastDays: mine[0] ? U.diffDays(mine[0].date, today) : null
    };
  };

  /** 全年人情概况 + 待处理提醒 */
  E.favorOverview = function (people, favors, today) {
    const year = String(today).slice(0, 4);
    const y = favors.filter(f => String(f.date).slice(0, 4) === year);
    const out = y.filter(f => f.direction === 'out');
    const inn = y.filter(f => f.direction === 'in');
    const pending = [];

    (people || []).forEach(p => {
      const b = E.favorByPerson(p.id, favors, today);

      /* ① 待回请：对方请客比自己多 2 次以上 */
      if (b.mealIn - b.mealOut >= 2) {
        pending.push({
          icon: '🍜', type: 'meal', personId: p.id, personName: p.name,
          text: p.name + '请你吃过 ' + b.mealIn + ' 次，你请过 ' + b.mealOut + ' 次'
        });
      }

      /* ② 生日临近 + 收过礼没回 */
      const days = E.daysToBirthday(p.birthday, today);
      const unreplied = favors.filter(f =>
        f.personId === p.id && f.direction === 'in' &&
        (f.kind === 'gift' || f.kind === 'redpacket') && !f.returned);
      if (days !== null && days <= 30 && unreplied.length) {
        pending.push({
          icon: '🎂', type: 'birthday', personId: p.id, personName: p.name,
          days,
          text: p.name + '生日还有 ' + days + ' 天' +
            (unreplied[0].item ? '，' + unreplied[0].date.slice(5) + ' 收到过「' + unreplied[0].item + '」' : '')
        });
      }
    });

    const peopleCount = {};
    favors.forEach(f => { peopleCount[f.personId] = 1; });

    return {
      year,
      outTotal: Math.round(out.reduce((s, f) => s + (f.amount || 0), 0)),
      outCount: out.length,
      inTotal: Math.round(inn.reduce((s, f) => s + (f.amount || 0), 0)),
      inCount: inn.length,
      peopleCount: Object.keys(peopleCount).length,
      pending: pending
    };
  };

  /* ============================================================
     十四、智能助手问答（本地规则引擎）
     输入一句自然语言，命中意图后返回「结论 + 关键数字 + 可执行出口」
     ============================================================ */

  /** 空态引导：把「能力名」直接摆出来，让用户 3 秒知道这个助手能干什么 */
  E.AI_CAPS = [
    { id: 'sandbox', icon: '🔮', name: '财务沙盘', tagline: '买之前，先在这里花一遍',
      ask: '我想买台 1500 的显示器，帮我算算' },
    { id: 'plan', icon: '🧭', name: '计划生成', tagline: '说一件事，排一套方案',
      ask: '寒假想去云南玩 7 天，帮我规划一下' },
    { id: 'persona', icon: '🪞', name: '消费人格', tagline: '账本里的你，你可能不认识',
      ask: '我是个怎么花钱的人' },
    { id: 'target', icon: '🎯', name: '目标推演', tagline: '想存多少，倒推每月几块',
      ask: '我想存够 8000 块，怎么办' },
    { id: 'parallel', icon: '🛤', name: '平行人生', tagline: '照这样，两年后是什么样',
      ask: '照现在这样下去，两年后我会变成什么样' },
    { id: 'favor', icon: '🤝', name: '人情往来', tagline: '谁请过我，该回礼了吗',
      ask: '我的人情往来有没有该处理的' }
  ];

  E.QUICK_ASKS = E.AI_CAPS.map(c => c.ask);

  /** 从一句话里抠出金额 */
  function pickAmount(text) {
    const m = String(text).match(/(\d[\d,]*(?:\.\d+)?)\s*(?:元|块|rmb|¥)?/i);
    if (!m) return null;
    const n = Number(String(m[1]).replace(/,/g, ''));
    return isFinite(n) && n > 0 ? n : null;
  }

  /* ---------------- 计划生成：一句话 → 一套可执行方案 ---------------- */
  const PLAN_SCENES = [
    {
      re: /旅行|旅游|出去玩|出行|机票|高铁|酒店|民宿|去.{1,8}(玩|旅游)/,
      icon: '🧳', name: '出行计划', unit: '天', defaultQty: 5, perUnit: 620,
      items: [['交通', .30], ['住宿', .32], ['餐饮', .20], ['门票活动', .12], ['备用', .06]]
    },
    {
      re: /电脑|手机|相机|显示器|耳机|平板|键盘|笔记本|数码/,
      icon: '💻', name: '数码购置', unit: '件', defaultQty: 1, perUnit: 4500,
      items: [['设备', .85], ['配件', .10], ['备用', .05]]
    },
    {
      re: /考证|雅思|托福|考研|报班|培训|课程|报名费/,
      icon: '📘', name: '学习投入', unit: '期', defaultQty: 1, perUnit: 1500,
      items: [['报名费', .55], ['教材资料', .20], ['备考期额外开销', .25]]
    },
    {
      re: /搬家|租房|押金|房租/,
      icon: '🏠', name: '搬家租房', unit: '次', defaultQty: 1, perUnit: 3600,
      items: [['押金', .48], ['首月房租', .30], ['添置', .22]]
    }
  ];

  E.makePlan = function (text, entries, today, budget) {
    const q = String(text || '');
    let sc = null;
    for (let i = 0; i < PLAN_SCENES.length; i++) if (PLAN_SCENES[i].re.test(q)) { sc = PLAN_SCENES[i]; break; }
    if (!sc) sc = PLAN_SCENES[0];

    /* 数量：优先取「N 天 / N 个人 / N 件」，否则用默认 */
    let qty = sc.defaultQty;
    const dm = q.match(/(\d{1,3})\s*(天|日|晚)/);
    if (dm) qty = Number(dm[1]);

    /* 总额：优先用用户说的金额，否则按单价 × 数量 */
    const saidAmount = pickAmount(q);
    const total = saidAmount && saidAmount > 300 ? saidAmount : Math.round(sc.perUnit * qty);

    const items = sc.items.map(([name, ratio]) => ({ name, amount: Math.round(total * ratio) }));

    /* 资金来源：真实账本 */
    const bal = M.balances(entries);
    const from = U.addDays(today, -179);
    const win = M.inRange(entries, from, today);
    const income = win.filter(e => e.direction === 'in').reduce((s, e) => s + e.amount, 0) / 6;
    const expense = win.filter(e => e.direction === 'out').reduce((s, e) => s + e.amount, 0) / 6;
    const avgSave = income - expense;

    const available = bal.family + bal.own;
    const gap = Math.max(0, total - available);
    const months = gap > 0 ? 3 : 0;
    const perMonth = months ? Math.ceil(gap / months) : 0;
    const feasible = gap <= 0 || avgSave >= perMonth;
    const canCut = E.shrink(entries, today, budget).total;

    return {
      scene: sc, qty, total, items,
      available: Math.round(available),
      familyBal: Math.round(bal.family), ownBal: Math.round(bal.own),
      gap: Math.round(gap), months, perMonth,
      avgSave: Math.round(avgSave), feasible, canCut,
      daysCover: avgSave > 0 ? Math.ceil(gap / avgSave) : null
    };
  };

  /* ---------------- 消费人格：从账本里挖行为模式 ---------------- */
  E.persona = function (entries, today) {
    const from = U.addDays(today, -89);
    const win = M.inRange(entries, from, today).filter(e => e.direction === 'out');
    if (!win.length) return null;

    /* ① 周末 / 工作日 */
    const byDay = {};
    win.forEach(e => { byDay[e.date] = (byDay[e.date] || 0) + e.amount; });
    let wkSum = 0, wkN = 0, wdSum = 0, wdN = 0;
    Object.keys(byDay).forEach(d => {
      const dow = U.parse(d).getDay();
      if (dow === 0 || dow === 6) { wkSum += byDay[d]; wkN++; }
      else { wdSum += byDay[d]; wdN++; }
    });
    const wkAvg = wkN ? wkSum / wkN : 0;
    const wdAvg = wdN ? wdSum / wdN : 0;
    const wkShare = (wkSum + wdSum) > 0 ? wkSum / (wkSum + wdSum) : 0;

    /* ② 小额无感 */
    const small = win.filter(e => e.amount <= 30);
    const smallShare = small.length / win.length;
    const smallSum = small.reduce((s, e) => s + e.amount, 0);

    /* ③ 大额笔数 */
    const big = win.filter(e => e.amount >= 300);

    /* ④ 笔数最多的商户 */
    const byMerchant = {};
    win.forEach(e => {
      const k = e.merchant || LJ.catById(e.category).name;
      if (!byMerchant[k]) byMerchant[k] = { name: k, n: 0, sum: 0 };
      byMerchant[k].n++; byMerchant[k].sum += e.amount;
    });
    const topRepeat = Object.values(byMerchant).sort((a, b) => b.n - a.n)[0];
    const topMoney = Object.values(byMerchant).sort((a, b) => b.sum - a.sum)[0];

    /* ⑤ 周末集中度描述 */
    let style;
    if (wkAvg > wdAvg * 1.8) style = 'weekend';
    else if (wdAvg > wkAvg * 1.8) style = 'weekday';
    else style = 'even';

    return {
      wkAvg: Math.round(wkAvg), wdAvg: Math.round(wdAvg),
      wkRatio: Math.round(wkAvg > 0 && wdAvg > 0 ? wkAvg / wdAvg * 100 : 100),
      wkShare: Math.round(wkShare * 100),
      smallCount: small.length, smallSum: Math.round(smallSum),
      smallShare: Math.round(smallShare * 100),
      bigCount: big.length,
      topRepeat, topMoney, style,
      totalCount: win.length
    };
  };

  /* ---------------- 资金推演：买之前先看影响 ---------------- */
  E.whatIf = function (amount, entries, today, budget) {
    const bal = M.balances(entries);
    const daily = M.dailyExpenseAvg(entries, today, 30);
    const daysToPay = M.daysToPayday(today);

    const after = bal.family - amount;
    const runway = daily > 0 ? Math.floor(after / daily) : 999;
    const willRunOut = after < 0 || runway < daysToPay;

    const safeDaily = daysToPay > 0 ? after / daysToPay : 0;

    /* 方案一：分两个月 */
    const halfNow = Math.round(amount / 2);
    const afterHalf = bal.family - halfNow;
    const runwayHalf = daily > 0 ? Math.floor(afterHalf / daily) : 999;

    /* 方案二：买后收敛 */
    const needCut = Math.max(0, daily - safeDaily);

    return {
      amount,
      before: Math.round(bal.family),
      after: Math.round(after),
      daily: Math.round(daily),
      runway, daysToPay, willRunOut,
      safeDaily: Math.round(safeDaily),
      halfNow, afterHalf: Math.round(afterHalf), runwayHalf,
      needCut: Math.round(needCut),
      own: Math.round(bal.own),
      ownEnough: bal.own >= amount
    };
  };

  /* ---------------- 多重假设：如果我省着花 ---------------- */
  E.shrink = function (entries, today, budget) {
    const from = U.addDays(today, -89);
    const win = M.inRange(entries, from, today).filter(e => e.direction === 'out');
    const cats = M.categoryTotals(entries, from, today);
    const ctl = M.controlIndex(entries, { today, budgetMonthly: budget ? budget.total : 2300 });

    /* 三个可调项：订阅、小额高频（饮品/外卖）、娱乐 */
    const subs = E.subscriptions(entries, today);
    const subMonthly = subs.reduce((a, b) => a + b.monthly, 0);

    const small = win.filter(e => e.amount <= 30 && (e.category === 'food' || e.category === 'fun'));
    const smallMonthly = small.reduce((s, e) => s + e.amount, 0) / 3;

    const fun = cats.find(c => c.id === 'fun');
    const funMonthly = fun ? fun.amount / 3 : 0;

    const planSub = Math.round(subMonthly * 0.55);   // 退掉一半订阅
    const planSmall = Math.round(smallMonthly * 0.4); // 小额高频砍 40%
    const planFun = Math.round(funMonthly * 0.3);     // 娱乐砍 30%

    const total = planSub + planSmall + planFun;
    const income = win.filter(e => e.direction === 'in').reduce((s, e) => s + e.amount, 0) / 3;
    const expense = win.filter(e => e.direction === 'out').reduce((s, e) => s + e.amount, 0) / 3;
    const saveRateNow = income > 0 ? (income - expense) / income : 0;
    const saveRateAfter = income > 0 ? (income - (expense - total)) / income : 0;

    /* 指数变化：粗略按储蓄率提升重算 */
    const scoreAfter = Math.min(100, ctl.score + Math.round(total / Math.max(1, income) * 100 * 0.8));

    return {
      items: [
        { key: 'sub', icon: '🔔', name: '订阅砍掉一半', amount: planSub, detail: '现在 ¥' + Math.round(subMonthly) + '/月，留常用的' },
        { key: 'small', icon: '🥤', name: '小额高频砍 40%', amount: planSmall, detail: '近 90 天小额支出 ¥' + Math.round(smallMonthly * 3) },
        { key: 'fun', icon: '🎮', name: '娱乐支出砍 30%', amount: planFun, detail: '现在约 ¥' + Math.round(funMonthly) + '/月' }
      ],
      total: Math.round(total),
      monthlySave: Math.round(total),
      yearSave: Math.round(total * 12),
      saveRateNow: Math.round(saveRateNow * 100),
      saveRateAfter: Math.round(saveRateAfter * 100),
      scoreNow: ctl.score, scoreAfter
    };
  };

  /* ---------------- 平行人生：两年后的两条曲线 ---------------- */
  E.parallel = function (entries, today, budget, months) {
    months = months || 24;
    const bal = M.balances(entries);
    const from = U.addDays(today, -179);
    const win = M.inRange(entries, from, today);
    const income = win.filter(e => e.direction === 'in').reduce((s, e) => s + e.amount, 0) / 6;
    const expense = win.filter(e => e.direction === 'out').reduce((s, e) => s + e.amount, 0) / 6;
    const avgSave = income - expense;
    const ctl = M.controlIndex(entries, { today, budgetMonthly: budget ? budget.total : 2300 });

    const cut = Math.min(300, Math.max(0, Math.round(expense * 0.18)));
    const nowEnd = Math.round(bal.own + avgSave * months);
    const betterEnd = Math.round(bal.own + (avgSave + cut) * months);

    return {
      months,
      avgIncome: Math.round(income),
      avgExpense: Math.round(expense),
      avgSave: Math.round(avgSave),
      cut,
      nowEnd, betterEnd,
      diff: betterEnd - nowEnd,
      scoreNow: ctl.score,
      scoreBetter: Math.min(99, ctl.score + 12),
      levelNow: ctl.level,
      levelBetter: Math.min(100, ctl.score + 12) >= 80 ? '自主期' : ctl.level,
      supportNow: Math.round(income * months),
      supportBetter: Math.round(Math.max(0, income - cut) * months)
    };
  };

  E.ask = function (text, opt) {
    const q = String(text || '').trim();
    if (!q) return null;

    const entries = opt.entries, today = opt.today, budget = opt.budget;
    const budgetMonthly = budget ? budget.total : 2300;
    const bal = M.balances(entries);
    const gap = M.gapForecast(entries, today, budgetMonthly);
    const ctl = M.controlIndex(entries, { today, budgetMonthly });
    const month = M.monthTotals(entries, U.monthKey(today));
    const bp = budget ? M.budgetProgress(entries, budget, today) : null;
    const subs = E.subscriptions(entries, today);
    const subMonthly = subs.reduce((a, b) => a + b.monthly, 0);
    const health = M.health(entries, today);
    const monthDaily = month.expense / Math.max(1, U.parse(today).getDate());

    const RULES = [
      /* ---- ① 资金推演：买之前先看影响 ---- */
      {
        re: /买|想买|购物|能买|算算|推演|值得吗/,
        make: () => {
          const got = pickAmount(q);
          const amount = got || 1500;
          const w = E.whatIf(amount, entries, today, budget);
          const head = got ? '' : '你没说金额，我先按 ¥1,500 算一遍：\n\n';
          if (!w.willRunOut) {
            return {
              title: '买了没问题',
              body: head + '本周期余额 ¥' + w.before + ' → **¥' + w.after + '**。' +
                '按你现在日均 ¥' + w.daily + ' 算，还能撑 ' + w.runway + ' 天，' +
                '离发生活费还有 ' + w.daysToPay + ' 天，**够**。',
              stats: [
                { k: '余额变化', v: '−¥' + w.amount },
                { k: '买完剩', v: '¥' + w.after },
                { k: '能撑', v: w.runway + ' 天' }
              ],
              actions: [
                { label: '记一笔', to: 'youth.entry' },
                { label: '看看这个周期的节奏', to: 'youth.ledger', params: { view: 'cycle' } }
              ]
            };
          }
          return {
            title: '买了会有点紧',
            body: head + '本周期余额 ¥' + w.before + ' → **¥' + w.after + '**。' +
              '按日均 ¥' + w.daily + ' 算只能撑 ' + w.runway + ' 天，' +
              '而离发生活费还有 ' + w.daysToPay + ' 天 —— **会断粮**。\n\n' +
              '三个可行方案：\n' +
              '· **分两个月**：这个月买 ¥' + w.halfNow + '，余额剩 ¥' + w.afterHalf + '，能撑 ' + w.runwayHalf + ' 天\n' +
              '· **买完收敛**：日均从 ¥' + w.daily + ' 压到 ¥' + w.safeDaily + '（每天少花 ¥' + w.needCut + '）\n' +
              (w.ownEnough ? '· **动用自有资金**：奖学金那 ¥' + w.own + ' 拿 ¥' + w.amount + '，不动生活费\n' : ''),
            stats: [
              { k: '买完剩', v: '¥' + w.after },
              { k: '能撑', v: w.runway + ' 天' },
              { k: '日均安全线', v: '¥' + w.safeDaily }
            ],
            actions: [
              { label: '看本周期节奏', to: 'youth.ledger', params: { view: 'cycle' } },
              { label: '调整预算', to: 'youth.budget' }
            ]
          };
        }
      },

      /* ---- ② 多重假设：如果我省着花 ---- */
      {
        re: /省着花|如果省|少花|省点|砍掉|缩减|不点外卖/,
        make: () => {
          const s = E.shrink(entries, today, budget);
          return {
            title: '砍掉这三项，每月省 ¥' + s.total,
            body: s.items.map((i, n) => (n + 1) + '. ' + i.icon + ' **' + i.name + '** —— 每月省 ¥' + i.amount +
              '（' + i.detail + '）').join('\n') + '\n\n' +
              '效果：结余率 **' + s.saveRateNow + '% → ' + s.saveRateAfter + '%**，' +
              '掌控指数 **' + s.scoreNow + ' → ' + s.scoreAfter + '**。\n' +
              '一年下来是 **¥' + s.yearSave + '**。',
            stats: [
              { k: '每月省', v: '¥' + s.total },
              { k: '结余率', v: s.saveRateNow + '%→' + s.saveRateAfter + '%' },
              { k: '掌控指数', v: s.scoreNow + '→' + s.scoreAfter }
            ],
            actions: [
              { label: '按这个改预算', to: 'youth.budget' },
              { label: '管理订阅', to: 'youth.subs' }
            ]
          };
        }
      },

      /* ---- ② 计划生成：一句话 → 一套可执行方案 ---- */
      {
        re: /规划一下|帮我规划|帮我安排|想去做|打算去|寒假|暑假|计划去|排个方案|怎么安排/,
        make: () => {
          const p = E.makePlan(q, entries, today, budget);
          const body =
            '**预算 ¥' + p.total + '**（' + p.scene.name + ' · ' + p.qty + ' ' + p.scene.unit + '）\n' +
            p.items.map(i => '· ' + i.name + ' ¥' + i.amount).join('\n') + '\n\n' +
            '**钱从哪来**\n' +
            '· 现有可动用 ¥' + p.available + '（生活费结余 ¥' + p.familyBal + ' + 自有资金 ¥' + p.ownBal + '）\n' +
            (p.gap <= 0
              ? '· **现有资金就够了** ✅\n'
              : '· 还差 **¥' + p.gap + '**，按你月均结余 ¥' + p.avgSave +
              (p.daysCover ? '，光靠结余要 ' + p.daysCover + ' 个月' : '') + '\n' +
              '· 建议分 **3 个月** 攒：每月多存 **¥' + p.perMonth + '**' +
              (p.feasible ? '（做得到 ✅）' : '（比现在多存 ¥' + (p.perMonth - p.avgSave) + '，得收一收 ⚠️）') + '\n') +
            (p.gap > 0 ? '\n你账本里有 ¥' + p.canCut + '/月 的可压缩空间，够覆盖这个数。' : '');

          return {
            title: p.scene.icon + ' ' + p.scene.name + ' · ¥' + p.total,
            body: body,
            stats: [
              { k: '总额', v: '¥' + p.total },
              { k: '现有可动用', v: '¥' + p.available },
              { k: p.gap > 0 ? '缺口' : '状态', v: p.gap > 0 ? '¥' + p.gap : '够 ✅' }
            ],
            actions: [
              { label: '设成储蓄目标', to: 'youth.savings' },
              { label: '看看怎么省出来', to: 'youth.ai', params: {} },
              { label: '调整预算', to: 'youth.budget' }
            ]
          };
        }
      },

      /* ---- ③ 消费人格：从账本里看出习惯 ---- */
      {
        re: /怎么花钱|什么的人|消费习惯|人格|画像|了解自己|花钱风格/,
        make: () => {
          const p = E.persona(entries, today);
          if (!p) return { title: '数据还不够', body: '再记一段时间，我才能看出你的消费习惯。', actions: [{ label: '去记一笔', to: 'youth.entry' }] };
          const styleText = p.style === 'weekend'
            ? '你的钱 **' + p.wkShare + '% 花在周末**，周末日均 ¥' + p.wkAvg + '，是工作日的 ' + p.wkRatio + '%。'
            : p.style === 'weekday'
              ? '你 **工作日花得比周末多**，工作日日均 ¥' + p.wdAvg + '，周末 ¥' + p.wkAvg + '。'
              : '你周末和工作日花得差不多，日均 ¥' + p.wkAvg + ' / ¥' + p.wdAvg + '。';
          return {
            title: '你是「小额无感」型',
            body: '从近 90 天账本里看到三个模式：\n\n' +
              '**① 时间节奏** —— ' + styleText + '\n\n' +
              '**② 小额不设防** —— 近 90 天有 **' + p.smallCount + ' 笔**在 ¥30 以下，占笔数的 ' +
              p.smallShare + '%，合计 ¥' + p.smallSum + '。\n' +
              '超过 ¥300 的支出只有 ' + p.bigCount + ' 笔 —— **你不是花大钱的人，是碎钱漏得多**。\n\n' +
              '**③ 最常出现的地方** —— ' + (p.topRepeat ? p.topRepeat.name + '（' + p.topRepeat.n + ' 次）' : '—') +
              (p.topMoney && p.topMoney.name !== (p.topRepeat || {}).name
                ? '，花钱最多的是 ' + p.topMoney.name + '（¥' + Math.round(p.topMoney.sum) + '）' : '') + '。\n\n' +
              '**结论**：管住 30 块以下的支出，比管住任何一笔大额都有效。',
            stats: [
              { k: '小额笔数', v: p.smallCount + ' 笔' },
              { k: '小额合计', v: '¥' + p.smallSum },
              { k: '大额笔数', v: p.bigCount + ' 笔' }
            ],
            actions: [
              { label: '看看钱漏在哪', to: 'youth.ledger', params: { view: 'cycle' } },
              { label: '设个限额', to: 'youth.budget' }
            ]
          };
        }
      },

      /* ---- ④ 平行人生：两年后的两条曲线 ---- */
      {
        re: /照这样|两年后|以后会|将来|毕业时|会变成什么样|长期/,
        make: () => {
          const p = E.parallel(entries, today, budget, 24);
          return {
            title: '两年后的两条曲线',
            body: '按你近 6 个月的真实数据（月均收入 ¥' + U.won(p.avgIncome) + '、支出 ¥' + U.won(p.avgExpense) +
              '、结余 ¥' + U.won(Math.abs(p.avgSave)) + '）往后推 24 个月：\n\n' +
              '**保持现状** → 自有资金 **¥' + U.won(p.nowEnd) + '**，掌控指数 ' + p.scoreNow + '（' + p.levelNow + '）\n' +
              '**每月多存 ¥' + p.cut + '** → 自有资金 **¥' + U.won(p.betterEnd) + '**，掌控指数 ' + p.scoreBetter + '（' + p.levelBetter + '）\n\n' +
              '差的 **¥' + U.won(p.diff) + '** —— 差不多是毕业后几个月的房租押金。\n' +
              '而每月多存 ¥' + p.cut + '，摊到每天只是 **¥' + Math.round(p.cut / 30) + '**。',
            stats: [
              { k: '保持现状', v: '¥' + U.won(p.nowEnd) },
              { k: '每月多存 ¥' + p.cut, v: '¥' + U.won(p.betterEnd) },
              { k: '差额', v: '¥' + U.won(p.diff) }
            ],
            actions: [
              { label: '看看怎么做到', to: 'youth.ai' },
              { label: '设成储蓄目标', to: 'youth.savings' }
            ]
          };
        }
      },

      /* ---- ④ 目标倒推：想存一笔钱 ---- */
      {
        re: /存够|存下|攒够|存钱|攒钱|储蓄|想存|存一笔/,
        make: () => {
          const got = pickAmount(q);
          const target = got || 5000;
          const from = U.addDays(today, -179);
          const win = M.inRange(entries, from, today);
          const income = win.filter(e => e.direction === 'in').reduce((s, e) => s + e.amount, 0) / 6;
          const expense = win.filter(e => e.direction === 'out').reduce((s, e) => s + e.amount, 0) / 6;
          const avgSave = income - expense;
          const months = avgSave > 0 ? Math.ceil(target / avgSave) : null;
          const plan12 = Math.ceil(target / 12);
          const feasible12 = avgSave >= plan12;
          const head = got ? '' : '你没说金额，我先按 ¥5,000 算一遍：\n\n';

          if (!months) {
            return {
              title: '现在还没有结余能力',
              body: head + '近 6 个月你的月均结余是 ¥' + Math.round(avgSave) +
                ' —— 收入和支出基本打平。先把结余做正，再谈存钱。',
              stats: [
                { k: '月均收入', v: '¥' + Math.round(income) },
                { k: '月均支出', v: '¥' + Math.round(expense) },
                { k: '月均结余', v: '¥' + Math.round(avgSave) }
              ],
              actions: [{ label: '看看哪里能省', to: 'youth.ai' }]
            };
          }

          return {
            title: '目标 ¥' + target + '：按现在的节奏要 ' + months + ' 个月',
            body: head +
              '你近 6 个月月均收入 ¥' + Math.round(income) + '、支出 ¥' + Math.round(expense) +
              '，**月均结余 ¥' + Math.round(avgSave) + '**。\n\n' +
              '· 照现在这样存：需要 **' + months + ' 个月**\n' +
              '· 想在 **12 个月内**达成：每月要存 **¥' + plan12 + '**，' +
              (feasible12 ? '你现在的结余就够 ✅' : '比现在多存 ¥' + (plan12 - Math.round(avgSave)) + '，得收一收 ⚠️') + '\n\n' +
              '**建议节奏**：发生活费当天先转走，而不是月底剩多少存多少。' +
              '按你的历史，月末平均只剩 ¥' + Math.round(Math.max(0, avgSave * 0.3)) + '。',
            stats: [
              { k: '月均结余', v: '¥' + Math.round(avgSave) },
              { k: '需要', v: months + ' 个月' },
              { k: '12个月方案', v: '¥' + plan12 + '/月' }
            ],
            actions: [
              { label: '设成储蓄目标', to: 'youth.savings' },
              { label: '看看怎么省出来', to: 'youth.ai' }
            ]
          };
        }
      },

      /* ---- ⑤ 人情往来 ---- */
      {
        re: /人情|随礼|回礼|礼物|红包|份子|往来/,
        make: () => {
          const ov = opt.favorOverview ? opt.favorOverview() : null;
          if (!ov || (!ov.outCount && !ov.inCount)) {
            return {
              title: '还没有人情记录',
              body: '记下收到的礼物、随过的礼，我才能帮你跟进回礼。' +
                '比如「张伟生日送了 ¥200」「收了李娜的结婚红包 ¥500」。',
              actions: [{ label: '去记一笔人情', to: 'youth.favorNew' }]
            };
          }
          const pending = ov.pending || [];
          return {
            title: pending.length ? '有 ' + pending.length + ' 件事该处理了' : '人情往来都是平的',
            body: '今年你**送出 ¥' + ov.outTotal + '**（' + ov.outCount + ' 次）、' +
              '**收到 ¥' + ov.inTotal + '**（' + ov.inCount + ' 次）。\n\n' +
              (pending.length
                ? pending.map(p => '· ' + p.icon + ' ' + p.text).join('\n')
                : '暂时没有需要跟进的。'),
            stats: [
              { k: '今年送出', v: '¥' + ov.outTotal },
              { k: '今年收到', v: '¥' + ov.inTotal },
              { k: '往来朋友', v: ov.peopleCount + ' 位' }
            ],
            actions: [{ label: '看人情往来', to: 'youth.favor' }]
          };
        }
      },

      /* ---- 兜底：原有的基础问题 ---- */
      {
        re: /够花|够不够|缺口|没钱|不够|撑得住|还能花|花到|透支/,
        make: () => gap.level === 'none'
          ? {
            title: '够花的',
            body: '按近 30 天的日均 ¥' + gap.daily + ' 算，到下次发放前需要 ¥' + U.won(gap.need) +
              '，你现在手上有 ¥' + U.won(gap.available) + '，能覆盖得住。',
            stats: [
              { k: '可用', v: '¥' + U.won(gap.available) },
              { k: '预计需要', v: '¥' + U.won(gap.need) },
              { k: '能撑', v: gap.runway + ' 天' }
            ],
            actions: [{ label: '看本周期节奏', to: 'youth.ledger', params: { view: 'cycle' } }]
          }
          : {
            title: gap.label + '缺口',
            body: '按近 30 天日均 ¥' + gap.daily + ' 算，到下次发放前需要 ¥' + U.won(gap.need) +
              '，你现在只有 ¥' + U.won(gap.available) + '，差 ¥' + U.won(gap.gap) + '。' +
              '离发放还有 ' + gap.daysToPay + ' 天，日均得压到 ¥' +
              U.won(Math.max(0, gap.available) / Math.max(1, gap.daysToPay)) + ' 以内。',
            stats: [
              { k: '缺口', v: '¥' + U.won(gap.gap) },
              { k: '日均可用', v: '¥' + U.won(Math.max(0, gap.available) / Math.max(1, gap.daysToPay)) },
              { k: '距发放', v: gap.daysToPay + ' 天' }
            ],
            actions: [
              { label: '看哪些能省', to: 'youth.ledger', params: { view: 'cycle' } },
              { label: '发起一次协商', to: 'youth.talk' }
            ]
          }
      },
      {
        re: /订阅|会员|扣费|自动续费/,
        make: () => ({
          title: '你订阅了 ' + subs.length + ' 项',
          body: '每月固定扣 ¥' + Math.round(subMonthly) + '，一年就是 ¥' + Math.round(subMonthly * 12) +
            '，约等于 ' + (monthDaily > 0 ? (subMonthly / monthDaily).toFixed(0) : '—') + ' 天的支出。' +
            (subs[0] ? '最近一笔是 ' + subs[0].name + '（' + subs[0].nextDate + '）。' : ''),
          stats: subs.slice(0, 3).map(s => ({ k: s.name, v: '¥' + s.amount })),
          actions: [{ label: '管理订阅', to: 'youth.subs' }]
        })
      },
      {
        re: /上个月|上月|复盘|花了多少|花了|支出多少/,
        make: () => {
          const mk = U.monthKey(U.addMonths(today, -1));
          const r = E.periodReview(entries, U.startOfMonth(mk + '-01'), U.endOfMonth(mk + '-01'), budget);
          const top = r.cats.filter(c => c.amount > 0)[0];
          return {
            title: mk + ' 花了 ¥' + Math.round(r.expense),
            body: '比上上个月' + (r.expenseDelta >= 0 ? '多' : '少') + '了 ' +
              Math.abs(Math.round(r.expenseDelta * 100)) + '%，结余率 ' + Math.round(r.saveRate * 100) + '%。' +
              '花得最多的是' + (top ? top.name + '（¥' + Math.round(top.amount) + '）' : '—') + '。',
            stats: [
              { k: '支出', v: '¥' + Math.round(r.expense) },
              { k: '结余', v: '¥' + Math.round(r.net) },
              { k: '日均', v: '¥' + U.won(r.avgPerDay) }
            ],
            actions: [{ label: '看完整复盘', to: 'youth.review', params: { month: mk } }]
          };
        }
      },
      {
        re: /开学|假期|寒暑假|求职|实习|毕业|场景|规划/,
        make: () => {
          const scenes = E.activeScenarios(today);
          const sc = scenes[0] || E.SCENARIOS[0];
          const plan = E.scenarioPlan(sc.id, entries, today, budget);
          return {
            title: sc.icon + ' ' + sc.name + '该这么安排',
            body: sc.hint + ' 按你现在的预算 ¥' + U.won(plan.base) + ' 拆开：' +
              plan.items.map(i => i.name + ' ¥' + i.amount).join('、') + '。',
            stats: plan.items.slice(0, 3).map(i => ({ k: i.name, v: '¥' + i.amount })),
            actions: [{ label: '生成完整方案', to: 'youth.scenario', params: { id: sc.id } }]
          };
        }
      },
      {
        re: /自己管钱|独立|自主|成长|掌控|进步|等级|差多远/,
        make: () => {
          const weak = ctl.dims.slice().sort((a, b) => a.score - b.score)[0];
          return {
            title: '你现在是' + ctl.level + '，' + ctl.score + ' 分',
            body: '离自主期还差 ' + Math.max(0, 80 - ctl.score) + ' 分。四个维度里' + weak.name +
              '最拖后腿（' + Math.round(weak.score) + ' 分）。',
            stats: ctl.dims.map(d => ({ k: d.name, v: String(Math.round(d.score)) })),
            actions: [
              { label: '看提升建议', to: 'youth.control' },
              { label: '做成长任务', to: 'youth.tasks' }
            ]
          };
        }
      },
      {
        re: /预算|超支|控制|省点|省着/,
        make: () => bp
          ? {
            title: bp.over ? '支出快于时间进度' : '节奏正常',
            body: '本月已用 ¥' + U.won(bp.spent) + ' / ¥' + U.won(bp.total) + '（' +
              Math.round(bp.ratio * 100) + '%），已过 ' + bp.passed + ' / ' + bp.totalDays + ' 天。' +
              (bp.over
                ? '按这个速度月底会超，日均得压到 ¥' +
                U.won(Math.max(0, bp.remaining) / Math.max(1, bp.totalDays - bp.passed)) + ' 以内。'
                : '剩余 ' + (bp.totalDays - bp.passed) + ' 天，日均可用 ¥' +
                U.won(Math.max(0, bp.remaining) / Math.max(1, bp.totalDays - bp.passed)) + '。'),
            stats: [
              { k: '已用', v: '¥' + U.won(bp.spent) },
              { k: '预算', v: '¥' + U.won(bp.total) },
              { k: '日均可用', v: '¥' + U.won(Math.max(0, bp.remaining) / Math.max(1, bp.totalDays - bp.passed)) }
            ],
            actions: [{ label: '调整预算', to: 'youth.budget' }]
          }
          : { title: '还没设预算', body: '设一次分类预算，我才能告诉你哪里该收一收。', actions: [{ label: '去设预算', to: 'youth.budget' }] }
      },
      {
        re: /攒钱|存钱|储蓄|存一笔/,
        make: () => ({
          title: '你一共有 ¥' + U.won(bal.total),
          body: '其中家庭支持金 ¥' + U.won(bal.family) + '、个人自有 ¥' + U.won(bal.own) +
            '。自有资金能撑 ' + (health.avgDaily > 0 ? Math.round(bal.own / health.avgDaily) : '—') +
            ' 天的支出。想存钱的话，建议发生活费当天先转出一笔，剩下的再花。',
          stats: [
            { k: '家庭支持金', v: '¥' + U.won(bal.family) },
            { k: '个人自有资金', v: '¥' + U.won(bal.own) }
          ],
          actions: [{ label: '设共同储蓄目标', to: 'youth.savings' }]
        })
      },
      {
        re: /协商|申请|要钱|开口|预支|怎么跟家里说/,
        make: () => ({
          title: '把话说明白，比开口要钱容易',
          body: '要一笔额外支持时，用模板填用途和金额就行——只发送约定信息，不附带任何消费流水。' +
            '也可以选预支，约定分几期归还，把「再要一次钱」变成一次对等的资金安排。',
          actions: [
            { label: '发起申请', to: 'youth.talk' },
            { label: '看边界话术', to: 'youth.scripts' }
          ]
        })
      },
      {
        re: /隐私|家人能看到|明细|范围|省心模式|授权/,
        make: () => ({
          title: '家人看不到你的单笔明细',
          body: '这是底层设计：明细在服务端就不会下发到支持人端，不是前端隐藏。' +
            '对方只能看到你按约定开放的宏观信息，范围由你在「省心模式」里定，改动要双方确认。',
          actions: [
            { label: '看权限自检', to: 'common.contracts' },
            { label: '改省心模式', to: 'youth.mode' }
          ]
        })
      }
    ];

    for (let i = 0; i < RULES.length; i++) {
      if (RULES[i].re.test(q)) return Object.assign({ question: q }, RULES[i].make());
    }

    /* 没命中：兜底 + 把当前最要紧的一条建议端上来 */
    const sugg = E.suggestions({ entries, today, budget });
    const top = sugg[0];
    return {
      question: q,
      title: '这句我暂时答不上来',
      body: top
        ? '不过你现在最该看的是这条 —— ' + top.title + '。' + top.body
        : '换种说法试试，或者问我「这个月还够花吗」这类关于你自己账本的问题。',
      actions: top ? top.options : [{ label: '去成长中心看看', to: 'youth.grow' }]
    };
  };

  /* ============================================================
     三级风险预警（产品文档 3.2.4）
     一级 低风险：超预算、消费节奏过快            → 仅提醒青年本人
     二级 中风险：大额非刚需、陌生平台大额支出     → 先提醒青年；24 小时无回应才通知家人，且只说"存在异常"，不给明细
     三级 高风险：诈骗、网贷、赌博类交易           → 立即通知双方；家人可申请紧急临时冻结

     两条铁律：
     ① 家人通知走 E.riskSupporterNotice()，只出等级和"存在异常"，**绝不带金额、商户、日期**
     ② 规则只输出事实，不做道德评判（"你在某某平台消费偏高"而不是"你乱花钱"）
     ============================================================ */

  E.RISK_LEVELS = [
    {
      id: 1, name: '一级 · 低风险', short: '一级', tone: 'warn', icon: '🟡',
      policy: '只提醒你本人，不通知家人。',
      lead: '只有你知道',
      windowH: 0, canFreeze: false
    },
    {
      id: 2, name: '二级 · 中风险', short: '二级', tone: 'danger', icon: '🟠',
      policy: '先提醒你。24 小时内没有回应，才同步家人「存在异常」，不含任何明细。',
      lead: '先给你 24 小时',
      windowH: 24, canFreeze: false
    },
    {
      id: 3, name: '三级 · 高风险', short: '三级', tone: 'danger', icon: '🔴',
      policy: '立即通知双方。家人可申请紧急临时冻结，24 小时内银行客服介入核实。',
      lead: '立即通知双方',
      windowH: 0, canFreeze: true
    }
  ];
  E.riskLevel = function (id) {
    return E.RISK_LEVELS.find(l => l.id === id) || E.RISK_LEVELS[0];
  };

  /* 敏感交易关键词。命中即三级 —— 这几类不是"花多了"，是"可能出事了" */
  const RISK_TAGS = [
    { id: 'loan', name: '网贷 / 借贷平台', icon: '💳', words: ['网贷', '分期还款', '消费金融', '小额贷', '信用付', '白条', '花呗', '借呗', '借款'] },
    { id: 'gamble', name: '赌博类交易', icon: '🎲', words: ['棋牌', '彩票', '投注', '竞猜', '博彩', '德州扑克', '百家乐', '时时彩'] },
    { id: 'brush', name: '刷单 / 垫付类', icon: '🪤', words: ['刷单', '代刷', '垫付', '兼职押金', '任务返现'] },
    { id: 'fraud', name: '疑似诈骗话术', icon: '☎️', words: ['解冻费', '保证金', '验证金', '安全账户', '客服退款', '转账手续费'] }
  ];

  /* 非刚需：这几类出现大额，才值得警觉。吃饭坐车看病不算 */
  const NON_ESSENTIAL = ['fun', 'shop', 'travel', 'other'];

  /** 一笔交易命中了哪类敏感词 */
  function riskTagOf(e) {
    const t = ((e.merchant || '') + ' ' + (e.title || '') + ' ' + (e.note || ''));
    for (let i = 0; i < RISK_TAGS.length; i++) {
      const tag = RISK_TAGS[i];
      for (let j = 0; j < tag.words.length; j++) {
        if (t.indexOf(tag.words[j]) >= 0) return { tag, word: tag.words[j] };
      }
    }
    return null;
  }
  E.riskTagOf = riskTagOf;
  E.RISK_TAGS = RISK_TAGS;

  /** 白名单命中：按关键词匹配商户/标题，命中就不触发（减少误报打扰） */
  function riskAllowed(e, whitelist) {
    if (!whitelist || !whitelist.length) return false;
    const t = ((e.merchant || '') + ' ' + (e.title || '') + ' ' + (e.note || ''));
    return whitelist.some(w => w && w.word && t.indexOf(w.word) >= 0);
  }
  E.riskAllowed = riskAllowed;

  /* 事件的去重键：用「规则 + 日期 + 金额 + 收款方」，不用账本条目 id。
     这样种子数据里手写的历史事件能和扫出来的对上号，重新生成数据也不会错位。 */
  function riskKey(rule, e, who) {
    return rule + '|' + e.date + '|' + Math.round(e.amount * 100) + '|' + (who || '');
  }
  E.riskKey = riskKey;

  /**
   * 扫描全量账本，产出「候选风险事件」（纯函数，不写库）
   * ctx = { entries, budget, today, whitelist }
   * 一笔账最多产出一个事件：命中多条规则时取等级最高的那条
   */
  E.riskScan = function (ctx) {
    const entries = ctx.entries || [];
    const budget = ctx.budget || {};
    const today = ctx.today;
    const whitelist = ctx.whitelist || [];
    const bTotal = Number(budget.total) || 2600;
    const cats = budget.categories || {};

    const out = [];
    const from90 = U.addDays(today, -89);
    const window = M.inRange(entries, from90, today);

    /* 常用商户基线：近 90 天出现 ≥ 2 次就算熟脸 */
    const freq = {};
    window.filter(e => e.direction === 'out').forEach(e => {
      const k = e.merchant || e.title || '';
      if (k) freq[k] = (freq[k] || 0) + 1;
    });

    /* ---------- 一、逐笔规则 ---------- */
    window.filter(e => e.direction === 'out').forEach(e => {
      if (riskAllowed(e, whitelist)) return;
      const who = e.merchant || e.title || '未知收款方';
      const tag = riskTagOf(e);
      const nonEss = NON_ESSENTIAL.indexOf(e.category) >= 0;
      const familiar = (freq[who] || 0) >= 2;

      /* 三级：敏感交易类型 */
      if (tag) {
        out.push({
          key: riskKey('sensitive', e, who),
          rule: 'sensitive', level: 3, subtype: tag.tag.id,
          entryId: e.id, amount: e.amount, date: e.date, merchant: who,
          title: '检测到' + tag.tag.name,
          detail: '「' + who + '」命中高风险商户特征（' + tag.word + '），这类交易常见于诈骗与非法借贷。',
          why: '金额 ¥' + U.won(e.amount) + ' · ' + U.ymdCN(e.date) +
            ' · 命中敏感词「' + tag.word + '」',
          evidence: [tag.tag.name]
        });
        return;
      }

      /* 二级：陌生平台 + 大额。既陌生又大，才值得惊动 */
      if (nonEss && !familiar && e.amount >= bTotal * 0.12) {
        out.push({
          key: riskKey('unknown', e, who),
          rule: 'unknown', level: 2, subtype: 'unknown',
          entryId: e.id, amount: e.amount, date: e.date, merchant: who,
          title: '陌生平台的大额支出',
          detail: '「' + who + '」在近 90 天里只出现过这一次，单笔 ¥' + U.won(e.amount) +
            '，占了月预算的 ' + Math.round(e.amount / bTotal * 100) + '%。',
          why: '单笔 ¥' + U.won(e.amount) + ' ≥ 月预算的 12%（¥' + U.won(bTotal * 0.12) +
            '）· 该收款方近 90 天仅出现 1 次',
          evidence: ['陌生收款方', '单笔占比 ' + Math.round(e.amount / bTotal * 100) + '%']
        });
        return;
      }

      /* 二级：大额非刚需 */
      if (nonEss && e.amount >= bTotal * 0.15) {
        out.push({
          key: riskKey('bigspend', e, who),
          rule: 'bigspend', level: 2, subtype: 'nonessential',
          entryId: e.id, amount: e.amount, date: e.date, merchant: who,
          title: '一笔非刚需的大额支出',
          detail: '「' + who + '」单笔 ¥' + U.won(e.amount) + '，属于非刚需类目，' +
            '占月预算的 ' + Math.round(e.amount / bTotal * 100) + '%。',
          why: '单笔 ¥' + U.won(e.amount) + ' ≥ 月预算的 15%（¥' + U.won(bTotal * 0.15) +
            '）· 类目属于非刚需',
          evidence: ['非刚需类目', '单笔占比 ' + Math.round(e.amount / bTotal * 100) + '%']
        });
      }
    });

    /* ---------- 二、周期规则（一级：只提醒本人） ---------- */
    const mKey = U.monthKey(today);
    const mOut = entries.filter(e => e.direction === 'out' && U.monthKey(e.date) === mKey);
    const mTotal = mOut.reduce((s, e) => s + e.amount, 0);

    /* 大类严重超预算 */
    LJ.CATEGORIES.forEach(c => {
      const b = Number(cats[c.id]) || 0;
      if (b <= 0) return;
      const spent = mOut.filter(e => e.category === c.id).reduce((s, e) => s + e.amount, 0);
      if (spent < b * 1.5) return;
      /* 白名单里的类目关键词整体跳过 —— 学费、报名这类是计划内的 */
      const rows = mOut.filter(e => e.category === c.id);
      if (rows.length && rows.every(e => riskAllowed(e, whitelist))) return;
      out.push({
        key: 'overcat|' + mKey + '|' + c.id,
        rule: 'overcat', level: 1, subtype: 'overcat',
        date: today, amount: Math.round(spent), merchant: c.name,
        title: '「' + c.name + '」超出了预算',
        detail: '本月「' + c.name + '」花了 ¥' + U.won(spent) + '，预算是 ¥' + U.won(b) +
          '，已经到 ' + Math.round(spent / b * 100) + '%。',
        why: '分类实付 ¥' + U.won(spent) + ' ≥ 预算的 150%（¥' + U.won(b * 1.5) + '）',
        evidence: [c.icon + ' ' + c.name, '超预算 ' + Math.round((spent / b - 1) * 100) + '%']
      });
    });

    /* 本月总额超预算 */
    if (bTotal > 0 && mTotal > bTotal) {
      out.push({
        key: 'overmonth|' + mKey,
        rule: 'overmonth', level: 1, subtype: 'overmonth',
        date: today, amount: Math.round(mTotal), merchant: '本月合计',
        title: '本月已经超出预算',
        detail: '本月支出 ¥' + U.won(mTotal) + '，超出预算 ¥' + U.won(mTotal - bTotal) + '。',
        why: '本月支出 ¥' + U.won(mTotal) + ' > 预算 ¥' + U.won(bTotal),
        evidence: ['超预算 ¥' + U.won(mTotal - bTotal)]
      });
    }

    /* 消费节奏过快 */
    const d7 = M.dailyExpenseAvg(entries, today, 7);
    const pace = bTotal / 30;
    if (pace > 0 && d7 >= pace * 1.6) {
      out.push({
        key: 'fastpace|' + mKey + '|' + today,
        rule: 'fastpace', level: 1, subtype: 'fastpace',
        date: today, amount: Math.round(d7 * 7), merchant: '近 7 天',
        title: '这几天的花钱节奏偏快',
        detail: '近 7 天日均 ¥' + U.won(d7) + '，是预算日均（¥' + U.won(pace) + '）的 ' +
          (d7 / pace).toFixed(1) + ' 倍。',
        why: '近 7 天日均 ¥' + U.won(d7) + ' ≥ 预算日均的 1.6 倍（¥' + U.won(pace * 1.6) + '）',
        evidence: ['近 7 天日均 ¥' + U.won(d7), '预算日均 ¥' + U.won(pace)]
      });
    }

    return out;
  };

  /**
   * 家人会收到什么 —— 这是整套机制最要紧的一段
   * 只出「等级 + 存在异常 + 建议动作」，**不带金额、不带商户、不带日期**
   * 一级事件返回 null：家人完全不知道
   */
  E.riskSupporterNotice = function (ev) {
    if (!ev || ev.level < 2) return null;
    const lv = E.riskLevel(ev.level);
    if (ev.level === 3) {
      return {
        level: 3, title: '三级风险预警',
        body: '检测到一笔高风险交易类型，涉及资金安全，建议立即与孩子沟通。' +
          '本提示不含金额与交易明细；如需进一步保护，可申请紧急临时冻结。',
        action: '查看风险说明'
      };
    }
    return {
      level: 2, title: '二级风险提示',
      body: '检测到近期可能存在异常支出，建议找个合适的时间与孩子聊聊。' +
        '本提示不含金额与交易明细。',
      action: '看看怎么说'
    };
  };

  /** 到期该升级的二级事件（纯函数）：24 小时无回应才通知家人
      注意 deadline 是 ISO 字符串，必须先 Date.parse 成数字再比 ——
      拿数字直接跟字符串比会得到 NaN，比较恒为假，二级就永远不会升级。 */
  E.riskEscalations = function (events, nowMs) {
    return (events || []).filter(ev =>
      ev && ev.level === 2 && ev.status === 'pending_parent' &&
      ev.deadline && nowMs >= Date.parse(ev.deadline)
    );
  };

  /* ============================================================
     日常消费模拟器
     种子数据和时间机器共用同一套商户/金额/概率表。
     原来这些表只活在 seed.js 里，所以"快进时间"只会发生活费和扣订阅，
     **不会产生任何日常消费** —— 快进三个月后账本只剩收入，
     日均支出掉到个位数，掌控指数和假期复盘全部失真。
     放到 engine 里，两边读同一份。
     ============================================================ */
  E.MERCH = {
    food: ['第一食堂', '第三食堂', '美团外卖', '饿了么', '瑞幸咖啡', '蜜雪冰城', '沙县小吃', '罗森便利店'],
    traffic: ['地铁 2 号线', '公交 12 路', '哈啰单车', '滴滴出行', '12306 火车票'],
    study: ['教材书店', '文印店', '知网充值', '在线网课', '考证报名'],
    sport: ['操场跑步', '羽毛球馆', '游泳馆', 'Keep 会员', '篮球场', '运动鞋'],
    shop: ['淘宝', '京东', '优衣库', '名创优品', '拼多多', '无印良品'],
    travel: ['携程机票', '高铁票', '青旅住宿', '景区门票', '民宿'],
    fun: ['万达影城', '密室逃脱', '剧本杀', 'Steam', 'KTV', 'livehouse'],
    sub: ['Spotify', 'ChatGPT Plus', '百度网盘'],
    daily: ['永辉超市', '屈臣氏', '中国移动', '菜鸟驿站', '理发店', '洗衣房'],
    medical: ['校医院', '药房', '牙科诊所', '体检'],
    favor: ['同学生日礼物', '室友聚餐', '随礼', '朋友乔迁'],
    /* ★ 商户名别用「其他」这种分类用语：它会和支持人端的大类名撞车，
       既不像真商户，也会让"父母侧不含商户名"这条断言无谓地误报
       （探针按商户名全表比对页面文本，撞一次就红一次）。 */
    other: ['杂项支出', '临时应急', '日用杂货']
  };
  E.RANGE = {
    food: [8, 34], traffic: [2, 26], study: [20, 180],
    sport: [12, 90], shop: [35, 260], travel: [180, 900],
    fun: [25, 150], daily: [12, 90], medical: [30, 260],
    favor: [50, 300], other: [10, 80]
  };
  /** 一天内可能发生的消费概率 */
  E.CHANCE = {
    food: 0.95, traffic: 0.34, fun: 0.075, daily: 0.16, study: 0.035,
    sport: 0.07, shop: 0.045, travel: 0.007, medical: 0.015,
    favor: 0.022, other: 0.025
  };
  /** 后 6 个分类的金额区间刻意压小：它们是为了让结构页有内容，
      不是把支出顶到天花板 */
  E.RANGE2 = {
    sport: [18, 70], shop: [35, 150], travel: [160, 420],
    medical: [25, 110], favor: [40, 160], other: [10, 55]
  };

  /** 日期 → 稳定的随机种子。同一天永远生成同一批消费，重复调用不会翻倍 */
  function dateSeed(date) {
    let h = 20260101;
    for (let i = 0; i < date.length; i++) h = (h * 131 + date.charCodeAt(i)) >>> 0;
    return h;
  }

  /**
   * 模拟 [from, to] 之间的日常消费（纯函数，不写库）
   * skipDates：已经有日常消费的日期集合，跳过不重复生成
   * opt.salt：随机种偏移 —— 多子女时每个孩子的消费必须不一样，否则两个人账本一模一样
   * opt.scale：金额缩放 —— 低年级花得少一点
   * 返回的每行都已带上 date/amount/category/merchant/fundingSource，
   * 调用方补 id / userId / source 后直接入库。
   */
  E.simulateDays = function (from, to, skipDates, opt) {
    opt = opt || {};
    const salt = Number(opt.salt) || 0;
    const scale = Number(opt.scale) || 1;
    const rows = [];
    let cur = from;
    let guard = 0;
    while (cur <= to && guard++ < 2200) {
      const date = cur;
      cur = U.addDays(cur, 1);
      if (skipDates && skipDates[date]) continue;

      const r = U.rng(dateSeed(date) + salt);
      const r2 = U.rng(dateSeed(date) + 7 + salt);
      const d = U.parse(date);
      const dow = d.getDay();
      const day = d.getDate();
      const push = (category, merchant, amount) => rows.push({
        date: date, amount: Math.max(1, Math.round(amount * scale)),
        direction: 'out', category: category,
        title: null, merchant: merchant, note: '',
        fundingSource: 'family', source: 'sim'
      });

      const M = E.MERCH, RG = E.RANGE, C = E.CHANCE, R2 = E.RANGE2;
      if (r() < C.food) {
        push('food', U.pick(M.food, r), U.int(RG.food[0], RG.food[1], r));
        if (r() < 0.40) push('food', U.pick(['美团外卖', '饿了么', '蜜雪冰城'], r), U.int(10, 24, r));
      }
      if (r() < C.traffic) push('traffic', U.pick(M.traffic, r), U.int(RG.traffic[0], RG.traffic[1], r));
      if (r() < C.fun) push('fun', U.pick(M.fun, r), U.int(RG.fun[0], RG.fun[1], r));
      if (r() < C.daily) push('daily', U.pick(M.daily, r), U.int(RG.daily[0], RG.daily[1], r));
      if (r() < C.study) push('study', U.pick(M.study, r), U.int(RG.study[0], RG.study[1], r));
      if (r2() < C.sport) push('sport', U.pick(M.sport, r2), U.int(R2.sport[0], R2.sport[1], r2));
      if (r2() < C.shop) push('shop', U.pick(M.shop, r2), U.int(R2.shop[0], R2.shop[1], r2));
      if (r2() < C.travel) push('travel', U.pick(M.travel, r2), U.int(R2.travel[0], R2.travel[1], r2));
      if (r2() < C.medical) push('medical', U.pick(M.medical, r2), U.int(R2.medical[0], R2.medical[1], r2));
      if (r2() < C.favor) push('favor', U.pick(M.favor, r2), U.int(R2.favor[0], R2.favor[1], r2));
      if (r2() < C.other) push('other', U.pick(M.other, r2), U.int(R2.other[0], R2.other[1], r2));

      /* 周末出门多，给一点结构性差异，别每天一个样 */
      if ((dow === 6 || dow === 0) && r() < 0.35) {
        push('fun', U.pick(M.fun, r), U.int(RG.fun[0], RG.fun[1], r));
      }
      /* 每月一笔计划外的大件。真实账本的结构不可能只有八块十块的小额消费 ——
         少了这几笔，日均会掉到 ¥55 左右，结构和种子那条 £94 的线对不上。 */
      if (day === 7) {
        const BIG = [
          ['study', '教材书店', 120, 320], ['daily', '换季衣服', 150, 420],
          ['shop', '数码配件', 90, 310], ['fun', '周末短途', 220, 620],
          ['daily', '冬装', 180, 460], ['study', '考证报名', 300, 520],
          ['traffic', '回家的高铁票', 120, 360], ['favor', '同学生日礼物', 80, 260]
        ];
        const pick = U.pick(BIG, r);
        push(pick[0], pick[1], U.int(pick[2], pick[3], r));
      }
      /* 医疗 / 其他概率太低，一个月常常一笔都没有，结构页会看不到它们 */
      if (day === 16) push('medical', U.pick(M.medical, r2), U.int(30, 90, r2));
      if (day === 26) push('other', U.pick(M.other, r2), U.int(15, 45, r2));

      /* 偶尔用自有资金付（奖学金 / 红包） */
      if (rows.length && r() < 0.12) rows[rows.length - 1].fundingSource = 'own';
    }
    return rows;
  };

  /* ============================================================
     生活费方案（产品文档 3.5.3 寒暑假调整 / 3.5.5 毕业过渡）
     一个方案 = 一张 lifePlan 记录。发放金额全部由纯函数算出来，
     账本、预览表、发放记录读的是同一个函数，不会各说各话。
     ============================================================ */

  E.LIFE_PLAN_MODES = [
    {
      id: 'keep', name: '维持不变', icon: '➖',
      desc: '假期照常发，不调整',
      preview: base => '每月 ¥' + U.won(base)
    },
    {
      id: 'half', name: '减半', icon: '➗',
      desc: '假期吃住在家，开销本来就少',
      preview: base => '每月 ¥' + U.won(base / 2)
    },
    {
      id: 'pause', name: '暂停', icon: '⏸',
      desc: '假期由家里直接负担，不另发生活费',
      preview: () => '每月 ¥0，假期期间不发放'
    },
    {
      id: 'lump', name: '一次性发放', icon: '📦',
      desc: '整个假期的钱一次给完，由你自己安排 —— 最考验自主管理',
      preview: base => '假期首月一次发完整期，之后每月 ¥0'
    }
  ];
  E.lifePlanMode = function (id) { return E.LIFE_PLAN_MODES.find(m => m.id === id) || E.LIFE_PLAN_MODES[0]; };

  E.LIFE_PLAN_KINDS = [
    { id: 'holiday', name: '寒暑假调整', icon: '🏖', desc: '假期期间的生活费怎么发' },
    { id: 'taper', name: '毕业过渡递减', icon: '🎓', desc: '按月递减，直到完全自立' }
  ];

  /** 方案覆盖的整月列表（用于预览发放表） */
  E.planMonths = function (plan) {
    if (!plan) return [];
    if (plan.kind === 'taper') {
      const out = [];
      for (let i = 0; i < (plan.months || 6); i++) out.push(U.addMonths(plan.startMonth + '-01', i).slice(0, 7));
      return out;
    }
    /* 假期：from~to 之间跨到的所有月份 */
    const out = [];
    let cur = U.startOfMonth(plan.from);
    const last = U.startOfMonth(plan.to);
    let guard = 0;
    while (cur <= last && guard++ < 24) { out.push(U.monthKey(cur)); cur = U.addMonths(cur, 1); }
    return out;
  };

  /**
   * 某个方案在某月发多少（纯函数）
   * 递减：第 i 月发 base × (months - 1 - i) / months，
   * 所以从略低于全额的第一个月起步，第 months 月正好发到 0 —— "递减到自立"。
   * 别写成 (months - i) / months：那样首月发全额、末月还剩 1/n，永远降不到 0。
   */
  E.planAmount = function (plan, monthKey) {
    if (!plan) return null;
    const base = Number(plan.base) || 0;
    const months = E.planMonths(plan);
    const i = months.indexOf(monthKey);
    if (i < 0) return null;

    if (plan.kind === 'taper') {
      const n = plan.months || 6;
      return Math.round(base * (n - 1 - i) / n);
    }
    switch (plan.mode) {
      case 'half': return Math.round(base / 2);
      case 'pause': return 0;
      case 'lump': return i === 0 ? base * months.length : 0;
      default: return base;
    }
  };

  /** 逐月发放表（支持人端发起前要看的那张表） */
  E.planSchedule = function (plan) {
    return E.planMonths(plan).map(mk => ({
      month: mk,
      amount: E.planAmount(plan, mk),
      /* 只发一部分的月份标出来，方便一眼看出哪几个月是"半给" */
      tag: plan.kind === 'taper' ? '递减' : (E.planAmount(plan, mk) === 0 ? '不发' : '')
    }));
  };

  /** 方案覆盖的最后一个月之后，就算"跑完了" */
  E.planFinishedBefore = function (plan, monthKey) {
    const ms = E.planMonths(plan);
    if (!ms.length) return false;
    return monthKey > ms[ms.length - 1];
  };

  /**
   * 这个月实际该发多少：生效中的方案优先，没有就用基准
   * 递减计划跑完之后**不再恢复基准** —— 否则"毕业递减到 0"下个月又发回全款，
   * 等于毕业了还照领生活费，跟"过渡到自立"的立意正好相反。
   */
  E.supportFor = function (monthKey, plans, base) {
    const all = (plans || []).filter(p => p.status === 'active' || p.status === 'done');
    /* 递减方案优先级高于假期方案 —— 毕业了就不该再按假期算。
       排序后逐个试：第一个"覆盖到这个月"的方案说了算。 */
    const ordered = all.filter(p => p.status === 'active').sort((a, b) =>
      (a.kind === 'taper' ? 0 : 1) - (b.kind === 'taper' ? 0 : 1));
    for (let i = 0; i < ordered.length; i++) {
      const amt = E.planAmount(ordered[i], monthKey);
      if (amt !== null) return { amount: amt, plan: ordered[i], graduated: false };
    }
    /* 递减已经跑完 → 从此不再发放，这才叫自立 */
    const done = all.find(p => p.kind === 'taper' && E.planFinishedBefore(p, monthKey));
    if (done) return { amount: 0, plan: done, graduated: true };
    return { amount: Number(base) || 0, plan: null, graduated: false };
  };

  /** 方案摘要：一句话说清这个方案干什么 */
  E.planSummary = function (plan) {
    if (!plan) return '';
    if (plan.kind === 'taper') {
      const n = plan.months || 6;
      return n + ' 个月递减：¥' + U.won(plan.base) + ' → ¥0，' + n + ' 个月后完全自立';
    }
    const m = E.lifePlanMode(plan.mode);
    return U.ymdCN(plan.from) + ' – ' + U.ymdCN(plan.to) + ' · ' + m.name +
      '（' + m.preview(Number(plan.base) || 0) + '）';
  };

  /**
   * 假期结束后的消费复盘（文档 3.5.3 要求"假期结束自动生成消费复盘"）
   * 纯函数：只读账本，不写库。返回 null 表示假期还没结束、不该生成。
   */
  E.holidayReview = function (plan, entries, today) {
    if (!plan || plan.kind !== 'holiday' || today <= plan.to) return null;
    const list = (entries || []).filter(e => e.date >= plan.from && e.date <= plan.to);
    const out = list.filter(e => e.direction === 'out');
    const inn = list.filter(e => e.direction === 'in');
    const sum = a => Math.round(a.reduce((s, x) => s + x.amount, 0));
    const expense = sum(out), income = sum(inn);
    const days = Math.max(1, U.diffDays(plan.from, plan.to) + 1);

    /* 和假期前一个月比，看日均是不是真的降下来了 */
    const before = (entries || []).filter(e =>
      e.direction === 'out' && U.monthKey(e.date) === U.monthKey(U.addMonths(plan.from, -1)));
    const beforeAvg = before.length ? sum(before) / 30 : 0;
    const avg = expense / days;

    const byCat = {};
    out.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
    const cats = LJ.CATEGORIES.map(c => ({
      id: c.id, name: c.name, icon: c.icon, amount: Math.round(byCat[c.id] || 0)
    })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

    const notes = [];
    if (beforeAvg > 0) {
      const d = Math.round((avg - beforeAvg) / beforeAvg * 100);
      notes.push(d <= 0
        ? '假期日均 ¥' + U.won(avg) + '，比放假前低了 ' + Math.abs(d) + '%，生活费调整是有效的。'
        : '假期日均 ¥' + U.won(avg) + '，比放假前高了 ' + d + '%。假期出门多，也算正常。');
    }
    if (plan.mode === 'lump' && income > 0) {
      const spend = income > 0 ? expense / income : 0;
      notes.push('这次是一次性发放 ¥' + U.won(income) + '，你花掉了其中的 ' +
        Math.round(spend * 100) + '%。' +
        (spend <= 1 ? '整期没有超支。' : '超出了一点，下次可以把预算表拉长看。'));
    }
    if (cats.length) {
      notes.push('花得最多的是' + cats[0].icon + ' ' + cats[0].name +
        '（¥' + U.won(cats[0].amount) + '）。');
    }

    return {
      from: plan.from, to: plan.to, days: days,
      expense: expense, income: income, avg: Math.round(avg), beforeAvg: Math.round(beforeAvg),
      cats: cats, notes: notes
    };
  };

  /* ============================================================
     专项资金（产品文档 3.5.1 开学季 / 3.5.2 实习求职季 / 3.5.4 应急医疗）
     三件事共用一套机制：家长把钱转进一个「有用途、有期限」的池子，
     钱只能花在约定的那个大类上，**家长只看到用掉多少，看不到买了什么**。
     这和 3.4.4 的定向用途支持是同一件事，所以一起做。
     ============================================================ */
  E.FUND_KINDS = [
    {
      id: 'term', name: '开学季专项', icon: '🎒', category: 'study',
      desc: '学费、住宿费、教材与开学采购', range: [2000, 8000]
    },
    {
      id: 'job', name: '实习求职专项', icon: '💼', category: 'traffic',
      desc: '异地实习的房租通勤、求职的差旅与正装', range: [1000, 6000]
    },
    {
      id: 'medical', name: '应急医疗专项', icon: '🏥', category: 'medical',
      desc: '突发就医的应急保障。家人只看到用了多少，看不到病历和药品', range: [500, 5000]
    },
    {
      id: 'custom', name: '自定义专项', icon: '🎯', category: '',
      desc: '自己定名称和用途大类', range: [500, 10000]
    }
  ];
  E.fundKind = function (id) { return E.FUND_KINDS.find(k => k.id === id) || E.FUND_KINDS[3]; };

  /* 场景日历：到点了就主动推，不用用户自己想起来（3.5.1/3.5.2 要求"自动识别时间节点"） */
  E.FUND_SCENES = [
    {
      id: 'term_fall', name: '秋季开学季', months: [8, 9], kind: 'term', suggest: 3800,
      hint: '开学前后是全年支出最集中的一段：学费、住宿、教材、生活采购挤在一起。' +
        '把这一笔单独放一个池子，就不会跟日常开销混在一起看不清。'
    },
    {
      id: 'term_spring', name: '春季开学季', months: [2, 3], kind: 'term', suggest: 3200,
      hint: '春季学期开学，学费和教材是一次性支出，跟按月发的零花钱不是一回事。'
    },
    {
      id: 'job_fall', name: '秋招 / 求职季', months: [10, 11], kind: 'job', suggest: 2400,
      hint: '秋招的差旅、正装、证件照、体检都是集中支出，而且大部分省不掉。' +
        '开一个求职专项，钱花在哪一类有据可查。'
    },
    {
      id: 'job_spring', name: '春招 / 实习季', months: [3, 4, 5], kind: 'job', suggest: 2000,
      hint: '异地实习的房租和通勤是硬支出，先算清楚再决定去不去。'
    },
    {
      id: 'exam', name: '期末与寒假', months: [12, 1], kind: 'custom', suggest: 1200,
      hint: '年末考试周加寒假往返，交通和日用会集中花一笔。'
    }
  ];

  /** 当前处在哪个场景（没有就返回 null） */
  E.fundScene = function (today) {
    const m = Number(String(today).slice(5, 7));
    const hit = E.FUND_SCENES.filter(s => s.months.indexOf(m) >= 0);
    return hit.length ? hit[0] : null;
  };

  /**
   * 专项进度（纯函数）
   * 只统计挂在这个专项下的账：转入算进、支出算用。
   * 家人侧要靠这个函数拿进度，所以它**只输出金额和笔数** ——
   * 不返回 merchant、不返回 category 明细，也不返回任何一行的金额。
   */
  E.fundProgress = function (fund, entries, today) {
    const list = (entries || []).filter(e => e.fundId === fund.id);
    const inn = list.filter(e => e.direction === 'in');
    const out = list.filter(e => e.direction === 'out');
    const sum = a => Math.round(a.reduce((s, x) => s + x.amount, 0));
    const inTotal = sum(inn), used = sum(out);
    const target = Number(fund.target) || inTotal || 1;
    return {
      inTotal: inTotal, used: used, remaining: inTotal - used,
      count: out.length,
      /* 进度按计划金额算，家人看到的是"这个池子用了多少"，
         不是"孩子花了我多少钱" */
      ratio: target > 0 ? Math.min(1, used / target) : 0,
      target: target,
      over: used > inTotal,
      expired: !!(fund.periodEnd && today && fund.periodEnd < today)
    };
  };

  /** 这笔支出该不该从某个专项里扣：大类对得上、在有效期内 */
  E.fundFor = function (category, funds, today) {
    const hit = (funds || []).filter(f =>
      f.status === 'active' && f.category && f.category === category &&
      (!f.periodStart || f.periodStart <= today) &&
      (!f.periodEnd || f.periodEnd >= today));
    return hit.length ? hit[0] : null;
  };

  /**
   * 专项结束后的复盘（文档 3.5.1 / 3.5.2 / 3.5.5 都要求"场景结束后自动生成复盘"）
   *
   * 和假期复盘的区别：假期复盘比的是"日均降下来没有"，
   * 专项复盘比的是**计划 vs 执行** —— 家里说好放 ¥3,800 做开学季，
   * 实际用了多少、剩下多少、花在哪些类上。专项有 target 和用途约束，
   * 所以"执行率"才是它的核心指标。
   *
   * 纯函数：只读账本，不写库。返回 null 表示还没结束、不该生成。
   */
  E.fundReview = function (fund, entries, today) {
    if (!fund) return null;
    const ended = fund.status === 'closed' || (fund.periodEnd && today > fund.periodEnd);
    if (!ended) return null;

    const list = (entries || []).filter(e => e.fundId === fund.id);
    const inn = list.filter(e => e.direction === 'in');
    const out = list.filter(e => e.direction === 'out');
    const sum = a => Math.round(a.reduce((s, x) => s + x.amount, 0));
    const inTotal = sum(inn), used = sum(out);
    const target = Number(fund.target) || inTotal || 0;
    const from = fund.periodStart || (inn.length ? inn.map(e => e.date).sort()[0] : fund.periodEnd);
    const to = fund.periodEnd || today;
    const days = Math.max(1, U.diffDays(from, to) + 1);
    const executed = target > 0 ? used / target : 0;

    /* 大类构成：**只有青年侧看得到**。家人侧读的是 supporterApi 的投影，
       那边不含这个字段（专项的披露口径一直是"只看进度、不看买了什么"）。 */
    const byCat = {};
    out.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
    const cats = LJ.CATEGORIES.map(c => ({
      id: c.id, name: c.name, icon: c.icon, color: c.color,
      amount: Math.round(byCat[c.id] || 0)
    })).filter(c => c.amount > 0).sort((a, b) => b.amount - a.amount);

    const notes = [];
    if (target > 0) {
      notes.push('计划 ¥' + U.won(target) + '，实际用了 ¥' + U.won(used) +
        '（执行率 ' + Math.round(executed * 100) + '%）。');
    }
    if (used > inTotal) {
      notes.push('实际支出超出了转入的钱 ¥' + U.won(used - inTotal) + '，' +
        '超出的部分是从日常资金里补的。');
    } else if (inTotal - used > 0) {
      notes.push('还剩 ¥' + U.won(inTotal - used) + ' 在池子里，' +
        '可以留着下次用，也可以让家人转出。');
    } else if (inTotal > 0) {
      notes.push('转入的钱正好用完，没有剩余。');
    }
    if (cats.length) {
      notes.push('用得最多的是' + cats[0].icon + ' ' + cats[0].name +
        '（¥' + U.won(cats[0].amount) + '）。');
    }
    const kind = E.fundKind(fund.kind);
    if (kind && fund.category && cats.length === 1 && cats[0].id === fund.category) {
      notes.push('所有支出都在约定的「' + kind.name + '」用途内，没有花到别处。');
    }

    return {
      fundId: fund.id, kind: fund.kind || null,
      name: fund.name, category: fund.category || null,
      from: from, to: to, days: days,
      target: target, inTotal: inTotal, used: used,
      remaining: inTotal - used, executed: executed,
      avgPerDay: Math.round(used / days),
      cats: cats, notes: notes
    };
  };

  /** 家人侧的专项复盘投影：**只给进度，不给大类构成、不给任何一行明细** */
  E.fundReviewForSupporter = function (rv) {
    if (!rv) return null;
    return {
      fundId: rv.fundId, name: rv.name, from: rv.from, to: rv.to, days: rv.days,
      target: rv.target, inTotal: rv.inTotal, used: rv.used,
      remaining: rv.remaining, executed: rv.executed
    };
  };

  /* ============================================================
     阶梯式金融服务引导（文档 3.3.4 第 2 条）
     ============================================================
     文档原文：基于用户理财阶段与风险承受能力，分级推荐零钱管理、稳健理财、
     多元配置等**不同类型**的金融产品，所有推荐均为建议性质，用户自主选择，
     不强制开通，同时配套知识科普，引导理性金融决策。

     三条自己给自己上的约束（也是这个功能合规的底线）：
       ① **只到"类型"，不点名任何具体产品** —— 一旦写出产品名，
          就从"科普"变成"导购"，而这条链路我们不做交易。
       ② **不出现任何收益数字** —— 不写"年化 X%"，也不写"预期"。收益一旦写出来，
          "建议性质"就站不住了。
       ③ **准入条件由数据算，不由分数定** —— "能不能了解下一档"看的是
          应急储备够不够、结余稳不稳，而不是"掌控指数到 80 分就解锁"。
          分数是产品给的，条件是生活给的。

     纯函数，只读账本。
     ============================================================ */
  E.FINANCE_TIERS = [
    {
      id: 'cash', name: '零钱管理类', icon: '🪙',
      what: '随时能取、波动极小的那一类',
      why: '先解决"钱放在哪里不会随手花掉"',
      need: '随时可能用到，所以流动性排第一'
    },
    {
      id: 'steady', name: '稳健积累类', icon: '📗',
      what: '风险等级低、以保住本金为前提的那一类',
      why: '应急储备已经到位，闲钱放着会贬值',
      need: '至少能放 3 个月不动'
    },
    {
      id: 'multi', name: '多元配置类', icon: '📊',
      what: '不同风险与期限搭配的那一类',
      why: '理解风险与收益的关系，而不是追逐收益',
      need: '应急储备之外还有长期不用的钱'
    }
  ];

  /** 风险承受力的**客观**参考：不看分数，只看两件事实 */
  E.financeReadiness = function (entries, today) {
    const e = entries || [];
    const bal = M.balances(e);
    const h = M.health(e, today);
    /* 应急储备：现有可动用余额能覆盖多少天的支出 */
    const runway = h && h.runway ? h.runway : 0;
    /* 结余稳定性：近 6 个月里有几个月是正的（结余率 > 0） */
    let posMonths = 0, monthsCounted = 0;
    for (let i = 1; i <= 6; i++) {
      const mk = U.monthKey(U.addMonths(today, -i));
      const mt = M.monthTotals(e, mk);
      if (!mt || mt.count === 0) continue;
      monthsCounted++;
      if (mt.net > 0) posMonths++;
    }
    const steady = monthsCounted > 0 ? posMonths / monthsCounted : 0;
    return {
      runway: Math.min(99, Math.round(runway)),
      steady: Math.round(steady * 100) / 100,
      posMonths: posMonths, monthsCounted: monthsCounted,
      /* 两个门槛：应急储备 ≥30 天、且多数月份有结余 */
      emergencyReady: runway >= 30,
      stableReady: runway >= 30 && monthsCounted >= 2 && steady >= 0.5
    };
  };

  /** 分级引导：返回每一档 + 现在能不能了解它 + 差什么 */
  E.financeGuide = function (entries, today) {
    const r = E.financeReadiness(entries, today);
    const tiers = E.FINANCE_TIERS.map((t, i) => {
      let open = true, gap = '';
      if (i === 1 && !r.emergencyReady) {
        open = false;
        gap = '应急储备还差 ' + Math.max(0, 30 - r.runway) + ' 天（现在能覆盖 ' + r.runway + ' 天）';
      }
      if (i === 2 && !r.stableReady) {
        open = false;
        gap = !r.emergencyReady
          ? '先把应急储备做到 30 天以上'
          : '近 6 个月里有 ' + (r.monthsCounted - r.posMonths) + ' 个月没有结余，先稳住结余';
      }
      return Object.assign({}, t, { open: open, gap: gap, index: i });
    });
    return {
      readiness: r, tiers: tiers,
      current: tiers.filter(t => t.open).length - 1
    };
  };

  /* ============================================================
     成长数据月报（文档 3.4.3.1：月度/季度自动生成成长报告，
     展示财务掌控指数变化、成长挑战完成情况，无消费细节）
     ============================================================
     以前家长端只有"当月一张卡"，看不到变化 —— 而"变化"才是成长报告的意义。
     掌控指数是滚动 90 天窗口，所以这里把每个月的月末当成"当天"重算一次，
     得到一条真实的指数曲线，而不是拿今天的分数复制 N 遍。
     ============================================================ */
  E.monthlyReports = function (entries, today, opt) {
    opt = opt || {};
    const n = opt.months || 6;
    const budgetMonthly = opt.budgetMonthly || 2600;
    const tasks = opt.taskProgress || [];
    const stones = opt.milestones || [];
    const list = entries || [];
    /* 能力证据：从留痕里抽「他主动做过的财务动作」。
       ★ 必须是**已经按 actorId 圈定到本人**的事件 —— 传全库流水进来的话，
         会把另一个孩子和家长的动作算成这个孩子的成长证据。 */
    const events = opt.events || [];

    const out = [];
    for (let i = n - 1; i >= 0; i--) {
      const anchor = U.addMonths(today, -i);
      const mk = U.monthKey(anchor);
      const end = U.endOfMonth(anchor);
      if (end > today) continue;                 // 当月还没过完，不算一整月
      const mEntries = list.filter(e => U.monthKey(e.date) === mk);
      if (!mEntries.length) continue;
      const inn = mEntries.filter(e => e.direction === 'in' && e.source !== 'fund');
      const outE = mEntries.filter(e => e.direction === 'out');
      const sum = a => Math.round(a.reduce((s, x) => s + x.amount, 0));
      const income = sum(inn), expense = sum(outE);

      /* 指数取"截至这个月末"的值 —— 滚动 90 天，所以曲线会自己说话 */
      const ci = M.controlIndex(list, { today: end, budgetMonthly: budgetMonthly });

      const byCat = {};
      outE.forEach(e => {
        if (!e.category) return;
        byCat[e.category] = (byCat[e.category] || 0) + e.amount;
      });
      const peakId = Object.keys(byCat).sort((a, b) => byCat[b] - byCat[a])[0];
      const peak = peakId ? {
        id: peakId, name: LJ.catById(peakId).name, icon: LJ.catById(peakId).icon,
        amount: Math.round(byCat[peakId])
      } : null;

      /* 能力证据：这个月他主动做过什么（不是"考了多少分"） */
      const evidence = E.actionEvidence(events, mk + '-01', end);

      out.push({
        month: mk, end: end,
        income: income, expense: expense, net: income - expense,
        saveRate: income > 0 ? (income - expense) / income : 0,
        control: ci.score, level: ci.level,
        entryCount: mEntries.length,
        peak: peak,
        /* 成长类：这个月完成了几项任务、拿到几个里程碑 */
        tasksDone: tasks.filter(t => String(t.at || '').slice(0, 7) === mk).length,
        milestones: stones.filter(m => String(m.date || '').slice(0, 7) === mk).length,
        evidence: evidence,
        evidenceCount: evidence.reduce((s, e) => s + e.count, 0)
      });
    }

    /* 点评：只说变化，不做评判（文档 3.3.2 要求中性化表达） */
    out.forEach((r, i) => {
      const prev = i > 0 ? out[i - 1] : null;
      const bits = [];
      if (prev) {
        const d = r.control - prev.control;
        if (d >= 3) bits.push('掌控指数比上个月高了 ' + d + ' 分。');
        else if (d <= -3) bits.push('掌控指数比上个月低了 ' + Math.abs(d) + ' 分，通常是因为这个月有大额支出。');
        else bits.push('掌控指数和上个月基本持平。');
        if (prev.expense > 0) {
          const ed = Math.round((r.expense - prev.expense) / prev.expense * 100);
          if (Math.abs(ed) >= 10) bits.push('支出' + (ed > 0 ? '多了' : '少了') + ' ' + Math.abs(ed) + '%。');
        }
      } else {
        bits.push('这是账本里最早的一个完整月份，后面的变化都从它开始算。');
      }
      if (r.tasksDone) bits.push('完成了 ' + r.tasksDone + ' 项成长任务。');
      if (r.milestones) bits.push('拿到 ' + r.milestones + ' 个新里程碑。');
      if (r.peak) bits.push('花得最多的是' + r.peak.icon + ' ' + r.peak.name + '。');
      /* 结余为负就直说，但不下判断 —— 大额支出月赤字是正常的 */
      if (r.saveRate < 0) bits.push('这个月的结余是负的，动用了之前的积累。');
      else if (r.saveRate >= 0.3) bits.push('结余率 ' + Math.round(r.saveRate * 100) + '%，留得比较多。');
      r.note = bits.join('');
    });

    return out;
  };

  /**
   * 趋势叙述：指数曲线不是单调的，文案得描述形状而不是假设"一路上行"。
   * 实测种子数据是 42 → 66 → 35 → 36 → 42 → 67：
   * 中间有一段赤字造成的低谷，最近回到成长期 —— 这才是要讲的事。
   */
  E.trendNarrative = function (reports, name) {
    const m = reports || [];
    if (m.length < 2) return { shape: 'flat', text: '样本还不够，等几个完整月份过去再看趋势。' };
    const first = m[0], last = m[m.length - 1];
    const mid = m.slice(1, -1);
    const low = m.slice().sort((a, b) => a.control - b.control)[0];
    const high = m.slice().sort((a, b) => b.control - a.control)[0];
    const who = name || '孩子';

    if (mid.length && low.control <= Math.min(first.control, last.control) - 5) {
      return {
        shape: 'dip', low: low, high: high,
        text: who + ' 这段走的是"先低后回"：' + low.month + ' 掉到 ' + low.control +
          ' 分，之后回到 ' + last.control + ' 分（' + last.level + '）。' +
          '低谷那几个月大多是结余吃紧的月份 —— 大额支出集中，不代表习惯变差。'
      };
    }
    if (mid.length && high.control >= Math.max(first.control, last.control) + 5) {
      return {
        shape: 'peak', low: low, high: high,
        text: who + ' 中间有一个高点：' + high.month + ' 到过 ' + high.control +
          ' 分，最近是 ' + last.control + ' 分。回落通常跟着一笔大额支出。'
      };
    }
    if (last.control - first.control >= 5) {
      return {
        shape: 'up', low: low, high: high,
        text: who + ' 这段从 ' + first.control + ' 分走到 ' + last.control +
          ' 分，整体在上行 —— 节奏在变稳。'
      };
    }
    if (first.control - last.control >= 5) {
      return {
        shape: 'down', low: low, high: high,
        text: who + ' 这段从 ' + first.control + ' 分走到 ' + last.control +
          ' 分，整体在回落。可以先看看是哪一项拖下来的。'
      };
    }
    return {
      shape: 'flat', low: low, high: high,
      text: who + ' 这段在 ' + low.control + ' – ' + high.control + ' 分之间来回，整体持平。'
    };
  };

  /** 把月度报告折成季度视角（文档要求"月度/季度"） */
  E.quarterlyRollup = function (reports) {
    const byQ = {};
    (reports || []).forEach(r => {
      const m = Number(r.month.slice(5, 7));
      const q = r.month.slice(0, 4) + ' Q' + (Math.floor((m - 1) / 3) + 1);
      if (!byQ[q]) byQ[q] = { quarter: q, months: 0, income: 0, expense: 0, control: [], tasksDone: 0 };
      const b = byQ[q];
      b.months++; b.income += r.income; b.expense += r.expense;
      b.control.push(r.control); b.tasksDone += r.tasksDone;
    });
    return Object.keys(byQ).sort().map(q => {
      const b = byQ[q];
      return {
        quarter: b.quarter, months: b.months,
        income: b.income, expense: b.expense, net: b.income - b.expense,
        control: Math.round(b.control.reduce((s, x) => s + x, 0) / b.control.length),
        controlFrom: b.control[0], controlTo: b.control[b.control.length - 1],
        tasksDone: b.tasksDone
      };
    });
  };

  /* ============================================================
     大学阶段财务成长报告（文档 3.5.5）
     从入学到现在的一次纵向回顾，给毕业那一刻看
     ============================================================ */
  E.gradReport = function (entries, supportRecords, taskProgress, today) {
    const list = entries || [];
    const out = list.filter(e => e.direction === 'out');
    const inn = list.filter(e => e.direction === 'in');
    const sum = a => Math.round(a.reduce((s, x) => s + x.amount, 0));

    const familyIn = inn.filter(e => e.fundingSource === 'family');
    const ownIn = inn.filter(e => e.fundingSource === 'own');
    const sup = supportRecords || [];
    const months = {};
    out.forEach(e => {
      const mk = U.monthKey(e.date);
      months[mk] = (months[mk] || 0) + e.amount;
    });
    const monthKeys = Object.keys(months).sort();
    const totalOut = sum(out);
    const totalIn = sum(inn);
    const monthCount = Math.max(1, monthKeys.length);

    const ci = M.controlIndex(list, { today, budgetMonthly: 2600 });
    /* 前半段 vs 后半段的日均，用来看"越花越稳"还是"越花越松" */
    const half = Math.floor(monthKeys.length / 2) || 1;
    const avgOf = keys => keys.length ? sum(out.filter(e => keys.indexOf(U.monthKey(e.date)) >= 0)) / keys.length : 0;
    const early = avgOf(monthKeys.slice(0, half));
    const late = avgOf(monthKeys.slice(half));

    return {
      firstDate: list.length ? list.map(e => e.date).sort()[0] : today,
      lastDate: today,
      days: list.length ? U.diffDays(list.map(e => e.date).sort()[0], today) : 0,
      months: monthKeys.length,
      totalOut: totalOut, totalIn: totalIn,
      familyIn: sum(familyIn), ownIn: sum(ownIn),
      ownRatio: totalIn > 0 ? sum(ownIn) / totalIn : 0,
      net: totalIn - totalOut,
      supportCount: sup.length,
      avgMonth: Math.round(totalOut / monthCount),
      earlyAvg: Math.round(early), lateAvg: Math.round(late),
      control: ci,
      tasksDone: (taskProgress || []).length,
      peakMonth: monthKeys.slice().sort((a, b) => months[b] - months[a])[0] || null,
      peakAmount: monthKeys.length ? Math.round(months[monthKeys.slice().sort((a, b) => months[b] - months[a])[0]]) : 0
    };
  };
})(window.LJ);

