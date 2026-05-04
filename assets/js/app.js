// ============================================================
// STATE
// ============================================================
let STATE = {
  columns: [],
  data: [],       // array of row objects
  regType: 'simple',
  xCols: [],
  yCol: '',
  results: null,
  activeDataset: '',
  chartInstances: {}
};

// ============================================================
// MATRIX HELPER FUNCTIONS (Vanilla JS)
// ============================================================

/**
 * Matrix transpose: X^T
 */
function matrixTranspose(X) {
  const rows = X.length;
  const cols = X[0].length;
  const result = Array.from({length: cols}, () => Array(rows).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = X[i][j];
    }
  }
  return result;
}

/**
 * Matrix multiplication: A * B
 */
function matrixMultiply(A, B) {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;
  const result = Array.from({length: rowsA}, () => Array(colsB).fill(0));
  for (let i = 0; i < rowsA; i++) {
    for (let j = 0; j < colsB; j++) {
      for (let k = 0; k < colsA; k++) {
        result[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return result;
}

/**
 * Get matrix diagonal elements
 */
function matrixDiagonal(X) {
  const n = Math.min(X.length, X[0].length);
  const diag = [];
  for (let i = 0; i < n; i++) {
    diag.push(X[i][i]);
  }
  return diag;
}

/**
 * Matrix inverse using Gauss-Jordan elimination
 * Returns the inverse of a square matrix
 */
function matrixInverse(X) {
  const n = X.length;
  // Create augmented matrix [X | I]
  const aug = X.map((row, i) => [...row, ...Array(n).fill(0).map((_, j) => j === i ? 1 : 0)]);

  // Gauss-Jordan elimination
  for (let col = 0; col < n; col++) {
    // Find pivot
    let maxRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[maxRow][col])) {
        maxRow = row;
      }
    }
    [aug[col], aug[maxRow]] = [aug[maxRow], aug[col]];

    // Check for singular matrix
    if (Math.abs(aug[col][col]) < 1e-12) {
      continue;
    }

    // Scale pivot row
    const pivot = aug[col][col];
    for (let j = col; j < 2 * n; j++) {
      aug[col][j] /= pivot;
    }

    // Eliminate other rows
    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = aug[row][col];
      for (let j = col; j < 2 * n; j++) {
        aug[row][j] -= factor * aug[col][j];
      }
    }
  }

  // Extract inverse
  return aug.map(row => row.slice(n, 2 * n));
}

/**
 * Student's t-distribution critical values (approximate)
 * Using a simplified approximation for two-tailed test
 */
function tCriticalValue(df, alpha = 0.05) {
  // Accurate critical t-values for two-tailed α=0.05 from standard t-table
  if (df <= 0) return Infinity;
  const tTable = {
    1:12.706, 2:4.303, 3:3.182, 4:2.776, 5:2.571,
    6:2.447, 7:2.365, 8:2.306, 9:2.262, 10:2.228,
    11:2.201, 12:2.179, 13:2.160, 14:2.145, 15:2.131,
    16:2.120, 17:2.110, 18:2.101, 19:2.093, 20:2.086,
    21:2.080, 22:2.074, 23:2.069, 24:2.064, 25:2.060,
    26:2.056, 27:2.052, 28:2.048, 29:2.045, 30:2.042,
    35:2.030, 40:2.021, 45:2.014, 50:2.009, 60:2.000,
    70:1.994, 80:1.990, 90:1.987, 100:1.984, 120:1.980
  };
  if (tTable[df] !== undefined) return tTable[df];
  // Linear interpolation between nearest known values
  const keys = Object.keys(tTable).map(Number).sort((a,b) => a - b);
  if (df > 120) return 1.960;
  let lo = keys[0], hi = keys[keys.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (keys[i] <= df && keys[i+1] >= df) { lo = keys[i]; hi = keys[i+1]; break; }
  }
  const ratio = (df - lo) / (hi - lo);
  return tTable[lo] + ratio * (tTable[hi] - tTable[lo]);
}

/**
 * F-distribution upper critical values at α = 0.05.
 * Uses a full two-dimensional lookup table (df1 = 1–10, df2 = 1–120)
 * with linear interpolation between breakpoints.
 * df1 > 10 falls back to the df1 = 10 row (conservative under-rejection).
 */
function fCriticalValue(df1, df2) {
  if (df1 <= 0 || df2 <= 0) return Infinity;
  // df2 breakpoints used in every row
  const df2Pts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 24, 30, 40, 60, 120];
  // Critical values at α = 0.05 from standard statistical tables
  const rows = [
    /* df1= 1 */[161.4,18.51,10.13,7.71,6.61,5.99,5.59,5.32,5.12,4.96,4.75,4.54,4.35,4.26,4.17,4.08,4.00,3.92],
    /* df1= 2 */[199.5,19.00, 9.55,6.94,5.79,5.14,4.74,4.46,4.26,4.10,3.89,3.68,3.49,3.40,3.32,3.23,3.15,3.07],
    /* df1= 3 */[215.7,19.16, 9.28,6.59,5.41,4.76,4.35,4.07,3.86,3.71,3.49,3.29,3.10,3.01,2.92,2.84,2.76,2.68],
    /* df1= 4 */[224.6,19.25, 9.12,6.39,5.19,4.53,4.12,3.84,3.63,3.48,3.26,3.06,2.87,2.78,2.69,2.61,2.53,2.45],
    /* df1= 5 */[230.2,19.30, 9.01,6.26,5.05,4.39,3.97,3.69,3.48,3.33,3.11,2.90,2.71,2.62,2.53,2.45,2.37,2.29],
    /* df1= 6 */[234.0,19.33, 8.94,6.16,4.95,4.28,3.87,3.58,3.37,3.22,3.00,2.79,2.60,2.51,2.42,2.34,2.25,2.17],
    /* df1= 7 */[236.8,19.35, 8.89,6.09,4.88,4.21,3.79,3.50,3.29,3.14,2.91,2.71,2.51,2.42,2.33,2.25,2.17,2.09],
    /* df1= 8 */[238.9,19.37, 8.85,6.04,4.82,4.15,3.73,3.44,3.23,3.07,2.85,2.64,2.45,2.36,2.27,2.18,2.10,2.02],
    /* df1= 9 */[240.5,19.38, 8.81,5.99,4.77,4.10,3.68,3.39,3.18,3.02,2.80,2.59,2.39,2.30,2.21,2.12,2.04,1.96],
    /* df1=10 */[241.9,19.40, 8.79,5.96,4.74,4.06,3.64,3.35,3.14,2.98,2.75,2.54,2.35,2.25,2.16,2.08,1.99,1.91],
  ];
  const rowIdx = Math.min(Math.max(Math.round(df1), 1), 10) - 1;
  const row = rows[rowIdx];
  if (df2 <= df2Pts[0]) return row[0];
  if (df2 >= df2Pts[df2Pts.length - 1]) return row[row.length - 1];
  for (let i = 0; i < df2Pts.length - 1; i++) {
    if (df2Pts[i] <= df2 && df2Pts[i + 1] >= df2) {
      const t = (df2 - df2Pts[i]) / (df2Pts[i + 1] - df2Pts[i]);
      return row[i] + t * (row[i + 1] - row[i]);
    }
  }
  return row[row.length - 1];
}

// Steps definition
const STEPS = [
  { num:1, label:'Load Data',   icon:'📂' },
  { num:2, label:'Train Model', icon:'🧠' },
  { num:3, label:'Visualize',   icon:'📈' },
  { num:4, label:'Evaluate',    icon:'📋' },
  { num:5, label:'Insights',    icon:'💬' },
];

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  renderSteps(1);
});

