// app.js - vanilla JS, localStorage-based CRUD, simple calc
(() => {
  const LS_KEY = 'tabunganData_v1';

  // DOM
  const addEntryBtn = document.getElementById('addEntryBtn');
  const formPanel = document.getElementById('formPanel');
  const entryForm = document.getElementById('entryForm');
  const dateInput = document.getElementById('date');
  const dayNameInput = document.getElementById('dayName');
  const noInput = document.getElementById('no');
  const moneyInInput = document.getElementById('moneyIn');
  const moneyOutInput = document.getElementById('moneyOut');
  const noteInput = document.getElementById('note');
  const cancelBtn = document.getElementById('cancelBtn');
  const entriesList = document.getElementById('entriesList');
  const emptyState = document.getElementById('emptyState');
  const currentBalance = document.getElementById('currentBalance');
  const formTitle = document.getElementById('formTitle');
  const saveBtn = document.getElementById('saveBtn');
  const openCalculator = document.getElementById('openCalculator');
  const calculatorModal = document.getElementById('calculatorModal');
  const calcDisplay = document.getElementById('calcDisplay');
  const calcButtons = document.querySelectorAll('.calc-btn');
  const calcOps = document.querySelectorAll('.calc-op');
  const calcEquals = document.getElementById('calcEquals');
  const calcClear = document.getElementById('calcClear');
  const calcBack = document.getElementById('calcBack');
  const closeCalc = document.getElementById('closeCalc');
  const confirmModal = document.getElementById('confirmModal');
  const confirmText = document.getElementById('confirmText');
  const confirmYes = document.getElementById('confirmYes');
  const confirmNo = document.getElementById('confirmNo');
  const confirmClose = document.getElementById('confirmClose');

  let data = [];
  let editId = null;
  let toDeleteId = null;

  // Helpers
  function saveToStorage() {
    localStorage.setItem(LS_KEY, JSON.stringify(data));
  }
  function loadFromStorage() {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
  function formatCurrency(val) {
    const n = Number(val) || 0;
    // Indonesian format
    return n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 });
  }
  function getDayName(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('id-ID', { weekday: 'long' });
  }
  function uid() { return 'id-'+Date.now()+'-'+Math.random().toString(36).slice(2,8); }

  // render
  function render() {
    entriesList.innerHTML = '';
    if (!data.length) {
      emptyState.classList.remove('hidden');
      currentBalance.textContent = formatCurrency(0);
      return;
    } else {
      emptyState.classList.add('hidden');
    }

    // sort by date desc (newest first)
    const sorted = [...data].sort((a,b) => new Date(b.date) - new Date(a.date));

    // compute total balance
    let totalIn = 0, totalOut = 0;
    for (const r of data) {
      totalIn += Number(r.in || 0);
      totalOut += Number(r.out || 0);
    }
    const balance = totalIn - totalOut;
    currentBalance.textContent = formatCurrency(balance);

    for (const entry of sorted) {
      const li = document.createElement('li');
      li.className = 'entry';

      const left = document.createElement('div');
      left.className = 'entry-left';

      const badge = document.createElement('div');
      badge.className = 'badge';
      const dt = new Date(entry.date + 'T00:00:00');
      const day = dt.getDate();
      const month = dt.toLocaleDateString('id-ID', { month: 'short' });
      badge.innerHTML = `${day}<br><span style="font-weight:600;font-size:12px">${month}</span>`;

      const body = document.createElement('div');
      body.className = 'entry-body';
      const title = document.createElement('div');
      title.innerHTML = `<div style="font-weight:700">${entry.note || '(tanpa keterangan)'}</div>`;
      const meta = document.createElement('div');
      meta.className = 'entry-meta';
      const dayName = getDayName(entry.date);
      meta.textContent = `${dayName} • ${entry.date}${entry.no ? ' • No: '+entry.no : ''}`;

      body.appendChild(title);
      body.appendChild(meta);

      left.appendChild(badge);
      left.appendChild(body);

      const right = document.createElement('div');
      right.style.textAlign = 'right';

      const amount = document.createElement('div');
      amount.className = 'entry-amount';
      const inAmt = Number(entry.in || 0);
      const outAmt = Number(entry.out || 0);
      if (inAmt > 0 && outAmt === 0) {
        amount.textContent = `+ ${formatCurrency(inAmt)}`;
        amount.style.color = 'green';
      } else if (outAmt > 0 && inAmt === 0) {
        amount.textContent = `- ${formatCurrency(outAmt)}`;
        amount.style.color = 'var(--danger)';
      } else {
        // both possible
        amount.textContent = `${formatCurrency(inAmt)} / ${formatCurrency(outAmt)}`;
      }

      const actions = document.createElement('div');
      actions.className = 'entry-actions';
      const editBtn = document.createElement('button');
      editBtn.className = 'ghost-btn';
      editBtn.textContent = 'Edit';
      editBtn.addEventListener('click', () => openEdit(entry.id));
      const delBtn = document.createElement('button');
      delBtn.className = 'danger-btn';
      delBtn.textContent = 'Hapus';
      delBtn.addEventListener('click', () => confirmDelete(entry.id, entry.note));

      actions.appendChild(editBtn);
      actions.appendChild(delBtn);

      right.appendChild(amount);
      right.appendChild(actions);

      li.appendChild(left);
      li.appendChild(right);
      entriesList.appendChild(li);
    }
  }

  // CRUD actions
  function openForm() {
    formPanel.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function closeForm() {
    formPanel.classList.add('hidden');
    editId = null;
    entryForm.reset();
    dayNameInput.value = '';
    formTitle.textContent = 'Tambah Catatan';
  }

  addEntryBtn.addEventListener('click', () => {
    openForm();
    // default date = today
    const today = new Date().toISOString().slice(0,10);
    dateInput.value = today;
    dayNameInput.value = getDayName(today);
    moneyInInput.value = 0;
    moneyOutInput.value = 0;
    noInput.value = '';
    noteInput.value = '';
    formTitle.textContent = 'Tambah Catatan';
  });

  cancelBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeForm();
  });

  dateInput.addEventListener('change', () => {
    dayNameInput.value = getDayName(dateInput.value);
  });

  entryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const date = dateInput.value;
    const no = noInput.value.trim();
    const inAmt = parseFloat(moneyInInput.value) || 0;
    const outAmt = parseFloat(moneyOutInput.value) || 0;
    const note = noteInput.value.trim();

    if (!date) {
      alert('Pilih tanggal.');
      return;
    }
    if (inAmt === 0 && outAmt === 0) {
      if (!confirm('Baik masuk maupun keluar bernilai 0. Lanjutkan?')) return;
    }

    if (editId) {
      // update
      const idx = data.findIndex(d => d.id === editId);
      if (idx >= 0) {
        data[idx] = {
          ...data[idx],
          date, no, in: inAmt, out: outAmt, note
        };
      }
      editId = null;
    } else {
      // create
      const item = {
        id: uid(),
        date,
        no,
        in: inAmt,
        out: outAmt,
        note
      };
      data.push(item);
    }

    saveToStorage();
    render();
    closeForm();
  });

  function openEdit(id) {
    const item = data.find(d => d.id === id);
    if (!item) return;
    editId = id;
    openForm();
    dateInput.value = item.date;
    dayNameInput.value = getDayName(item.date);
    noInput.value = item.no || '';
    moneyInInput.value = item.in || 0;
    moneyOutInput.value = item.out || 0;
    noteInput.value = item.note || '';
    formTitle.textContent = 'Edit Catatan';
  }

  // delete confirmation
  function confirmDelete(id, note) {
    toDeleteId = id;
    confirmText.textContent = `Yakin ingin menghapus catatan: "${note || '(tanpa keterangan)'}"?`;
    confirmModal.classList.remove('hidden');
  }
  confirmYes.addEventListener('click', () => {
    if (!toDeleteId) return;
    data = data.filter(d => d.id !== toDeleteId);
    saveToStorage();
    render();
    toDeleteId = null;
    confirmModal.classList.add('hidden');
  });
  confirmNo.addEventListener('click', () => {
    toDeleteId = null;
    confirmModal.classList.add('hidden');
  });
  confirmClose.addEventListener('click', () => {
    toDeleteId = null;
    confirmModal.classList.add('hidden');
  });

  // Calculator logic - only allow digits, ops, ., parentheses
  let calcExpr = '';
  function updateCalcDisplay() {
    calcDisplay.value = calcExpr || '0';
  }
  openCalculator.addEventListener('click', () => {
    calculatorModal.classList.remove('hidden');
    calculatorModal.setAttribute('aria-hidden','false');
    calcExpr = '';
    updateCalcDisplay();
  });
  closeCalc.addEventListener('click', () => {
    calculatorModal.classList.add('hidden');
    calculatorModal.setAttribute('aria-hidden','true');
  });

  calcButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      calcExpr += btn.dataset.val;
      updateCalcDisplay();
    });
  });
  calcOps.forEach(op => {
    op.addEventListener('click', () => {
      const o = op.dataset.op;
      // prevent double operators
      if (/[+\-*/]$/.test(calcExpr)) {
        calcExpr = calcExpr.slice(0,-1) + o;
      } else {
        calcExpr += o;
      }
      updateCalcDisplay();
    });
  });
  calcClear.addEventListener('click', () => {
    calcExpr = '';
    updateCalcDisplay();
  });
  calcBack.addEventListener('click', () => {
    calcExpr = calcExpr.slice(0, -1);
    updateCalcDisplay();
  });

  calcEquals.addEventListener('click', () => {
    if (!calcExpr) return;
    // validate: only digits, spaces, ., parentheses and operators allowed
    if (!/^[0-9+\-*/().\s]+$/.test(calcExpr)) {
      alert('Ekspresi tidak valid.');
      calcExpr = '';
      updateCalcDisplay();
      return;
    }
    try {
      // eslint-disable-next-line no-new-func
      const val = Function('"use strict";return (' + calcExpr + ')')();
      calcExpr = (Math.round((val + Number.EPSILON) * 100) / 100).toString();
      updateCalcDisplay();
    } catch (e) {
      alert('Kesalahan perhitungan.');
      calcExpr = '';
      updateCalcDisplay();
    }
  });

  // init
  function init() {
    data = loadFromStorage();
    render();
    // set placeholder date
    const today = new Date().toISOString().slice(0,10);
    dateInput.value = today;
    dayNameInput.value = getDayName(today);
  }

  init();

  // expose for debug (optional)
  window._tabungan = {
    data,
    reload: () => { data = loadFromStorage(); render(); }
  };
})();
