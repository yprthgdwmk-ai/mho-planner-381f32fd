(() => {
  const D = window.MHO_DATA;
  if (!D) { document.body.textContent = '資料載入失敗'; return; }

  const PARTS = ['頭部', '胸部', '腕部', '腰部', '腿部'];
  const PART_SHORT = { '頭部': '頭', '胸部': '身', '腕部': '手', '腰部': '腰', '腿部': '腳' };
  const WEAPON_TYPES = ['太刀', '大劍', '雙劍', '長槍', '大錘', '充能斧', '重弩槍', '弓'];
  const SKILL_BY = Object.fromEntries(D.skills.map((s) => [s.name, s]));
  const SET_BY = Object.fromEntries(D.setSkills.map((s) => [s.name, s]));
  const VSET_BY = Object.fromEntries(D.visageSets.map((s) => [s.name, s]));
  const ARMOR_BY = Object.fromEntries(D.armor.map((a) => [a.id, a]));
  const WEP_BY = Object.fromEntries(D.weapons.map((w) => [w.slug, w]));
  const VIS_BY = Object.fromEntries(D.visages.map((v) => [v.id, v]));
  const ADV_BY = Object.fromEntries(D.adventurers.map((a) => [a.id, a]));
  const STORE = 'mho-planner-v1';
  const VISAGE_CAP = D.notes.visageCostCap || 12;

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
    weaponType: '太刀',
    weapon: null,
    armor: { 頭部: null, 胸部: null, 腕部: null, 腰部: null, 腿部: null },
    visages: [], // {id, core}
    adventurerId: '2',
    insightBudget: 30,
    insights: [],
    picker: null,
    openSkill: null,
    searchTargets: [
      { name: '火屬性傷害提升', level: 7 },
      { name: '體力強化', level: 3 },
    ],
    searchResults: null,
    searchBusy: false,
    saves: loadSaves(),
    compare: [null, null],
    saveName: '',
    toast: '',
  };

  function loadSaves() {
    try { return JSON.parse(localStorage.getItem(STORE) || '[]'); }
    catch { return []; }
  }
  function persistSaves() {
    localStorage.setItem(STORE, JSON.stringify(state.saves));
  }

  function snapshot() {
    return {
      weaponType: state.weaponType,
      weapon: state.weapon,
      armor: { ...state.armor },
      visages: state.visages.map((v) => ({ ...v })),
      adventurerId: state.adventurerId,
      insightBudget: state.insightBudget,
      insights: [...state.insights],
    };
  }
  function applySnap(s) {
    if (!s) return;
    state.weaponType = s.weaponType || '太刀';
    state.weapon = s.weapon || null;
    state.armor = { 頭部: null, 胸部: null, 腕部: null, 腰部: null, 腿部: null, ...(s.armor || {}) };
    state.visages = s.visages || [];
    state.adventurerId = s.adventurerId || '2';
    state.insightBudget = s.insightBudget ?? 30;
    state.insights = s.insights || [];
  }

  function rarityClass(n) { return 'rarity r' + Math.max(1, Math.min(11, n || 1)); }

  function icon(cat) {
    return `<span class="icon cat-${cat}">${ICONS[cat] || ICONS.misc}</span>`;
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
      const id = b.armor[part];
      const a = id && ARMOR_BY[id];
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
      return { name, total, cap, effective, over, maxed, sources, effect: info.effect, cat: catOf(name), capUnknown: cap == null };
    });
    skills.sort((a, b) => (b.over - a.over) || (b.maxed - a.maxed) || b.total - a.total || a.name.localeCompare(b.name, 'zh-Hant'));

    // visages
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

    return { skills, setActive, setProgress, visCost, visSets, visFx, insightUsed, insightFx, weapon: w, defense: PARTS.reduce((s, p) => s + ((ARMOR_BY[b.armor[p]] || {}).defense || 0), 0) };
  }

  /* ---------- render helpers ---------- */
  function el(html) {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content;
  }
  function escape(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function pips(skill) {
    const cap = skill.cap;
    if (cap == null) return '<span class="pips"></span>';
    const filled = Math.min(skill.total, cap);
    const extra = skill.over ? Math.min(skill.total - cap, 3) : 0;
    let h = '<span class="pips" aria-hidden="true">';
    for (let i = 0; i < cap; i++) h += `<i class="pip${i < filled ? ' on' : ''}"></i>`;
    // do not invent extra cap pips; overflow is shown by the number
    h += '</span>';
    return h;
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
        `<div><span>${escape(x.source)}${x.kind === 'set' ? '' : ''}　<span class="muted">${x.kind === 'set' ? '套裝' : x.kind === 'weapon' ? '武器' : '防具'}</span></span><b>+${x.level}</b></div>`
      ).join('')}${s.over ? `<div class="err">超過上限 ${s.cap}，多出的 ${s.total - s.cap} 點不會再加強效果</div>` : ''}${s.effect ? `<div class="d" style="margin-top:4px">${escape(s.effect)}</div>` : ''}</div>` : '';
      return `<button class="skill-row${open ? ' open' : ''}" data-act="toggle-skill" data-name="${escape(s.name)}">
        ${icon(s.cat)}
        <span class="skill-name">${escape(s.name)}</span>
        ${pips(s)}
        ${lvText(s)}
        ${br}
      </button>`;
    }).join('')}</div>`;
  }

  function renderBuild() {
    const tot = compute();
    const w = tot.weapon;
    const adv = ADV_BY[state.adventurerId];
    return `
      <div class="page" data-page="build">
        <div class="section">
          <div class="sec-h">武器 <span class="sub">${w ? escape(w.typeLabel) : ''}</span></div>
          <div class="weapon-types">${WEAPON_TYPES.map((t) =>
            `<button class="chip${state.weaponType === t ? ' on' : ''}" data-act="wtype" data-type="${t}">${t}</button>`
          ).join('')}</div>
          <button class="slot" data-act="pick" data-kind="weapon">
            <span class="part">武</span>
            <span class="meta">
              <div class="name${w ? '' : ' empty'}">${w ? escape(w.name) : '點此選擇武器'}</div>
              <div class="tags">${w ? `攻擊 ${w.attack}${w.element ? '　' + w.element + ' ' + (w.elementValue || '') : ''}${w.sharpness ? '　鋒利度 ' + w.sharpness : ''}${w.skill ? '　' + w.skill.name + ' Lv' + w.skill.level : ''}` : '依武器種類篩選'}</div>
            </span>
            ${w ? `<span class="${rarityClass(w.maxRarity)}">R${w.maxRarity}</span>` : ''}
          </button>
        </div>

        <div class="section">
          <div class="sec-h">防具 <span class="sub">防禦合計 ${tot.defense || '—'}</span></div>
          ${PARTS.map((p) => {
            const a = state.armor[p] && ARMOR_BY[state.armor[p]];
            const tags = a ? a.skills.map((s) => `${s.name} Lv${s.level}`).join('　') + (a.setSkill ? '　套裝：' + a.setSkill : '') : '點此選擇';
            return `<button class="slot" data-act="pick" data-kind="armor" data-part="${p}">
              <span class="part">${PART_SHORT[p]}</span>
              <span class="meta">
                <div class="name${a ? '' : ' empty'}">${a ? escape(a.name) : p}</div>
                <div class="tags">${escape(tags)}</div>
              </span>
              ${a ? `<span class="${rarityClass(a.maxRarity)}">R${a.maxRarity}</span>` : ''}
            </button>`;
          }).join('')}
        </div>

        <div class="section">
          <div class="sec-h">繪影 <span class="sub costbar${tot.visCost > VISAGE_CAP ? ' over' : ''}">消耗 ${tot.visCost}/${VISAGE_CAP}</span></div>
          ${state.visages.map((slot, i) => {
            const v = VIS_BY[slot.id];
            if (!v) return '';
            return `<button class="slot" data-act="pick" data-kind="visage" data-index="${i}">
              <span class="part">${slot.core ? '核' : '影'}</span>
              <span class="meta">
                <div class="name">${escape(v.name)}</div>
                <div class="tags">消耗 ${v.cost}　${(v.sets || []).join('、')}${slot.core && v.main ? '　核心效果已發動' : slot.core ? '' : '　非核心欄（核心效果不發動）'}</div>
              </span>
            </button>`;
          }).join('')}
          <div class="btn-row">
            <button class="btn ghost" data-act="add-visage">新增繪影</button>
          </div>
          <div class="note">同一冒險者裝備的繪影消耗合計不能超過 ${VISAGE_CAP}。核心效果只有放在核心欄位才會發動。副屬性是隨機數值，這裡不填未查到的數字。</div>
        </div>

        <div class="section">
          <div class="sec-h">心得 <span class="sub costbar${tot.insightUsed > (state.insightBudget || 0) ? ' over' : ''}">成本 ${tot.insightUsed}/${state.insightBudget || 0}</span></div>
          <div class="target">
            <select data-act="adventurer">${D.adventurers.map((a) =>
              `<option value="${escape(a.id)}" ${a.id === state.adventurerId ? 'selected' : ''}>${escape(a.name)}</option>`
            ).join('')}</select>
            <input type="number" min="0" step="1" value="${state.insightBudget}" data-act="budget" style="width:88px" title="目前心得點數">
            <span class="muted">目前點數</span>
          </div>
          <button class="slot" data-act="pick" data-kind="insight">
            <span class="part">心</span>
            <span class="meta">
              <div class="name${tot.insightFx.length ? '' : ' empty'}">${tot.insightFx.length ? tot.insightFx.map((x) => x.title).join('、') : '點此選擇心得'}</div>
              <div class="tags">${adv ? escape(adv.name) : ''}　點數由你轉換的心得道具決定，沒有固定上限</div>
            </span>
          </button>
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

        <div class="section">
          <div class="sec-h">繪影與心得效果</div>
          <div class="fx-list">
            ${[...tot.visFx, ...tot.insightFx].length ? [...tot.visFx, ...tot.insightFx].map((f) =>
              `<div class="fx-item"><div class="t" style="font-weight:700;color:var(--gold2)">${escape(f.title)}${f.points ? '　成本 ' + f.points : ''}</div><div class="d">${escape(f.text)}</div></div>`
            ).join('') : '<div class="empty-hint">尚未裝備繪影或心得。繪影套裝與心得效果會全部列在這裡。</div>'}
          </div>
        </div>
        <div class="note">資料來源：${escape(D.source)}，技能為防具最高稀有度時的等級。資料抓取日期 ${escape(D.fetchedAt)}（台北時間）。</div>
      </div>`;
  }

  function renderSearch() {
    const skillNames = D.skills.map((s) => s.name).sort((a, b) => a.localeCompare(b, 'zh-Hant'));
    return `
      <div class="page">
        <div class="section">
          <div class="sec-h">想湊的技能</div>
          ${state.searchTargets.map((t, i) => `
            <div class="target">
              <select data-act="tgt-skill" data-i="${i}">${skillNames.map((n) =>
                `<option ${n === t.name ? 'selected' : ''}>${escape(n)}</option>`
              ).join('')}</select>
              <input type="number" min="1" max="11" value="${t.level}" data-act="tgt-lv" data-i="${i}" style="width:64px">
              <button class="clear-btn" data-act="tgt-del" data-i="${i}">刪</button>
            </div>`).join('')}
          <div class="btn-row">
            <button class="btn ghost" data-act="tgt-add">新增技能</button>
            <button class="btn" data-act="do-search">搜尋</button>
          </div>
          <div class="note">會把套裝加成算進去。搜尋的是防具組合；繪影不提供一般技能等級，結果裡會另外建議相關繪影套裝。</div>
        </div>
        <div class="section">
          <div class="sec-h">結果 ${state.searchResults ? '　' + state.searchResults.length + ' 套' : ''}</div>
          ${state.searchBusy ? '<div class="empty-hint">搜尋中…</div>' : renderSearchResults()}
        </div>
      </div>`;
  }

  function renderSearchResults() {
    if (!state.searchResults) return '<div class="empty-hint">設定目標後按搜尋。</div>';
    if (!state.searchResults.length) return '<div class="empty-hint">找不到符合的五件組合。可把目標等級調低再試。</div>';
    return state.searchResults.map((r, i) => `
      <div class="card">
        <h3>組合 ${i + 1}${r.waste ? `　<span class="err">有溢出</span>` : ''}</h3>
        ${PARTS.map((p) => {
          const a = ARMOR_BY[r.armor[p]];
          return `<div class="muted">${PART_SHORT[p]}　${a ? escape(a.name) : '—'}${a ? '　R' + a.maxRarity : ''}</div>`;
        }).join('')}
        <div style="margin-top:6px">${r.totals.map((s) =>
          `<span class="chip${s.over ? '' : s.ok ? ' on' : ''}" style="display:inline-block;margin:2px 4px 0 0">${escape(s.name)} ${s.total}${s.cap ? '/' + s.cap : ''}${s.over ? ' 溢' : s.ok ? ' ✓' : ''}</span>`
        ).join('')}</div>
        ${r.sets.length ? `<div class="muted" style="margin-top:6px">套裝：${r.sets.map((s) => escape(s)).join('、')}</div>` : ''}
        ${r.suggestedVisages.length ? `<div class="muted" style="margin-top:4px">建議繪影：${r.suggestedVisages.map((s) => escape(s)).join('、')}</div>` : ''}
        <div class="btn-row" style="margin-top:8px"><button class="btn ghost" data-act="apply-result" data-i="${i}">套用到配裝</button></div>
      </div>`).join('');
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
    if (!a && !b) return '<div class="empty-hint">在存檔列按「比較」，選兩套配裝並排看技能。</div>';
    const A = a && compute(a.build);
    const B = b && compute(b.build);
    const names = new Set([...(A ? A.skills.map((s) => s.name) : []), ...(B ? B.skills.map((s) => s.name) : [])]);
    const all = [...names].sort((x, y) => x.localeCompare(y, 'zh-Hant'));
    function col(save, tot) {
      if (!save) return '<div class="muted">尚未選擇</div>';
      return `<div class="card"><h3>${escape(save.name)}</h3>
        ${PARTS.map((p) => `<div class="muted">${PART_SHORT[p]} ${(ARMOR_BY[save.build.armor[p]] || {}).name || '—'}</div>`).join('')}
        <div style="margin-top:8px">${all.map((n) => {
          const s = tot.skills.find((x) => x.name === n);
          const lv = s ? s.total : 0;
          return `<div style="display:flex;justify-content:space-between;font-size:12px;padding:2px 0"><span>${escape(n)}</span><b>${lv || '—'}</b></div>`;
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
      let list = D.weapons.filter((w) => w.typeLabel === state.weaponType);
      if (q) list = list.filter((w) => (w.name + (w.element || '') + (w.skill ? w.skill.name : '')).includes(q));
      body = `
        <input class="search" placeholder="搜尋武器、屬性、技能" data-act="pq" value="${escape(p.q || '')}">
        <div class="list">
          <button class="pick" data-act="choose-weapon" data-slug=""><div class="nm">（不裝備）</div></button>
          ${list.map((w) => `<button class="pick${state.weapon === w.slug ? ' on' : ''}" data-act="choose-weapon" data-slug="${escape(w.slug)}">
            <div class="nm">${escape(w.name)} <span class="${rarityClass(w.maxRarity)}">R${w.maxRarity}</span></div>
            <div class="sk">攻擊 ${w.attack}${w.element ? '　' + w.element + ' ' + (w.elementValue || '') : ''}${w.skill ? '　' + w.skill.name + ' Lv' + w.skill.level : ''}</div>
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
      const usedCost = state.visages.reduce((s, v, i) => {
        if (p.index != null && i === p.index) return s;
        return s + ((VIS_BY[v.id] && VIS_BY[v.id].cost) || 0);
      }, 0);
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
    }
    return `<div class="overlay" data-act="close-pick"><div class="sheet" data-act="sheet">
      <div class="sheet-h"><b>${escape(title)}</b><button class="x" data-act="close-pick">×</button></div>
      ${body}
    </div></div>`;
  }

  function render() {
    const root = document.getElementById('app');
    root.innerHTML = `
      <header class="topbar">
        <div class="brand"><h1>旅人配裝器</h1><small>魔物獵人：旅人</small></div>
        <nav class="tabs">
          <button class="tab${state.tab === 'build' ? ' on' : ''}" data-act="tab" data-tab="build">配裝</button>
          <button class="tab${state.tab === 'search' ? ' on' : ''}" data-act="tab" data-tab="search">自動找配裝</button>
          <button class="tab${state.tab === 'saves' ? ' on' : ''}" data-act="tab" data-tab="saves">存檔</button>
        </nav>
      </header>
      ${state.tab === 'build' ? renderBuild() : state.tab === 'search' ? renderSearch() : renderSaves()}
      ${renderPicker()}`;
  }

  /* ---------- search ---------- */
  function suggestVisages(targets) {
    const names = new Set(targets.map((t) => t.name));
    const out = [];
    if ([...names].some((n) => n.includes('火屬性傷害'))) out.push('影繪之灼焰（2 件：火屬性傷害+5%）');
    if ([...names].some((n) => n.includes('水屬性傷害'))) out.push('影繪之水御（2 件：水屬性傷害+5%）');
    if ([...names].some((n) => n.includes('冰屬性傷害'))) out.push('影繪之冰霜（2 件：冰屬性傷害+5%）');
    if ([...names].some((n) => n.includes('雷屬性傷害'))) out.push('影繪之湧雷（2 件：雷屬性傷害+5%）');
    if ([...names].some((n) => n.includes('龍屬性傷害'))) out.push('影繪之破龍（2 件：龍屬性傷害+5%）');
    if ([...names].some((n) => /看破|會心/.test(n))) out.push('影繪之武技／影繪之共鳴（2 件：會心率+5%）');
    return out;
  }

  function usefulArmor(targets) {
    const want = new Map(targets.map((t) => [t.name, t.level]));
    const usefulSets = new Set();
    for (const st of D.setSkills) {
      if (st.skill && want.has(st.skill)) usefulSets.add(st.name);
    }
    const byPart = {};
    for (const p of PARTS) byPart[p] = [];
    for (const a of D.armor) {
      const hit = a.skills.some((s) => want.has(s.name)) || (a.setSkill && usefulSets.has(a.setSkill));
      if (hit) byPart[a.partLabel].push(a);
    }
    // If a slot is empty of contributors, leave it empty (no piece) as only option
    for (const p of PARTS) {
      // score and cap to keep search interactive
      byPart[p].sort((a, b) => scoreArmor(b, want) - scoreArmor(a, want));
      if (byPart[p].length > 14) byPart[p] = byPart[p].slice(0, 14);
      byPart[p].push(null); // allow empty
    }
    return byPart;
  }
  function scoreArmor(a, want) {
    let s = 0;
    for (const sk of a.skills) if (want.has(sk.name)) s += sk.level * 10;
    const st = a.setSkill && SET_BY[a.setSkill];
    if (st && st.skill && want.has(st.skill)) s += 6;
    return s;
  }

  function runSearch() {
    const targets = state.searchTargets.filter((t) => t.name && t.level > 0);
    if (!targets.length) { state.searchResults = []; return; }
    const want = targets.map((t) => ({ name: t.name, level: t.level, cap: (SKILL_BY[t.name] || {}).maxLevel }));
    const by = usefulArmor(targets);
    const results = [];
    const parts = PARTS;
    const lists = parts.map((p) => by[p]);
    const suggested = suggestVisages(targets);

    function totalsFor(combo) {
      const setCount = new Map();
      const skill = new Map();
      const names = {};
      for (let i = 0; i < 5; i++) {
        const a = combo[i];
        if (!a) { names[parts[i]] = null; continue; }
        names[parts[i]] = a.id;
        for (const sk of a.skills) skill.set(sk.name, (skill.get(sk.name) || 0) + sk.level);
        if (a.setSkill) setCount.set(a.setSkill, (setCount.get(a.setSkill) || 0) + 1);
      }
      const sets = [];
      for (const [name, cnt] of setCount) {
        const def = SET_BY[name];
        if (def && cnt >= def.pieces) {
          sets.push(name);
          if (def.skill && def.delta) skill.set(def.skill, (skill.get(def.skill) || 0) + def.delta);
        }
      }
      return { names, skill, sets };
    }

    function ok(skill) {
      return want.every((t) => (skill.get(t.name) || 0) >= t.level);
    }
    function score(skill) {
      let s = 0, waste = 0;
      for (const t of want) {
        const v = skill.get(t.name) || 0;
        const cap = t.cap;
        if (cap != null && v > cap) waste += v - cap;
        s += Math.min(v, cap || v) * 10;
      }
      return { s, waste };
    }

    // nested loops, lists already pruned
    const [H, C, A, W, L] = lists;
    for (const h of H) for (const c of C) for (const a of A) {
      // partial prune: mid skills
      for (const w of W) for (const l of L) {
        const t = totalsFor([h, c, a, w, l]);
        if (!ok(t.skill)) continue;
        const sc = score(t.skill);
        const shown = want.map((tg) => {
          const v = t.skill.get(tg.name) || 0;
          return { name: tg.name, total: v, cap: tg.cap, ok: v >= tg.level && (tg.cap == null || v <= tg.cap), over: tg.cap != null && v > tg.cap };
        });
        // also include other skills? keep result compact but when applied, full list shows
        results.push({ armor: t.names, sets: t.sets, totals: shown, score: sc.s, waste: sc.waste, suggestedVisages: suggested });
      }
    }
    results.sort((a, b) => (a.waste - b.waste) || (b.score - a.score));
    state.searchResults = results.slice(0, 20);
  }

  /* ---------- events ---------- */
  function onClick(e) {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act;
    if (act === 'sheet') { e.stopPropagation(); return; }
    if (act === 'tab') { state.tab = t.dataset.tab; state.picker = null; render(); return; }
    if (act === 'wtype') { state.weaponType = t.dataset.type; render(); return; }
    if (act === 'pick') {
      state.picker = { kind: t.dataset.kind, part: t.dataset.part, index: t.dataset.index != null ? Number(t.dataset.index) : null, q: '', skillF: '' };
      render();
      const inp = document.querySelector('.search');
      if (inp) inp.focus();
      return;
    }
    if (act === 'close-pick') { state.picker = null; render(); return; }
    if (act === 'choose-weapon') { state.weapon = t.dataset.slug || null; state.picker = null; render(); return; }
    if (act === 'choose-armor') {
      const part = state.picker.part;
      state.armor[part] = t.dataset.id || null;
      state.picker = null; render(); return;
    }
    if (act === 'add-visage') { state.picker = { kind: 'visage', index: null, q: '' }; render(); return; }
    if (act === 'choose-visage') {
      const id = t.dataset.id;
      const idx = state.picker.index;
      if (!id) {
        if (idx != null) state.visages.splice(idx, 1);
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
    if (act === 'toggle-skill') {
      state.openSkill = state.openSkill === t.dataset.name ? null : t.dataset.name;
      render(); return;
    }
    if (act === 'tgt-add') {
      state.searchTargets.push({ name: '體力強化', level: 3 });
      render(); return;
    }
    if (act === 'tgt-del') {
      state.searchTargets.splice(Number(t.dataset.i), 1);
      render(); return;
    }
    if (act === 'do-search') {
      state.searchBusy = true; render();
      setTimeout(() => { runSearch(); state.searchBusy = false; render(); }, 20);
      return;
    }
    if (act === 'apply-result') {
      const r = state.searchResults[Number(t.dataset.i)];
      if (r) {
        state.armor = { ...r.armor };
        state.tab = 'build';
        render();
        window.scrollTo(0, 0);
      }
      return;
    }
    if (act === 'save-now') {
      const name = (state.saveName || '').trim() || ('配裝 ' + (state.saves.length + 1));
      const tot = compute();
      const summary = [
        (WEP_BY[state.weapon] || {}).name,
        ...PARTS.map((p) => (ARMOR_BY[state.armor[p]] || {}).name),
      ].filter(Boolean).join('／');
      state.saves.unshift({ id: Date.now().toString(36), name, at: new Date().toISOString(), summary, build: snapshot() });
      persistSaves();
      state.saveName = '';
      render();
      return;
    }
    if (act === 'load-save') {
      applySnap(state.saves[Number(t.dataset.i)].build);
      state.tab = 'build';
      render();
      return;
    }
    if (act === 'del-save') {
      state.saves.splice(Number(t.dataset.i), 1);
      persistSaves();
      render();
      return;
    }
    if (act === 'cmp') {
      const s = state.saves[Number(t.dataset.i)];
      if (!state.compare[0] || (state.compare[0] && state.compare[1])) state.compare = [s, null];
      else state.compare[1] = s;
      render();
      return;
    }
    if (act === 'export') {
      const blob = new Blob([JSON.stringify({ app: 'mho-planner', version: 1, saves: state.saves }, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'mho-planner-backup.json';
      a.click();
      URL.revokeObjectURL(a.href);
      return;
    }
    if (act === 'import') {
      document.querySelector('[data-act="import-file"]').click();
      return;
    }
  }

  function onChange(e) {
    const t = e.target.closest('[data-act]');
    if (!t) return;
    const act = t.dataset.act;
    if (act === 'pq') { state.picker.q = t.value; const pos = t.selectionStart; render(); const n = document.querySelector('.search'); if (n) { n.focus(); n.setSelectionRange(pos, pos); } return; }
    if (act === 'p-skill') { state.picker.skillF = t.value; render(); return; }
    if (act === 'adventurer') { state.adventurerId = t.value; state.insights = []; render(); return; }
    if (act === 'budget') { state.insightBudget = Math.max(0, Number(t.value) || 0); render(); return; }
    if (act === 'tgt-skill') { state.searchTargets[Number(t.dataset.i)].name = t.value; return; }
    if (act === 'tgt-lv') { state.searchTargets[Number(t.dataset.i)].level = Number(t.value) || 1; return; }
    if (act === 'save-name') { state.saveName = t.value; return; }
    if (act === 'import-file') {
      const f = t.files && t.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          const arr = Array.isArray(data) ? data : data.saves;
          if (!Array.isArray(arr)) throw new Error('格式不對');
          state.saves = arr.concat(state.saves);
          persistSaves();
          render();
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
      // debounce rebuild of list only
      state.picker.q = t.value;
      clearTimeout(onChange._t);
      onChange._t = setTimeout(() => {
        const pos = t.selectionStart;
        render();
        const n = document.querySelector('.search');
        if (n) { n.focus(); n.setSelectionRange(pos, pos); }
      }, 80);
    }
  });

  function applyDemo() {
    const findA = (name) => (D.armor.find((a) => a.name === name) || {}).id;
    const findW = (name) => (D.weapons.find((w) => w.name === name) || {}).slug;
    state.weaponType = '太刀';
    state.weapon = findW('融光・飛龍刀【朱】') || findW('飛龍刀【朱】');
    state.armor = {
      頭部: findA('火龍心頭盔'),
      胸部: findA('火龍鎧甲'),
      腕部: findA('融光・火龍腕甲'),
      腰部: findA('蠻顎龍腰甲'),
      腿部: findA('巨蜂護腿'),
    };
    // demo visages: fire set + core, within cost 12, clearly real data
    const fireVis = D.visages.filter((v) => (v.sets || []).includes('影繪之灼焰'));
    state.visages = [];
    if (fireVis[0]) state.visages.push({ id: fireVis[0].id, core: true });
    if (fireVis[1]) state.visages.push({ id: fireVis[1].id, core: false });
    state.adventurerId = '2';
    const adv = ADV_BY['2'];
    // pick cheap official insights that fit budget 30: 戰意 10 + 護體 5 if present
    state.insightBudget = 30;
    state.insights = [];
    if (adv) {
      const prefer = ['戰意', '護體', '蓄勢'];
      let used = 0;
      for (const name of prefer) {
        const it = adv.insights.find((x) => x.name === name);
        if (it && used + it.points <= 30) { state.insights.push(it.key); used += it.points; }
      }
    }
  }

  applyDemo();
  render();
})();

try { if ("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js"); } catch (e) {}
