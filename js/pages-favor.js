/* ============================================================
   pages-favor.js —— 人情往来
   原则：只呈现往来事实，不做价值判断，不催促
   ============================================================ */
(function (LJ) {
  'use strict';
  const U = LJ.util, UI = LJ.ui, P = LJ.pages;

  const KIND = [
    { id: 'meal', name: '一起吃饭', icon: '🍜' },
    { id: 'gift', name: '礼物', icon: '🎁' },
    { id: 'redpacket', name: '随礼 / 红包', icon: '🧧' },
    { id: 'help', name: '帮了个忙', icon: '🤝' },
    { id: 'other', name: '其他', icon: '✳️' }
  ];
  const OCC = ['日常', '生日', '婚礼', '节日', '升学宴', '探病', '乔迁', '其他'];

  function kindOf(id) { return KIND.find(k => k.id === id) || KIND[4]; }

  /* ============================================================
     人情往来首页
     ============================================================ */
  P['youth.favor'] = {
    title: '人情往来', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const ov = api.favor.overview();
      const people = api.person.list();

      let html = '<div class="pad">';

      /* 概览 */
      html += '<div class="card mt16">' +
        '<div class="row between">' +
        '<div class="stat sm"><div class="n">¥' + ov.outTotal + '</div>' +
        '<div class="k">' + ov.year + ' 年送出 · ' + ov.outCount + ' 次</div></div>' +
        '<div class="stat sm" style="text-align:right"><div class="n">¥' + ov.inTotal + '</div>' +
        '<div class="k">收到 · ' + ov.inCount + ' 次</div></div>' +
        '</div>' +
        '<div class="xs muted" style="margin-top:14px;padding-top:14px;border-top:1px solid var(--line-2)">' +
        '和 ' + ov.peopleCount + ' 位朋友有往来。这一页只记事实，不算谁多谁少。' +
        '</div>' +
        '</div>';

      /* 待处理 */
      if (ov.pending.length) {
        html += '<div class="sec-title">需要留意<span class="more">' + ov.pending.length + ' 件</span></div>';
        html += '<div class="list">' + ov.pending.map(p =>
          '<div class="li" data-person="' + p.personId + '">' +
          '<div class="ico">' + p.icon + '</div>' +
          '<div class="grow"><div class="sm" style="font-weight:600;line-height:1.45">' + UI.esc(p.text) + '</div>' +
          '<div class="xs muted" style="margin-top:3px">' +
          (p.type === 'birthday' ? '点开看看送什么合适' : '点开看看你们的往来') + '</div></div>' +
          '<div class="muted">›</div></div>').join('') + '</div>';
      }

      /* 人物列表 */
      html += '<div class="sec-title">和谁有往来<span class="more" data-go="youth.people">管理</span></div>';
      if (!people.length) {
        html += UI.empty('👥', '还没有记录', '记一笔人情时，会自动建立这个人。');
      } else {
        html += '<div class="list">' + people.map(p => {
          const b = api.favor.byPerson(p.id);
          const days = LJ.engine.daysToBirthday(p.birthday, LJ.clock.now());
          const bday = days !== null && days <= 30
            ? '<span class="tag warn" style="margin-left:6px">生日 ' + days + ' 天</span>' : '';
          return '<div class="li" data-person="' + p.id + '">' +
            '<div class="ico" style="background:var(--ink);color:#fff;font-weight:700">' + UI.esc(p.avatar) + '</div>' +
            '<div class="grow"><div class="row between">' +
            '<span class="sm" style="font-weight:700">' + UI.esc(p.name) + bday + '</span>' +
            '<span class="xs muted">' + (b.lastDays !== null ? b.lastDays + ' 天前' : '—') + '</span></div>' +
            '<div class="xs muted" style="margin-top:3px">' +
            UI.esc(p.relation) + ' · 送出 ' + b.outCount + ' 次 · 收到 ' + b.inCount + ' 次' +
            (b.last ? ' · 最近：' + UI.esc(b.last.item || kindOf(b.last.kind).name) : '') +
            '</div></div><div class="muted">›</div></div>';
        }).join('') + '</div>';
      }

      html += '<button class="btn mt20" data-go="youth.favorNew">记一笔人情</button>';
      html += '<div class="proto mt16"><div class="ph"><span class="seal">记</span>这一页是干什么的</div>' +
        '<div class="xs t2" style="line-height:1.8">不是要你算清每一顿饭。' +
        '只是把「谁请过我、我送过谁」这些容易忘的事记下来，' +
        '免得关键时刻想不起来——比如有人生日快到了，你才想起去年人家送过你东西。' +
        '<br>这一页的数据不会分享给任何人。</div></div>';
      html += '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) {
      el.querySelectorAll('[data-go]').forEach(n => n.onclick = () => ctx.go(n.getAttribute('data-go')));
      el.querySelectorAll('[data-person]').forEach(n => n.onclick = () =>
        ctx.go('youth.favorPerson', { id: n.getAttribute('data-person') }));
    }
  };

  /* ============================================================
     和某个人的往来
     ============================================================ */
  P['youth.favorPerson'] = {
    title: '往来', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const p = api.person.get(ctx.params.id);
      if (!p) return UI.empty('🔍', '找不到这个人');
      const b = api.favor.byPerson(p.id);
      const days = LJ.engine.daysToBirthday(p.birthday, LJ.clock.now());

      let html = '<div class="pad">';

      /* 人物卡 */
      html += '<div class="card mt16"><div class="row">' +
        '<div style="width:52px;height:52px;border-radius:50%;background:var(--ink);color:#fff;' +
        'display:flex;align-items:center;justify-content:center;font-size:21px;font-weight:700;flex:none">' +
        UI.esc(p.avatar) + '</div>' +
        '<div class="grow"><div style="font-size:17px;font-weight:800">' + UI.esc(p.name) + '</div>' +
        '<div class="xs muted" style="margin-top:4px">' + UI.esc(p.relation) +
        (p.birthday ? ' · 生日 ' + p.birthday.replace('-', '月') + '日' : '') + '</div></div>' +
        (days !== null && days <= 30 ? '<span class="tag warn">还有 ' + days + ' 天</span>' : '') +
        '</div></div>';

      /* 往来对照 —— 只列事实，不做净额判断 */
      html += '<div class="sec-title">往来对照</div>';
      html += '<div class="card">' +
        row('一起吃饭', b.mealOut + ' 次', b.mealIn + ' 次') +
        row('礼物往来', b.giftOut + ' 次', b.giftIn + ' 次') +
        '<div style="height:1px;background:var(--line-2);margin:12px 0"></div>' +
        row('金额合计', '¥' + b.outTotal, '¥' + b.inTotal) +
        '<div class="row between xs muted" style="margin-top:12px;padding-top:12px;border-top:1px solid var(--line-2)">' +
        '<span>左：你付出</span><span>右：你收到</span></div>' +
        '</div>';

      /* 上次往来 */
      if (b.last) {
        html += '<div class="proto mt12"><div class="ph"><span class="seal">近</span>上一次往来</div>' +
          '<div class="sm t2" style="line-height:1.7">' +
          U.ymdCN(b.last.date) + '（' + b.lastDays + ' 天前）· ' +
          (b.last.direction === 'in' ? 'TA ' : '你 ') +
          UI.esc(b.last.item || kindOf(b.last.kind).name) +
          (b.last.amount ? ' · ¥' + U.won(b.last.amount) : '') + '</div></div>';
      }

      /* 未回的礼 */
      const unreplied = b.list.filter(f => f.direction === 'in' &&
        (f.kind === 'gift' || f.kind === 'redpacket') && !f.returned);
      if (unreplied.length) {
        html += '<div class="sec-title">收过但还没回</div>';
        html += '<div class="list">' + unreplied.map(f =>
          '<div class="li"><div class="ico">🎁</div>' +
          '<div class="grow"><div class="sm" style="font-weight:600">' + UI.esc(f.item || kindOf(f.kind).name) + '</div>' +
          '<div class="xs muted" style="margin-top:3px">' + U.ymdCN(f.date) + ' · ' + UI.esc(f.occasion) + '</div></div>' +
          '<button class="btn xs soft" data-returned="' + f.id + '">标记已回</button></div>').join('') +
          '</div>';
      }

      /* 全部记录 */
      html += '<div class="sec-title">全部往来<span class="more">' + b.list.length + ' 条</span></div>';
      html += '<div class="list">' + b.list.map(f =>
        '<div class="li"><div class="ico">' + kindOf(f.kind).icon + '</div>' +
        '<div class="grow"><div class="row between">' +
        '<span class="sm" style="font-weight:600">' + UI.esc(f.item || kindOf(f.kind).name) + '</span>' +
        (f.amount ? '<span class="amt ' + (f.direction === 'in' ? 'in' : 'out') + '">' +
          (f.direction === 'in' ? '+' : '−') + U.won(f.amount) + '</span>' : '') +
        '</div><div class="xs muted" style="margin-top:3px">' +
        U.ymdCN(f.date) + ' · ' + UI.esc(f.occasion) + ' · ' +
        (f.direction === 'in' ? '你收到' : '你付出') + '</div></div></div>').join('') + '</div>';

      html += '<button class="btn mt20" data-new="' + p.id + '">给 ' + UI.esc(p.name) + ' 记一笔</button>';
      html += '<div style="height:30px"></div></div>';
      return html;

      function row(k, left, right) {
        return '<div class="row between" style="margin-bottom:11px">' +
          '<span class="sm t2" style="flex:0 0 76px">' + k + '</span>' +
          '<span class="sm" style="flex:1;font-weight:700;font-variant-numeric:tabular-nums">' + left + '</span>' +
          '<span class="sm" style="flex:1;text-align:right;font-weight:700;font-variant-numeric:tabular-nums">' + right + '</span>' +
          '</div>';
      }
    },
    mount(el, ctx) {
      el.querySelectorAll('[data-returned]').forEach(b => b.onclick = () => {
        ctx.api.favor.markReturned(b.getAttribute('data-returned'));
        UI.toast('已标记');
      });
      el.querySelectorAll('[data-new]').forEach(b => b.onclick = () =>
        ctx.go('youth.favorNew', { personId: b.getAttribute('data-new') }));
    }
  };

  /* ============================================================
     记一笔人情
     ============================================================ */
  P['youth.favorNew'] = {
    title: '记一笔人情', chrome: 'plain', keepAlive: true,
    render(ctx) {
      const people = ctx.api.person.list();
      const sel = ctx.params.personId || (people[0] || {}).id;
      return '<div class="pad">' +
        '<div class="proto mt16"><div class="ph"><span class="seal">记</span>记什么</div>' +
        '<div class="sm t2" style="line-height:1.7">收到或送出的礼物、一起吃的饭、随过的礼，' +
        '都可以记。记下来是为了不忘记，不是为了让谁还。</div></div>' +

        '<div class="sec-title">方向</div>' +
        '<div class="seg" id="fvDir">' +
        '<button class="on" data-v="out">我付出的</button>' +
        '<button data-v="in">我收到的</button>' +
        '</div>' +

        '<div class="sec-title">和谁</div>' +
        '<div class="row" id="fvPeople" style="gap:8px;flex-wrap:wrap">' +
        people.map(p => '<button class="chip ' + (p.id === sel ? 'on' : '') + '" data-p="' + p.id + '">' +
          UI.esc(p.name) + '</button>').join('') +
        '<button class="chip" data-newp>＋ 新朋友</button>' +
        '</div>' +

        '<div class="sec-title">是什么</div>' +
        '<div class="row" id="fvKind" style="gap:8px;flex-wrap:wrap">' +
        KIND.map((k, i) => '<button class="chip ' + (i === 0 ? 'on' : '') + '" data-k="' + k.id + '">' +
          k.icon + ' ' + k.name + '</button>').join('') +
        '</div>' +

        '<div class="sec-title">场合</div>' +
        '<div class="row" id="fvOcc" style="gap:8px;flex-wrap:wrap">' +
        OCC.map((o, i) => '<button class="chip ' + (i === 0 ? 'on' : '') + '" data-o="' + o + '">' + o + '</button>').join('') +
        '</div>' +

        '<div class="sec-title">说明</div>' +
        '<input id="fvItem" placeholder="比如：烤肉 / 帆布包" style="width:100%;height:46px;border:1px solid var(--line);' +
        'border-radius:14px;padding:0 14px;outline:none;background:var(--card)">' +

        '<div class="sec-title">金额（选填）</div>' +
        '<input id="fvAmount" type="number" inputmode="decimal" placeholder="0.00" style="width:100%;height:46px;' +
        'border:1px solid var(--line);border-radius:14px;padding:0 14px;font-variant-numeric:tabular-nums;' +
        'font-size:17px;font-weight:700;outline:none;background:var(--card)">' +

        '<button class="btn mt20" id="fvSave">保存</button>' +
        '<div style="height:30px"></div></div>';
    },
    mount(el, ctx) {
      let dir = 'out', personId = ctx.params.personId || (ctx.api.person.list()[0] || {}).id;
      let kind = 'meal', occ = '日常';

      const seg = (sel, attr, cb) => {
        el.querySelectorAll(sel + ' button').forEach(b => b.onclick = () => {
          cb(b.getAttribute(attr));
          el.querySelectorAll(sel + ' button').forEach(x => x.classList.toggle('on', x === b));
        });
      };
      seg('#fvDir', 'data-v', v => dir = v);
      seg('#fvPeople', 'data-p', v => personId = v);
      seg('#fvKind', 'data-k', v => kind = v);
      seg('#fvOcc', 'data-o', v => occ = v);

      const np = el.querySelector('[data-newp]');
      if (np) np.onclick = () => {
        UI.sheet({
          title: '添加一位朋友', sub: '名字就够了，生日选填（可以帮你记得回礼）',
          body: '<div class="sec-title" style="margin-top:0">称呼</div>' +
            '<input id="npName" placeholder="比如：张伟" style="width:100%;height:46px;border:1px solid var(--line);' +
            'border-radius:14px;padding:0 14px;outline:none;background:var(--card)">' +
            '<div class="sec-title">关系</div>' +
            '<input id="npRel" placeholder="室友 / 同学 / 高中同学" style="width:100%;height:46px;border:1px solid var(--line);' +
            'border-radius:14px;padding:0 14px;outline:none;background:var(--card)">' +
            '<div class="sec-title">生日（选填）</div>' +
            '<input id="npBd" placeholder="10-24 或 10月24日" style="width:100%;height:46px;border:1px solid var(--line);' +
            'border-radius:14px;padding:0 14px;outline:none;background:var(--card)">' +
            '<button class="btn mt20" id="npOk">添加</button>',
          mount(e2, close) {
            e2.querySelector('#npOk').onclick = () => {
              const name = e2.querySelector('#npName').value.trim();
              if (!name) return UI.toast('请填写称呼');
              let bd = e2.querySelector('#npBd').value.trim();
              const m = bd.match(/(\d{1,2})\s*[-月]\s*(\d{1,2})/);
              bd = m ? U.pad(m[1]) + '-' + U.pad(m[2]) : '';
              ctx.api.person.create({
                name, relation: e2.querySelector('#npRel').value.trim() || '朋友', birthday: bd
              });
              close(); UI.toast('已添加');
            };
          }
        });
      };

      el.querySelector('#fvSave').onclick = () => {
        if (!personId) return UI.toast('请选择对象');
        ctx.api.favor.create({
          personId, direction: dir, kind, occasion: occ,
          item: el.querySelector('#fvItem').value.trim(),
          amount: Number(el.querySelector('#fvAmount').value) || 0
        });
        UI.toast('已记下');
        ctx.back();
      };
    }
  };

  /* ============================================================
     人物管理
     ============================================================ */
  P['youth.people'] = {
    title: '朋友们', chrome: 'plain',
    render(ctx) {
      const api = ctx.api;
      const people = api.person.list();
      let html = '<div class="pad mt16">';
      if (!people.length) {
        html += UI.empty('👥', '还没有朋友记录', '记一笔人情时会自动建立。');
      } else {
        html += '<div class="list">' + people.map(p => {
          const b = api.favor.byPerson(p.id);
          return '<div class="li" data-person="' + p.id + '">' +
            '<div class="ico" style="background:var(--ink);color:#fff;font-weight:700">' + UI.esc(p.avatar) + '</div>' +
            '<div class="grow"><div class="sm" style="font-weight:700">' + UI.esc(p.name) + '</div>' +
            '<div class="xs muted" style="margin-top:3px">' + UI.esc(p.relation) +
            (p.birthday ? ' · ' + p.birthday : '') + ' · ' + b.list.length + ' 条往来</div></div>' +
            '<div class="muted">›</div></div>';
        }).join('') + '</div>';
      }
      html += '<button class="btn mt20" id="addP">添加一位朋友</button>' +
        '<div style="height:30px"></div></div>';
      return html;
    },
    mount(el, ctx) { ctx.go && el.querySelectorAll('[data-person]').forEach(n => n.onclick = () =>
      ctx.go('youth.favorPerson', { id: n.getAttribute('data-person') })); }
  };
})(window.LJ);
