(() => {
  const D = window.MHO_DATA;
  if (!D) { document.body.textContent = '資料載入失敗'; return; }

  const PARTS = ['頭部', '胸部', '腕部', '腰部', '腿部'];
  const PART_SHORT = { '頭部': '頭', '胸部': '身', '腕部': '手', '腰部': '腰', '腿部': '腳' };
  const WEAPON_TYPES = ['太刀', '大劍', '雙劍', '長槍', '大錘', '充能斧', '重弩槍', '弓'];
  const ELEMENTS = ['火', '水', '雷', '冰', '龍'];
  const STATUSES = ['毒', '麻痺', '睡眠', '爆破'];
  const SKILL_BY = Object.fromEntries(D.skills.map((s) => [s.name, s]));
  const SET_BY = Object.fromEntries(D.setSkills.map((s) => [s.name, s]));
  const VSET_BY = Object.fromEntries(D.visageSets.map((s) => [s.name, s]));
  const ARMOR_BY = Object.fromEntries(D.armor.map((a) => [a.id, a]));
  const WEP_BY = Object.fromEntries(D.weapons.map((w) => [w.slug, w]));
  const VIS_BY = Object.fromEntries(D.visages.map((v) => [v.id, v]));
  const ADV_BY = Object.fromEntries(D.adventurers.map((a) => [a.id, a]));
  const STORE = 'mho-planner-v2';
  const VISAGE_CAP = D.notes.visageCostCap || 12;
  const ALWAYS_STAT = new Set([
    '體力強化', '防護', '看破',
    '火屬性傷害提升', '水屬性傷害提升', '冰屬性傷害提升', '雷屬性傷害提升', '龍屬性傷害提升',
    '火耐性強化', '水耐性強化', '冰耐性強化', '雷耐性強化', '龍耐性強化',
  ]);

  function catOf(name) {
    if (/火屬性|火耐性/.test(name)) return 'fire';
    if (/水屬性|水耐性|泥耐性/.test(name)) return 'water';
    if (/雷屬性|雷耐性/.test(name)) return 'thunder';
    if (/冰屬性|冰耐性/.test(name)) return 'ice';
    if (/龍屬性|龍耐性/.test(name)) return 'dragon';
    if (/體力|回復|血氣|超回復|復甦/.test(name)) return 'hp';
    if (/看破|會心|弱點|潛能/.test(name)) return 'crit';
    if (/加護|防護|防禦|耐性|風壓|震動|咆哮|屏障/.test(name)) return 'def';
    if (/傷害|攻擊|連擊|應對|練氣|蓄力|拔刀|破擊|貫突|剛勢|氣力|裝填|騰空|窮追|痛點|鬥志|無瑕|無懼|威嚇/.test(name)) return 'atk';
    if (/專家|獵人|採集|剝取|捕獲|標本|植物|地質|蜂蜜|節約|快吃|道具|攀爬/.test(name)) return 'res';
    return 'misc';
  }
  const ICONS = {
    fire: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1s3 3.2 3 6.2c0 1.9-1.2 3.3-3 3.3S5 9.1 5 7.2C5 5.4 6.2 3.6 8 1zm0 9.7A4.2 4.2 0 0 0 12.2 15H3.8A4.2 4.2 0 0 0 8 10.7z"/></svg>',
    water: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5C8 1.5 3.5 7.2 3.5 10a4.5 4.5 0 0 0 9 0C12.5 7.2 8 1.5 8 1.5z"/></svg>',
    thunder: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M9.2 1 3.8 8.6h3.2L5.8 15 13 7.2H9.4L9.2 1z"/></svg>',
    ice: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.2 8.7 5 12.6 3.1l-1.5 3.7 3.9.6-3.9.6 1.5 3.7-3.9-1.9L8 14.8 7.3 11 3.4 12.9l1.5-3.7-3.9-.6 3.9-.6-1.5-3.7 3.9 1.9L8 1.2z"/></svg>',
    dragon: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.2 14.5 8 8 14.8 1.5 8 8 1.2zm0 3.2L4.7 8 8 11.6 11.3 8 8 4.4z"/></svg>',
    hp: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 14S2 9.4 2 5.8C2 3.7 3.6 2.2 5.6 2.2c1.2 0 2.2.6 2.4 1.5.2-.9 1.2-1.5 2.4-1.5 2 0 3.6 1.5 3.6 3.6C14 9.4 8 14 8 14z"/></svg>',
    crit: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.5 9.2 6.8 14.5 8 9.2 9.2 8 14.5 6.8 9.2 1.5 8 6.8 6.8 8 1.5z"/></svg>',
    def: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 1.4 13.5 3.5v4.4c0 3.4-2.4 5.7-5.5 6.7C4.9 13.6 2.5 11.3 2.5 7.9V3.5L8 1.4z"/></svg>',
    atk: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M14.2 1.6 9 3.8 7.7 6.3 5.2 7.2 8.4 10.4 3 13.2l.8 1 2.8-1.2 1.8 1.8 1.1-1.1-1.8-1.8 2.2-4.2 1.2 1.2 1.1-1.1-1.2-1.2 2.2-5.4z"/></svg>',
    res: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M3 3.5h10v2.2c0 3.3-2 6.4-5 7.8C5 12.1 3 9 3 5.7V3.5zm2 2v1.8c0 2 1.1 4 3 5.1 1.9-1.1 3-3.1 3-5.1V5.5H5z"/></svg>',
    misc: '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="3.2" y="3.2" width="9.6" height="9.6" rx="1.4"/></svg>',
  };

  const state = {
    tab: 'build',
    screen: 'search',
    weaponType: '太刀',
    weapon: null,
    weaponMode: 'custom',
    armor: { 頭部: null, 胸部: null, 腕部: null, 腰部: null, 腿部: null },
    locked: { weapon: false, 頭部: false, 胸部: false, 腕部: false, 腰部: false, 腿部: false },
    visages: [],
    visSubs: {},
    showSubs: {},
    adventurerId: '2',
    insightBudget: 30,
    insights: [],
    picker: null,
    openSkill: null,
    searchTargets: [],
    altResults: [],
    altIndex: -1,
    searchBusy: false,
    searchInfo: '',
    searchNote: '',
    searchMs: 0,
    sortKey: 'score',
    resultLimit: 0,
    openStats: null,
    skillTip: null,
    skillQ: '',
    wikiQ: '',
    wikiCat: null,
    wikiDetail: null,
    collapsed: { fixed: false, weapon: false, skills: false },
    menuOpen: false,
    toast: '',
    saves: loadSaves(),
    compare: [null, null],
    saveName: '',
  };

  function loadSaves() {
    try { return JSON.parse(localStorage.getItem(STORE) || '[]'); }
    catch { return []; }
  }
  function persistSaves() { localStorage.setItem(STORE, JSON.stringify(state.saves)); }

  function snapshot() {
    return {
      weaponType: state.weaponType, weapon: state.weapon,
      armor: { ...state.armor },
      visages: state.visages.map((v) => ({ ...v })),
      visSubs: { ...state.visSubs },
      adventurerId: state.adventurerId,
      insightBudget: state.insightBudget,
      insights: [...state.insights],
      searchTargets: state.searchTargets.map((t) => ({ ...t })),
    };
  }
  function applySnap(s) {
    if (!s) return;
    state.weaponType = s.weaponType || '太刀';
    state.weapon = s.weapon || null;
    state.armor = { 頭部: null, 胸部: null, 腕部: null, 腰部: null, 腿部: null, ...(s.armor || {}) };
    state.visages = s.visages || [];
    state.visSubs = s.visSubs || {};
    state.adventurerId = s.adventurerId || '2';
    state.insightBudget = s.insightBudget ?? 30;
    state.insights = s.insights || [];
    if (s.searchTargets) state.searchTargets = s.searchTargets;
  }
  function rarityClass(n) { return 'rarity r' + Math.max(1, Math.min(11, n || 1)); }
  function icon(cat) { return `<span class="icon cat-${cat}">${ICONS[cat] || ICONS.misc}</span>`; }
  function escape(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function fmt(n, digits) {
    if (n == null || Number.isNaN(n)) return '—';
    const x = Number(n);
    return Number.isInteger(x) ? String(x) : x.toFixed(digits == null ? 1 : digits);
  }

  function skillLevelText(name, level) {
    const s = SKILL_BY[name];
    if (!s || !s.levels || !level) return null;
    const cap = s.maxLevel;
    const lv = cap != null ? Math.min(level, cap) : level;
    const row = s.levels.find((l) => l.level === lv);
    return row ? row.text : null;
  }

  /* ---------- totals ---------- */
  function compute(build) {
    const b = build || state;
    const contrib = new Map();
    function add(skill, level, source, kind) {
      if (!skill || !level) return;
      if (!contrib.has(skill)) contrib.set(skill, []);
      contrib.get(skill).push({ source, level, kind });
    }
    const setCount = new Map();
    for (const part of PARTS) {
      const a = b.armor[part] && ARMOR_BY[b.armor[part]];
      if (!a) continue;
      for (const sk of a.skills) add(sk.name, sk.level, a.name, 'armor');
      if (a.setSkill) setCount.set(a.setSkill, (setCount.get(a.setSkill) || 0) + 1);
    }
    const w = b.weapon && WEP_BY[b.weapon];
    if (w && w.skill) add(w.skill.name, w.skill.level || 0, w.name, 'weapon');

    const setActive = [];
    const setProgress = [];
    for (const [name, cnt] of setCount) {
      const def = SET_BY[name];
      const need = def ? def.pieces : null;
      const on = need != null && cnt >= need;
      const rec = { name, count: cnt, need, on, effect: def ? def.effect : '', flavor: def && def.flavor, skill: def && def.skill, delta: def && def.delta };
      setProgress.push(rec);
      if (on) {
        setActive.push(rec);
        if (def && def.skill && def.delta) add(def.skill, def.delta, `套裝「${name}」`, 'set');
      }
    }
    setProgress.sort((a, b) => (b.on - a.on) || b.count - a.count);

    const skills = [...contrib.entries()].map(([name, sources]) => {
      const total = sources.reduce((s, x) => s + (x.level || 0), 0);
      const info = SKILL_BY[name] || { name, maxLevel: null, effect: '' };
      const cap = info.maxLevel;
      const effective = cap != null ? Math.min(total, cap) : total;
      const over = cap != null && total > cap;
      const maxed = cap != null && total >= cap;
      return { name, total, cap, effective, over, maxed, sources, effect: info.effect, cat: catOf(name), capUnknown: cap == null, text: skillLevelText(name, effective) };
    });
    skills.sort((a, b) => (b.over - a.over) || (b.maxed - a.maxed) || b.total - a.total || a.name.localeCompare(b.name, 'zh-Hant'));

    const visCost = (b.visages || []).reduce((s, v) => s + ((VIS_BY[v.id] && VIS_BY[v.id].cost) || 0), 0);
    const visSetCnt = new Map();
    const visFx = [];
    for (const slot of b.visages || []) {
      const v = VIS_BY[slot.id];
      if (!v) continue;
      for (const st of v.sets || []) visSetCnt.set(st, (visSetCnt.get(st) || 0) + 1);
      if (slot.core && v.main) visFx.push({ title: `核心・${v.name}`, text: v.main, kind: 'core' });
    }
    const visSets = [];
    for (const [name, cnt] of visSetCnt) {
      const def = VSET_BY[name];
      const fx = (def && def.effects || []).filter((e) => cnt >= e.pieces);
      visSets.push({ name, count: cnt, effects: def && def.effects || [], active: fx });
      for (const e of fx) visFx.push({ title: `${name}（${e.pieces} 件）`, text: e.text, kind: 'vset' });
    }
    const adv = ADV_BY[b.adventurerId];
    const insightUsed = (b.insights || []).reduce((s, key) => {
      const it = adv && adv.insights.find((x) => x.key === key);
      return s + ((it && it.points) || 0);
    }, 0);
    const insightFx = (b.insights || []).map((key) => {
      const it = adv && adv.insights.find((x) => x.key === key);
      return it ? { title: it.name, points: it.points, text: it.effect || '（此心得的詳細效果文案尚未收入）', kind: 'insight' } : null;
    }).filter(Boolean);

    return { skills, setActive, setProgress, visCost, visSets, visFx, insightUsed, insightFx, weapon: w, defense: PARTS.reduce((s, p) => s + ((ARMOR_BY[b.armor[p]] || {}).defense || 0), 0), build: b };
  }

  function currentOf(tot, name) {
    const s = tot.skills.find((x) => x.name === name);
    return s ? s.total : 0;
  }

  /* ---------- combat stats ---------- */
  function combatStats(tot) {
    const b = tot.build || state;
    const w = tot.weapon;
    const notes = [];
    const cond = [];
    const alwaysFx = [];
    const sources = { atk: [], aff: [], def: [], hp: [], elem: {}, dmg: [], res: {} };
    ELEMENTS.forEach((e) => { sources.elem[e] = []; });

    let atk = 0, aff = 0, def = tot.defense || 0, hpBonus = 0;
    const elemAtk = { 火: 0, 水: 0, 雷: 0, 冰: 0, 龍: 0 };
    const elemPct = { 火: 0, 水: 0, 雷: 0, 冰: 0, 龍: 0 };
    const res = { 火: 0, 水: 0, 雷: 0, 冰: 0, 龍: 0 };
    let status = null;
    let dmgPct = 0;

    if (w) {
      atk += w.attack || 0;
      sources.atk.push(`武器 ${w.name} ${w.attack}`);
      if (w.critRate) { aff += w.critRate; sources.aff.push(`武器 ${fmt(w.critRate)}%`); }
      if (ELEMENTS.includes(w.element) && w.elementValue) {
        elemAtk[w.element] += w.elementValue;
        sources.elem[w.element].push(`武器 ${w.elementValue}`);
      } else if (STATUSES.includes(w.element) && w.elementValue) {
        status = { name: w.element, value: w.elementValue, source: w.name };
      }
    } else {
      notes.push('尚未選擇武器，攻擊力、會心率與屬性攻擊沒有武器基礎值。');
    }
    if (tot.defense) sources.def.push(`五件防具合計 ${tot.defense}（最高稀有度）`);
    else notes.push('尚未裝備防具，沒有裝備防禦力。');

    for (const sk of tot.skills) {
      const text = sk.text;
      if (!text) continue;
      if (ALWAYS_STAT.has(sk.name)) {
        const hp = text.match(/^體力\+(\d+)/);
        if (hp) { hpBonus += +hp[1]; sources.hp.push(`${sk.name} Lv${sk.effective} +${hp[1]}`); }
        const defm = text.match(/防禦力\+(\d+)/);
        if (defm && !/技能發動|狂暴|耗盡/.test(text)) { def += +defm[1]; sources.def.push(`${sk.name} Lv${sk.effective} +${defm[1]}`); }
        const affm = text.match(/會心率\+(\d+(?:\.\d+)?)%/);
        if (affm && !/技能發動|弱點|發怒|狂暴|狩獵開始/.test(text)) { aff += +affm[1]; sources.aff.push(`${sk.name} Lv${sk.effective} +${affm[1]}%`); }
        const ea = text.match(/(火|水|雷|冰|龍)屬性攻擊力\+(\d+)/);
        if (ea) { elemAtk[ea[1]] += +ea[2]; sources.elem[ea[1]].push(`${sk.name} Lv${sk.effective} +${ea[2]}`); }
        const ep = text.match(/(火|水|雷|冰|龍)屬性傷害\+(\d+)%/);
        if (ep) { elemPct[ep[1]] += +ep[2]; }
        const rad = text.match(/挑戰融光種魔物時變為(\d+)%/);
        if (rad && ep) cond.push({ title: `${sk.name} Lv${sk.effective}（融光種）`, text: `${ep[1]}屬性傷害 +${rad[1]}%` });
        const r = text.match(/(火|水|雷|冰|龍)耐性\+(\d+)/);
        if (r) { res[r[1]] += +r[2]; }
      } else {
        cond.push({ title: `${sk.name} Lv${sk.effective}`, text });
        // generic 屬性攻擊力+N on triggered skills is also conditional
      }
    }

    // 繪影 published set / core
    for (const fx of tot.visFx) {
      const t = fx.text || '';
      const alwaysSet = /^((?:火|水|雷|冰|龍)屬性傷害|物理傷害|會心率|奧義蓄能效率|屬性傷害)\+(\d+(?:\.\d+)?)%[^，。]*。?$/.test(t) && !/時|後|觸發|使用/.test(t);
      const ep = t.match(/^(火|水|雷|冰|龍)屬性傷害\+(\d+(?:\.\d+)?)%/) ;
      const affm = t.match(/^會心率\+(\d+(?:\.\d+)?)%/);
      const phys = t.match(/^物理傷害\+(\d+(?:\.\d+)?)%/);
      if (ep && !/時|後|觸發|使用/.test(t.split('。')[0])) {
        elemPct[ep[1]] += +ep[2];
        sources.elem[ep[1]].push(`${fx.title} 傷害 +${ep[2]}%`);
      } else if (affm && !/時|後|觸發/.test(t.split('。')[0])) {
        aff += +affm[1]; sources.aff.push(`${fx.title} +${affm[1]}%`);
      } else if (phys && !/時|後|觸發/.test(t.split('。')[0])) {
        dmgPct += +phys[1]; sources.dmg.push(`${fx.title} 物理傷害 +${phys[1]}%`);
      } else if (/時|後|觸發|使用|冷卻|限S/.test(t)) {
        cond.push({ title: fx.title, text: t });
      } else {
        alwaysFx.push({ title: fx.title, text: t });
      }
    }

    // 心得 published
    for (const fx of tot.insightFx) {
      const t = fx.text || '';
      const affm = t.match(/會心率提升(\d+(?:\.\d+)?)%/);
      const dmg = t.match(/造成的傷害提升(\d+(?:\.\d+)?)%/);
      const resall = t.match(/全屬性耐性提升(\d+(?:\.\d+)?)%/);
      const defm = t.match(/防禦力\+(\d+)/);
      if (dmg && !/時，|後，|發動時/.test(t)) { dmgPct += +dmg[1]; sources.dmg.push(`${fx.title} 傷害 +${dmg[1]}%`); }
      else if (affm && !/時，|後，|發動時/.test(t)) { aff += +affm[1]; sources.aff.push(`${fx.title} +${affm[1]}%`); }
      else if (defm && !/時，|後，|發動時/.test(t)) { def += +defm[1]; sources.def.push(`${fx.title} +${defm[1]}`); }
      else if (/時，|後，|發動時|觸發|連續命中/.test(t)) cond.push({ title: fx.title, text: t });
      else alwaysFx.push({ title: fx.title, text: t });
    }

    // user-typed 繪影 substats
    let typed = false;
    (b.visages || []).forEach((slot, i) => {
      const sub = (b.visSubs || state.visSubs || {})[i] || {};
      const addIf = (key, fn) => {
        const v = sub[key];
        if (v === '' || v == null || Number.isNaN(Number(v))) return;
        typed = true; fn(Number(v));
      };
      addIf('attack', (n) => { atk += n; sources.atk.push(`繪影副屬性（自填）攻擊力 +${n}`); });
      addIf('affinity', (n) => { aff += n; sources.aff.push(`繪影副屬性（自填）會心率 +${n}%`); });
      addIf('defense', (n) => { def += n; sources.def.push(`繪影副屬性（自填）防禦力 +${n}`); });
      addIf('hp', (n) => { hpBonus += n; sources.hp.push(`繪影副屬性（自填）體力 +${n}`); });
      ELEMENTS.forEach((e) => addIf('elemAtk_' + e, (n) => { elemAtk[e] += n; sources.elem[e].push(`繪影副屬性（自填）${e}屬性攻擊 +${n}`); }));
      ELEMENTS.forEach((e) => addIf('elemPct_' + e, (n) => { elemPct[e] += n; }));
      addIf('physPct', (n) => { dmgPct += n; sources.dmg.push(`繪影副屬性（自填）物理傷害 +${n}%`); });
    });
    if ((b.visages || []).length && !typed) notes.push('已裝備繪影的副屬性是隨機數值，未填寫前不列入合計。');
    notes.push('冒險者本身的基礎體力、基礎防禦與基礎攻擊未在公開資料中，上表只加總武器、防具與已公開的技能／套裝／繪影／心得效果。');
    notes.push('傷害＋％不會換算進「攻擊力」數字，避免沒有公式就自行推算。');

    return { atk, aff, def, hpBonus, elemAtk, elemPct, res, status, dmgPct, sources, cond, alwaysFx, notes, weapon: w };
  }

  function pips(skill) {
    const cap = skill.cap;
    if (cap == null) return '<span class="pips"></span>';
    const filled = Math.min(skill.total, cap);
    let h = '<span class="pips" aria-hidden="true">';
    for (let i = 0; i < cap; i++) h += `<i class="pip${i < filled ? ' on' : ''}"></i>`;
    return h + '</span>';
  }
  function targetPips(name, level) {
    const cap = (SKILL_BY[name] || {}).maxLevel;
    if (cap == null) return '';
    let h = '<span class="pips" aria-hidden="true">';
    for (let i = 0; i < cap; i++) h += `<i class="pip${i < level ? ' on' : ''}"></i>`;
    return h + '</span>';
  }
  function lvText(skill) {
    if (skill.capUnknown) return `<span class="lv">Lv ${skill.total}</span>`;
    if (skill.over) return `<span class="lv over">${skill.total}<span style="opacity:.8">/${skill.cap}</span></span>`;
    if (skill.maxed) return `<span class="lv max">${skill.total} <span class="tick">✓</span></span>`;
    return `<span class="lv">${skill.total}<span style="opacity:.55">/${skill.cap}</span></span>`;
  }

  function renderSkills(tot, openKey) {
    if (!tot.skills.length) return `<div class="empty-hint">選好武器與防具後，所有發動中的技能都會列在這裡，不會只顯示前幾項。</div>`;
    return `<div class="skill-panel">${tot.skills.map((s) => {
      const open = openKey === s.name;
      const br = open ? `<div class="breakdown">${s.sources.map((x) =>
        `<div><span>${escape(x.source)}　<span class="muted">${x.kind === 'set' ? '套裝' : x.kind === 'weapon' ? '武器' : '防具'}</span></span><b>+${x.level}</b></div>`
      ).join('')}${s.over ? `<div class="err">超過上限 ${s.cap}，多出的 ${s.total - s.cap} 點不會再加強效果</div>` : ''}${s.text ? `<div class="d" style="margin-top:4px">${escape(s.text)}</div>` : (s.effect ? `<div class="d" style="margin-top:4px">${escape(s.effect)}</div>` : '')}</div>` : '';
      return `<button class="skill-row${open ? ' open' : ''}" data-act="toggle-skill" data-name="${escape(s.name)}">
        ${icon(s.cat)}
        <span class="skill-name">${escape(s.name)}</span>
        ${pips(s)}
        ${lvText(s)}
        ${br}
      </button>`;
    }).join('')}</div>`;
  }

  function goalStatus(tot, t) {
    const cur = currentOf(tot, t.name);
    const cap = (SKILL_BY[t.name] || {}).maxLevel;
    const eff = cap != null ? Math.min(cur, cap) : cur;
    if (cur >= t.level) {
      const extra = cap != null && cur > cap ? `（總計 ${cur}，超出上限的 ${cur - cap} 點無效）` : (cur > t.level ? `（目前 ${cur}）` : '');
      return `<div class="goal-status ok">✓ 已達成目標 ${t.level}${extra}</div>`;
    }
    return `<div class="goal-status short">還差 ${t.level - cur}（目前 ${cur}／目標 ${t.level}）</div>`;
  }

  function renderCombat(tot) {
    const c = combatStats(tot);
    const row = (k, v, s) => `<div class="stat-row"><div><div class="k">${k}</div>${s ? `<div class="s">${escape(s)}</div>` : ''}</div><div class="v">${v}</div></div>`;
    const elemRows = ELEMENTS.map((e) => {
      const at = c.elemAtk[e];
      const pct = c.elemPct[e];
      if (!at && !pct) return row(`${e}屬性攻擊`, '—', null);
      const src = (c.sources.elem[e] || []).join('、');
      return row(`${e}屬性攻擊`, `${fmt(at)}${pct ? `　傷害 +${fmt(pct)}%` : ''}`, src || null);
    }).join('');
    const resSrc = ELEMENTS.filter((e) => c.res[e]).map((e) => `${e} +${c.res[e]}`).join('　');
    return `
      <div class="stats">
        <div class="stat-head">常駐數值</div>
        ${row('攻擊力', fmt(c.atk), c.sources.atk.join('、') || null)}
        ${row('會心率', fmt(c.aff) + '%', c.sources.aff.join('、') || '沒有會心率加成')}
        ${elemRows}
        ${c.status ? row('異常狀態・' + c.status.name, fmt(c.status.value), '來自武器（公開基礎值）') : row('異常狀態', '—', '武器沒有毒／麻痺／睡眠／爆破')}
        ${c.dmgPct ? row('傷害加成（非屬性％）', '+' + fmt(c.dmgPct) + '%', c.sources.dmg.join('、')) : ''}
        ${row('防禦力', fmt(c.def), c.sources.def.join('、') || null)}
        ${row('體力加成', c.hpBonus ? '+' + fmt(c.hpBonus) : '—', (c.sources.hp.join('、') || '沒有體力強化') + '。基礎體力未公開，只列出技能／自填加成。')}
        ${row('屬性耐性', resSrc || '—', '來自耐性強化技能的公開點數（與百分比耐性分開）')}
        ${(c.alwaysFx && c.alwaysFx.length) ? `<div class="stat-head">其他常駐效果</div>` + c.alwaysFx.map((x) =>
          `<div class="stat-row"><div><div class="k">${escape(x.title)}</div><div class="s">${escape(x.text)}</div></div><div class="v"></div></div>`
        ).join('') : ''}
        ${c.cond.length ? `<div class="stat-head">條件觸發</div>` + c.cond.map((x) =>
          `<div class="stat-row"><div><div class="k">${escape(x.title)}</div><div class="s">${escape(x.text)}</div></div><div class="v"></div></div>`
        ).join('') : ''}
        <div class="stat-head">資料說明</div>
        <div class="stat-row" style="display:block;font-size:11px;color:var(--dim);line-height:1.55">${c.notes.map((n) => escape(n)).join('<br>')}</div>
      </div>`;
  }


  const PART_ICONS = {
    weapon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 21 3 17l8.5-8.5 1.8 1.8L7 21zm9.8-16.6 2.8 2.8-1.4 1.4-2.8-2.8 1.4-1.4zM13.2 6.2l4.6 4.6-7.8 7.8-1.5-1.5 2.2-2.2-1.1-1.1-2.2 2.2-1.5-1.5 7.8-7.8z"/></svg>',
    '頭部': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3c4.4 0 8 2.8 8 7.2V13h-2.2l-.8 6H7l-.8-6H4V10.2C4 5.8 7.6 3 12 3zm0 2.2c-3.2 0-5.8 1.8-5.8 5V11h11.6V10.2c0-3.2-2.6-5-5.8-5z"/></svg>',
    '胸部': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 18 5.2V10c0 5.2-2.6 8.6-6 9.8C8.6 18.6 6 15.2 6 10V5.2L12 3zm0 2.3L8 6.7V10c0 3.8 1.8 6.4 4 7.5 2.2-1.1 4-3.7 4-7.5V6.7L12 5.3z"/></svg>',
    '腕部': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 4h8v3.2l2 3V20H6V10.2l2-3V4zm2 2v1.5L8.2 11H15.8L14 7.5V6h-4z"/></svg>',
    '腰部': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 9h16v3.2l-1.2.8V18H5.2v-5L4 12.2V9zm3 3.8V16h10v-3.2l1- .6V11H6v1.2l1 .6z"/></svg>',
    '腿部': '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 3h6l.6 9.5 1.4 8.5h-3.1l-.7-5H10.8l-.7 5H7l1.4-8.5L9 3z"/></svg>',
    visage: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 19 7v10l-7 4-7-4V7l7-4zm0 2.3L7 8v8l5 2.8L17 16V8l-5-2.7z"/></svg>',
    insight: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h12v16l-6-3.2L6 20V4zm2 2v11.2l4-2.1 4 2.1V6H8z"/></svg>',
  };
  const TAB_ICONS = {
    build: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 19 6v5.4c0 4.4-3 7.5-7 8.8-4-1.3-7-4.4-7-8.8V6l7-3zm0 2.2L7 7.2v4.2c0 3.1 2 5.4 5 6.5 3-1.1 5-3.4 5-6.5V7.2l-5-1.8zM11 10h2v5h-2v-5z"/></svg>',
    wiki: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h5.2c1.8 0 3.3.8 4.3 2 1-1.2 2.5-2 4.3-2H21v16h-1.2c-1.6 0-3 .6-4.3 1.6-1.3-1-2.7-1.6-4.3-1.6H6V4zm2 2v12h3.2c1.3 0 2.5.3 3.6 1V8.2C13.7 7.4 12.5 7 11.2 7H8z"/></svg>',
    saves: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 3h8l5 5v13H7V3zm2 2v14h9V9.2L13.8 5H9zm1 3h6v2H10V8zm0 4h6v2H10v-2z"/></svg>',
    me: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0 2.1A1.9 1.9 0 1 0 12 9.9 1.9 1.9 0 0 0 12 6.1zM6.5 20v-1.4c0-2.6 3.1-4.1 5.5-4.1s5.5 1.5 5.5 4.1V20h-2.1v-1.3c0-1.3-1.9-2.1-3.4-2.1s-3.4.8-3.4 2.1V20H6.5z"/></svg>',
  };
  const STAT_ICONS = {
    atk: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5 13 6.2l-1.6 3-3.1 1.1 3.8 3.8-4.8 3.2.9 1.1 3.2-1.4 2 2 1.2-1.2-2-2 2.6-5 1.3 1.3 1.2-1.2-1.3-1.3L20.5 3.5z"/></svg>',
    aff: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5 14 9.2 21 12 14 14.8 12 21.5 10 14.8 3 12 10 9.2 12 2.5z"/></svg>',
    elem: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3s5 5.2 5 9.2A5 5 0 0 1 7 12.2C7 8.2 12 3 12 3z"/></svg>',
    def: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 19 5.5V12c0 4.4-3.1 7.4-7 8.8C8.1 19.4 5 16.4 5 12V5.5L12 3z"/></svg>',
    res: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18zm0 2.2a6.8 6.8 0 1 0 0 13.6 6.8 6.8 0 0 0 0-13.6zM11 7h2v5h-2V7zm0 6h2v2h-2v-2z"/></svg>',
  };
  const CAT_LABEL = { atk: '攻擊向', crit: '會心向', fire: '火屬性', water: '水屬性', thunder: '雷屬性', ice: '冰屬性', dragon: '龍屬性', def: '防禦向', hp: '體力／回復', res: '達人／生活', misc: '其他' };
  const CAT_ORDER = ['atk', 'crit', 'fire', 'water', 'thunder', 'ice', 'dragon', 'def', 'hp', 'res', 'misc'];
  const WIKI_CATS = [
    { id: 'skills', label: '技能' },
    { id: 'weapons', label: '武器' },
    { id: 'armor', label: '防具' },
    { id: 'sets', label: '套裝技能' },
    { id: 'visages', label: '繪影' },
    { id: 'insights', label: '心得' },
  ];

  function partIco(kind) { return `<span class="part-ico">${PART_ICONS[kind] || PART_ICONS.weapon}</span>`; }
  function lvBar(level, cap, extra) {
    const n = cap == null ? Math.max(level || 0, 1) : cap;
    let h = `<span class="lvbar${extra && extra.cls ? ' ' + extra.cls : ''}" ${extra && extra.attrs ? extra.attrs : ''}>`;
    for (let i = 1; i <= n; i++) h += `<i class="${i <= (level || 0) ? 'on' : ''}" data-act="${(extra && extra.act) || 'noop'}" data-lv="${i}"></i>`;
    return h + '</span>';
  }
  function fmtSearchTime(sec) {
    const s = Math.max(0, Number(sec) || 0);
    const mm = Math.floor(s / 60);
    const ss = Math.floor(s % 60);
    const cs = Math.floor((s - Math.floor(s)) * 100);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(mm)}:${pad(ss)}.${pad(cs)}`;
  }
  function toastLater(msg) {
    state.toast = msg;
    clearTimeout(toastLater._t);
    toastLater._t = setTimeout(() => { state.toast = ''; const el = document.querySelector('.toast'); if (el) el.remove(); }, 2200);
  }
  function shareText() {
    const tot = compute();
    const c = combatStats(tot);
    const w = tot.weapon;
    const lines = ['旅人配裝器（魔物獵人：旅人）'];
    lines.push('武器：' + (w ? w.name : '（未選）'));
    PARTS.forEach((p) => lines.push(PART_SHORT[p] + '：' + ((ARMOR_BY[state.armor[p]] || {}).name || '（空）')));
    if (state.visages.length) {
      lines.push('繪影：' + state.visages.map((v) => {
        const d = VIS_BY[v.id];
        return d ? (d.name + (v.core ? '（核心）' : '')) : '';
      }).filter(Boolean).join('、'));
    }
    if (state.insights.length) {
      const adv = ADV_BY[state.adventurerId];
      lines.push('心得：' + state.insights.map((k) => { const it = adv && adv.insights.find((x) => x.key === k); return it ? it.name : k; }).join('、'));
    }
    if (tot.skills.length) lines.push('技能：' + tot.skills.map((s) => s.name + ' ' + s.total + (s.over ? '（超上限）' : (s.maxed ? '✓' : ''))).join('、'));
    lines.push(`戰鬥數值：攻擊 ${fmt(c.atk)}　會心 ${fmt(c.aff)}%　防禦 ${fmt(c.def)}　體力加成 ${c.hpBonus ? '+' + fmt(c.hpBonus) : '—'}`);
    ELEMENTS.forEach((e) => {
      if (c.elemAtk[e] || c.elemPct[e]) lines.push(`${e}屬性攻擊 ${fmt(c.elemAtk[e])}${c.elemPct[e] ? '　傷害 +' + fmt(c.elemPct[e]) + '%' : ''}`);
    });
    return lines.join('\n');
  }

  function renderChrome(title, body, actionHtml, opts) {
    opts = opts || {};
    const noAct = !actionHtml;
    return `
      <header class="app-head">
        <div class="head-bar">
          <button class="hb menu-btn" data-act="menu" aria-label="選單">☰</button>
          <h1>${escape(title)}</h1>
          <button class="hb star-btn" data-act="star" aria-label="收藏">★</button>
        </div>
      </header>
      <div class="page${noAct ? ' no-act' : ''}">${body}</div>
      ${actionHtml || ''}
      <nav class="tabbar">
        <button class="${state.tab === 'build' ? 'on' : ''}" data-act="tab" data-tab="build">${TAB_ICONS.build}<span>配裝</span></button>
        <button class="${state.tab === 'wiki' ? 'on' : ''}" data-act="tab" data-tab="wiki">${TAB_ICONS.wiki}<span>百科</span></button>
        <button class="${state.tab === 'saves' ? 'on' : ''}" data-act="tab" data-tab="saves">${TAB_ICONS.saves}<span>收藏</span></button>
        <button class="${state.tab === 'me' ? 'on' : ''}" data-act="tab" data-tab="me">${TAB_ICONS.me}<span>我的</span></button>
      </nav>
      ${state.menuOpen ? renderMenu() : ''}
      ${state.toast ? `<div class="toast">${escape(state.toast)}</div>` : ''}
      ${renderPicker()}`;
  }
  function renderMenu() {
    return `<div class="drawer-bg" data-act="close-menu"></div>
      <aside class="drawer">
        <h2>旅人配裝器</h2>
        <button data-act="tab" data-tab="build">配裝</button>
        <button data-act="tab" data-tab="wiki">百科</button>
        <button data-act="tab" data-tab="saves">收藏（存檔）</button>
        <button data-act="tab" data-tab="me">我的</button>
        <p class="note">排版暫時對齊參考 App 的結構，之後再改成自己的版本。資料來源：GameWith 繁中 Wiki。僅存這台裝置，不需付費。</p>
      </aside>`;
  }

  function slotLabel(kind, item, empty) {
    if (!item) return `<span class="slot-name empty">[空位]</span>`;
    return `<span class="slot-name">${escape(item)}</span>`;
  }
  function weaponLine() {
    const w = state.weapon && WEP_BY[state.weapon];
    if (!w) return { title: null, sub: '' };
    return { title: w.name, sub: `攻擊 ${w.attack}　會心 ${fmt(w.critRate)}%${w.element ? '　' + w.element + ' ' + (w.elementValue || '') : ''}` };
  }

  function renderSearchScreen() {
    const w = weaponLine();
    const adv = ADV_BY[state.adventurerId];
    const fixedOpen = !state.collapsed.fixed;
    const wepOpen = !state.collapsed.weapon;
    const skOpen = !state.collapsed.skills;
    const rows = [{ key: 'weapon', kind: 'weapon', label: state.locked.weapon ? w.title : null, sub: state.locked.weapon ? w.sub : '' }].concat(PARTS.map((p) => {
      const a = state.locked[p] && state.armor[p] && ARMOR_BY[state.armor[p]];
      return { key: p, kind: 'armor', part: p, label: a ? a.name : null, sub: a ? `防禦 ${a.defense}${a.skills && a.skills.length ? '　' + a.skills.map((s) => s.name + s.level).join('、') : ''}` : '' };
    }));
    return renderChrome('搜索配裝', `
      <div class="sec${fixedOpen ? '' : ' closed'}">
        <button class="sec-h" data-act="collapse" data-k="fixed">固定裝備<span class="caret">${fixedOpen ? '−' : '+'}</span></button>
        <div class="sec-body">
          ${rows.map((r) => `
            <button class="slot-row" data-act="pick" data-kind="${r.kind}" data-part="${r.part || ''}" data-lock="1">
              ${partIco(r.kind === 'weapon' ? 'weapon' : r.part)}
              <span style="flex:1;min-width:0;text-align:left">
                ${slotLabel(r.kind, r.label)}
                ${r.sub && r.label ? `<div class="slot-sub">${escape(r.sub)}</div>` : ''}
              </span>
            </button>`).join('')}
          <p class="hint">選擇要固定的裝備；搜索時對應部位的裝備將不會改變。點擊對應部位的裝備槽以選擇。旅人沒有裝飾珠與護石，空槽留給自動配裝的防具、繪影與心得。</p>
        </div>
      </div>
      <div class="sec${wepOpen ? '' : ' closed'}">
        <button class="sec-h" data-act="collapse" data-k="weapon">武器配置<span class="caret">${wepOpen ? '−' : '+'}</span></button>
        <div class="sec-body">
          <div class="seg">
            <button class="${state.weaponMode === 'custom' ? 'on' : ''}" data-act="weapon-mode" data-mode="custom">自選武器</button>
            <button class="${state.weaponMode === 'template' ? 'on' : ''}" data-act="weapon-mode" data-mode="template">武器模板</button>
          </div>
          ${state.weaponMode === 'custom' ? `
            <div class="wtype-row">${WEAPON_TYPES.map((t) =>
              `<button class="chip${state.weaponType === t ? ' on' : ''}" data-act="wtype" data-type="${t}">${t}</button>`
            ).join('')}</div>
            <div class="hint">限制使用武器：</div>
            <button class="slot-row" data-act="pick" data-kind="weapon">
              ${partIco('weapon')}
              ${w.title ? `<span style="flex:1;text-align:left"><span class="slot-name">${escape(w.title)}</span><div class="slot-sub">${escape(w.sub)}</div></span>` : '<span class="slot-name empty">[空位]</span>'}
            </button>` : `
            <div class="wtype-row">${WEAPON_TYPES.map((t) =>
              `<button class="chip${state.weaponType === t ? ' on' : ''}" data-act="wtype" data-type="${t}">${t}</button>`
            ).join('')}</div>
            <div class="hint">依目前武器種類，快速選攻擊、屬性或會心最高的一把（不是遊戲內模板，只是快捷篩選）。</div>
            <div class="tpl-list">${weaponTemplates().map((t) => `
              <button data-act="pick-tpl" data-slug="${escape(t.w.slug)}">
                <div class="nm">${escape(t.label)}　${escape(t.w.name)}</div>
                <div class="muted">攻擊 ${t.w.attack}　會心 ${fmt(t.w.critRate)}%${t.w.element ? '　' + t.w.element + ' ' + (t.w.elementValue || '') : ''}</div>
              </button>`).join('') || '<div class="empty-hint">這個種類沒有可用武器。</div>'}
            </div>`}
          <div class="btn-row" style="margin-top:10px">
            <label class="muted">冒險者
              <select class="field" data-act="adventurer">${D.adventurers.map((a) =>
                `<option value="${escape(a.id)}" ${state.adventurerId === a.id ? 'selected' : ''}>${escape(a.name)}</option>`
              ).join('')}</select>
            </label>
            <label class="muted">目前心得點數
              <input class="field" type="number" min="0" step="1" value="${state.insightBudget}" data-act="budget" style="width:88px">
            </label>
          </div>
        </div>
      </div>
      <div class="sec${skOpen ? '' : ' closed'}">
        <button class="sec-h crimson" data-act="collapse" data-k="skills">發動技能<span class="caret">${skOpen ? '−' : '+'}</span></button>
        <div class="sec-body">
          ${state.searchTargets.length ? state.searchTargets.map((t, i) => {
            const info = SKILL_BY[t.name] || { maxLevel: t.level };
            const tot = compute();
            return `<div class="tgt-row">
              <button data-act="go-screen" data-screen="skills">${icon(catOf(t.name))}</button>
              <button data-act="go-screen" data-screen="skills" style="text-align:left">
                <div class="tgt-name">${escape(t.name)} <span class="lv">${t.level}</span></div>
                ${goalStatus(tot, t)}
              </button>
              <button data-act="set-tgt-wrap" data-name="${escape(t.name)}">
                ${lvBar(t.level, info.maxLevel, { cls: 'lg', act: 'skill-seg', attrs: `data-name="${escape(t.name)}"` })}
              </button>
            </div>`;
          }).join('') : ''}
          <button class="add-skill-hint" data-act="go-screen" data-screen="skills">${state.searchTargets.length ? '點此新增或調整技能' : '點此選擇要發動的技能'}</button>
        </div>
      </div>
    `, actionBar(['back-search', '搜索配裝', '搜索結果']));
  }

  function actionBar(items) {
    const map = {
      'back-search': `<button class="abtn back" data-act="go-screen" data-screen="search">←</button>`,
      'back-results': `<button class="abtn back" data-act="go-screen" data-screen="results">←</button>`,
      '搜索配裝': `<button class="abtn" data-act="run-search">${state.searchBusy ? '搜尋中…' : '搜索配裝'}</button>`,
      '搜索結果': `<button class="abtn" data-act="go-screen" data-screen="results">搜索結果</button>`,
      '排序結果': `<button class="abtn" data-act="sort-results">排序結果</button>`,
      '分享': `<button class="abtn" data-act="share">↗ 分享</button>`,
      '保存': `<button class="abtn" data-act="save-now">保存</button>`,
      '分組排序': `<button class="abtn" data-act="noop">分組排序</button>`,
    };
    const left = items[0] === 'back-search' || items[0] === 'back-results' || items[0] === 'back-wiki'
      ? (items[0] === 'back-wiki' ? `<button class="abtn back" data-act="wiki-back">←</button>` : map[items[0]])
      : (map[items[0]] || `<button class="abtn">${escape(items[0])}</button>`);
    return `<div class="action-bar">${left}${map[items[1]] || ''}${map[items[2]] || ''}</div>`;
  }

  function weaponTemplates() {
    const list = D.weapons.filter((w) => w.typeLabel === state.weaponType);
    const pick = (key, pred) => {
      const arr = list.filter((w) => pred ? pred(w) : true).slice().sort((a, b) => (b[key] || 0) - (a[key] || 0) || (b.attack || 0) - (a.attack || 0));
      return arr[0];
    };
    const items = [];
    const a = pick('attack');
    if (a) items.push({ label: '高攻擊', w: a });
    const e = pick('elementValue', (w) => w.elementValue);
    if (e && e !== a) items.push({ label: '高屬性', w: e });
    const c = pick('critRate');
    if (c && c !== a && c !== e) items.push({ label: '高會心', w: c });
    return items;
  }

  function renderSkillPicker() {
    const q = (state.skillQ || '').trim().toLowerCase();
    const selected = new Map(state.searchTargets.map((t) => [t.name, t.level]));
    const groups = {};
    CAT_ORDER.forEach((c) => { groups[c] = []; });
    const picked = [];
    for (const s of D.skills) {
      if (q && !s.name.toLowerCase().includes(q) && !(s.effect || '').includes(state.skillQ) && !(s.levels || []).some((l) => (l.text || '').includes(state.skillQ))) continue;
      if (selected.has(s.name)) { picked.push(s); continue; }
      const c = catOf(s.name);
      (groups[c] || (groups[c] = [])).push(s);
    }
    let grid = '';
    function cardsOf(list, c) {
      return list.map((s) => {
        const lv = selected.get(s.name);
        const on = lv != null;
        const tip = state.skillTip === s.name;
        const cat = c || catOf(s.name);
        const levels = (s.levels || []).map((l) => `Lv.${l.level} ${l.text}`).join('<br>');
        return `<div class="scard${on ? ' on' : ''} cat-${cat}" style="position:relative">
          <div class="sc-top">
            ${icon(cat)}
            <button class="sc-name" data-act="skill-toggle" data-name="${escape(s.name)}">${escape(s.name)}${on ? ' ' + lv : ''}</button>
            <button class="q" data-act="skill-tip" data-name="${escape(s.name)}">?</button>
          </div>
          <button data-act="noop" style="align-self:flex-start">${lvBar(on ? lv : 0, s.maxLevel, { act: 'skill-seg', attrs: `data-name="${escape(s.name)}"` })}</button>
          <div class="sc-sub">${s.maxLevel ? '上限 Lv' + s.maxLevel : '上限未公開'}</div>
          ${tip ? `<div class="tip-pop"><b>${escape(s.name)}</b><div>${escape(s.effect || '')}</div><div style="margin-top:4px">${levels}</div></div>` : ''}
        </div>`;
      }).join('');
    }
    if (picked.length && !q) {
      grid += `<div class="cat-head">已選技能</div>` + cardsOf(picked);
    }
    for (const c of CAT_ORDER) {
      const list = groups[c] || [];
      if (!list.length) continue;
      grid += `<div class="cat-head">${CAT_LABEL[c] || c}</div>` + cardsOf(list, c);
    }
    return renderChrome('選擇配裝技能', `
      <div class="skill-grid">${grid || '<div class="empty-hint" style="grid-column:1/-1">沒有符合的技能</div>'}</div>
      <div style="height:8px"></div>
    `, `<div class="search-dock">
      <button class="abtn back" data-act="go-screen" data-screen="search">←</button>
      <div style="position:relative;flex:1">
        <input data-act="skill-q" placeholder="找點什麼.." value="${escape(state.skillQ || '')}">
        ${state.skillQ ? `<button class="clear" data-act="skill-q-clear" style="position:absolute;right:8px;top:4px;width:28px;height:28px">×</button>` : ''}
      </div>
    </div>`);
  }

  function resultBuildOf(rec) {
    return {
      weaponType: state.weaponType, weapon: state.weapon,
      armor: { ...rec.armor },
      visages: rec._visages || state.visages,
      visSubs: rec._visSubs || state.visSubs,
      adventurerId: state.adventurerId,
      insightBudget: state.insightBudget,
      insights: rec._insights || state.insights,
    };
  }

  function renderResults() {
    const n = state.altResults.length;
    const head = state.searchInfo
      ? `<div class="result-head">${escape(state.searchInfo)}${state.searchMs ? '' : ''}</div>`
      : `<div class="result-head">尚未搜索。請先選技能後按「搜索配裝」。</div>`;
    const note = state.searchNote ? `<div class="alt-note">${escape(state.searchNote)}</div>` : '';
    const limit = state.resultLimit > 0 ? Math.min(n, state.resultLimit) : n;
    const cards = n ? state.altResults.slice(0, limit).map((rec, i) => renderResultCard(rec, i)).join('') + (limit < n ? `<div class="hint">還有 ${n - limit} 套結果，可向下或重新搜索查看（共 ${n} 套）。</div>` : '') : '<div class="empty-hint">沒有配裝結果。</div>';
    return renderChrome('配裝結果', `${head}${note}${cards}`, actionBar(['back-search', '搜索配裝', '排序結果']));
  }

  function renderResultCard(rec, i) {
    const build = i === state.altIndex ? snapshot() : Object.assign(snapshot(), { armor: { ...rec.armor } });
    const tot = compute(i === state.altIndex ? undefined : Object.assign({}, state, { armor: rec.armor }));
    const w = tot.weapon;
    const c = combatStats(tot);
    const on = i === state.altIndex;
    const eqRows = [];
    eqRows.push({ kind: 'weapon', part: 'weapon', name: w ? w.name : '[空位]', empty: !w });
    PARTS.forEach((p) => {
      const a = (i === state.altIndex ? state.armor[p] : rec.armor[p]) && ARMOR_BY[i === state.altIndex ? state.armor[p] : rec.armor[p]];
      eqRows.push({ kind: 'armor', part: p, name: a ? a.name : '[空位]', empty: !a });
    });
    const visNames = (state.visages || []).map((v) => {
      const d = VIS_BY[v.id];
      return d ? d.name + (v.core ? '（核心）' : '') : '';
    }).filter(Boolean);
    const adv = ADV_BY[state.adventurerId];
    const insNames = (state.insights || []).map((k) => { const it = adv && adv.insights.find((x) => x.key === k); return it ? it.name + ' ' + it.points : ''; }).filter(Boolean);
    const extra = [...visNames, ...insNames].join('，') || '[空位]';
    eqRows.push({ kind: 'extra', part: 'extra', name: extra, empty: !visNames.length && !insNames.length });

    const skills = tot.skills;
    const mid = Math.ceil(skills.length / 2) || 0;
    // two-column but expand spans full width: render as grid of buttons
    const skHtml = skills.length ? `<div class="skill-2col">${skills.map((s) => {
      const open = on && state.openSkill === s.name;
      return `<button class="sk-mini${open ? ' open' : ''}${s.over ? ' over' : ''}" data-act="toggle-skill" data-name="${escape(s.name)}" data-i="${i}">
        ${icon(s.cat)}
        <span class="nm">${escape(s.name)}${s.over ? ' <span class="lv over">' + s.total + '</span>' : (s.maxed ? ' ' + s.total + ' <span class="tick">✓</span>' : ' ' + s.total)}</span>
        ${lvBar(s.effective, s.cap, { cls: 'mini', act: 'noop' })}
        ${open ? `<div class="breakdown">${s.sources.map((x) =>
          `<div><span>${escape(x.source)}　<span class="muted">${x.kind === 'set' ? '套裝' : x.kind === 'weapon' ? '武器' : '防具'}</span></span><b>+${x.level}</b></div>`
        ).join('')}${s.over ? `<div class="err">超過上限 ${s.cap}，多出的 ${s.total - s.cap} 點不會再加強效果</div>` : ''}${s.text ? `<div class="d">${escape(s.text)}</div>` : (s.effect ? `<div class="d">${escape(s.effect)}</div>` : '')}</div>` : ''}
      </button>`;
    }).join('')}</div>` : '<div class="empty-hint">沒有發動中的技能</div>';

    const visHtml = `
      <div class="vis-list">
        ${visNames.map((n, vi) => {
          const slot = state.visages[vi]; const d = slot && VIS_BY[slot.id];
          return `<div class="vis-item">${partIco('visage')}<span>${escape(n)}${d && d.cost != null ? '　費用 ' + d.cost : ''}</span></div>`;
        }).join('')}
        ${insNames.map((n) => `<div class="vis-item">${partIco('insight')}<span>${escape(n)}</span></div>`).join('')}
        ${!visNames.length && !insNames.length ? '<div class="muted">尚未配置繪影或心得</div>' : ''}
      </div>
      <div class="hint">繪影費用 ${tot.visCost}/${VISAGE_CAP}${tot.visSets && tot.visSets.length ? '　' + tot.visSets.map((s) => s.name + ' ' + s.count + '件').join('、') : ''}</div>`;

    const elemShow = ELEMENTS.find((e) => c.elemAtk[e] || c.elemPct[e]);
    const resShow = ELEMENTS.filter((e) => c.res[e]).map((e) => e + '+' + c.res[e]).join(' ') || '0';
    const stats = `<button class="stat-icons" data-act="toggle-stats" data-i="${i}" data-open="1">
        <span class="stat-ico">${STAT_ICONS.atk}<span class="lab">攻擊</span>${fmt(c.atk)}</span>
        <span class="stat-ico">${STAT_ICONS.aff}<span class="lab">會心</span>${fmt(c.aff)}%</span>
        <span class="stat-ico">${STAT_ICONS.elem}<span class="lab">屬性</span>${elemShow ? (elemShow + ' ' + fmt(c.elemAtk[elemShow])) : '—'}</span>
        <span class="stat-ico">${STAT_ICONS.def}<span class="lab">防禦</span>${fmt(c.def)}</span>
        <span class="stat-ico">${STAT_ICONS.res}<span class="lab">耐性</span>${resShow}</span>
      </button>
      ${state.openStats === i ? renderCombat(tot) : ''}`;

    return `<article class="result-card" style="${on ? '' : 'opacity:.92'}">
      <div class="sec-label">裝備一覽</div>
      ${eqRows.map((r) => `
        <div class="eq-row">
          ${partIco(r.kind === 'weapon' ? 'weapon' : r.kind === 'extra' ? 'visage' : r.part)}
          <button class="nm${r.empty ? ' empty' : ''}" data-act="use-alt" data-i="${i}" ${r.kind !== 'extra' ? `data-edit="1"` : ''}>${escape(r.name)}</button>
          ${r.kind !== 'extra' ? `<div class="row-acts">
            <button class="icon-btn${state.locked[r.part === 'weapon' ? 'weapon' : r.part] ? ' on' : ''}" data-act="pin-slot" data-part="${r.part}" data-i="${i}" title="固定此部位"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 13v8M9 3h6l-1.2 6.2a3.4 3.4 0 1 1-3.6 0L9 3z"/></svg></button>
            <button class="icon-btn" data-act="rm-slot" data-part="${r.part}" data-i="${i}" title="移除此件"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
          </div>` : ''}
        </div>`).join('')}
      <div class="sec-label">技能一覽</div>
      ${skHtml}
      <div class="sec-label">繪影／心得</div>
      ${visHtml}
      <div class="sec-label">狀態一覽</div>
      ${stats}
      <div class="card-foot">
        <button data-act="go-screen" data-screen="edit" data-i="${i}" title="編輯">✎</button>
        <button data-act="share" data-i="${i}" title="分享">↗</button>
        <button data-act="save-now" data-i="${i}" title="保存">☑</button>
      </div>
    </article>`;
  }

  function renderEdit() {
    const tot = compute();
    const w = tot.weapon;
    const cols = [
      { key: 'weapon', label: '武', ico: 'weapon' },
      ...PARTS.map((p) => ({ key: p, label: PART_SHORT[p], ico: p })),
      { key: 'visage', label: '影', ico: 'visage' },
      { key: 'insight', label: '心', ico: 'insight' },
    ];
    const cell = (skillName, key) => {
      let n = 0;
      if (key === 'weapon') {
        const wp = w && w.skill && w.skill.name === skillName ? (w.skill.level || 0) : 0;
        n = wp;
      } else if (PARTS.includes(key)) {
        const a = state.armor[key] && ARMOR_BY[state.armor[key]];
        if (a) {
          for (const sk of a.skills) if (sk.name === skillName) n += sk.level;
          const st = a.setSkill && SET_BY[a.setSkill];
          // set bonus is not from a single piece alone if need>1; show only native skills in cells, set listed separately? 
          // Better: if this piece contributes to an active set that grants this skill, we could mark it. Keep cells as piece skills only.
        }
      } else if (key === 'visage' || key === 'insight') {
        n = 0; // 繪影/心得 rarely grant named skills in our data
      }
      return n ? `<span class="n on">${n}</span>` : '';
    };
    // Also show set contributions in a note under the table, and add set skill rows already in tot.skills (sources kind set won't appear in a column — add a virtual column? Skip, list in breakdown elsewhere)
    const rows = tot.skills.map((s) => {
      const setSrc = s.sources.filter((x) => x.kind === 'set');
      return `<tr>
        <td class="sk">${icon(s.cat)}${escape(s.name)}</td>
        <td class="lv">Lv${s.total}${s.over ? `<span class="lv over">/${s.cap}</span>` : (s.maxed ? ' <span class="tick">✓</span>' : '')}</td>
        ${cols.map((c) => `<td class="n">${cell(s.name, c.key)}</td>`).join('')}
      </tr>${setSrc.length ? `<tr><td colspan="${2 + cols.length}" class="muted" style="text-align:left">套裝：${setSrc.map((x) => escape(x.source) + ' +' + x.level).join('、')}</td></tr>` : ''}`;
    }).join('');

    const pieceCards = [];
    pieceCards.push({
      ico: 'weapon', title: w ? w.name : '[空位]', kind: 'weapon',
      skills: w && w.skill ? [{ name: w.skill.name, level: w.skill.level }] : [],
      extra: w ? `攻擊 ${w.attack}　會心 ${fmt(w.critRate)}%${w.element ? '　' + w.element + ' ' + (w.elementValue || '') : ''}` : '',
    });
    PARTS.forEach((p) => {
      const a = state.armor[p] && ARMOR_BY[state.armor[p]];
      pieceCards.push({
        ico: p, title: a ? a.name : '[空位]', kind: 'armor', part: p,
        skills: a ? (a.skills || []).map((s) => ({ name: s.name, level: s.level })) : [],
        extra: a ? `防禦 ${a.defense}${a.setSkill ? '　套裝：' + a.setSkill : ''}` : '',
      });
    });

    const visCards = (state.visages || []).map((slot, i) => {
      const v = VIS_BY[slot.id];
      const sub = state.visSubs[i] || {};
      const field = (key, label) => `<label>${label}<input type="number" step="any" data-act="substat" data-i="${i}" data-key="${key}" value="${sub[key] == null ? '' : escape(sub[key])}"></label>`;
      return `<div class="piece-card">
        <button data-act="pick" data-kind="visage" data-index="${i}" style="width:100%;text-align:left">
          <h3>${partIco('visage')}${v ? escape(v.name) : '[空位]'}${slot.core ? '　核心' : ''}</h3>
        </button>
        <div class="skills">
          ${v && v.main ? `<div class="muted">${slot.core ? '核心效果：' : '（核心未啟動）'}${escape(v.main || '')}</div>` : ''}
          ${v && v.sets ? `<div class="muted">影繪：${v.sets.join('、')}　費用 ${v.cost}</div>` : ''}
        </div>
        <button class="btn ghost" style="margin-top:8px" data-act="toggle-subs" data-i="${i}">${state.showSubs[i] ? '收合副屬性' : '填寫副屬性（自填才列入合計）'}</button>
        ${state.showSubs[i] ? `<div class="subgrid">
          ${field('attack', '攻擊力')}
          ${field('affinity', '會心率 %')}
          ${field('defense', '防禦力')}
          ${field('hp', '體力')}
          ${field('physPct', '物理傷害 %')}
          ${ELEMENTS.map((e) => field('elemAtk_' + e, e + '屬性攻擊')).join('')}
          ${ELEMENTS.map((e) => field('elemPct_' + e, e + '傷害 %')).join('')}
        </div>` : ''}
      </div>`;
    }).join('');

    const adv = ADV_BY[state.adventurerId];
    const insCard = `<div class="piece-card">
      <button data-act="pick" data-kind="insight" style="width:100%;text-align:left">
        <h3>${partIco('insight')}心得　${tot.insightUsed}/${state.insightBudget}</h3>
      </button>
      <div class="skills">${(tot.insightFx || []).map((x) => `<div class="skl"><b>${escape(x.title)}</b> <span class="muted">${escape(x.text)}</span></div>`).join('') || '<div class="muted">尚未選擇心得</div>'}</div>
    </div>`;

    return renderChrome('編輯配裝', `
      <div class="matrix-wrap">
        <table class="matrix">
          <thead><tr><th></th><th></th>${cols.map((c) => `<th title="${escape(c.label)}">${PART_ICONS[c.ico] ? `<span class="part-ico" style="width:18px;height:18px;margin:auto">${PART_ICONS[c.ico]}</span>` : escape(c.label)}</th>`).join('')}</tr></thead>
          <tbody>${rows || '<tr><td colspan="10" class="muted">還沒有技能，請先搜索或手動選裝備</td></tr>'}</tbody>
        </table>
      </div>
      <div class="sec-label">裝備</div>
      ${pieceCards.map((p) => `
        <button class="piece-card" data-act="pick" data-kind="${p.kind}" ${p.part ? `data-part="${p.part}"` : ''} style="width:100%;text-align:left;display:block">
          <h3>${partIco(p.ico)}${escape(p.title)}</h3>
          ${p.extra ? `<div class="muted" style="padding-left:30px">${escape(p.extra)}</div>` : ''}
          <div class="skills">${p.skills.length ? p.skills.map((s) => `<div class="skl">${icon(catOf(s.name))}${escape(s.name)} ${s.level}</div>`).join('') : '<div class="muted">（無技能）</div>'}</div>
        </button>`).join('')}
      <div class="sec-label">繪影／心得</div>
      ${visCards || '<div class="empty-hint">尚未配置繪影。<button class="btn ghost" data-act="add-visage">新增繪影</button></div>'}
      ${state.visages.length ? '<div class="btn-row"><button class="btn ghost" data-act="add-visage">新增繪影</button></div>' : ''}
      ${insCard}
      <div class="sec-label">戰鬥數值</div>
      ${renderCombat(tot)}
      ${tot.skills.length ? `<div class="sec-label">技能來源</div>${renderSkills(tot, state.openSkill)}` : ''}
    `, actionBar(['back-results', '分享', '保存']));
  }

  function renderWiki() {
    if (state.wikiDetail) return renderWikiDetail();
    if (state.wikiCat) return renderWikiList();
    return renderChrome('遊戲百科', `
      <div class="wiki-cats">
        <div>
          <div class="ornament"><span>資料</span></div>
          <div class="cat-grid">
            ${WIKI_CATS.map((c) => `<button class="cat-btn" data-act="wiki-cat" data-cat="${c.id}">${escape(c.label)}</button>`).join('')}
          </div>
        </div>
        <p class="hint">列出本機已收入的技能、武器、防具、繪影與心得。數值來自 GameWith 繁中 Wiki（${escape((D.notes && D.fetchedAt) || D.fetchedAt || '')}）。點進項目可看說明，與搜索配裝用同一份資料。</p>
      </div>
    `, `<div class="search-dock">
      <div style="position:relative;flex:1">
        <input data-act="wiki-q" placeholder="找點什麼.." value="${escape(state.wikiQ || '')}">
      </div>
    </div>`);
  }

  function wikiFiltered() {
    const q = (state.wikiQ || '').trim();
    const cat = state.wikiCat;
    const hit = (s) => !q || String(s).toLowerCase().includes(q.toLowerCase());
    if (cat === 'skills' || (!cat && q)) {
      /* when searching from home, search all — handled in renderWikiList only when cat set; home with query jumps? We'll search all cats if query on home */
    }
    if (cat === 'skills') return D.skills.filter((s) => hit(s.name) || hit(s.effect)).map((s) => ({ kind: 'skill', id: s.slug || s.name, name: s.name, meta: (s.maxLevel ? '上限 Lv' + s.maxLevel : '') + (s.effect ? '　' + s.effect : '') }));
    if (cat === 'weapons') return D.weapons.filter((w) => hit(w.name) || hit(w.typeLabel) || hit(w.element)).map((w) => ({ kind: 'weapon', id: w.slug, name: w.name, meta: `${w.typeLabel}　攻擊 ${w.attack}　會心 ${fmt(w.critRate)}%${w.element ? '　' + w.element + ' ' + (w.elementValue || '') : ''}` }));
    if (cat === 'armor') return D.armor.filter((a) => hit(a.name) || hit(a.partLabel) || hit(a.setSkill) || (a.skills || []).some((s) => hit(s.name))).map((a) => ({ kind: 'armor', id: a.id, name: a.name, meta: `${a.partLabel}　防禦 ${a.defense}${a.setSkill ? '　' + a.setSkill : ''}` }));
    if (cat === 'sets') return D.setSkills.filter((s) => hit(s.name) || hit(s.effect) || hit(s.skill)).map((s) => ({ kind: 'set', id: s.name, name: s.name, meta: (s.pieces ? s.pieces + ' 件' : '') + (s.skill ? '　' + s.skill + '+' + (s.delta || '') : '') }));
    if (cat === 'visages') return D.visages.filter((v) => hit(v.name) || hit(v.main) || (v.sets || []).some(hit)).map((v) => ({ kind: 'visage', id: v.id, name: v.name, meta: `費用 ${v.cost}${(v.sets || []).length ? '　' + v.sets.join('、') : ''}` }));
    if (cat === 'insights') {
      const out = [];
      for (const a of D.adventurers) {
        for (const it of a.insights || []) {
          if (hit(it.name) || hit(it.effect) || hit(a.name)) out.push({ kind: 'insight', id: a.id + ':' + it.key, name: it.name, meta: `${a.name}　${it.points} 點` });
        }
      }
      return out;
    }
    return [];
  }
  function renderWikiHomeSearch() {
    const q = (state.wikiQ || '').trim();
    if (!q) return '';
    const prev = state.wikiCat;
    const blocks = [];
    for (const c of WIKI_CATS) {
      state.wikiCat = c.id;
      const items = wikiFiltered().slice(0, 8);
      if (items.length) blocks.push(`<div class="sec-label">${escape(c.label)}</div>` + items.map(wikiItemHtml).join(''));
    }
    state.wikiCat = prev;
    return blocks.join('') || '<div class="empty-hint">沒有符合的項目</div>';
  }
  function wikiItemHtml(it) {
    return `<button class="wiki-item" data-act="wiki-open" data-kind="${it.kind}" data-id="${escape(it.id)}">
      ${icon(it.kind === 'skill' ? catOf(it.name) : 'misc')}
      <span class="nm">${escape(it.name)}</span>
      <span class="meta">${escape(it.meta || '')}</span>
    </button>`;
  }
  function renderWikiList() {
    const label = (WIKI_CATS.find((c) => c.id === state.wikiCat) || {}).label || '百科';
    const items = wikiFiltered();
    return renderChrome(label, `${items.length ? items.map(wikiItemHtml).join('') : '<div class="empty-hint">沒有符合的項目</div>'}`,
      `<div class="search-dock">
        <button class="abtn back" data-act="wiki-back">←</button>
        <div style="position:relative;flex:1">
          <input data-act="wiki-q" placeholder="找點什麼.." value="${escape(state.wikiQ || '')}">
        </div>
      </div>`);
  }
  function kv(k, v) { return `<div class="detail-kv"><span class="k">${escape(k)}</span><span class="val">${v == null || v === '' ? '—' : v}</span></div>`; }
  function renderWikiDetail() {
    const { kind, id } = state.wikiDetail;
    let title = '詳細';
    let body = '';
    if (kind === 'skill') {
      const s = D.skills.find((x) => x.slug === id || x.name === id);
      if (!s) body = '<div class="empty-hint">找不到這項技能</div>';
      else {
        title = s.name;
        body = `<div class="sec-h" style="margin:8px 0">基本屬性</div>
          ${kv('技能名稱', escape(s.name))}
          ${kv('最大等級', s.maxLevel != null ? 'Lv ' + s.maxLevel : '未公開')}
          ${kv('來源', (s.sources || []).map((x) => x === 'armor' ? '防具' : x === 'set' ? '套裝' : x === 'weapon' ? '武器' : x).join('、') || '—')}
          <div class="sec-h" style="margin:12px 0 8px">技能說明</div>
          <div class="detail-block">${escape(s.effect || '（無說明）')}</div>
          <div class="sec-h" style="margin:8px 0">等級效果</div>
          <table class="lv-table">${(s.levels || []).map((l) => `<tr><td>Lv${l.level}</td><td>${escape(l.text)}</td></tr>`).join('') || '<tr><td></td><td>尚未收入分級效果</td></tr>'}</table>
          <div class="sec-h" style="margin:12px 0 8px">相關防具</div>
          ${D.armor.filter((a) => (a.skills || []).some((sk) => sk.name === s.name)).slice(0, 30).map((a) => {
            const lv = a.skills.find((sk) => sk.name === s.name).level;
            return `<button class="wiki-item" data-act="wiki-open" data-kind="armor" data-id="${escape(a.id)}"><span class="nm">${escape(a.name)}</span><span class="meta">${a.partLabel}　Lv${lv}</span></button>`;
          }).join('') || '<div class="empty-hint">沒有直接附帶此技能的防具</div>'}`;
      }
    } else if (kind === 'weapon') {
      const w = WEP_BY[id] || D.weapons.find((x) => x.name === id);
      if (!w) body = '<div class="empty-hint">找不到這把武器</div>';
      else {
        title = w.name;
        body = `<div class="sec-h" style="margin:8px 0">基本屬性</div>
          ${kv('武器名稱', escape(w.name))}
          ${kv('種類', escape(w.typeLabel))}
          ${kv('攻擊力', fmt(w.attack))}
          ${kv('會心率', fmt(w.critRate) + '%')}
          ${kv('屬性', w.element ? escape(w.element) + ' ' + fmt(w.elementValue) : '無')}
          ${kv('斬味', escape(w.sharpness || '—'))}
          ${kv('稀有度', (w.minRarity || '?') + '–' + (w.maxRarity || '?') + '（數值為最高稀有度）')}
          ${kv('武器技能', w.skill ? escape(w.skill.name) + ' Lv' + w.skill.level : '無')}
          <div class="hint">中段稀有度的數值未公開，這裡只列出最高稀有度。</div>`;
      }
    } else if (kind === 'armor') {
      const a = ARMOR_BY[id] || D.armor.find((x) => x.name === id);
      if (!a) body = '<div class="empty-hint">找不到這件防具</div>';
      else {
        title = a.name;
        body = `<div class="sec-h" style="margin:8px 0">基本屬性</div>
          ${kv('防具名稱', escape(a.name))}
          ${kv('部位', escape(a.partLabel))}
          ${kv('防禦力', fmt(a.defense) + '（最高稀有度）')}
          ${kv('套裝技能', a.setSkill ? escape(a.setSkill) : '無')}
          <div class="sec-h" style="margin:12px 0 8px">技能</div>
          ${(a.skills || []).map((s) => `<button class="wiki-item" data-act="wiki-open" data-kind="skill" data-id="${escape(s.name)}"><span class="nm">${escape(s.name)}</span><span class="meta">Lv${s.level}</span></button>`).join('') || '<div class="empty-hint">沒有技能</div>'}
          ${a.setSkill ? `<div class="sec-h" style="margin:12px 0 8px">套裝</div><button class="wiki-item" data-act="wiki-open" data-kind="set" data-id="${escape(a.setSkill)}"><span class="nm">${escape(a.setSkill)}</span></button>` : ''}`;
      }
    } else if (kind === 'set') {
      const s = SET_BY[id] || D.setSkills.find((x) => x.name === id);
      if (!s) body = '<div class="empty-hint">找不到這項套裝技能</div>';
      else {
        title = s.name;
        body = `<div class="sec-h" style="margin:8px 0">基本屬性</div>
          ${kv('套裝名稱', escape(s.name))}
          ${kv('發動件數', s.pieces != null ? s.pieces + ' 件' : '—')}
          ${kv('賦予技能', s.skill ? escape(s.skill) + (s.delta ? ' +' + s.delta : '') : '—')}
          <div class="sec-h" style="margin:12px 0 8px">效果</div>
          <div class="detail-block">${escape(s.effect || '')}${s.flavor ? '<br><span class="muted">' + escape(s.flavor) + '</span>' : ''}</div>
          <div class="sec-h" style="margin:8px 0">相關防具</div>
          ${D.armor.filter((a) => a.setSkill === s.name).map((a) =>
            `<button class="wiki-item" data-act="wiki-open" data-kind="armor" data-id="${escape(a.id)}"><span class="nm">${escape(a.name)}</span><span class="meta">${a.partLabel}</span></button>`
          ).join('')}`;
      }
    } else if (kind === 'visage') {
      const v = VIS_BY[id] || D.visages.find((x) => x.id === id || x.name === id);
      if (!v) body = '<div class="empty-hint">找不到這張繪影</div>';
      else {
        title = v.name;
        body = `<div class="sec-h" style="margin:8px 0">基本屬性</div>
          ${kv('繪影名稱', escape(v.name))}
          ${kv('費用', v.cost)}
          ${kv('影繪套裝', (v.sets || []).join('、') || '—')}
          <div class="sec-h" style="margin:12px 0 8px">核心效果</div>
          <div class="detail-block">${escape(v.main || '（此繪影沒有公開的核心效果文案）')}</div>
          <div class="hint">核心效果只在核心欄位發動。副屬性是隨機數值，未由使用者自填前不會列入戰鬥數值合計。費用上限 ${VISAGE_CAP}。</div>
          ${(v.sets || []).map((name) => {
            const def = VSET_BY[name];
            return `<div class="sec-h" style="margin:12px 0 8px">${escape(name)}</div><div class="detail-block">${(def && def.effects || []).map((e) => escape(e.pieces + ' 件：' + e.text)).join('<br>') || '—'}</div>`;
          }).join('')}`;
      }
    } else if (kind === 'insight') {
      const [aid, key] = String(id).split(':');
      const adv = ADV_BY[aid];
      const it = adv && adv.insights.find((x) => x.key === key);
      if (!it) body = '<div class="empty-hint">找不到這項心得</div>';
      else {
        title = it.name;
        body = `<div class="sec-h" style="margin:8px 0">基本屬性</div>
          ${kv('心得名稱', escape(it.name))}
          ${kv('冒險者', escape(adv.name))}
          ${kv('所需點數', it.points)}
          <div class="sec-h" style="margin:12px 0 8px">效果</div>
          <div class="detail-block">${escape(it.effect || '（此心得的詳細效果文案尚未收入）')}</div>
          <div class="hint">心得點數上限依玩家轉換的心得道具而定，沒有固定上限；在「搜索配裝」或「我的」填寫目前點數即可。</div>`;
      }
    }
    return renderChrome(title, body, actionBar(['back-wiki', '', '']));
  }

  function renderSaves() {
    return renderChrome('我的收藏', `
      <div class="card">
        <div class="sec-h" style="margin-bottom:10px">保存目前配裝</div>
        <div class="btn-row">
          <input class="field" style="flex:1" placeholder="幫這套取個名字" data-act="save-name" value="${escape(state.saveName)}">
          <button class="btn" data-act="save-now">保存</button>
        </div>
        <div class="btn-row">
          <button class="btn ghost" data-act="export">匯出 JSON</button>
          <button class="btn ghost" data-act="import">匯入 JSON</button>
        </div>
        <input type="file" accept="application/json,.json" data-act="import-file" hidden>
        <div class="note">資料只存在這台裝置的瀏覽器（localStorage），不會上傳。可匯出備份。</div>
      </div>
      <div class="sec-label">已存檔 ${state.saves.length} 套</div>
      ${state.saves.length ? state.saves.map((s, i) => `
        <div class="card">
          <h3>${escape(s.name)}</h3>
          <div class="muted">${escape(s.summary || '')}</div>
          <div class="btn-row">
            <button class="btn ghost" data-act="load-save" data-i="${i}">載入</button>
            <button class="btn ghost" data-act="cmp" data-i="${i}">比較</button>
            <button class="btn danger" data-act="del-save" data-i="${i}">刪除</button>
          </div>
        </div>`).join('') : '<div class="empty-hint">還沒有存檔。在配裝結果或編輯頁按「保存」，就會出現在這裡。</div>'}
      <div class="sec-label">並排比較</div>
      ${renderCompare()}
    `, '');
  }

  function renderCompare() {
    const [a, b] = state.compare;
    if (!a && !b) return '<div class="empty-hint">在存檔列按「比較」，選兩套配裝並排看技能與戰鬥數值。</div>';
    const A = a && compute(a.build);
    const B = b && compute(b.build);
    const names = new Set([...(A ? A.skills.map((s) => s.name) : []), ...(B ? B.skills.map((s) => s.name) : [])]);
    const CA = A && combatStats(A);
    const CB = B && combatStats(B);
    const cell = (tot, name) => {
      if (!tot) return '—';
      const s = tot.skills.find((x) => x.name === name);
      if (!s) return '—';
      return `${s.total}${s.over ? ' <span class="lv over">超</span>' : (s.maxed ? ' ✓' : '')}`;
    };
    const stat = (c, key) => c ? (key === 'aff' ? fmt(c.aff) + '%' : fmt(c[key])) : '—';
    return `<div class="compare">
      <div class="card"><h3>${a ? escape(a.name) : '（未選）'}</h3><div class="muted">${a ? escape(a.summary || '') : ''}</div></div>
      <div class="card"><h3>${b ? escape(b.name) : '（未選第二套）'}</h3><div class="muted">${b ? escape(b.summary || '') : ''}</div></div>
    </div>
    <div class="card" style="overflow:auto">
      <table>
        <tr><td>技能</td><td>${a ? escape(a.name) : 'A'}</td><td>${b ? escape(b.name) : 'B'}</td></tr>
        ${[...names].map((n) => `<tr><td>${escape(n)}</td><td>${cell(A, n)}</td><td>${cell(B, n)}</td></tr>`).join('')}
        <tr><td>攻擊力</td><td>${CA ? fmt(CA.atk) : '—'}</td><td>${CB ? fmt(CB.atk) : '—'}</td></tr>
        <tr><td>會心率</td><td>${CA ? fmt(CA.aff) + '%' : '—'}</td><td>${CB ? fmt(CB.aff) + '%' : '—'}</td></tr>
        <tr><td>防禦力</td><td>${CA ? fmt(CA.def) : '—'}</td><td>${CB ? fmt(CB.def) : '—'}</td></tr>
        <tr><td>體力加成</td><td>${CA && CA.hpBonus ? '+' + fmt(CA.hpBonus) : '—'}</td><td>${CB && CB.hpBonus ? '+' + fmt(CB.hpBonus) : '—'}</td></tr>
      </table>
    </div>`;
  }

  function renderMe() {
    return renderChrome('我的', `
      <div class="card">
        <h3>旅人配裝器</h3>
        <div class="muted">魔物獵人：旅人（Monster Hunter Outlanders）配裝工具。離線可用，資料只放在這台裝置，不需付費。</div>
      </div>
      <div class="sec-h" style="margin:12px 0 8px">資料來源</div>
      <div class="card">
        ${kv('來源', escape(D.source || 'GameWith 繁中 Wiki'))}
        ${kv('抓取日期', escape(D.fetchedAt || '—'))}
        ${kv('技能', D.skills.length + ' 項')}
        ${kv('防具', D.armor.length + ' 件')}
        ${kv('武器', D.weapons.length + ' 把')}
        ${kv('繪影', D.visages.length + ' 張')}
        ${kv('套裝技能', D.setSkills.length + ' 項')}
        ${kv('冒險者／心得', D.adventurers.length + ' 位')}
        <div class="note">防具與武器數值為最高稀有度。繪影副屬性為隨機數值，需自行填寫才列入合計。冒險者基礎體力、防禦、攻擊未公開，戰鬥數值只加總已公開的裝備與效果。傷害＋％不會換算進攻擊力。</div>
      </div>
      <div class="sec-h" style="margin:12px 0 8px">預設</div>
      <div class="card">
        <div class="btn-row">
          <label class="muted" style="flex:1">冒險者
            <select class="field" data-act="adventurer">${D.adventurers.map((a) =>
              `<option value="${escape(a.id)}" ${state.adventurerId === a.id ? 'selected' : ''}>${escape(a.name)}</option>`
            ).join('')}</select>
          </label>
          <label class="muted">目前心得點數
            <input class="field" type="number" min="0" step="1" value="${state.insightBudget}" data-act="budget" style="width:100px">
          </label>
        </div>
      </div>
      <div class="btn-row">
        <button class="btn ghost" data-act="export">匯出存檔</button>
        <button class="btn ghost" data-act="import">匯入存檔</button>
      </div>
      <input type="file" accept="application/json,.json" data-act="import-file" hidden>
    `, '');
  }

  function renderPicker() {
    const p = state.picker;
    if (!p) return '';
    let title = '選擇', body = '';
    if (p.kind === 'weapon') {
      title = '選擇武器';
      const q = (p.q || '').trim().toLowerCase();
      const list = D.weapons.filter((w) => w.typeLabel === state.weaponType && (!q || w.name.toLowerCase().includes(q) || (w.element || '').includes(p.q) || (w.skill && w.skill.name.includes(p.q))));
      body = `<input class="search" placeholder="搜尋武器、屬性、技能" data-act="pq" value="${escape(p.q || '')}">
        <div class="wtype-row" style="padding:0 14px">${WEAPON_TYPES.map((t) =>
          `<button class="chip${state.weaponType === t ? ' on' : ''}" data-act="wtype" data-type="${t}">${t}</button>`
        ).join('')}</div>
        <button class="pick" data-act="choose-weapon" data-slug=""><div class="nm">（不裝備）</div></button>
        ${list.map((w) => `<button class="pick${state.weapon === w.slug ? ' on' : ''}" data-act="choose-weapon" data-slug="${escape(w.slug)}">
          <div class="nm">${escape(w.name)}</div>
          <div class="tags">攻擊 ${w.attack}　會心 ${fmt(w.critRate)}%${w.element ? '　' + w.element + ' ' + (w.elementValue || '') : ''}${w.skill ? '　' + w.skill.name + ' Lv' + w.skill.level : ''}　R${w.maxRarity || ''}</div>
        </button>`).join('')}`;
    } else if (p.kind === 'armor') {
      title = '選擇防具・' + (p.part || '');
      const q = (p.q || '').trim();
      const skillF = p.skillF || '';
      const list = D.armor.filter((a) => a.partLabel === p.part && (!q || a.name.includes(q) || (a.setSkill || '').includes(q) || (a.skills || []).some((s) => s.name.includes(q))) && (!skillF || (a.skills || []).some((s) => s.name === skillF) || a.setSkill === skillF));
      const skillOpts = [...new Set(D.armor.filter((a) => a.partLabel === p.part).flatMap((a) => a.skills.map((s) => s.name)))].sort((a, b) => a.localeCompare(b, 'zh-Hant'));
      body = `<input class="search" placeholder="搜尋防具、系列、技能" data-act="pq" value="${escape(p.q || '')}">
        <div class="filters"><select data-act="p-skill"><option value="">全部技能</option>${skillOpts.map((n) =>
          `<option value="${escape(n)}" ${skillF === n ? 'selected' : ''}>${escape(n)}</option>`
        ).join('')}</select></div>
        <button class="pick" data-act="choose-armor" data-id=""><div class="nm">（不裝備）</div></button>
        ${list.map((a) => `<button class="pick${state.armor[p.part] === a.id ? ' on' : ''}" data-act="choose-armor" data-id="${escape(a.id)}">
          <div class="nm">${escape(a.name)}</div>
          <div class="tags">防禦 ${a.defense}${(a.skills || []).length ? '　' + a.skills.map((s) => s.name + ' ' + s.level).join('、') : ''}${a.setSkill ? '　' + a.setSkill : ''}</div>
        </button>`).join('')}`;
    } else if (p.kind === 'visage') {
      title = '選擇繪影';
      const q = (p.q || '').trim();
      const list = D.visages.filter((v) => !q || v.name.includes(q) || (v.main || '').includes(q) || (v.sets || []).some((s) => s.includes(q)));
      body = `<input class="search" placeholder="搜尋繪影、套裝、核心效果" data-act="pq" value="${escape(p.q || '')}">
        ${p.index != null ? `<button class="pick" data-act="choose-visage" data-id=""><div class="nm">移除這格繪影</div></button>` : ''}
        ${list.map((v) => `<button class="pick" data-act="choose-visage" data-id="${escape(v.id)}">
          <div class="nm">${escape(v.name)}　費用 ${v.cost}</div>
          <div class="tags">${(v.sets || []).join('、')}${v.main ? '　' + v.main : ''}</div>
        </button>`).join('')}`;
    } else if (p.kind === 'insight') {
      title = '選擇心得';
      const adv = ADV_BY[state.adventurerId];
      const q = (p.q || '').trim();
      const list = (adv && adv.insights || []).filter((it) => !q || it.name.includes(q) || (it.effect || '').includes(q));
      body = `<input class="search" placeholder="搜尋心得" data-act="pq" value="${escape(p.q || '')}">
        <div class="hint" style="padding:0 14px">已用 ${compute().insightUsed}／${state.insightBudget} 點。點一下選取或取消。</div>
        ${list.map((it) => {
          const on = state.insights.includes(it.key);
          return `<button class="pick${on ? ' on' : ''}" data-act="toggle-insight" data-key="${escape(it.key)}">
            <div class="nm">${escape(it.name)}　${it.points} 點${on ? '　已選' : ''}</div>
            <div class="tags">${escape(it.effect || '（效果文案尚未收入）')}</div>
          </button>`;
        }).join('')}`;
    } else if (p.kind === 'skill') {
      title = '選擇技能';
      const q = (p.q || '').trim();
      const have = new Set(state.searchTargets.map((t) => t.name));
      const list = D.skills.filter((s) => !q || s.name.includes(q) || (s.effect || '').includes(q));
      body = `<input class="search" placeholder="搜尋技能名稱" data-act="pq" value="${escape(p.q || '')}">
        ${list.map((s) => `<button class="pick${have.has(s.name) ? ' on' : ''}" data-act="add-skill" data-name="${escape(s.name)}">
          <div class="nm">${escape(s.name)}${s.maxLevel ? '　上限 ' + s.maxLevel : ''}</div>
          <div class="tags">${escape(s.effect || '')}</div>
        </button>`).join('')}`;
    }
    return `<div class="overlay" data-act="close-pick"><div class="sheet" data-act="sheet">
      <div class="sheet-h"><b>${escape(title)}</b><button class="x" data-act="close-pick">×</button></div>
      ${body}
    </div></div>`;
  }

  function render() {
    const root = document.getElementById('app');
    let html = '';
    if (state.tab === 'saves') html = renderSaves();
    else if (state.tab === 'wiki') html = (state.wikiCat || state.wikiDetail) ? (state.wikiDetail ? renderWikiDetail() : renderWikiList()) : (state.wikiQ ? renderChrome('遊戲百科', renderWikiHomeSearch() || '<div class="empty-hint">找點什麼..</div>', `<div class="search-dock"><div style="position:relative;flex:1"><input data-act="wiki-q" placeholder="找點什麼.." value="${escape(state.wikiQ || '')}"></div></div>`) : renderWiki());
    else if (state.tab === 'me') html = renderMe();
    else if (state.screen === 'skills') html = renderSkillPicker();
    else if (state.screen === 'results') html = renderResults();
    else if (state.screen === 'edit') html = renderEdit();
    else html = renderSearchScreen();
    root.innerHTML = html;
  }

  /* ---------- auto search ---------- */
  function scoreArmor(a, want) {
    let s = 0;
    for (const sk of a.skills) if (want.has(sk.name)) s += sk.level * 10;
    const st = a.setSkill && SET_BY[a.setSkill];
    if (st && st.skill && want.has(st.skill)) s += 6;
    return s;
  }

  function suggestedVisageSets(targets) {
    const names = new Set(targets.map((t) => t.name));
    const out = [];
    if ([...names].some((n) => n.includes('火屬性傷害'))) out.push('影繪之灼焰');
    if ([...names].some((n) => n.includes('水屬性傷害'))) out.push('影繪之水御');
    if ([...names].some((n) => n.includes('冰屬性傷害'))) out.push('影繪之冰霜');
    if ([...names].some((n) => n.includes('雷屬性傷害'))) out.push('影繪之湧雷');
    if ([...names].some((n) => n.includes('龍屬性傷害'))) out.push('影繪之破龍');
    if ([...names].some((n) => /看破|會心/.test(n))) out.push('影繪之武技');
    return out;
  }

  function fillVisagesFor(targets) {
    const sets = suggestedVisageSets(targets);
    const picked = [];
    let cost = 0;
    const w = state.weapon && WEP_BY[state.weapon];
    const elem = w && w.element;
    function add(v, core) {
      if (!v || picked.some((p) => p.id === v.id)) return false;
      if (cost + v.cost > VISAGE_CAP) return false;
      picked.push({ id: v.id, core: !!core });
      cost += v.cost;
      return true;
    }
    for (const setName of sets) {
      const cands = D.visages.filter((v) => (v.sets || []).includes(setName));
      const coreCand = elem && cands.find((v) => (v.main || '').includes('使用' + elem + '屬性武器'));
      if (coreCand) add(coreCand, !picked.some((p) => p.core));
      const cheap = cands.filter((v) => !coreCand || v.id !== coreCand.id).sort((a, b) => a.cost - b.cost);
      for (const v of cheap) {
        const n = picked.filter((p) => (VIS_BY[p.id].sets || []).includes(setName)).length;
        if (n >= 2) break;
        add(v, false);
      }
    }
    if (picked.length && !picked.some((p) => p.core)) picked[0].core = true;
    state.visages = picked;
    state.visSubs = {};
    state.showSubs = {};
  }

  function fillInsights() {
    if (state.insights.length) return;
    const adv = ADV_BY[state.adventurerId];
    if (!adv) return;
    let used = 0;
    const budget = state.insightBudget || 0;
    for (const name of ['戰意', '蓄勢', '護體', '和諧']) {
      const it = adv.insights.find((x) => x.name === name);
      if (it && used + it.points <= budget) { state.insights.push(it.key); used += it.points; }
    }
  }

  function runSearch() {
    const targets = state.searchTargets.filter((t) => t.name && t.level > 0);
    if (!targets.length) {
      state.altResults = [];
      state.searchInfo = '請先選擇要發動的技能。';
      state.searchNote = '';
      state.searchMs = 0;
      return;
    }
    const wantNames = new Set(targets.map((t) => t.name));
    const usefulSets = new Set(D.setSkills.filter((s) => s.skill && wantNames.has(s.skill)).map((s) => s.name));
    const lists = PARTS.map((p) => {
      if (state.locked[p]) {
        const id = state.armor[p];
        return [id ? (ARMOR_BY[id] || null) : null];
      }
      const arr = D.armor.filter((a) => a.partLabel === p && (
        a.skills.some((s) => wantNames.has(s.name)) || (a.setSkill && usefulSets.has(a.setSkill))
      ));
      arr.sort((a, b) => scoreArmor(b, wantNames) - scoreArmor(a, wantNames));
      arr.push(null);
      return arr;
    });

    const nT = targets.length;
    const need = targets.map((t) => t.level);
    const cap = targets.map((t) => {
      const c = (SKILL_BY[t.name] || {}).maxLevel;
      return c == null ? 99 : c;
    });
    function pack(a) {
      const v = new Array(nT).fill(0);
      if (!a) return { v, set: null, def: 0, id: null };
      for (let i = 0; i < nT; i++) {
        for (const sk of a.skills) if (sk.name === targets[i].name) v[i] += sk.level;
      }
      return { v, set: a.setSkill || null, def: a.defense || 0, id: a.id };
    }
    const packed = lists.map((list) => list.map(pack));
    const setInfo = {};
    for (const st of D.setSkills) {
      const i = targets.findIndex((t) => t.name === st.skill);
      if (i >= 0 && st.delta) setInfo[st.name] = { i, delta: st.delta, need: st.pieces };
    }
    const maxSlot = packed.map((list) => {
      const m = new Array(nT).fill(0);
      const sets = new Set();
      for (const p of list) {
        for (let i = 0; i < nT; i++) if (p.v[i] > m[i]) m[i] = p.v[i];
        if (p.set && setInfo[p.set]) sets.add(p.set);
      }
      return { m, sets };
    });

    function canBound(from, cur, setCnt) {
      for (let i = 0; i < nT; i++) {
        let mx = cur[i];
        for (let s = from; s < 5; s++) mx += maxSlot[s].m[i];
        for (const [name, info] of Object.entries(setInfo)) {
          if (info.i !== i) continue;
          const have = setCnt[name] || 0;
          if (have >= info.need) { mx += info.delta; continue; }
          let poss = have;
          for (let s = from; s < 5; s++) if (maxSlot[s].sets.has(name)) poss++;
          if (poss >= info.need) mx += info.delta;
        }
        if (mx < need[i]) return false;
      }
      return true;
    }

    const best = [];
    const t0 = (typeof performance !== 'undefined' && performance.now()) || Date.now();
    const LIMIT = 1200;
    let visited = 0, timedOut = false;
    const path = new Array(5);

    function consider(cur, setCnt, def, empty) {
      const tot = cur.slice();
      const sets = [];
      for (const [name, info] of Object.entries(setInfo)) {
        if ((setCnt[name] || 0) >= info.need) { tot[info.i] += info.delta; sets.push(name); }
      }
      let shortfall = 0, waste = 0;
      const labels = [];
      for (let i = 0; i < nT; i++) {
        if (tot[i] < need[i]) shortfall += need[i] - tot[i];
        if (tot[i] > cap[i]) waste += tot[i] - cap[i];
        labels.push(targets[i].name.replace('屬性傷害提升', '').replace('強化', '') + tot[i]);
      }
      const rec = {
        armor: {},
        shortfall, waste, defense: def, empty, sets, labels,
        score: shortfall * 10000 + waste * 100 - def + empty * 3,
      };
      PARTS.forEach((p, i) => { rec.armor[p] = path[i] && path[i].id; });
      if (best.length < 8) { best.push(rec); best.sort((a, b) => a.score - b.score); }
      else if (rec.score < best[best.length - 1].score) {
        best[best.length - 1] = rec; best.sort((a, b) => a.score - b.score);
      }
    }

    function dfs(slot, cur, setCnt, def, empty) {
      if (timedOut) return;
      if ((++visited & 2047) === 0) {
        const now = (typeof performance !== 'undefined' && performance.now()) || Date.now();
        if (now - t0 > LIMIT) { timedOut = true; return; }
      }
      if (slot === 5) { consider(cur, setCnt, def, empty); return; }
      if (!canBound(slot, cur, setCnt)) return;
      const list = packed[slot];
      for (let i = 0; i < list.length; i++) {
        const p = list[i];
        path[slot] = p;
        const nxt = cur.slice();
        for (let k = 0; k < nT; k++) nxt[k] += p.v[k];
        const ns = Object.assign({}, setCnt);
        if (p.set) ns[p.set] = (ns[p.set] || 0) + 1;
        dfs(slot + 1, nxt, ns, def + p.def, empty + (p.id ? 0 : 1));
        if (timedOut) return;
      }
    }

    dfs(0, new Array(nT).fill(0), {}, 0, 0);
    const elapsed = Math.max(0, ((((typeof performance !== 'undefined' && performance.now()) || Date.now()) - t0) / 1000));
    state.searchMs = elapsed;
    state.altResults = best;
    const meet = best.filter((r) => r.shortfall === 0).length;
    const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const ss = String(Math.floor(elapsed % 60)).padStart(2, '0');
    const cs = String(Math.floor((elapsed % 1) * 100)).padStart(2, '0');
    state.searchInfo = `搜尋結束。找到結果: ${best.length} 個, 搜尋時間: ${mm}:${ss}.${cs} 秒`;
    state.searchNote = meet
      ? `其中 ${meet} 套達成目標${timedOut ? '；搜尋時間到後停止，已保留當下最佳。' : '。只搜尋對目標技能有貢獻的防具（固定裝備除外），並用分支界限剪掉不可能的組合。'}`
      : (best.length ? `沒有完全達標的組合，已列出最接近的 ${best.length} 套。` : '找不到可用組合。');
    if (best.length) applyAlt(0);
  }

  function applyAlt(i) {
    const r = state.altResults[i];
    if (!r) return;
    state.altIndex = i;
    state.armor = { ...r.armor };
    fillVisagesFor(state.searchTargets);
    fillInsights();
  }

  /* ---------- events ---------- */

  function refetchSearchFocus() {
    return document.querySelector('.search, [data-act="skill-q"], [data-act="wiki-q"]');
  }
  function restoreFocus(sel, pos) {
    const n = document.querySelector(sel);
    if (n) { n.focus(); if (pos != null && n.setSelectionRange) n.setSelectionRange(pos, pos); }
  }
  function setTargetLevel(name, level) {
    const cap = (SKILL_BY[name] || {}).maxLevel || 99;
    const lv = Math.max(0, Math.min(cap, level));
    const i = state.searchTargets.findIndex((t) => t.name === name);
    if (lv <= 0) {
      if (i >= 0) state.searchTargets.splice(i, 1);
      return;
    }
    if (i >= 0) state.searchTargets[i].level = lv;
    else state.searchTargets.push({ name, level: lv });
  }
  function sortResults() {
    const key = state.sortKey;
    const list = state.altResults;
    if (!list.length) return;
    const cur = list[state.altIndex];
    if (key === 'defense') list.sort((a, b) => (b.defense || 0) - (a.defense || 0) || (a.shortfall - b.shortfall) || (a.waste - b.waste));
    else if (key === 'waste') list.sort((a, b) => (a.waste - b.waste) || (a.shortfall - b.shortfall) || (b.defense - a.defense));
    else list.sort((a, b) => a.score - b.score);
    if (cur) {
      const i = list.indexOf(cur);
      if (i >= 0) { state.altIndex = i; }
    }
  }

  function onClick(e) {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act;
    if (act === 'sheet' || act === 'noop' || act === 'set-tgt-wrap') { e.stopPropagation(); return; }
    if (act === 'menu') { state.menuOpen = !state.menuOpen; render(); return; }
    if (act === 'close-menu') { state.menuOpen = false; render(); return; }
    if (act === 'star') {
      const name = (state.saveName || '').trim() || ('配裝 ' + (state.saves.length + 1));
      const tot = compute();
      const summary = [(WEP_BY[state.weapon] || {}).name, ...PARTS.map((p) => (ARMOR_BY[state.armor[p]] || {}).name)].filter(Boolean).join('／');
      state.saves.unshift({ id: Date.now().toString(36), name, at: new Date().toISOString(), summary, build: snapshot() });
      persistSaves(); state.saveName = '';
      toastLater('已加入收藏');
      render(); return;
    }
    if (act === 'tab') {
      state.tab = t.dataset.tab; state.picker = null; state.menuOpen = false;
      if (state.tab === 'wiki') { /* keep wiki state */ }
      if (state.tab === 'build' && !state.screen) state.screen = 'search';
      render(); return;
    }
    if (act === 'go-screen') {
      const sc = t.dataset.screen;
      if (t.dataset.i != null && t.dataset.i !== '') applyAlt(Number(t.dataset.i));
      if (sc === 'results' && !state.altResults.length && !state.searchInfo) {
        toastLater('請先搜索配裝');
        state.screen = 'search'; render(); return;
      }
      state.screen = sc; state.picker = null; state.skillTip = null;
      if (sc === 'edit' && state.altIndex < 0 && state.altResults.length) applyAlt(0);
      render();
      if (sc === 'skills') restoreFocus('[data-act="skill-q"]');
      return;
    }
    if (act === 'collapse') {
      const k = t.dataset.k;
      state.collapsed[k] = !state.collapsed[k];
      render(); return;
    }
    if (act === 'weapon-mode') { state.weaponMode = t.dataset.mode; render(); return; }
    if (act === 'pick-tpl') { state.weapon = t.dataset.slug; state.locked.weapon = true; render(); return; }
    if (act === 'wtype') { state.weaponType = t.dataset.type; render(); return; }
    if (act === 'pick') {
      state.picker = { kind: t.dataset.kind, part: t.dataset.part, index: t.dataset.index != null && t.dataset.index !== '' ? Number(t.dataset.index) : null, q: '', skillF: '', lock: t.dataset.lock === '1' };
      render();
      const inp = refetchSearchFocus();
      if (inp) inp.focus();
      return;
    }
    if (act === 'close-pick') { state.picker = null; render(); return; }
    if (act === 'choose-weapon') {
      state.weapon = t.dataset.slug || null;
      if (state.picker && state.picker.lock) state.locked.weapon = !!state.weapon;
      state.picker = null; render(); return;
    }
    if (act === 'choose-armor') {
      const part = state.picker && state.picker.part;
      if (part) state.armor[part] = t.dataset.id || null;
      if (part && state.picker && state.picker.lock) state.locked[part] = !!state.armor[part];
      state.picker = null; render(); return;
    }
    if (act === 'add-visage') { state.picker = { kind: 'visage', index: null, q: '' }; render(); return; }
    if (act === 'choose-visage') {
      const id = t.dataset.id;
      const idx = state.picker.index;
      if (!id) {
        if (idx != null) { state.visages.splice(idx, 1); delete state.visSubs[idx]; }
      } else if (idx != null) {
        const keepCore = state.visages[idx] && state.visages[idx].core;
        state.visages[idx] = { id, core: keepCore || !state.visages.some((v) => v.core) };
      } else {
        const core = state.visages.length === 0 || !state.visages.some((v) => v.core);
        state.visages.push({ id, core });
      }
      state.picker = null; render(); return;
    }
    if (act === 'toggle-insight') {
      const k = t.dataset.key;
      const i = state.insights.indexOf(k);
      if (i >= 0) state.insights.splice(i, 1);
      else state.insights.push(k);
      render(); return;
    }
    if (act === 'add-skill') {
      const name = t.dataset.name;
      if (!state.searchTargets.some((x) => x.name === name)) {
        const cap = (SKILL_BY[name] || {}).maxLevel || 1;
        state.searchTargets.push({ name, level: cap });
      }
      state.picker = null; render(); return;
    }
    if (act === 'skill-toggle') {
      const name = t.dataset.name;
      const have = state.searchTargets.find((x) => x.name === name);
      if (have) state.searchTargets = state.searchTargets.filter((x) => x.name !== name);
      else {
        const cap = (SKILL_BY[name] || {}).maxLevel || 1;
        state.searchTargets.push({ name, level: cap });
      }
      render(); return;
    }
    if (act === 'skill-seg') {
      const name = t.dataset.name || (t.closest('[data-name]') && t.closest('[data-name]').dataset.name);
      const lv = Number(t.dataset.lv);
      if (!name || !lv) return;
      const cur = state.searchTargets.find((x) => x.name === name);
      if (cur && cur.level === lv && lv === 1) setTargetLevel(name, 0);
      else setTargetLevel(name, lv);
      render(); return;
    }
    if (act === 'skill-tip') {
      state.skillTip = state.skillTip === t.dataset.name ? null : t.dataset.name;
      render(); return;
    }
    if (act === 'skill-q-clear') { state.skillQ = ''; render(); restoreFocus('[data-act="skill-q"]'); return; }
    if (act === 'tgt-del') { state.searchTargets.splice(Number(t.dataset.i), 1); render(); return; }
    if (act === 'tgt-inc' || act === 'tgt-dec') {
      const rec = state.searchTargets[Number(t.dataset.i)];
      const cap = (SKILL_BY[rec.name] || {}).maxLevel || 99;
      rec.level = act === 'tgt-inc' ? Math.min(cap, rec.level + 1) : Math.max(1, rec.level - 1);
      render(); return;
    }
    if (act === 'toggle-skill') {
      if (t.dataset.i != null && t.dataset.i !== '') applyAlt(Number(t.dataset.i));
      state.openSkill = state.openSkill === t.dataset.name ? null : t.dataset.name;
      render(); return;
    }
    if (act === 'run-search' || act === 'auto-build') {
      if (state.searchBusy) return;
      if (!state.searchTargets.filter((x) => x.name && x.level > 0).length) {
        toastLater('請先選擇要發動的技能');
        state.screen = 'skills'; render(); return;
      }
      state.searchBusy = true; state.searchInfo = '搜尋中…'; state.screen = 'results'; render();
      setTimeout(() => {
        runSearch();
        state.searchBusy = false;
        state.screen = 'results';
        render();
      }, 20);
      return;
    }
    if (act === 'alt' || act === 'use-alt') { applyAlt(Number(t.dataset.i)); render(); return; }
    if (act === 'sort-results') {
      const order = ['score', 'defense', 'waste'];
      state.sortKey = order[(order.indexOf(state.sortKey) + 1) % order.length];
      sortResults();
      const label = { score: '達標優先', defense: '防禦高→低', waste: '浪費少→多' }[state.sortKey];
      toastLater('排序：' + label);
      render(); return;
    }
    if (act === 'toggle-stats') {
      const i = Number(t.dataset.i);
      applyAlt(i);
      state.openStats = state.openStats === i ? null : i;
      render(); return;
    }
    if (act === 'pin-slot') {
      const i = Number(t.dataset.i);
      if (!Number.isNaN(i)) applyAlt(i);
      const part = t.dataset.part;
      if (part === 'weapon') state.locked.weapon = !!state.weapon;
      else if (part) state.locked[part] = !!state.armor[part];
      toastLater('已固定此部位，下次搜索不會改動');
      render(); return;
    }
    if (act === 'rm-slot') {
      const i = Number(t.dataset.i);
      if (!Number.isNaN(i)) applyAlt(i);
      const part = t.dataset.part;
      if (part === 'weapon') { state.weapon = null; state.locked.weapon = false; }
      else if (part) { state.armor[part] = null; state.locked[part] = false; }
      render(); return;
    }
    if (act === 'toggle-subs') {
      const i = Number(t.dataset.i);
      state.showSubs[i] = !state.showSubs[i];
      render(); return;
    }
    if (act === 'share') {
      if (t.dataset.i != null && t.dataset.i !== '') applyAlt(Number(t.dataset.i));
      const text = shareText();
      const done = () => { toastLater('已複製配裝文字'); render(); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => {
          const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); } catch (err) {}
          ta.remove(); done();
        });
      } else {
        const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (err) {}
        ta.remove(); done();
      }
      if (navigator.share) { try { navigator.share({ title: '旅人配裝器', text }); } catch (err) {} }
      return;
    }
    if (act === 'save-now') {
      if (t.dataset.i != null && t.dataset.i !== '') applyAlt(Number(t.dataset.i));
      const name = (state.saveName || '').trim() || ('配裝 ' + (state.saves.length + 1));
      const tot = compute();
      const summary = [(WEP_BY[state.weapon] || {}).name, ...PARTS.map((p) => (ARMOR_BY[state.armor[p]] || {}).name)].filter(Boolean).join('／');
      state.saves.unshift({ id: Date.now().toString(36), name, at: new Date().toISOString(), summary, build: snapshot() });
      persistSaves(); state.saveName = '';
      toastLater('已保存到收藏');
      render(); return;
    }
    if (act === 'load-save') {
      applySnap(state.saves[Number(t.dataset.i)].build);
      state.tab = 'build'; state.screen = 'edit'; state.picker = null;
      render(); return;
    }
    if (act === 'del-save') { state.saves.splice(Number(t.dataset.i), 1); persistSaves(); render(); return; }
    if (act === 'cmp') {
      const s = state.saves[Number(t.dataset.i)];
      if (!state.compare[0] || (state.compare[0] && state.compare[1])) state.compare = [s, null];
      else state.compare[1] = s;
      render(); return;
    }
    if (act === 'export') {
      const blob = new Blob([JSON.stringify({ app: 'mho-planner', version: 2, saves: state.saves }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'mho-planner-backup.json'; a.click();
      URL.revokeObjectURL(a.href); return;
    }
    if (act === 'import') { document.querySelector('[data-act="import-file"]').click(); return; }
    if (act === 'wiki-cat') { state.wikiCat = t.dataset.cat; state.wikiDetail = null; render(); restoreFocus('[data-act="wiki-q"]'); return; }
    if (act === 'wiki-back') {
      if (state.wikiDetail) state.wikiDetail = null;
      else { state.wikiCat = null; }
      render(); return;
    }
    if (act === 'wiki-open') {
      state.wikiDetail = { kind: t.dataset.kind, id: t.dataset.id };
      state.tab = 'wiki';
      render(); return;
    }
  }

  document.addEventListener('click', onClick);
  document.addEventListener('input', (e) => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    if (t.dataset.act === 'pq') {
      state.picker.q = t.value;
      clearTimeout(onChange._t);
      onChange._t = setTimeout(() => {
        const pos = t.selectionStart;
        render();
        restoreFocus('.search', pos);
      }, 80);
    }
    if (t.dataset.act === 'skill-q') {
      state.skillQ = t.value;
      clearTimeout(onChange._sq);
      onChange._sq = setTimeout(() => {
        const pos = t.selectionStart;
        render();
        restoreFocus('[data-act="skill-q"]', pos);
      }, 80);
    }
    if (t.dataset.act === 'wiki-q') {
      state.wikiQ = t.value;
      clearTimeout(onChange._wq);
      onChange._wq = setTimeout(() => {
        const pos = t.selectionStart;
        render();
        restoreFocus('[data-act="wiki-q"]', pos);
      }, 80);
    }
    if (t.dataset.act === 'substat') {
      const i = Number(t.dataset.i);
      if (!state.visSubs[i]) state.visSubs[i] = {};
      state.visSubs[i][t.dataset.key] = t.value;
    }
    if (t.dataset.act === 'budget') state.insightBudget = Math.max(0, Number(t.value) || 0);
    if (t.dataset.act === 'save-name') state.saveName = t.value;
  });
  function onChange(e) {
    const t = e.target.closest && e.target.closest('[data-act]');
    if (!t) return;
    if (t.dataset.act === 'p-skill') { state.picker.skillF = t.value; render(); return; }
    if (t.dataset.act === 'adventurer') { state.adventurerId = t.value; state.insights = []; render(); return; }
    if (t.dataset.act === 'budget') { state.insightBudget = Math.max(0, Number(t.value) || 0); return; }
    if (t.dataset.act === 'import-file' && t.files && t.files[0]) {
      const f = t.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          const list = Array.isArray(data) ? data : (data.saves || []);
          if (!Array.isArray(list)) throw new Error('bad');
          state.saves = list.concat(state.saves);
          persistSaves();
          toastLater('已匯入 ' + list.length + ' 套');
          render();
        } catch (err) { toastLater('匯入失敗，請確認是本工具匯出的 JSON'); render(); }
      };
      reader.readAsText(f);
      t.value = '';
    }
  }
  document.addEventListener('change', onChange);
  document.addEventListener('focusout', (e) => {
    const t = e.target && e.target.closest && e.target.closest('[data-act="substat"]');
    if (t) render();
  });

  function findW(name) { return (D.weapons.find((w) => w.name === name) || {}).slug; }

  // Optional demo hook used for verification: ?demo=fire7hb2
  function maybeDemo() {
    const q = new URLSearchParams(location.search);
    if (q.get('demo') !== 'fire7hb2') return false;
    state.weaponType = '太刀';
    state.weapon = findW('融光・飛龍刀【朱】') || findW('飛龍刀【朱】');
    state.searchTargets = [
      { name: '火屬性傷害提升', level: 7 },
      { name: '體力強化', level: 2 },
    ];
    state.adventurerId = '2';
    state.insightBudget = 30;
    runSearch();
    state.screen = 'results';
    return true;
  }

  function maybeScreen() {
    const q = new URLSearchParams(location.search);
    if (q.get('shot') === '1') document.documentElement.classList.add('shot');
    const tip = q.get('tip');
    if (tip) state.skillTip = tip;
    if (q.get('open')) state.openSkill = q.get('open');
    if (q.get('stats') === '1') state.openStats = 0;
    if (q.get('cards')) state.resultLimit = Math.max(1, Number(q.get('cards')) || 1);
    else state.resultLimit = 0;
    if (q.get('bare') === '1') {
      state.armor = { 頭部: null, 胸部: null, 腕部: null, 腰部: null, 腿部: null };
      state.visages = []; state.insights = []; state.visSubs = {};
      state.altResults = []; state.altIndex = -1;
    }
    const sc = q.get('screen');
    if (!sc) return;
    if (sc === 'search') { state.tab = 'build'; state.screen = 'search'; }
    if (sc === 'skills') { state.tab = 'build'; state.screen = 'skills'; }
    if (sc === 'results') { state.tab = 'build'; state.screen = 'results'; }
    if (sc === 'edit') { state.tab = 'build'; state.screen = 'edit'; }
    if (sc === 'wiki') { state.tab = 'wiki'; state.wikiCat = null; state.wikiDetail = null; }
    if (sc === 'wiki-list') { state.tab = 'wiki'; state.wikiCat = q.get('cat') || 'skills'; state.wikiDetail = null; }
    if (sc === 'wiki-detail') {
      state.tab = 'wiki';
      state.wikiDetail = { kind: q.get('kind') || 'skill', id: q.get('id') || '火屬性傷害提升' };
    }
    if (sc === 'saves') state.tab = 'saves';
    if (sc === 'me') state.tab = 'me';
  }
  maybeDemo();
  maybeScreen();
  render();
  try { if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js'); } catch (e) {}
})();
