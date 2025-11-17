import React, { useMemo } from 'react';

interface ComparisonDashboardProps {
  baselineLatency: number;
  ragLatency: number;
  baselineTokens: number;
  ragTokens: number;
  cosineSimilarity: number;
  bleu: number;
  rouge: number;
  avgSimilarity: number;
}

interface TableRow {
  label: string;
  baseline: number;
  rag: number;
  format?: (value: number) => string;
}

const defaultFormat = (value: number): string => value.toFixed(3);

const ComparisonDashboard: React.FC<ComparisonDashboardProps> = ({
  baselineLatency,
  ragLatency,
  baselineTokens,
  ragTokens,
  cosineSimilarity,
  bleu,
  rouge,
  avgSimilarity
}) => {
  const tableRows: TableRow[] = useMemo(
    () => [
      { label: 'Latency (s)', baseline: baselineLatency, rag: ragLatency },
      { label: 'Token count', baseline: baselineTokens, rag: ragTokens, format: (value) => value.toFixed(0) },
      { label: 'Cosine similarity', baseline: 0, rag: cosineSimilarity },
      // { label: 'BLEU', baseline: 0, rag: bleu },
      // { label: 'ROUGE-L', baseline: 0, rag: rouge },
      { label: 'Avg. retrieved similarity', baseline: 0, rag: avgSimilarity }
    ],
    [baselineLatency, ragLatency, baselineTokens, ragTokens, cosineSimilarity, bleu, rouge, avgSimilarity]
  );

  const maxValue = useMemo(() => {
    const values = tableRows.flatMap((row) => [row.baseline, row.rag]);
    const max = Math.max(...values, 1);
    return max <= 0 ? 1 : max;
  }, [tableRows]);

  const handleDownload = () => {
    const canvas = document.createElement('canvas');
    const width = 1000;
    const height = 620;
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    context.fillStyle = '#1f2937';
    context.font = 'bold 28px Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    context.fillText('Baseline vs RAG metrics', 40, 60);

    context.font = '16px Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    context.fillStyle = '#4b5563';
    context.fillText('Exported from analytical dashboard', 40, 90);

    const tableStartY = 130;
    const rowHeight = 28;

    context.fillStyle = '#9ca3af';
    context.font = 'bold 15px Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    context.fillText('Metric', 40, tableStartY);
    context.fillText('Baseline', 340, tableStartY);
    context.fillText('RAG', 520, tableStartY);

    context.font = '15px Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    context.fillStyle = '#111827';

    tableRows.forEach((row, index) => {
      const y = tableStartY + (index + 1) * rowHeight;
      const formatter = row.format ?? defaultFormat;
      context.fillText(row.label, 40, y);
      context.fillText(formatter(row.baseline), 340, y);
      context.fillStyle = '#2563eb';
      context.fillText(formatter(row.rag), 520, y);
      context.fillStyle = '#111827';
    });

    const chartX = 40;
    const chartY = tableStartY + rowHeight * (tableRows.length + 2);
    const chartWidth = width - chartX * 2;
    const chartHeight = 240;
    const groupWidth = chartWidth / tableRows.length;
    const barWidth = groupWidth / 3;

    context.strokeStyle = '#d1d5db';
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(chartX, chartY);
    context.lineTo(chartX, chartY + chartHeight);
    context.lineTo(chartX + chartWidth, chartY + chartHeight);
    context.stroke();

    tableRows.forEach((row, index) => {
      const baseX = chartX + index * groupWidth + barWidth;
      const baselineHeight = (row.baseline / maxValue) * chartHeight;
      const ragHeight = (row.rag / maxValue) * chartHeight;

      context.fillStyle = '#9ca3af';
      context.fillRect(baseX, chartY + chartHeight - baselineHeight, barWidth, baselineHeight);

      context.fillStyle = '#2563eb';
      context.fillRect(baseX + barWidth + 6, chartY + chartHeight - ragHeight, barWidth, ragHeight);

      context.fillStyle = '#374151';
      context.font = '13px Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const labelY = chartY + chartHeight + 20;
      context.fillText(row.label, baseX - 10, labelY, groupWidth);
    });

    context.fillStyle = '#9ca3af';
    context.font = '14px Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    context.fillText(`Max value: ${maxValue.toFixed(3)}`, chartX, chartY + chartHeight + 50);

    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `rag-comparison-${Date.now()}.png`;
    link.click();
  };

  return (
    <section className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-gray-800">Comparison dashboard</h2>
          <p className="text-xs text-gray-500">
            Metrics capture baseline vs RAG behaviour for the latest prompt. Download charts for thesis figures.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-blue-700"
        >
          Download as image
        </button>
      </div>
      <div className="flex flex-1 flex-col gap-6 px-5 py-4">
        <div className="overflow-hidden rounded-xl border border-gray-100">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Metric</th>
                <th className="px-4 py-3">Baseline</th>
                <th className="px-4 py-3">RAG</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tableRows.map((row) => {
                const format = row.format ?? defaultFormat;
                return (
                  <tr key={row.label} className="text-gray-700">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{row.label}</td>
                    <td className="px-4 py-3 text-sm">{format(row.baseline)}</td>
                    <td className="px-4 py-3 text-sm text-blue-700">{format(row.rag)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {/* <div className="h-64 w-full overflow-hidden rounded-xl border border-gray-100 bg-slate-50 p-4">
          <svg viewBox="0 0 800 240" className="h-full w-full">
            <line x1={40} y1={10} x2={40} y2={210} stroke="#d1d5db" strokeWidth={1} />
            <line x1={40} y1={210} x2={760} y2={210} stroke="#d1d5db" strokeWidth={1} />
            {tableRows.map((row, index) => {
              const groupWidth = (760 - 40) / tableRows.length;
              const barWidth = groupWidth / 3;
              const baseX = 40 + index * groupWidth + barWidth;
              const baselineHeight = (row.baseline / maxValue) * 180;
              const ragHeight = (row.rag / maxValue) * 180;
              const labelY = 230;
              return (
                <g key={row.label}>
                  <rect
                    x={baseX}
                    y={210 - baselineHeight}
                    width={barWidth}
                    height={baselineHeight}
                    fill="#9ca3af"
                    rx={4}
                  />
                  <rect
                    x={baseX + barWidth + 6}
                    y={210 - ragHeight}
                    width={barWidth}
                    height={ragHeight}
                    fill="#2563eb"
                    rx={4}
                  />
                  <text x={baseX + barWidth} y={labelY} fontSize={12} fill="#4b5563" textAnchor="middle">
                    {row.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded-sm bg-gray-400"></span>
            Baseline
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-3 w-3 rounded-sm bg-blue-600"></span>
            RAG
          </span>
          <span className="ml-auto">Max scale value: {maxValue.toFixed(3)}</span>
        </div> */}
      </div>
    </section>
  );
};

export default ComparisonDashboard;
