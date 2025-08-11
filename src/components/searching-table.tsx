import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  useReactTable,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type ColumnDef,
  type VisibilityState,
  type ColumnOrderState,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { faker } from "@faker-js/faker";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { 
  FaSearch, 
  FaChevronLeft, 
  FaChevronRight, 
  FaColumns, 
  FaChevronDown,
  FaGripVertical,
  FaArrowLeft,
  FaArrowRight,
  FaTimes,
 
  
  FaDatabase,
  FaFilter
} from "react-icons/fa";
import { PiPushPinThin } from "react-icons/pi";

// Types
type Person = { [key: string]: string };

// Mock data generator (2000 rows × 80 columns)
function makeData(): Person[] {
  const columnsCount = 80;
  const rowsCount = 2000;
  const cols: string[] = [];
  for (let i = 0; i < columnsCount; i++) {
    cols.push(`col_${i + 1}`);
  }
  return Array.from({ length: rowsCount }, () => {
    const row: Person = {};
    cols.forEach((col) => (row[col] = faker.word.noun()));
    return row;
  });
}

// Enhanced draggable header
const DraggableHeader = ({ header, index, moveColumn }: any) => {
  const [isDragging, setIsDragging] = useState(false);
  
  const [, dragRef] = useDrag({ 
    type: "column", 
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });
  
  const [{ isOver }, dropRef] = useDrop({
    accept: "column",
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    hover: (item: any) => {
      if (item.index !== index) {
        moveColumn(item.index, index);
        item.index = index;
      }
    },
  });

  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (ref.current) {
      dropRef(ref.current);
      dragRef(ref.current);
    }
  }, [dropRef, dragRef]);

  useEffect(() => {
    setIsDragging(isDragging);
  }, [isDragging]);

  const isPinned = header.column.getIsPinned();

  return (
    <div 
      ref={ref} 
      className={`
        flex items-center gap-2 cursor-move select-none group transition-all duration-200
        ${isOver ? 'bg-blue-100 shadow-lg transform scale-105' : ''}
        ${isDragging ? 'opacity-50' : ''}
        ${isPinned ? 'text-blue-600' : 'text-gray-700'}
      `}
    >
      <FaGripVertical className="text-gray-400 group-hover:text-blue-500 transition-colors duration-200" size={10} />
      {isPinned && <PiPushPinThin  className="text-blue-500" size={10} />}
      <span className="font-semibold text-sm">
        {flexRender(header.column.columnDef.header, header.getContext())}
      </span>
    </div>
  );
};

