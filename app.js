(function () {
  'use strict';

  const DAYS = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日', 'その他'];
  const BODY_PARTS = ['胸', '背中', '足', '肩', '腹', '前腕', '二頭', '三頭'];
  const STORAGE_KEY = 'kintre-menu-data-v2';

  const QUOTES = [
    'きつい時こそ成長のサイン',
    '昨日の自分を超えろ',
    '筋肉は裏切らない',
    'やらない後悔よりやる筋肉痛',
    '限界は自分が決めるな',
    '今日の1repが明日の体をつくる',
    'サボった日は戻ってこない',
    '重さに負けるな、重さを超えろ',
    'ジムに来た時点でもう勝ち',
    'デカくなりたきゃ食え、挙げろ、寝ろ',
    '理想の体は今日の努力の先にある',
    '「あと1回」が未来を変える',
    '痛みは弱さが体から出ていく証拠',
    '迷ったらスクワット',
    'トレーニングに近道なし、だから価値がある',
    '今日やれば明日の自分に感謝される',
    '周りと比べるな、過去の自分と比べろ',
    'やる気がなくても体を動かせ。気合はあとからついてくる',
    'その1セットが3ヶ月後の自分をつくる',
    '休むのもトレーニングのうち、でも今日はやる日だ',
  ];

  let data = loadData();
  let selectedDay = null;

  function getDefaultData() {
    const d = {};
    DAYS.forEach(day => {
      if (day === 'その他') {
        d[day] = { memo: '' };
      } else {
        d[day] = {
          isRestDay: false,
          parts: []
        };
      }
    });
    return d;
  }

  function loadData() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        DAYS.forEach(day => {
          if (!parsed[day]) {
            parsed[day] = day === 'その他' ? { memo: '' } : { isRestDay: false, parts: [] };
          }
        });
        return parsed;
      }
    } catch (e) { /* ignore */ }
    return getDefaultData();
  }

  function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    showSaveToast();
  }

  let saveTimeout = null;
  function debouncedSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveData, 500);
  }

  function showSaveToast() {
    const toast = document.getElementById('save-toast');
    if (!toast) return;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 1500);
  }

  function renderDayList() {
    const nav = document.getElementById('day-list');
    nav.innerHTML = '';
    DAYS.forEach(day => {
      const btn = document.createElement('button');
      btn.className = 'day-btn';
      btn.textContent = day === 'その他' ? 'その他' : day.replace('曜日', '');
      btn.dataset.day = day;

      if (day !== 'その他' && data[day] && data[day].isRestDay) {
        btn.classList.add('rest-day');
      }
      if (selectedDay === day) {
        btn.classList.add('active');
      }

      btn.addEventListener('click', () => {
        selectedDay = day;
        renderDayList();
        renderContent();
      });

      nav.appendChild(btn);
    });
  }

  function renderContent() {
    const main = document.getElementById('main-content');

    if (!selectedDay) {
      main.innerHTML = '<div class="placeholder"><p>👆 曜日を選択してください</p></div>';
      return;
    }

    if (selectedDay === 'その他') {
      renderMemo(main);
      return;
    }

    renderDayContent(main);
  }

  function renderMemo(container) {
    const dayData = data['その他'];
    const wrapper = document.createElement('div');
    wrapper.className = 'memo-section fade-in';
    wrapper.innerHTML = `
      <h2>📝 メモ</h2>
      <textarea
        class="memo-textarea"
        placeholder="普段やらないメニューのメモなど自由に入力..."
      >${dayData.memo || ''}</textarea>
    `;

    container.innerHTML = '';
    container.appendChild(wrapper);

    wrapper.querySelector('.memo-textarea').addEventListener('input', (e) => {
      data['その他'].memo = e.target.value;
      debouncedSave();
    });
  }

  function renderDayContent(container) {
    const dayData = data[selectedDay];

    const wrapper = document.createElement('div');
    wrapper.className = 'fade-in';

    let html = `
      <div class="rest-day-toggle">
        <span class="rest-label">🏖️ 休日</span>
        <label class="toggle-switch">
          <input type="checkbox" id="rest-toggle" ${dayData.isRestDay ? 'checked' : ''}>
          <span class="toggle-slider"></span>
        </label>
      </div>
    `;

    if (dayData.isRestDay) {
      html += '<div class="rest-message">😴 今日はお休み！しっかり回復しよう</div>';
    } else {
      dayData.parts.forEach((part, pi) => {
        html += renderPartCard(part, pi);
      });
      html += `<button class="add-part-btn" data-action="add-part">＋ 部位を追加</button>`;
    }

    wrapper.innerHTML = html;

    container.innerHTML = '';
    container.appendChild(wrapper);

    bindDayEvents(wrapper, dayData);
  }

  function renderPartCard(part, partIndex) {
    let optionsHtml = '<option value="">-- 部位を選択 --</option>';
    BODY_PARTS.forEach(bp => {
      const selected = part.name === bp ? 'selected' : '';
      optionsHtml += `<option value="${bp}" ${selected}>${bp}</option>`;
    });

    let menusHtml = `
      <div class="menu-labels">
        <span>メニュー</span>
        <span>kg</span>
        <span>回数</span>
        <span>セット</span>
        <span>更新OK</span>
        <span></span>
      </div>
    `;

    part.menus.forEach((menu, mi) => {
      menusHtml += `
        <div class="menu-item">
          <input type="text" value="${escapeHtml(menu.name)}" placeholder="メニュー名"
            data-part="${partIndex}" data-menu="${mi}" data-field="name">
          <input type="number" value="${menu.weight || ''}" placeholder="kg"
            data-part="${partIndex}" data-menu="${mi}" data-field="weight" min="0" step="0.5">
          <input type="number" value="${menu.reps}" placeholder="回"
            data-part="${partIndex}" data-menu="${mi}" data-field="reps" min="0">
          <input type="number" value="${menu.sets}" placeholder="set"
            data-part="${partIndex}" data-menu="${mi}" data-field="sets" min="0">
          <label class="update-ok-check">
            <input type="checkbox" ${menu.updateOk ? 'checked' : ''}
              data-part="${partIndex}" data-menu="${mi}" data-field="updateOk">
            <span class="checkmark"></span>
          </label>
          <button class="delete-menu-btn" data-action="delete-menu" data-part="${partIndex}" data-menu="${mi}">✕</button>
        </div>
      `;
    });

    return `
      <div class="part-card">
        <div class="part-header">
          <span class="part-label">部位</span>
          <select data-action="change-part" data-part="${partIndex}">
            ${optionsHtml}
          </select>
          <button class="delete-part-btn" data-action="delete-part" data-part="${partIndex}">🗑</button>
        </div>
        <div class="menu-list">
          ${menusHtml}
          <button class="add-menu-btn" data-action="add-menu" data-part="${partIndex}">＋ メニューを追加</button>
        </div>
      </div>
    `;
  }

  function bindDayEvents(wrapper, dayData) {
    const restToggle = wrapper.querySelector('#rest-toggle');
    if (restToggle) {
      restToggle.addEventListener('change', (e) => {
        dayData.isRestDay = e.target.checked;
        saveData();
        renderDayList();
        renderContent();
      });
    }

    wrapper.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      const partIndex = parseInt(btn.dataset.part);

      switch (action) {
        case 'add-part':
          dayData.parts.push({ name: '', menus: [{ name: '', weight: '', reps: '', sets: '' }] });
          saveData();
          renderContent();
          break;

        case 'delete-part':
          dayData.parts.splice(partIndex, 1);
          saveData();
          renderContent();
          break;

        case 'add-menu':
          dayData.parts[partIndex].menus.push({ name: '', weight: '', reps: '', sets: '' });
          saveData();
          renderContent();
          break;

        case 'delete-menu': {
          const menuIndex = parseInt(btn.dataset.menu);
          dayData.parts[partIndex].menus.splice(menuIndex, 1);
          saveData();
          renderContent();
          break;
        }
      }
    });

    wrapper.addEventListener('change', (e) => {
      if (e.target.dataset.action === 'change-part') {
        const partIndex = parseInt(e.target.dataset.part);
        dayData.parts[partIndex].name = e.target.value;
        saveData();
      }
      if (e.target.dataset.field === 'updateOk') {
        const pi = parseInt(e.target.dataset.part);
        const mi = parseInt(e.target.dataset.menu);
        dayData.parts[pi].menus[mi].updateOk = e.target.checked;
        saveData();
      }
    });

    wrapper.addEventListener('input', (e) => {
      const { part, menu, field } = e.target.dataset;
      if (part !== undefined && menu !== undefined && field) {
        dayData.parts[parseInt(part)].menus[parseInt(menu)][field] = e.target.value;
        debouncedSave();
      }
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }

  function init() {
    const toast = document.createElement('div');
    toast.id = 'save-toast';
    toast.className = 'save-toast';
    toast.textContent = '✓ 保存しました';
    document.body.appendChild(toast);

    const quoteEl = document.getElementById('quote');
    if (quoteEl) {
      quoteEl.textContent = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    }

    const today = new Date().getDay();
    const dayMap = [6, 0, 1, 2, 3, 4, 5];
    const todayIndex = dayMap[today];
    selectedDay = DAYS[todayIndex];
    renderDayList();
    renderContent();
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  document.addEventListener('DOMContentLoaded', init);
})();
