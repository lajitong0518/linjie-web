/* ============================================================
   pages-youth-m2.js —— 青年端 M2 页面
   规划体系 / AI 助手 / 成长体系 / 协商扩展 / 账单导入 / 客服
   ============================================================ */
(function (LJ) {
  'use strict';
  const U = LJ.util, UI = LJ.ui, M = LJ.metrics, E = LJ.engine, P = LJ.pages;
  const go = LJ._bindGo;

  function sec(t, more) {
    return '<div class="sec-title">' + UI.esc(t) + (more ? '<span class="more">' + more + '</span>' : '') + '</div>';
  }
  function rowLi(icon, bg, title, sub, right, attrs) {
    return '<div class="li" ' + (attrs || '') + '><div class="ico" style="background:' + (bg || 'var(--line-2)') + '">' +
      icon + '</div><div class="grow"><div style="font-size:14px;font-weight:500">' + UI.esc(title) + '</div>' +
      (sub ? '<div class="xs muted" style="margin-top:3px">' + sub + '</div>' : '') + '</div>' +
      (right || '<div class="muted">›</div>') + '</div>';
  }

  /* ============================================================
     掌控指数详情
     ============================================================ */
  P['youth.control'] = {
    title: '财务掌控力', chrome: 'plain',
    render(ctx) {
      const d = ctx.api.dashboard(), c = d.control;
      const TIPS = {
        budget: ['把每个大类的预算调到一个够用但不宽松的数', '超支的大类先看明细，找出可以替代的支出'],
        save: ['发生活费当天先转出一笔到储蓄，剩下的再花', '把结余率目标定在 15%~20% 之间'],
        steady: ['把大额支出集中安排在发生活费后的第一周', '订阅类支出固定在同一天扣，避免叠加'],
        resil: ['个人自有资金尽量不动，作为应急储备', '把目标定在能覆盖 1~2 个月支出']
      };
      let html = '<div class="pad">';
      html += '<div class="card mt16" style="text-align:center;padding:24px 16px">' +
        '<div style="display:flex;justify-content:center">' + UI.radar(c.dims, 200) + '</div>' +
        '<div class="row between mt16" style="margin-top:16px;text-align:left">' +
        '<div><div class="xs muted">当前等级</div>' +
        '<div style="font-size:17px;font-weight:700;margin-top:4px">' + c.level + '</div></div>' +
        '<div style="text-align:right"><div class="xs muted">综合得分</div>' +
        '<div class="mono" style="font-size:28px;font-weight:600;margin-top:2px">' + c.score + '</div></div>' +
        '</div>' +
        '<div class="mt16" style="margin-top:14px">' + UI.bar(c.score / 100) + '</div>' +
        '<div class="row between xs muted" style="margin-top:8px">' +
        M.LEVELS.map(l => '<span>' + l.name + ' ' + l.min + '</span>').join('') + '</div>' +
        '</div>';

      html += sec('四个维度');
      html += '<div class="list">' + c.dims.map(x =>
        '<div class="li" style="display:block">' +
        '<div class="row between"><span class="sm" style="font-weight:600">' + x.name + '</span>' +
        '<span class="mono sm">' + Math.round(x.score) + '<span class="muted" style="font-size:11px"> /100</span></span></div>' +
        '<div class="mt8" style="margin-top:8px">' + UI.bar(x.score / 100, x.score >= 60 ? 'var(--navy)' : 'var(--danger)') + '</div>' +
        '<div class="xs muted" style="margin-top:7px">' + UI.esc(x.desc) + '　权重 ' + Math.round(x.weight * 100) + '%</div>' +
        '<div class="xs t2" style="margin-top:8px;line-height:1.7">建议：' + UI.esc((TIPS[x.key] || [])[x.score >= 60 ? 0 : 1] || '') + '</div>' +
        '</div>').join('') + '</div>';

      html += '<div class="proto mt20"><div class="ph"><span class="seal">算</span>这个分数怎么来的</div>' +
        '<div class="xs t2" style="line-height:1.8">' +
        '四个维度加权：预算执行率 30% · 储蓄率 25% · 支出平稳度 25% · 风险抵御力 20%。<br>' +
        '全部基于你近 90 天的真实账本，滚动计算，不会因为某一天的大额支出被误判。</div></div>';

      html += '<div class="sec-title">等级说明</div>';
      html += '<div class="list">' + M.LEVELS.map((l, i) =>
        rowLi(['🌱', '📈', '🎯'][i], ['#DFFAEC', '#EDE9FB', '#EDE9FB'][i], l.name + '　≥ ' + l.min + ' 分', l.desc)).join('') + '</div>';

      html += '</div>';
      return html;
    },
    mount(el, ctx) { go(el, ctx); }
  };

  /* ============================================================
     预算设置
     ============================================================ */
  P['youth.budget'] = {
    title: '预算设置', chrome: 'plain', keepAlive: true,
    render(ctx) {
      const api = ctx.api, b = api.budget.get() || { total: 2300, categories: {} };
      const d = api.dashboard();
      const bp = d.budget;
      let html = '<div class="pad">';
      html += '<div class="proto mt16"><div class="ph"><span class="seal">数</span>为什么要设分类预算</div>' +
        '<div class="sm t2" style="line-height:1.7">只知道总数没用——超支往往集中在一两个大类上。' +
        '分开设数，才看得出钱是从哪里漏掉的。</div></div>';

      html += sec('月度总额');
      html += '<input id="bTotal" type="number" value="' + b.total + '" style="width:100%;height:48px;' +
        'border:1px solid var(--line);border-radius:12px;padding:0 14px;font-family:var(--mono);font-size:20px;' +
        'outline:none;background:var(--card)">';

      html += sec('分类预算', '<span id="bSum" class="more"></span>');
      html += '<div class="list">' + LJ.CATEGORIES.map(c => {
        const cur = (b.categories || {})[c.id] || 0;
        const spent = bp.categories.find(x => x.id === c.id).spent;
        return '<div class="li"><div class="ico" style="background:' + c.color + '18;color:' + c.color + '">' + c.icon + '</div>' +
          '<div class="grow"><div class="row between"><span class="sm" style="font-weight:500">' + c.name + '</span>' +
          '<span class="xs muted mono">本月已用 ¥' + U.won(spent) + '</span></div></div>' +
          '<input class="budget-input" data-cat="' + c.id + '" type="number" value="' + cur + '" ' +
          'style="width:88px;height:36px;border:1px solid var(--line);border-radius:9px;text-align:right;' +
          'padding:0 10px;font-family:var(--mono);font-size:14px;outline:none;background:var(--card)">' +
          '</div>';
      }).join('') + '</div>';

      html += '<div class="card mt16" id="bPreview"></div>';
      html += '<button class="btn mt16" id="bSave">保存预算</button>';
      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      const api = ctx.api;
      const total = el.querySelector('#bTotal');
      const inputs = Array.from(el.querySelectorAll('.budget-input'));
      function sync() {
        const sum = inputs.reduce((s, i) => s + (Number(i.value) || 0), 0);
        const t = Number(total.value) || 0;
        const left = t - sum;
        el.querySelector('#bSum').textContent = '分类合计 ¥' + sum.toLocaleString('zh-CN');
        el.querySelector('#bPreview').innerHTML =
          '<div class="row between"><span class="sm t2">月度总额</span><span class="mono">¥' + U.won(t) + '</span></div>' +
          '<div class="row between mt8" style="margin-top:8px"><span class="sm t2">分类合计</span><span class="mono">¥' + U.won(sum) + '</span></div>' +
          '<div class="row between mt8" style="margin-top:8px"><span class="sm t2">未分配</span>' +
          '<span class="mono" style="color:' + (left < 0 ? 'var(--danger)' : left > 0 ? 'var(--warn)' : 'var(--ok)') + '">¥' + U.won(left) + '</span></div>' +
          (left < 0 ? '<div class="xs" style="color:var(--danger);margin-top:10px">分类合计超过了总额，建议调整</div>' :
            left > t * 0.15 ? '<div class="xs" style="color:var(--warn);margin-top:10px">还有较多金额没有分配到分类</div>' :
              '<div class="xs" style="color:var(--ok);margin-top:10px">分配合理</div>');
      }
      total.oninput = sync; inputs.forEach(i => i.oninput = sync); sync();

      el.querySelector('#bSave').onclick = () => {
        const cats = {};
        inputs.forEach(i => { cats[i.getAttribute('data-cat')] = Number(i.value) || 0; });
        const t = Number(total.value) || 0;
        if (t <= 0) return UI.toast('总额需要大于 0');
        ctx.api.budget.set({ total: t, categories: cats, periodStart: U.startOfMonth(LJ.clock.now()), periodEnd: U.endOfMonth(LJ.clock.now()) });
        UI.toast('预算已保存');
        ctx.back();
      };
    }
  };

  /* ============================================================
     生活费周期规划
     ============================================================ */
  P['youth.cycle'] = {
    title: '周期规划', chrome: 'plain',
    render(ctx) {
      const api = ctx.api, d = api.dashboard(), today = LJ.clock.now();
      const payday = M.nextPayday(today);
      const start = U.startOfMonth(today);
      const dim = U.daysInMonth(today);
      const passed = U.parse(today).getDate();
      const left = dim - passed;
      const bp = d.budget;
      const dailyLeft = Math.max(0, bp.remaining) / Math.max(1, left);

      // 按周切片
      const weeks = [];
      for (let w = 0; w * 7 < dim; w++) {
        const f = U.addDays(start, w * 7);
        const t = U.addDays(start, Math.min(dim - 1, w * 7 + 6));
        const amt = M.inRange(LJ.store.all('entry'), f, t)
          .filter(e => e.direction === 'out').reduce((s, e) => s + e.amount, 0);
        weeks.push({ from: f, to: t, amount: amt, future: f > today });
      }
      const maxW = Math.max.apply(null, weeks.map(w => w.amount).concat([1]));

      let html = '<div class="pad">';
      html += '<div class="card mt16">' +
        '<div class="row between"><div><div class="xs muted">本周期</div>' +
        '<div style="font-size:17px;font-weight:700;margin-top:4px">' + U.monthKey(today) + '</div></div>' +
        '<div style="text-align:right"><div class="xs muted">距下次发放</div>' +
        '<div class="mono" style="font-size:17px;font-weight:600;margin-top:4px">' + (dim - passed + 1) + ' 天</div></div>' +
        '</div>' +
        '<div class="mt16" style="margin-top:14px">' + UI.bar(passed / dim) + '</div>' +
        '<div class="row between xs muted" style="margin-top:8px">' +
        '<span>' + U.ymdCN(start) + '</span><span>已过 ' + passed + ' / ' + dim + ' 天</span>' +
        '<span>' + U.ymdCN(payday) + ' 发放</span></div>' +
        '</div>';

      html += '<div class="grid3 mt12">' +
        '<div class="metric"><div class="k">预算剩余</div><div class="v">' + Math.round(bp.remaining) + '</div></div>' +
        '<div class="metric"><div class="k">剩余天数</div><div class="v">' + left + '</div></div>' +
        '<div class="metric"><div class="k">日均可用</div><div class="v">' + Math.round(dailyLeft) + '</div></div>' +
        '</div>';

      if (bp.over) {
        /* 按当前节奏外推月底支出，算出「预计超支」而不是「已经超了多少」 */
        const projected = bp.spent / Math.max(1, passed) * dim;
        const overAmt = Math.max(0, projected - bp.total);
        html += '<div class="card mt12" style="border-left:3px solid var(--danger)">' +
          '<div class="sm" style="font-weight:700;color:var(--danger)">支出快于时间进度</div>' +
          '<div class="xs t2" style="margin-top:6px;line-height:1.7">本月已过 ' + passed + ' / ' + dim +
          ' 天，预算用了 ' + Math.round(bp.ratio * 100) + '%。' +
          '按这个节奏月底预计支出 ¥' + U.won(projected) +
          (overAmt > 1 ? '，会超出约 ¥' + U.won(overAmt) + '。' : '，刚好压在预算线上。') +
          '</div></div>';
      }

      html += sec('按周看节奏');
      html += '<div class="card">' + weeks.map(w =>
        '<div class="row" style="margin-bottom:11px;gap:10px">' +
        '<span class="xs muted mono" style="width:74px;flex:none">' + U.ymdCN(w.from).replace('月', '/').replace('日', '') +
        '起</span>' +
        '<div style="flex:1">' + UI.bar(w.amount / maxW, w.future ? 'var(--line)' : (w.amount > bp.total / 4.3 * 1.3 ? 'var(--danger)' : 'var(--navy)')) + '</div>' +
        '<span class="xs mono muted" style="width:56px;text-align:right;flex:none">' +
        (w.future ? '—' : '¥' + Math.round(w.amount)) + '</span></div>').join('') +
        '<div class="xs muted" style="margin-top:6px">一个周期约 4.3 周，单周超过 ¥' +
        Math.round(bp.total / 4.3 * 1.3) + ' 说明这一周花得偏多。</div></div>';

      html += sec('下一步');
      html += '<div class="list">' +
        rowLi('💸', '#EDE9FB', '调整分类预算', '把预算分配到六个大类', '<div class="muted">›</div>', 'data-go="youth.budget"') +
        rowLi('📊', '#EDE9FB', '做一次周期复盘', '看看这个周期花在了哪里', '<div class="muted">›</div>', 'data-go="youth.review"') +
        rowLi('🔔', '#DFFAEC', '管理订阅支出', '固定扣费最容易悄悄流走', '<div class="muted">›</div>', 'data-go="youth.subs"') +
        '</div>';
      html += '</div>';
      return html;
    },
    mount(el, ctx) { go(el, ctx); }
  };

  /* ============================================================
     订阅管理
     ============================================================ */
  P['youth.subs'] = {
    title: '订阅管理', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const list = api.subscription.list();
      const sum = api.subscription.summary();
      const detected = api.subscription.detect();

      let html = '<div class="pad">';
      html += '<div class="card mt16">' +
        '<div class="row between"><div><div class="xs muted">每月固定扣费</div>' +
        '<div class="mono" style="font-size:28px;font-weight:600;margin-top:4px">¥' + U.won(sum.monthly) + '</div></div>' +
        '<div style="text-align:right"><div class="xs muted">折算一年</div>' +
        '<div class="mono" style="font-size:17px;font-weight:600;margin-top:6px;color:var(--text-2)">¥' + U.won(sum.annual) + '</div></div>' +
        '</div>' +
        (sum.next ? '<div class="xs muted" style="margin-top:14px">最近一笔：' + UI.esc(sum.next.name) +
          ' · ' + (sum.next.daysToNext >= 0 ? sum.next.daysToNext + ' 天后' : '已过期') + '</div>' : '') +
        '</div>';

      html += sec('已管理', '<span class="more">' + sum.activeCount + ' 项生效中</span>');
      if (!list.length) {
        html += '<div class="card flat"><div class="sm muted" style="text-align:center;padding:12px 0">还没有添加订阅</div></div>';
      } else {
        html += '<div class="list">' + list.map(s =>
          '<div class="li"><div class="ico" style="background:' + (s.status === 'active' ? '#DFFAEC' : 'var(--line-2)') + '">🔔</div>' +
          '<div class="grow"><div class="row between"><span style="font-size:14px;font-weight:500">' + UI.esc(s.name) + '</span>' +
          '<span class="mono sm">¥' + U.won(s.actualMonthly || s.amount) + '/月</span></div>' +
          '<div class="row between" style="margin-top:5px"><span class="xs muted">' +
          (s.nextDate ? '下次 ' + s.nextDate + '（' + s.daysToNext + ' 天后）' : '暂无扣费记录') + '</span>' +
          '<span class="tag ' + (s.status === 'active' ? 'ok' : 'gray') + '">' + (s.status === 'active' ? '生效中' : '已暂停') + '</span></div>' +
          '<div class="row mt12" style="gap:8px;margin-top:10px">' +
          '<button class="btn ghost sm" data-toggle="' + s.id + '">' + (s.status === 'active' ? '暂停' : '恢复') + '</button>' +
          '<button class="btn ghost sm" data-del="' + s.id + '" style="color:var(--danger)">移除</button>' +
          '</div></div></div>').join('') + '</div>';
      }

      if (detected.length) {
        html += sec('识别到可能的订阅', '<span class="more">来自账单</span>');
        html += '<div class="list">' + detected.map(x =>
          '<div class="li"><div class="ico" style="background:#FFF0D4">✨</div>' +
          '<div class="grow"><div class="row between"><span style="font-size:14px">' + UI.esc(x.name) + '</span>' +
          '<span class="mono sm">¥' + U.won(x.amount) + '</span></div>' +
          '<div class="xs muted" style="margin-top:4px">近几个月定期扣费 ' + x.count + ' 次</div></div>' +
          '<button class="btn soft sm" data-add="' + UI.esc(x.name) + '" data-amt="' + x.amount + '">加入管理</button>' +
          '</div>').join('') + '</div>';
      }

      html += '<div class="proto mt20"><div class="ph"><span class="seal">提</span>为什么单独管订阅</div>' +
        '<div class="xs t2" style="line-height:1.8">订阅金额小、频率固定，最容易被忽略。' +
        '十几块钱一个月看着不多，三项加起来一年就是六七百——相当于半个月的生活费。</div></div>';

      html += '<button class="btn ghost mt20" id="addSub">手动添加一个订阅</button>';
      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      el.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => {
        ctx.api.subscription.toggle(b.getAttribute('data-toggle')); UI.toast('已更新');
      });
      el.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
        UI.confirm({
          title: '移除这个订阅？', desc: '只是不再跟踪它，历史账单不受影响。',
          okText: '移除', onOk() { ctx.api.subscription.remove(b.getAttribute('data-del')); UI.toast('已移除'); }
        });
      });
      el.querySelectorAll('[data-add]').forEach(b => b.onclick = () => {
        ctx.api.subscription.add({ name: b.getAttribute('data-add'), amount: Number(b.getAttribute('data-amt')) });
        UI.toast('已加入管理');
      });
      el.querySelector('#addSub').onclick = () => {
        UI.sheet({
          title: '添加订阅', sub: '用于跟踪固定的周期性支出',
          body: '<div class="sec-title" style="margin-top:0">名称</div>' +
            '<input id="sName" placeholder="例如：网易云音乐" style="width:100%;height:46px;border:1px solid var(--line);' +
            'border-radius:12px;padding:0 13px;outline:none;background:var(--card)">' +
            '<div class="sec-title">每月金额</div>' +
            '<input id="sAmt" type="number" placeholder="0.00" style="width:100%;height:46px;border:1px solid var(--line);' +
            'border-radius:12px;padding:0 13px;font-family:var(--mono);font-size:17px;outline:none;background:var(--card)">' +
            '<button class="btn mt20" id="sSave">添加</button>',
          mount(e2, close) {
            e2.querySelector('#sSave').onclick = () => {
              const n = e2.querySelector('#sName').value.trim();
              const a = Number(e2.querySelector('#sAmt').value);
              if (!n) return UI.toast('请填写名称');
              if (!(a > 0)) return UI.toast('请填写金额');
              ctx.api.subscription.add({ name: n, amount: a });
              close(); UI.toast('已添加');
            };
          }
        });
      };
    }
  };

  /* ============================================================
     周期复盘
     ============================================================
     这一页只回答两个问题：
       ① 这一期发生了什么 —— 五个维度，每个维度一句结论 + 一点证据
       ② 下一期改哪一件事 —— 列建议 → 你挑一条（或自己说一条）
                              → 摘要摊开给你审核 → 通过了才执行

     ★ 没有「标记已复盘」这个按钮。复盘完成的定义是"定了下期怎么改"：
       点一下按钮什么都没发生，那不是复盘，是打卡。
     ★ 五个维度的词汇和成长中心、支持人端是同一套：
       节奏 / 承诺 / 决定 / 开源 / 未来。同一个人在两处看到的说法必须一致。
     ★ 每一维的结论句用 <b> 凸出，逐条读下来就是 30 秒版；细节在下面小字里。
     ============================================================ */

  /** 一个维度 = 编号 + 名字 + 状态标签 + 一句结论（大字）+ 证据（小字） */
  function dimCard(o) {
    return '<div class="card rvd" data-dim="' + o.key + '">' +
      '<div class="rvd-h"><span class="rvd-n">' + o.n + '</span>' +
      '<span class="rvd-k">' + UI.esc(o.title) + '</span>' +
      (o.tag ? '<span class="tag ' + (o.tagCls || 'gray') + '">' + UI.esc(o.tag) + '</span>' : '') +
      '</div>' +
      '<div class="rvd-s">' + o.line + '</div>' +
      (o.body ? '<div class="rvd-b">' + o.body + '</div>' : '') +
      '</div>';
  }

  /* ------------------------------------------------------------
     「下期怎么改」的选择态：**多选**，选完一次审核、一次执行。

     为什么不是每条一个按钮：我们只提供建议，改几条是他的事。
     一条一个按钮，等于替他做了"这次只改一件事"的决定 ——
     那是产品在管用户，不是用户在管自己的钱。

     ★ 状态放在模块级（不写 localStorage），和折叠状态同一个理由：
       这是"这次进来的临时选择"，不是用户偏好；但同一会话里来回切页要记住。
     ★ 换期（切月份）必须清空：上一期选的条目和这一期的建议不是一回事。
     ------------------------------------------------------------ */
  let RV_PICK = [];
  let RV_CUSTOM = [];
  let RV_MK = null;
  /* 切月的代号计数器（007）：让上一次切月的收尾回调失效，连点不叠层 ——
     和 slideTo 的 R.gen 同一个道理。模块级（不写 localStorage，刷新重置是有意的，
     理由同上面的 RV_PICK）。 */
  let RV_GEN = 0;

  /* 自己说的那一条在清单里的样子。★ 一定要把 diff 写出来：
     用户说的是「把外卖控制一下」，助手翻译成了「分类上限 · 餐饮 ¥870 → ¥780」——
     不写出来，他就得等到最后那张审核弹层才知道自己那句话被理解成了什么。 */
  function rvCustomRow(it, i) {
    return '<div class="rv-cr"><span class="rv-cr-i">✎</span>' +
      '<div class="rv-cr-b"><b>' + UI.esc(it.raw || it.title) + '</b>' +
      (it.note ? '<span>' + UI.esc(it.note) + '</span>' : '') +
      '<span class="dt">' + (it.diff || []).map(d =>
        UI.esc(d.k) + ' ' + UI.esc(d.from) + ' → ' + UI.esc(d.to)).join('　') + '</span>' +
      '</div>' +
      '<button class="rv-cr-x" data-cr-x="' + i + '">✕</button></div>';
  }

  /* ------------------------------------------------------------
     审核弹层：把"准备改什么"先摊开给他看，通过了才落库。
     为什么不点一下就改：改的是他的预算、他的订阅、他的目标 ——
     一次误触就把月度预算换了，或者把订阅停了。
     凡是动钱的动作，都必须先看见 before → after。
     多条一起改时，**逐条摊开**：一次审核 ≠ 一次含糊。
     ------------------------------------------------------------ */
  function openAdoptSheet(ctx, mk, items) {
    const list = items || [];
    const body = list.map(it =>
      '<div class="ad-item">' +
      '<div class="ad-title">' + UI.esc(it.title) + '</div>' +
      (it.why ? '<div class="ad-why">' + UI.esc(it.why) + '</div>' : '') +
      (it.note ? '<div class="ad-why">' + UI.esc(it.note) + '</div>' : '') +
      '<div class="ad-diff">' + (it.diff || []).map(d =>
        '<div class="ad-row"><span class="k">' + UI.esc(d.k) + '</span>' +
        '<span class="from">' + UI.esc(d.from) + '</span>' +
        '<span class="arw">→</span>' +
        '<span class="to">' + UI.esc(d.to) + '</span></div>').join('') + '</div>' +
      '</div>').join('');
    UI.sheet({
      title: list.length > 1 ? '按这几条改，会动这些地方' : '按这条改，会动这些地方',
      sub: list.length > 1 ? '一共 ' + list.length + ' 条，确认后一起生效' : '',
      body: body + '<div class="ad-hint">确认后立即生效，并记进成长档案。改错了随时能再改回来。</div>',
      mount(el, close) {
        const wrap = document.createElement('div');
        wrap.innerHTML = '<button class="btn mt16" data-ok>确认执行' +
          (list.length > 1 ? '（' + list.length + ' 条）' : '') + '</button>' +
          '<button class="btn ghost mt12" data-no>再想想</button>';
        el.appendChild(wrap);
        wrap.querySelector('[data-ok]').onclick = () => {
          const res = list.map(it => ctx.api.review.adopt(mk, it.change));
          RV_PICK = []; RV_CUSTOM = [];
          close();
          UI.toast(list.length > 1 ? '已调整 ' + res.length + ' 条' : '已调整：' + res[0].summary);
        };
        wrap.querySelector('[data-no]').onclick = () => close();
      }
    });
  }

  P['youth.review'] = {
    /* chrome 从 plain 提到 tab：「复盘」现在是主导航页（方案乙：问问 → 复盘） */
    title: '周期复盘', chrome: 'tab',
    render(ctx) {
      const api = ctx.api;
      const months = api.review.available().slice(0, 12);
      const cur = ctx.params.month || months[0];
      const c = api.review.dims(cur);
      const r = c.period, tl = c.timeline, inc = c.income;
      const adopted = api.review.adoptedIn(cur);
      const rules = api.review.rules();
      const total = Number(c.budget.total) || 0;
      const wonI = U.wonInt;

      let html = '<div class="pad">';
      html += '<div class="row" style="gap:8px;padding:14px 2px 0;overflow-x:auto">' +
        months.map(m => '<button class="chip ' + (m === cur ? 'on' : '') + '" data-m="' + m + '">' +
          m.slice(2) + '</button>').join('') + '</div>';
      /* ★ 切月 = 整块报告横移（007，照抄 tab 切换的观感）。
         chip 以下的**全部内容**包进 .rv-stage > .rv-body：切月时新体从一侧进、
         旧体往另一侧让 24% 并压暗到 .5，chip 行是轨道不动（它是锚点，
         跟着一起动会让人分不清点中了哪个）。 */
      html += '<div class="rv-stage"><div class="rv-body">';
      html += '<div class="rv-top"><div><div class="rv-range mono">' + r.from + ' ~ ' + r.to + '</div>' +
        '<div class="xs muted">共 ' + r.periodDays + ' 天 · 已过 ' + r.days + ' 天 · 有记录 ' + r.activeDays + ' 天</div></div>' +
        (adopted.length ? '<span class="stamp">本期已调整</span>'
          : '<span class="tag gray">还没调整</span>') + '</div>';

      /* ============ ① 看承诺 ============
         承诺 = 说好的事：预算（对自己说的数）、固定扣款（已经答应的每月支出）、
         专项（家里说好放着的钱）。

         ★ 主体是**比例条**（结构照参考图按像素量出来的：标签 + 数值胶囊 + 一条
           [填充][缝][灰轨]），不再是一排数字 —— 数字住在胶囊里，条负责一眼看出多少。
         ★ 用「到今天为止该花多少」而不是「预算花了百分之多少」：
           月中拿整月预算当分母，永远显示"还剩很多"，没有信息量。 */
      const expectByNow = r.idealPerDay * r.days;
      const ahead = r.expense - expectByNow;
      const subs = c.subs.filter(s => s.status === 'active');
      const subMonthly = subs.reduce((s, x) => s + (x.amount || 0), 0);
      const funds = api.fund.active();
      const f0 = funds[0] ? api.fund.progress(funds[0]) : null;
      const execRate = total > 0 ? r.expense / total : 0;
      const promRows = [];
      if (total > 0) promRows.push({
        name: '月度预算 ¥' + wonI(total),
        chip: '已用',
        ratio: execRate,
        tone: execRate > 1 ? 'danger' : execRate > 0.8 ? 'warn' : 'ok'
      });
      if (subMonthly > 0) promRows.push({
        name: '固定扣款 ¥' + wonI(subMonthly) + '/月',
        chip: '占支出',
        ratio: subMonthly / Math.max(1, r.expense),
        tone: 'info'
      });
      if (f0 && f0.target > 0) promRows.push({
        name: (funds[0].name || '专项计划') + ' ¥' + wonI(f0.target),
        chip: '用掉',
        ratio: f0.ratio,
        tone: f0.ratio > 1 ? 'danger' : 'ok'
      });
      html += dimCard({
        key: 'promise', n: '①', title: '看承诺',
        tag: ahead > 0 ? '快了' : '在计划里', tagCls: ahead > 0 ? 'warn' : 'ok',
        line: '到今天为止该花 <b>¥' + wonI(expectByNow) + '</b>，实际花了 <b>¥' + wonI(r.expense) +
          '</b>，' + (ahead > 0 ? '快了 ¥' + wonI(ahead) : '省了 ¥' + wonI(-ahead)),
        body: UI.chartPromise({ rows: promRows }) +
          (ahead > 0
            ? '<div class="xs muted" style="margin-top:14px">' +
              '超出的部分不是每天多花一点堆出来的 —— 看下一维。</div>'
            : '')
      });

      /* ============ ② 看决定 ============ */
      const imp = tl.byTag.impulse, sim = tl.byTag.simulated, pl = tl.byTag.planned;
      const decLine = tl.count === 0
        ? '这一期没有单笔 ≥ ¥' + tl.thresh + ' 的支出 —— 全是零碎的日常，没有需要复盘的决定。'
        : '这一期有 <b>' + tl.count + ' 个</b>值得记住的决定（单笔 ≥ ¥' + tl.thresh + '）' +
          (imp.n ? '，其中 <b>' + imp.n + ' 个</b>是临时起意，合计 ¥' + wonI(imp.amount) +
            '，占本期支出 ' + Math.round(tl.impulseShare * 100) + '%' : '，没有一笔是临时起意') + '。';
      html += dimCard({
        key: 'decide', n: '②', title: '看决定',
        tag: sim.n ? '推演过 ' + sim.n + ' 笔' : '还没推演过', tagCls: sim.n ? 'info' : 'gray',
        line: decLine,
        body: (tl.count
          ? UI.chartTimeline(tl) +
            '<div class="row" style="gap:14px;margin-top:12px;flex-wrap:wrap">' +
            '<span class="ch-k"><i style="background:var(--lav-d)"></i>推演过 ' + sim.n + ' 笔 ¥' + wonI(sim.amount) + '</span>' +
            '<span class="ch-k"><i style="background:var(--mint-d)"></i>计划内 ' + pl.n + ' 笔 ¥' + wonI(pl.amount) + '</span>' +
            '<span class="ch-k"><i style="background:var(--coral)"></i>临时起意 ' + imp.n + ' 笔 ¥' + wonI(imp.amount) + '</span>' +
            '</div>'
          : '') +
          (tl.biggest ? '<div class="ch-note" style="margin-top:12px">最大的一笔是 ' +
            UI.esc(tl.biggest.merchant) + ' ¥' + wonI(tl.biggest.amount) + '（' +
            tl.biggest.date.slice(5).replace('-', '/') + ' · ' + tl.biggest.tagName + '）。' +
            (tl.clusters.length
              ? '另有 ' + tl.clusters.length + ' 组大额挤在 ' + tl.clusters[0].n + ' 天内，合计 ¥' +
                wonI(tl.clusters[0].amount) + '。'
              : '') + '</div>' : '') +
          '<button class="btn soft sm mt12" style="margin-top:12px" data-sandbox>下一笔先推演一遍</button>'
      });

      /* ============ ③ 看开源 ============
         这一维为什么必须单独有一格：预算是别人给的数，收入是自己能改的数。
         只有节流的产品会把人越管越紧。 */
      const earned = inc.earned;
      const openLine = earned > 0
        ? '自己挣了 <b>¥' + wonI(earned) + '</b>，占本期收入 ' + Math.round(inc.earnedShare * 100) + '%' +
          (c.prevIncome.earned > 0 ? '（上期 ¥' + wonI(c.prevIncome.earned) + '）' : '（上期一笔都没有）')
        : '本期收入全部来自家庭支持，<b>没有一笔是自己挣的</b>';
      const KIND_NAME = { earned: '自己挣的', family: '家庭支持', gift: '人情往来' };
      const incMax = inc.items.reduce((a, b) => Math.max(a, b.amount), 1);
      html += dimCard({
        key: 'open', n: '③', title: '看开源',
        tag: earned > 0 ? '有自有进项' : '全靠支持', tagCls: earned > 0 ? 'ok' : 'gray',
        line: openLine,
        body: (inc.items.length
          ? '<div class="rv-inc">' + inc.items.map(it =>
            '<div class="inc-r" data-kind="' + it.kind + '"><span class="k">' + UI.esc(it.name) + '</span>' +
            '<span class="tag ' + (it.kind === 'earned' ? 'ok' : 'gray') + '">' + KIND_NAME[it.kind] + '</span>' +
            '<span class="ib"><i style="width:' + Math.max(6, Math.round(it.amount / incMax * 100)) + '%"></i></span>' +
            '<span class="v mono">¥' + wonI(it.amount) + '</span></div>').join('') + '</div>'
          : '') +
          '<div class="ch-note" style="margin-top:12px">' +
          (earned > 0
            ? (inc.recurring.length
              ? '其中「' + inc.recurring.map(x => x.name).join('、') + '」上一期也有一笔 —— ' +
                '能重复的收入才是真的开源，一次性的奖金只能算运气。'
              : '这一期的自有收入都是一次性的（奖金 / 红包），下期不一定还有 —— 还不算"稳定的开源"。')
            : '节流有下限，开源没有。下面「下期怎么改」里给你留了一条 👇') +
          '</div>'
      });

      /* ============ ④ 和上期比 ============
         ★ 不再上锁：单月数字本来就需要参照系，拿它当"完成复盘的奖励"等于把答案
           扣在自己手里。原来的锁卡和那个转回本页的「去复盘」按钮一起删了。
         ★ 位置放在三个"看"之后、动手之前：先看清这一期，再比上一期，最后改一件。
         ★ 结论句只说判断、不重复数字（数字就在下面，而且要放大到能当主角）；
           两个大数各配一行"上期"当参照系 —— 光有 +92% 不知道从哪儿涨上来的。 */
      const cmpDown = r.expenseDelta <= 0;
      const saveUp = r.saveRate >= r.prevSaveRate;
      html += dimCard({
        key: 'compare', n: '④', title: '和上期比',
        tag: cmpDown ? '花得少' : '花得多', tagCls: cmpDown ? 'ok' : 'warn',
        line: (cmpDown ? '花得比上期少' : '花得比上期多') + '，' +
          (saveUp ? '存下来的比例也更高了' : '存下来的比例也小了'),
        body: '<div class="cmp2">' +
          '<div class="c2"><div class="k">支出环比</div>' +
          '<div class="v" style="color:' + (cmpDown ? 'var(--ok)' : 'var(--danger)') + '">' +
          (cmpDown ? '' : '+') + Math.round(r.expenseDelta * 100) + '<i>%</i></div>' +
          '<div class="s">上期 ¥' + wonI(r.prevExpense) + '</div></div>' +
          '<div class="c2"><div class="k">结余率</div>' +
          '<div class="v">' + Math.round(r.saveRate * 100) + '<i>%</i></div>' +
          '<div class="s">上期 ' + Math.round(r.prevSaveRate * 100) + '%</div></div>' +
          '</div>'
      });

      /* ============================================================
         下期怎么改 —— 整页的出口
         建议不是"要注意控制消费"那种读后感：每条都带一个具体参数改动，
         点了会先摊开 before → after 给你审核，通过了才生效。
         ============================================================ */
      html += sec('下期怎么改', adopted.length ? '已调整 ' + adopted.length + ' 条' : '可以多选');
      /* 只有最新一期能改：改的是"下期"这个参数，而预算表里只有当期这一行。
         翻到六月的复盘再点"下期预算调到 1900"，动的是**现在**的预算 ——
         那就成了改历史。过去的月份只复盘、不动手，这是页面必须守住的边界。 */
      const isLatest = cur === months[0];
      if (!isLatest) {
        html += '<div class="card flat"><div class="sm muted" style="line-height:1.75;text-align:center">' +
          '这一期已经过去了。<br>复盘可以回看，但能改的只有「下期」—— 也就是现在这一期。</div>' +
          '<button class="btn soft sm mt12" style="margin:14px auto 0" data-m="' + months[0] +
          '">回到本期调整</button></div>';
      } else {
        if (adopted.length) {
          html += '<div class="ad-done">' + adopted.map(a =>
            '<div class="ad-done-r"><span class="tick">✓</span><span>' +
            UI.esc(a.summary || '') + '</span></div>').join('') + '</div>';
        }
        const sugs = api.review.plan(cur);
        /* 已经采纳过的那条不再给选择框 —— 同一个改动改两次没有意义。
           比对用 change 的序列化结果：改的就是这几个参数，参数一样就是同一条。 */
        const doneKey = a => JSON.stringify(a.change || a);
        const done = {};
        adopted.forEach(a => { done[doneKey(a)] = true; });
        /* ★ 建议卡整张可点 = 多选。我们只提供建议，改几条由他决定：
           右上角那个圈是"选中"，选中之后**什么都不发生** ——
           一直到最下面那个「确定」为止。 */
        html += '<div class="sugs">' + sugs.map(s => {
          const got = !!done[doneKey(s)];
          const on = RV_PICK.indexOf(s.id) >= 0;
          return '<div class="sug' + (got ? ' got' : '') + (on ? ' on' : '') +
            '" data-sug="' + s.id + '"' + (got ? '' : ' data-toggle="' + s.id + '"') + '>' +
            '<div class="sug-h"><span class="sug-i">' + s.icon + '</span>' +
            '<b>' + UI.esc(s.title) + '</b>' +
            (got ? '<span class="tag ok">已采纳</span>' : '<span class="sug-tick"></span>') + '</div>' +
            '<div class="sug-w">' + UI.esc(s.why) + '</div>' +
            '<div class="sug-d">' + (s.diff || []).map(d =>
              '<span class="dl">' + UI.esc(d.k) + '</span>' +
              '<span class="df">' + UI.esc(d.from) + '</span>' +
              '<span class="arw">→</span>' +
              '<span class="dt">' + UI.esc(d.to) + '</span>').join('') + '</div>' +
            '</div>';
        }).join('') + '</div>';

        /* 自己说一条：不给"只能选我们给的"这种局面。
           自己说的那条**和选中的建议平级**，一起进最终审核。 */
        html += '<div class="rv-say">' +
          '<input id="rvSay" placeholder="也可以自己说一条，比如「下个月预算压到 2200」">' +
          '<button class="btn sm" id="rvSayBtn">加进清单</button>' +
          '</div>';
        html += '<div id="rvCustomList">' + RV_CUSTOM.map(rvCustomRow).join('') + '</div>';

        /* ★ 整页唯一一个"动手"的按钮：选完了再点它，中间什么都不发生 */
        const nSel = RV_PICK.length + RV_CUSTOM.length;
        html += '<button class="btn mt16" id="rvGo"' + (nSel ? '' : ' disabled') + '>' +
          (nSel ? '确定这 ' + nSel + ' 条' : '先选一条，可以多选') + '</button>';
        html += '<div class="xs muted" style="margin-top:10px;line-height:1.7;text-align:center">' +
          '可以多选。点了「确定」还会先摊开改前 → 改后给你过一遍，确认了才真的改。</div>';
      }

      if (rules.length) {
        html += '<div class="rv-rules"><div class="xs muted" style="margin-bottom:8px">你已经定下的下期约定</div>' +
          rules.slice(-4).reverse().map(x =>
            '<div class="rule-r"><span class="dot"></span>' + UI.esc(x.text) +
            '<span class="xs muted">' + String(x.mk || '').slice(2) + '</span></div>').join('') + '</div>';
      }

      if (isLatest) {
        html += '<div class="xs muted" style="margin-top:16px;line-height:1.8">' +
          '复盘不是打分，也不是交作业 —— 看完这一期，把下一期要改的数字定下来，' +
          '这次复盘就算完成了。改完它会出现在成长档案里的「预算管理」维度。</div>';
      }
      html += '<div style="height:30px"></div></div></div></div>';
      return html;
    },
    mount(el, ctx) {
      const mk = ctx.params.month || ctx.api.review.available()[0];
      /* 换期就清空选择：上一期选的条目和这一期的建议不是一回事 */
      if (RV_MK !== mk) { RV_MK = mk; RV_PICK = []; RV_CUSTOM = []; }
      /* ★ 切月 = 整块报告横移（007）。机制照抄 slideTo：
         · 旧体脱流让位（.ghost）并向一侧让 24%、压暗到 .5；新体从另一侧进。
         · 方向看 chip 的**空间下标**（同 slideTo：往左边的 chip 走 → 新体从左进、
           旧体往右让）。★ 不按月份字符串判 —— 月 chip 是「新的在左」，
           字符串方向和空间方向正好相反，照字符串判每一下都会朝别扭的方向走。
         · 可打断：代号计数器 + 先把上一次立刻收尾（同 _settleZoom 的道理）。
         ★ 不走 ctx.replace：它内部是 push()，会给**整页**（连 chip 行）再来一次
           340ms 横移，还会挂 R.animating 互斥锁 —— 月 chip 连点会被静默吞掉，
           这正是 006 那版"逻辑有点问题"的根。 */
      el.querySelectorAll('[data-m]').forEach(b => b.onclick = () => {
        const mkNew = b.getAttribute('data-m');
        if (!mkNew || mkNew === mk) return;            /* 点当前月：不动，别白闪一下 */
        const stage = el.querySelector('.rv-stage');
        if (!stage) return ctx.replace('youth.review', { month: mkNew });

        /* 先把上一次切月立刻收尾：用户点了就该有反应。
           ★ 必须**先收尾再取当前报告体** —— 上一次的 ghost 也叫 .rv-body，
             先取后清会拿到一个马上要被移除的节点，新体就没人让位，
             连点时会叠出两块裸报告体（probe-motion 的连点用例抓过这个 bug）。 */
        stage.querySelectorAll('.rv-body.ghost').forEach(g => g.remove());
        stage.querySelectorAll('.rv-body.live').forEach(x => x.classList.remove('live'));
        const box = stage.querySelector('.rv-body');
        if (!box) return ctx.replace('youth.review', { month: mkNew });

        const chips = [].slice.call(el.querySelectorAll('[data-m]'));
        const curIdx = chips.findIndex(x => x.getAttribute('data-m') === mk);
        const nextIdx = chips.findIndex(x => x.getAttribute('data-m') === mkNew);
        const goLeft = curIdx >= 0 && nextIdx < curIdx;   /* 目标 chip 在左边 */
        /* 选中态立刻挪到新 chip：轨道不动，但"点中了哪个"必须马上变
           （探针 probe-motion 抓的就是这个 —— 只换报告体忘了这一步是真 bug）。 */
        chips.forEach(x => x.classList.toggle('on', x === b));

        /* 换期 = 换一套建议：先清选择态再渲染新体，否则新体带着旧月的选中圈 */
        RV_MK = mkNew; RV_PICK = []; RV_CUSTOM = [];
        const ctx2 = Object.assign({}, ctx, {
          params: Object.assign({}, ctx.params, { month: mkNew })
        });
        const tmp = document.createElement('div');
        tmp.innerHTML = P['youth.review'].render(ctx2);
        const fresh = tmp.querySelector('.rv-body');
        if (!fresh) return ctx.replace('youth.review', { month: mkNew });

        RV_GEN += 1;
        const myGen = RV_GEN;

        box.classList.add('ghost', goLeft ? 'behind-r' : 'behind');
        fresh.classList.add('live', goLeft ? 'enter-l' : 'enter');
        fresh.setAttribute('data-swapdir', goLeft ? 'from-left' : 'from-right');  /* 探针证人 */
        stage.insertBefore(fresh, box.nextSibling);
        void fresh.offsetWidth;          /* 强制回流：起点必须先落地，同 slideTo */
        fresh.classList.remove('enter', 'enter-l');

        /* 月份写回 router 条目 —— 数据刷新才会用新月份重渲染，不会退回旧月 */
        const ent = (LJ.router && LJ.router.current && LJ.router.current()) || null;
        if (ent && ent.params) ent.params.month = mkNew;

        /* 新体里的按钮/输入框/选择圈要活：重新接线（mount 幂等，onclick 覆盖式） */
        P['youth.review'].mount(el, ctx2);

        setTimeout(() => {
          if (myGen !== RV_GEN) return;             /* 已被后来的切月取代 */
          if (box.parentNode) box.remove();
          fresh.classList.remove('live');
        }, UI.motion('--dur-ui') + 10);
      });
      go(el, ctx);   /* 各维度里的 data-go */
      el.querySelectorAll('[data-sandbox]').forEach(n => n.onclick = () => {
        if (LJ.openSpendSheet) LJ.openSpendSheet();
      });

      const go2 = el.querySelector('#rvGo');
      const customBox = el.querySelector('#rvCustomList');
      /* 选中的建议 + 自己说的那条，平级合成一份清单 */
      const picked = () => ctx.api.review.plan(mk)
        .filter(s => RV_PICK.indexOf(s.id) >= 0)
        .map(s => ({ title: s.title, why: s.why, diff: s.diff, change: s.change }))
        .concat(RV_CUSTOM);
      const syncGo = () => {
        if (!go2) return;
        const n = picked().length;
        go2.disabled = n === 0;
        go2.textContent = n ? '确定这 ' + n + ' 条' : '先选一条，可以多选';
      };
      /* 自己说的那几条：删一条就重画整段（数量少，重画比逐个改 DOM 稳） */
      const renderCustom = () => {
        if (!customBox) return;
        customBox.innerHTML = RV_CUSTOM.map(rvCustomRow).join('');
        customBox.querySelectorAll('[data-cr-x]').forEach(b => b.onclick = () => {
          RV_CUSTOM.splice(Number(b.getAttribute('data-cr-x')), 1);
          renderCustom(); syncGo();
        });
      };
      syncGo();

      /* 整张卡可点 = 多选。点一下只改圈，不落库、不弹层 —— 什么都不发生 */
      el.querySelectorAll('[data-toggle]').forEach(n => n.onclick = () => {
        const id = n.getAttribute('data-toggle');
        const i = RV_PICK.indexOf(id);
        if (i >= 0) RV_PICK.splice(i, 1); else RV_PICK.push(id);
        n.classList.toggle('on', i < 0);
        syncGo();
      });

      /* 自己说一条 → 助手翻译成具体改动 → 加进清单（还不落库） */
      const say = el.querySelector('#rvSay');
      const sayBtn = el.querySelector('#rvSayBtn');
      if (sayBtn) sayBtn.onclick = () => {
        const t = (say.value || '').trim();
        if (!t) return UI.toast('先说一句你想怎么改');
        const a = ctx.api.review.classify(t, mk);
        if (!a) return UI.toast('这条我翻译不出来，换个说法试试');
        RV_CUSTOM.push({
          title: '我按你说的这条改', raw: t, note: a.note,
          diff: a.diff, change: a.change
        });
        say.value = '';
        renderCustom(); syncGo();
        UI.toast('已加进清单，可以再选几条');
      };
      if (say) say.onkeydown = e => { if (e.key === 'Enter') sayBtn.click(); };

      /* 最下面那一个按钮：一次审核全部选中项 */
      if (go2) go2.onclick = () => {
        const list = picked();
        if (!list.length) return UI.toast('先选一条');
        openAdoptSheet(ctx, mk, list);
      };
    }
  };
  /* ============================================================
     问问 · 智能助手
     布局参考：居中大问句 + 底部胶囊输入条
     ============================================================ */

  /** 当前对话的 id（一段对话 = aiChat 表里的一条记录） */
  let AI_CUR = null;

  /** 当前对话的消息流。内存里的真身，重渲染不丢；每次变动写回 store */
  let AI_THREAD = [];

  /** 上一次渲染时已经见过的消息条数（006）。
      整页重渲染（Chats.save 触发）不许让旧消息重放动画 —— 只有
      AI_THREAD.length 变了才给新出现的那一段加 .new。模块级、不写
      localStorage，刷新重置是有意的（理由同上面的 AI_CUR）。 */
  let AI_ANIM_N = null;

  /** 相对时间：对话列表里的「刚刚 / 3 小时前 / 昨天 / 9月16日」 */
  function fmtWhen(ts) {
    if (!ts) return '较早';
    const d = Date.now() - ts;
    if (d < 60000) return '刚刚';
    if (d < 3600000) return Math.floor(d / 60000) + ' 分钟前';
    if (d < 86400000) return Math.floor(d / 3600000) + ' 小时前';
    if (d < 172800000) return '昨天';
    const dt = new Date(ts);
    return (dt.getMonth() + 1) + '月' + dt.getDate() + '日';
  }

  /* ------------------------------------------------------------
     历史对话：一段对话 = 一条 aiChat 记录 { id, title, at, turns }
     标题取第一句提问。写库走 LJ.store，所以「清空数据 / 重新生成
     种子数据」会一起把它清掉，和账本数据同生共死。
     ------------------------------------------------------------ */
  const Chats = LJ.aiChats = {
    all() {
      return LJ.store.all('aiChat').slice().sort((a, b) => (b.at || 0) - (a.at || 0));
    },
    get(id) { return id ? LJ.store.find('aiChat', id) : null; },

    titleOf(t) {
      const s = String(t || '').replace(/\s+/g, ' ').trim();
      if (!s) return '新对话';
      return s.length > 14 ? s.slice(0, 14) + '…' : s;
    },

    /** 把内存里的消息流写回 store（没有就建一段，有就覆盖） */
    save(firstText) {
      const now = Date.now();
      let row = Chats.get(AI_CUR);
      if (!row) {
        row = { id: LJ.store.uid('chat'), at: now, title: Chats.titleOf(firstText), turns: [] };
        AI_CUR = row.id;
      }
      row.at = now;
      row.title = Chats.titleOf(firstText || row.title);
      row.turns = AI_THREAD.slice();
      if (LJ.store.find('aiChat', row.id)) {
        LJ.store.update('aiChat', row.id, { at: row.at, title: row.title, turns: row.turns });
      } else {
        LJ.store.insert('aiChat', row);
      }
      return row;
    },

    /** 打开一段旧对话：整段消息流换掉 */
    open(id) {
      const row = Chats.get(id);
      if (!row) return false;
      AI_CUR = id;
      AI_THREAD = (row.turns || []).slice();
      return true;
    },

    /** 起一段新的（旧的那段留在历史里） */
    fresh() { AI_CUR = null; AI_THREAD = []; },

    remove(id) {
      /* 先清内存再删库：删的是当前这段对话时，store 那一发 data:aiChat
         会立刻触发整页重渲染，此刻消息流必须已经是空的，否则会重画旧内容 */
      if (AI_CUR === id) { AI_CUR = null; AI_THREAD = []; }
      LJ.store.remove('aiChat', id);
    },

    /* 注意：save / remove 会 emit data:aiChat，路由监听到就整页重渲染了，
       所以这两条路径不要再手动调 ctx.refreshTop()，否则渲染两遍。
       open / fresh 只动内存，必须自己调 refreshTop。 */
    cur() { return AI_CUR; },
    turns() { return AI_THREAD; }
  };

  /** 四角星标（品牌色渐变） */
  function aiSpark(size) {
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 48 48">' +
      '<defs><linearGradient id="ljSparkG" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0%" stop-color="#5E9BF0"/>' +
      '<stop offset="36%" stop-color="#B394F5"/>' +
      '<stop offset="70%" stop-color="#FE7563"/>' +
      '<stop offset="100%" stop-color="#FFD166"/>' +
      '</linearGradient></defs>' +
      '<path d="M24 2c2 13 9 20 22 22-13 2-20 9-22 22-2-13-9-20-22-22 13-2 22-9 22-22z" ' +
      'fill="url(#ljSparkG)"/></svg>';
  }

  /** 回答正文的轻量富文本：**加粗** + 换行 */
  function aiRich(s) {
    return UI.esc(s)
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/\n/g, '<br>');
  }

  /* 给第 i 段加 .new（006）：只给"这次新出现的"加，旧消息重渲染不重放。
     判据是 AI_ANIM_N —— 上一次渲染见过的条数。 */
  function aiTurn(t, i) {
    const fresh = AI_ANIM_N !== null && i >= AI_ANIM_N ? ' new' : '';
    if (t.role === 'me') {
      return '<div class="ai-turn me' + fresh + '"><div class="ai-mine">' + UI.esc(t.text) + '</div></div>';
    }
    const a = t.answer || {};
    return '<div class="ai-turn bot' + fresh + '">' +
      '<div class="ai-spark-sm">' + aiSpark(20) + '</div>' +
      '<div class="ai-ans">' +
      '<div class="ai-ans-t">' + UI.esc(a.title || '') + '</div>' +
      (a.body ? '<div class="ai-ans-b">' + aiRich(a.body) + '</div>' : '') +
      (a.stats && a.stats.length ? '<div class="ai-stats">' + a.stats.map(s =>
        '<div class="ai-stat"><div class="k">' + UI.esc(s.k) + '</div>' +
        '<div class="v">' + UI.esc(s.v) + '</div></div>').join('') + '</div>' : '') +
      (a.actions && a.actions.length ? '<div class="ai-acts">' + a.actions.map(o =>
        '<button class="ai-act" data-go="' + UI.esc(o.to) + '" data-params=\'' +
        JSON.stringify(o.params || {}) + '\'>' + UI.esc(o.label) + '</button>').join('') + '</div>' : '') +
      '</div></div>';
  }

  /* ------------------------------------------------------------
     历史对话抽屉（顶部三条杠打开）
     ------------------------------------------------------------ */
  function openHistory(ctx) {
    function rowHtml(c) {
      const n = Math.ceil(((c.turns || []).length) / 2);
      return '<div class="ch-row' + (c.id === AI_CUR ? ' on' : '') + '">' +
        '<button class="ch-open" data-chat="' + UI.esc(c.id) + '">' +
        '<span class="ch-ic">' + UI.icon('chat', 17) + '</span>' +
        '<span class="ch-tx">' +
        '<span class="ch-t">' + UI.esc(c.title || '新对话') + '</span>' +
        '<span class="ch-m">' + fmtWhen(c.at) + (n ? ' · ' + n + ' 轮' : '') + '</span>' +
        '</span>' +
        '</button>' +
        '<button class="ch-del" data-del="' + UI.esc(c.id) + '" title="删除这段对话">✕</button>' +
        '</div>';
    }

    return UI.drawer({
      head: '<div class="drawer-head">' +
        '<div class="dh-row">' +
        '<div style="min-width:0">' +
        '<h3>历史对话</h3>' +
        '<div class="dh-sub"></div>' +
        '</div>' +
        '<button class="drawer-new" data-newchat>' + UI.icon('plus', 16) + '新对话</button>' +
        '</div></div>',
      mount(panel, close) {
        const bodyEl = panel.querySelector('.drawer-body');
        const subEl = panel.querySelector('.dh-sub');

        function paint() {
          const rows = Chats.all();
          if (subEl) {
            subEl.textContent = rows.length
              ? '共 ' + rows.length + ' 段 · 只存在这台设备上'
              : '只存在这台设备上';
          }
          bodyEl.innerHTML = rows.length
            ? rows.map(rowHtml).join('')
            : '<div class="ch-empty">还没有历史对话。<br>在上面问一句，这里就会留下一条。</div>';

          bodyEl.querySelectorAll('[data-chat]').forEach(b => {
            b.onclick = () => {
              if (!Chats.open(b.getAttribute('data-chat'))) return;
              close();
              ctx.refreshTop();
              UI.toast('已回到这段对话，可以接着问');
            };
          });
          bodyEl.querySelectorAll('[data-del]').forEach(b => {
            b.onclick = () => {
              Chats.remove(b.getAttribute('data-del'));   // 触发 data:aiChat → 整页刷新
              paint();                                     // 抽屉自己的列表也要重画
              UI.toast('已删除这段对话');
            };
          });
        }

        panel.querySelector('[data-newchat]').onclick = () => {
          Chats.fresh();
          close();
          ctx.refreshTop();
        };

        paint();
      }
    });
  }

  P['youth.ai'] = {
    title: '临界顾问', chrome: 'tab', hideNav: true,
    render(ctx) {
      const caps = ctx.api.ai.caps();

      let html = '<div class="ai">';

      /* 顶部栏：左边三条杠开历史对话，右边开一段新的 */
      html += '<div class="ai-top">' +
        '<button class="ai-ic" data-history title="历史对话">' + UI.icon('menu', 21) + '</button>' +
        '<div class="ai-model">临界顾问' + UI.icon('chevron', 15) + '</div>' +
        '<button class="ai-ic" data-new title="新建对话">' + UI.icon('compose', 19) + '</button>' +
        '</div>';

      /* 主体 */
      html += '<div class="ai-body" id="aiBody">';
      if (!AI_THREAD.length) {
        html += '<div class="ai-hero">' +
          '<div class="ai-spark">' + aiSpark(44) + '</div>' +
          '<div class="ai-q">需要我为你<br>做些什么？</div>' +
          /* ★ 能力引导：把能力名直接摆出来，用户才知道能问什么 */
          '<div class="ai-caps">' + caps.map(c =>
            '<button class="ai-cap" data-ask="' + UI.esc(c.ask) + '">' +
            '<span class="ic">' + c.icon + '</span>' +
            '<span class="tx"><b>' + UI.esc(c.name) + '</b>' +
            '<i>' + UI.esc(c.tagline) + '</i></span>' +
            '</button>').join('') +
          '</div>' +
          '<div class="ai-tip">我只看得到你自己的账本，数据不会离开这台设备</div>' +
          '</div>';
      } else {
        /* 传下标：aiTurn 据此判断哪几段是"这次新出现的"（006）。
           整页重渲染时 AI_ANIM_N 已等于当前条数，旧消息不会重放。 */
        html += AI_THREAD.map(aiTurn).join('');
        html += '<div style="height:14px"></div>';
      }
      html += '</div>';
      /* 渲染完就记下"见过多少条"，供下一次渲染判断新增 */
      AI_ANIM_N = AI_THREAD.length;

      /* 底部输入条 */
      html += '<div class="ai-bar">' +
        '<button class="ai-bar-b" data-noop>' + UI.icon('plus', 22) + '</button>' +
        '<input id="aiInput" placeholder="问问临界顾问" autocomplete="off">' +
        '<button class="ai-bar-b" data-noop>' + UI.icon('mic', 20) + '</button>' +
        '<button class="ai-send" id="aiSend">' + UI.icon('send', 19) + '</button>' +
        '</div>';

      html += '</div>';
      return html;
    },
    mount(el, ctx) {
      const input = el.querySelector('#aiInput');
      const body = el.querySelector('#aiBody');
      /* 滚到底：改 smooth（006）。原来 setTimeout(…, 40) 硬跳 ——
         回答刚分层冒出来，视口却"啪"地跳走，把入场动画整个跳没了。
         behavior:'smooth' 让滚动和入场一起走，眼睛跟得上。 */
      const toBottom = () => {
        if (!body) return;
        try { body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' }); }
        catch (e) { body.scrollTop = body.scrollHeight; }
      };

      const send = (text) => {
        const q = String(text || '').trim();
        if (!q) return;
        const first = !AI_THREAD.length;
        AI_THREAD.push({ role: 'me', text: q });
        let ans = null;
        try { ans = ctx.api.ai.ask(q); }
        catch (e) { ans = { title: '出了点问题', body: String(e.message || e) }; }
        AI_THREAD.push({ role: 'bot', answer: ans });
        /* 首屏 hero（spark + 问句 + 能力卡）随第一条消息淡出上移（006）：
           在 Chats.save 触发重渲染之前打上 .go —— 重渲染会整块换掉它，
           这一步只是让"退场"有个交代，不是必须等它播完。 */
        if (first) {
          const hero = el.querySelector('.ai-hero');
          if (hero) hero.classList.add('go');
        }
        /* 第一句提问决定这段对话的标题；写完 store 会触发整页重渲染 */
        Chats.save(first ? q : null);
        setTimeout(toBottom, UI.motion('--dur-fade'));
      };

      el.querySelectorAll('[data-ask]').forEach(b => {
        b.onclick = () => send(b.getAttribute('data-ask'));
      });

      /* 开一段新的对话：旧的留在历史里，不清掉 */
      el.querySelectorAll('[data-new]').forEach(b => {
        b.onclick = () => {
          if (!AI_THREAD.length) return UI.toast('现在就是一段新对话');
          Chats.fresh();
          ctx.refreshTop();
          UI.toast('已新建对话，刚才那段存进历史了');
        };
      });

      /* 三条杠 → 历史对话抽屉 */
      el.querySelectorAll('[data-history]').forEach(b => {
        b.onclick = () => openHistory(ctx);
      });

      el.querySelectorAll('[data-go]').forEach(n => {
        n.onclick = () => {
          let p = {};
          try { p = JSON.parse(n.getAttribute('data-params') || '{}'); } catch (e) { }
          ctx.go(n.getAttribute('data-go'), p);
        };
      });

      const sb = el.querySelector('#aiSend');
      if (sb) sb.onclick = () => { send(input.value); input.value = ''; };
      if (input) {
        input.onkeydown = (e) => {
          if (e.key === 'Enter') { send(input.value); input.value = ''; }
        };
      }

      /* 深链预置提问：?p=youth.ai&ask=这个月还够花吗 */
      if (LJ._aiPendingAsk) {
        const q0 = LJ._aiPendingAsk;
        LJ._aiPendingAsk = null;
        send(q0);
        return;
      }
      /* 回到已有对话：等一帧让 DOM 量得出 scrollHeight，再平滑滚到底 */
      if (AI_THREAD.length) setTimeout(toBottom, UI.motion('--dur-fade'));
    }
  };

  /* ============================================================
     场景化资金规划
     ============================================================ */
  P['youth.scenario'] = {
    title: '场景化规划', chrome: 'plain', keepAlive: true,
    render(ctx) {
      const api = ctx.api;
      const id = ctx.params.id || 'term_start';
      const plan = api.ai.plan(id);
      if (!plan) return UI.empty('🤔', '找不到这个场景');
      const applied = api.ai.applied();

      let html = '<div class="pad">';
      html += '<div class="row" style="gap:8px;padding:14px 2px 0;overflow-x:auto">' +
        E.SCENARIOS.map(s => '<button class="chip ' + (s.id === id ? 'on' : '') + '" data-sc="' + s.id + '">' +
          s.icon + ' ' + s.name + '</button>').join('') + '</div>';

      html += '<div class="card mt16">' +
        '<div style="font-size:17px;font-weight:700">' + plan.scenario.icon + ' ' + plan.scenario.name + '</div>' +
        '<div class="sm t2" style="margin-top:8px;line-height:1.75">' + UI.esc(plan.scenario.hint) + '</div>' +
        '<div class="row between mt16" style="margin-top:16px;padding-top:14px;border-top:1px solid var(--line-2)">' +
        '<span class="sm t2">参考总额</span><span class="mono" style="font-size:17px;font-weight:600">¥' + U.won(plan.total) + '</span>' +
        '</div>' +
        '<div class="xs muted" style="margin-top:6px">基于你当前月预算 ¥' + U.won(plan.base) + ' 分配</div>' +
        '</div>';

      html += sec('参考分配方案', '<span class="more">可逐项调整</span>');
      html += '<div class="list">' + plan.items.map((it, i) =>
        '<div class="li"><div class="ico" style="background:' + it.color + '18;color:' + it.color + '">' + it.icon + '</div>' +
        '<div class="grow"><div style="font-size:14px;font-weight:500">' + UI.esc(it.name) + '</div>' +
        '<div class="xs muted" style="margin-top:3px">' + UI.esc(it.note) + '</div></div>' +
        '<input class="sc-input" data-i="' + i + '" data-cat="' + it.category + '" type="number" value="' + it.amount + '" ' +
        'style="width:86px;height:36px;border:1px solid var(--line);border-radius:9px;text-align:right;' +
        'padding:0 10px;font-family:var(--mono);font-size:14px;outline:none;background:var(--card)">' +
        '</div>').join('') + '</div>';

      html += '<div class="card mt16" id="scSum"></div>';

      if (applied.indexOf(id) >= 0) {
        html += '<div class="card flat mt16"><div class="row between">' +
          '<span class="sm" style="font-weight:600;color:var(--ok)">已采纳并应用到预算</span>' +
          '<span class="stamp">已应用</span></div>' +
          '<div class="xs muted" style="margin-top:8px">方案已写入本月分类预算，可在预算设置里继续微调。</div></div>';
      } else {
        html += '<button class="btn mt20" id="scApply">采纳并应用到本月预算</button>';
        html += '<div class="xs muted" style="text-align:center;margin-top:10px">采纳后仍可随时调整，不会锁定你的支出</div>';
      }
      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      const inputs = Array.from(el.querySelectorAll('.sc-input'));
      const base = ctx.api.ai.plan(ctx.params.id || 'term_start').base;
      function sync() {
        const sum = inputs.reduce((s, i) => s + (Number(i.value) || 0), 0);
        const diff = sum - base;
        el.querySelector('#scSum').innerHTML =
          '<div class="row between"><span class="sm t2">方案合计</span><span class="mono">¥' + U.won(sum) + '</span></div>' +
          '<div class="row between mt8" style="margin-top:8px"><span class="sm t2">与月预算差额</span>' +
          '<span class="mono" style="color:' + (Math.abs(diff) < 1 ? 'var(--ok)' : diff > 0 ? 'var(--warn)' : 'var(--text-2)') + '">' +
          (diff > 0 ? '+' : '') + U.won(diff) + '</span></div>';
      }
      inputs.forEach(i => i.oninput = sync); sync();

      el.querySelectorAll('[data-sc]').forEach(b => b.onclick = () =>
        ctx.replace('youth.scenario', { id: b.getAttribute('data-sc') }));

      const ap = el.querySelector('#scApply');
      if (ap) ap.onclick = () => {
        const cats = {};
        inputs.forEach(i => { cats[i.getAttribute('data-cat')] = Number(i.value) || 0; });
        const total = Object.values(cats).reduce((a, b) => a + b, 0);
        UI.confirm({
          title: '采纳这个方案？',
          desc: '方案会写入本月的分类预算，之后仍可随时修改。',
          okText: '采纳',
          onOk() {
            ctx.api.ai.applyScenario(ctx.params.id);
            const cur = ctx.api.budget.get() || { total: 2300, categories: {} };
            ctx.api.budget.set({ total: Math.max(total, cur.total || 0), categories: { ...cur.categories, ...cats } });
            UI.toast('已应用到本月预算');
          }
        });
      };
    }
  };

  /* ============================================================
     成长中心
     ============================================================ */
  P['youth.grow'] = {
    title: '成长中心', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const c = api.dashboard().control;
      const sum = api.task.summary();
      const ms = api.milestone.list();
      const cert = api.cert.get();

      let html = '<div class="pad">';
      /* 顶部就是首页那张紫色成长卡（LJ.growCard 同一函数渲染），
         也是共享元素转场的落点。
         ★ 尺寸和首页**完全一致**（346x122）—— 不加宽、不放大。
         为什么：卡片只要要缩放，克隆就得每帧按新尺寸重新光栅（合成层复用不了），
         那正是"到最后卡一下"的主因。等尺寸之下克隆只做平移，全程走合成器，最省最顺。
         所以层级说明和认证条件放卡下面单独一块，不塞进卡里。
         去掉 › 是因为已经在这一页了。 */
      const ev = LJ.evStats(api);
      html += LJ.growCard(c, sum, ms.length,
        { chevron: false, attrs: ' data-shared-grow', ev });
      /* 层级说明 + 认证条件：卡里放不下（放了就得把卡撑高，卡一高就要缩放） */
      html += '<div class="card mt12" style="text-align:center;padding:14px 16px">' +
        '<div class="sm muted">' + M.LEVELS[c.levelIndex].desc + '</div>' +
        '<div class="xs muted" style="margin-top:8px">' +
        (cert.eligible ? '已具备生成财务掌控力认证报告的条件'
          : '还差 ' + cert.need + ' 分进入自主期') +
        '</div></div>';

      /* ① 今天练一次 —— 近 7 天的 5 个动作。
            从「成长任务」页提上来：练一次是日常，任务清单是档案。
            每条挂〔留痕〕标 —— 让"练一次"和"能力证据"当着用户的面挂钩。 */
      html += sec('今天练一次', '<span class="more">近 7 天 ' + ev.wk.done + ' / ' + ev.wk.total + '</span>');
      html += '<div class="list" data-tour-actions>' + ev.wk.list.map(a =>
        '<div class="li"><div class="ico" style="background:' + (a.done ? '#DFFAEC' : '#F1F0F5') + '">' +
        (a.done ? '✅' : '⬜') + '</div>' +
        '<div class="grow"><div class="ellipsis" style="font-size:14px;font-weight:600' +
        (a.done ? ';color:var(--muted)' : '') + '">' + UI.esc(a.name) + '</div>' +
        '<div class="xs muted" style="margin-top:2px">' + UI.esc(a.why) + ' · 会留下能力证据</div></div>' +
        (a.done
          ? '<span class="tag ok">已留痕</span>'
          : (a.go ? '<button class="btn xs" data-do="' + UI.esc(a.go) + '" data-params=\'' +
            JSON.stringify(a.goParams || {}) + '\'>' + UI.esc(a.goLabel || '去做') + '</button>'
            : '')) +
        '</div>').join('') + '</div>';

      /* ② 能力轨迹详情 —— 四维 + 每一条都能对上号。
            "可核验"是这块的灵魂：分数是产品给的，动作是他自己做的。

         ★ 四条条"长出来"（006）：UI.bar 生成的是终值宽度，元素一出生就填满了，
           app.css 里那条 width 过渡从来没触发过 —— 产品最想让人觉得"积累出来"
           的东西，每次出现都已经积累完了。
           两帧技巧：这里先渲染 width:0 + data-grow="目标%"，mount 的下一帧
           才写真实宽度。首次进成长页只演一次（LJ._growSeen），再进不重放。 */
      html += sec('能力轨迹', '<span class="more">已攒 ' + ev.total + ' 次</span>');
      html += '<div class="card gr-anim" data-tour-evidence style="padding:16px 18px">' +
        LJ.DIMS.map(d => {
          const n = ev.dimSum[d] || 0;
          const pct = (Math.max(0, Math.min(1, n / Math.max(1, ev.total) * 3)) * 100).toFixed(1);
          return '<div style="margin-bottom:12px"><div class="row between">' +
            '<span class="sm">' + d + '</span>' +
            '<span class="xs mono muted">' + n + ' 次</span></div>' +
            '<div class="mt8" style="margin-top:6px">' +
            '<div class="bar"><i style="width:0;background:var(--ink)" data-grow="' + pct + '%"></i></div>' +
            '</div></div>';
        }).join('') +
        '<div class="xs muted" style="font-weight:700;letter-spacing:.04em;padding-top:10px;' +
        'border-top:1px solid var(--line-2)">这 ' + ev.total + ' 次是哪些动作</div>' +
        (ev.list.length
          ? ev.list.map(e => '<div class="row gr-row" style="gap:8px;margin-top:7px">' +
            '<span style="color:var(--ok);font-weight:800">·</span>' +
            '<span class="sm" style="line-height:1.6">' + UI.esc(e.text) + '</span></div>').join('')
          : '<div class="sm muted" style="margin-top:8px">还没有主动动作的记录，从上面「今天练一次」开始。</div>') +
        '<div class="xs muted" style="margin-top:12px;line-height:1.7">' +
        '只计白名单动作（调预算、砍订阅、做复盘、存目标、应风险、还预支）；' +
        '浏览、记一笔、权限调整都不算 —— 那些衡量的是勤奋和边界，不是能力。</div>' +
        '</div>';

      html += sec('成长任务进度');
      html += '<div class="list">' + E.LEVELS.map(l => {
        const b = sum.levels[l.id];
        return rowLi(['🌱', '📈', '🎯'][E.LEVELS.indexOf(l)],
          ['#DFFAEC', '#EDE9FB', '#EDE9FB'][E.LEVELS.indexOf(l)],
          l.name + '阶段', l.desc,
          '<span class="tag ' + (b.done === b.total ? 'ok' : 'gray') + '">' + b.done + '/' + b.total + '</span>',
          'data-go="youth.tasks"');
      }).join('') + '</div>';

      /* ③ 练习场 —— 能力是练出来的。六个格子对上"练什么"：
            场景推演 / 知识 / 风险 / 消费认知（消费人格） / 前瞻（平行人生） / 复盘。
            消费人格与平行人生是产品的两块招牌，从「问问」的二级里提出来摆在明面上。 */
      html += sec('练习场');
      const prCard = (ico, name, sub, kind, val) =>
        '<button class="card flat pr-card" ' +
        (kind === 'go' ? 'data-go="' + val + '"' : 'data-ask-go="' + UI.esc(val) + '"') + '>' +
        '<div style="font-size:20px">' + ico + '</div>' +
        '<div style="font-size:14px;font-weight:600;margin-top:8px">' + name + '</div>' +
        '<div class="xs muted" style="margin-top:3px">' + sub + '</div></button>';
      html += '<div class="grid2">' +
        prCard('🧪', '情景沙盘', '没发生的花销先演一遍', 'go', 'youth.scenario') +
        prCard('📚', '理财阶梯', '按你的阶段分层科普', 'go', 'youth.finance') +
        prCard('🛡', '风险警示', '反诈与风险演练', 'go', 'youth.risk') +
        prCard('🎴', '消费人格', '我是个怎么花钱的人', 'ask', '我是个怎么花钱的人') +
        prCard('🌌', '平行人生', '照这样下去，两年后的我', 'ask', '照现在这样下去，两年后我会变成什么样') +
        prCard('📈', '周期复盘', '结论 → 依据 → 下一步', 'go', 'youth.review') +
        '</div>';

      html += sec('成长纪念');
      /* 认证是任务解锁出来的（t_indep 掌控指数进入自主期）。
         没解锁时仍然显示这一行，但点进去是一张"完成任务解锁"的卡 ——
         藏起来的话，用户只会以为产品没这个功能。 */
      const certOpen = ctx.api.unlock.has('cert_report');
      const saveOpen = ctx.api.unlock.has('savings_goal');
      html += '<div class="list">' +
        rowLi('📜', '#EDE9FB', '财务掌控力认证',
          certOpen ? (cert.eligible ? '可以生成报告了' : '还差 ' + cert.need + ' 分')
            : '🔒 ' + ctx.api.unlock.reason('cert_report'),
          '<div class="muted">›</div>', 'data-go="youth.cert"') +
        rowLi('📖', '#FFF0D4', '成长纪念册', '记录这些年的支持与成长节点', '<div class="muted">›</div>', 'data-go="youth.album"') +
        rowLi('🎯', '#EDE9FB', '共同储蓄目标',
          saveOpen ? '和家人一起存一笔钱' : '🔒 ' + ctx.api.unlock.reason('savings_goal'),
          '<div class="muted">›</div>', 'data-go="youth.savings"') +
        '</div>';

      html += sec('最近的里程碑');
      html += '<div class="list">' + ms.slice(0, 4).map(m =>
        rowLi(m.icon, '#F7F6FA', m.name, UI.esc(m.desc) + ' · ' + U.ymdCN(m.date))).join('') + '</div>';

      html += '</div>';
      return html;
    },
    mount(el, ctx) {
      go(el, ctx);
      /* 「去做」：跳到对应功能页，做完回来会重新判定动作 */
      el.querySelectorAll('[data-do]').forEach(b => b.onclick = () => {
        let p = {};
        try { p = JSON.parse(b.getAttribute('data-params') || '{}'); } catch (e) { }
        ctx.go(b.getAttribute('data-do'), p);
      });
      /* 消费人格 / 平行人生：带着预置提问进临界顾问 */
      el.querySelectorAll('[data-ask-go]').forEach(b => b.onclick = () => {
        LJ._aiPendingAsk = b.getAttribute('data-ask-go');
        ctx.go('youth.ai');
      });

      /* 能力轨迹四条条长出来（006）：首次进成长页只演一次（LJ._growSeen），
         再进不重放 —— 和 UI.fold 的 foldOpen 同一处理方式：模块级、不写
         localStorage，刷新重置是有意的。
         两帧技巧：条出生时是 width:0（render 里写死的），这里下一帧才写真实
         宽度，过渡才有起点。四维之间 60ms 错开，总计 ≤ 700ms。 */
      const anim = el.querySelector('.gr-anim');
      if (anim && !LJ._growSeen) {
        LJ._growSeen = true;
        const bars = anim.querySelectorAll('.bar > i[data-grow]');
        const rows = anim.querySelectorAll('.gr-row');
        const STEP = UI.motion('--dur-stagger-r');      // 行间错开步长 35ms
        rows.forEach((r, i) => { r.style.animationDelay = (i * STEP) + 'ms'; });
        /* 下一帧写真实宽度：起点和终点分到两帧，过渡才有得播。
           ★ rAF 在无头 / 后台标签页会被节流甚至不触发（同 UI.countTo 的坑），
           所以补一个 setTimeout 兜底，保证条最终一定长到目标 ——
           否则会永远卡在 width:0（那比"没有动画"更糟）。 */
        let grown = false;
        const grow = () => {
          if (grown) return;
          grown = true;
          bars.forEach((b, i) => {
            /* 四维之间错开：--dur-stagger × 1.5（60ms 档），总计 ≤ 700ms */
            b.style.transitionDelay = (i * UI.motion('--dur-stagger') * 1.5) + 'ms';
            b.style.width = b.getAttribute('data-grow');
            /* 探针证人：生长真的发生了，且终值是 render 时记下的目标 */
            b.setAttribute('data-grew', '1');
          });
        };
        requestAnimationFrame(grow);
        setTimeout(grow, 40);
      } else if (anim) {
        /* 已演过（同会话再进）：直接给终值，不再有过渡 */
        anim.querySelectorAll('.bar > i[data-grow]').forEach(b => {
          b.style.width = b.getAttribute('data-grow');
          b.setAttribute('data-grew', '1');
        });
      }
    }
  };

  /* ============================================================
     成长任务
     ============================================================ */
  P['youth.tasks'] = {
    title: '成长任务', chrome: 'plain',
    render(ctx) {
      const tasks = ctx.api.task.list();
      const sum = ctx.api.task.summary();
      /* 哪些任务的 reward 是真门禁 —— 在任务卡上标出来，
         否则"解锁：预算偏差提醒"只是一句文案，用户没法验证 */
      const unlockOf = (taskId) => LJ.engine.UNLOCKS.find(u => u.taskId === taskId) || null;
      let html = '<div class="pad">';
      html += '<div class="card mt16"><div class="row between">' +
        '<div><div class="xs muted">已完成</div>' +
        '<div class="mono" style="font-size:28px;font-weight:600;margin-top:4px">' + sum.done +
        '<span class="u" style="font-size:14px;color:var(--muted)"> / ' + sum.total + '</span></div></div>' +
        '<div style="text-align:right;width:150px">' + UI.bar(sum.done / sum.total) +
        '<div class="xs muted" style="margin-top:8px">全部任务聚焦能力养成，与收入无关</div></div>' +
        '</div></div>';

      /* ---------- 近 7 天的动作 ----------
         下面的 12 项全是「结果达标」（"连续 3 个月预算执行率 > 85%"），
         要等三个月才知道做没做。动作任务反过来：这周做了没有，当天就有反馈。
         任务从"考勤"变成"作业" —— 这是这一版把成长从打分改成做事的关键。 */
      const wk = ctx.api.task.actions();
      html += sec('近 7 天的动作', '<span class="more">' + wk.done + ' / ' + wk.total + '</span>');
      html += '<div class="card" style="padding:14px 16px">' +
        '<div class="xs muted" style="line-height:1.7;margin-bottom:4px">' +
        '这些不看分数，只看你最近 7 天有没有真的做过。做完当天就能看到反馈。</div>' +
        '</div>';
      html += '<div class="list mt12">' + wk.list.map(a =>
        '<div class="li" style="display:block;padding:14px 18px">' +
        '<div class="row between"><div class="row" style="gap:10px;min-width:0">' +
        '<span style="font-size:15px">' + (a.done ? '✅' : '⬜') + '</span>' +
        '<span class="sm" style="font-weight:700;' + (a.done ? 'color:var(--muted)' : '') + '">' +
        UI.esc(a.name) + '</span></div>' +
        (a.done ? '<span class="tag ok">' + a.count + ' 次</span>' : '') +
        '</div>' +
        '<div class="xs muted" style="margin-top:8px;line-height:1.65">' + UI.esc(a.why) + '</div>' +
        (!a.done && a.go
          ? '<button class="btn xs" style="margin-top:10px" data-do="' + UI.esc(a.go) +
            '" data-params=\'' + JSON.stringify(a.goParams || {}) + '\'>' + UI.esc(a.goLabel || '去做') + '</button>'
          : '') +
        '</div>').join('') + '</div>';

      E.LEVELS.forEach((lv, idx) => {
        const b = sum.levels[lv.id];
        html += sec(lv.name + '阶段', '<span class="more">' + b.done + ' / ' + b.total + '</span>');
        html += '<div class="list">' + b.list.map(t =>
          '<div class="li" style="display:block;padding:16px 18px">' +
          '<div class="row between"><div class="row" style="gap:10px">' +
          '<span style="font-size:15px">' + (t.done ? '✅' : '⬜') + '</span>' +
          '<span class="sm" style="font-weight:700;' + (t.done ? 'color:var(--muted)' : '') + '">' + UI.esc(t.name) + '</span>' +
          '</div>' + (t.done ? '<span class="tag ok">已完成</span>' : '<span class="tag gray">进行中</span>') + '</div>' +
          '<div class="xs muted" style="margin-top:9px;line-height:1.65">' + UI.esc(t.desc) + '</div>' +
          '<div class="xs" style="margin-top:6px;color:var(--text-2);font-weight:600">解锁：' +
          UI.esc(t.reward) +
          (unlockOf(t.id)
            ? '<span class="tag ' + (t.done ? 'ok' : 'gray') + '" style="margin-left:7px">' +
              (t.done ? '已解锁' : '未解锁') + '</span>'
            : '') + '</div>' +
          '<div class="row" style="gap:8px;margin-top:11px">' +
          (!t.done && t.go ? '<button class="btn xs" data-do="' + UI.esc(t.go) + '" data-params=\'' +
            JSON.stringify(t.goParams || {}) + '\'>' + UI.esc(t.goLabel || '去做') + '</button>' : '') +
          (!t.claimed && t.done ? '<button class="btn soft xs" data-claim="' + t.id + '">领取奖励</button>' : '') +
          (t.claimed ? '<span class="xs muted" style="align-self:center">奖励已领取</span>' : '') +
          '</div>' +
          '</div>').join('') + '</div>';
      });

      html += '<div class="proto mt20"><div class="ph"><span class="seal">说</span>关于奖励</div>' +
        '<div class="xs t2" style="line-height:1.8">奖励全部是产品内的功能解锁与身份认证，' +
        '不涉及现金、返现或任何形式的金钱激励。这个体系想养成的是能力，不是刺激。</div></div>';

      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      el.querySelectorAll('[data-claim]').forEach(b => b.onclick = () => {
        ctx.api.task.claim(b.getAttribute('data-claim'));
        UI.toast('已领取，解锁内容已生效');
      });
      /* 「去做」：跳到对应功能页，做完回来会重新判定任务 */
      el.querySelectorAll('[data-do]').forEach(b => b.onclick = () => {
        let p = {};
        try { p = JSON.parse(b.getAttribute('data-params') || '{}'); } catch (e) { }
        ctx.go(b.getAttribute('data-do'), p);
      });
    }
  };

  /* ============================================================
     认证报告
     ============================================================ */
  P['youth.cert'] = {
    title: '掌控力认证', chrome: 'plain',
    render(ctx) {
      /* 任务门禁：认证由「掌控指数进入自主期」这项任务解锁。
         没解锁就只给一张锁卡 —— 连"还差多少分"都不显示，
         因为那是解锁之后的下一道门槛（达标才能生成）。 */
      if (ctx.api.unlock.locked('cert_report')) {
        return '<div class="pad">' + LJ.lockedCard(ctx, 'cert_report', {
          title: '财务掌控力认证',
          sub: '这是一份给毕业时用的能力凭证，先完成对应任务再来看'
        }) + '</div>';
      }
      const cert = ctx.api.cert.get();
      if (!cert.eligible) {
        let html = '<div class="pad">';
        html += '<div class="card mt16" style="text-align:center;padding:28px 16px">' +
          '<div style="font-size:36px">🔒</div>' +
          '<div style="font-size:17px;font-weight:700;margin-top:12px">还没有达到认证条件</div>' +
          '<div class="sm muted" style="margin-top:10px;line-height:1.75">' + UI.esc(cert.message) + '</div>' +
          '<div class="mt16" style="margin-top:18px">' + UI.bar(cert.score / 100) + '</div>' +
          '<div class="row between xs muted" style="margin-top:8px"><span>当前 ' + cert.score + '</span><span>目标 80</span></div>' +
          '</div>';
        html += sec('还差在哪里');
        html += '<div class="list">' + cert.dims.map(d =>
          rowLi(d.score >= 80 ? '✓' : '·', d.score >= 80 ? '#DFFAEC' : '#F7F6FA', d.name,
            d.desc, '<span class="mono sm" style="color:' + (d.score >= 80 ? 'var(--ok)' : 'var(--text-2)') + '">' + Math.round(d.score) + '</span>')).join('') + '</div>';
        html += '<button class="btn ghost mt20" data-go="youth.control">查看提升建议</button>';
        html += '<div style="height:30px"></div></div>';
        return html;
      }

      let html = '<div class="pad">';
      html += '<div class="card mt16" style="padding:24px 20px;position:relative;overflow:hidden">' +
        '<div style="position:absolute;right:-30px;top:-30px;width:130px;height:130px;border-radius:50%;background:#F4F3F7"></div>' +
        '<div class="row between" style="position:relative">' +
        '<div><div class="xs muted" style="letter-spacing:.16em">FINANCIAL SELF-MANAGEMENT</div>' +
        '<div style="font-size:17px;font-weight:700;margin-top:8px">个人财务掌控力认证</div></div>' +
        '<span class="stamp">已认证</span></div>' +
        '<div class="row between mt16" style="margin-top:20px;position:relative">' +
        '<div><div class="xs muted">持有人</div><div style="font-size:15px;font-weight:600;margin-top:4px">' +
        UI.esc(cert.holder || '本人') + '</div></div>' +
        '<div style="text-align:right"><div class="xs muted">认证等级</div>' +
        '<div style="font-size:15px;font-weight:600;margin-top:4px;color:var(--navy)">' + cert.level + '</div></div>' +
        '</div>' +
        '<div class="mt16" style="margin-top:18px;padding-top:16px;border-top:1px dashed var(--line);position:relative">' +
        '<div class="row between"><span class="xs muted">统计区间</span>' +
        '<span class="sm mono">' + cert.period.from + ' ~ ' + cert.period.to + '</span></div>' +
        '<div class="row between mt8" style="margin-top:8px"><span class="xs muted">记录跨度</span>' +
        '<span class="sm mono">' + cert.period.days + ' 天</span></div>' +
        '<div class="row between mt8" style="margin-top:8px"><span class="xs muted">综合得分</span>' +
        '<span class="sm mono" style="font-weight:600">' + cert.score + ' / 100</span></div>' +
        '</div>' +
        '<div class="sm t2" style="margin-top:16px;line-height:1.85;position:relative">' + UI.esc(cert.conclusion) + '</div>' +
        '<div class="xs muted" style="margin-top:14px;position:relative">签发日期 ' + cert.issuedAt + '</div>' +
        '</div>';

      html += sec('能力构成');
      html += '<div class="card" style="text-align:center">' +
        '<div style="display:flex;justify-content:center">' + UI.radar(cert.dims, 190) + '</div></div>';
      html += '<div class="list mt12">' + cert.dims.map(d =>
        '<div class="li"><div class="grow"><div class="row between"><span class="sm">' + d.name + '</span>' +
        '<span class="mono sm">' + Math.round(d.score) + '</span></div>' +
        '<div class="mt8" style="margin-top:7px">' + UI.bar(d.score / 100) + '</div></div></div>').join('') + '</div>';

      html += sec('关键事实');
      html += '<div class="grid3">' +
        '<div class="metric"><div class="k">覆盖大类</div><div class="v">' + cert.categoryCount + '<span class="u">类</span></div></div>' +
        '<div class="metric"><div class="k">最大支出类</div><div class="v" style="font-size:15px">' + UI.esc(cert.topCategory.name) + '</div></div>' +
        '<div class="metric"><div class="k">资金可持续</div><div class="v">' + cert.health.runway + '<span class="u">天</span></div></div>' +
        '</div>';

      html += '<div class="proto mt20"><div class="ph"><span class="seal">用</span>这份认证有什么用</div>' +
        '<div class="xs t2" style="line-height:1.8">' +
        '它不是给别人看的资质，而是你自己的一个节点：从这一刻起，' +
        '你可以选择继续保留家庭支持通道，也可以逐步把它收起来。' +
        '产品会一直给你留着的那个蓝色状态（自主充足），就是这个意思。</div></div>';

      html += '<div class="row mt20" style="gap:10px">' +
        '<button class="btn ghost" id="certExport" style="flex:1">导出保存</button>' +
        '<button class="btn" data-go="youth.album" style="flex:1">存入成长纪念册</button></div>';
      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      go(el, ctx);
      const ex = el.querySelector('#certExport');
      if (ex) ex.onclick = () => UI.toast('已生成报告（本机模拟导出）');
    }
  };

  /* ============================================================
     理财知识引导
     ============================================================ */
  P['youth.finance'] = {
    title: '理财知识引导', chrome: 'plain',
    render(ctx) {
      const c = ctx.api.dashboard().control;
      const STAGES = [
        {
          id: 'entry', name: '零钱管理', icon: '🪙',
          for: '刚开始有结余的时候',
          desc: '先解决"钱放在哪里不会随手花掉"。',
          points: [
            '把每个月结余的一小部分固定转入一个不常用的账户，用途先不定',
            '应急储备的目标是覆盖 1~2 个月的支出，不用更多',
            '不要因为"有余额"就提高消费水平'
          ]
        },
        {
          id: 'mid', name: '稳健积累', icon: '📗',
          for: '结余稳定、能持续 3 个月以上的时候',
          desc: '在保住本金的前提下，让闲钱不贬值。',
          points: [
            '只考虑风险等级低、可随时取用的产品',
            '任何承诺固定高收益的都是骗局，没有例外',
            '先分清"应急钱"和"长期钱"，再考虑怎么放'
          ]
        },
        {
          id: 'high', name: '多元配置', icon: '📊',
          for: '有稳定结余且应急储备已到位',
          desc: '理解风险和收益的关系，而不是追逐收益。',
          points: [
            '先想清楚这笔钱多久不用，再决定放哪里',
            '分散不是买得越多越好，而是相关性要低',
            '不要用生活费、学费、借来的钱做任何投资'
          ]
        }
      ];
      const cur = c.levelIndex;

      let html = '<div class="pad">';
      html += '<div class="proto mt16"><div class="ph"><span class="seal">提</span>先说清楚</div>' +
        '<div class="sm t2" style="line-height:1.8">这一页只做知识科普，<b>不推荐任何具体产品、不引导开通、不承诺收益</b>。' +
        '内容按你当前的理财阶段分层，看不看、什么时候看，都由你决定。</div></div>';

      STAGES.forEach((s, i) => {
        const active = i <= cur;
        html += sec(s.name + '阶段', active ? '<span class="more">' + (i === cur ? '当前阶段' : '已具备条件') + '</span>' : '<span class="more">未到</span>');
        html += '<div class="card' + (i === cur ? '' : ' flat') + '" style="' + (i === cur ? 'border:1.5px solid var(--navy)' : '') + '">' +
          '<div class="row between"><div class="row" style="gap:10px">' +
          '<span style="font-size:20px">' + s.icon + '</span>' +
          '<div><div class="sm" style="font-weight:600">' + s.name + '</div>' +
          '<div class="xs muted" style="margin-top:3px">适合：' + s.for + '</div></div></div>' +
          (i === cur ? '<span class="tag info">当前</span>' : active ? '<span class="tag ok">可达</span>' : '<span class="tag gray">待解锁</span>') +
          '</div>' +
          '<div class="sm t2" style="margin-top:12px">' + UI.esc(s.desc) + '</div>' +
          (active ? '<div class="mt12" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line-2)">' +
            s.points.map(p => '<div class="xs t2" style="line-height:1.85;margin-bottom:6px">· ' + UI.esc(p) + '</div>').join('') +
            '</div>' : '') +
          '</div>';
      });

      /* ---------- 阶梯式了解（3.3.4 第 2 条）----------
         上面那三段是**知识**，这一段是**按你自己的情况排的顺序**。

         ★ 三条自己给自己上的约束，也是合规底线：
           ① 只到"类型"，不点名任何具体产品 —— 写出产品名就从"科普"变"导购"；
           ② 不出现任何收益数字 —— 收益一旦写出来，"建议性质"就站不住；
           ③ 准入条件由**数据**算，不由分数定 —— 看的是应急储备够不够、
              结余稳不稳，而不是"掌控指数到 80 分就解锁"。
              分数是产品给的，条件是生活给的。 */
      const g = ctx.api.finance.guide();
      const rd = g.readiness;
      html += sec('按你的情况排的顺序', '<span class="more">不是按分数</span>');
      html += '<div class="card flat"><div class="xs muted" style="line-height:1.8">' +
        '判断依据只有两条事实：应急储备能覆盖 <b>' + rd.runway + ' 天</b>，' +
        '近 6 个月里有 <b>' + rd.posMonths + ' / ' + rd.monthsCounted + '</b> 个月有结余。' +
        '和你的掌控指数无关。</div></div>';

      html += '<div class="list mt12">' + g.tiers.map(t =>
        '<div class="li" style="display:block;padding:15px 18px">' +
        '<div class="row between"><div class="row" style="gap:10px;min-width:0">' +
        '<span style="font-size:17px">' + t.icon + '</span>' +
        '<div style="min-width:0"><div class="sm" style="font-weight:700">' + UI.esc(t.name) + '</div>' +
        '<div class="xs muted" style="margin-top:3px">' + UI.esc(t.what) + '</div></div></div>' +
        (t.open ? '<span class="tag ok">可以了解</span>' : '<span class="tag gray">还差一步</span>') +
        '</div>' +
        '<div class="xs t2" style="margin-top:9px;line-height:1.7">' + UI.esc(t.why) + '</div>' +
        (t.open
          ? '<div class="xs muted" style="margin-top:5px">前提：' + UI.esc(t.need) + '</div>'
          : '<div class="xs" style="margin-top:7px;color:var(--text-2);font-weight:600;' +
            'background:var(--bg);border-radius:9px;padding:7px 10px">🔒 ' + UI.esc(t.gap) + '</div>') +
        '</div>').join('') + '</div>';

      /* 出口：只到"了解"，不到"开通"。跳转是模拟的 ——
         真实形态下这一步是跳去手机银行的产品页，交易发生在那里，
         这个产品不碰钱、不下单、不代销。 */
      const openTier = g.tiers[g.current] || g.tiers[0];
      html += '<button class="btn soft mt16" id="finGo">去手机银行了解「' +
        UI.esc(openTier.name) + '」</button>';
      html += '<div class="xs muted" style="margin-top:10px;line-height:1.75;text-align:center">' +
        '本产品不参与交易、不推荐具体产品、不承诺收益。<br>' +
        '是否了解、是否开通，完全由你自己决定。</div>';

      html += sec('风险提示');
      html += '<div class="card" style="background:#FFFFFF;border:1px dashed #E8C9B0">' +
        '<div class="xs t2" style="line-height:1.9">' +
        '· 任何承诺"保本高收益"的都是诈骗<br>' +
        '· 不要用生活费、学费或借来的钱做任何投资<br>' +
        '· 不要向任何人出借银行卡、账户或验证码<br>' +
        '· 遇到可疑情况先打 96110</div></div>';

      html += '<button class="btn ghost mt20" data-go="youth.service">遇到问题？联系客服</button>';
      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      go(el, ctx);
      const fg = el.querySelector('#finGo');
      if (fg) fg.onclick = () => UI.toast('会跳转到手机银行的产品页（本机模拟）');
    }
  };

  /* ============================================================
     成长纪念册
     ============================================================ */
  P['youth.album'] = {
    title: '成长纪念册', chrome: 'plain',
    render(ctx) {
      /* 完整成长档案要「保有一份 6 个月以上的完整账本」才解锁。
         记录跨度不够的时候，档案是残缺的 —— 与其给一份半成品，
         不如明说还差多少天。 */
      if (ctx.api.unlock.locked('full_archive')) {
        const st0 = ctx.api.album.stats();
        return '<div class="pad">' + LJ.lockedCard(ctx, 'full_archive', {
          title: '完整成长档案',
          sub: '现在记录了 ' + st0.days + ' 天，满 180 天之后这里会变成一份完整的档案'
        }) + '</div>';
      }
      const api = ctx.api;
      const list = api.album.list();
      const st = api.album.stats();
      let html = '<div class="pad">';
      html += '<div class="card mt16">' +
        '<div class="row between"><div><div class="xs muted">记录跨度</div>' +
        '<div class="mono" style="font-size:20px;font-weight:600;margin-top:4px">' + st.days + '<span class="u">天</span></div></div>' +
        '<div style="text-align:right"><div class="xs muted">累计支持</div>' +
        '<div class="mono" style="font-size:20px;font-weight:600;margin-top:4px">¥' + U.won(st.supportTotal) + '</div></div>' +
        '</div>' +
        '<div class="xs muted" style="margin-top:14px">' +
        st.from + ' 起 · 共 ' + st.entries + ' 条记账 · ' + st.supportCount + ' 笔支持记录</div>' +
        '</div>';

      html += '<div class="proto mt12"><div class="ph"><span class="seal">念</span>这不只是一份账单</div>' +
        '<div class="xs t2" style="line-height:1.8">' +
        '家人给过的每一笔支持、你自己迈过的每一个节点，都在这里。' +
        '它记录的是一段关系怎么从"给钱"慢慢变成"放手"。</div></div>';

      html += sec('时间轴', '<span class="more">' + list.length + ' 条</span>');
      html += '<div style="position:relative;padding-left:26px">' +
        '<div style="position:absolute;left:8px;top:6px;bottom:6px;width:1.5px;background:var(--line)"></div>' +
        list.slice(0, 60).map((it, i) =>
          '<div style="position:relative;margin-bottom:16px">' +
          '<div style="position:absolute;left:-23px;top:2px;width:15px;height:15px;border-radius:50%;' +
          'background:' + (it.kind === 'support' ? '#DFFAEC' : it.kind === 'goal' ? '#EDE9FB' : '#EDE9FB') +
          ';border:2px solid #fff;display:flex;align-items:center;justify-content:center;font-size:8px">' +
          (it.icon || '·') + '</div>' +
          '<div class="card flat" style="padding:12px 14px">' +
          '<div class="row between"><span class="sm" style="font-weight:600">' + UI.esc(it.title) + '</span>' +
          (it.amount ? '<span class="mono xs">¥' + U.won(it.amount) + '</span>' : '') + '</div>' +
          (it.desc ? '<div class="xs muted" style="margin-top:5px">' + UI.esc(it.desc) + '</div>' : '') +
          '<div class="xs muted" style="margin-top:5px">' + U.ymdCN(it.date) + '</div>' +
          '</div></div>').join('') +
        '</div>';

      html += '<button class="btn ghost mt20" id="albumExport">导出纪念册</button>';
      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el) {
      const b = el.querySelector('#albumExport');
      if (b) b.onclick = () => UI.toast('已生成（本机模拟导出）');
    }
  };

  /* ============================================================
     共同储蓄目标
     ============================================================ */
  P['youth.savings'] = {
    title: '共同储蓄目标', chrome: 'plain',
    render(ctx) {
      /* 任务门禁：结余率达到 15% 才解锁共同储蓄目标 */
      if (ctx.api.unlock.locked('savings_goal')) {
        return '<div class="pad">' + LJ.lockedCard(ctx, 'savings_goal', {
          title: '共同储蓄目标',
          sub: '先证明你有结余能力，再和家人一起定目标更有说服力'
        }) + '</div>';
      }
      const api = ctx.api;
      const list = api.savings.list();
      const me = api.profile();

      let html = '<div class="pad">';
      html += '<div class="proto mt16"><div class="ph"><span class="seal">同</span>一起存一笔钱</div>' +
        '<div class="sm t2" style="line-height:1.7">把"给钱"变成"一起完成一件事"。' +
        '双方各自存入，只看总进度，不显示谁存了多少。</div></div>';

      if (!list.length) {
        html += UI.empty('🎯', '还没有共同目标', '和家人一起定一个目标，比如毕业旅行、换台电脑。');
      } else {
        list.forEach(g => {
          const mine = (g.contributions || []).filter(c => c.userId === me.id).reduce((s, c) => s + c.amount, 0);
          const daysLeft = U.diffDays(LJ.clock.now(), g.dueDate);
          html += '<div class="card mt16" style="margin-bottom:14px">' +
            '<div class="row between"><div class="row" style="gap:10px">' +
            '<span style="font-size:20px">' + (g.icon || '🎯') + '</span>' +
            '<div><div style="font-size:17px;font-weight:700">' + UI.esc(g.title) + '</div>' +
            '<div class="xs muted" style="margin-top:3px">' + (daysLeft > 0 ? '还有 ' + daysLeft + ' 天' : '已到期') +
            (g.done ? ' · 已达成' : '') + '</div></div></div>' +
            (g.done ? '<span class="stamp">已达成</span>' : '') + '</div>' +

            '<div class="row between mt16" style="margin-top:16px;align-items:flex-end">' +
            '<div><div class="xs muted">已存</div>' +
            '<div class="mono" style="font-size:28px;font-weight:600;margin-top:3px">¥' + U.won(g.contributed) + '</div></div>' +
            '<div style="text-align:right"><div class="xs muted">目标</div>' +
            '<div class="mono" style="font-size:17px;font-weight:600;margin-top:3px;color:var(--text-2)">¥' + U.won(g.target) + '</div></div>' +
            '</div>' +
            '<div class="mt12" style="margin-top:12px">' + UI.bar(g.ratio, g.done ? 'var(--ok)' : 'var(--navy)') + '</div>' +
            '<div class="row between xs muted" style="margin-top:8px">' +
            '<span>' + Math.round(g.ratio * 100) + '%</span>' +
            '<span>还差 ¥' + U.won(g.remaining) + '</span></div>' +
            '<div class="row between xs muted" style="margin-top:6px">' +
            '<span>我的部分：¥' + U.won(mine) + '</span>' +
            '<span>共同进度只显示总额</span></div>' +

            '<div class="row mt16" style="gap:8px;margin-top:16px">' +
            '<button class="btn sm" data-save="' + g.id + '" style="flex:1">存入一笔</button>' +
            '<button class="btn ghost sm" data-detail="' + g.id + '" style="flex:1">查看明细</button>' +
            '</div></div>';
        });
      }

      html += '<button class="btn ghost mt20" id="newGoal">发起一个共同目标</button>';
      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      el.querySelectorAll('[data-save]').forEach(b => b.onclick = () => {
        const id = b.getAttribute('data-save');
        const g = ctx.api.savings.get(id);
        UI.sheet({
          title: '存入共同目标',
          sub: UI.esc(g.title) + ' · 还差 ¥' + U.won(g.remaining),
          body: '<div class="sec-title" style="margin-top:0">金额</div>' +
            '<input id="svAmt" type="number" placeholder="0.00" style="width:100%;height:48px;border:1px solid var(--line);' +
            'border-radius:12px;padding:0 14px;font-family:var(--mono);font-size:20px;outline:none;background:var(--card)">' +
            '<div class="sec-title">备注</div>' +
            '<input id="svNote" placeholder="选填，比如「省下来的」" style="width:100%;height:46px;border:1px solid var(--line);' +
            'border-radius:12px;padding:0 13px;outline:none;background:var(--card)">' +
            '<button class="btn mt20" id="svOk">存入</button>',
          mount(e2, close) {
            e2.querySelector('#svOk').onclick = () => {
              const a = Number(e2.querySelector('#svAmt').value);
              if (!(a > 0)) return UI.toast('请填写金额');
              ctx.api.savings.contribute(id, a, e2.querySelector('#svNote').value.trim());
              close(); UI.toast('已存入');
            };
          }
        });
      });
      el.querySelectorAll('[data-detail]').forEach(b => b.onclick = () => {
        const g = ctx.api.savings.get(b.getAttribute('data-detail'));
        UI.sheet({
          title: g.title,
          sub: '目标是双方共同进度，这里只列你自己存入的部分',
          body: '<div class="list">' + ((g.contributions || []).length
            ? g.contributions.map(c => {
              const u = LJ.store.find('user', c.userId) || { name: '—' };
              return '<div class="li"><div class="grow"><div class="sm" style="font-weight:500">' +
                UI.esc(c.note || '存入') + '</div><div class="xs muted" style="margin-top:3px">' +
                U.ymdCN(c.date) + ' · ' + UI.esc(u.name) + '</div></div>' +
                '<span class="mono sm">¥' + U.won(c.amount) + '</span></div>';
            }).join('')
            : '<div class="li"><div class="sm muted" style="text-align:center;width:100%">还没有存入记录</div></div>') + '</div>'
        });
      });
      el.querySelector('#newGoal').onclick = () => ctx.go('youth.savingsNew');
    }
  };

  /* ============================================================
     发起共同目标
     ============================================================ */
  P['youth.savingsNew'] = {
    title: '发起共同目标', chrome: 'plain', keepAlive: true,
    render() {
      const ICONS = ['🎯', '🏝', '💻', '📷', '🎸', '🚲', '🎓'];
      return '<div class="pad">' +
        '<div class="proto mt16"><div class="ph"><span class="seal">同</span>规则</div>' +
        '<div class="sm t2" style="line-height:1.7">双方各自存入，进度只显示总额，' +
        '不显示谁存了多少、谁存得更快。目标是"一起完成"，不是"谁付出更多"。</div></div>' +

        '<div class="sec-title">目标名称</div>' +
        '<input id="gTitle" placeholder="例如：毕业旅行基金" style="width:100%;height:46px;border:1px solid var(--line);' +
        'border-radius:12px;padding:0 13px;outline:none;background:var(--card)">' +

        '<div class="sec-title">图标</div>' +
        '<div class="row" style="gap:8px;flex-wrap:wrap">' + ICONS.map((ic, i) =>
          '<button class="cat ' + (i === 0 ? 'on' : '') + '" data-ic="' + ic + '" style="width:52px;padding:8px 0">' +
          '<span class="ci" style="margin-bottom:0">' + ic + '</span></button>').join('') + '</div>' +

        '<div class="sec-title">目标金额</div>' +
        '<input id="gTarget" type="number" placeholder="0.00" style="width:100%;height:48px;border:1px solid var(--line);' +
        'border-radius:12px;padding:0 14px;font-family:var(--mono);font-size:20px;outline:none;background:var(--card)">' +

        '<div class="sec-title">计划周期</div>' +
        '<div class="seg" id="gMonths">' +
        [3, 6, 12].map(m => '<button class="' + (m === 6 ? 'on' : '') + '" data-v="' + m + '">' + m + ' 个月</button>').join('') +
        '</div>' +

        '<div class="sec-title">双方承担比例</div>' +
        '<div class="seg" id="gShare">' +
        [['5:5', .5], ['6:4', .6], ['7:3', .7]].map(([l, v], i) =>
          '<button class="' + (i === 0 ? 'on' : '') + '" data-v="' + v + '">我 ' + l.split(':')[0] + '%</button>').join('') +
        '</div>' +
        '<div class="xs muted" style="margin-top:8px;padding:0 4px">比例只用于参考提示，实际进度始终按总额计算。</div>' +

        '<button class="btn mt20" id="gCreate">发起目标</button>' +
        '<div style="height:30px"></div></div>';
    },
    mount(el, ctx) {
      let icon = '🎯', months = 6, share = 0.5;
      el.querySelectorAll('[data-ic]').forEach(b => b.onclick = () => {
        icon = b.getAttribute('data-ic');
        el.querySelectorAll('[data-ic]').forEach(x => x.classList.toggle('on', x === b));
      });
      el.querySelectorAll('#gMonths button').forEach(b => b.onclick = () => {
        months = Number(b.getAttribute('data-v'));
        el.querySelectorAll('#gMonths button').forEach(x => x.classList.toggle('on', x === b));
      });
      el.querySelectorAll('#gShare button').forEach(b => b.onclick = () => {
        share = Number(b.getAttribute('data-v'));
        el.querySelectorAll('#gShare button').forEach(x => x.classList.toggle('on', x === b));
      });
      el.querySelector('#gCreate').onclick = () => {
        const title = el.querySelector('#gTitle').value.trim();
        const target = Number(el.querySelector('#gTarget').value);
        if (!title) return UI.toast('请填写目标名称');
        if (!(target > 0)) return UI.toast('请填写目标金额');
        const b = ctx.api.binding();
        ctx.api.savings.create({
          title, icon, target, months,
          shares: { [ctx.api.profile().id]: share, [b.supporterId]: 1 - share }
        });
        UI.toast('已发起，对方会收到通知');
        ctx.back();
      };
    }
  };

  /* ============================================================
     收到的支持邀约
     ============================================================ */
  P['youth.invites'] = {
    title: '收到的支持', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const list = api.invite.list();
      const pend = list.filter(i => i.status === 'pending');
      const done = list.filter(i => i.status !== 'pending');
      const from = api.partner();

      let html = '<div class="pad">';
      html += '<div class="proto mt16"><div class="ph"><span class="seal">礼</span>收下或谢绝，都可以</div>' +
        '<div class="sm t2" style="line-height:1.7">家人主动想给你一笔支持时，会先发一份邀约。' +
        '你可以选择收下，也可以谢绝——系统会用一个中性的说法告诉对方，不会显得冷淡。</div></div>';

      if (!pend.length) {
        html += UI.empty('📭', '没有待回应的邀约', '家人主动支持时会出现在这里。');
      } else {
        html += sec('待回应');
        html += pend.map(inv =>
          '<div class="card mt12" style="margin-bottom:12px;border-left:3px solid var(--accent)">' +
          '<div class="row between"><div><div class="sm muted">' + UI.esc((from || {}).name || '家人') +
          ' 想支持你' + (inv.occasion ? '（' + UI.esc(inv.occasion) + '）' : '') + '</div>' +
          '<div style="font-size:17px;font-weight:700;margin-top:6px">' + UI.esc(inv.title) + '</div></div>' +
          '<div class="mono" style="font-size:20px;font-weight:600">¥' + U.won(inv.amount) + '</div></div>' +
          (inv.note ? '<div class="sm t2" style="margin-top:12px;background:var(--bg);padding:11px 13px;border-radius:10px;line-height:1.7">' +
            UI.esc(inv.note) + '</div>' : '') +
          '<div class="row mt16" style="gap:8px;margin-top:16px">' +
          '<button class="btn sm" data-accept="' + inv.id + '" style="flex:1">收下</button>' +
          '<button class="btn ghost sm" data-decline="' + inv.id + '" style="flex:1">谢绝</button>' +
          '</div></div>').join('');
      }

      if (done.length) {
        html += sec('已处理');
        html += '<div class="list">' + done.map(inv =>
          rowLi(inv.status === 'accepted' ? '✅' : '🙏',
            inv.status === 'accepted' ? '#DFFAEC' : 'var(--line-2)',
            inv.title, U.ymdCN(inv.date) + (inv.status === 'accepted' ? ' · 已收下并计入账本' : ' · 已谢绝'),
            '<span class="mono sm">¥' + U.won(inv.amount) + '</span>')).join('') + '</div>';
      }

      html += '</div>';
      return html;
    },
    mount(el, ctx) {
      el.querySelectorAll('[data-accept]').forEach(b => b.onclick = () => {
        UI.confirm({
          title: '收下这份支持？', desc: '确认后会记入账本，双方各留存一笔对账记录。',
          okText: '收下',
          onOk() { ctx.api.invite.accept(b.getAttribute('data-accept')); UI.toast('已收下'); }
        });
      });
      el.querySelectorAll('[data-decline]').forEach(b => b.onclick = () => {
        const id = b.getAttribute('data-decline');
        const REASONS = ['这次先不用啦，谢谢', '我这边够用，留着下次吧', '想自己先试试看'];
        UI.sheet({
          title: '谢绝这份支持',
          sub: '选一句话告诉对方。系统会用一个中性的方式转达，不会显得冷淡。',
          body: REASONS.map((r, i) =>
            '<button class="btn ghost mt12" data-r="' + UI.esc(r) + '">' + UI.esc(r) + '</button>').join('') +
            '<div class="sec-title">也可以自己写一句</div>' +
            '<input id="dReason" placeholder="选填" style="width:100%;height:46px;border:1px solid var(--line);' +
            'border-radius:12px;padding:0 13px;outline:none;background:var(--card)">' +
            '<button class="btn mt20" id="dOk">确认谢绝</button>',
          mount(e2, close) {
            let reason = REASONS[0];
            e2.querySelectorAll('[data-r]').forEach(x => x.onclick = () => {
              reason = x.getAttribute('data-r');
              e2.querySelector('#dReason').value = reason;
              e2.querySelectorAll('[data-r]').forEach(y => y.classList.toggle('soft', y === x));
            });
            e2.querySelector('#dOk').onclick = () => {
              ctx.api.invite.decline(id, e2.querySelector('#dReason').value.trim() || reason);
              close(); UI.toast('已回应，对方会收到中性的提示');
            };
          }
        });
      });
    }
  };

  /* ============================================================
     预支与还款
     ============================================================ */
  P['youth.prepay'] = {
    title: '预支与还款', chrome: 'plain',
    render(ctx) {
      const list = ctx.api.prepay.list();
      let html = '<div class="pad">';
      html += '<div class="proto mt16"><div class="ph"><span class="seal">借</span>为什么要做预支</div>' +
        '<div class="sm t2" style="line-height:1.7">生活费周期中段需要一笔额外资金时，' +
        '预支把它变成一次有明确归还安排的资金调度，而不是又一次开口要钱。' +
        '这是一次对等的约定，不是欠人情。</div></div>';

      if (!list.length) {
        html += UI.empty('📄', '还没有预支记录', '需要时可以发起一次预支，约定分几期归还。');
      } else {
        list.forEach(p => {
          html += '<div class="card mt16" style="margin-bottom:14px">' +
            '<div class="row between"><div style="font-size:15px;font-weight:700">' + UI.esc(p.purpose) + '</div>' +
            (p.done ? '<span class="stamp">已还清</span>' : '<span class="tag ' + (p.status === 'active' ? 'warn' : 'gray') + '">' +
              (p.status === 'active' ? '归还中' : '已终止') + '</span>') + '</div>' +
            '<div class="row between mt16" style="margin-top:14px;align-items:flex-end">' +
            '<div><div class="xs muted">已归还</div>' +
            '<div class="mono" style="font-size:20px;font-weight:600;margin-top:3px">¥' + U.won(p.repaid) + '</div></div>' +
            '<div style="text-align:right"><div class="xs muted">预支总额</div>' +
            '<div class="mono" style="font-size:15px;font-weight:600;margin-top:3px;color:var(--text-2)">¥' + U.won(p.amount) + '</div></div>' +
            '</div>' +
            '<div class="mt12" style="margin-top:12px">' + UI.bar(p.ratio, p.done ? 'var(--ok)' : 'var(--navy)') + '</div>' +
            '<div class="row between xs muted" style="margin-top:8px">' +
            '<span>' + p.paidPeriods + ' / ' + p.periods + ' 期 · 每期 ¥' + U.won(p.perPeriod) + '</span>' +
            '<span>剩余 ¥' + U.won(p.remaining) + '</span></div>' +
            (!p.done && p.status === 'active' ?
              '<div class="row mt16" style="gap:8px;margin-top:16px">' +
              '<button class="btn sm" data-repay="' + p.id + '" style="flex:1">归还一期</button>' +
              '<button class="btn ghost sm" data-cancel="' + p.id + '" style="flex:1">终止计划</button></div>' : '') +
            '</div>';
        });
      }

      html += '<button class="btn ghost mt20" id="newPrepay">发起一次预支</button>';
      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      el.querySelectorAll('[data-repay]').forEach(b => b.onclick = () => {
        const p = ctx.api.prepay.get(b.getAttribute('data-repay'));
        UI.sheet({
          title: '归还一期',
          sub: '本期应还 ¥' + U.won(Math.min(p.perPeriod, p.remaining)) + '，归还后进度会同步给双方。',
          body: '<div class="sec-title" style="margin-top:0">归还金额</div>' +
            '<input id="rpAmt" type="number" value="' + Math.min(p.perPeriod, p.remaining).toFixed(2) + '" ' +
            'style="width:100%;height:48px;border:1px solid var(--line);border-radius:12px;padding:0 14px;' +
            'font-family:var(--mono);font-size:20px;outline:none;background:var(--card)">' +
            '<div class="sec-title">备注</div>' +
            '<input id="rpNote" placeholder="选填" style="width:100%;height:46px;border:1px solid var(--line);' +
            'border-radius:12px;padding:0 13px;outline:none;background:var(--card)">' +
            '<button class="btn mt20" id="rpOk">确认归还</button>',
          mount(e2, close) {
            e2.querySelector('#rpOk').onclick = () => {
              const a = Number(e2.querySelector('#rpAmt').value);
              if (!(a > 0)) return UI.toast('请填写金额');
              ctx.api.prepay.repay(p.id, a, e2.querySelector('#rpNote').value.trim());
              close(); UI.toast(p.remaining - a <= 0.01 ? '已全部还清' : '已归还一期');
            };
          }
        });
      });
      el.querySelectorAll('[data-cancel]').forEach(b => b.onclick = () => {
        UI.confirm({
          title: '终止这个预支计划？', desc: '终止后不再计算剩余期数，已有记录会保留。',
          okText: '终止',
          onOk() { ctx.api.prepay.cancel(b.getAttribute('data-cancel')); UI.toast('已终止'); }
        });
      });
      el.querySelector('#newPrepay').onclick = () => ctx.go('youth.prepayNew');
    }
  };

  /* ============================================================
     发起预支
     ============================================================ */
  P['youth.prepayNew'] = {
    title: '发起预支', chrome: 'plain', keepAlive: true,
    render(ctx) {
      const d = ctx.api.dashboard();
      return '<div class="pad">' +
        '<div class="proto mt16"><div class="ph"><span class="seal">约</span>这是一次对等的安排</div>' +
        '<div class="sm t2" style="line-height:1.7">你会告诉对方三件事：用途、金额、怎么还。' +
        '不需要解释每一笔开销，也不需要附带消费流水。</div></div>' +

        '<div class="sec-title">用途</div>' +
        '<input id="pPurpose" placeholder="例如：考证报名，分 2 期归还" style="width:100%;height:46px;' +
        'border:1px solid var(--line);border-radius:12px;padding:0 13px;outline:none;background:var(--card)">' +

        '<div class="sec-title">预支金额</div>' +
        '<input id="pAmount" type="number" placeholder="0.00" style="width:100%;height:48px;border:1px solid var(--line);' +
        'border-radius:12px;padding:0 14px;font-family:var(--mono);font-size:20px;outline:none;background:var(--card)">' +

        '<div class="sec-title">分几期归还</div>' +
        '<div class="seg" id="pPeriods">' + [1, 2, 3, 6].map(n =>
          '<button class="' + (n === 2 ? 'on' : '') + '" data-v="' + n + '">' + n + ' 期</button>').join('') + '</div>' +

        '<div class="card mt16" id="pPreview"></div>' +

        '<div class="proto mt16"><div class="ph"><span class="seal">示</span>对方会看到</div>' +
        '<div class="xs t2" style="line-height:1.8">用途、金额、分几期归还，以及你自己填写的说明。' +
        '不含任何消费流水。</div></div>' +

        '<button class="btn mt20" id="pSend">发起预支申请</button>' +
        '<div style="height:30px"></div></div>';
    },
    mount(el, ctx) {
      let periods = 2;
      const amt = el.querySelector('#pAmount'), purpose = el.querySelector('#pPurpose');
      function sync() {
        const a = Number(amt.value) || 0;
        const per = periods > 0 ? a / periods : a;
        el.querySelector('#pPreview').innerHTML =
          '<div class="row between"><span class="sm t2">每月归还</span><span class="mono">¥' + U.won(per) + '</span></div>' +
          '<div class="row between mt8" style="margin-top:8px"><span class="sm t2">归还期数</span><span class="mono">' + periods + ' 期</span></div>' +
          '<div class="row between mt8" style="margin-top:8px"><span class="sm t2">预计还清</span>' +
          '<span class="mono xs">' + U.addMonths(LJ.clock.now(), periods) + '</span></div>';
      }
      amt.oninput = sync;
      el.querySelectorAll('#pPeriods button').forEach(b => b.onclick = () => {
        periods = Number(b.getAttribute('data-v'));
        el.querySelectorAll('#pPeriods button').forEach(x => x.classList.toggle('on', x === b));
        sync();
      });
      sync();
      el.querySelector('#pSend').onclick = () => {
        const a = Number(amt.value);
        const p = purpose.value.trim();
        if (!p) return UI.toast('请填写用途');
        if (!(a > 0)) return UI.toast('请填写金额');
        ctx.api.prepay.create({ purpose: p, amount: a, periods });
        UI.toast('已发送，等待家人响应');
        ctx.back();
      };
    }
  };

  /* ============================================================
     账单导入
     ============================================================ */
  P['youth.import'] = {
    title: '导入账单', chrome: 'plain', keepAlive: true,
    render(ctx) {
      return '<div class="pad">' +
        '<div class="proto mt16"><div class="ph"><span class="seal">导</span>把账单批量带进来</div>' +
        '<div class="sm t2" style="line-height:1.8">' +
        '微信支付：公众号「微信支付」→ 我的账单 → 下载账单 → 选择「用于个人对账」→ 收到邮件后下载 CSV。<br>' +
        '支付宝：账单 → 开具交易流水证明 → 发送到邮箱。<br>' +
        '打开文件后全选复制，粘贴到下面的框里即可。</div></div>' +

        '<div class="sec-title">方式一 · 选择文件</div>' +
        '<input type="file" id="csvFile" accept=".csv,.txt" style="width:100%;font-size:14px;padding:10px 0">' +

        '<div class="sec-title">方式二 · 粘贴内容</div>' +
        '<textarea id="csvText" rows="6" placeholder="交易时间,交易类型,交易对方,商品,收/支,金额(元),支付方式..." ' +
        'style="width:100%;border:1px solid var(--line);border-radius:12px;padding:12px 13px;outline:none;' +
        'background:var(--card);resize:none;font-family:var(--mono);font-size:12.5px;line-height:1.6"></textarea>' +

        '<div class="row mt12" style="gap:10px">' +
        '<button class="btn ghost" id="useSample" style="flex:1">用样例数据试试</button>' +
        '<button class="btn" id="doParse" style="flex:1">解析</button></div>' +

        '<div id="parseResult" class="mt16"></div>' +
        '<div style="height:30px"></div></div>';
    },
    mount(el, ctx) {
      let rows = [];
      const file = el.querySelector('#csvFile');
      const text = el.querySelector('#csvText');
      const out = el.querySelector('#parseResult');

      function decode(buf) {
        // 先试 UTF-8，出现替换字符再退回 GBK
        let s = new TextDecoder('utf-8').decode(buf);
        if (s.indexOf('\uFFFD') >= 0) {
          try { s = new TextDecoder('gbk').decode(buf); } catch (e) { }
        }
        return s;
      }

      function doParse(content) {
        const res = ctx.api.import.parse(content);
        if (res.error) {
          out.innerHTML = '<div class="card" style="border-left:3px solid var(--danger)">' +
            '<div class="sm" style="font-weight:600;color:var(--danger)">解析失败</div>' +
            '<div class="xs t2" style="margin-top:6px;line-height:1.7">' + UI.esc(res.error) + '</div></div>';
          return;
        }
        rows = res.rows;
        const ins = rows.filter(r => r.direction === 'in').length;
        const outs = rows.filter(r => r.direction === 'out');
        const total = outs.reduce((s, r) => s + r.amount, 0);
        out.innerHTML =
          '<div class="card"><div class="row between">' +
          '<div><div class="xs muted">解析到</div>' +
          '<div class="mono" style="font-size:20px;font-weight:600;margin-top:4px">' + rows.length +
          '<span class="u" style="font-size:12.5px;color:var(--muted)"> 条</span></div></div>' +
          '<div style="text-align:right"><div class="xs muted">支出合计</div>' +
          '<div class="mono" style="font-size:17px;font-weight:600;margin-top:6px">¥' + U.won(total) + '</div></div>' +
          '</div>' +
          '<div class="xs muted" style="margin-top:12px">其中收入 ' + ins + ' 条，' +
          (res.skipped ? '跳过 ' + res.skipped + ' 条无法识别的行' : '全部识别成功') + '</div></div>' +

          '<div class="sec-title">核对资金来源<span class="more">' + rows.length + ' 条</span></div>' +
          '<div class="rv-bar"><span>一键全设为</span>' +
          '<button data-all="family">家庭支持金</button>' +
          '<button data-all="own">个人自有资金</button></div>' +
          '<div class="xs muted" style="padding:0 2px 10px;line-height:1.65">' +
          '账单里没有资金来源信息，下面是按关键词猜的。' +
          '点每行右侧的胶囊可以改，改完再导入。</div>' +
          '<div class="list" id="rvList">' + rows.slice(0, 30).map((r, i) => {
            const c = LJ.catById(r.category);
            const isIn = r.direction === 'in';
            /* 默认归属：生活费类关键词 → 支持金，其他收入 → 自有，支出 → 支持金 */
            if (!r.fundingSource) {
              const isSupport = isIn && /生活费|妈妈|爸爸|母亲|父亲|家人/.test((r.merchant || '') + (r.note || ''));
              r.fundingSource = isSupport ? 'family' : (isIn ? 'own' : 'family');
            }
            return '<div class="li"><div class="ico" style="background:' + (isIn ? '#DFFAEC' : c.color + '18') + '">' +
              (isIn ? '↓' : c.icon) + '</div>' +
              '<div class="grow" style="min-width:0"><div class="ellipsis" style="font-size:14px">' + UI.esc(r.merchant) + '</div>' +
              '<div class="xs muted" style="margin-top:3px">' + r.date + ' · ' + (isIn ? '收入' : c.name) + '</div></div>' +
              '<div style="text-align:right;flex:none">' +
              '<div class="amt ' + (isIn ? 'in' : 'out') + '">' + (isIn ? '+' : '−') + U.won(r.amount) + '</div>' +
              '<button class="rv-pill ' + r.fundingSource + '" data-rv="' + i + '">' +
              (r.fundingSource === 'family' ? '支持金' : '自有') + '</button>' +
              '</div></div>';
          }).join('') + '</div>' +
          (rows.length > 30 ? '<div class="xs muted" style="text-align:center;padding:10px 0">' +
            '另有 ' + (rows.length - 30) + ' 条未展示，一键设置会同时作用于它们</div>' : '') +
          '<button class="btn mt20" id="doImport">全部导入 ' + rows.length + ' 条</button>' +
          '<div class="xs muted" style="text-align:center;margin-top:10px">导入的记录会标记为「账单导入」，可随时删除</div>';

        /* 单行切换归属 */
        const paint = () => {
          out.querySelectorAll('[data-rv]').forEach(b => {
            const r = rows[Number(b.getAttribute('data-rv'))];
            b.className = 'rv-pill ' + r.fundingSource;
            b.textContent = r.fundingSource === 'family' ? '支持金' : '自有';
          });
        };
        out.querySelectorAll('[data-rv]').forEach(b => {
          b.onclick = () => {
            const r = rows[Number(b.getAttribute('data-rv'))];
            r.fundingSource = r.fundingSource === 'family' ? 'own' : 'family';
            paint();
          };
        });
        /* 一键批量 */
        out.querySelectorAll('[data-all]').forEach(b => {
          b.onclick = () => {
            const v = b.getAttribute('data-all');
            rows.forEach(r => { r.fundingSource = v; });
            paint();
            UI.toast('已全部设为' + (v === 'family' ? '家庭支持金' : '个人自有资金'));
          };
        });

        out.querySelector('#doImport').onclick = () => {
          const n = ctx.api.import.commit(rows);
          UI.toast('已导入 ' + n + ' 条记录');
          ctx.back();
        };
      }

      file.onchange = () => {
        const f = file.files[0];
        if (!f) return;
        const rd = new FileReader();
        rd.onload = () => {
          const content = decode(rd.result);
          text.value = content.slice(0, 20000);
          doParse(content);
        };
        rd.readAsArrayBuffer(f);
      };

      el.querySelector('#useSample').onclick = () => {
        const s = ctx.api.import.sample();
        text.value = s;
        doParse(s);
      };

      el.querySelector('#doParse').onclick = () => {
        const v = text.value.trim();
        if (!v) return UI.toast('请先选择文件或粘贴内容');
        doParse(v);
      };
    }
  };

  /* ============================================================
     智能客服
     ============================================================ */
  P['youth.service'] = {
    title: '客服与帮助', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      let html = '<div class="pad">';
      html += '<div class="card mt16" style="display:flex;align-items:center;gap:12px">' +
        '<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#161618,#2A2A2E);' +
        'display:flex;align-items:center;justify-content:center;color:#fff;font-size:17px">临</div>' +
        '<div class="grow"><div class="sm" style="font-weight:600">临界助手</div>' +
        '<div class="xs muted" style="margin-top:3px">7×24 在线 · 回答产品与权限相关问题</div></div>' +
        '</div>';

      html += '<div class="sec-title">问点什么</div>';
      html += '<input id="svQ" placeholder="例如：家人能看到我的明细吗" style="width:100%;height:46px;' +
        'border:1px solid var(--line);border-radius:12px;padding:0 13px;outline:none;background:var(--card)">';
      html += '<button class="btn mt12" id="svAsk">提问</button>';
      html += '<div id="svAns" class="mt16"></div>';

      html += '<div class="sec-title">常见问题</div>';
      html += api.service.FAQ.slice(0, 6).map((f, i) =>
        '<div class="card flat" style="margin-bottom:10px" data-faq="' + i + '">' +
        '<div class="row between"><span class="sm" style="font-weight:600;flex:1">' + UI.esc(f.q) + '</span>' +
        '<span class="muted" data-arrow>+</span></div>' +
        '<div class="sm t2" data-answer style="display:none;margin-top:10px;line-height:1.8;padding-top:10px;' +
        'border-top:1px solid var(--line-2)">' + UI.esc(f.a) + '</div></div>').join('');

      html += sec('紧急求助');
      html += '<div class="list">' + api.service.hotline().map(h =>
        rowLi('📞', '#FFE3DD', h.name, h.desc,
          h.tel ? '<span class="tag danger">' + h.tel + '</span>' : '<span class="tag gray">—</span>')).join('') + '</div>';

      /* ---------- 人工客服：真入口 ----------
         以前"需要人工协助"只是话术里的一句话，连按钮都没有。
         现在三条线都能落地：在线提工单、电话拨号、反诈优先接入。 */
      const tickets = api.service.tickets();
      html += sec('人工客服', tickets.length ? '<span class="more">' + tickets.length + ' 张工单</span>' : '');
      html += '<div class="list">' + api.service.AGENTS.map(a =>
        rowLi(a.icon, a.id === 'risk' ? '#FFE3DD' : '#EAF4FF', a.name, a.desc,
          '<div class="muted">›</div>', 'data-agent="' + a.id + '"')).join('') + '</div>';

      if (tickets.length) {
        html += '<div class="sec-title">我的工单<span class="more">' + tickets.length + '</span></div>';
        html += '<div class="list">' + tickets.map(t =>
          '<div class="li" style="display:block;padding:15px 18px">' +
          '<div class="row between"><span class="sm" style="font-weight:700">' +
          UI.esc(t.title) + '</span>' +
          '<span class="tag ' + (t.status === 'closed' ? 'gray' : 'info') + '">' +
          (t.status === 'closed' ? '已关闭' : '处理中') + '</span></div>' +
          '<div class="xs t2" style="margin-top:8px;line-height:1.7">' + UI.esc(t.body) + '</div>' +
          '<div class="xs muted" style="margin-top:8px">' + t.date +
          ' · 预计回复 ' + UI.esc(t.replyIn) + '</div>' +
          (t.status === 'closed' ? '' :
            '<button class="btn ghost xs mt12" style="margin-top:10px" data-closeticket="' +
            t.id + '">问题已解决，关闭工单</button>') +
          '</div>').join('') + '</div>';
      }

      html += '<div class="proto mt20"><div class="ph"><span class="seal">提</span>关于心理压力</div>' +
        '<div class="xs t2" style="line-height:1.8">如果因为家庭经济问题感到持续的压力或难以沟通，' +
        '这不只是钱的问题。学校的心理中心、辅导员都可以聊，不需要等到"很严重"才去。</div></div>';

      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      el.querySelectorAll('[data-faq]').forEach(n => {
        n.onclick = () => {
          const a = n.querySelector('[data-answer]');
          const open = a.style.display !== 'none';
          a.style.display = open ? 'none' : 'block';
          n.querySelector('[data-arrow]').textContent = open ? '+' : '−';
        };
      });
      const q = el.querySelector('#svQ'), ans = el.querySelector('#svAns');
      function ask() {
        const v = q.value.trim();
        if (!v) return UI.toast('先输入一个问题');
        const r = ctx.api.service.ask(v);
        ans.innerHTML = r
          ? '<div class="card" style="border-left:3px solid var(--accent)">' +
          '<div class="xs muted">你的问题</div>' +
          '<div class="sm" style="margin-top:5px;font-weight:500">' + UI.esc(v) + '</div>' +
          '<div class="sm t2" style="margin-top:12px;line-height:1.8;padding-top:12px;border-top:1px solid var(--line-2)">' +
          UI.esc(r.a) + '</div></div>'
          : '<div class="card" style="border-left:3px solid var(--warn)">' +
          '<div class="sm t2" style="line-height:1.8">这个问题我暂时答不上来。' +
          '你可以换个说法，或者看看下面的常见问题。需要人工协助的话，' +
          '可以拨打卡片上的服务专线。</div></div>';
      }
      el.querySelector('#svAsk').onclick = ask;
      q.onkeydown = e => { if (e.key === 'Enter') ask(); };

      /* ---- 人工客服的三条线 ---- */
      el.querySelectorAll('[data-agent]').forEach(n => {
        n.onclick = () => {
          const id = n.getAttribute('data-agent');
          const a = ctx.api.service.AGENTS.find(x => x.id === id) || {};
          if (id === 'phone' || id === 'risk') {
            const tel = id === 'risk' ? '96110' : '95588';
            return UI.sheet({
              title: a.name,
              sub: a.desc,
              body: '<div class="proto"><div class="ph"><span class="seal">拨</span>' +
                (id === 'risk' ? '涉及资金安全时优先打这个' : '账户与卡片问题走这个') + '</div>' +
                '<div class="xs t2" style="line-height:1.8">电话里只需要说明遇到的问题，' +
                '不需要提供任何消费明细。</div></div>' +
                '<a class="btn mt16" style="display:block;text-align:center;text-decoration:none" ' +
                'href="tel:' + tel + '" data-call="' + tel + '">拨打 ' + tel + '</a>',
              mount(s) {
                const b = s.querySelector('[data-call]');
                if (b) b.onclick = ev => { ev.preventDefault(); UI.toast('真机上会直接拨 ' + tel); };
              }
            });
          }
          /* 在线客服 → 真的提一张工单 */
          const box = document.createElement('div');
          box.innerHTML = '<textarea class="ta" id="woQ" rows="4" placeholder="' +
            '描述一下遇到的问题。不用写具体消费内容 —— 客服只需要知道是哪一类问题。"></textarea>';
          UI.sheet({
            title: '在线客服',
            sub: a.desc + '。提交后会生成一张工单，回执进消息中心。',
            mount(s, close) {
              s.appendChild(box);
              const b = document.createElement('button');
              b.className = 'btn mt16'; b.textContent = '提交工单';
              b.onclick = () => {
                try {
                  const r = ctx.api.service.submitWorkOrder(box.querySelector('#woQ').value, 'online');
                  close();
                  ctx.refreshTop();
                  UI.toast('工单 ' + r.ticketNo + ' 已受理 · ' + r.replyIn);
                } catch (e) { UI.toast(e.message); }
              };
              s.appendChild(b);
            }
          });
        };
      });

      el.querySelectorAll('[data-closeticket]').forEach(n => {
        n.onclick = () => {
          ctx.api.service.closeTicket(n.getAttribute('data-closeticket'));
          ctx.refreshTop();
          UI.toast('工单已关闭');
        };
      });
    }
  };
})(window.LJ);
