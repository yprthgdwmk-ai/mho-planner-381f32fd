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

  // Weapon-specific or weapon-mechanic attack skills (GameWith official text).
  // Hidden from the target picker only; still listed in result breakdowns.
  const PICKER_HIDE = new Set([
    '拔刀一閃',   // 武器拔刀攻擊後
    '剛勢',       // 觸發剛猛後
    '練氣纏刃',   // 練氣計量表（太刀）
    '鬼人修羅',   // 鬼人化（雙劍）
    '一擊洞穿',   // 貫通攻擊
    '蓄勢強射',   // 遠程武器蓄力
    '裝填強化',   // 裝填彈藥
    '破擊',       // 使用大劍
    '貫突',       // 使用長槍
    '震懾',       // 使用打擊類武器
    '弩彈強化',   // 弩槍彈藥
    '變形強化',   // 武器變形
    '弓招式強化', // 弓的招式
    '彈道強化',   // 彈藥、箭矢
  ]);

  // General attack-oriented mains (not tied to one weapon). Target is always max level.
  // GameWith has no skill named 氣力強化; 氣力轉化 is the official name.
  const ATK_MAIN = new Set([
    '氣力轉化', '連擊強化', '應對強化', '蓄力強化', '騰空',
    '無瑕', '無懼', '痛點追擊', '窮追猛打',
    '精神抖擻', '寓攻於守', '融光感應', '愛吃便當', '獵手直覺', '不屈',
  ]);

  function isAtkMain(name) { return ATK_MAIN.has(name); }
  function atkMainCap(name) {
    const cap = (SKILL_BY[name] || {}).maxLevel;
    return cap != null ? cap : null;
  }
  function normalizeTargets() {
    for (const t of state.searchTargets) {
      if (!isAtkMain(t.name)) continue;
      const cap = atkMainCap(t.name);
      if (cap != null) t.level = cap;
    }
  }

  function catOf(name) {
    if (/火屬性|火耐性/.test(name)) return 'fire';
    if (/水屬性|水耐性|泥耐性/.test(name)) return 'water';
    if (/雷屬性|雷耐性/.test(name)) return 'thunder';
    if (/冰屬性|冰耐性/.test(name)) return 'ice';
    if (/龍屬性|龍耐性/.test(name)) return 'dragon';
    if (/體力|回復|血氣|超回復|復甦/.test(name)) return 'hp';
    if (/看破|會心|弱點|潛能|鬥志/.test(name)) return 'crit';
    if (/加護|防護|防禦|耐性|風壓|震動|咆哮|屏障/.test(name)) return 'def';
    if (ATK_MAIN.has(name) || PICKER_HIDE.has(name)) return 'atk';
    if (/傷害|攻擊|連擊|應對|練氣|蓄力|拔刀|破擊|貫突|剛勢|氣力|裝填|騰空|窮追|痛點|無瑕|無懼/.test(name)) return 'atk';
    if (/專家|獵人|採集|剝取|捕獲|標本|植物|地質|蜂蜜|節約|快吃|道具|攀爬|威嚇/.test(name)) return 'res';
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

  const CAT_LABEL = { atk: '攻擊向', crit: '會心向', fire: '火屬性', water: '水屬性', thunder: '雷屬性', ice: '冰屬性', dragon: '龍屬性', def: '防禦向', hp: '體力／回復', res: '達人／生活', misc: '其他' };
  const CAT_ORDER = ['atk', 'crit', 'fire', 'water', 'thunder', 'ice', 'dragon', 'def', 'hp', 'res', 'misc'];

  function skillDesc(name) {
    const info = SKILL_BY[name];
    if (!info) return '';
    if (info.effect && String(info.effect).trim()) return String(info.effect).trim();
    if (info.levels && info.levels.length === 1 && info.levels[0].text) return info.levels[0].text;
    if (info.levels && info.levels[0] && info.levels[0].text) return '效果依等級而異。（Lv1：' + info.levels[0].text + '）';
    return '';
  }

  const state = {
    tab: 'build',
    weaponType: '',
    confirmOpen: false,
    weapon: null,
    armor: { 頭部: null, 胸部: null, 腕部: null, 腰部: null, 腿部: null },
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
    state.weapon = s.weapon || null;
    state.weaponType = (s.weaponType != null && s.weaponType !== '') ? s.weaponType : ((WEP_BY[state.weapon] || {}).typeLabel || '');
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

  function renderBuild() {
    const tot = compute();
    const w = tot.weapon;
    return `
      <div class="page" data-page="build">
        <div class="step">
          <div class="sec-h"><span class="step-n">1</span>預定技能</div>
          ${state.searchTargets.map((t, i) => {
            const desc = skillDesc(t.name);
            const lvFx = skillLevelText(t.name, t.level);
            const miss = !desc && !lvFx;
            const atk = isAtkMain(t.name);
            const lvLabel = atk ? ('Lv最高 ' + t.level) : ('Lv' + t.level);
            return `<div class="goal sel-skill">
              <div class="goal-top">
                ${icon(catOf(t.name))}
                <span class="skill-name">${escape(t.name)}</span>
                <span class="sel-lvchip">${lvLabel}</span>
                ${atk ? '' : `<div class="stepper">
                  <button type="button" data-act="tgt-dec" data-i="${i}">−</button>
                  <span style="min-width:1.6em;text-align:center;font-weight:700">${t.level}</span>
                  <button type="button" data-act="tgt-inc" data-i="${i}">+</button>
                </div>`}
                <button type="button" class="clear-btn" data-act="tgt-del" data-i="${i}">刪</button>
              </div>
              <div style="margin:4px 0 0 30px">${targetPips(t.name, t.level)}</div>
              ${desc ? `<div class="sel-desc">${escape(desc)}</div>` : ''}
              ${lvFx ? `<div class="sel-lvfx">目標 ${atk ? '最高 ' : ''}Lv${t.level}：${escape(lvFx)}</div>` : ''}
              ${miss ? `<div class="sel-desc">此技能的詳細效果文案尚未收入公開資料。</div>` : ''}
              ${goalStatus(tot, t)}
            </div>`;
          }).join('')}
          <button class="btn ghost" data-act="pick" data-kind="skill">＋ 新增技能</button>
          ${state.searchTargets.length ? '' : '<div class="empty-hint">先選要湊的技能和目標等級，再按「自動找配裝」。不必先選武器。</div>'}

          <div class="sec-h" style="margin-top:14px">武器種類（可不選）</div>
          <div class="weapon-types">
            <button class="chip${state.weaponType === '' ? ' on' : ''}" data-act="wtype" data-type="">不限</button>
            ${WEAPON_TYPES.map((t) =>
              `<button class="chip${state.weaponType === t ? ' on' : ''}" data-act="wtype" data-type="${t}">${t}</button>`
            ).join('')}
          </div>
          <div class="muted" style="margin:4px 0 8px">預設不限種類，搜尋時會一併挑選武器與五件防具。也可事後再改武器。</div>
          <div class="btn-row">
            <button class="btn" data-act="auto-build">${state.searchBusy ? '搜尋中…' : '自動找配裝'}</button>
          </div>
        </div>

        <div class="step" data-step="results">
          <div class="sec-h"><span class="step-n">2</span>配裝結果 <span class="sub">防禦合計 ${tot.defense || '—'}</span></div>
          ${state.searchInfo ? `<div class="muted" style="margin:6px 0">${escape(state.searchInfo)}</div>` : ''}
          ${state.altResults.length ? `<div class="alts">${state.altResults.map((r, i) => `
            <button class="alt${state.altIndex === i ? ' on' : ''}" data-act="alt" data-i="${i}">
              <b>方案 ${i + 1}${r.shortfall ? '' : ' ✓'}</b>
              ${r.labels.join('　')}${r.weaponName ? `<div class="muted">${escape(r.weaponName)}</div>` : ''}
              ${r.shortfall ? `<div class="err">還差 ${r.shortfall} 點</div>` : ''}
              ${r.waste ? `<div class="err">溢出 ${r.waste}</div>` : ''}
            </button>`).join('')}</div>` : (!state.searchInfo ? '<div class="empty-hint">選好預定技能後按「自動找配裝」，確認後就會開始搜尋。</div>' : '')}

          <button class="slot" data-act="pick" data-kind="weapon">
            <span class="part">武</span>
            <span class="meta">
              <div class="name${w ? '' : ' empty'}">${w ? escape(w.name) : '尚未選擇武器'}</div>
              <div class="tags">${w ? `${escape(w.typeLabel)}　攻擊 ${w.attack}　會心 ${fmt(w.critRate)}%${w.element ? '　' + w.element + ' ' + (w.elementValue || '') : ''}${w.skill ? '　' + w.skill.name + ' Lv' + w.skill.level : ''}` : '可由自動找配裝帶入，或點此自選'}</div>
            </span>
            ${w ? `<span class="${rarityClass(w.maxRarity)}">R${w.maxRarity}</span>` : ''}
          </button>

          ${PARTS.map((p) => {
            const a = state.armor[p] && ARMOR_BY[state.armor[p]];
            const tags = a ? a.skills.map((s) => `${s.name} Lv${s.level}`).join('　') + (a.setSkill ? '　套裝：' + a.setSkill : '') : '點此選擇或先按自動找配裝';
            return `<button class="slot" data-act="pick" data-kind="armor" data-part="${p}">
              <span class="part">${PART_SHORT[p]}</span>
              <span class="meta">
                <div class="name${a ? '' : ' empty'}">${a ? escape(a.name) : p}</div>
                <div class="tags">${escape(tags)}</div>
              </span>
              ${a ? `<span class="${rarityClass(a.maxRarity)}">R${a.maxRarity}</span>` : ''}
            </button>`;
          }).join('')}

                    ${tot.skills.length ? `
          <div class="sec-h" style="margin-top:14px">這套裝備的全部技能 <span class="sub">共 ${tot.skills.length} 項（武器、防具與套裝）</span></div>
          <div class="gear-skills">${tot.skills.map((sk) =>
            `<div class="gear-skill${sk.over ? ' over' : ''}">
              ${icon(sk.cat)}
              <span class="skill-name">${escape(sk.name)}</span>
              ${pips(sk)}
              ${lvText(sk)}
            </div>`
          ).join('')}</div>` : ((state.altResults.length || PARTS.some((p) => state.armor[p])) ? '<div class="empty-hint">這套裝備還沒有技能。</div>' : '')}
        </div>

        <div class="section">
          <div class="sec-h">戰鬥數值</div>
          ${renderCombat(tot)}
        </div>

        <div class="section">
          <div class="sec-h">技能一覽 <span class="sub">全部 ${tot.skills.length} 項，點列可看來源</span></div>
          ${renderSkills(tot, state.openSkill)}
        </div>

        <div class="section">
          <div class="sec-h">套裝技能</div>
          <div class="set-list">${tot.setProgress.length ? tot.setProgress.map((s) =>
            `<div class="set-item${s.on ? '' : ' off'}">
              <div class="t">${escape(s.name)}　${s.count}/${s.need || '?'} 件${s.on ? '　已發動' : ''}</div>
              <div class="d">${escape(s.effect || '')}${s.flavor ? '　' + escape(s.flavor) : ''}</div>
            </div>`
          ).join('') : '<div class="empty-hint">尚未湊成套裝。未達件數的進度也會列在這裡。</div>'}</div>
        </div>
        <div class="note">資料來源：${escape(D.source)}，技能為防具最高稀有度時的等級。資料抓取日期 ${escape(D.fetchedAt)}（台北時間）。</div>
      </div>`;
  }

  function renderSaves() {
    return `
      <div class="page">
        <div class="section">
          <div class="sec-h">儲存目前配裝</div>
          <div class="target">
            <input class="field" style="flex:1" placeholder="幫這套取個名字" data-act="save-name" value="${escape(state.saveName)}">
            <button class="btn" data-act="save-now">存檔</button>
          </div>
          <div class="btn-row">
            <button class="btn ghost" data-act="export">匯出 JSON</button>
            <button class="btn ghost" data-act="import">匯入 JSON</button>
          </div>
          <input type="file" accept="application/json,.json" data-act="import-file" hidden>
          <div class="note">資料只存在這台裝置的瀏覽器（localStorage），不會上傳。可匯出備份。</div>
        </div>
        <div class="section">
          <div class="sec-h">已存檔 ${state.saves.length} 套</div>
          ${state.saves.length ? state.saves.map((s, i) => `
            <div class="card">
              <h3>${escape(s.name)}</h3>
              <div class="muted">${escape(s.summary || '')}</div>
              <div class="btn-row" style="margin-top:8px">
                <button class="btn ghost" data-act="load-save" data-i="${i}">載入</button>
                <button class="btn ghost" data-act="cmp" data-i="${i}">比較</button>
                <button class="btn danger" data-act="del-save" data-i="${i}">刪除</button>
              </div>
            </div>`).join('') : '<div class="empty-hint">還沒有存檔。</div>'}
        </div>
        <div class="section">
          <div class="sec-h">並排比較</div>
          ${renderCompare()}
        </div>
      </div>`;
  }

  function renderCompare() {
    const [a, b] = state.compare;
    if (!a && !b) return '<div class="empty-hint">在存檔列按「比較」，選兩套配裝並排看技能與戰鬥數值。</div>';
    const A = a && compute(a.build);
    const B = b && compute(b.build);
    const names = new Set([...(A ? A.skills.map((s) => s.name) : []), ...(B ? B.skills.map((s) => s.name) : [])]);
    const all = [...names].sort((x, y) => x.localeCompare(y, 'zh-Hant'));
    function col(save, tot) {
      if (!save) return '<div class="muted">尚未選擇</div>';
      const c = combatStats(tot);
      return `<div class="card"><h3>${escape(save.name)}</h3>
        <div class="muted">攻擊 ${fmt(c.atk)}　會心 ${fmt(c.aff)}%　防禦 ${fmt(c.def)}</div>
        ${PARTS.map((p) => `<div class="muted">${PART_SHORT[p]} ${(ARMOR_BY[save.build.armor[p]] || {}).name || '—'}</div>`).join('')}
        <div style="margin-top:8px">${all.map((n) => {
          const s = tot.skills.find((x) => x.name === n);
          return `<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0"><span>${escape(n)}</span><b>${s ? s.total : '—'}</b></div>`;
        }).join('')}</div></div>`;
    }
    return `<div class="compare">${col(a, A)}${col(b, B)}</div>`;
  }

  function renderPicker() {
    const p = state.picker;
    if (!p) return '';
    let title = '選擇';
    let body = '';
    if (p.kind === 'weapon') {
      title = '選擇武器';
      const q = (p.q || '').trim();
      let list = state.weaponType ? D.weapons.filter((w) => w.typeLabel === state.weaponType) : D.weapons.slice();
      if (q) list = list.filter((w) => (w.name + (w.element || '') + (w.typeLabel || '') + (w.skill ? w.skill.name : '')).includes(q));
      body = `
        <input class="search" placeholder="搜尋武器、屬性、技能" data-act="pq" value="${escape(p.q || '')}">
        <div class="filters">
          <button class="chip${state.weaponType === '' ? ' on' : ''}" data-act="wtype" data-type="">不限</button>
          ${WEAPON_TYPES.map((t) =>
            `<button class="chip${state.weaponType === t ? ' on' : ''}" data-act="wtype" data-type="${t}">${t}</button>`
          ).join('')}
        </div>
        <div class="list">
          <button class="pick" data-act="choose-weapon" data-slug=""><div class="nm">（不裝備）</div></button>
          ${list.map((w) => `<button class="pick${state.weapon === w.slug ? ' on' : ''}" data-act="choose-weapon" data-slug="${escape(w.slug)}">
            <div class="nm">${escape(w.name)} <span class="${rarityClass(w.maxRarity)}">R${w.maxRarity}</span></div>
            <div class="sk">攻擊 ${w.attack}　會心 ${fmt(w.critRate)}%${w.element ? '　' + w.element + ' ' + (w.elementValue || '') : ''}${w.skill ? '　' + w.skill.name + ' Lv' + w.skill.level : ''}</div>
          </button>`).join('')}
        </div>`;
    } else if (p.kind === 'armor') {
      title = '選擇' + p.part;
      const q = (p.q || '').trim();
      const skillF = p.skillF || '';
      let list = D.armor.filter((a) => a.partLabel === p.part);
      if (q) list = list.filter((a) => (a.name + a.series + (a.setSkill || '') + a.skills.map((s) => s.name).join('')).includes(q));
      if (skillF) list = list.filter((a) => a.skills.some((s) => s.name === skillF) || a.setSkill === skillF);
      const skillOpts = [...new Set(D.armor.filter((a) => a.partLabel === p.part).flatMap((a) => a.skills.map((s) => s.name)))].sort((a, b) => a.localeCompare(b, 'zh-Hant'));
      body = `
        <input class="search" placeholder="搜尋防具、系列、技能" data-act="pq" value="${escape(p.q || '')}">
        <div class="filters">
          <select data-act="p-skill"><option value="">全部技能</option>${skillOpts.map((n) =>
            `<option ${n === skillF ? 'selected' : ''}>${escape(n)}</option>`).join('')}</select>
        </div>
        <div class="list">
          <button class="pick" data-act="choose-armor" data-id=""><div class="nm">（不裝備）</div></button>
          ${list.map((a) => `<button class="pick${state.armor[p.part] === a.id ? ' on' : ''}" data-act="choose-armor" data-id="${escape(a.id)}">
            <div class="nm">${escape(a.name)} <span class="${rarityClass(a.maxRarity)}">R${a.maxRarity}</span></div>
            <div class="sk">${a.skills.map((s) => s.name + ' Lv' + s.level).join('　')}${a.setSkill ? '　套裝：' + a.setSkill : ''}　防禦 ${a.defense}</div>
          </button>`).join('')}
        </div>`;
    } else if (p.kind === 'visage') {
      title = p.index == null ? '新增繪影' : '更換繪影';
      const q = (p.q || '').trim();
      const usedCost = state.visages.reduce((s, v, i) => s + ((p.index != null && i === p.index) ? 0 : ((VIS_BY[v.id] && VIS_BY[v.id].cost) || 0)), 0);
      let list = D.visages;
      if (q) list = list.filter((v) => (v.name + (v.sets || []).join('') + (v.main || '')).includes(q));
      body = `
        <input class="search" placeholder="搜尋繪影、套裝、核心效果" data-act="pq" value="${escape(p.q || '')}">
        <div class="list">
          ${p.index != null ? `<button class="pick" data-act="choose-visage" data-id=""><div class="nm">移除這格繪影</div></button>` : ''}
          ${list.map((v) => `<button class="pick" data-act="choose-visage" data-id="${escape(v.id)}">
            <div class="nm">${escape(v.name)}　消耗 ${v.cost}${usedCost + v.cost > VISAGE_CAP ? '　（會超過 12）' : ''}</div>
            <div class="sk">${(v.sets || []).join('、')}${v.main ? '　核心：' + v.main : ''}</div>
          </button>`).join('')}
        </div>`;
    } else if (p.kind === 'insight') {
      title = '選擇心得';
      const adv = ADV_BY[state.adventurerId];
      const selected = new Set(state.insights);
      body = `<div class="list">${(adv ? adv.insights : []).map((it) => {
        const on = selected.has(it.key);
        return `<button class="pick${on ? ' on' : ''}" data-act="toggle-insight" data-key="${escape(it.key)}">
          <div class="nm">${escape(it.name)}　成本 ${it.points}${on ? '　已裝備' : ''}</div>
          <div class="sk">${escape(it.effect || '（詳細效果文案尚未收入）')}</div>
        </button>`;
      }).join('')}</div>`;
    } else if (p.kind === 'skill') {
      title = '選擇預定技能';
      const q = (p.q || '').trim();
      const searching = q.length > 0;
      const selected = new Map(state.searchTargets.map((t) => [t.name, t.level]));
      let list = D.skills.slice().sort((a, b) => a.name.localeCompare(b.name, 'zh-Hant'));
      list = list.filter((s) => !PICKER_HIDE.has(s.name));
      if (q) list = list.filter((s) => s.name.includes(q));
      function expandOf(sk) {
        const cap = sk.maxLevel;
        const cur = selected.get(sk.name);
        const desc = skillDesc(sk.name);
        const lvFx = cur ? skillLevelText(sk.name, cur) : null;
        const atk = isAtkMain(sk.name);
        const capLabel = cap != null ? (atk ? ('Lv最高 ' + cap) : ('最高 Lv' + cap)) : '上限未公開';
        const controls = atk
          ? `<span class="sk-fixed">${cap != null ? 'Lv最高 ' + cap : '上限未公開'}${cap != null ? '（固定）' : ''}</span>
            ${cur ? `<button type="button" class="clear-btn" data-act="tgt-del" data-name="${escape(sk.name)}">移除</button>` : `<button type="button" class="btn ghost" data-act="tgt-inc" data-name="${escape(sk.name)}">加入</button>`}`
          : `<div class="stepper">
              <button type="button" data-act="tgt-dec" data-name="${escape(sk.name)}">−</button>
              <span style="min-width:1.6em;text-align:center;font-weight:700">${cur || 0}</span>
              <button type="button" data-act="tgt-inc" data-name="${escape(sk.name)}">+</button>
            </div>
            ${cur ? `<button type="button" class="clear-btn" data-act="tgt-del" data-name="${escape(sk.name)}">移除</button>` : '<span class="muted">按 ＋ 加入此技能</span>'}`;
        return `<div class="sk-expand">
          <div class="sk-expand-h">${escape(sk.name)}　${capLabel}</div>
          ${desc ? `<div class="desc">${escape(desc)}</div>` : (!lvFx ? `<div class="desc">此技能的詳細效果文案尚未收入公開資料。</div>` : '')}
          ${lvFx ? `<div class="desc">目標 ${atk ? '最高 ' : ''}Lv${cur}：${escape(lvFx)}</div>` : ''}
          <div class="expand-row">${controls}</div>
        </div>`;
      }
      function chipsOf(arr) {
        return arr.map((sk) => {
          const cur = selected.get(sk.name);
          const open = p.open === sk.name;
          const label = searching ? escape(sk.name) : (cur ? `${escape(sk.name)} ${cur}` : escape(sk.name));
          return `<button type="button" class="sk-chip${cur ? ' on' : ''}${open ? ' open' : ''}" data-act="skill-chip" data-name="${escape(sk.name)}">${label}</button>`;
        }).join('');
      }
      function expandIfOpen(arr) {
        const sk = arr.find((s) => p.open === s.name);
        return sk ? expandOf(sk) : '';
      }
      let inner = '';
      if (searching) {
        inner = list.length
          ? `<div class="sk-wrap">${chipsOf(list)}</div>${expandIfOpen(list)}`
          : '<div class="empty-hint">沒有符合的技能名稱</div>';
      } else {
        const groups = {};
        CAT_ORDER.forEach((c) => { groups[c] = []; });
        for (const sk of list) {
          const c = catOf(sk.name);
          (groups[c] || (groups[c] = [])).push(sk);
        }
        for (const c of CAT_ORDER) {
          if (!(groups[c] || []).length) continue;
          inner += `<div class="sk-group"><div class="sk-ghead">${CAT_LABEL[c] || c}</div><div class="sk-wrap">${chipsOf(groups[c])}</div>${expandIfOpen(groups[c])}</div>`;
        }
      }
      body = `
        <input class="search" placeholder="搜尋技能名稱" data-act="pq" value="${escape(p.q || '')}">
        <div class="list">${inner}</div>`;
    }
    return `<div class="overlay" data-act="close-pick"><div class="sheet" data-act="sheet">
      <div class="sheet-h"><b>${escape(title)}</b><button class="x" data-act="close-pick">×</button></div>
      ${body}
    </div></div>`;
  }

  function render() {
    normalizeTargets();
    const root = document.getElementById('app');
    root.innerHTML = `
      <header class="topbar">
        <div class="brand"><h1>旅人配裝器</h1><small>魔物獵人：旅人</small></div>
        <nav class="tabs">
          <button class="tab${state.tab === 'build' ? ' on' : ''}" data-act="tab" data-tab="build">配裝</button>
          <button class="tab${state.tab === 'saves' ? ' on' : ''}" data-act="tab" data-tab="saves">存檔</button>
        </nav>
      </header>
      ${state.tab === 'saves' ? renderSaves() : renderBuild()}
      ${renderPicker()}
      ${renderConfirm()}`;
  }

  function renderConfirm() {
    if (!state.confirmOpen) return '';
    const targets = state.searchTargets.filter((t) => t.name && t.level > 0);
    return `<div class="overlay" data-act="confirm-cancel"><div class="sheet confirm-sheet" data-act="sheet">
      <div class="sheet-h"><b>確認預定技能</b><button class="x" data-act="confirm-cancel">×</button></div>
      <p class="confirm-note">即將依下列技能自動尋找武器與五件防具（不含繪影、心得）。請確認後按「確定」開始搜尋。</p>
      <div class="confirm-list">${targets.length ? targets.map((t) => `
        <div class="confirm-row">
          <span>${icon(catOf(t.name))}${escape(t.name)}</span>
          <b>${isAtkMain(t.name) ? 'Lv最高 ' + t.level : 'Lv' + t.level}</b>
        </div>`).join('') : '<div class="empty-hint">尚未選擇技能。</div>'}</div>
      <div class="confirm-note">武器種類：${state.weaponType ? escape(state.weaponType) : '不限'}</div>
      <div class="btn-row confirm-actions">
        <button class="btn ghost" data-act="confirm-cancel">取消</button>
        <button class="btn" data-act="confirm-ok">確定</button>
      </div>
    </div></div>`;
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

  function wantedElement(targets) {
    for (const t of targets) {
      const m = t.name.match(/^(火|水|雷|冰|龍)屬性/);
      if (m) return m[1];
    }
    return null;
  }
  function filteredWeapons() {
    return state.weaponType ? D.weapons.filter((w) => w.typeLabel === state.weaponType) : D.weapons.slice();
  }
  function scoreWeapon(w, wantNames, elem) {
    let s = 0;
    if (w.skill && wantNames.has(w.skill.name)) s += (w.skill.level || 0) * 10000;
    if (elem && w.element === elem) s += 5000 + (w.elementValue || 0);
    s += (w.attack || 0);
    s += (w.critRate || 0);
    return s;
  }
  function weaponPacksFor(targets, wantNames) {
    const elem = wantedElement(targets);
    const all = filteredWeapons();
    const nT = targets.length;
    function packW(w) {
      const v = new Array(nT).fill(0);
      if (w && w.skill) {
        for (let i = 0; i < nT; i++) if (w.skill.name === targets[i].name) v[i] += w.skill.level || 0;
      }
      return {
        v, slug: w ? w.slug : null, name: w ? w.name : '', atk: (w && w.attack) || 0,
        typeLabel: (w && w.typeLabel) || '', elem: w && w.element, ev: (w && w.elementValue) || 0,
        score: w ? scoreWeapon(w, wantNames, elem) : -1,
      };
    }
    const packs = [];
    const contrib = all.filter((w) => w.skill && wantNames.has(w.skill.name));
    const others = all.filter((w) => !(w.skill && wantNames.has(w.skill.name)));
    if (others.length) {
      others.sort((a, b) => scoreWeapon(b, wantNames, elem) - scoreWeapon(a, wantNames, elem));
      packs.push(packW(others[0]));
    }
    const bestByKey = new Map();
    for (const w of contrib) {
      const key = w.skill.name + ':' + (w.skill.level || 0);
      const p = packW(w);
      const prev = bestByKey.get(key);
      if (!prev || p.score > prev.score) bestByKey.set(key, p);
    }
    for (const p of bestByKey.values()) packs.push(p);
    if (!packs.length && all.length) {
      all.sort((a, b) => scoreWeapon(b, wantNames, elem) - scoreWeapon(a, wantNames, elem));
      packs.push(packW(all[0]));
    }
    if (!packs.length) packs.push(packW(null));
    return packs;
  }

  function runSearch() {
    const targets = state.searchTargets.filter((t) => t.name && t.level > 0);
    if (!targets.length) {
      state.altResults = [];
      state.searchInfo = '請先選擇預定技能。';
      return;
    }
    const wantNames = new Set(targets.map((t) => t.name));
    const usefulSets = new Set(D.setSkills.filter((s) => s.skill && wantNames.has(s.skill)).map((s) => s.name));
    const lists = PARTS.map((p) => {
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

    const wepPacks = weaponPacksFor(targets, wantNames);
    let activeWep = wepPacks[0] || { v: new Array(nT).fill(0), slug: null, name: '', atk: 0, score: 0 };

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
        weapon: activeWep.slug,
        weaponName: activeWep.name,
        shortfall, waste, defense: def, empty, sets, labels,
        score: shortfall * 10000 + waste * 100 - def + empty * 3 - (activeWep.atk || 0) * 0.01,
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

    for (const wp of wepPacks) {
      if (timedOut) break;
      activeWep = wp;
      dfs(0, wp.v.slice(), {}, 0, 0);
    }
    state.altResults = best;
    const meet = best.filter((r) => r.shortfall === 0).length;
    const typeNote = state.weaponType ? `武器限「${state.weaponType}」。` : '武器種類不限，已一併挑選。';
    state.searchInfo = meet
      ? `找到 ${meet} 套能達成目標的組合（顯示前 ${best.length} 套）。${typeNote}${timedOut ? '搜尋時間到後停止，已保留當下最佳。' : '只搜尋對目標技能有貢獻的防具，並用分支界限剪掉不可能的組合。'}`
      : (best.length ? `沒有完全達標的組合，已列出最接近的 ${best.length} 套。${typeNote}` : '找不到可用組合。');
    if (best.length) applyAlt(0);
  }

  function applyAlt(i) {
    const r = state.altResults[i];
    if (!r) return;
    state.altIndex = i;
    state.armor = { ...r.armor };
    if (r.weapon !== undefined) state.weapon = r.weapon;
    state.visages = [];
    state.visSubs = {};
    state.showSubs = {};
    state.insights = [];
  }

  /* ---------- events ---------- */
  function refetchSearchFocus() {
    const inp = document.querySelector('.search');
    return inp;
  }

  function onClick(e) {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act;
    if (act === 'sheet') { e.stopPropagation(); return; }
    if (act === 'tab') { state.tab = t.dataset.tab; state.picker = null; render(); return; }
    if (act === 'wtype') { state.weaponType = t.dataset.type || ''; render(); return; }
    if (act === 'pick') {
      state.picker = { kind: t.dataset.kind, part: t.dataset.part, index: t.dataset.index != null ? Number(t.dataset.index) : null, q: '', skillF: '', open: null };
      render();
      const inp = refetchSearchFocus();
      if (inp) inp.focus();
      return;
    }
    if (act === 'close-pick') { state.picker = null; render(); return; }
    if (act === 'choose-weapon') { state.weapon = t.dataset.slug || null; state.picker = null; render(); return; }
    if (act === 'choose-armor') {
      state.armor[state.picker.part] = t.dataset.id || null;
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
    if (act === 'skill-chip') {
      if (!state.picker) return;
      const chip = e.target.closest('button.sk-chip');
      if (!chip || chip !== t) return;
      e.stopPropagation();
      const name = chip.dataset.name;
      if (!name) return;
      state.picker.open = state.picker.open === name ? null : name;
      render();
      const inp = refetchSearchFocus();
      if (inp && state.picker && state.picker.q) {
        inp.focus();
        const pos = inp.value.length;
        inp.setSelectionRange(pos, pos);
      }
      const exp = document.querySelector('.sk-expand');
      if (exp) exp.scrollIntoView({ block: 'nearest' });
      return;
    }
    if (act === 'tgt-del') {
      const name = t.dataset.name;
      if (name) {
        const i = state.searchTargets.findIndex((x) => x.name === name);
        if (i >= 0) state.searchTargets.splice(i, 1);
      } else {
        state.searchTargets.splice(Number(t.dataset.i), 1);
      }
      render();
      const inp = refetchSearchFocus();
      if (inp && state.picker && state.picker.q) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
      return;
    }
    if (act === 'tgt-inc' || act === 'tgt-dec') {
      const name = t.dataset.name;
      let rec = name ? state.searchTargets.find((x) => x.name === name) : state.searchTargets[Number(t.dataset.i)];
      if (act === 'tgt-inc' && name && !rec) {
        rec = { name, level: 0 };
        state.searchTargets.push(rec);
      }
      if (!rec) return;
      if (isAtkMain(rec.name)) {
        const cap = atkMainCap(rec.name);
        if (act === 'tgt-dec') return;
        rec.level = cap != null ? cap : Math.max(rec.level || 1, 1);
      } else {
        const cap = (SKILL_BY[rec.name] || {}).maxLevel || 11;
        if (act === 'tgt-inc') rec.level = Math.min(cap, (rec.level || 0) + 1);
        else rec.level = Math.max(0, rec.level - 1);
        if (rec.level <= 0) state.searchTargets = state.searchTargets.filter((x) => x !== rec);
      }
      render();
      const inp = refetchSearchFocus();
      if (inp && state.picker && state.picker.q) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
      return;
    }
    if (act === 'toggle-skill') {
      state.openSkill = state.openSkill === t.dataset.name ? null : t.dataset.name;
      render(); return;
    }
    if (act === 'auto-build') {
      if (state.searchBusy) return;
      normalizeTargets();
      if (!state.searchTargets.filter((x) => x.name && x.level > 0).length) {
        state.searchInfo = '請先選擇預定技能。';
        render();
        return;
      }
      state.confirmOpen = true;
      render();
      return;
    }
    if (act === 'confirm-cancel') {
      state.confirmOpen = false;
      render();
      return;
    }
    if (act === 'confirm-ok') {
      if (state.searchBusy) return;
      state.confirmOpen = false;
      state.searchBusy = true; state.searchInfo = '搜尋中…'; render();
      setTimeout(() => {
        runSearch();
        state.searchBusy = false;
        render();
        const el = document.querySelector('[data-step="results"]');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 20);
      return;
    }
    if (act === 'alt') { applyAlt(Number(t.dataset.i)); render(); return; }
    if (act === 'toggle-subs') {
      const i = Number(t.dataset.i);
      state.showSubs[i] = !state.showSubs[i];
      render();
      return;
    }
    if (act === 'save-now') {
      const name = (state.saveName || '').trim() || ('配裝 ' + (state.saves.length + 1));
      const tot = compute();
      const summary = [(WEP_BY[state.weapon] || {}).name, ...PARTS.map((p) => (ARMOR_BY[state.armor[p]] || {}).name)].filter(Boolean).join('／');
      state.saves.unshift({ id: Date.now().toString(36), name, at: new Date().toISOString(), summary, build: snapshot() });
      persistSaves(); state.saveName = ''; render(); return;
    }
    if (act === 'load-save') { applySnap(state.saves[Number(t.dataset.i)].build); state.tab = 'build'; render(); return; }
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
  }

  function onChange(e) {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act;
    if (act === 'p-skill') { state.picker.skillF = t.value; render(); return; }
    if (act === 'adventurer') { state.adventurerId = t.value; state.insights = []; render(); return; }
    if (act === 'budget') { state.insightBudget = Math.max(0, Number(t.value) || 0); render(); return; }
    if (act === 'save-name') { state.saveName = t.value; return; }
    if (act === 'substat') {
      const i = Number(t.dataset.i);
      if (!state.visSubs[i]) state.visSubs[i] = {};
      state.visSubs[i][t.dataset.key] = t.value;
      // rerender combat only would be nicer; full render loses focus — debounce later in input
      return;
    }
    if (act === 'import-file') {
      const f = t.files && t.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          const arr = Array.isArray(data) ? data : data.saves;
          if (!Array.isArray(arr)) throw new Error('格式不對');
          state.saves = arr.concat(state.saves); persistSaves(); render();
        } catch (err) { alert('匯入失敗：' + err.message); }
      };
      reader.readAsText(f);
    }
  }

  document.addEventListener('click', onClick);
  document.addEventListener('change', onChange);
  document.addEventListener('input', (e) => {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    if (t.dataset.act === 'pq') {
      state.picker.q = t.value;
      clearTimeout(onChange._t);
      onChange._t = setTimeout(() => {
        const pos = t.selectionStart;
        render();
        const n = document.querySelector('.search');
        if (n) { n.focus(); n.setSelectionRange(pos, pos); }
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
  document.addEventListener('focusout', (e) => {
    const t = e.target && e.target.closest && e.target.closest('[data-act="substat"]');
    if (t) render();
  });

  function findW(name) { return (D.weapons.find((w) => w.name === name) || {}).slug; }

  // Optional demo hook used for verification: ?demo=fire7hb2
  function maybeDemo() {
    const q = new URLSearchParams(location.search);
    const demo = q.get('demo');
    if (demo !== 'fire7hb2' && demo !== 'atkmain') return false;
    state.weaponType = '';
    state.weapon = null;
    if (demo === 'atkmain') {
      state.searchTargets = [{ name: '氣力轉化', level: 7 }];
    } else {
      state.searchTargets = [
        { name: '火屬性傷害提升', level: 7 },
        { name: '體力強化', level: 2 },
      ];
    }
    state.adventurerId = '2';
    state.insightBudget = 30;
    if (q.get('picker') === '1') {
      state.picker = { kind: 'skill', q: q.get('q') || '', skillF: '', open: q.get('open') || null };
      return true;
    }
    if (q.get('idle') === '1' || demo === 'atkmain') return true;
    if (q.get('confirm') === '1') {
      state.confirmOpen = true;
      return true;
    }
    runSearch();
    return true;
  }

  maybeDemo();
  render();
  try { if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js'); } catch (e) {}
})();
