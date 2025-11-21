document.addEventListener("DOMContentLoaded", () => {
  const categorySelect = document.getElementById("categorySelect");
  const itemSelect = document.getElementById("itemSelect");
  const refreshBtn = document.getElementById("refreshBtn");
  const chartCanvas = document.getElementById("summaryChart");
  const wrap = document.getElementById("tableWrap");
  const sheetFrame = document.getElementById("sheetFrame");

  if (!categorySelect || !itemSelect || !chartCanvas) return;

  let chart = null;

  // === GOOGLE SHEET LINKS ===
  const CSV_SOURCES = {
    events: {
      "Teachers Day": {
        csv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHJTXTfaGiEvd4vbEEfHclAoppC4RLfl9uvsHD77xZ6pMh1JFe79chZkPqaiOnMs9U1lEQpjXbQi_t/pub?gid=0&single=true&output=csv",
        sheet: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHJTXTfaGiEvd4vbEEfHclAoppC4RLfl9uvsHD77xZ6pMh1JFe79chZkPqaiOnMs9U1lEQpjXbQi_t/pubhtml?gid=0&single=true&widget=true&headers=false"
      },
      "Halloween": {
        csv: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHJTXTfaGiEvd4vbEEfHclAoppC4RLfl9uvsHD77xZ6pMh1JFe79chZkPqaiOnMs9U1lEQpjXbQi_t/pub?gid=1425081713&single=true&output=csv",
        sheet: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTHJTXTfaGiEvd4vbEEfHclAoppC4RLfl9uvsHD77xZ6pMh1JFe79chZkPqaiOnMs9U1lEQpjXbQi_t/pubhtml?gid=1425081713&single=true&widget=true&headers=false"
      }
    }
  };

  // === CSV LOADER ===
  async function loadCSV(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    const text = await res.text();
    return text.trim().split("\n").map(r => r.split(","));
  }

  // === TABLE BUILDER ===
  function buildTable(headers, rows) {
    const table = document.createElement("table");
    table.className = "table";

    const thead = document.createElement("thead");
    const trHead = document.createElement("tr");
    headers.forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      trHead.appendChild(th);
    });
    thead.appendChild(trHead);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    rows.forEach(r => {
      const tr = document.createElement("tr");
      r.forEach(c => {
        const td = document.createElement("td");
        td.textContent = c;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return table;
  }

  // === MAIN FUNCTION: RENDER CHART + EMBED ===
  async function renderChart() {
    const item = itemSelect.options[itemSelect.selectedIndex];
    const csv = item?.dataset.csv;
    const sheet = item?.dataset.sheet;

    if (!csv || !sheet) {
      alert("Please select a valid category and item.");
      return;
    }

    // ✅ Show sheet in iframe immediately
    if (sheetFrame) {
      sheetFrame.src = sheet;
      sheetFrame.style.display = "block";
    }

    wrap.innerHTML = "<div class='loader'>Loading data...</div>";

    try {
      // === Load CSV ===
      const data = await loadCSV(csv);
      const headers = data[0]; // first row are column names
      const rows = data.slice(1);

      // === Clean data (skip totals/empty)
      const filteredRows = rows.filter(r => r[0] && r[0].trim() !== "" && !/total/i.test(r[0]));

      // === Labels (first column)
      const labels = filteredRows.map(r => r[0].trim());

      // === Auto-detect columns after the first one ===
      const datasets = [];
      for (let i = 1; i < headers.length; i++) {
        const colName = headers[i] || `Column ${i}`;
        const values = filteredRows.map(r => {
          const raw = (r[i] || "").trim().replace(/["₱,\s]/g, "");
          const num = parseFloat(raw);
          return isNaN(num) ? 0 : num;
        });

        // Assign colors dynamically
        const colorPalette = [
          "rgba(0, 200, 0, 0.7)",    // green
          "rgba(245, 197, 66, 0.85)", // gold
          "rgba(255, 99, 132, 0.7)",  // red
          "rgba(54, 162, 235, 0.7)"   // blue
        ];
        const color = colorPalette[(i - 1) % colorPalette.length];

        datasets.push({
          label: colName,
          data: values,
          backgroundColor: color,
          borderColor: color.replace("0.7", "1"),
          borderWidth: 1
        });
      }

      // === Update Table ===
      wrap.innerHTML = "";
      wrap.appendChild(buildTable(headers, rows));

      // === Reset Chart ===
      if (chart) {
        chart.destroy();
        chart = null;
      }

      const ctx = chartCanvas.getContext("2d");
      ctx.resetTransform();
      ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
      chartCanvas.style.height = "350px";
      chartCanvas.height = 350;

      // === Create Chart ===
      chart = new Chart(ctx, {
        type: "bar",
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          animation: { duration: 700 },
          plugins: {
            legend: { labels: { color: "#f2f2f2" } },
            tooltip: {
              callbacks: {
                label: ctx => `${ctx.dataset.label}: ₱${ctx.parsed.y.toLocaleString()}`
              }
            }
          },
          scales: {
            x: {
              stacked: false,
              ticks: { color: "#f2f2f2" },
              grid: { color: "rgba(255,255,255,0.05)" }
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: "#f2f2f2",
                callback: value => "₱" + value.toLocaleString()
              },
              grid: { color: "rgba(255,255,255,0.1)" },
              suggestedMax: Math.max(
                ...datasets.flatMap(d => d.data)
              ) * 1.2
            }
          }
        }
      });

    } catch (err) {
      wrap.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
      console.error("Chart error:", err);
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

  // === REFRESH BUTTON ===
  let renderTimeout;
  refreshBtn.addEventListener("click", () => {
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(renderChart, 300);
  });

  // === DEFAULT LOAD ===
  window.addEventListener("load", () => {
    categorySelect.value = "events";
    categorySelect.dispatchEvent(new Event("change"));
    itemSelect.value = "Teachers Day";
    renderChart();
  });
});
