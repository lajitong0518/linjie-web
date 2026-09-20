/* ============================================================
   clock.js —— 时间机器
   产品价值随时间累积，没有它大部分功能看不到效果。
   应用内维护"模拟当前日期"，所有时间逻辑都读它，不读系统时间。
   ============================================================ */
(function (LJ) {
  'use strict';
  const U = LJ.util;

  const Clock = LJ.clock = {

    /** 模拟当前日期 YYYY-MM-DD */
    now() {
      const m = LJ.store.meta();
      return m.clock || U.ymd(new Date());
    },

    nowISO() {
      return Clock.now() + 'T' + new Date().toTimeString().slice(0, 8);
    },

    /** 距真实今天偏移了多少天 */
    offsetDays() {
      return U.diffDays(U.ymd(new Date()), Clock.now());
    },

    jumpTo(date) {
      const before = Clock.now();
      LJ.store.setMeta({ clock: date });
      /* 批量写库期间关掉逐条重渲染：快进一年会写上千行，
         每一行都触发一次整页刷新的话会卡死。
         下面的 emit('clock') 会统一刷一次。 */
      Clock.silent = true;
      try { Clock._run(before, date); }
      finally { Clock.silent = false; }
      LJ.bus.emit('clock', { from: before, to: date });
      return date;
    },

    advance(days) {
      return Clock.jumpTo(U.addDays(Clock.now(), days));
    },

    /** 回到真实今天（不重算事件） */
    resetToReal() {
      LJ.store.setMeta({ clock: U.ymd(new Date()) });
      LJ.bus.emit('clock', { from: null, to: Clock.now() });
    },

    /** 时光倒流到最早一笔数据之前，重新累积 */
    rewindMonths(n) {
      return Clock.jumpTo(U.addMonths(Clock.now(), -n));
    },

    /* ---------------- 时间推进时自动发生的事 ---------------- */
    _run(from, to) {
      if (to <= from) return;
      const bindings = LJ.store.all('binding');
      if (!bindings.length) return;
      const eng = LJ.engine;

      // 找出跨越的所有月份
      const months = [];
      let cur = U.startOfMonth(from);
      const last = U.startOfMonth(to);
      let guard = 0;
      while (cur <= last && guard++ < 240) {
        months.push(U.monthKey(cur));
        cur = U.addMonths(cur, 1);
      }

      /* ---------- 每个孩子各推进一遍 ----------
         多子女下时间机器必须逐个过：不然快进之后只有第一个孩子有生活费，
         另一个孩子的账本停在原地。 */
      bindings.forEach((binding, ci) => {
        const kidId = binding.youthId;
        /* 每个孩子的订阅不完全一样：妹妹只有音乐会员，没有订阅全家桶 */
        const SUBS = ci === 0
          ? [['Spotify', 15, 8], ['ChatGPT Plus', 145, 12], ['百度网盘', 25, 20]]
          : [['网易云音乐', 12, 6]];

        /* 已经发过的月份：只算这个孩子的（supportRecord 有 receiverId） */
        const issued = new Set(
          LJ.store.where('supportRecord', s => s.receiverId === kidId &&
            s.cycle === 'month' && s.purpose === '月度生活费')
            .map(s => U.monthKey(s.date))
        );

        /* 生活费基准和生效中的方案都从这里读。
           以前这里是写死的 2400，而种子按 2900 发 —— 两条路对不上账，
           现在统一从 binding.supportAmount + lifePlan 推。 */
        const base = Number(binding.supportAmount) || 2900;
        const plans = LJ.store.where('lifePlan', p => !p.youthId || p.youthId === kidId);

        months.forEach(mk => {
          if (issued.has(mk)) return;
          // 只在发放日已过的情况下发放
          const payday = mk + '-01';
          if (payday > to) return;

          /* 方案说了算：减半 / 暂停 / 一次性 / 递减，都从这一个函数出来 */
          const got = eng.supportFor(mk, plans, base);
          const amt = got.amount;
          const modeTag = got.plan
            ? (got.plan.kind === 'taper' ? '毕业过渡递减' : '假期调整 · ' + eng.lifePlanMode(got.plan.mode).name)
            : '';

          /* 暂停发放也要落一条对账记录 ——
             否则下次快进会以为这个月没发过，反复重算。
             amount 记 0，账本不加钱，但"这个月为什么没发"有据可查。 */
          if (amt > 0) {
            LJ.store.insert('entry', {
              userId: kidId, date: payday, amount: amt, direction: 'in', category: null,
              title: '生活费', merchant: '', note: '', fundingSource: 'family',
              source: 'support'
            });
          }
          LJ.store.insert('supportRecord', {
            date: payday, amount: amt, purpose: '月度生活费', cycle: 'month',
            providerId: binding.supporterId, receiverId: kidId,
            status: 'confirmed', confirmedAt: payday + 'T09:00:00',
            note: modeTag, directed: false,
            planId: got.plan ? got.plan.id : null,
            mode: got.plan ? (got.plan.kind === 'taper' ? 'taper' : got.plan.mode) : null
          });
          LJ.store.insert('message', {
            userId: kidId, type: 'support',
            title: got.graduated ? '毕业过渡已完成'
              : amt > 0 ? '生活费已到账' : '这个月不发放生活费',
            body: amt > 0
              ? '「月度生活费」¥' + U.won(amt) + ' 已自动发放并完成对账。' +
                (modeTag ? '（' + modeTag + '）' : '')
              : got.graduated
                ? '「' + (got.plan ? got.plan.name : '毕业过渡') + '」已经递减到 0，' +
                  '从这个月起不再自动发放。这一步走完，生活费这件事就交给你自己了。'
                : '按「' + (got.plan ? got.plan.name : '方案') + '」，这个月暂停发放，对账记录已留痕。',
            read: false, at: payday + 'T09:00:00'
          });

          // 订阅扣费
          SUBS.forEach(([name, amt2, dd]) => {
            const date = mk + '-' + String(dd).padStart(2, '0');
            if (date > to) return;
            LJ.store.insert('entry', {
              userId: kidId, date: date, amount: amt2, direction: 'out', category: 'sub',
              title: null, merchant: name, note: '', fundingSource: 'family',
              source: 'import'
            });
          });
        });

        /* ---------- 把这个孩子的日常消费补上 ----------
           必须排在风险扫描和假期复盘之前：那两件事都要读账本算数，
           顺序反了，复盘会按"只有订阅"的账本生成（日均 ¥6），
           而且 p.review 只生成一次，错的数据会一直留下来。
           salt / scale 让每个孩子的消费不一样，且同一天永远同一批
           （重复快进不会翻倍）。 */
        const covered = {};
        LJ.store.all('entry').forEach(e => {
          if (e.direction !== 'out') return;
          if (e.source !== 'seed' && e.source !== 'sim') return;
          if ((e.userId || bindings[0].youthId) !== kidId) return;
          covered[e.date] = 1;
        });
        const simRows = eng.simulateDays(from, to, covered, {
          salt: ci * 4099, scale: ci === 0 ? 1 : 0.72
        });
        if (simRows.length) {
          const t = LJ.store.table('entry');
          simRows.forEach(row => {
            row.id = LJ.store.uid('e');
            row.userId = kidId;
            row.createdAt = row.date + 'T12:00:00';
            t.push(row);
          });
          Clock._lastSim = (Clock._lastSim || 0) + simRows.length;
        }

        /* 时间一往前走，风险也要跟着走：
           新出现的异常落库；二级事件过了 24 小时还没回应，就把脱敏提示同步给家人。 */
        try {
          const y = LJ.api && LJ.api.youth && LJ.api.youth(kidId);
          if (y && y.risk) y.risk.sync();
          /* 假期过完了就顺手把复盘存下来（3.5.3 要求"假期结束自动生成消费复盘"） */
          if (y && y.plan) y.plan.syncReview();
        } catch (e) { /* 风险/方案模块不可用不该拖垮时间机器 */ }
      });

      LJ.store.save('entry');   // 所有孩子写完后一次性落库，只发一次事件
    }
  };
})(window.LJ);
