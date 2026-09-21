/* ============================================================
   store.js —— 数据层
   表结构 + localStorage 持久化 + 事件总线 + 通用工具
   ============================================================ */
window.LJ = window.LJ || {};

(function (LJ) {
  'use strict';

  /* ---------------- 事件总线 ---------------- */
  const handlers = {};
  LJ.bus = {
    on(evt, fn) { (handlers[evt] = handlers[evt] || []).push(fn); return () => this.off(evt, fn); },
    off(evt, fn) { handlers[evt] = (handlers[evt] || []).filter(f => f !== fn); },
    emit(evt, payload) {
      (handlers[evt] || []).slice().forEach(f => { try { f(payload); } catch (e) { console.error(e); } });
      (handlers['*'] || []).slice().forEach(f => { try { f(evt, payload); } catch (e) { console.error(e); } });
    }
  };

  /* ---------------- 工具 ---------------- */
  const U = LJ.util = {
    pad(n) { return String(n).padStart(2, '0'); },
    ymd(d) { return d.getFullYear() + '-' + U.pad(d.getMonth() + 1) + '-' + U.pad(d.getDate()); },
    parse(s) { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, m - 1, d); },
    addDays(s, n) { const d = U.parse(s); d.setDate(d.getDate() + n); return U.ymd(d); },
    addMonths(s, n) { const d = U.parse(s); d.setMonth(d.getMonth() + n); return U.ymd(d); },
    startOfMonth(s) { const d = U.parse(s); return U.ymd(new Date(d.getFullYear(), d.getMonth(), 1)); },
    endOfMonth(s) { const d = U.parse(s); return U.ymd(new Date(d.getFullYear(), d.getMonth() + 1, 0)); },
    daysInMonth(s) { return U.parse(U.endOfMonth(s)).getDate(); },
    diffDays(a, b) { return Math.round((U.parse(b) - U.parse(a)) / 86400000); },
    monthKey(s) { return String(s).slice(0, 7); },
    weekday(s) { return '日一二三四五六'[U.parse(s).getDay()]; },
    won(n) { return (Math.round(n * 100) / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); },
    /* 整数口径的金额。U.won 强制两位小数（0 会显示成 "0.00"），
       用在 hero 大数字上像坏掉了 —— 摘要性的数（今天还能花、预计超支、
       图表标签）一律用这个。 */
    wonInt(n) { return Math.round(n).toLocaleString('zh-CN'); },
    ymdCN(s) { const d = U.parse(s); return (d.getMonth() + 1) + '月' + d.getDate() + '日'; },
    clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },
    rng(seed) {
      let s = (seed || 20260915) >>> 0;
      return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
    },
    pick(arr, r) { return arr[Math.floor(r() * arr.length) % arr.length]; },
    int(min, max, r) { return Math.floor(min + r() * (max - min + 1)); }
  };

  /* ---------------- 分类 ---------------- */
  LJ.CATEGORIES = [
    { id: 'food', name: '餐饮', icon: '🍚', color: '#E8833A' },
    { id: 'traffic', name: '交通', icon: '🚇', color: '#3B82F6' },
    { id: 'study', name: '学习', icon: '📚', color: '#8B5CF6' },
    { id: 'sport', name: '运动', icon: '🏃', color: '#22C55E' },
    { id: 'shop', name: '购物', icon: '🛍️', color: '#F43F5E' },
    { id: 'travel', name: '旅行', icon: '🧳', color: '#06B6D4' },
    { id: 'fun', name: '娱乐', icon: '🎮', color: '#EC4899' },
    { id: 'daily', name: '日用', icon: '🧴', color: '#64748B' },
    { id: 'sub', name: '订阅', icon: '🔔', color: '#14B8A6' },
    { id: 'medical', name: '医疗', icon: '💊', color: '#EF4444' },
    { id: 'favor', name: '人情', icon: '🤝', color: '#A855F7' },
    { id: 'other', name: '其他', icon: '✳️', color: '#94A3B8' }
  ];
  LJ.catById = id => LJ.CATEGORIES.find(c => c.id === id) || { id: null, name: '其他', icon: '•', color: '#A0A0A8' };

  /* ---------------- 表 ---------------- */
  const NS = 'lj.';
  const LEGACY_NS = 'bx.';   // 更名前的存储前缀（伴行 → 临界）
  const TABLES = ['user', 'family', 'binding', 'entry', 'budget', 'supportRecord',
    'request', 'grant', 'auditLog', 'riskEvent', 'message', 'subscription',
    'savingGoal', 'taskProgress', 'invite', 'prepayPlan', 'scenarioPlan',
    'person', 'favor', 'aiChat', 'bankCard', 'lifePlan', 'fund'];
  const META = 'meta';

  /** 更名迁移：新前缀没数据、旧前缀有数据时，把旧数据搬过来 */
  (function migrateLegacy() {
    try {
      if (localStorage.getItem(NS + 'user')) return;
      if (!localStorage.getItem(LEGACY_NS + 'user')) return;
      TABLES.concat([META]).forEach(k => {
        const v = localStorage.getItem(LEGACY_NS + k);
        if (v != null && localStorage.getItem(NS + k) == null) localStorage.setItem(NS + k, v);
      });
      console.log('[临界] 已从旧存储前缀迁移数据');
    } catch (e) { /* 忽略，按新数据启动 */ }
  })();

  const cache = {};

  function read(key, fb) {
    try { const s = localStorage.getItem(NS + key); return s ? JSON.parse(s) : fb; }
    catch (e) { console.warn('read fail', key, e); return fb; }
  }
  function write(key, val) {
    try { localStorage.setItem(NS + key, JSON.stringify(val)); }
    catch (e) { console.error('写入失败（可能超出配额）', e); }
  }

  let seq = 0;
  function uid(prefix) { seq++; return (prefix || 'id') + Date.now().toString(36) + seq.toString(36); }

  const Store = LJ.store = {
    TABLES, META, uid,

    /* 读整表 */
    table(name) {
      if (!cache[name]) cache[name] = read(name, []);
      return cache[name];
    },
    meta() {
      if (!cache[META]) cache[META] = read(META, {});
      return cache[META];
    },
    setMeta(patch) {
      Object.assign(Store.meta(), patch);
      write(META, cache[META]);
      LJ.bus.emit('data:meta');
    },

    /* 写整表 */
    save(name) {
      write(name, name === META ? cache[META] : (cache[name] || []));
      LJ.bus.emit('data:' + name);
    },

    /* 通用 CRUD */
    insert(name, row) {
      const t = Store.table(name);
      if (!row.id) row.id = uid(name.slice(0, 3));
      if (!row.createdAt) row.createdAt = new Date().toISOString();
      t.push(row); Store.save(name);
      return row;
    },
    all(name) { return Store.table(name).slice(); },
    find(name, id) { return Store.table(name).find(r => r.id === id) || null; },
    where(name, fn) { return Store.table(name).filter(fn); },
    update(name, id, patch) {
      const r = Store.find(name, id);
      if (!r) return null;
      Object.assign(r, patch, { updatedAt: new Date().toISOString() });
      Store.save(name);
      return r;
    },
    remove(name, id) {
      const t = Store.table(name);
      const i = t.findIndex(r => r.id === id);
      if (i < 0) return false;
      t.splice(i, 1); Store.save(name);
      return true;
    },

    /* 留痕 */
    log(actorId, action, detail) {
      return Store.insert('auditLog', {
        actorId, action, detail,
        at: LJ.clock ? LJ.clock.nowISO() : new Date().toISOString()
      });
    },

    /* 清空 / 导出 / 导入 */
    clearAll() {
      TABLES.concat([META]).forEach(k => { localStorage.removeItem(NS + k); delete cache[k]; });
      LJ.bus.emit('data:reset');
    },
    dump() {
      const out = {};
      TABLES.forEach(k => out[k] = Store.table(k));
      out[META] = Store.meta();
      return out;
    },
    load(obj) {
      Object.keys(obj || {}).forEach(k => { cache[k] = obj[k]; write(k, obj[k]); });
      LJ.bus.emit('data:reset');
    }
  };

  /* ---------------- 会话（当前登录身份） ---------------- */
  LJ.session = {
    get() {
      const m = LJ.store.meta();
      return {
        userId: m.sessionUserId || null,
        role: m.sessionRole || 'youth'
      };
    },
    set(userId, role) {
      LJ.store.setMeta({ sessionUserId: userId, sessionRole: role });
      LJ.bus.emit('session');
    },
    clear() {
      LJ.store.setMeta({ sessionUserId: null });
      LJ.bus.emit('session');
    },
    currentUser() {
      const s = LJ.session.get();
      return s.userId ? LJ.store.find('user', s.userId) : null;
    }
  };
})(window.LJ);