// ============================================================
// STEP PROGRESS RENDERER
// ============================================================
function renderSteps(current) {
  const wrap = document.getElementById('stepsWrap');
  wrap.innerHTML = '';
  STEPS.forEach((s, i) => {
    const item = document.createElement('div');
    item.className = 'step-item' + (current >= s.num ? (current === s.num ? ' active' : ' done') : '');

    const circle = document.createElement('div');
    circle.className = 'step-circle' + (current >= s.num ? (current > s.num ? ' done' : ' active') : '');
    circle.innerHTML = current > s.num ? '✓' : s.icon;

    const lbl = document.createElement('span');
    lbl.className = 'step-label';
    lbl.textContent = s.label;

    item.appendChild(circle);
    item.appendChild(lbl);
    wrap.appendChild(item);

    if (i < STEPS.length - 1) {
      const conn = document.createElement('div');
      conn.className = 'step-connector' + (current > s.num ? ' done' : '');
      wrap.appendChild(conn);
    }
  });
}

// ============================================================
// DATA LOADING — BUILT-IN (pure client-side, no backend)
// ============================================================
function loadBuiltIn(id) {
  showLoading(true);
  clearAlert('dataAlert');
  STATE.activeDataset = id;

  // Highlight active button
  document.querySelectorAll('.ds-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.ds-btn[onclick*="'${id}'"]`)?.classList.add('active');

  const sample = id === 'house_price' ? HOUSE_DATA : CAR_DATA;
  handleDataLoaded(sample);
  showLoading(false);
}

// ============================================================
// DATA LOADING — MANUAL ENTRY
// ============================================================
function loadManualData() {
  clearAlert('dataAlert');
  const colsRaw = (document.getElementById('manualColumns').value || '').trim();
  const rowsRaw = (document.getElementById('manualRows').value || '').trim();
  if (!colsRaw || !rowsRaw) {
    showAlert('dataAlert', '⚠️ Please provide both column names and at least one row.', 'danger');
    return;
  }
  const columns = colsRaw.split(',').map(s => s.trim()).filter(Boolean);
  const lines   = rowsRaw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const rows = [];
  for (const line of lines) {
    const parts = line.split(',').map(s => s.trim());
    if (parts.length !== columns.length) {
      showAlert('dataAlert',
        `⚠️ Row "${line}" has ${parts.length} values but ${columns.length} columns are defined.`, 'danger');
      return;
    }
    const row = {};
    for (let i = 0; i < columns.length; i++) {
      const v = parseFloat(parts[i]);
      if (Number.isNaN(v)) {
        showAlert('dataAlert', `⚠️ Non-numeric value "${parts[i]}" in row "${line}".`, 'danger');
        return;
      }
      row[columns[i]] = v;
    }
    rows.push(row);
  }
  if (rows.length < 3) {
    showAlert('dataAlert', '⚠️ Provide at least 3 rows of data.', 'danger');
    return;
  }
  STATE.activeDataset = 'manual';
  document.querySelectorAll('.ds-btn').forEach(b => b.classList.remove('active'));
  handleDataLoaded({ columns, rows, shape: [rows.length, columns.length] });
}

// ============================================================
// DATA LOADING — FILE UPLOAD
// ============================================================
function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  processCSVFile(file);
}

function handleDrop(event) {
  event.preventDefault();
  document.getElementById('uploadArea').classList.remove('dragover');
  const file = event.dataTransfer.files[0];
  if (file && file.name.endsWith('.csv')) processCSVFile(file);
}

function processCSVFile(file) {
  showLoading(true);
  STATE.activeDataset = 'custom';

  Papa.parse(file, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    complete: function(results) {
      const cols = results.meta.fields;
      const rows = results.data;
      handleDataLoaded({
        columns: cols,
        rows: rows,
        shape: [rows.length, cols.length]
      });
      showLoading(false);
    },
    error: function() {
      showAlert('dataAlert', '⚠️ Failed to parse CSV file.', 'danger');
      showLoading(false);
    }
  });
}

// ============================================================
// HANDLE LOADED DATA
// ============================================================
function handleDataLoaded(json) {
  clearAlert('dataAlert');

  // Validate empty dataset
  if (!json.rows || json.rows.length === 0) {
    showAlert('dataAlert', '⚠️ The dataset is empty. Please provide a file with at least 3 rows of data.', 'danger');
    return;
  }
  if (json.rows.length < 3) {
    showAlert('dataAlert', '⚠️ The dataset has fewer than 3 rows. Please provide more data for meaningful analysis.', 'danger');
    return;
  }
  // Check for duplicate column names
  const colSet = new Set(json.columns);
  if (colSet.size !== json.columns.length) {
    const dupes = json.columns.filter((c, i) => json.columns.indexOf(c) !== i);
    showAlert('dataAlert', `⚠️ Duplicate column names detected: "${[...new Set(dupes)].join('", "')}". Please fix the dataset.`, 'danger');
    return;
  }
  // Identify numeric columns (at least one value must be numeric)
  const numericCols = json.columns.filter(col =>
    json.rows.some(r => r[col] !== null && r[col] !== undefined && r[col] !== '' && !isNaN(parseFloat(r[col])))
  );
  if (numericCols.length < 2) {
    showAlert('dataAlert', '⚠️ Need at least 2 numeric columns for regression. Check that your data contains numeric values.', 'danger');
    return;
  }

  STATE.columns = numericCols;
  STATE.data    = json.rows;
  STATE.results = null;
  STATE.xCols   = [];
  STATE.yCol    = '';

  // Warn if some columns were excluded
  const excludedCols = json.columns.filter(c => !numericCols.includes(c));
  if (excludedCols.length > 0) {
    showAlert('dataAlert', `ℹ️ Non-numeric columns excluded: "${excludedCols.join('", "')}". Only numeric columns are available for regression.`, 'warning');
  }

  // Badges
  const info = document.getElementById('dataInfo');
  info.classList.remove('hidden');
  info.style.display = 'flex';
  document.getElementById('rowBadge').textContent = `📊 ${json.shape[0]} rows`;
  document.getElementById('colBadge').textContent = `🔢 ${json.shape[1]} columns`;
  document.getElementById('dsBadge').textContent  =
    STATE.activeDataset === 'house_price' ? '🏠 House Price Dataset' :
    STATE.activeDataset === 'car_price'   ? '🚗 Car Price Dataset'   :
    STATE.activeDataset === 'manual'      ? '✏️ Manual Dataset'      : '📁 Custom Dataset';

  // Table
  renderTable(json.columns, json.rows);

  // Show model section
  document.getElementById('sec-model').classList.remove('hidden');
  renderXPills();
  renderYSelect();
  renderSteps(2);

  // Hide results sections
  ['sec-viz','sec-eval','sec-rec'].forEach(id => document.getElementById(id).classList.add('hidden'));

  // Scroll
  setTimeout(() => document.getElementById('sec-model').scrollIntoView({behavior:'smooth',block:'start'}), 300);
}

// ============================================================
// RENDER TABLE
// ============================================================
function renderTable(cols, rows) {
  const wrap = document.getElementById('tableWrap');
  wrap.classList.remove('hidden');

  let html = '<table><thead><tr>';
  cols.forEach(c => html += `<th>${c}</th>`);
  html += '</tr></thead><tbody>';

  const maxRows = Math.min(rows.length, 100);
  for (let i = 0; i < maxRows; i++) {
    html += '<tr>';
    cols.forEach(c => html += `<td>${rows[i][c] !== undefined ? rows[i][c] : ''}</td>`);
    html += '</tr>';
  }
  html += '</tbody></table>';
  wrap.innerHTML = html;
}

