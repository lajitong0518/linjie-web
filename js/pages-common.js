/* ============================================================
   pages-common.js —— 双端共用页面
   ============================================================ */
(function (LJ) {
  'use strict';
  const U = LJ.util, UI = LJ.ui, P = LJ.pages;

  /* ============================================================
     权限自检 —— 把"分层披露"从概念变成可触摸的东西
     ============================================================ */
  P['common.contracts'] = {
    title: '权限自检', chrome: 'plain',
    render(ctx) {
      const c = LJ.api.contracts();
      const role = ctx.role;
      const DETAIL = ['entry.list()', 'entry.get()', 'entry.create()', 'entry.update()', 'entry.remove()', 'entry.byMonth()'];
      const mine = role === 'supporter' ? c.supporter : c.youth;

      let html = '<div class="pad">';
      html += '<div class="proto mt16"><div class="ph"><span class="seal">验</span>这不是前端隐藏</div>' +
        '<div class="sm t2" style="line-height:1.75">下方是服务层真实暴露的接口清单。' +
        '支持人端的 API 对象上<b>没有</b>账本明细的命名空间——不是调用被拒绝，而是这个方法不存在。' +
        '将来换成真实后端时，这一层的契约原样保留。</div></div>';

      /* 接口对比 */
      html += '<div class="sec-title">两端接口对比</div>';
      html += '<div class="card">' +
        '<div class="row between" style="padding-bottom:10px;border-bottom:1px solid var(--line-2)">' +
        '<span class="xs" style="font-weight:700;color:var(--navy)">青年端（' + c.youth.length + ' 个）</span>' +
        '<span class="xs" style="font-weight:700;color:var(--navy)">支持人端（' + c.supporter.length + ' 个）</span>' +
        '</div>' +
        '<div class="row" style="align-items:flex-start;gap:10px;padding-top:12px">' +
        '<div style="flex:1">' + c.youth.map(x => apiRow(x, DETAIL.indexOf(x) >= 0, role === 'youth')).join('') + '</div>' +
        '<div style="flex:1">' + c.supporter.map(x => apiRow(x, false, role === 'supporter')).join('') + '</div>' +
        '</div></div>';

      /* 账本明细接口：只在青年端存在 */
      html += '<div class="sec-title">账本明细接口（仅青年端）</div>';
      html += '<div class="card" style="background:#FFFFFF;border:1px dashed #E8C9B0">' +
        c.detailOnly.map(x => '<div class="mono xs" style="padding:4px 0;color:var(--danger)">✕ ' + x + '</div>').join('') +
        '<div class="xs t2 mt12" style="margin-top:10px;line-height:1.7">' +
        '这 6 个接口在支持人端<b>根本不存在</b>。支持人端能拿到的，只有聚合后的状态、健康度指标与分类总额。</div>' +
        '</div>';

      /* 其余青年端独占能力 */
      html += '<div class="sec-title">其余仅青年端可用的能力</div>';
      html += '<div class="card">' +
        c.difference.filter(x => x.indexOf('entry.') < 0).map(x =>
          '<span class="chip" style="margin:0 6px 6px 0">' + UI.esc(x) + '</span>').join('') +
        '<div class="xs muted mt12" style="margin-top:10px;line-height:1.7">' +
        '记账、预算、支持对账、申请发起等操作只有账户本人可以做。' +
        '支持人端的全部能力，只有查看聚合状态与响应协商。</div>' +
        '</div>';

      /* 当前披露配置 */
      const cur = role === 'supporter'
        ? ctx.api.disclosure.current()
        : ctx.api.disclosure.current();
      html += '<div class="sec-title">当前生效的披露配置</div>';
      html += '<div class="card"><div class="row between">' +
        '<div><div class="sm" style="font-weight:600">' + UI.esc(cur.name) + '模式</div>' +
        '<div class="xs muted" style="margin-top:3px">' + UI.esc(cur.desc) + '</div></div>' +
        '<span class="tag info">' + cur.shows.length + ' 项</span></div>' +
        '<div class="mt12" style="margin-top:12px">' + cur.shows.map(s =>
          '<span class="chip" style="margin:0 6px 6px 0">' + ({
            status: '支持状态', health: '三项健康度', categoryMonthly: '大类月度总额',
            budgetProgress: '预算执行率', directedProgress: '专项进度'
          }[s] || s) + '</span>').join('') + '</div>' +
        '</div>';

      /* 样本数据包 */
      html += '<div class="sec-title">同一笔消费，两端收到的数据</div>';
      html += '<div class="card" style="background:#0F1720;border:none">' +
        '<div class="xs" style="color:#5D9BE8;font-weight:700;letter-spacing:.08em;margin-bottom:8px">青年端 · entry.list()</div>' +
        '<pre class="mono" style="margin:0 0 16px;color:#C6D2E0;font-size:11px;line-height:1.75;white-space:pre-wrap">' +
        '{ id: "e0012",\n  date: "2026-09-14",\n  amount: 398,\n  merchant: "密室逃脱",\n  category: "fun",\n  fundingSource: "family" }</pre>' +
        '<div class="xs" style="color:#E8A33D;font-weight:700;letter-spacing:.08em;margin-bottom:8px">支持人端 · status().categories[]</div>' +
        '<pre class="mono" style="margin:0;color:#C6D2E0;font-size:11px;line-height:1.75;white-space:pre-wrap">' +
        '{ id: "fun",\n  name: "休闲娱乐",\n  amount: 1156,\n  ratio: 18,\n  delta: 12 }</pre>' +
        '<div class="xs mt12" style="margin-top:14px;color:#7C8798;line-height:1.7">' +
        '没有 amount、没有 merchant、没有 date——聚合字段里不存在这些位置。' +
        '这不是脱敏，是从来没查出来过。</div>' +
        '</div>';

      html += '<div style="height:30px"></div></div>';
      return html;

      function apiRow(name, isDetail, isMine) {
        const deny = !isMine && isDetail;
        return '<div class="mono" style="font-size:10.5px;padding:3px 0;color:' +
          (isDetail ? (isMine ? 'var(--ok)' : '#C9CFD8') : 'var(--text-2)') + ';' +
          (isDetail && !isMine ? 'text-decoration:line-through;opacity:.5' : '') + '">' +
          (isDetail ? (isMine ? '✓ ' : '✕ ') : '· ') + UI.esc(name) + '</div>';
      }
    }
  };

  /* ============================================================
     留痕记录
     ============================================================ */
  P['common.audit'] = {
    title: '留痕记录', chrome: 'plain',
    render(ctx) {
      const list = ctx.api.audit.list();
      if (!list.length) return UI.empty('📜', '还没有留痕记录');
      let html = '<div class="pad mt16">';
      html += '<div class="proto"><div class="ph"><span class="seal">痕</span>全程可追溯</div>' +
        '<div class="sm t2" style="line-height:1.7">权限变更、支持登记、查看行为都会记录在案，' +
        '双方看到的是同一份记录。</div></div>';
      html += '<div class="list mt16">' + list.map(a => {
        const actor = LJ.store.find('user', a.actorId) || { name: '系统' };
        return '<div class="li"><div class="ico" style="background:#F7F6FA">📌</div>' +
          '<div class="grow"><div class="row between">' +
          '<span style="font-size:14px;font-weight:500">' + UI.esc(a.action) + '</span>' +
          '<span class="xs muted mono">' + UI.esc((a.at || '').slice(0, 16).replace('T', ' ')) + '</span></div>' +
          '<div class="row between" style="margin-top:5px">' +
          '<span class="xs muted">' + UI.esc(a.detail || '') + '</span>' +
          '<span class="xs muted">' + UI.esc(actor.name) + '</span></div></div></div>';
      }).join('') + '</div></div>';
      return html;
    }
  };

  /* ============================================================
     消息中心
     ============================================================ */
  P['common.messages'] = {
    title: '消息中心', chrome: 'plain',
    render(ctx) {
      const list = ctx.api.message.list();
      if (!list.length) return UI.empty('🔔', '暂无消息');
      const T = { support: ['💠', '支持'], request: ['✉️', '协商'], risk: ['⚠️', '风险'], system: ['⚙️', '系统'] };
      let html = '<div class="pad mt16">';
      html += '<div class="list">' + list.map(m => {
        const t = T[m.type] || T.system;
        return '<div class="li" data-msg="' + m.id + '" style="' + (m.read ? 'opacity:.62' : '') + '">' +
          '<div class="ico">' + t[0] + '</div>' +
          '<div class="grow"><div class="row between">' +
          '<span class="ellipsis" style="font-size:14px;font-weight:600">' + UI.esc(m.title) + '</span>' +
          (m.read ? '' : '<span class="tag danger">新</span>') + '</div>' +
          '<div class="sm muted" style="margin-top:4px;line-height:1.6">' + UI.esc(m.body) + '</div>' +
          '<div class="xs muted" style="margin-top:5px">' + UI.esc((m.at || '').slice(0, 16).replace('T', ' ')) + '</div>' +
          '</div></div>';
      }).join('') + '</div></div>';
      return html;
    },
    mount(el, ctx) {
      el.querySelectorAll('[data-msg]').forEach(n => {
        n.onclick = () => { ctx.api.message.read(n.getAttribute('data-msg')); ctx.refreshTop(); };
      });
    }
  };

  /* ============================================================
     帮助
     ============================================================ */
  P['common.help'] = {
    title: '帮助与说明', chrome: 'plain',
    render(ctx) {
      const isYouth = ctx.role === 'youth';
      const FAQ = isYouth ? [
        ['家人能看到我的每一笔消费吗？', '不能。单笔交易明细在服务端就不会下发到支持人端。对方只能看到你按约定开放的范围，通常是六大类的月度总额。'],
        ['信息范围是谁定的？', '双方共同确认。你可以在「我的 → 省心模式」里发起调整，对方也可以发起，但都需要另一方确认后才生效，且全程留痕。'],
        ['家庭支持资金和个人自有资金有什么区别？', '家庭支持资金是家人转来的部分，可以按约定开放宏观状态；个人自有资金（奖学金、红包等）默认完全独立，不对家人开放任何信息。'],
        ['为什么要做支持对账？', '因为口头说不清。每一笔支持由双方共同确认后才计入账本，边界清楚，也避免了"我以为给了"这类误会。'],
        ['如果我不想接受一笔支持？', '可以直接暂不确认，对方会收到提示，不会有对抗性的表达。'],
        ['撤回授权之后会怎样？', '对方立即失去对应范围的读取权限。历史留痕仍然保留，因为留痕本身也是保护你的。']
      ] : [
        ['我为什么看不到具体的消费明细？', '这是产品的核心设计。单笔明细在服务端就不会下发到你这一端——不是被隐藏，而是数据库查询里根本没有这笔记录。'],
        ['那我能知道什么？', '本月支持状态、三项健康度指标、六大类月度支出总额与环比。这些是做出支持决策所需要的全部信息。'],
        ['我能自己扩大查看范围吗？', '不能单方面扩大。你可以在「查看范围」页发起申请，由对方确认后才生效。对方也可以拒绝。'],
        ['四色状态分别是什么意思？', '绿色=支持正常，黄色=按当前节奏可能有缺口，橙色=有待处理的申请或调整，蓝色=孩子已具备减少支持的条件。'],
        ['为什么要做支持对账？', '把你已经转过去的钱登记进来，对方确认后双方各记一笔。这样支持记录清清楚楚，不用靠记忆。'],
        ['留痕记录里会有我的查看行为吗？', '会。这是双向的：你能看到孩子的财务成长，孩子也能看到你什么时候看了什么。']
      ];
      let html = '<div class="pad mt16">';
      html += '<div class="proto"><div class="ph"><span class="seal">临</span>临界是什么</div>' +
        '<div class="sm t2" style="line-height:1.8">临界是一个家庭支持协同账户。' +
        '它不改变谁给谁钱这件事，只改变这件事被如何沟通——' +
        '用约定的信息范围替代查账盘问，用标准化的协商替代开口要钱，' +
        '用成长数据替代消费监督。</div>' +
        '<div class="sm t2" style="line-height:1.8;margin-top:10px">名字取自"临界点"：' +
        '从被供养到能自立之间，有一条线。这条线不该由谁单方面划，也不该靠查账来确认有没有跨过去——' +
        '它应该看得见、谈得拢、退得回。产品要做的就是让这条线可管理，' +
        '直到有一天它可以被平稳地跨过。</div></div>';
      html += '<div class="sec-title">常见问题</div>';
      html += FAQ.map((f, i) =>
        '<div class="card flat" style="margin-bottom:10px" data-faq="' + i + '">' +
        '<div class="row between"><span class="sm" style="font-weight:600;flex:1">' + UI.esc(f[0]) + '</span>' +
        '<span class="muted" data-arrow>+</span></div>' +
        '<div class="sm t2" data-answer style="display:none;margin-top:10px;line-height:1.8;' +
        'padding-top:10px;border-top:1px solid var(--line-2)">' + UI.esc(f[1]) + '</div></div>').join('');
      html += '<div class="sec-title">联系我们</div>';
      html += '<div class="list">' +
        '<div class="li"><div class="ico">💬</div><div class="grow"><div style="font-size:14.5px">智能客服</div>' +
        '<div class="xs muted" style="margin-top:2px">7×24 小时在线答疑</div></div><div class="muted">›</div></div>' +
        '<div class="li"><div class="ico">📞</div><div class="grow"><div style="font-size:14.5px">紧急求助专线</div>' +
        '<div class="xs muted" style="margin-top:2px">涉及账户安全时优先处理</div></div><div class="muted">›</div></div>' +
        '</div>';
      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el) {
      el.querySelectorAll('[data-faq]').forEach(n => {
        n.onclick = () => {
          const a = n.querySelector('[data-answer]');
          const open = a.style.display !== 'none';
          a.style.display = open ? 'none' : 'block';
          n.querySelector('[data-arrow]').textContent = open ? '+' : '−';
        };
      });
    }
  };
})(window.LJ);
