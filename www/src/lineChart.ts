import Plotly from "plotly.js-dist-min";

export interface ChartData {
  [key: string]: { 
    x: number[]; 
    y: number[];
    _raw: unknown[];
  };
}

export interface ChartRenderer {
  render(container: HTMLElement, chartData: ChartData): void;
}

const commonLayout = {
  paper_bgcolor: "#1e1e1e",
  plot_bgcolor: "#1e1e1e",
  font: { color: "#d4d4d4" },
  margin: { t: 20, r: 20, b: 40, l: 60 } as {
    t: number;
    r: number;
    b: number;
    l: number;
  },
};

const config = { responsive: true, displayModeBar: false };

export function createLineChart(xKey: string): ChartRenderer {
  return {
    render(container: HTMLElement, chartData: ChartData): void {
      if (Object.keys(chartData).length === 0) {
        container.innerHTML = '<div class="loading">No data to display</div>';
        return;
      }

      const colors = ["#4ec9b0", "#ce9178", "#569cd6", "#dcdcaa", "#c586c0"];
      const traces = Object.keys(chartData).map((yKey, keyIndex) => ({
        x: chartData[yKey].x,
        y: chartData[yKey].y,
        type: "scatter" as const,
        mode: "lines+markers" as const,
        name: yKey,
        line: { color: colors[keyIndex % colors.length], width: 2 },
        marker: { size: 4 },
      }));

      const layout = {
        ...commonLayout,
        xaxis: {
          title: xKey,
          gridcolor: "#333",
          zerolinecolor: "#555",
        },
        yaxis: {
          title: "Value",
          gridcolor: "#333",
          zerolinecolor: "#555",
        },
        showlegend: true,
        legend: { x: 1, y: 1, bgcolor: "rgba(0,0,0,0.5)" },
      };

      Plotly.newPlot(container, traces, layout, config);
    },
  };
}
