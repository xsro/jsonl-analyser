declare module 'plotly.js-dist-min' {
  const Plotly: {
    newPlot: (div: HTMLElement, data: unknown[], layout?: unknown, config?: unknown) => void;
    react: (div: HTMLElement, data: unknown[], layout?: unknown, config?: unknown) => void;
    relayout: (div: HTMLElement, update: unknown) => void;
  };
  export default Plotly;
}