// ============================================================
// REGRESSION TYPE
// ============================================================
function setRegType(type) {
  STATE.regType = type;
  STATE.xCols = [];

  const btnS = document.getElementById('btnSimple');
  const btnM = document.getElementById('btnMultiple');

  if (type === 'simple') {
    btnS.className = 'btn btn-navy';
    btnM.style.cssText = 'background:var(--bg);color:var(--navy);border:2px solid var(--border);';
    btnM.className = 'btn';
    document.getElementById('regTypeHint').textContent = 'One input (X) → One output (Y)';
    document.getElementById('xHint').textContent = '(select one)';
  } else {
    btnM.className = 'btn btn-navy';
    btnS.style.cssText = 'background:var(--bg);color:var(--navy);border:2px solid var(--border);';
    btnS.className = 'btn';
    document.getElementById('regTypeHint').textContent = 'Multiple inputs (X₁, X₂, ...) → One output (Y)';
    document.getElementById('xHint').textContent = '(select multiple)';
  }
  renderXPills();
}

// ============================================================
// RENDER PILLS & SELECT
// ============================================================
function renderXPills() {
  const wrap = document.getElementById('xPills');
  wrap.innerHTML = '';
  STATE.columns.forEach(col => {
    const p = document.createElement('div');
    p.className = 'pill' + (STATE.xCols.includes(col) ? ' selected' : '');
    p.textContent = col;
    p.onclick = () => toggleXCol(col, p);
    wrap.appendChild(p);
  });
}

function toggleXCol(col, el) {
  if (STATE.regType === 'simple') {
    STATE.xCols = [col];
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('selected'));
    el.classList.add('selected');
  } else {
    if (STATE.xCols.includes(col)) {
      STATE.xCols = STATE.xCols.filter(c => c !== col);
      el.classList.remove('selected');
    } else {
      STATE.xCols.push(col);
      el.classList.add('selected');
    }
  }
}

function renderYSelect() {
  const sel = document.getElementById('ySelect');
  sel.innerHTML = '<option value="">-- Select Y variable --</option>';
  STATE.columns.forEach(col => {
    const o = document.createElement('option');
    o.value = col; o.textContent = col;
    sel.appendChild(o);
  });
  sel.onchange = () => { STATE.yCol = sel.value; };
}

