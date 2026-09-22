/* ============================================================
   seed.js —— 种子数据生成器
   生成 6 个月的完整账本，让所有分析类功能一打开就有内容
   ============================================================ */
(function (LJ) {
  'use strict';
  const U = LJ.util;

  /* 商户 / 金额区间 / 概率表现在住在 engine.js，和时间机器共用一份。
     这里只是换了个引用名，**没有改动任何一个 r() / r2() 的调用顺序** ——
     顺序一变整条随机序列就跟着漂，之前调好的掌控指数和余额全跑偏。 */
  const MERCH = LJ.engine.MERCH;
  const RANGE = LJ.engine.RANGE;
  const CHANCE = LJ.engine.CHANCE;
  const RANGE2 = LJ.engine.RANGE2;

  /** 月度生活费（家庭支持） */
  const MONTHLY_SUPPORT = 2900;

  /** 种子数据版本：改动种子内容时 +1，浏览器里的旧数据会自动重装 */
  const SEED_VERSION = 19;   // 15：权限生效；16：多子女；17：能力证据；18：分享卡片+余额；19：修专项归属串台

  LJ.seed = {

    /** 生成全部种子数据；today 为模拟当前日期 */
    build(today) {
      const r = U.rng(20260915);
      const r2 = U.rng(20260916);   // 新增分类专用随机流，见下方说明
      const entries = [];
      const supportRecords = [];
      const subscriptions = [];
      const grants = [];
      const audit = [];
      const messages = [];

      const adultId = 'u_youth_lin';
      const parentId = 'u_parent_wang';
      const familyId = 'fam_lin';

      let n = 0;
      const eid = () => 'e' + (++n).toString(36).padStart(4, '0');

      function addExpense(date, category, merchant, amount, fundingSource) {
        if (date > today) return;
        entries.push({
          id: eid(), userId: adultId, date, amount, direction: 'out', category, title: null,
          merchant, note: '', fundingSource: fundingSource || 'family',
          source: 'seed', createdAt: date + 'T12:00:00.000Z'
        });
      }
      function addIncome(date, amount, title, fundingSource) {
        if (date > today) return;
        entries.push({
          id: eid(), userId: adultId, date, amount, direction: 'in', category: null, title,
          merchant: '', note: '', fundingSource,
          source: 'seed', createdAt: date + 'T09:00:00.000Z'
        });
      }

      /* ---------- 逐月生成 ---------- */
      for (let off = 5; off >= 0; off--) {
        const anchor = U.addMonths(today, -off);
        const mk = U.monthKey(anchor);
        const mStart = U.startOfMonth(anchor);
        const dim = U.daysInMonth(anchor);

        // 生活费（家庭支持金）
        addIncome(U.ymd(new Date(U.parse(mStart).getFullYear(), U.parse(mStart).getMonth(), 1)),
          MONTHLY_SUPPORT, '生活费', 'family');

        // 发放对账记录
        supportRecords.push({
          id: 'sr_' + mk, date: mStart, amount: MONTHLY_SUPPORT, purpose: '月度生活费',
          cycle: 'month', providerId: parentId, receiverId: adultId,
          status: 'confirmed', confirmedAt: mStart + 'T10:00:00.000Z',
          note: '', directed: false
        });

        const y = U.parse(mStart).getFullYear(), mo = U.parse(mStart).getMonth();
        const D = d => U.ymd(new Date(y, mo, d));

        for (let d = 1; d <= dim; d++) {
          const date = D(d);

          if (r() < CHANCE.food) {
            addExpense(date, 'food', U.pick(MERCH.food, r), U.int(RANGE.food[0], RANGE.food[1], r));
            if (r() < 0.40) addExpense(date, 'food', U.pick(['美团外卖', '饿了么', '蜜雪冰城'], r), U.int(10, 24, r));
          }
          if (r() < CHANCE.traffic) addExpense(date, 'traffic', U.pick(MERCH.traffic, r), U.int(RANGE.traffic[0], RANGE.traffic[1], r));
          if (r() < CHANCE.fun) addExpense(date, 'fun', U.pick(MERCH.fun, r), U.int(RANGE.fun[0], RANGE.fun[1], r));
          if (r() < CHANCE.daily) addExpense(date, 'daily', U.pick(MERCH.daily, r), U.int(RANGE.daily[0], RANGE.daily[1], r));
          if (r() < CHANCE.study) addExpense(date, 'study', U.pick(MERCH.study, r), U.int(RANGE.study[0], RANGE.study[1], r));
          /* ---- 新增的 6 个分类 ----
             用独立的随机流 r2，不动上面那条序列 ——
             否则新增一次 r() 调用就会把后面所有旧分类的数据全部打乱，
             之前调好的掌控指数、缺口预测全部漂移。 */
          if (r2() < CHANCE.sport) addExpense(date, 'sport', U.pick(MERCH.sport, r2), U.int(RANGE2.sport[0], RANGE2.sport[1], r2));
          if (r2() < CHANCE.shop) addExpense(date, 'shop', U.pick(MERCH.shop, r2), U.int(RANGE2.shop[0], RANGE2.shop[1], r2));
          if (r2() < CHANCE.travel) addExpense(date, 'travel', U.pick(MERCH.travel, r2), U.int(RANGE2.travel[0], RANGE2.travel[1], r2));
          if (r2() < CHANCE.medical) addExpense(date, 'medical', U.pick(MERCH.medical, r2), U.int(RANGE2.medical[0], RANGE2.medical[1], r2));
          if (r2() < CHANCE.favor) addExpense(date, 'favor', U.pick(MERCH.favor, r2), U.int(RANGE2.favor[0], RANGE2.favor[1], r2));
          if (r2() < CHANCE.other) addExpense(date, 'other', U.pick(MERCH.other, r2), U.int(RANGE2.other[0], RANGE2.other[1], r2));

          /* 旅行 / 医疗 / 其他 概率太低，一个月可能一条都没有，
             结构页就看不到它们。这里补几笔保底，金额压小。 */
          if (d === 16) addExpense(date, 'medical', U.pick(MERCH.medical, r2), U.int(30, 90, r2));
          if (d === 26) addExpense(date, 'other', U.pick(MERCH.other, r2), U.int(15, 45, r2));
          if (d === 21 && off % 2 === 0) addExpense(date, 'travel', U.pick(MERCH.travel, r2), U.int(180, 320, r2));

          // 订阅
          if (d === 8) addExpense(date, 'sub', 'Spotify', 15);
          if (d === 12) addExpense(date, 'sub', 'ChatGPT Plus', 145);
          if (d === 20) addExpense(date, 'sub', '百度网盘', 25);

          // 偶尔用自有资金支付（奖学金 / 红包）
          const li = entries.length - 1;
          if (li >= 0 && entries[li].date === date && r() < 0.12) entries[li].fundingSource = 'own';
        }

        /* ---------- 每月一次性事件 ---------- */
        const oneoff = {
          5: [['in', 800, '开学红包', 'own'], ['out', 'study', '开学教材采购', 386]],
          4: [['in', 800, '比赛奖金', 'own'], ['out', 'daily', '数码配件', 299]],
          3: [['out', 'fun', '假期周边游', 620]],
          2: [['in', 2000, '国家励志奖学金', 'own'], ['out', 'fun', '十一出行', 880]],
          1: [['in', 600, '生日红包', 'own'], ['out', 'daily', '冬装', 459]],
          0: [['out', 'study', '考证报名', 480]]
        }[off] || [];
        oneoff.forEach((o, i) => {
          const date = D(Math.min(dim, 3 + i * 4));
          if (o[0] === 'in') addIncome(date, o[1], o[2], o[3]);
          else addExpense(date, o[1], o[2], o[3]);
        });
      }

      /* ---------- 订阅服务（管理用清单） ---------- */
      subscriptions.push(
        { id: 'sub_1', name: 'Spotify', amount: 15, cycle: 'month', day: 8, category: 'sub', status: 'active', tracked: true },
        { id: 'sub_2', name: 'ChatGPT Plus', amount: 145, cycle: 'month', day: 12, category: 'sub', status: 'active', tracked: true },
        { id: 'sub_3', name: '百度网盘', amount: 25, cycle: 'month', day: 20, category: 'sub', status: 'active', tracked: true }
      );

      /* ---------- 成长任务进度 ---------- */
      const taskProgress = [
        { id: 'tp_1', userId: adultId, taskId: 't_record7', status: 'done', at: U.addMonths(today, -5) },
        { id: 'tp_2', userId: adultId, taskId: 't_budget', status: 'done', at: U.addMonths(today, -5) },
        { id: 'tp_3', userId: adultId, taskId: 't_confirm', status: 'done', at: U.addMonths(today, -4) },
        { id: 'tp_4', userId: adultId, taskId: 't_record30', status: 'done', at: U.addMonths(today, -3) },
        { id: 'tp_5', userId: adultId, taskId: 't_save15', status: 'done', at: U.addMonths(today, -2) }
      ];

      /* ---------- 共同储蓄目标 ---------- */
      const savingGoal = [{
        id: 'sg_1', familyId, title: '毕业旅行基金', icon: '🏝',
        target: 6000, startDate: U.addMonths(today, -3), dueDate: U.addMonths(today, 6),
        createdBy: parentId, status: 'active',
        shares: { [adultId]: 0.6, [parentId]: 0.4 },
        contributions: [
          { id: 'c1', userId: adultId, amount: 400, date: U.addMonths(today, -3), note: '第一笔' },
          { id: 'c2', userId: parentId, amount: 600, date: U.addMonths(today, -3), note: '配套' },
          { id: 'c3', userId: adultId, amount: 500, date: U.addMonths(today, -2), note: '' },
          { id: 'c4', userId: adultId, amount: 350, date: U.addMonths(today, -1), note: '省下来的' },
          { id: 'c5', userId: parentId, amount: 400, date: U.addMonths(today, -1), note: '' }
        ]
      }];

      /* ---------- 收到的支持邀约（待回应） ---------- */
      const invite = [{
        id: 'inv_1', familyId, fromId: parentId, toId: adultId,
        kind: 'gift', title: '生日礼物支持', amount: 600,
        note: '上次你说想换个耳机，这个算生日礼物，收下吧',
        occasion: '生日', status: 'pending', date: U.addDays(today, -1)
      }];

      /* ---------- 预支与还款 ---------- */
      const prepayPlan = [{
        id: 'pp_1', familyId, userId: adultId, providerId: parentId,
        amount: 900, purpose: '十一出行预支', periods: 3,
        perPeriod: 300, startDate: U.addMonths(today, -2), status: 'active',
        repayments: [
          { id: 'r1', period: 1, amount: 300, date: U.addMonths(today, -2), note: '从生活费里扣' },
          { id: 'r2', period: 2, amount: 300, date: U.addMonths(today, -1), note: '' }
        ]
      }];
      const pendingDate = U.addDays(today, -2);
      supportRecords.push({
        id: 'sr_pending_1', date: pendingDate, amount: 480, purpose: '考证报名费',
        cycle: 'once', providerId: parentId, receiverId: adultId,
        status: 'pending', confirmedAt: null,
        note: '报名费我先转给你，记得确认一下', directed: true,
        directedCategory: 'study'
      });

      /* ---------- 人物与人情往来 ---------- */
      const person = [
        { id: 'p_zhangwei', name: '张伟', relation: '室友', avatar: '张', birthday: '10-24', tags: ['室友', '球友'] },
        { id: 'p_lina', name: '李娜', relation: '同学', avatar: '李', birthday: '09-30', tags: ['同班'] },
        { id: 'p_wanghao', name: '王浩', relation: '高中同学', avatar: '王', birthday: '03-15', tags: ['高中'] },
        { id: 'p_chenjing', name: '陈静', relation: '社团', avatar: '陈', birthday: '12-02', tags: ['摄影社'] }
      ];

      const D = n => U.addDays(today, -n);   // n 天前
      const favor = [
        /* 张伟：他请客多，我请得少 → 触发「待回请」 */
        { id: 'fv1', personId: 'p_zhangwei', direction: 'in', kind: 'meal', occasion: '日常', amount: 68, date: D(8), item: '烤肉', note: '他请的' },
        { id: 'fv2', personId: 'p_zhangwei', direction: 'in', kind: 'meal', occasion: '日常', amount: 45, date: D(31), item: '食堂三楼', note: '' },
        { id: 'fv3', personId: 'p_zhangwei', direction: 'in', kind: 'meal', occasion: '日常', amount: 52, date: D(74), item: '小龙虾', note: '' },
        { id: 'fv4', personId: 'p_zhangwei', direction: 'out', kind: 'meal', occasion: '日常', amount: 73, date: D(96), item: '火锅', note: '我请的' },
        { id: 'fv5', personId: 'p_zhangwei', direction: 'in', kind: 'gift', occasion: '生日', amount: 200, date: U.addMonths(today, -4), item: '机械键盘轴', note: '我生日送的', returned: false },

        /* 李娜：送过我生日礼物，她生日在即 → 触发「生日回礼」 */
        { id: 'fv6', personId: 'p_lina', direction: 'in', kind: 'gift', occasion: '生日', amount: 180, date: U.addMonths(today, -4), item: '帆布包', note: '我生日送的', returned: false },
        { id: 'fv7', personId: 'p_lina', direction: 'out', kind: 'meal', occasion: '日常', amount: 58, date: D(52), item: '麻辣烫', note: '' },
        { id: 'fv8', personId: 'p_lina', direction: 'in', kind: 'meal', occasion: '日常', amount: 62, date: D(21), item: '日料', note: '' },

        /* 王浩：我随过婚礼的礼 */
        { id: 'fv9', personId: 'p_wanghao', direction: 'out', kind: 'redpacket', occasion: '婚礼', amount: 800, date: D(139), item: '', note: '高中同学婚礼' },

        /* 陈静：升学宴 */
        { id: 'fv10', personId: 'p_chenjing', direction: 'out', kind: 'redpacket', occasion: '升学宴', amount: 200, date: D(35), item: '', note: '' },
        { id: 'fv11', personId: 'p_chenjing', direction: 'in', kind: 'gift', occasion: '节日', amount: 88, date: D(58), item: '手冲咖啡套装', note: '社团交换礼物', returned: false }
      ];

      /* ---------- 临时授权 ----------
         这一条是"动态授权层"的演示：标准模式本来不含「分类预算执行率」，
         家里临时开放 30 天，到期后 can() 直接返回 false —— 真的收回，不是显示层。
         权限凭证列表是从 binding.features 反推的（见 disclosure.grantRows），
         所以这里只需要一条临时记录，不再需要给每个能力各写一行。 */
      grants.push({
        id: 'g_temp_1', familyId, feature: 'budgetProgress',
        scope: 'budgetProgress', label: '分类预算执行率',
        type: 'temporary', value: ['budgetProgress'],
        expiresAt: U.addDays(today, 30),
        status: 'active', createdAt: pendingDate + 'T10:00:00.000Z'
      });

      /* ---------- 留痕 ---------- */
      audit.push(
        { id: 'a1', familyId, actorId: adultId, action: '建立绑定关系', detail: '选择「标准」省心模式', at: U.addMonths(today, -6) + 'T10:05:00.000Z' },
        { id: 'a2', familyId, actorId: parentId, action: '确认绑定', detail: '同意按约定范围查看', at: U.addMonths(today, -6) + 'T10:12:00.000Z' },
        { id: 'a3', familyId, actorId: adultId, action: '开启临时授权', detail: '考证报名专项进度 · 有效期 60 天', at: pendingDate + 'T10:00:00.000Z' },
        { id: 'a4', familyId, actorId: parentId, action: '登记一笔支持', detail: '考证报名费 ¥480 · 待对账', at: pendingDate + 'T09:58:00.000Z' }
      );

      /* ---------- 本人的财务动作（能力证据的来源）----------
         为什么必须补这一段：留痕表里原来只有"绑定/授权/支持登记"这类
         关系动作，**没有一条是孩子自己做的财务动作**。于是父母端的
         「他主动做过的事」和青年端的「近 7 天的动作」在默认数据下永远是空的 ——
         功能在，但演示不出来。
         这里按月份铺开，覆盖：预算管理 / 消费认知 / 储蓄习惯 / 风险抵御
         四个维度，并且**最近 7 天留两三条**，让动作任务一进去就有进度。
         注意：这些都是"他自己动手"的动作，不含浏览（'查看'）。 */
      const evAt = (mBack, day, hh) =>
        U.addMonths(today, -mBack) + '-' + String(day).padStart(2, '0') + 'T' + String(hh).padStart(2, '0') + ':20:00.000Z';
      audit.push(
        /* 6 个月前 → 这个月，每月都有主动动作，月报才读得出"能力在长" */
        { id: 'ae1', familyId, actorId: adultId, action: '调整预算', detail: '总额 ¥2,600', at: evAt(5, 12, 21) },
        { id: 'ae2', familyId, actorId: adultId, action: '完成周期复盘', detail: U.monthKey(U.addMonths(today, -6)), at: evAt(5, 28, 22) },
        { id: 'ae3', familyId, actorId: adultId, action: '暂停订阅', detail: '云音乐会员', at: evAt(4, 9, 20) },
        { id: 'ae4', familyId, actorId: adultId, action: '调整预算', detail: '总额 ¥2,400', at: evAt(4, 15, 21) },
        { id: 'ae5', familyId, actorId: adultId, action: '完成周期复盘', detail: U.monthKey(U.addMonths(today, -5)), at: evAt(4, 29, 22) },
        { id: 'ae6', familyId, actorId: adultId, action: '采纳场景化规划', detail: '开学季', at: evAt(3, 3, 19) },
        { id: 'ae7', familyId, actorId: adultId, action: '向共同目标存入', detail: '毕业旅行 ¥300', at: evAt(3, 17, 20) },
        { id: 'ae8', familyId, actorId: adultId, action: '完成周期复盘', detail: U.monthKey(U.addMonths(today, -4)), at: evAt(3, 30, 22) },
        { id: 'ae9', familyId, actorId: adultId, action: '调整预算', detail: '总额 ¥2,600', at: evAt(2, 11, 21) },
        { id: 'ae10', familyId, actorId: adultId, action: '移除订阅', detail: '视频平台连续包月', at: evAt(2, 19, 20) },
        { id: 'ae11', familyId, actorId: adultId, action: '完成周期复盘', detail: U.monthKey(U.addMonths(today, -3)), at: evAt(2, 28, 22) },
        { id: 'ae12', familyId, actorId: adultId, action: '回应风险事件', detail: '主动说明', at: evAt(1, 14, 21) },
        { id: 'ae13', familyId, actorId: adultId, action: '向共同目标存入', detail: '毕业旅行 ¥500', at: evAt(1, 22, 20) },
        { id: 'ae14', familyId, actorId: adultId, action: '完成周期复盘', detail: U.monthKey(U.addMonths(today, -2)), at: evAt(1, 29, 22) },
        /* 最近 7 天：让「近 7 天的动作」一进去就有 2 条已完成 */
        { id: 'ae15', familyId, actorId: adultId, action: '调整预算', detail: '总额 ¥2,600', at: U.addDays(today, -4) + 'T21:10:00.000Z' },
        { id: 'ae16', familyId, actorId: adultId, action: '暂停订阅', detail: '健身 App 会员', at: U.addDays(today, -2) + 'T20:40:00.000Z' }
        /* 妹妹的动作放在下面 sibId 声明之后 push ——
           const 有暂时性死区，在这里引用会直接抛 ReferenceError。 */
      );

      /* ---------- 消息 ---------- */
      messages.push(
        { id: 'm1', userId: adultId, type: 'support', title: '有一笔支持待对账', body: '母亲登记了「考证报名费」¥480，确认后计入账本。', read: false, at: pendingDate + 'T09:58:00.000Z' },
        { id: 'm2', userId: adultId, type: 'system', title: '本月预算已开始', body: '按上次设置继续执行，合计 ¥2,300。', read: true, at: U.startOfMonth(today) + 'T08:00:00.000Z' }
      );

      /* ---------- 主动分享的脱敏账单（3.3.3）----------
         补一条已发送的：这条链路的重点是"发出去 → 对方收得到 → 对方确认收到"，
         只放一个发送按钮、对面什么都收不到，闭环就是断的（批次三要修的就是它）。
         这里铺一条"已发未确认"的，家长一进消息中心就能看到真实形态。 */
      const shareCards = [];
      const shareAt = U.addDays(today, -6);
      const shareMk = U.monthKey(U.addMonths(today, -2));
      shareCards.push({
        id: 'sc1', fromId: adultId, toId: parentId,
        month: shareMk, note: '这个月结构还行，跟你们说一声',
        at: shareAt + 'T20:15:00.000Z',
        ackAt: null, ackNote: '',
        /* 快照：发出去的是"当时的数"，不是实时数据 ——
           对方看到的必须是你按下发送那一刻的东西，否则"我发的是这个月"
           会在下个月变成另一份数据。 */
        snapshot: {
          month: shareMk,
          expense: 2380, net: 520, control: 62,
          cats: [
            { name: '餐饮', ratio: 0.42, color: '#FE7563' },
            { name: '学习', ratio: 0.16, color: '#D3B9FF' },
            { name: '休闲娱乐', ratio: 0.13, color: '#FFD166' },
            { name: '日常支出', ratio: 0.12, color: '#7BC6FF' },
            { name: '交通', ratio: 0.09, color: '#4AFB95' },
            { name: '其他', ratio: 0.08, color: '#A0A0A8' }
          ]
        }
      });
      messages.push({
        id: 'm3', userId: parentId, type: 'share', title: '知远主动分享了一份账单',
        body: shareMk + ' 月度概览 · 只含宏观数据，没有单笔明细',
        shareCardId: 'sc1', read: false, at: shareAt + 'T20:15:00.000Z'
      });

      /* 支持人账户余额（3.4.1 的"智能发放前提醒"要用）——
         没有这个概念就做不出"余额可能不够发下个月生活费"的提醒。
         刻意设成"略低于下次发放额"，让提醒在默认数据下就能演示出来。 */
      const supporterBalance = 2450;

      /* ---------- 第二个孩子（多子女切换，3.4.1.1）----------
         同一个支持人、同一个家庭，另一个孩子。
         账本用 E.simulateDays 生成：它按日期做随机种，和上面那条调好的
         随机序列完全独立，所以**不会扰动哥哥的数据**。
         刻意做得"新一些"：只有 3 个月、额度更低、没有专项没有风险事件 —— 
         刚上大一的状态，和哥哥形成对照。 */
      const sibId = 'u_youth_lin2';
      /* 妹妹的财务动作：用来验证"切换孩子后证据真的换人"。
         她的档位是极简、动作也更少 —— 和哥哥形成对照。 */
      audit.push(
        { id: 'ae20', familyId, actorId: sibId, action: '完成周期复盘', detail: U.monthKey(U.addMonths(today, -2)), at: evAt(1, 27, 21) },
        { id: 'ae21', familyId, actorId: sibId, action: '调整预算', detail: '总额 ¥1,800', at: U.addDays(today, -3) + 'T19:30:00.000Z' }
      );
      const sibAmount = 2000;
      const sibStart = U.addMonths(today, -3);
      const sibRows = LJ.engine.simulateDays(sibStart, today, null);
      sibRows.forEach((row, i) => {
        entries.push(Object.assign({}, row, {
          id: 'e2_' + String(i + 1).padStart(4, '0'),
          userId: sibId,
          amount: Math.max(5, Math.round(row.amount * 0.72)),   // 低年级花得少一点
          source: 'seed',
          createdAt: row.date + 'T12:00:00'
        }));
      });
      /* 她的生活费（家庭支持金），按月发 */
      for (let i = 3; i >= 0; i--) {
        const mk = U.monthKey(U.addMonths(today, -i));
        const payday = mk + '-01';
        if (payday > today) continue;
        entries.push({
          id: 'e2_in_' + mk, userId: sibId, date: payday, amount: sibAmount,
          direction: 'in', category: null, title: '生活费', merchant: '', note: '',
          fundingSource: 'family', source: 'seed', createdAt: payday + 'T09:00:00'
        });
        supportRecords.push({
          id: 'sr2_' + mk, date: payday, amount: sibAmount, purpose: '月度生活费',
          cycle: 'month', providerId: parentId, receiverId: sibId,
          status: 'confirmed', confirmedAt: payday + 'T10:00:00',
          note: '', directed: false
        });
      }
      const sibBinding = {
        id: 'bind_2', familyId, youthId: sibId, supporterId: parentId,
        status: 'active', infoMode: 'minimal',      // 妹妹这边只开了极简
        features: null, customRules: null,
        supportAmount: sibAmount,
        confirmedAt: U.addMonths(today, -3) + 'T10:00:00',
        createdAt: U.addMonths(today, -3) + 'T09:30:00'
      };
      const sibBudget = {
        id: 'bud_2', userId: sibId,
        periodStart: U.startOfMonth(today), periodEnd: U.endOfMonth(today),
        total: 1800,
        categories: {
          food: 700, traffic: 90, study: 150, sport: 60, shop: 120, travel: 60,
          fun: 150, daily: 200, sub: 60, medical: 60, favor: 100, other: 50
        }
      };

      /* ---------- 组装 ---------- */
      const users = [
        { id: adultId, role: 'youth', name: '林知远', nickname: '知远', avatar: '林', phone: '138****6621', level: '成长期' },
        { id: sibId, role: 'youth', name: '林知微', nickname: '知微', avatar: '微', phone: '137****4417', level: '启蒙期' },
        { id: parentId, role: 'supporter', name: '王慧敏', nickname: '妈妈', avatar: '王', phone: '139****3382', relation: '母亲' }
      ];

      const family = { id: familyId, name: '林家', inviteCode: 'LJ-7K2M9', createdAt: U.addMonths(today, -6) };

      const binding = {
        id: 'bind_1', familyId, youthId: adultId, supporterId: parentId,
        status: 'active', infoMode: 'standard',
        /* ★ 家人能看到什么，最终只由这张表决定。
           null = 跟随 infoMode 的预设；用户逐项调过之后会存成完整的能力表，
           configFor() 也会自动显示成「自定义」。 */
        features: null,
        customRules: null,
        /* 约定好的月度生活费基准。放在绑定关系上而不是写死在代码里：
           时间机器的自动发放、方案预览、发放记录都要读同一个数 ——
           以前 clock.js 写死 2400 而种子发 2900，两条路对不上。 */
        supportAmount: MONTHLY_SUPPORT,
        confirmedAt: U.addMonths(today, -6) + 'T10:12:00.000Z',
        createdAt: U.addMonths(today, -6) + 'T10:05:00.000Z'
      };

      const budget = {
        id: 'bud_1', userId: adultId,
        periodStart: U.startOfMonth(today), periodEnd: U.endOfMonth(today),
        total: 2600,
        categories: {
        food: 870, traffic: 150, study: 230, sport: 85, shop: 210, travel: 110,
        fun: 230, daily: 270, sub: 185, medical: 85, favor: 150, other: 25
      }
      };

      /* ---------- 问问的历史对话 ----------
         演示用：让「历史对话」打开就是有内容的，不然空面板看不出这个功能。
         只存问题和回答，点开任意一段可以接着往下问。
         时间戳用真实此刻往前推，所以永远显示成「昨天 / 3 天前」。 */
      const HOUR_MS = 3600 * 1000, DAY_MS = 24 * HOUR_MS;
      function chat(id, agoMs, turns) {
        return {
          id, at: Date.now() - agoMs,
          title: turns[0].text.length > 14 ? turns[0].text.slice(0, 14) + '…' : turns[0].text,
          turns
        };
      }
      const aiChat = [
        chat('chat_seed1', 1 * DAY_MS + 4 * HOUR_MS, [
          { role: 'me', text: '这个月还够花吗' },
          { role: 'bot', answer: {
            title: '够，但余量比上个月窄',
            body: '本月已花 ¥2,261，预算 ¥2,600，还剩 **¥339**、还有 12 天。\n按你现在的日均 ¥119 走，会超 **¥1,089** 左右。',
            stats: [
              { k: '本月已花', v: '¥2,261' },
              { k: '预算余量', v: '¥339' },
              { k: '日均', v: '¥119' }
            ],
            actions: [{ label: '看支出结构', to: 'youth.structure' }]
          } }
        ]),
        chat('chat_seed2', 3 * DAY_MS + 7 * HOUR_MS, [
          { role: 'me', text: '我这个月的钱都花哪了' },
          { role: 'bot', answer: {
            title: '餐饮占了三成半',
            body: '本月支出里 **餐饮 ¥780（34%）** 最大，其次是学习 ¥336 和娱乐 ¥180。\n非必要支出合计 **¥432**，占 19%。',
            stats: [
              { k: '最大一项', v: '餐饮' },
              { k: '非必要占比', v: '19%' }
            ],
            actions: [{ label: '看支出结构', to: 'youth.structure' }]
          } }
        ]),
        chat('chat_seed3', 6 * DAY_MS + 2 * HOUR_MS, [
          { role: 'me', text: '我想攒钱买台相机' },
          { role: 'bot', answer: {
            title: '按现在的节奏要 10 个月',
            body: '目标 **¥8,000**，你每月平均能结余 ¥820。\n如果每月多省 ¥200，能提前到 **8 个月**。',
            stats: [
              { k: '目标', v: '¥8,000' },
              { k: '预计', v: '10 个月' }
            ],
            actions: [{ label: '去建储蓄目标', to: 'youth.savings' }]
          } }
        ])
      ];

      /* ---------- 银行卡 ----------
         卡面素材是真实银行卡比例 1.586 的图（2048×1292）。
         role 是这张卡在「临界」里的角色：钱从哪来算哪个池子，靠它就定了。
         三张卡各占一个角色，所以整本账能按卡切开。 */
      const bankCard = [
        {
          id: 'card1', name: '星座卡 · 双鱼座', bank: 'ICBC 中国工商银行',
          kind: '星座系列 · VISA', tail: '6621', img: 'assets/card1.jpg', dark: true,
          role: 'support', familyVisible: true, frozen: false, isDefaultPay: false
        },
        {
          id: 'card2', name: '城市卡 · 上海', bank: 'ICBC 中国工商银行',
          kind: '借记卡 · 银联', tail: '3087', img: 'assets/card2.jpg', dark: false,
          role: 'daily', familyVisible: false, frozen: false, isDefaultPay: true
        },
        {
          id: 'card3', name: '国潮卡 · 财神', bank: 'ICBC 中国工商银行',
          kind: '借记卡 · 银联', tail: '9145', img: 'assets/card3.jpg', dark: true,
          role: 'own', familyVisible: false, frozen: false, isDefaultPay: false
        }
      ];

      /* ---------- 风险预警要用到的两笔真实账 ----------
         风险事件全部由 engine 从账本里扫出来，不是手写死的结论。
         所以这里只补两笔"能被规则逮住"的交易，剩下的事件（大类超预算、
         本月超预算、陌生平台、大额非刚需）都从既有数据里自然长出来。
         注意：这里**不能调用 r()/r2()** —— 那会打乱既有的随机序列，
         把调好的掌控指数和余额全带偏。 */
      entries.push({
        id: 'rx_loan', date: '2026-06-10', amount: 688, direction: 'out',
        category: 'other', title: null, merchant: '某消费金融·分期还款',
        note: '', fundingSource: 'own', source: 'import',
        createdAt: '2026-06-10T21:40:00.000Z'
      });
      entries.push({
        id: 'rx_unknown', date: today, amount: 428, direction: 'out',
        category: 'fun', title: null, merchant: '星禾文化传媒',
        note: '', fundingSource: 'own', source: 'import',
        createdAt: today + 'T22:15:00.000Z'
      });

      /* ---------- 风险事件：一条已经走完闭环的历史记录 ----------
         其余事件由 risk.sync() 扫账本生成；这一条手写，
         是为了把"三级事件完整闭环"的样子（求助 → 冻结 → 结案）留下来。
         key 必须和 engine 的 riskKey() 算法一致，否则会被重复扫出来。 */
      const riskEvent = [{
        id: 'risk_seed_1',
        key: 'sensitive|2026-06-10|68800|某消费金融·分期还款',
        rule: 'sensitive', level: 3, subtype: 'loan',
        status: 'resolved',
        title: '检测到网贷 / 借贷平台',
        detail: '「某消费金融·分期还款」命中高风险商户特征（分期还款），这类交易常见于诈骗与非法借贷。',
        why: '金额 ¥688.00 · 6月10日 · 命中敏感词「分期还款」',
        evidence: ['网贷 / 借贷平台'],
        amount: 688, date: '2026-06-10', merchant: '某消费金融·分期还款',
        entryId: 'rx_loan',
        at: '2026-06-10T21:40:00',
        deadline: null, youthRead: true, notifyAt: '2026-06-10T21:40:00',
        explain: '是同学让我帮他代付的一笔分期，钱他后来又还我了。已经跟妈妈说过这件事。',
        createdAt: '2026-06-10T21:40:00.000Z',
        timeline: [
          { at: '2026-06-10T21:40:00', actor: 'system', level: 3, action: '系统判定为三级事件', note: '立即通知双方。家人可申请紧急临时冻结，24 小时内银行客服介入核实。' },
          { at: '2026-06-10T21:40:00', actor: 'system', action: '已同步家人', note: '通知只说明存在风险，不含金额与明细' },
          { at: '2026-06-10T21:46:00', actor: 'youth', action: '拨打了 96110 咨询', note: '确认为代付，不是涉诈交易' },
          { at: '2026-06-10T21:52:00', actor: 'youth', action: '冻结了银行卡', note: '24 小时内不收款、不付款，先止血' },
          { at: '2026-06-11T09:10:00', actor: 'bank', action: '银行客服已核实', note: '账户无异常，已解除临时冻结' },
          { at: '2026-06-11T09:30:00', actor: 'youth', action: '标记已处理', note: '已跟家人说明情况' }
        ]
      }];

      /* ---------- 风险白名单：计划内的大额支出，别再报一次 ---------- */
      const riskWhitelist = [
        { id: 'wl_1', word: '考证', note: '计划内的报名费，家里知道', at: U.addMonths(today, -1) }
      ];

      /* ---------- 生活费方案（产品文档 3.5.3 / 3.5.5）----------
         寒暑假调整、毕业过渡递减都收在这一张表里。
         这里放一个"家长已发起、等青年确认"的寒假方案 —— 打开青年端首页
         待办就能看到它，是演示双端确认最快的路径。
         故意不种已经结束的方案：那会要求账本里 7、8 月的生活费真的按减半发过，
         否则方案和流水自相矛盾。现在这个是未来生效，不碰既有账本。 */
      const lifePlan = [{
        id: 'lp_seed_winter',
        familyId, kind: 'holiday', name: '2027 寒假',
        from: '2027-01-15', to: '2027-02-20',
        mode: 'half', base: MONTHLY_SUPPORT,
        proposedBy: parentId, proposedRole: 'supporter', status: 'pending',
        note: '寒假你在家住，吃饭基本不用花钱，就先按一半给，开学再恢复。',
        createdAt: U.addDays(today, -1) + 'T20:10:00',
        decidedAt: null, review: null,
        log: [{ at: U.addDays(today, -1) + 'T20:10:00', actor: 'supporter', action: '发起方案', note: '2027 寒假 · 生活费减半' }]
      }];

      /* ---------- 专项资金（3.5.1 开学季）----------
         当前模拟日期是 9 月中，正好在秋季开学季里，所以种一个进行中的开学专项。
         钱要真的在账本里：转入是一笔 source:'fund' 的收入，
         已发生的学习类支出挂上 fundId 才算"用掉了"。 */
      const fund = [{
        id: 'fund_seed_term', familyId, kind: 'term', name: '2026 秋季开学专项',
        category: 'study', target: 3800,
        providerId: parentId, receiverId: adultId,
        periodStart: U.addDays(today, -30), periodEnd: U.addMonths(today, 1),
        status: 'active',
        note: '学费、住宿和教材一起放这儿，花完跟我说一声就行',
        createdAt: U.addDays(today, -30) + 'T10:00:00',
        log: [
          { at: U.addDays(today, -30) + 'T10:00:00', actor: 'supporter', action: '开立专项', note: '2026 秋季开学专项' },
          { at: U.addDays(today, -30) + 'T10:05:00', actor: 'supporter', action: '转入专项金', note: '¥3,800.00' }
        ]
      }];
      /* 转入本身也要有账：不然"池子里有钱"是假的 */
      entries.push({
        id: 'rx_fund_in', date: U.addDays(today, -30), amount: 3800, direction: 'in',
        category: null, title: '2026 秋季开学专项', merchant: '', note: '',
        fundingSource: 'family', source: 'fund', fundId: 'fund_seed_term',
        createdAt: U.addDays(today, -30) + 'T10:05:00'
      });
      supportRecords.push({
        id: 'sr_fund_1', date: U.addDays(today, -30), amount: 3800, purpose: '2026 秋季开学专项',
        cycle: 'once', providerId: parentId, receiverId: adultId,
        status: 'confirmed', confirmedAt: U.addDays(today, -30) + 'T10:05:00',
        note: '专项支持 · 学费与教材', directed: true, directedCategory: 'study',
        fundId: 'fund_seed_term'
      });
      /* 开学专项期间已经发生的学习类支出，挂到专项下 —— 进度才有内容。
         ★ 必须限定 userId：这个 forEach 跑在**两个孩子的账本**上，
           不限定就会把妹妹的学习支出也挂到哥哥的开学专项下 ——
           按 fundId 聚合时会多算一笔（实测差 ¥189）。
           界面上看不出问题（S.entries() 是按人圈定的），但数据是错的：
           任何"只按 fundId 查"的地方都会串台。 */
      entries.forEach(e => {
        if ((!e.userId || e.userId === adultId) &&
          e.category === 'study' && e.direction === 'out' &&
          e.date >= U.addDays(today, -30) && e.date <= U.addMonths(today, 1)) {
          e.fundId = 'fund_seed_term';
        }
      });

      return {
        user: users, family: [family], binding: [binding, sibBinding], entry: entries,
        budget: [budget, sibBudget], supportRecord: supportRecords, request: [],
        grant: grants, auditLog: audit, riskEvent: riskEvent, message: messages,
        subscription: subscriptions, savingGoal: savingGoal, taskProgress: taskProgress,
        invite: invite, prepayPlan: prepayPlan, scenarioPlan: [],
        person: person, favor: favor, aiChat: aiChat, bankCard: bankCard,
        lifePlan: lifePlan, fund: fund, shareCard: shareCards,
        meta: {
          clock: today, sessionUserId: null, sessionRole: 'youth',
          activeChildId: null,
          seededAt: new Date().toISOString(),
          seedVersion: SEED_VERSION,
          reviewedPeriods: [], 
          /* 种子里标一条已采纳的场景规划：这样「场景提醒」是解锁状态，
             开学季/求职季的主动提示才演示得出来。锁着的例子留给认证和完整档案。 */
          appliedScenarios: ['term_start'],
          riskWhitelist: riskWhitelist,
          /* 支持人账户余额（模拟）：3.4.1 要求"发放前提醒，避免余额不足导致发放失败"，
             没有余额这个概念就做不出这个提醒。刻意设成略低于下次发放额。 */
          supporterBalance: supporterBalance,
          /* 消息订阅偏好：空 = 全部类型都提醒（默认不打扰用户去配置） */
          notifyPrefs: {}
        }
      };
    },

    /** 安装到 store（保留当前登录身份与模拟时钟） */
    install(today) {
      const keep = LJ.store.meta();
      const data = LJ.seed.build(today);
      const obj = {};
      LJ.store.TABLES.forEach(k => { obj[k] = data[k] || []; });
      obj.meta = Object.assign(data.meta, {
        clock: keep.clock || today,
        sessionUserId: keep.sessionUserId || null,
        sessionRole: keep.sessionRole || 'youth'
      });
      LJ.store.load(obj);
      return data;
    },

    /** 是否已有数据 */
    hasData() {
      return LJ.store.all('user').length > 0;
    },

    /** 数据是否需要重装（老版本种子 → 自动升级） */
    needsUpgrade() {
      if (!LJ.seed.hasData()) return true;
      return LJ.store.meta().seedVersion !== SEED_VERSION;
    }
  };
})(window.LJ);
