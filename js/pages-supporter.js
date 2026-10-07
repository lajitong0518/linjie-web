/* ============================================================
   pages-supporter.js —— 支持人端页面
   注意：这一端没有任何"查明细"的入口，因为它对应的 API 上没有这个方法
   ============================================================ */
(function (LJ) {
  'use strict';
  const U = LJ.util, UI = LJ.ui, P = LJ.pages;

  /* ============================================================
     状态
     ============================================================ */
  P['supporter.status'] = {
    /* 025 · 两端同步：024 青年端四个 tab 顶栏整条隐藏后，支持人端四个 tab
       （状态/支持/陪伴/我的）也一起挂 hideNav —— 用户：「所有的调整支持人端
       和青年端都要同步」。机制同一套：syncChrome → .navbar.hidden。 */
    title: '状态', chrome: 'tab', hideNav: true,
    render(ctx) {
      const api = ctx.api;
      const s = api.status();
      const y = api.youth();
      const kids = api.children();
      let html = '<div class="pad">';

      /* 多子女切换：只有两个孩子以上才占位置。
         切一个"当前在看谁"，下面所有数字都换人 —— 不是前端过滤，
         是服务层 S.binding() 换了人。 */
      if (kids.length > 1) {
        const curId = api.activeChild();
        html += '<div class="chsw">' + kids.map(k =>
          '<button class="chsw-i' + (k.id === curId ? ' on' : '') + '" data-kid="' + k.id + '">' +
          '<span class="av">' + UI.esc(k.avatar) + '</span>' +
          '<span class="nm">' + UI.esc(k.nickname || k.name) + '</span></button>').join('') +
          '</div>';
      }

      /* 参考图版式：大字问候 + 黑色胶囊 */
      html += '<div class="row between" style="padding:6px 4px 20px;align-items:flex-start">' +
        '<div><div class="hero">' + UI.esc(y ? y.nickname : '') + '<br>的状态</div></div>' +
        '<button class="pill-btn" data-go="supporter.disclosure">' +
        UI.esc(s.modeName) + '</button></div>';

      html += UI.statusHero(s.status);

      /* 三项健康度（015：**上提**到这里）—— 原来这个位置是一行大数字
         「资金可持续 N 天 / 结构健康度 N 分」，和下面 grid3 里的
         可持续天数、结构健康度是**同一个数显示两遍**（中间还隔着一张
         证据卡）。按用户口径：两个旧块直接换成「支出健康度」，
         位置挪上去 —— grid3 本就是大数字行的超集，信息零丢失。

         039 · 用户：「评分机制是什么样的也没有说明，点击也没有任何转跳」
         → 整块（标题 + 三个分数）包进 data-go，点进 supporter.health
         详情页把三个公式、当前输入与理想区间表全讲清楚；标题右侧挂
         「评分机制 ›」当示能。 */
      if (s.health) {
        html += '<div class="hlth-go" data-go="supporter.health">' +
          '<div class="sec-title">支出健康度<span class="more">评分机制 ›</span></div><div class="grid3">' +
          '<div class="metric"><div class="k">消费平稳度</div><div class="v">' + s.health.steady + '<span class="u">分</span></div></div>' +
          '<div class="metric"><div class="k">可持续天数</div><div class="v">' + Math.min(99, s.health.runway) + '<span class="u">天</span></div></div>' +
          '<div class="metric"><div class="k">结构健康度</div><div class="v">' + s.health.structure + '<span class="u">分</span></div></div>' +
          '</div></div>';
      }

      /* 他主动做过的事 —— 这一页先给「证据」，再给「钱」。
            支持人端的第一眼应该是"他在变强"，不是"这个月花了多少"：
            家长放手靠的是能力证据，不是分数（也不是账单）。
         ★ 只从 E.EVIDENCE 白名单取；只说次数和动作名，不含商户、不含单笔金额。 */
      const rpts = api.report.months(6);
      const lastM = rpts[rpts.length - 1];
      const evLast = (lastM && lastM.evidence) || [];
      html += '<div class="sec-title">他主动做过的事' +
        (lastM ? '<span class="more">' + lastM.month + '</span>' : '') + '</div>';
      html += '<div class="card" data-tour-proof>' +
        (evLast.length
          ? ((dims) => Object.keys(dims).map(d =>
            '<div style="margin-bottom:11px"><div class="xs muted" style="font-weight:700;letter-spacing:.04em">' +
            UI.esc(d) + '</div>' +
            dims[d].map(e => '<div class="row" style="gap:8px;margin-top:6px">' +
              '<span style="color:var(--ok);font-weight:800">·</span>' +
              '<span class="sm" style="line-height:1.6">' + UI.esc(e.text) + '</span></div>').join('') +
            '</div>').join(''))(LJ.engine.evidenceByDim(evLast))
          : '<div class="sm muted" style="line-height:1.7">这个月还没有记录到主动调整的动作。<br>' +
          '<span class="xs">这里只记录他自己的操作，不含浏览和记账。</span></div>') +
        '<div class="xs t2" style="line-height:1.75;padding-top:11px;border-top:1px solid var(--line-2)">' +
        (evLast.length
          ? '放手的理由：这个月他' +
          UI.esc(evLast.slice(0, 2).map(e => e.text).join('、')) +
          ' —— 可以让他自己决定一次试试。'
          : '等他攒下第一件"主动做过的事"，你就有了让他自己决定一次的理由。') +
        '</div>' +
        '<button class="btn ghost sm" style="margin-top:12px" data-go="supporter.report">看成长月报 ›</button>' +
        '</div>';

      /* 三项健康度已上提（015）：原位置在证据卡下面，和顶部大数字行
         重合 —— 现在只剩上面「支出健康度」这一份。

         039 · 发放管理整段迁走（用户：「支持进度与下次发放这两张卡片
         应该放到"支持"页面里，调整到往来时间线上面」）——
         连同缺口预警卡一起搬去 supporter.support；状态页只留
         「他变强了没有」这条主线。 */

      /* 大类月度总额 —— 折叠：默认只露前 3 类 */
      if (s.categories) {
        const cats = s.categories.filter(c => c.amount > 0);
        const catRow = c => '<div style="margin-bottom:13px"><div class="row between">' +
          '<span class="sm">' + c.icon + ' ' + c.name + '</span>' +
          '<span class="xs mono muted"><span class="v-out">¥' + c.amount + '</span> · ' + c.ratio + '%' +
          (c.delta ? ' <span style="color:' + (c.delta > 0 ? 'var(--danger)' : 'var(--ok)') + '">' +
            (c.delta > 0 ? '↑' : '↓') + Math.abs(c.delta) + '%</span>' : '') + '</span></div>' +
          '<div class="mt8" style="margin-top:6px">' + UI.bar(c.ratio / 100 * 2.2, c.color) + '</div></div>';
        html += '<div class="sec-title">本月大类支出<span class="more">仅总额，无明细</span></div>';
        html += '<div class="card">' + UI.fold('sup.categories', cats.map(catRow)) + '</div>';
      }

      /* 039 · 预算执行率卡删除（用户：「"状态"的"执行预算"卡片，
         完全没有必要，直接删除」）—— 状态页不再摆这块；
         披露契约里的 budgetProgress 项与 API 保持原样（权限自检页仍列）。 */

      /* 039 · 大额专项迁走（用户：「"大额专项"也放到"支持"页面里，
         和"发起支持"放在一起」）—— 原状态页渲染块整体搬去
         supporter.support 的「发起支持」段后面，口径不变。 */

      /* 039 · 底部「查看权限自检」卡删除（用户：「不是在"我的"里有了吗，
         就不用出现在首页了」）——「我的」抽屉里已有 权限自检 行，
         状态页这张（为什么看不到明细 + 自检按钮）整卡下线；
         同一段解释在权限自检页/查看范围页仍在。 */

      html += '</div>';
      return html;
    },
    mount(el, ctx) {
      LJ._bindGo(el, ctx);
      UI.bindFold(el);
      /* 039 · 缺口预警的「转入补足」绑定点随发放管理整段迁去 supporter.support */
      /* 切孩子：切完重渲染整页 —— 所有数字都换人了 */
      el.querySelectorAll('[data-kid]').forEach(n => {
        n.onclick = () => {
          const id = n.getAttribute('data-kid');
          if (id === ctx.api.activeChild()) return;
          const c = ctx.api.switchChild(id);
          ctx.refresh();
          UI.toast('已切到 ' + (c.nickname || c.name));
        };
      });
    }
  };

  /* ============================================================
     支出健康度详情（039 建页 / 040 改成"把分数画出来"）
     ------------------------------------------------------------
     039：用户「评分机制是什么样的也没有说明，点击也没有任何转跳」
     → 状态页那块整块挂 data-go 进本页，先把公式摊开讲。
     040：用户「最上面的"分数是怎么来的"删掉……我不想知道应该怎么算，
     我是要你呈现分数是怎么得出的，比如消费平稳度……把波动以图形的
     方式呈现出来……最下面那个"只有分数，没有明细"也删掉」——
     于是本页只剩**三段图**：大数字（分数）+ 图 + 真实输入 + 一行怎么看图。

       · 消费平稳度 → 8 根周支出柱 + 均值虚线 + ±1σ 浅绿带（带宽 = 波动）
       · 可持续天数 → 资金跑道（实心 = 撑到的天数、斜纹 = 缺口、
                        竖线 = 下次发放日 —— 状态页亮色看的同一条判据）
       · 结构健康度 → 六行区间图（绿区 = 理想区间、竖条 = 实际占比）

     信息边界没变：输入全部是 status().health 里的**聚合值**
     （周合计 / 池子余额 / 类目占比）与产品常量（M.HEALTH_IDEAL）——
     这一端没有明细接口，分数也反推不出任何一笔消费。
     但这条边界**不再在页面上向家长强调**（040 删掉了页脚那块）；
     要看边界去「查看范围」页 /『我的』抽屉的权限自检。
     ============================================================ */
  P['supporter.health'] = {
    title: '支出健康度', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const s = api.status();
      if (!s.health) {
        /* 极简档没有 health 模块 —— 深链进来给空态 + 出口，不白屏 */
        return UI.empty('🔒', '当前查看范围不含三项健康度',
          '对方把查看范围开到「标准」档及以上，分数与算法才会下发到这一端。',
          '<button class="btn soft mt16" data-go="supporter.disclosure">查看当前范围</button>');
      }
      const h = s.health;
      const pay = api.payout.next();
      const rw = Math.min(99, h.runway);
      const IDEAL = LJ.metrics.HEALTH_IDEAL;
      const enough = h.runway >= pay.days;

      const seg = (title, badge, body) =>
        '<div class="sec-title">' + title + '<span class="more">' + badge + '</span></div>' +
        '<div class="card">' + body + '</div>';

      /* 040 · 顶部「分数是怎么来的」说明块整块下线（用户：「删掉」）；
         三段共用三个小零件：大数字 / 真值胶囊行 / 一行怎么看图。 */
      const score = (v, unit) => '<div class="mono" style="font-size:32px;font-weight:800;' +
        'letter-spacing:-.04em">' + v +
        '<span style="font-size:13px;font-weight:600;color:var(--muted);margin-left:3px">' + unit + '</span></div>';
      const statRow = rows => '<div class="hlth-stats">' + rows.map(r =>
        '<div class="hlth-stat"><b>' + r[0] + '</b><span>' + r[1] + '</span></div>').join('') + '</div>';
      const read = t => '<div class="xs muted" style="margin-top:11px;line-height:1.75">' + t + '</div>';

      let html = '<div class="pad">';

      /* ① 消费平稳度：8 根柱子（每周支出）+ 均值虚线 + ±1σ 浅绿带。
         哪一周戳出带子就是扣分来源 —— 分数怎么来的，图自己说。 */
      const wk = h.weeks || [];
      const sumW = wk.reduce((s2, w) => s2 + w.amount, 0);
      const peak = wk.reduce((a, w) => (w.amount > a.amount ? w : a), { amount: 0 });
      html += seg('消费平稳度', '近 8 周',
        score(h.steady, '分') +
        UI.steadyChart({ weeks: wk, cv: h.cv }) +
        '<div class="hlth-ax"><span>8 周前</span><span>本周</span></div>' +
        statRow([
          [U.wonInt(Math.round(sumW / (wk.length || 1))), '周均支出'],
          [h.cv + '%', '周支出波动']
        ]) +
        read((peak.amount > 0
          ? '花得最多的一周在 ' + U.ymdCN(peak.start) + '（<span class="v-out">¥' +
            U.wonInt(peak.amount) + '</span>）。'
          : '近 8 周还没有支出记录。') +
          '柱子越贴住绿带，这个分数越高；哪一周戳出带子，就是它把分数拉下来的。'));

      /* ② 可持续天数：一条"钱能撑到哪天"的跑道 —— 终点 = 这个分数，
         刻度线 = 下次发放日；撑不过就露出斜纹缺口（状态页按同一判据亮色）。 */
      html += seg('可持续天数', '近 30 天',
        score(rw, '天') +
        UI.runwayChart({ runway: rw, days: pay.days, payDate: pay.date, today: LJ.clock.now() }) +
        statRow([
          ['¥' + U.wonInt(h.pool), '家庭支持金池'],
          ['¥' + U.wonInt(h.avgDaily), '近 30 天日均']
        ]) +
        read((enough
          ? '按现在的花法，这笔钱撑得到下次发放之后 —— 状态页亮「支持正常」，看的就是这条跑道。'
          : '按现在的花法，斜纹那一段撑不到下次发放 —— 状态页标「潜在缺口」，看的就是这条跑道。') +
          '（近 30 天没有支出时按不缺钱记，最多显示 99 天。）'));

      /* ③ 结构健康度：六行区间图 —— 绿区 = 理想区间（读 metrics 那一份常量），
         竖条 = 近 30 天实际占比；偏出的行条子转红、数值转红。
         "偏出最多的是哪一类"取 metrics 算分时的那份判定，页面不重算。 */
      const mix = (h.mix || []).map(it => {
        const rg = IDEAL[it.id] || [0, 0];
        const c = LJ.catById(it.id);
        return {
          id: it.id, name: c.name, icon: c.icon, pct: it.pct,
          from: rg[0] * 100, to: rg[1] * 100, inBand: it.inBand, dev: it.dev
        };
      });
      const offs = mix.filter(m => !m.inBand).sort((a, b) => b.dev - a.dev);
      html += seg('结构健康度', '近 30 天',
        score(h.structure, '分') +
        UI.mixChart({ items: mix }) +
        read('绿区是这一类的合理占比，竖条是近 30 天的实际位置：' +
          (offs.length
            ? '六类里有 <b>' + offs.length + ' 类</b>偏出了范围，偏得最多的是 ' +
              UI.esc(offs[0].name) + '（' + (offs[0].pct > offs[0].to ? '高出' : '低于') +
              '区间 ' + offs[0].dev + ' 个百分点）—— 它就是这次扣分的主要来源。'
            : '六类<b>全部落在绿区里</b>，所以这一项满分。')));

      /* 040 · 底部「只有分数，没有明细」整块删除（用户：「也删掉，
         不要跟家长强调他们看不到明细」）—— 连那颗权限自检按钮一起下线；
         同一段边界说明在「查看范围」页与抽屉里的权限自检仍在。 */
      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) { LJ._bindGo(el, ctx); }
  };

  /* ============================================================
     支持
     ============================================================ */
    /* ============================================================
     支持（支持人端的「往来」镜像 · 009）
     ------------------------------------------------------------
     和青年端往来页同一副三段骨架：
       ① 待响应申请（收件箱）② 发起支持（开口）③ 往来时间线（主线）
     同一批事件、徽记对调 —— 时间线来自 thread.timeline()，
     行集在 API 层圈定、方向在 E.timeline 定，这一页只管画。
     tab 名不改（保持「支持」），改的是骨。
     原「我登记的支持」「历史申请」两个列表被时间线吸收。
     ============================================================ */
  P['supporter.support'] = {
    title: '支持', chrome: 'tab', hideNav: true,   /* 025：两端同步（024 同款） */
    render(ctx) {
      const api = ctx.api;
      const pend = api.request.pending();
      const st = api.status();
      const pay = api.payout.next();
      let html = '<div class="pad">';

      /* ① 收件箱：等我响应的申请 */
      html += '<div class="sec-title" style="margin-top:16px">待响应申请' +
        (pend.length ? '<span class="more">' + pend.length + ' 项</span>' : '') + '</div>';

      if (!pend.length) {
        html += '<div class="card"><div class="sm muted" style="text-align:center;padding:14px 0">' +
          '暂时没有需要响应的申请</div></div>';
      } else {
        /* 025 · 两端同步（017 同款行滑）：待响应申请也走左滑揭示 ——
           外壳 .sw（sw-acts = 响应按钮；sw-body = 原卡原样，卡上的按钮
           留在原位）。两者挂同一组 data-respond 属性：mount 的
           querySelectorAll 会一起绑上 —— 动作语义零份拷贝，改文案/改流程
           揭示层自动跟。★ UI.rowSwipe 本页 mount 早已调用（时间线在用），
           包上即生效。 */
        html += pend.map(r =>
          '<div class="sw" style="margin-bottom:12px"><div class="sw-acts">' +
          '<button class="btn sm soft" data-respond="' + r.id + '">响应</button>' +
          '</div><div class="sw-body">' +
          '<div class="card" style="border-left:3px solid var(--accent)">' +
          '<div class="row between"><div><div style="font-size:15px;font-weight:700">' + UI.esc(r.name) + '</div>' +
          '<div class="xs muted" style="margin-top:4px">' + U.ymdCN(r.date) + '</div></div>' +
          '<div class="mono" style="font-size:17px;font-weight:600">¥' + U.won(r.amount) + '</div></div>' +
          (r.reason ? '<div class="sm t2 mt12" style="margin-top:10px;line-height:1.7;background:var(--bg);padding:10px 12px;border-radius:10px">' +
            UI.esc(r.reason) + '</div>' : '') +
          '<div class="xs muted mt12" style="margin-top:10px">对方只发送了以上信息，未附带任何消费流水</div>' +
          '<button class="btn mt16" data-respond="' + r.id + '">响应这笔申请</button>' +
          '</div></div></div>').join('');
      }

      /* ② 发起支持 */
      html += '<div class="sec-title">发起支持</div>';
      html += '<div class="grid2">' +
        '<button class="card flat" data-act="register" style="text-align:left;padding:14px">' +
        '<div style="font-size:20px">💠</div>' +
        '<div style="font-size:14px;font-weight:600;margin-top:8px">登记一笔支持</div>' +
        '<div class="xs muted" style="margin-top:3px">转账后登记，待对方对账</div></button>' +
        '<button class="card flat" data-act="invite" style="text-align:left;padding:14px">' +
        '<div style="font-size:20px">🎁</div>' +
        '<div style="font-size:14px;font-weight:600;margin-top:8px">主动支持邀约</div>' +
        '<div class="xs muted" style="margin-top:3px">节日生日，对方可选择收下或谢绝</div></button>' +
        '</div>';

      /* 039 · 大额专项随「发起支持」迁入（用户：「"大额专项"也放到
         "支持"页面里，和"发起支持"放在一起」）—— 只有百分比和笔数，
         没有逐笔转账记录，口径与原状态页一字不差。 */
      if (st.directed && st.directed.length) {
        html += '<div class="sec-title">大额专项</div><div class="list">' +
          st.directed.map(d => '<div class="li"><div class="ico">🎯</div>' +
            '<div class="grow"><div class="row between"><span style="font-size:14px">' +
            (d.icon || '🎯') + ' ' + UI.esc(d.name) + '</span>' +
            '<span class="mono sm">' + d.ratio + '%</span></div>' +
            '<div class="mt8" style="margin-top:7px">' + UI.bar(d.ratio / 100) + '</div>' +
            '<div class="xs muted" style="margin-top:5px">已用 <span class="v-out">¥' + U.won(d.used) +
            '</span> / 已转入 <span class="v-in">¥' + U.won(d.inTotal) + '</span> · ' + d.count + ' 笔</div>' +
            (d.categoryName && d.categoryName !== '—'
              ? '<div class="xs muted" style="margin-top:3px">仅限' + UI.esc(d.categoryName) + '</div>' : '') +
            '</div></div>').join('') +
          '</div>';
      }

      /* 039 · 发放管理随迁（用户：「支持进度与下次发放这两张卡片应该放到
         "支持"页面里……调整到往来时间线上面」）——
         段序：待响应申请 → 发起支持（+大额专项）→ 支持进度 → 往来时间线。
         内容与原状态页一字不差：缺口预警在发放卡上面（3.4.1）。 */
      html += '<div class="sec-title">支持进度</div>';

      const pc = api.payoutCheck.check();
      if (!pc.enough) {
        html += '<div class="card" style="border-left:3px solid var(--danger)">' +
          '<div class="row between"><div class="sm" style="font-weight:700;color:var(--danger)">' +
          '下次生活费可能发不出来</div>' +
          '<span class="tag danger">还差 ¥' + U.wonInt(pc.short) + '</span></div>' +
          '<div class="xs t2" style="margin-top:8px;line-height:1.75">' +
          pc.date + ' 要发 ¥' + U.wonInt(pc.amount) + '，支持账户余额 ¥' + U.wonInt(pc.balance) +
          '，还差 ¥' + U.wonInt(pc.short) + '。补上就不会漏发。</div>' +
          '<button class="btn soft sm mt12" style="margin-top:12px" data-topup>转入补足</button>' +
          '</div>';
      }

      html += '<div class="card"><div class="row between">' +
        '<div><div class="xs muted">下次发放</div>' +
        '<div class="mono" style="font-size:17px;font-weight:600;margin-top:4px">' + pay.date + '</div></div>' +
        '<div style="text-align:right"><div class="xs muted">金额</div>' +
        '<div class="mono v-out" style="font-size:17px;font-weight:600;margin-top:4px">¥' + U.won(pay.amount) + '</div></div>' +
        '</div>' +
        '<div class="mt12" style="margin-top:12px">' + UI.bar((30 - pay.days) / 30) + '</div>' +
        '<div class="xs muted" style="margin-top:8px">还有 ' + pay.days + ' 天 · 自动发放已开启</div>' +
        '<button class="btn soft mt16" data-go="supporter.payout">查看发放历史</button>' +
        '</div>';

      /* ③ 主线：时间线镜像（青年端确认/回执/核销，在这里徽记对调出现。
         013 折叠 key = sup.tl，和青年端的 youth.tl 各记各的状态） */
      html += LJ.timelineBlock(api.thread.timeline(), 'sup.tl');

      html += '</div>';
      return html;
    },
    mount(el, ctx) {
      /* 039 · 发放管理迁入后本页第一次出现 data-go 卡内按钮
         （查看发放历史）—— 补上通用 data-go 绑定；时间线整卡跳转
         在 bindTimeline 里带 id 参数，必须排在它后面（009 同款顺序）。 */
      LJ._bindGo(el, ctx);
      /* 039 · 缺口预警「转入补足」随发放管理迁来（原状态页 mount）：
         真的把余额加上去，提醒才会消失（不是只弹个提示） */
      el.querySelectorAll('[data-topup]').forEach(b => {
        b.onclick = () => {
          const c = ctx.api.payoutCheck.check();
          UI.confirm({
            title: '转入 ¥' + U.wonInt(c.short) + ' 补足支持账户？',
            desc: '补足后余额为 ¥' + U.wonInt(c.balance + c.short) + '，下次发放就不会漏。',
            okText: '确认转入',
            onOk() {
              ctx.api.payoutCheck.topUp(c.short);
              UI.toast('已转入，余额已补足');
              ctx.refresh();
            }
          });
        };
      });
      el.querySelectorAll('[data-respond]').forEach(b => {
        b.onclick = () => openRespond(ctx, b.getAttribute('data-respond'));
      });
      el.querySelectorAll('[data-act]').forEach(b => {
        b.onclick = () => {
          const a = b.getAttribute('data-act');
          if (a === 'register') openRegister(ctx);
          else openInvite(ctx);
        };
      });
      /* 013：时间线折叠按钮也走 UI.bindFold —— 本页此前没有折叠件，
         这一行是新加的，漏了它支持人端的「展开明细」就是死按钮 */
      UI.bindFold(el);
      LJ.bindTimeline(el, ctx);
      UI.rowSwipe(el);   /* 010 · C2 镜像：支持人端时间线的回执/核销动作卡同样可左滑 */
    }
  };

  /* ---------------- 响应申请 ---------------- */
  function openRespond(ctx, id) {
    const r = ctx.api.request.list().find(x => x.id === id);
    if (!r) return;
    UI.sheet({
      title: '响应支持申请',
      sub: UI.esc(r.name) + ' · ¥' + U.won(r.amount) + (r.reason ? '<br>' + UI.esc(r.reason) : ''),
      body:
        '<div class="sec-title" style="margin-top:0">支持金额</div>' +
        '<input id="rpAmt" type="number" value="' + r.amount + '" style="width:100%;height:46px;' +
        'border:1px solid var(--line);border-radius:12px;padding:0 13px;font-family:var(--mono);' +
        'font-size:17px;outline:none;background:var(--card)">' +
        '<div class="sec-title">留言（会一并发送）</div>' +
        '<textarea id="rpNote" rows="2" style="width:100%;border:1px solid var(--line);border-radius:12px;' +
        'padding:11px 13px;outline:none;background:var(--card);resize:none;line-height:1.6"></textarea>' +
        '<div class="sec-title">参考话术</div>' +
        '<div id="rpScripts"></div>' +
        '<div class="sec-title">响应方式</div>' +
        '<div class="row" style="gap:8px;flex-wrap:wrap">' +
        '<button class="btn sm" data-r="full" style="flex:1">全额支持</button>' +
        '<button class="btn soft sm" data-r="partial" style="flex:1">按填写金额支持</button>' +
        '</div>' +
        '<div class="row mt12" style="gap:8px;margin-top:10px">' +
        '<button class="btn ghost sm" data-r="defer" style="flex:1">暂缓</button>' +
        '<button class="btn ghost sm" data-r="reject" style="flex:1">暂不处理</button>' +
        '</div>' +
        '<div class="proto mt16"><div class="ph"><span class="seal">议</span>这不是审批</div>' +
        '<div class="xs t2" style="line-height:1.7">所有响应都会留痕，对方会看到你的留言。' +
        '系统不会对任何一方做评判。</div></div>',
      mount(el, close) {
        const note = el.querySelector('#rpNote');
        let kind = 'partial';
        function scripts(k) {
          const list = LJ.RESPONSE_SCRIPTS[k === 'full' ? 'full' : k === 'partial' ? 'partial' : k === 'defer' ? 'defer' : 'reject'];
          el.querySelector('#rpScripts').innerHTML = list.map(s =>
            '<div class="chip" data-script="' + UI.esc(s) + '" style="margin:0 6px 6px 0;cursor:pointer">' + UI.esc(s) + '</div>').join('');
          el.querySelectorAll('[data-script]').forEach(c => {
            c.onclick = () => { note.value = c.getAttribute('data-script'); };
          });
        }
        scripts('partial');
        el.querySelectorAll('[data-r]').forEach(b => {
          b.onclick = () => {
            const action = b.getAttribute('data-r');
            const amt = Number(el.querySelector('#rpAmt').value);
            if (action === 'partial' && !(amt > 0)) return UI.toast('请填写支持金额');
            ctx.api.request.respond(id, {
              action,
              amount: action === 'partial' ? amt : undefined,
              note: note.value.trim()
            });
            close();
            UI.toast('已响应，对方会收到通知');
          };
        });
      }
    });
  }

  /* ---------------- 登记支持 ---------------- */
  function openRegister(ctx) {
    UI.sheet({
      title: '登记一笔支持',
      sub: '如果你已经把钱转过去了，在这里登记。对方确认后双方账本各记一笔。',
      body:
        '<div class="sec-title" style="margin-top:0">用途</div>' +
        '<input id="rgPurpose" placeholder="例如：本月生活费 / 考证报名费" style="width:100%;height:46px;' +
        'border:1px solid var(--line);border-radius:12px;padding:0 13px;outline:none;background:var(--card)">' +
        '<div class="sec-title">金额</div>' +
        '<input id="rgAmount" type="number" inputmode="decimal" placeholder="0.00" style="width:100%;height:46px;' +
        'border:1px solid var(--line);border-radius:12px;padding:0 13px;font-family:var(--mono);font-size:17px;' +
        'outline:none;background:var(--card)">' +
        '<div class="sec-title">周期</div>' +
        '<div class="seg" id="rgCycle"><button class="on" data-v="once">一次性</button>' +
        '<button data-v="month">按月</button></div>' +
        '<label class="row mt16" style="gap:10px;margin-top:16px;cursor:pointer">' +
        '<input type="checkbox" id="rgDirected" style="width:18px;height:18px">' +
        '<span class="sm t2">定向用途（只用于约定场景，仅反馈使用结果）</span></label>' +
        '<div class="sec-title">留言</div>' +
        '<input id="rgNote" placeholder="选填" style="width:100%;height:46px;border:1px solid var(--line);' +
        'border-radius:12px;padding:0 13px;outline:none;background:var(--card)">' +
        '<button class="btn mt20" id="rgSave">登记并发送</button>',
      mount(el, close) {
        let cycle = 'once';
        el.querySelectorAll('#rgCycle button').forEach(b => {
          b.onclick = () => {
            cycle = b.getAttribute('data-v');
            el.querySelectorAll('#rgCycle button').forEach(x => x.classList.toggle('on', x === b));
          };
        });
        el.querySelector('#rgSave').onclick = () => {
          const purpose = el.querySelector('#rgPurpose').value.trim();
          const amount = Number(el.querySelector('#rgAmount').value);
          if (!purpose) return UI.toast('请填写用途');
          if (!(amount > 0)) return UI.toast('请填写金额');
          ctx.api.support.register({
            purpose, amount, cycle,
            directed: el.querySelector('#rgDirected').checked,
            note: el.querySelector('#rgNote').value.trim()
          });
          close();
          UI.toast('已登记，等待对方对账');
        };
      }
    });
  }

  /* ---------------- 主动支持邀约 ---------------- */
  function openInvite(ctx) {
    const OCC = ['生日', '节日', '开学', '考试', '纪念日', '无'];
    UI.sheet({
      title: '主动支持邀约',
      sub: '在节日、生日这类节点主动表达关心。对方可以选择收下或谢绝——谢绝也是一种正常的表达',
      body:
        '<div class="sec-title" style="margin-top:0">名目</div>' +
        '<input id="ivTitle" placeholder="例如：生日礼物支持" style="width:100%;height:46px;border:1px solid var(--line);' +
        'border-radius:12px;padding:0 13px;outline:none;background:var(--card)">' +
        '<div class="sec-title">场合</div>' +
        '<div class="row" style="gap:8px;flex-wrap:wrap">' + OCC.map((o, i) =>
          '<button class="chip ' + (i === 0 ? 'on' : '') + '" data-occ="' + o + '">' + o + '</button>').join('') + '</div>' +
        '<div class="sec-title">金额</div>' +
        '<input id="ivAmount" type="number" placeholder="0.00" style="width:100%;height:46px;border:1px solid var(--line);' +
        'border-radius:12px;padding:0 13px;font-family:var(--mono);font-size:17px;outline:none;background:var(--card)">' +
        '<div class="sec-title">说一句话</div>' +
        '<input id="ivNote" placeholder="选填" style="width:100%;height:46px;border:1px solid var(--line);' +
        'border-radius:12px;padding:0 13px;outline:none;background:var(--card)">' +
        '<button class="btn mt20" id="ivSend">发送邀约</button>' +
        '<div class="proto mt16"><div class="ph"><span class="seal">说</span>关于谢绝</div>' +
        '<div class="xs t2" style="line-height:1.8">孩子谢绝时，系统只会给你一个中性的提示，' +
        '不会解释原因。这是产品刻意设计的——把"不要"变成一个不需要辩解的回答。</div></div>',
      mount(el, close) {
        let occ = OCC[0];
        el.querySelectorAll('[data-occ]').forEach(b => {
          b.onclick = () => {
            occ = b.getAttribute('data-occ');
            el.querySelectorAll('[data-occ]').forEach(x => x.classList.toggle('on', x === b));
          };
        });
        el.querySelector('#ivSend').onclick = () => {
          const t = el.querySelector('#ivTitle').value.trim();
          const a = Number(el.querySelector('#ivAmount').value);
          if (!t) return UI.toast('请填写名目');
          if (!(a > 0)) return UI.toast('请填写金额');
          ctx.api.invite.create({
            title: t, amount: a, occasion: occ === '无' ? '' : occ,
            note: el.querySelector('#ivNote').value.trim()
          });
          close();
          UI.toast('已发送，等待对方回应');
        };
      }
    });
  }

  /* ============================================================
     发放历史
     ============================================================ */
  P['supporter.payout'] = {
    title: '发放记录', chrome: 'plain',
    render(ctx) {
      const list = ctx.api.payout.history();
      if (!list.length) return UI.empty('📭', '还没有发放记录');
      const byMonth = {};
      list.forEach(r => { (byMonth[U.monthKey(r.date)] = byMonth[U.monthKey(r.date)] || []).push(r); });
      const keys = Object.keys(byMonth).sort().reverse();
      let html = '<div class="pad mt16">';
      html += '<div class="card"><div class="row between">' +
        '<div><div class="xs muted">累计发放</div>' +
        '<div class="mono v-out" style="font-size:20px;font-weight:600;margin-top:4px">¥' +
        U.won(list.reduce((s, r) => s + r.amount, 0)) + '</div></div>' +
        '<div style="text-align:right"><div class="xs muted">共</div>' +
        '<div class="mono" style="font-size:20px;font-weight:600;margin-top:4px">' + list.length + '<span class="u">笔</span></div></div>' +
        '</div></div>';
      keys.forEach(k => {
        html += '<div class="sec-title">' + k + '</div><div class="list">' + byMonth[k].map(r =>
          '<div class="li"><div class="ico" style="background:#DFFAEC">✓</div>' +
          '<div class="grow"><div style="font-size:14px">' + UI.esc(r.purpose) + '</div>' +
          '<div class="xs muted" style="margin-top:2px">' + U.ymdCN(r.date) + ' · 已对账' +
          (r.note ? ' · ' + UI.esc(r.note) : '') + '</div></div>' +
          '<div class="amt out">¥' + U.won(r.amount) + '</div></div>').join('') + '</div>';
      });
      html += '</div>';
      return html;
    }
  };

  /* ============================================================
     陪伴
     ============================================================ */
  P['supporter.company'] = {
    title: '陪伴', chrome: 'tab', hideNav: true,   /* 025：两端同步（024 同款） */
    render(ctx) {
      const api = ctx.api;
      let html = '<div class="pad">';

      /* 主动动作趋势 —— 分数会波动，动作不会。
         陪伴页先摆"他自己动手了几次"。
         ★ 015：原「成长月报」整卡删了 —— 和首页（状态页证据卡的
         「看成长月报 ›」）入口重合，没必要两处摆；月报入口只留那一个。 */
      const rpts = api.report.months(6);
      if (rpts.length) {
        const mx = Math.max.apply(null, rpts.map(m => m.evidenceCount || 0).concat([1]));
        html += '<div class="sec-title" style="margin-top:16px">主动动作<span class="more">近 ' +
          rpts.length + ' 个月</span></div>';
        html += '<div class="card"><div class="ac-bars">' + rpts.map(m =>
          '<div class="ac-b"><i style="height:' +
          Math.max(3, Math.round((m.evidenceCount || 0) / mx * 46)) + 'px"></i>' +
          '<span>' + Number(m.month.slice(5)) + '</span></div>').join('') + '</div>' +
          '<div class="xs muted" style="margin-top:10px;line-height:1.7">每月他自己动手的次数' +
          '（调预算 / 砍订阅 / 做复盘 / 存目标 / 应风险 / 还预支）。次数不会说谎。</div></div>';
      }

      /* 共同储蓄目标（015：上面原有一整块「成长月报」，已删 —— 与首页重合） */
      const goals = api.savings.list();
      html += '<div class="sec-title">共同储蓄目标</div>';
      if (!goals.length) {
        html += '<div class="card flat"><div class="sm muted" style="text-align:center;padding:14px 0">' +
          '还没有共同目标</div></div>';
      } else {
        html += goals.map(g =>
          '<div class="card" style="margin-bottom:12px">' +
          '<div class="row between"><div class="row" style="gap:10px">' +
          '<span style="font-size:20px">' + (g.icon || '🎯') + '</span>' +
          '<div><div class="sm" style="font-weight:600">' + UI.esc(g.title) + '</div>' +
          '<div class="xs muted" style="margin-top:3px">目标 ¥' + U.won(g.target) + '</div></div></div>' +
          (g.done ? '<span class="stamp">已达成</span>' : '<span class="mono sm">' + Math.round(g.ratio * 100) + '%</span>') +
          '</div>' +
          '<div class="mt12" style="margin-top:12px">' + UI.bar(g.ratio, g.done ? 'var(--ok)' : 'var(--navy)') + '</div>' +
          '<div class="row between xs muted" style="margin-top:8px">' +
          '<span>已存 ¥' + U.won(g.contributed) + '</span><span>还差 ¥' + U.won(g.remaining) + '</span></div>' +
          '<div class="xs muted" style="margin-top:6px">只显示总进度，不显示各自存了多少</div>' +
          '<button class="btn soft sm mt12" style="margin-top:12px" data-goal="' + g.id + '">存入一笔</button>' +
          '</div>').join('');
      }

      /* 039 · 段序按用户口径重排：共同储蓄目标 → 成长里程碑 → 成长纪念册
         （「把成长里程碑放在共同储蓄目标下面」）。 */

      /* 成长里程碑（039：从纪念册后面提到共同储蓄目标下面） */
      html += '<div class="sec-title">成长里程碑</div>';
      html += '<div class="list">' +
        '<div class="li"><div class="ico" style="background:#DFFAEC">🌱</div>' +
        '<div class="grow"><div style="font-size:14px">连续记账超过 6 个月</div>' +
        '<div class="xs muted" style="margin-top:2px">这是理财习惯形成的第一个信号</div></div></div>' +
        '<div class="li"><div class="ico" style="background:#EDE9FB">📈</div>' +
        '<div class="grow"><div style="font-size:14px">自有资金占比持续上升</div>' +
        '<div class="xs muted" style="margin-top:2px">说明自主收入能力在形成</div></div></div>' +
        '</div>';

      /* 成长纪念册（039 · 改账单样式）—— 用户：「这个成长纪念册我看不就是
         账单吗……直接做成账单的样式」。骨架照抄青年端流水列表：
         按日分组（lg-daygroup/lg-dayhead，日头带当日小计）+ .list 行 +
         右对齐方向色金额（.amt out，红进绿出：支持人给出的钱是「出」= 绿）。
         里程碑不带金额，右列留空 —— 仍是聚合条目（标题/日期/说明），无明细。 */
      html += '<div class="sec-title">成长纪念册<span class="more">账单式</span></div>';
      const albumAll = api.album.list();
      if (!albumAll.length) {
        html += '<div class="list"><div class="li"><div class="sm muted" style="text-align:center;width:100%">还没有记录</div></div></div>';
      } else {
        const album = albumAll.slice(0, 12);
        const groups = {};
        album.forEach(a => { (groups[a.date] = groups[a.date] || []).push(a); });
        Object.keys(groups).sort().reverse().forEach(dt => {
          const day = groups[dt];
          const out = day.reduce((s, a) => s + (a.amount || 0), 0);
          html += '<div class="lg-daygroup"><div class="lg-dayhead"><span class="d">' +
            U.ymdCN(dt) + '</span><span class="s">支持:<span class="v-out">¥' +
            U.won(out) + '</span></span></div>' +
            '<div class="list">' + day.map(a =>
              '<div class="li"><div class="ico" style="background:' +
              (a.kind === 'support' ? '#DFFAEC' : '#EDE9FB') + '">' + (a.icon || '·') + '</div>' +
              '<div class="grow"><div class="ellipsis" style="font-size:14px;font-weight:500">' +
              UI.esc(a.title) + '</div>' +
              '<div class="xs muted" style="margin-top:2px">' + UI.esc(a.desc) + '</div></div>' +
              (a.amount ? '<div class="amt out">−¥' + U.won(a.amount) + '</div>' : '') +
              '</div>').join('') + '</div></div>';
        });
        if (albumAll.length > album.length) {
          html += '<div class="xs muted" style="text-align:center;padding:14px 0">— 只显示最近 ' +
            album.length + ' 条，更早的在往来时间线里 —</div>';
        }
      }

      html += '<div class="proto mt20"><div class="ph"><span class="seal">念</span>把关注点换一换</div>' +
        '<div class="sm t2" style="line-height:1.75">这一页不显示任何消费内容。' +
        '它想说的是：你可以参与孩子的财务成长，而不需要监督他的每一笔支出。</div></div>';

      html += '</div>';
      return html;
    },
    mount(el, ctx) {
      LJ._bindGo(el, ctx);
      el.querySelectorAll('[data-goal]').forEach(b => b.onclick = () => {
        const id = b.getAttribute('data-goal');
        const g = ctx.api.savings.list().find(x => x.id === id);
        UI.sheet({
          title: '存入共同目标',
          sub: UI.esc(g.title) + ' · 还差 ¥' + U.won(g.remaining),
          body: '<div class="sec-title" style="margin-top:0">金额</div>' +
            '<input id="pgAmt" type="number" placeholder="0.00" style="width:100%;height:48px;border:1px solid var(--line);' +
            'border-radius:12px;padding:0 14px;font-family:var(--mono);font-size:20px;outline:none;background:var(--card)">' +
            '<button class="btn mt20" id="pgOk">存入</button>',
          mount(e2, close) {
            e2.querySelector('#pgOk').onclick = () => {
              const a = Number(e2.querySelector('#pgAmt').value);
              if (!(a > 0)) return UI.toast('请填写金额');
              ctx.api.savings.contribute(id, a, '');
              close(); UI.toast('已存入');
            };
          }
        });
      });
    }
  };
  /* ============================================================
     025 · 支持人端「我的」抽屉的内容（与青年端 LJ.meDrawerBody 同一槽位）
     ------------------------------------------------------------
     用户：「所有的调整支持人端和青年端都要同步」→ 022 的「头像 → 右侧抽屉」
     模式同步过来：个人信息 / 绑定关系 / 查看范围 / 其他（含退出登录、
     导览、版本行）搬进抽屉，页体让给「支持安排」这个正题 —— 与青年端
     「页体留正题、配置进抽屉」同一个分法。
     由 pages-youth 的 LJ.meDrawerBody 按 ctx.role 分流调到这里；
     抽屉外壳、把手上不重复实现（openMeDrawer 两端一份）。
     ============================================================ */
  LJ.supMeDrawerBody = function (ctx) {
    const api = ctx.api, me = api.profile(), y = api.youth();
    const cfg = api.disclosure.current();
    const unread = api.message.unread();
    let html = '';

    html += '<div class="sec-title" style="margin-top:6px">个人信息</div>';
    html += '<div class="card mt16"><div class="row">' +
      '<div style="width:52px;height:52px;border-radius:50%;background:var(--navy);color:#fff;' +
      'display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:600">' + UI.esc(me.avatar) + '</div>' +
      '<div class="grow"><div style="font-size:17px;font-weight:700">' + UI.esc(me.name) + '</div>' +
      '<div class="xs muted" style="margin-top:3px">' + UI.esc(me.phone) + ' · ' + UI.esc(me.relation || '') + '</div></div>' +
      '<span class="tag info">支持人端</span></div></div>';

    html += '<div class="sec-title">绑定关系</div><div class="list">' +
      '<div class="li"><div class="ico">👤</div><div class="grow"><div style="font-size:14px">' +
      UI.esc(y ? y.name : '') + '</div><div class="xs muted" style="margin-top:2px">已绑定 · 双方确认制</div></div>' +
      '<span class="tag ok">生效中</span></div></div>';

    html += '<div class="sec-title">查看范围</div>';
    html += '<div class="proto" data-go="supporter.disclosure"><div class="ph"><span class="seal">范</span>当前：' + cfg.name + '</div>' +
      '<div class="sm t2" style="line-height:1.7">' + UI.esc(cfg.desc) + '</div>' +
      '<div class="row between mt12" style="margin-top:10px">' +
      '<span class="xs muted">单笔交易明细</span><span class="tag gray">0 笔</span></div></div>';

    html += '<div class="sec-title">其他</div><div class="list">' +
      '<div class="li" data-go="common.contracts"><div class="ico" style="background:#EDE9FB">🛡</div>' +
      '<div class="grow"><div style="font-size:14px">权限自检</div>' +
      '<div class="xs muted" style="margin-top:2px">我这边能调用哪些接口</div></div><div class="muted">›</div></div>' +
      '<div class="li" data-go="common.audit"><div class="ico" style="background:#FFF0D4">📜</div>' +
      '<div class="grow"><div style="font-size:14px">留痕记录</div>' +
      '<div class="xs muted" style="margin-top:2px">包括双方每一次查看行为</div></div><div class="muted">›</div></div>' +
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

  P['supporter.me'] = {
    title: '我的', chrome: 'tab', hideNav: true, navAvatar: true,
    /* 025 · 两端同步：024 的顶栏隐藏 + 022 的「头像 → 右侧抽屉」模式 ——
       头像把手与青年端同一真源（LJ.meAvatarRow + navAvatar 旗子），
       抽屉内容是上方的 LJ.supMeDrawerBody；页体只留「支持安排」正题。 */
    render(ctx) {
      const api = ctx.api;
      const planWait = api.plan.outgoing().length;
      const fundLive = api.fund.active().length;
      let html = ((ctx.page && ctx.page.navAvatar) ? LJ.meAvatarRow(api) : '') + '<div class="pad">';

      /* 025 · 原来这儿是个人信息卡 / 绑定关系 / 查看范围 三段 ——
         与青年端同款搬进右侧抽屉（LJ.supMeDrawerBody），页体留正题。 */

      html += '<div class="sec-title" style="margin-top:16px">支持安排</div><div class="list">' +
        '<div class="li" data-go="supporter.fund"><div class="ico" style="background:#EAF4FF">🎯</div>' +
        '<div class="grow"><div style="font-size:14px">专项支持</div>' +
        '<div class="xs muted" style="margin-top:2px">' +
        (fundLive ? fundLive + ' 个进行中 · 只看进度，不看明细'
          : '学费、实习、看病这类大额支出单独放') + '</div></div>' +
        (fundLive ? '<span class="tag info">' + fundLive + '</span>' : '<div class="muted">›</div>') + '</div>' +
        '<div class="li" data-go="supporter.plan"><div class="ico" style="background:#EDFBF2">💠</div>' +
        '<div class="grow"><div style="font-size:14px">生活费方案</div>' +
        '<div class="xs muted" style="margin-top:2px">基准 <span class="v-out">¥' + U.won(api.plan.base()) + '</span> / 月' +
        (planWait ? ' · ' + planWait + ' 个待孩子确认' : '') + '</div></div>' +
        (planWait ? '<span class="tag warn">' + planWait + '</span>' : '<div class="muted">›</div>') + '</div>' +
        '<div class="li" data-go="supporter.payout"><div class="ico" style="background:#DFFAEC">📤</div>' +
        '<div class="grow"><div style="font-size:14px">发放记录</div></div><div class="muted">›</div></div>' +
        '</div>';

      /* 025 · 「其他」（权限自检 / 留痕 / 消息中心 / 帮助 / 导览 / 退出）与
         版本行也进抽屉 —— 与青年端「配置类全在抽屉里」同一个分法。 */
      html += '</div>';
      return html;
    },
    mount(el, ctx) {
      LJ._bindGo(el, ctx);
      /* 025 · 头像把手挂一次（页体不换 innerHTML）；退出登录行在抽屉里，
         openMeDrawer 的 mount 自己会 bindLogout —— 页体不再绑。 */
      const avaBtn = el.querySelector('#navAva');
      if (avaBtn) avaBtn.onclick = () => LJ.openMeDrawer(ctx);
    }
  };

  /* ============================================================
     查看范围说明
     ============================================================ */
  P['supporter.disclosure'] = {
    title: '查看范围', chrome: 'plain',
    render(ctx) {
      const cur = ctx.api.disclosure.current();
      const y = ctx.api.youth();
      return '<div class="pad">' +
        '<div class="card mt16" style="text-align:center;padding:24px 16px">' +
        '<div style="font-size:28px">🔒</div>' +
        '<div style="font-size:17px;font-weight:700;margin-top:10px">' + UI.esc(cur.name) + ' 模式</div>' +
        '<div class="sm muted" style="margin-top:7px;line-height:1.7">' + UI.esc(cur.desc) + '</div>' +
        '</div>' +

        '<div class="sec-title">你能看到的</div>' +
        '<div class="list">' + cur.shows.map(s => {
          const label = {
            status: '本月支持状态与资金是否充足',
            health: '消费平稳度 / 可持续天数 / 结构健康度',
            categoryMonthly: '六大类月度支出总额与环比',
            budgetProgress: '分类预算执行率',
            directedProgress: '大额专项使用进度'
          }[s] || s;
          return '<div class="li"><div class="ico" style="background:#DFFAEC;color:var(--ok)">✓</div>' +
            '<div class="grow"><div class="sm" style="font-weight:500">' + UI.esc(label) + '</div></div></div>';
        }).join('') + '</div>' +

        '<div class="sec-title">你看不到的</div>' +
        '<div class="list">' +
        '<div class="li"><div class="ico" style="background:#FFE3DD;color:var(--danger)">×</div>' +
        '<div class="grow"><div class="sm" style="font-weight:500">任何一笔具体交易（金额 / 商户 / 时间）</div>' +
        '<div class="xs muted" style="margin-top:3px">在服务端就不下发，不是前端隐藏</div></div></div>' +
        '<div class="li"><div class="ico" style="background:#FFE3DD;color:var(--danger)">×</div>' +
        '<div class="grow"><div class="sm" style="font-weight:500">个人自有资金的任何信息</div></div></div>' +
        '<div class="li"><div class="ico" style="background:#FFE3DD;color:var(--danger)">×</div>' +
        '<div class="grow"><div class="sm" style="font-weight:500">账单凭证与消费定位</div></div></div>' +
        '</div>' +

        '<div class="sec-title">调整方式</div>' +
        '<div class="proto"><div class="ph"><span class="seal">双</span>需要对方确认</div>' +
        '<div class="sm t2" style="line-height:1.7">你不能单方面扩大查看范围。' +
        '任何调整都会作为一条申请推送给 ' + UI.esc(y ? y.nickname : '对方') + '，' +
        '由对方确认后才生效，全程留痕。</div>' +
        '<button class="btn ghost sm mt12" style="margin-top:12px" id="askMore">申请调整查看范围</button>' +
        '</div>' +

        '<div class="sec-title">生效中的授权</div>' +
        '<div class="list">' + ctx.api.disclosure.grants().filter(g => g.status === 'active').map(g =>
          '<div class="li"><div class="ico">🔑</div><div class="grow">' +
          '<div class="sm" style="font-weight:500">' + UI.esc(g.label) + '</div>' +
          '<div class="xs muted" style="margin-top:3px">' + (g.expiresAt ? '有效期至 ' + g.expiresAt : '长期有效') + '</div></div></div>').join('') +
        '</div>' +

        '<div style="height:30px"></div></div>';
    },
    mount(el, ctx) {
      el.querySelector('#askMore').onclick = () => {
        const cur = ctx.api.disclosure.current();
        const idx = LJ.disclosure.ORDER.indexOf(cur.id);
        const next = LJ.disclosure.ORDER[Math.min(LJ.disclosure.ORDER.length - 1, idx + 1)];
        if (next === cur.id) return UI.toast('已经是范围最宽的一档');
        UI.confirm({
          title: '申请调整为「' + LJ.disclosure.MODES[next].name + '」？',
          desc: '这是一条申请，需要对方确认后才生效。对方也可以拒绝。',
          okText: '提交申请',
          onOk() {
            ctx.api.disclosure.propose(next);
            UI.toast('已提交，等待对方确认');
          }
        });
      };
    }
  };
  /* ============================================================
     生活费方案（产品文档 3.5.3 寒暑假调整 / 3.5.5 毕业过渡递减）
     家长有发起权，孩子有确认权 —— 这不是"审批"，是双方都得点头的方案。
     发出去就真的会改变时间机器每月打多少钱。
     ============================================================ */

  /** 逐月发放表：这一页的主角，让"发多少、发到哪个月"一眼看清 */
  function planTable(ctx, plan) {
    const rows = ctx.api.plan.schedule(plan);
    const max = Math.max.apply(null, rows.map(r => r.amount).concat([1]));
    const total = rows.reduce((s, r) => s + r.amount, 0);
    /* 036 · 红进绿出：支持人端视角 —— 逐月发的是**付出**的钱 → 绿
       （青年端同一张表是收到 → 红；零额行 .lp-tr.zero .v 特异性更高仍是灰）。 */
    return '<div class="lp-tbl">' + rows.map(r => {
      const zero = r.amount === 0;
      const pct = Math.round(r.amount / max * 100);
      const tag = plan.kind === 'taper' ? (zero ? '自立' : '递减')
        : zero ? '不发' : (r.amount < plan.base ? '半给' : '');
      return '<div class="lp-tr' + (zero ? ' zero' : '') + (plan.kind === 'taper' ? ' grad' : '') + '">' +
        '<span class="m">' + Number(r.month.slice(5)) + '月</span>' +
        '<span class="bar"><i style="width:' + Math.max(zero ? 0 : 4, pct) + '%"></i></span>' +
        '<span class="v v-out">¥' + U.won(r.amount) + '</span>' +
        '<span class="tg">' + tag + '</span>' +
        '</div>';
    }).join('') +
      '<div class="lp-total"><span class="k">整期合计</span>' +
      '<span class="v v-out">¥' + U.won(total) + '</span></div>' +
      '</div>';
  }

  function planLog(plan) {
    if (!plan.log || !plan.log.length) return '';
    const who = { youth: '孩子', supporter: '你', system: '系统' };
    return '<div class="lp-log">' + plan.log.slice().reverse().map(l =>
      '<div class="lp-log-i ' + l.actor + '"><div class="dot"></div><div class="tx">' +
      '<b>' + UI.esc(l.action) + '</b>' +
      '<span>' + (who[l.actor] || l.actor) + ' · ' + U.ymdCN(String(l.at).slice(0, 10)) +
      (l.note ? ' · ' + UI.esc(l.note) : '') + '</span>' +
      '</div></div>').join('') + '</div>';
  }

  P['supporter.plan'] = {
    title: '生活费方案', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const live = api.plan.active();
      const outgoing = api.plan.outgoing();
      const incoming = api.plan.incoming();
      const hist = api.plan.list().filter(p => p.status === 'done' || p.status === 'declined');
      let html = '<div class="pad">';

      html += '<div class="proto mt16"><div class="ph"><span class="seal">方</span>为什么要有方案</div>' +
        '<div class="sm t2" style="line-height:1.75">寒暑假的开销结构跟在校时完全不同，' +
        '毕业后的头几个月也不该还按学生标准发。<b>方案一旦确认，时间机器就按它发放</b>，' +
        '不是写在那里好看的 —— 孩子那边会收到对账记录，也会看到逐月表。</div></div>';

      /* 生效中 */
      html += '<div class="sec-title">生效中<span class="more">' + live.length + ' 个</span></div>';
      if (!live.length) {
        html += '<div class="card flat"><div class="sm muted" style="text-align:center;padding:12px 0">' +
          '当前按基准 <span class="v-out">¥' + U.won(api.plan.base()) + '</span> / 月发放</div></div>';
      } else {
        html += live.map(p => {
          const isTaper = p.kind === 'taper';
          return '<div class="lp-card ' + (isTaper ? 'grad' : 'live') + '">' +
            '<div class="lp-h"><span class="n">' + UI.esc(p.name) + '</span>' +
            '<span class="tag ' + (isTaper ? 'info' : 'ok') + '">' + (isTaper ? '递减中' : '进行中') + '</span></div>' +
            '<div class="lp-sub">' + UI.esc(api.plan.summary(p)) + '</div>' +
            (p.note ? '<div class="lp-sub" style="color:var(--muted)">「' + UI.esc(p.note) + '」</div>' : '') +
            planTable(ctx, p) +
            '<button class="btn ghost sm mt12" data-end="' + p.id + '">提前结束，恢复基准</button>' +
            planLog(p) +
            '</div>';
        }).join('');
      }

      /* 等孩子确认 */
      if (outgoing.length) {
        html += '<div class="sec-title">等孩子确认<span class="more">' + outgoing.length + ' 个</span></div>';
        html += outgoing.map(p =>
          '<div class="lp-card wait">' +
          '<div class="lp-h"><span class="n">' + UI.esc(p.name) + '</span>' +
          '<span class="tag warn">待确认</span></div>' +
          '<div class="lp-sub">' + UI.esc(api.plan.summary(p)) + '</div>' +
          planTable(ctx, p) +
          '<div class="xs muted" style="margin-top:11px;line-height:1.7">孩子确认之后才生效。' +
          '在那之前一切照旧 —— 不能单方面改。</div>' +
          '<button class="btn ghost sm mt12" data-cancel="' + p.id + '">撤回</button>' +
          '</div>').join('');
      }

      /* 孩子发起、等我点头 */
      if (incoming.length) {
        html += '<div class="sec-title">孩子发起的<span class="more">' + incoming.length + ' 个</span></div>';
        html += incoming.map(p =>
          '<div class="lp-card wait">' +
          '<div class="lp-h"><span class="n">' + UI.esc(p.name) + '</span>' +
          '<span class="tag info">孩子发起</span></div>' +
          '<div class="lp-sub">' + UI.esc(api.plan.summary(p)) + '</div>' +
          (p.note ? '<div class="lp-sub" style="color:var(--muted)">「' + UI.esc(p.note) + '」</div>' : '') +
          planTable(ctx, p) +
          '<button class="btn mt12" data-ok="' + p.id + '">同意并按此发放</button>' +
          '</div>').join('');
      }

      /* 发起入口 */
      html += '<div class="sec-title">发起新方案</div>';
      html += '<div class="lp-modes">' + api.plan.kinds.map(k =>
        '<button class="lp-mode" data-new="' + k.id + '">' +
        '<span class="ic">' + k.icon + '</span>' +
        '<span class="tx"><b>' + k.name + '</b><i>' + k.desc + '</i></span>' +
        '<span class="pv">›</span></button>').join('') + '</div>';

      /* 历史 */
      if (hist.length) {
        html += '<div class="sec-title">历史<span class="more">' + hist.length + ' 个</span></div>';
        html += '<div class="list">' + hist.map(p =>
          '<div class="li" data-open="' + p.id + '"><div class="ico">' +
          (p.kind === 'taper' ? '🎓' : '🏖') + '</div>' +
          '<div class="grow"><div style="font-size:14px;font-weight:700">' + UI.esc(p.name) + '</div>' +
          '<div class="xs muted" style="margin-top:3px">' + UI.esc(api.plan.summary(p)) + '</div></div>' +
          '<span class="tag ' + (p.status === 'done' ? 'gray' : 'info') + '">' +
          (p.status === 'done' ? '已结束' : '已婉拒') + '</span></div>').join('') + '</div>';
      }

      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      const api = ctx.api;
      el.querySelectorAll('[data-new]').forEach(n => {
        n.onclick = () => ctx.go('supporter.planNew', { kind: n.getAttribute('data-new') });
      });
      el.querySelectorAll('[data-open]').forEach(n => {
        n.onclick = () => ctx.go('supporter.planNew', { id: n.getAttribute('data-open') });
      });
      el.querySelectorAll('[data-ok]').forEach(n => n.onclick = () => {
        api.plan.confirm(n.getAttribute('data-ok'));
        ctx.refreshTop();
        UI.toast('已同意，从生效月起按新方案发放');
      });
      el.querySelectorAll('[data-cancel]').forEach(n => n.onclick = () => {
        UI.confirm({
          title: '撤回这个方案？', desc: '孩子那边就不会再看到它了，一切照旧。',
          okText: '撤回',
          onOk() { api.plan.cancel(n.getAttribute('data-cancel')); ctx.refreshTop(); UI.toast('已撤回'); }
        });
      });
      el.querySelectorAll('[data-end]').forEach(n => n.onclick = () => {
        UI.confirm({
          title: '提前结束方案？', desc: '下个月起恢复按基准 <span class="v-out">¥' + U.won(api.plan.base()) + '</span> 发放。',
          okText: '结束方案',
          onOk() { api.plan.end(n.getAttribute('data-end')); ctx.refreshTop(); UI.toast('已结束，恢复基准'); }
        });
      });
    }
  };

  /* ---- 发起方案：参数走 URL，和「发起协商」一个套路 ---- */
  P['supporter.planNew'] = {
    title: '发起生活费方案', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const p = ctx.params;

      /* 已经存在的方案 → 只读展示 */
      if (p.id) {
        const plan = api.plan.get(p.id);
        if (!plan) return UI.empty('🔍', '找不到这个方案');
        return '<div class="pad">' +
          '<div class="lp-card ' + (plan.kind === 'taper' ? 'grad' : 'live') + '">' +
          '<div class="lp-h"><span class="n">' + UI.esc(plan.name) + '</span>' +
          '<span class="tag gray">' + (plan.status === 'done' ? '已结束' : '已婉拒') + '</span></div>' +
          '<div class="lp-sub">' + UI.esc(api.plan.summary(plan)) + '</div>' +
          planTable(ctx, plan) + planLog(plan) + '</div>' +
          '<div style="height:30px"></div></div>';
      }

      const kind = p.kind || 'holiday';
      const today = LJ.clock.now();
      const base = api.plan.base();
      /* 假期预置：按当前模拟日期找"下一个暑假 / 下一个寒假" */
      const y = U.parse(today).getFullYear();
      const summer = (y + '-07-01') >= today ? [y + '-07-01', y + '-08-31'] : [(y + 1) + '-07-01', (y + 1) + '-08-31'];
      const winter = (y + '-01-15') >= today ? [y + '-01-15', y + '-02-20'] : [(y + 1) + '-01-15', (y + 1) + '-02-20'];
      const useWinter = p.preset === 'winter';
      const presetRange = kind === 'holiday' ? (useWinter ? winter : summer) : null;
      const from = p.from || (presetRange ? presetRange[0] : today);
      const to = p.to || (presetRange ? presetRange[1] : U.addMonths(today, 2));
      const mode = p.mode || 'half';
      const months = Number(p.months) || 6;
      const startMonth = p.startMonth || today.slice(0, 7);
      const isSummer = from.slice(5, 7) === '07';

      const draft = kind === 'taper'
        ? {
          kind: 'taper', name: startMonth.slice(0, 4) + ' 毕业过渡',
          startMonth: startMonth, months: months, mode: 'taper', base: base
        }
        : {
          kind: 'holiday', name: from.slice(0, 4) + (isSummer ? ' 暑假' : ' 寒假'),
          from: from, to: to, mode: mode, base: base
        };

      let html = '<div class="pad">';

      /* ① 类型 */
      html += '<div class="sec-title">① 选一种方案</div>';
      html += '<div class="seg" style="margin-top:2px">' + api.plan.kinds.map(k =>
        '<button class="' + (k.id === kind ? 'on' : '') + '" data-kind="' + k.id + '">' +
        k.icon + ' ' + k.name + '</button>').join('') + '</div>';

      if (kind === 'holiday') {
        /* ② 假期区间 */
        html += '<div class="sec-title">② 哪个假期</div>';
        html += '<div class="row" style="gap:8px;padding:2px 0">' +
          '<button class="chip ' + (useWinter ? '' : 'on') + '" data-set="preset=summer">☀️ 下一个暑假</button>' +
          '<button class="chip ' + (useWinter ? 'on' : '') + '" data-set="preset=winter">❄️ 下一个寒假</button>' +
          '</div>';
        html += '<div class="card mt12">' +
          '<div class="cm-kv"><span>开始</span><b>' + from + '</b></div>' +
          '<div class="cm-kv"><span>结束</span><b>' + to + '</b></div>' +
          '<div class="xs muted" style="margin-top:10px;line-height:1.7">' +
          '跨到的整月是 <b>' + LJ.engine.planMonths(draft).join('、') + '</b>，' +
          '按这几个月的发放额计算。</div></div>';

        /* ③ 发放方式 */
        html += '<div class="sec-title">③ 假期怎么发</div>';
        html += '<div class="lp-modes">' + api.plan.modes.map(m =>
          '<button class="lp-mode' + (m.id === mode ? ' on' : '') + '" data-set="mode=' + m.id + '">' +
          '<span class="ic">' + m.icon + '</span>' +
          '<span class="tx"><b>' + m.name + '</b><i>' + m.desc + '</i></span>' +
          '<span class="pv">' + m.preview(base) + '</span></button>').join('') + '</div>';
      } else {
        /* ② 递减起点 */
        html += '<div class="sec-title">② 从哪个月开始递减</div>';
        html += '<div class="row" style="gap:8px;padding:2px 0;flex-wrap:wrap">' +
          [0, 1, 2, 3, 4, 5].map(i => {
            const mk = U.addMonths(today, i).slice(0, 7);
            return '<button class="chip ' + (mk === startMonth ? 'on' : '') +
              '" data-set="startMonth=' + mk + '">' + Number(mk.slice(5)) + ' 月</button>';
          }).join('') + '</div>';
        html += '<div class="sec-title">③ 几个月递减到 0</div>';
        html += '<div class="row" style="gap:8px;padding:2px 0">' +
          [3, 4, 5, 6, 9, 12].map(n =>
            '<button class="chip ' + (n === months ? 'on' : '') +
            '" data-set="months=' + n + '">' + n + ' 个月</button>').join('') + '</div>';
        html += '<div class="proto mt16"><div class="ph"><span class="seal">意</span>递减到 0 才算真的独立</div>' +
          '<div class="xs t2" style="line-height:1.8">跑完最后一个月之后，系统<b>不再自动发放生活费</b>，' +
          '也不会悄悄恢复成原来的金额。生活费这件事从这里交回给他自己。</div></div>';
      }

      /* ④ 预览 */
      html += '<div class="sec-title">④ 确认发放表</div>';
      html += '<div class="lp-card ' + (kind === 'taper' ? 'grad' : 'live') + '">' +
        '<div class="lp-h"><span class="n">' + UI.esc(draft.name) + '</span>' +
        '<span class="tag info">预览</span></div>' +
        '<div class="lp-sub">' + UI.esc(LJ.engine.planSummary(draft)) + '</div>' +
        planTable(ctx, draft) + '</div>';

      /* ⑤ 留言 + 发起 */
      html += '<div class="sec-title">⑤ 跟孩子说一句</div>';
      html += '<div class="card"><textarea class="ta" id="lpNote" rows="3" ' +
        'placeholder="比如：寒假你在家住，吃饭基本不用花钱，就先按一半给。"></textarea></div>';
      html += '<button class="btn mt16" id="lpSend">发起，等孩子确认</button>' +
        '<div class="xs muted" style="margin-top:10px;line-height:1.7;text-align:center">' +
        '孩子确认之前不生效，一切照旧。</div>';

      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      const api = ctx.api;
      const p = ctx.params;
      if (p.id) return;   // 只读展示

      const set = (kv) => {
        const next = {};
        ['kind', 'preset', 'mode', 'months', 'startMonth'].forEach(k => {
          if (p[k] != null) next[k] = p[k];
        });
        kv.split('&').forEach(pair => {
          const i = pair.indexOf('=');
          next[pair.slice(0, i)] = pair.slice(i + 1);
        });
        ctx.replace('supporter.planNew', next);
      };

      el.querySelectorAll('[data-kind]').forEach(n => n.onclick = () =>
        ctx.replace('supporter.planNew', { kind: n.getAttribute('data-kind') }));
      el.querySelectorAll('[data-set]').forEach(n => n.onclick = () => set(n.getAttribute('data-set')));

      const send = el.querySelector('#lpSend');
      if (send) send.onclick = () => {
        const note = (el.querySelector('#lpNote') || {}).value || '';
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
            name: (p.from || pr[0]).slice(0, 4) + ((p.from || pr[0]).slice(5, 7) === '07' ? ' 暑假' : ' 寒假'),
            from: p.from || pr[0], to: p.to || pr[1],
            mode: p.mode || 'half', note: note
          });
        ctx.replace('supporter.plan', {});
        UI.toast('已发起「' + rec.name + '」，等孩子确认');
      };
    }
  };

  /* ============================================================
     专项支持（3.5.1 开学季 / 3.5.2 实习求职 / 3.5.4 应急医疗 / 3.4.4 定向用途）
     家人有开立和转入权，但**只能看到进度**。
     这一页刻意不渲染任何一笔明细 —— 连分类构成都不给。
     ============================================================ */
  function supFundCard(api, f) {
    const o = api.fund.overview(f);
    const k = LJ.engine.fundKind(f.kind);
    return '<div class="fu-card' + (f.status === 'closed' ? ' done' : '') + '">' +
      '<div class="fu-h"><span class="n">' + k.icon + ' ' + UI.esc(o.name) + '</span>' +
      '<span class="fu-use">' + (f.status === 'closed' ? '已结项' : '仅限' + o.categoryName) + '</span></div>' +
      '<div class="fu-nums">' +
      '<div><div class="k">计划</div><div class="v">¥' + U.won(o.target) + '</div></div>' +
      '<div><div class="k">已转入</div><div class="v v-in">¥' + U.won(o.inTotal) + '</div></div>' +
      '<div><div class="k">剩余</div><div class="v"' +
      (o.remaining < 0 ? ' style="color:var(--danger)"' : '') + '>¥' + U.won(o.remaining) + '</div></div>' +
      '</div>' +
      '<div class="fu-bar' + (o.over ? ' over' : '') + '">' +
      '<div class="track"><i style="width:' + Math.round(o.ratio * 100) + '%"></i></div>' +
      '<div class="cap"><span>已用 <span class="v-out">¥' + U.won(o.used) + '</span> · ' + o.count + ' 笔</span>' +
      '<span class="p">' + Math.round(o.ratio * 100) + '%</span></div></div>' +
      (f.periodEnd ? '<div class="fu-note" style="color:var(--muted)">有效期至 ' +
        U.ymdCN(f.periodEnd) + '</div>' : '') +
      '<div class="fu-see"><div class="sh">你能看到的就这些</div><ul>' +
      '<li>转入了多少、用掉了多少、还剩多少、几笔</li>' +
      '<li class="no">买了什么、在哪买的 —— 看不到，也不该看到</li>' +
      '</ul></div>' +
      (f.status === 'active' ? '<div class="row" style="gap:8px;margin-top:13px">' +
        '<button class="btn sm grow" data-topup="' + f.id + '">再转入一笔</button>' +
        '<button class="btn ghost sm" data-close="' + f.id + '">结项</button></div>' : '') +
      '</div>';
  }

  P['supporter.fund'] = {
    title: '专项支持', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const list = api.fund.list();
      const live = list.filter(f => f.status === 'active');
      const closed = list.filter(f => f.status === 'closed');
      const scene = api.fund.scene();
      const suggestKind = scene ? scene.kind : 'term';
      const suggest = scene ? scene.suggest : 3000;
      let html = '<div class="pad">';

      if (scene) {
        html += '<div class="fu-scene">' +
          '<div class="sh"><b>现在是' + scene.name + '</b><span class="tag info">建议开一个</span></div>' +
          '<div class="sd">' + UI.esc(scene.hint) + '</div>' +
          '<button class="btn mt12" style="margin-top:12px" data-quick="' + suggestKind +
          '&target=' + suggest + '">一键开「' + LJ.engine.fundKind(suggestKind).name + '」</button>' +
          '</div>';
      }

      html += '<div class="proto mt16"><div class="ph"><span class="seal">专</span>专项和补贴不一样</div>' +
        '<div class="sm t2" style="line-height:1.8">' +
        '大额支出（学费、实习、看病）如果不单独放，会和日常消费混在一起，' +
        '既看不清也用不稳。<br>专项把钱圈在<b>一个用途</b>里，' +
        '你随时能看到用掉几成 —— 但看不到任何一笔买的是什么。</div></div>';

      html += '<div class="sec-title">进行中<span class="more">' + live.length + ' 个</span></div>';
      if (!live.length) {
        html += '<div class="card flat"><div class="sm muted" style="text-align:center;padding:14px 0">' +
          '还没有专项资金</div></div>';
      } else {
        html += live.map(f => supFundCard(api, f)).join('');
      }

      html += '<div class="sec-title">开一个新专项</div>';
      html += '<div class="fu-kinds">' + api.fund.kinds.map(k =>
        '<button class="fu-kind" data-new="' + k.id + '">' +
        '<span class="ic">' + k.icon + '</span>' +
        '<span class="tx"><b>' + k.name + '</b><i>' + k.desc + '</i></span>' +
        '<span class="pv">¥' + U.won(k.range[0]) + ' 起</span></button>').join('') + '</div>';

      if (closed.length) {
        html += '<div class="sec-title">已结项<span class="more">' + closed.length + ' 个</span></div>';
        html += closed.map(f => supFundCard(api, f)).join('');
      }

      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      const api = ctx.api;

      const openNew = (kindId, presetTarget) => {
        const k = LJ.engine.fundKind(kindId);
        const box = document.createElement('div');
        box.innerHTML =
          '<div class="cm-kv"><span>名称</span></div>' +
          '<input class="ta" id="fuName" style="min-height:44px" value="' + UI.esc(k.name) + '">' +
          '<div class="cm-kv" style="margin-top:12px"><span>计划金额</span></div>' +
          '<input class="ta" id="fuTarget" inputmode="decimal" style="min-height:44px" value="' +
          (presetTarget || k.range[0]) + '">' +
          (k.category ? '<div class="cm-kv" style="margin-top:12px"><span>只能用于</span><b>' +
            LJ.catById(k.category).name + '</b></div>' : '') +
          '<div class="cm-kv" style="margin-top:12px"><span>先转入多少</span></div>' +
          '<input class="ta" id="fuIn" inputmode="decimal" style="min-height:44px" ' +
          'placeholder="可以先不转，之后再转">';
        UI.sheet({
          title: '开立' + k.name,
          sub: k.desc + (k.id === 'medical'
            ? '。这个专项只反馈使用进度，不反馈明细。' : ''),
          mount(s, close) {
            s.appendChild(box);
            const b = document.createElement('button');
            b.className = 'btn mt16'; b.textContent = '开立并转入';
            b.onclick = () => {
              const num = id => Number(String((box.querySelector(id) || {}).value || '').replace(/[^\d.]/g, ''));
              const name = String(box.querySelector('#fuName').value || '').trim();
              const target = num('#fuTarget');
              if (!name) return UI.toast('给专项起个名字');
              if (!(target > 0)) return UI.toast('填一下计划金额');
              close();
              const f = api.fund.create({ kind: k.id, name: name, target: target });
              const amt = num('#fuIn');
              if (amt > 0) api.fund.topUp(f.id, amt, '');
              ctx.refreshTop();
              UI.toast('已开立' + (amt > 0 ? '，转入 ¥' + U.won(amt) : ''));
            };
            s.appendChild(b);
          }
        });
      };

      el.querySelectorAll('[data-new]').forEach(n =>
        n.onclick = () => openNew(n.getAttribute('data-new')));
      el.querySelectorAll('[data-quick]').forEach(n => n.onclick = () => {
        const kv = n.getAttribute('data-quick').split('&');
        openNew(kv[0], Number(kv[1].split('=')[1]));
      });

      el.querySelectorAll('[data-topup]').forEach(n => n.onclick = () => {
        const f = api.fund.get(n.getAttribute('data-topup'));
        if (!f) return;
        const o = api.fund.overview(f);
        const box = document.createElement('div');
        box.innerHTML = '<div class="cm-kv"><span>离计划金额还差</span><b>¥' +
          U.won(Math.max(0, o.target - o.inTotal)) + '</b></div>' +
          '<input class="ta" id="tuAmt" inputmode="decimal" style="min-height:48px;margin-top:12px" ' +
          'placeholder="转入金额">' +
          '<div class="row" style="gap:8px;margin-top:12px">' +
          [500, 1000, 2000].map(v => '<button class="chip" data-v="' + v + '">¥' + v + '</button>').join('') +
          '</div>';
        UI.sheet({
          title: '转入「' + f.name + '」',
          sub: '转入后立刻计入账本，孩子那边会收到到账通知。',
          mount(s, close) {
            s.appendChild(box);
            const inp = box.querySelector('#tuAmt');
            box.querySelectorAll('[data-v]').forEach(c => c.onclick = () => {
              inp.value = c.getAttribute('data-v');
            });
            const b = document.createElement('button');
            b.className = 'btn mt16'; b.textContent = '确认转入';
            b.onclick = () => {
              const amt = Number(String(inp.value || '').replace(/[^\d.]/g, ''));
              if (!(amt > 0)) return UI.toast('填一下金额');
              close();
              try {
                api.fund.topUp(f.id, amt, '');
                ctx.refreshTop();
                UI.toast('已转入 ¥' + U.won(amt));
              } catch (e) { UI.toast(e.message); }
            };
            s.appendChild(b);
          }
        });
      });

      el.querySelectorAll('[data-close]').forEach(n => n.onclick = () => {
        const f = api.fund.get(n.getAttribute('data-close'));
        const o = f ? api.fund.overview(f) : null;
        UI.confirm({
          title: '结项这个专项？',
          desc: o ? '共转入 ¥' + U.won(o.inTotal) + '，用掉 ¥' + U.won(o.used) +
            '，剩余 ¥' + U.won(o.remaining) + '。「还没花完」这件事会一起记进留痕。' : '',
          okText: '结项',
          onOk() { api.fund.close(f.id); ctx.refreshTop(); UI.toast('已结项'); }
        });
      });
    }
  };

  /* ============================================================
     成长月报（3.4.3.1）—— 月度 / 季度
     家长端的门面页。只有成长类数据：指数曲线、任务、里程碑、月度要点。
     没有任何一笔消费 —— 连"大类构成"都不给，那是他的账本。
     ============================================================ */
  P['supporter.report'] = {
    title: '成长月报', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      /* 015 门禁接线：月报由孩子「连续记账 30 天」解锁（monthly_report）。
         原来这个门禁挂在陪伴页的卡上 —— 卡按用户要求删了，门禁不能跟着
         变成摆设（smoke 会红：「声明了没接线」）。钉到**月报页自己**身上：
         门禁在消费处比在入口处更诚实 —— 没解锁时进这一页看到的是
         「为什么还没有」，而不是一份空报告。 */
      if (!api.unlock.has('monthly_report')) {
        return '<div class="pad">' +
          '<div class="lk-card" style="margin-top:16px">' +
          '<div class="lk-h"><span class="lk-ic">🔒</span>' +
          '<div><div class="lk-n">成长月报还没开放</div>' +
          '<div class="lk-s">孩子完成「连续记账 30 天」之后，这里会出现月度成长报告</div></div></div>' +
          '<div class="lk-d">月报只呈现成长类数据（指数变化、任务完成情况），不含任何消费细节。' +
          '先让他养成记录的习惯，报告才有意义。</div></div>' +
          '</div>';
      }
      const y = api.youth();
      const months = api.report.months(6);
      const trend = api.report.trend(6);
      const quarters = api.report.quarters();
      /* 曲线不是单调的，让 engine 按形状生成叙述，别在页面里假设"一路上行" */
      const narr = LJ.engine.trendNarrative(months, y ? y.nickname : '孩子');

      if (!months.length) {
        return '<div class="pad">' + UI.empty('📈', '还没有完整的月份',
          '等第一个完整的记账月份过完，这里会开始出现成长报告。') + '</div>';
      }

      let html = '<div class="pad">';

      /* ---------- 指数曲线 ---------- */
      const W = 300, H = 84, PAD = 10;
      const scores = months.map(m => m.control);
      const lo = Math.min.apply(null, scores) - 5;
      const hi = Math.max.apply(null, scores) + 5;
      const xAt = i => PAD + i * (W - PAD * 2) / Math.max(1, months.length - 1);
      const yAt = v => H - PAD - (v - lo) / Math.max(1, hi - lo) * (H - PAD * 2);
      const pts = months.map((m, i) => xAt(i).toFixed(1) + ',' + yAt(m.control).toFixed(1));
      const last = months[months.length - 1];
      const area = pts.join(' ') + ' ' + xAt(months.length - 1).toFixed(1) + ',' + H + ' ' + PAD + ',' + H;

      html += '<div class="rp-hero">' +
        '<div class="row between" style="align-items:flex-start">' +
        '<div><div class="rp-n">' + last.control + '</div>' +
        /* 标清是哪个月：这里只统计"过完的整月"，所以不等于实时指数 */
        '<div class="rp-k">' + last.month + ' 掌控指数 · ' + last.level + '</div></div>' +
        '<div class="rp-delta ' + (trend.delta >= 0 ? 'up' : 'down') + '">' +
        (trend.delta >= 0 ? '+' : '') + trend.delta +
        '<i>' + trend.months + ' 个月</i></div></div>' +
        '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto;display:block;margin-top:14px">' +
        '<defs><linearGradient id="rpG" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0%" stop-color="#B394F5" stop-opacity=".38"/>' +
        '<stop offset="100%" stop-color="#B394F5" stop-opacity="0"/></linearGradient></defs>' +
        '<polygon points="' + area + '" fill="url(#rpG)"/>' +
        '<polyline points="' + pts.join(' ') + '" fill="none" stroke="#7C5CE0" stroke-width="2.4" ' +
        'stroke-linecap="round" stroke-linejoin="round"/>' +
        months.map((m, i) => '<circle cx="' + xAt(i).toFixed(1) + '" cy="' + yAt(m.control).toFixed(1) +
          '" r="' + (i === months.length - 1 ? 4 : 2.6) + '" fill="#fff" stroke="#7C5CE0" stroke-width="2"/>').join('') +
        '</svg>' +
        '<div class="rp-axis">' + months.map(m =>
          '<span>' + Number(m.month.slice(5)) + '月</span>').join('') + '</div>' +
        '<div class="rp-note">' + UI.esc(narr.text) + '</div>' +
        '</div>';

      html += '<div class="gr-grid">' +
        '<div class="gr-cell"><div class="k">最稳的一个月</div><div class="v">' + trend.best.control + '</div>' +
        '<div class="s">' + trend.best.month + ' · ' + trend.best.level + '</div></div>' +
        '<div class="gr-cell"><div class="k">最松的一个月</div><div class="v">' + trend.worst.control + '</div>' +
        '<div class="s">' + trend.worst.month + ' · ' + trend.worst.level + '</div></div>' +
        '</div>';

      /* ---------- 能力证据：他主动做过什么 ----------
         这一块是这一版的重点。上一版月报只给「掌控指数 63」——那是一个**分数**，
         家长看到分数只会想"高了还是低了"，看不到能力在不在长。
         证据换一个问法：**这个月他自己动过什么**。
         调预算、砍订阅、做复盘、往目标存钱 —— 这些动作本身就是能力在形成的痕迹，
         而且它们比分数更难伪造：分数是算出来的，动作是他自己做的。

         ★ 只从 E.EVIDENCE 白名单取（见 engine.js）：浏览行为、记账录入、
           一切权限/披露类动作都不算。给家长看「他改过 3 次信息范围」
           等于把隐私边界变成围观对象，和产品哲学直接冲突。
         ★ 文案只说次数和动作名，不含商户、不含单笔金额。 */
      const lastEv = last.evidence || [];
      html += '<div class="sec-title">他主动做过的事<span class="more">' +
        last.month + '</span></div>';
      if (!lastEv.length) {
        html += '<div class="card flat"><div class="sm muted" style="text-align:center;padding:12px 0;line-height:1.7">' +
          '这个月还没有记录到主动调整的动作。<br>' +
          '<span class="xs">这里只记录他自己的操作，不含浏览和记账。</span></div></div>';
      } else {
        const dims = LJ.engine.evidenceByDim(lastEv);
        html += '<div class="card">' + Object.keys(dims).map(d =>
          '<div style="margin-bottom:13px"><div class="xs muted" style="font-weight:700;letter-spacing:.04em">' +
          UI.esc(d) + '</div>' +
          '<div class="mt8" style="margin-top:7px">' + dims[d].map(e =>
            '<div class="row" style="gap:8px;margin-bottom:6px">' +
            '<span style="color:var(--ok);font-weight:800">·</span>' +
            '<span class="sm" style="line-height:1.6">' + UI.esc(e.text) + '</span></div>').join('') +
          '</div></div>').join('') +
          '<div class="xs muted" style="line-height:1.7;padding-top:11px;border-top:1px solid var(--line-2)">' +
          '这些是他自己操作的记录，不含浏览行为，也不含任何一笔消费明细。</div>' +
          '</div>';
      }

      html += '<div class="sec-title">逐月<span class="more">' + months.length + ' 期</span></div>';
      html += months.slice().reverse().map(m =>
        '<div class="rp-card">' +
        '<div class="row between"><div><div class="rp-m">' + m.month + '</div>' +
        '<div class="rp-lv">' + UI.esc(m.level) + '</div></div>' +
        '<div class="rp-sc">' + m.control + '<i>分</i></div></div>' +
        '<div class="rp-nums">' +
        '<div><div class="k">支出</div><div class="v v-out">¥' + U.won(m.expense) + '</div></div>' +
        '<div><div class="k">结余</div><div class="v ' +
        (m.net > 0 ? 'v-in' : m.net < 0 ? 'v-out' : 'v-zero') + '">¥' + U.won(m.net) + '</div></div>' +
        '<div><div class="k">主动动作</div><div class="v">' + (m.evidenceCount || 0) + '<i>次</i></div></div>' +
        '</div>' +
        /* 逐月也带一条证据摘要 —— 分数会波动，动作不会 */
        ((m.evidence || []).length
          ? '<div class="xs t2" style="margin-top:9px;line-height:1.7">' +
          m.evidence.slice(0, 3).map(e => UI.esc(e.text)).join(' · ') + '</div>'
          : '') +
        '<div class="rp-t">' + UI.esc(m.note) + '</div>' +
        '</div>').join('');

      if (quarters.length) {
        html += '<div class="sec-title">按季度<span class="more">' + quarters.length + ' 个</span></div>';
        html += '<div class="list">' + quarters.slice().reverse().map(q =>
          '<div class="li" style="display:block;padding:15px 18px">' +
          '<div class="row between"><span class="sm" style="font-weight:800">' + q.quarter + '</span>' +
          '<span class="tag ' + (q.controlTo >= q.controlFrom ? 'ok' : 'gray') + '">' +
          q.controlFrom + ' → ' + q.controlTo + '</span></div>' +
          '<div class="xs muted" style="margin-top:9px;line-height:1.7">' +
          q.months + ' 个月 · 支出 <span class="v-out">¥' + U.won(q.expense) + '</span> · 结余 <span class="' +
          (q.net > 0 ? 'v-in' : q.net < 0 ? 'v-out' : 'v-zero') + '">¥' + U.won(q.net) + '</span>' +
          ' · 完成 ' + q.tasksDone + ' 项任务</div>' +
          '</div>').join('') + '</div>';
      }

      html += '<div class="proto mt20"><div class="ph"><span class="seal">报</span>这份报告里有什么、没有什么</div>' +
        '<div class="xs t2" style="line-height:1.85">' +
        '有：掌控指数的变化、每个月花得最多的是哪<b>一类</b>、完成了多少成长任务、拿到多少里程碑。<br>' +
        '没有：任何一笔消费的金额、商户、时间。<br>' +
        '月度报告的意义是让你看到<b>他在往哪个方向走</b>，不是让你复盘他买了什么。</div></div>';

      html += '<div style="height:30px"></div></div>';
      return html;
    }
  };

})(window.LJ);
