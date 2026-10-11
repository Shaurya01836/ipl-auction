import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PaginationControls = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  label = 'items',
}) => {
  if (totalItems === 0) return null;
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="bg-[#0c0c0c] border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold shadow-xl">
      <span className="text-[10px] sm:text-xs text-gray-400 font-medium">
        Showing <span className="text-white font-bold">{startItem}</span> to{' '}
        <span className="text-white font-bold">{endItem}</span> of{' '}
        <span className="text-white font-bold">{totalItems}</span> {label}
      </span>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-[10px] sm:text-xs uppercase font-black"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Prev</span>
        </button>

        <div className="flex items-center gap-1.5 px-2">
          <span className="text-white font-black text-xs">{currentPage}</span>
          <span className="text-gray-600">/</span>
          <span className="text-gray-500 font-bold text-xs">{totalPages}</span>
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer text-[10px] sm:text-xs uppercase font-black"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