// ============================================================
// TRAIN MODEL
// ============================================================
function trainModel() {
  STATE.yCol = document.getElementById('ySelect').value;
  clearAlert('modelAlert');

  // --- Validation Layer ---
  if (STATE.xCols.length === 0) {
    showAlert('modelAlert','⚠️ Please select at least one X variable.','danger'); return;
  }
  if (!STATE.yCol) {
    showAlert('modelAlert','⚠️ Please select the Y (output) variable.','danger'); return;
  }
  if (STATE.xCols.includes(STATE.yCol)) {
    showAlert('modelAlert','⚠️ X and Y cannot be the same variable.','danger'); return;
  }
  if (STATE.regType === 'simple' && STATE.xCols.length > 1) {
    showAlert('modelAlert','⚠️ Simple regression allows only one X variable.','danger'); return;
  }
  // Check for duplicate X columns
  if (new Set(STATE.xCols).size !== STATE.xCols.length) {
    showAlert('modelAlert','⚠️ Duplicate X variables detected. Please remove duplicates.','danger'); return;
  }
  // Check dataset is not empty
  if (!STATE.data || STATE.data.length === 0) {
    showAlert('modelAlert','⚠️ No dataset loaded. Please load data first.','danger'); return;
  }
  // Validate numeric data in selected columns before training
  const allCols = [...STATE.xCols, STATE.yCol];
  const validRows = STATE.data.filter(r =>
    allCols.every(c => r[c] !== null && r[c] !== undefined && r[c] !== '' && !isNaN(parseFloat(r[c])))
  );
  const droppedCount = STATE.data.length - validRows.length;
  if (validRows.length === 0) {
    showAlert('modelAlert','⚠️ All rows contain non-numeric or missing values in the selected columns. Cannot train.','danger'); return;
  }
  if (validRows.length < STATE.xCols.length + 2) {
    showAlert('modelAlert',`⚠️ Not enough valid rows (${validRows.length}) for ${STATE.xCols.length} predictor(s). Need at least ${STATE.xCols.length + 2} rows.`,'danger'); return;
  }
  // Check for zero-variance in Y
  const yVals = validRows.map(r => parseFloat(r[STATE.yCol]));
  const yUnique = new Set(yVals);
  if (yUnique.size === 1) {
    showAlert('modelAlert','⚠️ The target variable Y has no variance (all values are the same). Regression is not meaningful.','danger'); return;
  }

  const btn = document.getElementById('trainBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Training...';

  // Defer by one frame so the spinner repaints before computation begins.
  setTimeout(() => {
    const json = computeLocalRegression();
    if (json) {
      STATE.results = json;
      if (droppedCount > 0) {
        showAlert('modelAlert',`⚠️ ${droppedCount} row(s) with missing/non-numeric values were excluded from training.`,'warning');
      }
      renderResults(json);
    } else {
      showAlert('modelAlert',
        '⚠️ Training failed. The matrix may be singular (perfectly collinear predictors) or insufficient rows remain after filtering. Check your column selection.',
        'danger');
    }
    btn.disabled = false;
    btn.innerHTML = '🔄 Retrain Model';
    btn.className = 'btn btn-navy';
    setTimeout(() => { btn.innerHTML = '🚀 Train Model'; btn.className = 'btn btn-gold'; }, 3000);
  }, 20);
}

// ============================================================
// GENERATE RECOMMENDATIONS
// ============================================================
function generateRecs(r2, xCols, coefs, extraInfo) {
  const recs  = [];
  const r2Pct = Math.round(r2 * 100);
  const r2Str = r2.toFixed(3);
  // yCol is passed via extraInfo so coefficient text can name the outcome variable
  const yLabel = (extraInfo && extraInfo.yCol) ? extraInfo.yCol : 'Y';

  // 1. R² Interpretation (5-tier classification)
  if (r2 >= 1.0)
    recs.push({type:'success', title:'Perfect Fit',
      text:`R² = ${r2Str} — The model explains 100% of the variance in "${yLabel}". All data points lie exactly on the regression line. This is a perfect linear relationship.`});
  else if (r2 >= 0.90)
    recs.push({type:'success', title:'Nearly Perfect Fit',
      text:`R² = ${r2Str} — The model explains ${r2Pct}% of the variance in "${yLabel}". This indicates a very strong linear relationship between the selected predictors and the outcome.`});
  else if (r2 >= 0.70)
    recs.push({type:'info', title:'Good Model Fit',
      text:`R² = ${r2Str} — The model explains ${r2Pct}% of the variance in "${yLabel}". The remaining ${100 - r2Pct}% is unexplained. The model captures the main trend well but there is room for improvement.`});
  else if (r2 >= 0.40)
    recs.push({type:'warning', title:'Poor Model Fit',
      text:`R² = ${r2Str} — The model explains only ${r2Pct}% of the variance in "${yLabel}". The linear model captures some pattern but leaves substantial variance unexplained. Consider adding more predictors or investigating non-linear relationships.`});
  else
    recs.push({type:'danger', title:'No Linear Relation',
      text:`R² = ${r2Str} — Only ${r2Pct}% of the variance in "${yLabel}" is explained. There appears to be no meaningful linear relationship. Consider transforming variables, adding interaction terms, or exploring a non-linear model.`});

  // 2. Coefficient Interpretation — direction and effect size per predictor
  const sorted = [...coefs].sort((a, b) => Math.abs(b.val) - Math.abs(a.val));
  sorted.forEach(c => {
    const direction = c.val > 0 ? 'increases' : 'decreases';
    const arrow     = c.val > 0 ? '↑' : '↓';
    const signedStr = `${c.val >= 0 ? '+' : ''}${c.val.toFixed(3)}`;
    recs.push({
      type:  'info',
      title: `${arrow} ${c.col}  (β = ${signedStr})`,
      text:  `For each 1-unit increase in "${c.col}", the predicted "${yLabel}" ${direction} by ${Math.abs(c.val).toFixed(3)} units${xCols.length > 1 ? ', holding all other predictors constant' : ''}.`
    });
  });

  // 3. Feature Influence Ranking (only meaningful with 2+ predictors)
  if (sorted.length > 1) {
    const best  = sorted[0];
    const worst = sorted[sorted.length - 1];
    recs.push({type:'info', title:'Feature Influence Ranking',
      text:`Strongest predictor: "${best.col}" (|β| = ${Math.abs(best.val).toFixed(3)}). Weakest predictor: "${worst.col}" (|β| = ${Math.abs(worst.val).toFixed(3)}). Note: rankings reflect raw coefficient magnitudes and depend on variable scale.`});
  }

  // 4. Model Suitability Assessment
  if (r2 >= 0.90) {
    recs.push({type:'success', title:'Model Highly Suitable for Prediction',
      text:`R² = ${r2Str} — The model explains nearly all of the variance and is highly suitable for predictions within the observed data range. Avoid extrapolating beyond the range of the training data.`});
  } else if (r2 >= 0.70) {
    recs.push({type:'info', title:'Model Suitable for Prediction',
      text:`R² = ${r2Str} — The model explains most of the variance and can be used for predictions, though some unexplained variation remains. Consider whether the accuracy is acceptable for your use case.`});
  } else if (r2 >= 0.40) {
    recs.push({type:'warning', title:'Model Needs Improvement',
      text:'The model captures some patterns but leaves substantial variance unexplained. Suggested actions: (1) add more relevant predictors, (2) check for and remove outliers, (3) investigate non-linear relationships, (4) increase the sample size.'});
  } else {
    recs.push({type:'danger', title:'Model Inadequate for Prediction',
      text:'The linear model fits the data poorly — there is essentially no linear relationship. Possible causes: (1) the true relationship is non-linear, (2) key predictors are missing, or (3) the data contains significant noise or outliers. Consider polynomial regression or additional feature engineering.'});
  }

  // 5. Sample Size Analysis
  const n = extraInfo && extraInfo.n ? extraInfo.n : 0;
  const p = extraInfo && extraInfo.k ? extraInfo.k : xCols.length;
  if (n > 0 && n < 10 * p) {
    recs.push({type:'warning', title:'Small Sample Size Warning',
      text:`The dataset has ${n} observations for ${p} predictor(s). Statistical guidelines recommend at least 10–20 observations per predictor for stable and reliable coefficient estimates. Consider collecting more data.`});
  } else if (n > 0) {
    recs.push({type:'success', title:'Adequate Sample Size',
      text:`${n} observations for ${p} predictor(s) provides a healthy observation-to-predictor ratio, supporting reliable coefficient estimation.`});
  }

  // 6. Targeted Improvement Suggestions
  const suggestions = [];
  if (r2 < 0.90) suggestions.push('include additional predictors that may explain more variance');
  if (n > 0 && n < 50) suggestions.push(`collect more observations (current: ${n}; recommended: 50+)`);
  if (sorted.some(c => Math.abs(c.val) < 0.001)) suggestions.push('consider removing near-zero-coefficient predictors — they contribute negligible predictive value');
  if (suggestions.length > 0) {
    recs.push({type:'info', title:'Improvement Suggestions',
      text:`To strengthen this model: ${suggestions.join('; ')}.`});
  }

  return recs;
}

// ============================================================
// CHARTS
// ============================================================
function destroyChart(id) {
  if (STATE.chartInstances[id]) {
    STATE.chartInstances[id].destroy();
    delete STATE.chartInstances[id];
  }
}

function renderCharts(json) {
  const isMultiple = STATE.xCols.length > 1;

  // --- Chart 1: Scatter + Regression Line ---
  destroyChart('scatterChart');
  const scatterCtx = document.getElementById('scatterChart').getContext('2d');

  if (isMultiple) {
    // Multiple regression: show Predicted vs Actual with perfect-fit 45° line
    const avpData = json.actual_vs_pred.map(d => ({x: d.predicted, y: d.actual}));
    const allVals = avpData.flatMap(d => [d.x, d.y]);
    const minVal = Math.min(...allVals);
    const maxVal = Math.max(...allVals);
    STATE.chartInstances['scatterChart'] = new Chart(scatterCtx, {
      type:'scatter',
      data:{
        datasets:[
          {
            label:'Predicted vs Actual',
            data: avpData,
            backgroundColor:'rgba(27,42,94,0.7)',
            pointRadius:5, pointHoverRadius:7
          },
          {
            label:'Perfect Fit (45° line)',
            data:[{x:minVal, y:minVal},{x:maxVal, y:maxVal}],
            type:'line', borderColor:'#C8972B',
            borderWidth:3, pointRadius:0,
            fill:false, tension:0, borderDash:[6,3]
          }
        ]
      },
      options:{
        responsive:true, animation:{duration:800},
        plugins:{legend:{labels:{font:{size:11},boxWidth:14}}},
        scales:{
          x:{grid:{color:'#e5e7eb'},ticks:{font:{size:10}},title:{display:true,text:'Predicted',font:{size:11}}},
          y:{grid:{color:'#e5e7eb'},ticks:{font:{size:10}},title:{display:true,text:'Actual',font:{size:11}}}
        }
      }
    });
  } else {
    // Simple regression: show X vs Y scatter with regression line
    const sorted = [...json.scatter_data].sort((a,b) => a.x - b.x);
    STATE.chartInstances['scatterChart'] = new Chart(scatterCtx, {
      type:'scatter',
      data:{
        datasets:[
          {
            label:'Actual Data',
            data: sorted.map(d => ({x:d.x, y:d.y})),
            backgroundColor:'rgba(27,42,94,0.7)',
            pointRadius:5, pointHoverRadius:7
          },
          {
            label:'Regression Line',
            data:[
              {x:sorted[0].x, y:sorted[0].predicted},
              {x:sorted[sorted.length-1].x, y:sorted[sorted.length-1].predicted}
            ],
            type:'line', borderColor:'#C8972B',
            borderWidth:3, pointRadius:0,
            fill:false, tension:0
          }
        ]
      },
      options:{
        responsive:true, animation:{duration:800},
        plugins:{legend:{labels:{font:{size:11},boxWidth:14}}},
        scales:{
          x:{grid:{color:'#e5e7eb'},ticks:{font:{size:10}},title:{display:true,text:STATE.xCols[0] || 'X (Input)',font:{size:11}}},
          y:{grid:{color:'#e5e7eb'},ticks:{font:{size:10}},title:{display:true,text:STATE.yCol || 'Y (Output)',font:{size:11}}}
        }
      }
    });
  }

  // Update scatter chart panel title to reflect what is being plotted
  const scatterTitleEl = document.getElementById('scatterChart')
    ?.closest('.chart-box')?.querySelector('.chart-title');
  if (scatterTitleEl) {
    scatterTitleEl.textContent = isMultiple
      ? '\uD83C\uDFAF Predicted vs Actual Scatter'
      : `\uD83D\uDCCD ${STATE.xCols[0] || 'X'} vs ${STATE.yCol || 'Y'}`;
  }

  // --- Chart 2: Actual vs Predicted ---
  destroyChart('avpChart');
  const avpCtx = document.getElementById('avpChart').getContext('2d');
  const avpLabels = json.actual_vs_pred.map((_,i) => `S${i+1}`);
  STATE.chartInstances['avpChart'] = new Chart(avpCtx, {
    type:'line',
    data:{
      labels: avpLabels,
      datasets:[
        {
          label:'Actual', data: json.actual_vs_pred.map(d=>d.actual),
          borderColor:'#1B2A5E', backgroundColor:'rgba(27,42,94,0.1)',
          borderWidth:2.5, pointRadius:4, tension:0.3
        },
        {
          label:'Predicted', data: json.actual_vs_pred.map(d=>d.predicted),
          borderColor:'#C8972B', backgroundColor:'rgba(200,151,43,0.1)',
          borderWidth:2.5, pointRadius:4, borderDash:[6,3], tension:0.3
        }
      ]
    },
    options:{
      responsive:true, animation:{duration:900},
      plugins:{legend:{labels:{font:{size:11},boxWidth:14}}},
      scales:{
        x:{grid:{color:'#e5e7eb'},ticks:{font:{size:9}}},
        y:{grid:{color:'#e5e7eb'},ticks:{font:{size:10}}, title:{display:true, text:STATE.yCol || 'Y (Output)', font:{size:11}}}
      }
    }
  });

  // --- Chart 3: Residuals ---
  destroyChart('residualChart');
  const resCtx = document.getElementById('residualChart').getContext('2d');
  const residuals = json.actual_vs_pred.map(d => parseFloat((d.actual - d.predicted).toFixed(2)));
  STATE.chartInstances['residualChart'] = new Chart(resCtx, {
    type:'bar',
    data:{
      labels: json.actual_vs_pred.map((_,i)=>`S${i+1}`),
      datasets:[{
        label:'Residual',
        data: residuals,
        backgroundColor: residuals.map(v => v >= 0 ? 'rgba(27,42,94,0.75)' : 'rgba(200,151,43,0.75)'),
        borderColor:     residuals.map(v => v >= 0 ? '#1B2A5E' : '#C8972B'),
        borderWidth:1.5, borderRadius:4
      }]
    },
    options:{
      responsive:true, animation:{duration:1000},
      plugins:{
        legend:{display:false},
        annotation:{annotations:{zero:{type:'line',yMin:0,yMax:0,borderColor:'#1B2A5E',borderWidth:2,borderDash:[4,4]}}}
      },
      scales:{
        x:{grid:{color:'#e5e7eb'},ticks:{font:{size:9}}},
        y:{grid:{color:'#e5e7eb'},ticks:{font:{size:10}}}
      }
    }
  });
}

// ============================================================
// EVALUATION RENDER
// ============================================================
function renderEvaluation(json) {
  const {r2, mse, rmse, se, equation, coefficients, intercept, anova, ttest, confidenceIntervals} = json;
  const r2Pct   = Math.min(Math.round(r2*100),100);
  const r2Color = r2 >= 1.0 ? '#06b6d4' : r2 >= 0.90 ? '#10b981' : r2 >= 0.70 ? '#3b82f6' : r2 >= 0.40 ? '#f59e0b' : '#ef4444';
  const r2Label = r2 >= 1.0 ? 'Perfect Fit 🎯' : r2 >= 0.90 ? 'Nearly Perfect ✅' : r2 >= 0.70 ? 'Good Fit 👍' : r2 >= 0.40 ? 'Poor Fit ⚠️' : 'No Relation ❌';

  // R² block
  const block = document.getElementById('r2Block');
  block.style.borderColor  = r2Color;
  block.style.background   = `linear-gradient(135deg,${r2Color}15,${r2Color}05)`;
  document.getElementById('r2Val').textContent   = r2;
  document.getElementById('r2Val').style.color   = r2Color;
  document.getElementById('r2Label').textContent = r2Label;
  document.getElementById('r2Label').style.color = r2Color;
  document.getElementById('r2Pct').textContent   = r2Pct + '%';
  document.getElementById('r2Pct').style.color   = r2Color;
  document.getElementById('r2Desc').textContent  =
    `The model explains ${r2Pct}% of the variance in "${STATE.yCol || 'the output variable'}".`;


  // MSE / RMSE only (removed MAE and Adj R² per syllabus)
  // Safe number formatter: guards NaN/Infinity, formats large numbers readably
  const fmtNum = v => {
    if (v === null || v === undefined || !isFinite(v) || isNaN(v)) return '\u2014';
    const abs = Math.abs(v);
    if (abs >= 1e9)  return v.toExponential(2);
    if (abs >= 1e6)  return Math.round(v).toLocaleString('en');
    if (abs >= 1000) return v.toLocaleString('en', {minimumFractionDigits:2, maximumFractionDigits:2});
    if (abs > 0 && abs < 0.0001) return v.toExponential(3);
    return v.toFixed(4);
  };
  document.getElementById('metricsRow').innerHTML = `
    <div class="metric-box">
      <div class="metric-val">${fmtNum(mse)}</div>
      <div class="metric-name">MSE</div>
      <div class="metric-sub">Mean Squared Error</div>
    </div>
    <div class="metric-box">
      <div class="metric-val">${fmtNum(rmse)}</div>
      <div class="metric-name">RMSE</div>
      <div class="metric-sub">Root MSE — same unit as Y</div>
    </div>
  `;

  // Equation
  document.getElementById('equationBox').textContent = equation;

  // Standard Error of Estimate
  document.getElementById('seBox').innerHTML = `
    <div>
      <div class="se-value">${fmtNum(se)}</div>
      <div class="se-label">Standard Error of Estimate (SE)</div>
    </div>
    <div class="se-desc">Average distance between observed values and the regression line. Lower SE = better fit.</div>
  `;

  // ANOVA Table
  if (anova) {
    const fCrit = anova.fCritical.toFixed(2);
    const fSig = anova.fStatistic > anova.fCritical ? 'Significant' : 'Not Significant';
    const fClass = anova.fStatistic > anova.fCritical ? 'anova-sig' : 'anova-not-sig';

    document.getElementById('anovaTable').innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Source of Variation</th>
            <th>DF</th>
            <th>SS (Sum of Squares)</th>
            <th>MS (Mean Square)</th>
            <th>F-Statistic</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Regression</strong></td>
            <td>${anova.dfRegression}</td>
            <td>${fmtNum(anova.ssRegression)}</td>
            <td>${fmtNum(anova.msRegression)}</td>
            <td rowspan="2" style="text-align:center;font-size:1.1rem;">
              <div style="font-weight:800;">${anova.fStatistic.toFixed(3)}</div>
              <div style="font-size:0.75rem;color:var(--muted);">F-critical = ${fCrit}</div>
              <div style="font-size:0.75rem;" class="${fClass}">${fSig}</div>
            </td>
          </tr>
          <tr>
            <td><strong>Residual (Error)</strong></td>
            <td>${anova.dfResidual}</td>
            <td>${fmtNum(anova.ssResidual)}</td>
            <td>${fmtNum(anova.msResidual)}</td>
          </tr>
          <tr class="anova-total">
            <td><strong>Total</strong></td>
            <td>${anova.dfTotal}</td>
            <td>${fmtNum(anova.ssTotal)}</td>
            <td>—</td>
            <td>—</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top:10px;font-size:0.8rem;color:var(--muted);">
        <strong>F = MSR / MSE = ${fmtNum(anova.msRegression)} / ${fmtNum(anova.msResidual)} = ${anova.fStatistic.toFixed(3)}</strong>
        &nbsp;&nbsp;(F-critical at α=0.05: ${fCrit})
        <br>${anova.fStatistic > anova.fCritical
          ? '→ F > F-critical: Reject H₀ — the overall regression model is statistically significant.'
          : '→ F ≤ F-critical: Fail to reject H₀ — the overall regression model is not statistically significant.'}
      </div>
    `;
  }

  // t-Test Results
  if (ttest) {
    const tCrit = ttest.criticalValue.toFixed(3);
    let tHtml = `
      <table>
        <thead>
          <tr>
            <th>Coefficient</th>
            <th>Variable</th>
            <th>Estimate</th>
            <th>Std Error</th>
            <th>t-Statistic</th>
            <th>Critical t (α=0.05)</th>
            <th>Decision</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Intercept
    const interceptSig = Math.abs(ttest.intercept.tStat) > ttest.criticalValue;
    tHtml += `
      <tr class="${interceptSig ? 'ttest-sig' : 'ttest-not-sig'}">
        <td><strong>β₀ (Intercept)</strong></td>
        <td>—</td>
        <td>${fmtNum(ttest.intercept.estimate)}</td>
        <td>${fmtNum(ttest.intercept.stdError)}</td>
        <td>${ttest.intercept.tStat.toFixed(4)}</td>
        <td>±${tCrit}</td>
        <td>${interceptSig ? 'Significant ✓' : 'Not Significant'}</td>
      </tr>
    `;

    // Slopes
    ttest.slopes.forEach((s, i) => {
      const slopeSig = Math.abs(s.tStat) > ttest.criticalValue;
      tHtml += `
        <tr class="${slopeSig ? 'ttest-sig' : 'ttest-not-sig'}">
          <td><strong>β${i+1}</strong></td>
          <td>${s.variable}</td>
          <td>${fmtNum(s.estimate)}</td>
          <td>${fmtNum(s.stdError)}</td>
          <td>${s.tStat.toFixed(4)}</td>
          <td>±${tCrit}</td>
          <td>${slopeSig ? 'Significant ✓' : 'Not Significant'}</td>
        </tr>
      `;
    });

    tHtml += `</tbody></table>
      <div style="margin-top:10px;font-size:0.8rem;color:var(--muted);">
        <strong>H₀: β = 0 (no effect) | H₁: β ≠ 0 (coefficient is significant)</strong>
        <br>Decision rule: Reject H₀ when |t-statistic| > t-critical (±${tCrit}). Degrees of freedom = ${ttest.df}.
      </div>
    `;
    document.getElementById('tTestTable').innerHTML = tHtml;
  }

  // Confidence Intervals
  if (confidenceIntervals) {
    let ciHtml = `
      <table>
        <thead>
          <tr>
            <th>Coefficient</th>
            <th>Variable</th>
            <th>Estimate</th>
            <th>Lower Bound (95%)</th>
            <th>Upper Bound (95%)</th>
            <th>CI Width</th>
          </tr>
        </thead>
        <tbody>
    `;

    // Intercept CI
    const ci = confidenceIntervals.intercept;
    ciHtml += `
      <tr>
        <td><strong>β₀ (Intercept)</strong></td>
        <td>—</td>
        <td>${fmtNum(ci.estimate)}</td>
        <td class="ci-interval" style="color:#ef4444;">${fmtNum(ci.lower)}</td>
        <td class="ci-interval" style="color:#10b981;">${fmtNum(ci.upper)}</td>
        <td>${fmtNum(ci.upper - ci.lower)}</td>
      </tr>
    `;

    // Slopes CI
    confidenceIntervals.slopes.forEach((s, i) => {
      ciHtml += `
        <tr>
          <td><strong>β${i+1}</strong></td>
          <td>${s.variable}</td>
          <td>${fmtNum(s.estimate)}</td>
          <td class="ci-interval" style="color:#ef4444;">${fmtNum(s.lower)}</td>
          <td class="ci-interval" style="color:#10b981;">${fmtNum(s.upper)}</td>
          <td>${fmtNum(s.upper - s.lower)}</td>
        </tr>
      `;
    });

    ciHtml += `</tbody></table>
      <div style="margin-top:10px;font-size:0.8rem;color:var(--muted);">
        <strong>95% Confidence Interval: β ± t(α/2) × SE(β)</strong>
        <br>We are 95% confident that the true parameter lies within this interval.
      </div>`;
    document.getElementById('ciTable').innerHTML = ciHtml;
  }

}

// ============================================================
// RECOMMENDATIONS
// ============================================================
function renderRecommendations(recs) {
  const icons = {success:'✅', warning:'⚠️', danger:'❌', info:'💡'};
  const list  = document.getElementById('recList');
  list.innerHTML = '';
  recs.forEach((r,i) => {
    const item = document.createElement('div');
    item.className = `rec-item ${r.type}`;
    item.style.animationDelay = `${i*0.1}s`;
    item.innerHTML = `
      <span class="rec-icon">${icons[r.type]||'💡'}</span>
      <div>
        <div class="rec-title">${r.title}</div>
        <div class="rec-text">${r.text}</div>
      </div>`;
    list.appendChild(item);
  });
}

function showRecs() {
  document.getElementById('recToggle').classList.add('hidden');
  document.getElementById('recContent').classList.remove('hidden');
}


// ============================================================
// SIMPLE LINEAR REGRESSION — Explicit LSE Formulas (Syllabus)
//   β1 = Σ((x - x̄)(y - ȳ)) / Σ(x - x̄)²
//   β0 = ȳ - β1 · x̄
// ============================================================
function simpleLinearRegression(x, y) {
  const n = x.length;
  if (n === 0) return { beta0: 0, beta1: 0 };
  let sumX = 0, sumY = 0;
  for (let i = 0; i < n; i++) { sumX += x[i]; sumY += y[i]; }
  const xMean = sumX / n;
  const yMean = sumY / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - xMean;
    num += dx * (y[i] - yMean);
    den += dx * dx;
  }
  const beta1 = den === 0 ? 0 : num / den;
  const beta0 = yMean - beta1 * xMean;
  return { beta0, beta1, xMean, yMean };
}

