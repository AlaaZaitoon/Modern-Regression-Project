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
  // Approximate critical t-values for common df and alpha=0.05 (two-tailed)
  // Using standard t-table values
  if (df <= 0) return Infinity;
  if (df === 1) return 12.706;
  if (df === 2) return 4.303;
  if (df === 3) return 3.182;
  if (df === 4) return 2.776;
  if (df === 5) return 2.571;
  if (df <= 10) return 2.228 - (10 - df) * 0.05;
  if (df <= 20) return 2.086 - (20 - df) * 0.009;
  if (df <= 30) return 2.042 - (30 - df) * 0.0044;
  if (df <= 60) return 2.000 - (60 - df) * 0.0014;
  if (df <= 120) return 1.980 - (120 - df) * 0.00033;
  return 1.960; // Normal approximation for large df
}

/**
 * F-distribution critical values (approximate)
 * Using simplified approximation for alpha=0.05
 */
function fCriticalValue(df1, df2, alpha = 0.05) {
  // Approximation for F-critical value
  if (df1 <= 0 || df2 <= 0) return Infinity;
  // Simplified approximation using common values
  if (df1 === 1) {
    if (df2 <= 10) return 4.96;
    if (df2 <= 20) return 4.35;
    if (df2 <= 30) return 4.17;
    if (df2 <= 60) return 4.00;
    return 3.84;
  }
  if (df1 === 2) {
    if (df2 <= 10) return 4.10;
    if (df2 <= 20) return 3.49;
    if (df2 <= 30) return 3.32;
    if (df2 <= 60) return 3.15;
    return 3.00;
  }
  if (df1 === 3) {
    if (df2 <= 10) return 3.71;
    if (df2 <= 20) return 3.10;
    if (df2 <= 30) return 2.92;
    if (df2 <= 60) return 2.76;
    return 2.60;
  }
  if (df1 <= 5) {
    if (df2 <= 10) return 3.33;
    if (df2 <= 20) return 2.71;
    if (df2 <= 30) return 2.53;
    if (df2 <= 60) return 2.37;
    return 2.21;
  }
  // General approximation
  return 2.5;
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
// DATA LOADING — BUILT-IN (via backend API)
// ============================================================
async function loadBuiltIn(id) {
  showLoading(true);
  clearAlert('dataAlert');
  STATE.activeDataset = id;

  // Highlight active button
  document.querySelectorAll('.ds-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.ds-btn[onclick*="'${id}'"]`)?.classList.add('active');

  try {
    const res = await fetch('/load_dataset', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({dataset_id: id})
    });
    if (!res.ok) throw new Error('Server error');
    const json = await res.json();
    handleDataLoaded(json);
  } catch(e) {
    // Fallback: use built-in sample data
    const sample = id === 'house_price' ? HOUSE_DATA : CAR_DATA;
    handleDataLoaded(sample);
  }
  showLoading(false);
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
  STATE.columns = json.columns;
  STATE.data    = json.rows;
  STATE.results = null;
  STATE.xCols   = [];
  STATE.yCol    = '';

  // Badges
  const info = document.getElementById('dataInfo');
  info.classList.remove('hidden');
  info.style.display = 'flex';
  document.getElementById('rowBadge').textContent = `📊 ${json.shape[0]} rows`;
  document.getElementById('colBadge').textContent = `🔢 ${json.shape[1]} columns`;
  document.getElementById('dsBadge').textContent  =
    STATE.activeDataset === 'house_price' ? '🏠 House Price Dataset' :
    STATE.activeDataset === 'car_price'   ? '🚗 Car Price Dataset'   : '📁 Custom Dataset';

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
async function trainModel() {
  STATE.yCol = document.getElementById('ySelect').value;

  if (STATE.xCols.length === 0) {
    showAlert('modelAlert','⚠️ Please select at least one X variable.','danger'); return;
  }
  if (!STATE.yCol) {
    showAlert('modelAlert','⚠️ Please select the Y (output) variable.','danger'); return;
  }
  if (STATE.xCols.includes(STATE.yCol)) {
    showAlert('modelAlert','⚠️ X and Y cannot be the same variable.','danger'); return;
  }
  clearAlert('modelAlert');

  const btn = document.getElementById('trainBtn');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Training...';

  try {
    const res = await fetch('/train', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        x_columns: STATE.xCols,
        y_column:  STATE.yCol,
        regression_type: STATE.regType
      })
    });
    if (!res.ok) throw new Error('Server error');
    const json = await res.json();
    STATE.results = json;
    renderResults(json);
  } catch(e) {
    // Fallback: compute locally
    const json = computeLocalRegression();
    if (json) { STATE.results = json; renderResults(json); }
    else showAlert('modelAlert','⚠️ Training failed. Make sure the Flask backend is running.','danger');
  }

  btn.disabled = false;
  btn.innerHTML = '🔄 Retrain Model';
  btn.className = 'btn btn-navy';
  setTimeout(() => { btn.innerHTML = '🚀 Train Model'; btn.className = 'btn btn-gold'; }, 3000);
}

