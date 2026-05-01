import Plotly from 'plotly.js-dist-min';
import { ChartData } from './lineChart';

export function createScatterChart(): (
  container: HTMLElement,
  chartData: ChartData,
  xKey: string,
  yKey: string,
) => void {
  return function renderScatter(
    container: HTMLElement,
    chartData: ChartData,
    xKey: string,
    yKey: string,
  ): void {

    let xMin = + Infinity; 
    let xMax = - Infinity; 
    let yMin = + Infinity; 
    let yMax = - Infinity; 
    const traces = Object.keys(chartData).map((key, keyIdx) => {
      const xValues = chartData[key].x;
      const yValues = chartData[key].y;
      const trace = {
        x: xValues,
        y: yValues,
        type: 'scatter' as const,
        mode: 'markers' as const,
        marker: {
          size: 6,
          color: '#4ec9b0',
          opacity: 0.8
        }
      };

      const validX = xValues.filter(v => !isNaN(v));
      const validY = yValues.filter(v => !isNaN(v));

      if (validX.length === 0 || validY.length === 0) {
        container.innerHTML = '<div class="loading">No valid data for scatter plot</div>';
        return;
      }

      xMin = Math.min(xMin,...validX);
      xMax = Math.max(yMax,...validX);
      yMin = Math.min(yMin,...validY);
      yMax = Math.max(yMax,...validY);

      return trace
    });

    

    const dataMin = Math.min(xMin, yMin);
    const dataMax = Math.max(xMax, yMax);
    const padding = (dataMax - dataMin) * 0.05;
    const rangeMin = dataMin - padding;
    const rangeMax = dataMax + padding;



    const layout = {
      paper_bgcolor: '#1e1e1e',
      plot_bgcolor: '#1e1e1e',
      font: { color: '#d4d4d4' },
      margin: { t: 20, r: 20, b: 40, l: 60 },
      xaxis: {
        title: xKey,
        gridcolor: '#333',
        zerolinecolor: '#555',
        range: [rangeMin, rangeMax],
        scaleanchor: 'y',
        scaleratio: 1
      },
      yaxis: {
        title: yKey,
        gridcolor: '#333',
        zerolinecolor: '#555',
        range: [rangeMin, rangeMax]
      },
      showlegend: false
    };

    const config = { responsive: true, displayModeBar: false };
    Plotly.newPlot(container, traces, layout, config);
  };
}