// ============================================================
// MULTIPLE REGRESSION — OLS via Gauss-Jordan (pure JS)
//   β = (Xᵀ X)⁻¹ Xᵀ y
// ============================================================
function multipleRegression(X, y) {
  const n = X.length;
  const k = X[0].length; // includes intercept column

  // Build (XᵀX) and (Xᵀy)
  const XtX = Array.from({length:k},()=>Array(k).fill(0));
  const Xty = Array(k).fill(0);

  for (let i=0;i<n;i++){
    for(let a=0;a<k;a++){
      Xty[a] += X[i][a]*y[i];
      for(let b=0;b<k;b++) XtX[a][b] += X[i][a]*X[i][b];
    }
  }

  // Augment matrix [XtX | Xty]
  const aug = XtX.map((row,i)=>[...row, Xty[i]]);

  // Gauss-Jordan elimination
  for(let col=0;col<k;col++){
    let maxRow=col;
    for(let row=col+1;row<k;row++) if(Math.abs(aug[row][col])>Math.abs(aug[maxRow][col])) maxRow=row;
    [aug[col],aug[maxRow]]=[aug[maxRow],aug[col]];
    if(Math.abs(aug[col][col])<1e-12) continue;
    const pivot=aug[col][col];
    for(let j=col;j<=k;j++) aug[col][j]/=pivot;
    for(let row=0;row<k;row++){
      if(row===col) continue;
      const f=aug[row][col];
      for(let j=col;j<=k;j++) aug[row][j]-=f*aug[col][j];
    }
  }
  return aug.map(row=>row[k]); // coefficients β
}

