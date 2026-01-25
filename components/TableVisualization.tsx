import React from 'react';
import { TableData } from '../types';

interface TableVisualizationProps {
  readonly data: TableData;
}

const TableVisualization: React.FC<TableVisualizationProps> = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            {data.headers.map((header, idx) => (
              <th
                key={idx}
                scope="col"
                className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {data.rows.map((row, rowIdx) => (
            <tr 
              key={rowIdx}
              className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="px-4 py-3 text-sm text-slate-700 whitespace-nowrap"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableVisualization;
