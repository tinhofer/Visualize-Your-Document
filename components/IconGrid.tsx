import React from 'react';
import * as LucideIcons from 'lucide-react';
import { IconGridData, IconItem } from '../types';

interface IconGridProps {
  readonly data: IconGridData;
}

// Map of common icon names to Lucide components
// Gemini will return icon names like "users", "chart", "clock" etc.
const getIconComponent = (iconName: string): LucideIcons.LucideIcon => {
  // Normalize icon name: "user-check" -> "UserCheck"
  const normalizedName = iconName
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
  
  // Try to find the icon in Lucide
  const icon = (LucideIcons as Record<string, LucideIcons.LucideIcon>)[normalizedName];
  
  // Fallback to a generic icon if not found
  return icon || LucideIcons.CircleDot;
};

interface IconItemCardProps {
  readonly item: IconItem;
}

const IconItemCard: React.FC<IconItemCardProps> = ({ item }) => {
  const IconComponent = getIconComponent(item.icon);
  
  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all">
      {/* Icon */}
      <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center mb-3">
        <IconComponent size={28} className="text-indigo-600" />
      </div>
      
      {/* Value (if present) */}
      {item.value !== undefined && (
        <span className="text-2xl font-bold text-slate-800 mb-1">
          {item.value}
        </span>
      )}
      
      {/* Label */}
      <span className="text-sm font-medium text-slate-700 text-center">
        {item.label}
      </span>
      
      {/* Description (if present) */}
      {item.description && (
        <span className="text-xs text-slate-500 text-center mt-1">
          {item.description}
        </span>
      )}
    </div>
  );
};

const IconGrid: React.FC<IconGridProps> = ({ data }) => {
  // Determine grid columns based on item count
  const getGridCols = (count: number): string => {
    if (count <= 3) return 'grid-cols-3';
    if (count <= 4) return 'grid-cols-2 sm:grid-cols-4';
    if (count <= 6) return 'grid-cols-2 sm:grid-cols-3';
    return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4';
  };

  return (
    <div>
      <div className={`grid ${getGridCols(data.items.length)} gap-4`}>
        {data.items.map((item, idx) => (
          <IconItemCard key={idx} item={item} />
        ))}
      </div>
    </div>
  );
};

export default IconGrid;