// ============================================================
// TRAIN MODEL — OLS with Full Statistical Analysis
// Implements: LSE, SE, ANOVA, t-Test, Confidence Intervals
// ============================================================
/**
 * Compute local regression with full statistical analysis
 * @returns {Object} Results object with various metrics and tables
 */
function computeLocalRegression() {
  try {
    const xCols = STATE.xCols;
    const yCol  = STATE.yCol;
    const data  = STATE.data.filter(r =>
      xCols.every(c => r[c]!==null && r[c]!==undefined && r[c]!=='' && !isNaN(parseFloat(r[c]))) &&
      r[yCol]!==null && r[yCol]!==undefined && r[yCol]!=='' && !isNaN(parseFloat(r[yCol]))
    );

    const n = data.length;
    const p = xCols.length; // number of predictors
    if (n < p + 2) return null; // Need enough degrees of freedom

    const y = data.map(r => parseFloat(r[yCol]));

    // Build X matrix with intercept column (1, x1, x2, ...)
    const Xmat = data.map(r => [1, ...xCols.map(c => parseFloat(r[c]))]);

    // Coefficients via Least Squares Estimation.
    //  - p = 1 → use the explicit Simple Linear Regression formulas (syllabus).
    //  - p ≥ 2 → use the matrix form β = (Xᵀ X)⁻¹ Xᵀ y (syllabus).
    let betas;
    if (p === 1) {
      const xVals = data.map(r => parseFloat(r[xCols[0]]));
      const { beta0, beta1 } = simpleLinearRegression(xVals, y);
      betas = [beta0, beta1];
    } else {
      betas = multipleRegression(Xmat, y);
      if (betas.some(b => !isFinite(b))) return null; // singular / ill-conditioned matrix
    }
    const intercept = betas[0];
    const coefs     = betas.slice(1);

    // Predictions and residuals
    const yPred = Xmat.map(row => row.reduce((s,v,i)=>s+v*betas[i],0));
    const residuals = y.map((yi, i) => yi - yPred[i]);

    // ========== BASIC METRICS ==========
    const yMean  = y.reduce((a,b)=>a+b,0)/n;
    const ssTot  = y.reduce((a,b)=>a+(b-yMean)**2,0);
    const ssRes  = residuals.reduce((a,r)=>a+r*r,0);
    const r2Raw  = ssTot>0 ? 1-ssRes/ssTot : 0;
    const r2     = Math.max(0, Math.min(1, r2Raw));
    const mse    = ssRes/(n - p - 1); // Unbiased MSE (df = n - p - 1)
    const rmse   = Math.sqrt(mse);
    const se     = Math.sqrt(mse); // Standard Error of Estimate

    // ========== ANOVA TABLE ==========
    const ssReg = ssTot - ssRes; // SSR = SST - SSE
    const dfReg = p;              // df for regression = number of predictors
    const dfRes = n - p - 1;      // df for residual
    const dfTot = n - 1;          // df for total
    const msReg = ssReg / dfReg;  // MSR
    const msRes = ssRes / dfRes;  // MSE
    const fStat = msRes > 0 ? msReg / msRes : 0;
    const fCrit = fCriticalValue(dfReg, dfRes);

    const anova = {
      ssRegression: ssReg,
      ssResidual: ssRes,
      ssTotal: ssTot,
      dfRegression: dfReg,
      dfResidual: dfRes,
      dfTotal: dfTot,
      msRegression: msReg,
      msResidual: msRes,
      fStatistic: fStat,
      fCritical: fCrit
    };

    // ========== STANDARD ERRORS & T-TESTS ==========
    // Var(β) = MSE * (X^T X)^-1
    // Calculate (X^T X)^-1
    const XtX_inv = calculateXtXInverse(Xmat);
    const diagXtX_inv = matrixDiagonal(XtX_inv);

    // Standard errors of coefficients
    const coefStdErrors = diagXtX_inv.map(d => Math.sqrt(Math.max(0, mse * d)));
    const tCritical = tCriticalValue(dfRes);

    // t-statistics: t = β / SE(β)
    const ttest = {
      intercept: {
        estimate: intercept,
        stdError: coefStdErrors[0],
        tStat: coefStdErrors[0] > 0 ? intercept / coefStdErrors[0] : 0
      },
      slopes: xCols.map((col, i) => ({
        variable: col,
        estimate: coefs[i],
        stdError: coefStdErrors[i + 1],
        tStat: coefStdErrors[i + 1] > 0 ? coefs[i] / coefStdErrors[i + 1] : 0
      })),
      criticalValue: tCritical,
      df: dfRes
    };

    // ========== CONFIDENCE INTERVALS ==========
    // CI: β ± t(α/2) * SE(β)
    const marginOfError = tCritical;
    const confidenceIntervals = {
      intercept: {
        estimate: intercept,
        lower: intercept - marginOfError * coefStdErrors[0],
        upper: intercept + marginOfError * coefStdErrors[0]
      },
      slopes: xCols.map((col, i) => ({
        variable: col,
        estimate: coefs[i],
        lower: coefs[i] - marginOfError * coefStdErrors[i + 1],
        upper: coefs[i] + marginOfError * coefStdErrors[i + 1]
      }))
    };

    // ========== EQUATION STRING ==========
    // Professional format: ŷ (Y) = b₀ + (b₁ × X₁) − (b₂ × X₂)
    const fmtCoef = v => {
      if (!isFinite(v)) return '0';
      const abs = Math.abs(v);
      if (abs >= 10000) return Math.round(v).toLocaleString('en');
      if (abs >= 100)   return v.toFixed(2);
      return v.toFixed(3);
    };
    let eq = `\u0177 (${yCol}) = ${fmtCoef(intercept)}`;
    xCols.forEach((c, i) => {
      const sign = coefs[i] >= 0 ? ' + ' : ' \u2212 ';
      eq += `${sign}(${fmtCoef(Math.abs(coefs[i]))} \u00d7 ${c})`;
    });

    // ========== VISUALIZATION DATA ==========
    // Use full dataset — no train/test split (not in syllabus).
    const actual_vs_pred = y.map((yi, i) => ({ index: i, actual: yi, predicted: yPred[i] }));

    const scatter_data = data.map((r, i) => ({
      x: parseFloat(r[xCols[0]]), y: y[i], predicted: yPred[i]
    }));

    const coefficients = {};
    xCols.forEach((c,i)=>coefficients[c]=parseFloat(coefs[i].toFixed(4)));

    const recs = generateRecs(r2, xCols,
      xCols.map((c,i)=>({col:c,val:coefs[i]})), {n, k: p, yCol});

    return {
      r2: parseFloat(r2.toFixed(4)),
      mse: parseFloat(mse.toFixed(4)),
      rmse: parseFloat(rmse.toFixed(4)),
      se: parseFloat(se.toFixed(4)),
      equation: eq,
      scatter_data, actual_vs_pred,
      coefficients,
      intercept: parseFloat(intercept.toFixed(4)),
      anova,
      ttest,
      confidenceIntervals,
      recommendations: recs,
      n, k: p
    };
  } catch(e){ console.error(e); return null; }
}