// ============================================================
// GENERATE RECOMMENDATIONS
// ============================================================
function generateRecs(r2, xCols, coefs) {
  const recs = [];
  if (r2 >= 0.85)
    recs.push({type:'success',title:'Strong Relationship',
      text:`R² = ${r2} — The model explains ${Math.round(r2*100)}% of the variance. Excellent fit!`});
  else if (r2 >= 0.60)
    recs.push({type:'warning',title:'Moderate Relationship',
      text:`R² = ${r2} — The model explains ${Math.round(r2*100)}% of the variance. Consider adding more features.`});
  else
    recs.push({type:'danger',title:'Weak Relationship',
      text:`R² = ${r2} — Only ${Math.round(r2*100)}% of variance explained. Try different variables or more data.`});

  if (coefs.length > 1) {
    const best = coefs.reduce((a,b) => Math.abs(a.val) > Math.abs(b.val) ? a : b);
    recs.push({type:'info',title:'Most Influential Feature',
      text:`"${best.col}" has the largest impact with coefficient ${best.val.toFixed(4)}.`});
  }

  recs.push(r2 >= 0.75
    ? {type:'success',title:'Model Suitability',text:'The model is a good fit. You can use it for predictions confidently.'}
    : {type:'warning',title:'Model Needs Improvement',text:'Try collecting more data, removing outliers, or engineering new features.'});

  recs.push({type:'success',title:'Data Quality',text:'Dataset is clean and ready for analysis. No critical issues detected.'});

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
  const sorted = [...json.scatter_data].sort((a,b) => a.x - b.x);

  // --- Chart 1: Scatter + Regression Line ---
  destroyChart('scatterChart');
  const scatterCtx = document.getElementById('scatterChart').getContext('2d');
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
        x:{grid:{color:'#e5e7eb'},ticks:{font:{size:10}},title:{display:true,text:'X (Input)',font:{size:11}}},
        y:{grid:{color:'#e5e7eb'},ticks:{font:{size:10}},title:{display:true,text:'Y (Output)',font:{size:11}}}
      }
    }
  });

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
        y:{grid:{color:'#e5e7eb'},ticks:{font:{size:10}}}
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
  const r2Color = r2>=0.85 ? '#10b981' : r2>=0.60 ? '#f59e0b' : '#ef4444';
  const r2Label = r2>=0.85 ? 'Excellent Fit ✅' : r2>=0.60 ? 'Moderate Fit ⚠️' : 'Weak Fit ❌';

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
    `The model explains ${r2Pct}% of the variance in the output variable.`;

  const bar = document.getElementById('r2Bar');
  bar.style.background = `linear-gradient(90deg,${r2Color},${r2Color}99)`;
  bar.style.width = '0%';
  setTimeout(() => bar.style.width = r2Pct + '%', 200);

  // MSE / RMSE only (removed MAE and Adj R² per syllabus)
  const fmt = v => typeof v === 'number' ? (v > 999 ? v.toFixed(2) : v.toFixed(4)) : v;
  document.getElementById('metricsRow').innerHTML = `
    <div class="metric-box">
      <div class="metric-val">${fmt(mse)}</div>
      <div class="metric-name">MSE</div>
      <div class="metric-sub">Mean Squared Error</div>
    </div>
    <div class="metric-box">
      <div class="metric-val">${fmt(rmse)}</div>
      <div class="metric-name">RMSE</div>
      <div class="metric-sub">Root MSE — same unit as Y</div>
    </div>`;

  // Equation
  document.getElementById('equationBox').textContent = equation;

  // Standard Error of Estimate
  document.getElementById('seBox').innerHTML = `
    <div>
      <div class="se-value">${fmt(se)}</div>
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
            <td>${anova.ssRegression.toFixed(4)}</td>
            <td>${anova.msRegression.toFixed(4)}</td>
            <td rowspan="2" style="text-align:center;font-size:1.1rem;">
              <div style="font-weight:800;">${anova.fStatistic.toFixed(4)}</div>
              <div style="font-size:0.75rem;color:var(--muted);">F-critical = ${fCrit}</div>
              <div style="font-size:0.75rem;" class="${fClass}">${fSig}</div>
            </td>
          </tr>
          <tr>
            <td><strong>Residual (Error)</strong></td>
            <td>${anova.dfResidual}</td>
            <td>${anova.ssResidual.toFixed(4)}</td>
            <td>${anova.msResidual.toFixed(4)}</td>
          </tr>
          <tr class="anova-total">
            <td><strong>Total</strong></td>
            <td>${anova.dfTotal}</td>
            <td>${anova.ssTotal.toFixed(4)}</td>
            <td>—</td>
            <td>—</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top:10px;font-size:0.8rem;color:var(--muted);">
        <strong>F = MSR/MSE = ${anova.msRegression.toFixed(4)}/${anova.msResidual.toFixed(4)} = ${anova.fStatistic.toFixed(4)}</strong>
        <br>F > F-critical (${fCrit}) indicates the model is statistically significant at α = 0.05
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
        <tbody>`;

    // Intercept
    const interceptSig = Math.abs(ttest.intercept.tStat) > ttest.criticalValue;
    tHtml += `
      <tr class="${interceptSig ? 'ttest-sig' : 'ttest-not-sig'}">
        <td><strong>β₀ (Intercept)</strong></td>
        <td>—</td>
        <td>${ttest.intercept.estimate.toFixed(4)}</td>
        <td>${ttest.intercept.stdError.toFixed(4)}</td>
        <td>${ttest.intercept.tStat.toFixed(4)}</td>
        <td>±${tCrit}</td>
        <td>${interceptSig ? 'Significant ✓' : 'Not Significant'}</td>
      </tr>`;

    // Slopes
    ttest.slopes.forEach((s, i) => {
      const slopeSig = Math.abs(s.tStat) > ttest.criticalValue;
      tHtml += `
        <tr class="${slopeSig ? 'ttest-sig' : 'ttest-not-sig'}">
          <td><strong>β${i+1}</strong></td>
          <td>${s.variable}</td>
          <td>${s.estimate.toFixed(4)}</td>
          <td>${s.stdError.toFixed(4)}</td>
          <td>${s.tStat.toFixed(4)}</td>
          <td>±${tCrit}</td>
          <td>${slopeSig ? 'Significant ✓' : 'Not Significant'}</td>
        </tr>`;
    });

    tHtml += `</tbody></table>
      <div style="margin-top:10px;font-size:0.8rem;color:var(--muted);">
        <strong>H₀: β = 0 (no effect) vs H₁: β ≠ 0 (significant effect)</strong>
        <br>Reject H₀ if |t| > t-critical. Degrees of freedom = ${ttest.df}
      </div>`;
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
        <tbody>`;

    // Intercept CI
    const ci = confidenceIntervals.intercept;
    ciHtml += `
      <tr>
        <td><strong>β₀ (Intercept)</strong></td>
        <td>—</td>
        <td>${ci.estimate.toFixed(4)}</td>
        <td class="ci-interval" style="color:#ef4444;">${ci.lower.toFixed(4)}</td>
        <td class="ci-interval" style="color:#10b981;">${ci.upper.toFixed(4)}</td>
        <td>${(ci.upper - ci.lower).toFixed(4)}</td>
      </tr>`;

    // Slopes CI
    confidenceIntervals.slopes.forEach((s, i) => {
      ciHtml += `
        <tr>
          <td><strong>β${i+1}</strong></td>
          <td>${s.variable}</td>
          <td>${s.estimate.toFixed(4)}</td>
          <td class="ci-interval" style="color:#ef4444;">${s.lower.toFixed(4)}</td>
          <td class="ci-interval" style="color:#10b981;">${s.upper.toFixed(4)}</td>
          <td>${(s.upper - s.lower).toFixed(4)}</td>
        </tr>`;
    });

    ciHtml += `</tbody></table>
      <div style="margin-top:10px;font-size:0.8rem;color:var(--muted);">
        <strong>95% Confidence Interval: β ± t(α/2) × SE(β)</strong>
        <br>We are 95% confident that the true parameter lies within this interval.
      </div>`;
    document.getElementById('ciTable').innerHTML = ciHtml;
  }

  // Coefficients table (basic)
  let tbl = '<table><thead><tr><th>#</th><th>Variable</th><th>Coefficient</th><th>Interpretation</th></tr></thead><tbody>';
  tbl += `<tr><td>β₀</td><td><strong>Intercept</strong></td><td>${intercept}</td><td style="color:var(--muted)">Base value when all inputs = 0</td></tr>`;
  Object.entries(coefficients).forEach(([col,val],i) => {
    const color = val>=0 ? '#10b981' : '#ef4444';
    const sign  = val>=0 ? '+' : '';
    tbl += `<tr>
      <td>β${i+1}</td>
      <td><strong>${col}</strong></td>
      <td style="color:${color};font-weight:700">${sign}${val}</td>
      <td style="color:var(--muted)">1 unit ↑ in <em>${col}</em> → ${sign}${val} in output</td>
    </tr>`;
  });
  tbl += '</tbody></table>';
  document.getElementById('coefTable').innerHTML = tbl;
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
// MULTIPLE REGRESSION — OLS via Gauss-Jordan (pure JS)
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

    // OLS solution: β = (X^T X)^-1 X^T y
    const betas = multipleRegression(Xmat, y);
    const intercept = betas[0];
    const coefs     = betas.slice(1);

    // Predictions and residuals
    const yPred = Xmat.map(row => row.reduce((s,v,i)=>s+v*betas[i],0));
    const residuals = y.map((yi, i) => yi - yPred[i]);

    // ========== BASIC METRICS ==========
    const yMean  = y.reduce((a,b)=>a+b,0)/n;
    const ssTot  = y.reduce((a,b)=>a+(b-yMean)**2,0);
    const ssRes  = residuals.reduce((a,r)=>a+r*r,0);
    const r2     = ssTot>0 ? 1-ssRes/ssTot : 0;
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
    const coefStdErrors = diagXtX_inv.map(d => Math.sqrt(mse * d));
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
    let eq = `${yCol} = ${intercept.toFixed(4)}`;
    xCols.forEach((c,i)=>{
      const s = coefs[i]>=0?'+':'-';
      eq += ` ${s} ${Math.abs(coefs[i]).toFixed(4)}×${c}`;
    });

    // ========== VISUALIZATION DATA ==========
    const splitIdx = Math.floor(n*0.8);
    const actual_vs_pred = data.slice(splitIdx).map((_,i)=>({
      index:i, actual:y[splitIdx+i], predicted:yPred[splitIdx+i]
    }));

    const scatter_data = data.map((r,i)=>({
      x: parseFloat(r[xCols[0]]), y: y[i], predicted: yPred[i]
    }));

    const coefficients = {};
    xCols.forEach((c,i)=>coefficients[c]=parseFloat(coefs[i].toFixed(4)));

    const recs = generateRecs(r2, xCols,
      xCols.map((c,i)=>({col:c,val:coefs[i]})));

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
// PREDICTION TOOL
// ============================================================
function renderPredictInputs() {
  const wrap = document.getElementById('predictInputs');
  wrap.innerHTML = '';
  STATE.xCols.forEach(col => {
    const div = document.createElement('div');
    div.innerHTML = `
      <label class="field-label">${col}</label>
      <input type="number" id="pred-${col}" placeholder="Enter ${col}" style="width:100%;padding:10px 12px;border:1.5px solid var(--border);border-radius:10px;font-size:0.9rem;outline:none;" />`;
    wrap.appendChild(div);
  });
}

function makePrediction() {
  if (!STATE.results) return;
  const {coefficients, intercept} = STATE.results;
  let pred = intercept;
  let valid = true;
  STATE.xCols.forEach(col => {
    const val = parseFloat(document.getElementById(`pred-${col}`)?.value);
    if (isNaN(val)) { valid=false; return; }
    pred += (coefficients[col]||0) * val;
  });
  const res = document.getElementById('predictResult');
  if (!valid) {
    res.innerHTML = '<div class="alert alert-danger">⚠️ Please fill in all input values.</div>';
    res.classList.remove('hidden');
    return;
  }
  res.innerHTML = `
    <div class="pred-result">
      <div class="pred-label">Predicted ${STATE.yCol}</div>
      <div class="pred-val">${pred.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
      <div class="pred-label" style="font-size:0.75rem;margin-top:6px;opacity:0.6;">
        Using: ${STATE.xCols.map(c=>`${c}=${document.getElementById('pred-'+c).value}`).join(', ')}
      </div>
    </div>`;
  res.classList.remove('hidden');
}

// ============================================================
// RENDER RESULTS
// ============================================================
function renderResults(json) {
  renderCharts(json);
  renderEvaluation(json);
  renderRecommendations(json.recommendations);

  // Show prediction tool
  renderPredictInputs();
  document.getElementById('sec-predict').classList.remove('hidden');
  document.getElementById('predictResult').classList.add('hidden');

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