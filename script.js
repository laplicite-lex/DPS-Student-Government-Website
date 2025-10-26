document.addEventListener("DOMContentLoaded", () => {
  // === GLOBAL ELEMENTS ===
  const categorySelect = document.getElementById("categorySelect");
  const itemSelect = document.getElementById("itemSelect");
  const refreshBtn = document.getElementById("refreshBtn");
  const chartCanvas = document.getElementById("summaryChart");
  const wrap = document.getElementById("tableWrap");
  const sheetFrame = document.getElementById("sheetFrame");
  let chart;

  // === SOURCE LINKS ===
  const CSV_SOURCES = {
    events: {
      "Teachers Day": {
        csv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHJTXTfaGiEvd4vbEEfHclAoppC4RLfl9uvsHD77xZ6pMh1JFe79chZkPqaiOnMs9U1lEQpjXbQi_t/pub?gid=0&single=true&output=csv",
        sheet: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHJTXTfaGiEvd4vbEEfHclAoppC4RLfl9uvsHD77xZ6pMh1JFe79chZkPqaiOnMs9U1lEQpjXbQi_t/pubhtml?gid=0&amp;single=true&amp;widget=true&amp;headers=false"
      },
      "Halloween": {
        csv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHJTXTfaGiEvd4vbEEfHclAoppC4RLfl9uvsHD77xZ6pMh1JFe79chZkPqaiOnMs9U1lEQpjXbQi_t/pub?gid=123456789&single=true&output=csv",
        sheet: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHJTXTfaGiEvd4vbEEfHclAoppC4RLfl9uvsHD77xZ6pMh1JFe79chZkPqaiOnMs9U1lEQpjXbQi_t/pubhtml?gid=123456789&single=true"
      },
      "Rave Night": {
        csv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHJTXTfaGiEvd4vbEEfHclAoppC4RLfl9uvsHD77xZ6pMh1JFe79chZkPqaiOnMs9U1lEQpjXbQi_t/pub?gid=987654321&single=true&output=csv",
        sheet: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHJTXTfaGiEvd4vbEEfHclAoppC4RLfl9uvsHD77xZ6pMh1JFe79chZkPqaiOnMs9U1lEQpjXbQi_t/pubhtml?gid=987654321&single=true"
      }
    },
    platforms: {
      "President": {
        csv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHJTXTfaGiEvd4vbEEfHclAoppC4RLfl9uvsHD77xZ6pMh1JFe79chZkPqaiOnMs9U1lEQpjXbQi_t/pub?gid=111111111&single=true&output=csv",
        sheet: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHJTXTfaGiEvd4vbEEfHclAoppC4RLfl9uvsHD77xZ6pMh1JFe79chZkPqaiOnMs9U1lEQpjXbQi_t/pubhtml?gid=111111111&single=true"
      },
      "Vice President": {
        csv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHJTXTfaGiEvd4vbEEfHclAoppC4RLfl9uvsHD77xZ6pMh1JFe79chZkPqaiOnMs9U1lEQpjXbQi_t/pub?gid=222222222&single=true&output=csv",
        sheet: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHJTXTfaGiEvd4vbEEfHclAoppC4RLfl9uvsHD77xZ6pMh1JFe79chZkPqaiOnMs9U1lEQpjXbQi_t/pubhtml?gid=222222222&single=true"
      }
    }
  };

  // === HELPER FUNCTIONS ===
  async function loadCSV(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    const text = await res.text();
    return text.trim().split("\n").map(r => r.split(","));
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

  // === CHART RENDER FUNCTION ===
  async function renderChart() {
    const item = itemSelect.options[itemSelect.selectedIndex];
    const csv = item?.dataset.csv;
    const sheet = item?.dataset.sheet;

    if (!csv || !sheet) {
      alert("Please select a valid category and item.");
      return;
    }

    sheetFrame.src = sheet;

    try {
      wrap.innerHTML = "<p>Loading data...</p>";
      const data = await loadCSV(csv);
      const headers = data[0];
      const rows = data.slice(1);

      const labels = rows.map(r => r[0]);
      const values = rows.map(r => parseFloat(r[1]));

      wrap.innerHTML = "";
      wrap.appendChild(buildTable(headers, rows));

      if (chart) chart.destroy();
      chart = new Chart(chartCanvas, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: item.textContent,
              data: values,
              backgroundColor: "rgba(255, 215, 0, 0.7)",
              borderColor: "#FFD700",
              borderWidth: 2
            }
          ]
        },
        options: {
          plugins: { legend: { labels: { color: "#fff" } } },
          scales: {
            x: { ticks: { color: "#fff" } },
            y: { ticks: { color: "#fff", beginAtZero: true } }
          }
        }
      });
    } catch (err) {
      wrap.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
    }
  }

  // === DROPDOWN SETUP ===
  categorySelect.addEventListener("change", () => {
    const category = categorySelect.value;
    itemSelect.innerHTML = '<option value="">-- Choose an item --</option>';

    if (CSV_SOURCES[category]) {
      for (const name in CSV_SOURCES[category]) {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name;
        opt.dataset.csv = CSV_SOURCES[category][name].csv;
        opt.dataset.sheet = CSV_SOURCES[category][name].sheet;
        itemSelect.appendChild(opt);
      }
    }
  });

  refreshBtn.addEventListener("click", renderChart);
});