/**
 * Calculate (X^T X)^-1 for standard error computation
 */
function calculateXtXInverse(X) {
  const n = X.length;
  const k = X[0].length;

  // Build X^T X
  const XtX = Array.from({length:k},()=>Array(k).fill(0));
  for (let i=0; i<n; i++) {
    for (let a=0; a<k; a++) {
      for (let b=0; b<k; b++) {
        XtX[a][b] += X[i][a] * X[i][b];
      }
    }
  }

  // Return inverse
  return matrixInverse(XtX);
}

// ============================================================
// RENDER RESULTS
// ============================================================
function renderResults(json) {
  renderCharts(json);
  renderEvaluation(json);
  renderRecommendations(json.recommendations);

  ['sec-viz','sec-eval','sec-rec'].forEach(id =>
    document.getElementById(id).classList.remove('hidden'));

  renderSteps(5);

  document.getElementById('recToggle').classList.remove('hidden');
  document.getElementById('recContent').classList.add('hidden');

  setTimeout(() => {
    const el = document.getElementById('sec-viz');
    if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
  }, 300);
}

// ============================================================
// HELPERS
// ============================================================
function showLoading(show) {
  const el = document.getElementById('loadingData');
  show ? el.classList.remove('hidden') : el.classList.add('hidden');
}

