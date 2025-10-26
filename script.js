// Replace this URL with your published Google Sheet CSV link
const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHJTXTfaGiEvd4vbEEfHclAoppC4RLfl9uvsHD77xZ6pMh1JFe79chZkPqaiOnMs9U1lEQpjXbQi_t/pub?gid=0&single=true&output=csv";

function csvToArray(csv) {
  const lines = csv.trim().split("\n");
  return lines.map(line => line.split(",").map(c => c.trim()));
}

async function fetchCsv(url) {
  const res = await fetch(url);
  return await res.text();
}

function buildTable(headers, rows) {
  const table = document.createElement("table");
  table.className = "table";
  const thead = document.createElement("thead");
  const thr = document.createElement("tr");
  headers.forEach(h => {
    const th = document.createElement("th");
    th.textContent = h;
    thr.appendChild(th);
  });
  thead.appendChild(thr);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  rows.forEach(r => {
    const tr = document.createElement("tr");
    r.forEach(cell => {
      const td = document.createElement("td");
      td.textContent = cell;
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

function summarizeData(headers, rows) {
  const dateIdx = headers.findIndex(h => /date/i.test(h));
  const incIdx = headers.findIndex(h => /income/i.test(h));
  const expIdx = headers.findIndex(h => /expense/i.test(h));
  const map = new Map();

  rows.forEach(r => {
    const date = dateIdx >= 0 ? new Date(r[dateIdx]) : new Date();
    const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2, "0")}`;
    const inc = incIdx >= 0 ? parseFloat(r[incIdx]) || 0 : 0;
    const exp = expIdx >= 0 ? parseFloat(r[expIdx]) || 0 : 0;
    if (!map.has(key)) map.set(key, { inc: 0, exp: 0 });
    const obj = map.get(key);
    obj.inc += inc;
    obj.exp += exp;
  });

  const labels = [...map.keys()].sort();
  return {
    labels,
    incomes: labels.map(l => map.get(l).inc),
    expenses: labels.map(l => map.get(l).exp)
  };
}

async function loadData() {
  const wrap = document.getElementById("tableWrap");
  const csvLink = document.getElementById("downloadCsv");
  const ctx = document.getElementById("summaryChart");
  try {
    wrap.innerHTML = "<p>Loading data...</p>";
    const csvText = await fetchCsv(CSV_URL);
    const arr = csvToArray(csvText);
    const headers = arr[0];
    const rows = arr.slice(1);
    csvLink.href = CSV_URL;

    const table = buildTable(headers, rows);
    wrap.innerHTML = "";
    wrap.appendChild(table);

    const summary = summarizeData(headers, rows);
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: summary.labels,
        datasets: [
          { label: "Income", data: summary.incomes, backgroundColor: "#f5c542" },
          { label: "Expense", data: summary.expenses, backgroundColor: "#ff4d4d" }
        ]
      },
      options: { responsive: true, scales: { y: { beginAtZero: true } } }
    });
  } catch (err) {
    wrap.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("refreshBtn");
  btn.addEventListener("click", loadData);
});
