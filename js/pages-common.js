/* ============================================================
   pages-common.js —— 双端共用页面
   ============================================================ */
(function (LJ) {
  'use strict';
  const U = LJ.util, UI = LJ.ui, P = LJ.pages;

  /* ============================================================
     往来时间线（009）—— 双端同一副骨架
     ------------------------------------------------------------
     页面只管画：事件从哪来、方向谁对谁、文案怎么说，全是
     api.thread.timeline()（真源 E.timeline）说了算。
     ★ 这里不许写任何「仅青年端」的分支 —— 支持人端的镜像页
       用的是同一个函数，徽记对调就完成了对称。

     卡片方向三件套：轴点颜色 / 卡片边条 / 「谁 → 谁」徽记。
     data-ev="<行id>:<步骤>" 是给探针和断言钉的锚点。
     ============================================================ */
  const TL_KIND_ICON = {
    support: '💠', invite: '🎁', request: '✉️', prepay: '↩️',
    share: '🧾', plan: '🗓', save: '🎯', risk: '🛡'
  };

  function timelineBlock(th) {
    const evs = (th && th.events) || [];
    if (!evs.length) {
      return '<div class="sec-title">往来时间线</div>' +
        '<div class="card flat"><div class="sm muted" style="text-align:center;padding:14px 0">' +
        '还没有往来记录 —— 第一笔支持、一次申请或一份邀约都会出现在这里</div></div>';
    }

    /* 摘要：最近一个有往来的月份，对方几条、我方几条 —— 只报数，不评价 */
    const topMk = String(evs[0].at).slice(0, 7);
    const inTop = evs.filter(e => String(e.at).slice(0, 7) === topMk);
    const themN = inTop.filter(e => e.side === 'them').length;
    const sum = (+topMk.slice(5)) + ' 月 · 对方 ' + themN + ' 次 · 我方 ' +
      (inTop.length - themN) + ' 次';

    const stagger = UI.motion('--dur-stagger') || 40;
    let html = '<div class="sec-title">往来时间线<span class="more">' + evs.length + ' 条</span></div>' +
      '<div class="tl-sum">' + sum + '</div>' +
      '<div class="tl">';
    let mk = '';
    evs.forEach((e, i) => {
      const m = String(e.at).slice(0, 7);
      if (m !== mk) {
        mk = m;
        html += '<div class="tl-mo">' + m.slice(0, 4) + ' 年 ' + (+m.slice(5)) + ' 月</div>';
      }
      const actor = e.side === 'me' ? th.me : th.them;
      const other = e.side === 'me' ? th.them : th.me;
      /* 入场：逐条淡入上移，错位封顶 6 次（再往后同帧进场，别让长流等动画） */
      const delay = Math.min(i, 6) * stagger;
      const recId = String(e.id).split(':')[0];
      html += '<div class="tl-i ' + e.side + '" data-side="' + e.side +
        '" data-kind="' + e.kind + '" data-day="' + e.day + '" data-ev="' + UI.esc(e.id) + '"' +
        (e.go ? ' data-go="' + e.go + '"' + (e.goid ? ' data-goid="' + UI.esc(e.goid) + '"' : '') : '') +
        ' style="animation-delay:' + delay + 'ms">' +
        '<span class="tl-dot"></span>' +
        '<div class="tl-card">' +
        '<div class="tl-head">' +
        '<span class="tl-who ' + e.side + '">' +
        '<span class="tl-av">' + UI.esc(String(actor.avatar || actor.name || '?').slice(0, 1)) + '</span>' +
        (e.side === 'them' ? '<b>' + UI.esc(actor.name) + '</b>' : '') +
        '<span class="tl-ar">→ ' + UI.esc(other.name) + '</span></span>' +
        '<span class="tl-time">' + String(e.at).slice(5, 10).replace('-', '/') + '</span>' +
        '</div>' +
        '<div class="tl-main">' +
        '<span class="tl-ic">' + (TL_KIND_ICON[e.kind] || '•') + '</span>' +
        '<div class="tl-txt grow">' +
        '<div class="tl-t">' + UI.esc(e.verb) + (e.object ? ' · ' + UI.esc(e.object) : '') + '</div>' +
        (e.quote ? '<div class="tl-q">“' + UI.esc(e.quote) + '”</div>' : '') +
        '</div>' +
        '<div class="tl-r">' +
        (e.amount ? '<div class="amt">¥' + U.won(e.amount) + '</div>' : '') +
        (e.tag ? '<span class="tag ' + e.tag[1] + '">' + UI.esc(e.tag[0]) + '</span>' : '') +
        '</div></div>' +
        (e.act === 'settle'
          ? '<div class="tl-act"><button class="btn sm" data-tl-act="settle" data-id="' +
          UI.esc(recId) + '">去核销</button></div>'
          : '') +
        (e.act === 'receipt'
          ? '<div class="tl-act"><button class="btn soft sm" data-tl-act="receipt" data-id="' +
          UI.esc(recId) + '">写一句回执</button></div>'
          : '') +
        '</div></div>';
    });
    return html + '</div>';
  }
  LJ.timelineBlock = timelineBlock;

  /* 时间线的点击：动作按钮在前（拦掉整卡跳转），整卡跳转在后。
     必须在 LJ._bindGo 之后调用 —— _bindGo 只会 ctx.go(page)，
     带 id 的深链（风险详情）靠这里接管。 */
  LJ.bindTimeline = function (el, ctx) {
    el.querySelectorAll('[data-tl-act]').forEach(b => {
      b.onclick = ev2 => {
        if (ev2.stopPropagation) ev2.stopPropagation();
        const act = b.getAttribute('data-tl-act');
        const id = b.getAttribute('data-id');
        if (act === 'settle' && LJ.openSettleSheet) LJ.openSettleSheet(ctx, id);
        else if (act === 'receipt' && LJ.openReceiptSheet) LJ.openReceiptSheet(ctx, id);
      };
    });
    el.querySelectorAll('.tl-i[data-go]').forEach(card => {
      card.onclick = () => {
        const goid = card.getAttribute('data-goid');
        ctx.go(card.getAttribute('data-go'), goid ? { id: goid } : undefined);
      };
    });
  };

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
        return '<div class="mono" style="font-size:11px;padding:3px 0;color:' +
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
      const api = ctx.api;
      const list = api.message.list();
      const unread = api.message.unread();
      const T = { support: ['💠', '支持'], request: ['✉️', '协商'], risk: ['⚠️', '风险'],
        share: ['🧾', '分享'], system: ['⚙️', '系统'] };
      let html = '<div class="pad mt16">';

      /* 订阅设置入口 + 全部已读。放在顶部而不是页尾 ——
         "太吵了"是用户对这个页面最常见的抱怨，出口得在第一屏。 */
      html += '<div class="row between" style="padding:0 4px 12px;align-items:center">' +
        '<div class="xs muted">' + (unread ? unread + ' 条未读' : '没有未读') + '</div>' +
        '<div class="row" style="gap:8px">' +
        (unread ? '<button class="btn ghost xs" data-readall>全部已读</button>' : '') +
        '<button class="btn ghost xs" data-prefs>订阅设置</button>' +
        '</div></div>';

      if (!list.length) {
        return html + UI.empty('🔔', '暂无消息',
          '订阅设置里可以决定哪些类型的提醒会出现在这里。') + '</div>';
      }
      html += '<div class="list">' + list.map(m => {
        const t = T[m.type] || T.system;
        return '<div class="li" data-msg="' + m.id + '"' +
          (m.shareCardId ? ' data-share="' + m.shareCardId + '"' : '') + '>' +
          '<div class="ico">' + t[0] + '</div>' +
          '<div class="grow"><div class="row between">' +
          '<span class="ellipsis" style="font-size:14px;font-weight:600">' + UI.esc(m.title) + '</span>' +
          (m.read ? '' : '<span class="tag danger">新</span>') + '</div>' +
          '<div class="sm muted" style="margin-top:4px;line-height:1.6">' + UI.esc(m.body) + '</div>' +
          '<div class="row between" style="margin-top:5px">' +
          '<span class="xs muted">' + UI.esc((m.at || '').slice(0, 16).replace('T', ' ')) + '</span>' +
          /* 分享类消息给一个明确的动作，否则收到卡片也无从下手 */
          (m.shareCardId ? '<span class="xs" style="color:var(--text-2);font-weight:700">查看 ›</span>' : '') +
          '</div>' +
          '</div></div>';
      }).join('') + '</div></div>';
      return html;
    },
    mount(el, ctx) {
      el.querySelectorAll('[data-msg]').forEach(n => {
        n.onclick = () => {
          ctx.api.message.read(n.getAttribute('data-msg'));
          const sc = n.getAttribute('data-share');
          /* 分享消息点开直接进卡片页（顺带确认收到），别的消息就只是已读 */
          if (sc) ctx.go('common.shareCard', { id: sc });
          else ctx.refreshTop();
        };
      });
      const ra = el.querySelector('[data-readall]');
      if (ra) ra.onclick = () => { ctx.api.message.readAll(); ctx.refreshTop(); UI.toast('已全部标记为已读'); };
      const pf = el.querySelector('[data-prefs]');
      if (pf) pf.onclick = () => ctx.go('common.notifyPrefs');
    }
  };

  /* ============================================================
     收到的脱敏账单（家长侧）：查看 + 确认收到
     ============================================================
     闭环的最后一环。孩子那边「发送给家人」原来只弹一个 toast，
     家长这边什么都没有 —— 主动分享等于往空气里发。 */
  P['common.shareCard'] = {
    title: '账单分享', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const c = api.share.get(ctx.params.id);
      if (!c) return '<div class="pad mt16">' + UI.empty('🧾', '这份分享不在了',
        '它可能已经被撤回，或者不属于当前查看的孩子。') + '</div>';

      const s = c.snapshot || { cats: [] };
      const from = LJ.store.find('user', c.fromId) || { nickname: '家人' };
      let html = '<div class="pad">';

      html += '<div class="proto mt16"><div class="ph"><span class="seal">脱</span>他主动发来的</div>' +
        '<div class="sm t2" style="line-height:1.7">' +
        UI.esc(from.nickname || from.name) + ' 主动分享了这份概览。' +
        '这是他自己选择发出来的，不是系统推给你的 —— ' +
        '里面只有宏观数据，没有一笔具体交易。</div></div>';

      html += '<div class="card mt20" style="padding:22px">' +
        '<div class="row between"><div><div style="font-size:17px;font-weight:700">' +
        UI.esc(s.month || c.month) + ' 月度概览</div>' +
        '<div class="xs muted" style="margin-top:3px">由本人主动分享 · ' +
        UI.esc((c.at || '').slice(0, 10)) + '</div></div>' +
        '<span class="stamp">已脱敏</span></div>' +
        '<div class="grid3 mt16" style="margin-top:16px">' +
        '<div class="metric"><div class="k">总支出</div><div class="v">' + (s.expense || 0) + '</div></div>' +
        '<div class="metric"><div class="k">结余</div><div class="v" style="color:var(--ok)">' + (s.net || 0) + '</div></div>' +
        '<div class="metric"><div class="k">掌控指数</div><div class="v">' + (s.control || 0) + '</div></div>' +
        '</div>' +
        '<div class="mt20">' + (s.cats || []).map(cat =>
          '<div style="margin-bottom:12px"><div class="row between"><span class="sm">' + UI.esc(cat.name) + '</span>' +
          '<span class="xs mono muted">' + Math.round((cat.ratio || 0) * 100) + '%</span></div>' +
          '<div class="mt8" style="margin-top:6px">' + UI.bar(cat.ratio || 0, cat.color) + '</div></div>').join('') +
        '</div></div>';

      if (c.note) {
        html += '<div class="sec-title">他附的一句话</div>' +
          '<div class="card flat"><div class="sm t2" style="line-height:1.75">' + UI.esc(c.note) + '</div></div>';
      }

      if (c.ackAt) {
        html += '<div class="card mt20" style="border-left:3px solid var(--ok)">' +
          '<div class="sm" style="font-weight:700;color:var(--ok)">已确认收到</div>' +
          '<div class="xs t2" style="margin-top:6px;line-height:1.7">' +
          UI.esc((c.ackAt || '').slice(0, 16).replace('T', ' ')) + ' 你确认收到' +
          (c.ackNote ? '，留言：' + UI.esc(c.ackNote) : '') +
          '。他那边也会收到这条回执。</div></div>';
      } else {
        html += '<div class="sec-title">回一句话<span class="more">可选</span></div>' +
          '<input id="ackNote" maxlength="40" placeholder="想跟他说的话" ' +
          'style="width:100%;height:46px;border:1px solid var(--line);border-radius:12px;' +
          'padding:0 14px;outline:none;background:var(--card);font-size:14px">' +
          '<button class="btn mt16" id="ackBtn">确认收到</button>' +
          '<div class="xs muted" style="margin-top:10px;line-height:1.7;text-align:center">' +
          '确认后他会收到一条回执 —— 主动开口的人应该得到回应。</div>';
      }
      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      const b = el.querySelector('#ackBtn');
      if (!b) return;
      b.onclick = () => {
        try {
          ctx.api.share.ack(ctx.params.id, el.querySelector('#ackNote').value);
          UI.toast('已确认收到，他会看到你的回执');
          ctx.refreshTop();
        } catch (e) { UI.toast(e.message); }
      };
    }
  };

  /* ============================================================
     订阅设置：决定哪些类型的提醒进消息中心
     ============================================================
     ★ 这里控制的是**通知渠道**，不是数据可见性。
       静音一个类型，只是它不再进消息中心、不计未读；
       底层事件照常发生（留痕、账本、申请都在），需要时翻得到。
       页面底部专门写清楚这一点，免得被误读成"关掉就看不到了"。 */
  P['common.notifyPrefs'] = {
    title: '订阅设置', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const prefs = api.message.prefs();
      const all = api.message.list();
      const cnt = t => all.filter(m => m.type === t).length;
      let html = '<div class="pad mt16">';
      html += '<div class="proto"><div class="ph"><span class="seal">静</span>哪些提醒会进来</div>' +
        '<div class="sm t2" style="line-height:1.7">静音只是不再出现在消息中心、不计未读。' +
        '对应的事情照常发生，需要时在留痕记录和账本里都翻得到。</div></div>';

      html += '<div class="list mt16">' + Object.keys(LJ.MSG_TYPES).map(t => {
        const on = prefs[t] !== false;
        return '<div class="li" data-type="' + t + '">' +
          '<div class="grow"><div style="font-size:14px">' + UI.esc(LJ.MSG_TYPES[t]) + '</div>' +
          '<div class="xs muted" style="margin-top:2px">' + cnt(t) + ' 条历史消息</div></div>' +
          '<button class="switch' + (on ? ' on' : '') + '" data-sw="' + t + '" ' +
          'aria-pressed="' + (on ? 'true' : 'false') + '"></button>' +
          '</div>';
      }).join('') + '</div>';

      html += '<div class="xs muted" style="margin-top:14px;line-height:1.75;padding:0 4px">' +
        '两端各自设置自己的提醒 —— 你关掉的不会影响对方收到的。</div>' +
        '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      el.querySelectorAll('[data-sw]').forEach(b => {
        b.onclick = () => {
          const t = b.getAttribute('data-sw');
          const on = !b.classList.contains('on');
          ctx.api.message.setPref(t, on);
          b.classList.toggle('on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
          UI.toast(on ? '已开启「' + LJ.MSG_TYPES[t] + '」提醒' : '已静音「' + LJ.MSG_TYPES[t] + '」');
        };
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
        '<div class="li"><div class="ico">💬</div><div class="grow"><div style="font-size:14px">智能客服</div>' +
        '<div class="xs muted" style="margin-top:2px">7×24 小时在线答疑</div></div><div class="muted">›</div></div>' +
        '<div class="li"><div class="ico">📞</div><div class="grow"><div style="font-size:14px">紧急求助专线</div>' +
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