function showAlert(id, msg, type) {
  const el = document.getElementById(id);
  el.className = `alert alert-${type}`;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearAlert(id) {
  const el = document.getElementById(id);
  el.className = 'hidden';
}

// ============================================================
// BUILT-IN FALLBACK DATASETS (if backend is offline)
// ============================================================
const HOUSE_DATA = {
  columns:['Size_sqft','Bedrooms','Bathrooms','Age_years','Distance_km','Price_USD'],
  shape:[30,6],
  rows:[
    {Size_sqft:1500,Bedrooms:3,Bathrooms:2,Age_years:10,Distance_km:5,Price_USD:250000},
    {Size_sqft:2000,Bedrooms:4,Bathrooms:3,Age_years:5,Distance_km:3,Price_USD:380000},
    {Size_sqft:1200,Bedrooms:2,Bathrooms:1,Age_years:20,Distance_km:8,Price_USD:180000},
    {Size_sqft:1800,Bedrooms:3,Bathrooms:2,Age_years:8,Distance_km:4,Price_USD:310000},
    {Size_sqft:2500,Bedrooms:5,Bathrooms:4,Age_years:2,Distance_km:2,Price_USD:520000},
    {Size_sqft:1100,Bedrooms:2,Bathrooms:1,Age_years:25,Distance_km:10,Price_USD:150000},
    {Size_sqft:2200,Bedrooms:4,Bathrooms:3,Age_years:6,Distance_km:3,Price_USD:420000},
    {Size_sqft:1600,Bedrooms:3,Bathrooms:2,Age_years:12,Distance_km:6,Price_USD:270000},
    {Size_sqft:3000,Bedrooms:5,Bathrooms:4,Age_years:1,Distance_km:1,Price_USD:650000},
    {Size_sqft:1400,Bedrooms:2,Bathrooms:2,Age_years:15,Distance_km:7,Price_USD:210000},
    {Size_sqft:1700,Bedrooms:3,Bathrooms:2,Age_years:9,Distance_km:5,Price_USD:290000},
    {Size_sqft:2100,Bedrooms:4,Bathrooms:3,Age_years:4,Distance_km:3,Price_USD:400000},
    {Size_sqft:1300,Bedrooms:2,Bathrooms:1,Age_years:18,Distance_km:9,Price_USD:170000},
    {Size_sqft:2400,Bedrooms:4,Bathrooms:3,Age_years:3,Distance_km:2,Price_USD:490000},
    {Size_sqft:1900,Bedrooms:3,Bathrooms:3,Age_years:7,Distance_km:4,Price_USD:340000},
    {Size_sqft:2800,Bedrooms:5,Bathrooms:4,Age_years:2,Distance_km:1,Price_USD:600000},
    {Size_sqft:1000,Bedrooms:2,Bathrooms:1,Age_years:30,Distance_km:12,Price_USD:130000},
    {Size_sqft:2300,Bedrooms:4,Bathrooms:3,Age_years:5,Distance_km:3,Price_USD:460000},
    {Size_sqft:1650,Bedrooms:3,Bathrooms:2,Age_years:11,Distance_km:5,Price_USD:280000},
    {Size_sqft:2050,Bedrooms:4,Bathrooms:3,Age_years:4,Distance_km:3,Price_USD:390000},
    {Size_sqft:1750,Bedrooms:3,Bathrooms:2,Age_years:8,Distance_km:4,Price_USD:305000},
    {Size_sqft:2700,Bedrooms:5,Bathrooms:4,Age_years:2,Distance_km:2,Price_USD:570000},
    {Size_sqft:1250,Bedrooms:2,Bathrooms:1,Age_years:22,Distance_km:9,Price_USD:165000},
    {Size_sqft:1850,Bedrooms:3,Bathrooms:2,Age_years:9,Distance_km:5,Price_USD:320000},
    {Size_sqft:2150,Bedrooms:4,Bathrooms:3,Age_years:5,Distance_km:3,Price_USD:415000},
    {Size_sqft:1350,Bedrooms:2,Bathrooms:2,Age_years:16,Distance_km:8,Price_USD:195000},
    {Size_sqft:2600,Bedrooms:5,Bathrooms:4,Age_years:1,Distance_km:2,Price_USD:545000},
    {Size_sqft:1450,Bedrooms:3,Bathrooms:2,Age_years:13,Distance_km:6,Price_USD:225000},
    {Size_sqft:1950,Bedrooms:3,Bathrooms:3,Age_years:6,Distance_km:4,Price_USD:355000},
    {Size_sqft:2350,Bedrooms:4,Bathrooms:3,Age_years:3,Distance_km:2,Price_USD:475000}
  ]
};

const CAR_DATA = {
  columns:['Year','Mileage_km','Engine_cc','Horsepower','Age_years','Price_USD'],
  shape:[30,6],
  rows:[
    {Year:2020,Mileage_km:15000,Engine_cc:2000,Horsepower:150,Age_years:4,Price_USD:25000},
    {Year:2018,Mileage_km:45000,Engine_cc:1600,Horsepower:120,Age_years:6,Price_USD:18000},
    {Year:2022,Mileage_km:5000,Engine_cc:2500,Horsepower:200,Age_years:2,Price_USD:35000},
    {Year:2015,Mileage_km:80000,Engine_cc:1400,Horsepower:100,Age_years:9,Price_USD:12000},
    {Year:2019,Mileage_km:30000,Engine_cc:1800,Horsepower:140,Age_years:5,Price_USD:22000},
    {Year:2021,Mileage_km:10000,Engine_cc:2200,Horsepower:180,Age_years:3,Price_USD:30000},
    {Year:2016,Mileage_km:70000,Engine_cc:1600,Horsepower:115,Age_years:8,Price_USD:14000},
    {Year:2023,Mileage_km:2000,Engine_cc:3000,Horsepower:250,Age_years:1,Price_USD:45000},
    {Year:2017,Mileage_km:60000,Engine_cc:1800,Horsepower:130,Age_years:7,Price_USD:16000},
    {Year:2014,Mileage_km:95000,Engine_cc:1400,Horsepower:95,Age_years:10,Price_USD:10000},
    {Year:2020,Mileage_km:20000,Engine_cc:2000,Horsepower:155,Age_years:4,Price_USD:24000},
    {Year:2018,Mileage_km:50000,Engine_cc:1600,Horsepower:118,Age_years:6,Price_USD:17000},
    {Year:2022,Mileage_km:8000,Engine_cc:2500,Horsepower:205,Age_years:2,Price_USD:34000},
    {Year:2015,Mileage_km:85000,Engine_cc:1400,Horsepower:98,Age_years:9,Price_USD:11500},
    {Year:2019,Mileage_km:35000,Engine_cc:1800,Horsepower:142,Age_years:5,Price_USD:21000},
    {Year:2021,Mileage_km:12000,Engine_cc:2200,Horsepower:182,Age_years:3,Price_USD:29000},
    {Year:2016,Mileage_km:75000,Engine_cc:1600,Horsepower:112,Age_years:8,Price_USD:13500},
    {Year:2023,Mileage_km:3000,Engine_cc:3000,Horsepower:255,Age_years:1,Price_USD:44000},
    {Year:2017,Mileage_km:65000,Engine_cc:1800,Horsepower:128,Age_years:7,Price_USD:15500},
    {Year:2013,Mileage_km:100000,Engine_cc:1200,Horsepower:90,Age_years:11,Price_USD:8000},
    {Year:2020,Mileage_km:18000,Engine_cc:2000,Horsepower:152,Age_years:4,Price_USD:24500},
    {Year:2018,Mileage_km:42000,Engine_cc:1600,Horsepower:122,Age_years:6,Price_USD:18500},
    {Year:2022,Mileage_km:6000,Engine_cc:2500,Horsepower:202,Age_years:2,Price_USD:34500},
    {Year:2015,Mileage_km:78000,Engine_cc:1400,Horsepower:102,Age_years:9,Price_USD:12200},
    {Year:2019,Mileage_km:32000,Engine_cc:1800,Horsepower:138,Age_years:5,Price_USD:21500},
    {Year:2021,Mileage_km:11000,Engine_cc:2200,Horsepower:178,Age_years:3,Price_USD:29500},
    {Year:2016,Mileage_km:72000,Engine_cc:1600,Horsepower:117,Age_years:8,Price_USD:14200},
    {Year:2023,Mileage_km:1500,Engine_cc:3000,Horsepower:252,Age_years:1,Price_USD:45500},
    {Year:2017,Mileage_km:62000,Engine_cc:1800,Horsepower:132,Age_years:7,Price_USD:16200},
    {Year:2014,Mileage_km:92000,Engine_cc:1400,Horsepower:97,Age_years:10,Price_USD:10500}
  ]
};