export default function ModernDataTable() {
  const data = useMemo(() => makeData(), []);
  const columns = useMemo<ColumnDef<Person>[]>(() => {
    return Array.from({ length: 80 }, (_, i) => ({
      accessorKey: `col_${i + 1}`,
      header: `Column ${i + 1}`,
      cell: (info) => info.getValue() as string,
      size: 150,
    }));
  }, []);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility, columnOrder, globalFilter },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    enableColumnPinning: true,
  });

  // Virtualizer
  const parentRef = useRef<HTMLDivElement | null>(null);
  const rowVirtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - virtualRows[virtualRows.length - 1].end
      : 0;

  // Column reorder function
  const moveColumn = (dragIndex: number, hoverIndex: number) => {
    setColumnOrder((old) => {
      const base = old.length
        ? old
        : table.getAllLeafColumns().map((c) => c.id);
      const newOrder = [...base];
      const [moved] = newOrder.splice(dragIndex, 1);
      newOrder.splice(hoverIndex, 0, moved);
      return newOrder;
    });
  };

  // Column dropdown state
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const closeMenu = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowColumnMenu(false);
      }
    };
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  // Visible column count and stats
  const visibleCount = table.getVisibleLeafColumns().length;
  const totalColumns = table.getAllLeafColumns().length;
  const filteredRows = table.getFilteredRowModel().rows.length;
  const totalRows = data.length;
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                <FaDatabase className="text-blue-600" />
                Modern Data Table
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <FaFilter className="text-xs" />
                  {filteredRows.toLocaleString()} of {totalRows.toLocaleString()} rows
                </span>
                <span>•</span>
                <span>{visibleCount} of {totalColumns} columns visible</span>
                <span>•</span>
                <span>Page {currentPage} of {totalPages}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              {/* Enhanced Search */}
              <div className="relative min-w-0 sm:min-w-[280px]">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={globalFilter ?? ""}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  placeholder="Search across all columns..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm"
                />
                {globalFilter && (
                  <button
                    onClick={() => setGlobalFilter("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={12} />
                  </button>
                )}
              </div>

              {/* Enhanced Column dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowColumnMenu((s) => !s);
                  }}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 border rounded-lg font-medium text-sm
                    transition-all duration-200 shadow-sm whitespace-nowrap
                    ${showColumnMenu 
                      ? 'bg-blue-100 border-blue-300 text-blue-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400'
                    }
                  `}
                >
                  <FaColumns className="text-sm" />
                  Columns
                  <FaChevronDown className={`text-xs transition-transform duration-200 ${showColumnMenu ? 'rotate-180' : ''}`} />
                </button>

                {showColumnMenu && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-96 overflow-hidden">
                    <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <div className="text-sm font-semibold text-gray-900">Column Management</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Visibility, Pinning & Ordering • {visibleCount}/{totalColumns} visible
                      </div>
                    </div>
                    
                    <div className="max-h-72 overflow-auto">
                      {table.getAllLeafColumns().map((column) => {
                        const isPinned = column.getIsPinned();
                        const pinSide = isPinned === "left" ? "left" : isPinned === "right" ? "right" : null;
                        
                        return (
                          <div
                            key={column.id}
                            className="flex items-center justify-between px-4 py-3 hover:bg-blue-50 text-sm border-b border-gray-50 last:border-b-0 transition-colors duration-150"
                          >
                            <label className="flex items-center gap-3 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={column.getIsVisible()}
                                onChange={column.getToggleVisibilityHandler()}
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-2"
                              />
                              <div className="flex items-center gap-2 min-w-0">
                                {isPinned && (
                                  <div className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                    pinSide === 'left' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {pinSide === 'left' ? 'L' : 'R'}
                                  </div>
                                )}
                                <span className="truncate font-medium text-gray-700">
                                  {String(column.columnDef.header ?? column.id)}
                                </span>
                              </div>
                            </label>
                            
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => column.pin("left")}
                                className={`p-1.5 rounded border text-xs transition-colors duration-150 ${
                                  pinSide === 'left' 
                                    ? 'bg-blue-100 border-blue-300 text-blue-700' 
                                    : 'hover:bg-gray-100 border-gray-200 text-gray-600'
                                }`}
                                title="Pin left"
                              >
                                <FaArrowLeft size={10} />
                              </button>
                              <button
                                onClick={() => column.pin("right")}
                                className={`p-1.5 rounded border text-xs transition-colors duration-150 ${
                                  pinSide === 'right' 
                                    ? 'bg-purple-100 border-purple-300 text-purple-700' 
                                    : 'hover:bg-gray-100 border-gray-200 text-gray-600'
                                }`}
                                title="Pin right"
                              >
                                <FaArrowRight size={10} />
                              </button>
                              <button
                                onClick={() => column.pin(false)}
                                className="p-1.5 rounded border hover:bg-gray-100 border-gray-200 text-gray-600 text-xs transition-colors duration-150"
                                title="Unpin"
                              >
                                <FaTimes size={10} />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Table Container */}
        <div className="p-6">
          <div
            ref={parentRef}
            className="overflow-auto max-h-[500px] border border-gray-200 rounded-lg shadow-inner bg-gray-50"
          >
            <table className="min-w-full border-collapse text-sm bg-white">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10 shadow-sm border-b-2 border-gray-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header, i) => {
                      const isPinned = header.column.getIsPinned();
                      const pinSide = isPinned === "left" ? "left" : isPinned === "right" ? "right" : null;
                      
                      return (
                        <th
                          key={header.id}
                          style={{
                            width: header.getSize(),
                            minWidth: header.getSize(),
                            background: isPinned
                              ? pinSide === "left" 
                                ? "linear-gradient(to right, #dbeafe, #f8fafc)"
                                : "linear-gradient(to left, #faf5ff, #f8fafc)"
                              : undefined,
                          }}
                          className={`
                            border-r border-gray-200 last:border-r-0 px-4 py-4 text-left relative group
                            ${isPinned ? 'shadow-sm' : ''}
                          `}
                        >
                          {!header.isPlaceholder && (
                            <DraggableHeader
                              header={header}
                              index={i}
                              moveColumn={moveColumn}
                            />
                          )}
                          
                          {header.column.getCanResize() && (
                            <div
                              onMouseDown={header.getResizeHandler()}
                              onTouchStart={header.getResizeHandler()}
                              className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-blue-400 transition-colors duration-200 group-hover:bg-blue-200"
                            />
                          )}
                        </th>
                      );
                    })}
                  </tr>
                ))}
              </thead>
              
              <tbody>
                {paddingTop > 0 && (
                  <tr>
                    <td
                      style={{ height: `${paddingTop}px` }}
                      colSpan={visibleCount}
                    />
                  </tr>
                )}
                
                {virtualRows.map((virtualRow) => {
                  const row = table.getRowModel().rows[virtualRow.index];
                  const isEven = virtualRow.index % 2 === 0;
                  
                  return (
                    <tr
                      key={row.id}
                      className={`
                        transition-all duration-150 border-b border-gray-100
                        ${isEven ? "bg-white hover:bg-blue-50" : "bg-gray-50 hover:bg-blue-50"}
                        hover:shadow-sm
                      `}
                      style={{ height: `${virtualRow.size}px` }}
                    >
                      {row.getVisibleCells().map((cell, cellIndex) => {
                        const isPinned = cell.column.getIsPinned();
                        const pinSide = isPinned === "left" ? "left" : isPinned === "right" ? "right" : null;
                        
                        return (
                          <td
                            key={cell.id}
                            className={`
                              px-4 py-3 border-r border-gray-100 last:border-r-0 text-gray-700 font-medium
                              ${cellIndex === 0 ? 'font-semibold text-gray-900' : ''}
                              ${isPinned ? 'shadow-sm' : ''}
                            `}
                            style={{
                              background: isPinned
                                ? pinSide === "left" 
                                  ? isEven ? "#f8fafc" : "#f1f5f9"
                                  : isEven ? "#fefbff" : "#f5f3ff"
                                : undefined,
                            }}
                          >
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                
                {paddingBottom > 0 && (
                  <tr>
                    <td
                      style={{ height: `${paddingBottom}px` }}
                      colSpan={visibleCount}
                    />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Enhanced Pagination */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{((currentPage - 1) * 10) + 1}</span> to{' '}
              <span className="font-semibold">
                {Math.min(currentPage * 10, filteredRows)}
              </span> of{' '}
              <span className="font-semibold">{filteredRows.toLocaleString()}</span> results
              {globalFilter && (
                <span className="text-blue-600 ml-1">(filtered)</span>
              )}
            </div>
            
            <div className="flex justify-center items-center gap-1">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 text-gray-600"
                title="Previous page"
              >
                <FaChevronLeft size={12} />
              </button>

              {(() => {
                const pageCount = table.getPageCount();
                const current = table.getState().pagination.pageIndex;
                const maxButtons = 7;
                const buttons: (number | string)[] = [];

                if (pageCount <= maxButtons) {
                  for (let i = 0; i < pageCount; i++) buttons.push(i);
                } else {
                  const left = Math.max(1, current - 2);
                  const right = Math.min(pageCount - 2, current + 2);

                  buttons.push(0);
                  if (left > 1) buttons.push("...");
                  for (let i = left; i <= right; i++) {
                    buttons.push(i);
                  }
                  if (right < pageCount - 2) buttons.push("...");
                  buttons.push(pageCount - 1);
                }

                return buttons.map((p, idx) =>
                  typeof p === "string" ? (
                    <span key={idx} className="px-3 py-2 text-gray-500 text-sm">
                      {p}
                    </span>
                  ) : (
                    <button
                      key={idx}
                      onClick={() => table.setPageIndex(p)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-150 ${
                        table.getState().pagination.pageIndex === p
                          ? "bg-blue-500 text-white border-blue-500 shadow-md"
                          : "hover:bg-gray-100 border-gray-300 text-gray-700"
                      }`}
                    >
                      {p + 1}
                    </button>
                  )
                );
              })()}

              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 text-gray-600"
                title="Next page"
              >
                <FaChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}