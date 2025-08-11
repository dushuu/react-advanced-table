import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  useReactTable,
  flexRender,
  type ColumnDef,
  type VisibilityState,
  type ColumnOrderState,
  getCoreRowModel,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { faker } from "@faker-js/faker";

// Drag-and-drop for column reordering
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// React Icons
import { FaGripVertical, FaColumns, FaChevronDown, FaEye, FaEyeSlash } from "react-icons/fa";

type Person = { [key: string]: string };

// Generate mock dataset (2000 rows × 80 columns)
function makeData(): Person[] {
  const columnsCount = 80;
  const rowsCount = 2000;
  const cols: string[] = [];
  for (let i = 0; i < columnsCount; i++) {
    cols.push(`col_${i + 1}`);
  }
  const data: Person[] = [];
  for (let r = 0; r < rowsCount; r++) {
    const row: Person = {};
    cols.forEach((col) => {
      row[col] = faker.word.noun();
    });
    data.push(row);
  }
  return data;
}

// Draggable column header component (uses ref pattern)
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
  
  // attach both drop and drag to the same ref
  useEffect(() => {
    if (!ref.current) return;
    dropRef(ref.current);
    dragRef(ref.current);
  }, [dragRef, dropRef]);

  useEffect(() => {
    setIsDragging(isDragging);
  }, [isDragging]);

  return (
    <div 
      ref={ref} 
      className={`
        flex items-center gap-2 cursor-move select-none group transition-all duration-200
        ${isOver ? 'bg-blue-100 shadow-lg transform scale-105' : ''}
        ${isDragging ? 'opacity-50' : ''}
      `}
    >
      <FaGripVertical className="text-gray-400 group-hover:text-blue-500 transition-colors duration-200" size={12} />
      <span className="font-medium">
        {flexRender(header.column.columnDef.header, header.getContext())}
      </span>
    </div>
  );
};

export function DataTable() {
  const data = useMemo(() => makeData(), []);
  const columns = useMemo<ColumnDef<Person>[]>(() => {
    const cols: ColumnDef<Person>[] = [];
    for (let i = 0; i < 80; i++) {
      cols.push({
        accessorKey: `col_${i + 1}`,
        header: `Column ${i + 1}`,
        cell: (info) => info.getValue() as string,
        size: 150,
      });
    }
    return cols;
  }, []);

  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { columnVisibility, columnOrder },
    onColumnVisibilityChange: setColumnVisibility,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    enableColumnResizing: true,
    enableColumnPinning: true,
  });

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
      const base = old.length ? old : table.getAllLeafColumns().map((c) => c.id);
      const newOrder = [...base];
      const [moved] = newOrder.splice(dragIndex, 1);
      newOrder.splice(hoverIndex, 0, moved);
      return newOrder;
    });
  };

  // Dropdown state + click-outside handling
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setShowColumnMenu(false);
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // Visible columns count for correct colspan on spacers
  const visibleLeafColumns = table.getVisibleLeafColumns();
  const visibleCount = visibleLeafColumns.length;
  const visibleColumnsCount = visibleLeafColumns.length;
  const totalColumnsCount = table.getAllLeafColumns().length;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Data Table</h2>
              <p className="text-sm text-gray-600">
                {data.length.toLocaleString()} rows × {totalColumnsCount} columns 
                ({visibleColumnsCount} visible)
              </p>
            </div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowColumnMenu((s) => !s);
                }}
                className={`
                  flex items-center gap-2 px-4 py-2.5 border rounded-lg font-medium text-sm
                  transition-all duration-200 shadow-sm
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
                <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-80 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <div className="text-sm font-medium text-gray-900">Column Visibility</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {visibleColumnsCount} of {totalColumnsCount} columns visible
                    </div>
                  </div>
                  
                  <div className="max-h-56 overflow-auto">
                    {table.getAllLeafColumns().map((column) => (
                      <label
                        key={column.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 text-sm cursor-pointer transition-colors duration-150 border-b border-gray-50 last:border-b-0"
                      >
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={column.getIsVisible()}
                            onChange={column.getToggleVisibilityHandler()}
                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 focus:ring-2"
                          />
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {column.getIsVisible() ? (
                            <FaEye className="text-green-500 text-xs flex-shrink-0" />
                          ) : (
                            <FaEyeSlash className="text-gray-400 text-xs flex-shrink-0" />
                          )}
                          <span className="truncate font-medium text-gray-700">
                            {String(column.columnDef.header ?? column.id)}
                          </span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Table Container */}
        <div className="p-6">
          <div
            ref={parentRef}
            className="overflow-auto max-h-[580px] border border-gray-200 rounded-lg shadow-inner bg-gray-50"
          >
            <table className="min-w-full border-collapse text-sm bg-white">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10 border-b-2 border-gray-200">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header, i) => (
                      <th
                        key={header.id}
                        style={{
                          width: header.getSize(),
                          minWidth: header.getSize(),
                        }}
                        className="border-r border-gray-200 last:border-r-0 px-4 py-4 text-left relative group"
                      >
                        {!header.isPlaceholder && (
                          <DraggableHeader header={header} index={i} moveColumn={moveColumn} />
                        )}

                        {/* Enhanced Column resizer */}
                        {header.column.getCanResize() && (
                          <div
                            onMouseDown={header.getResizeHandler()}
                            onTouchStart={header.getResizeHandler()}
                            className="absolute right-0 top-0 h-full w-1.5 cursor-col-resize bg-transparent hover:bg-blue-400 transition-colors duration-200 group-hover:bg-blue-200"
                          />
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>

              <tbody>
                {/* top spacer */}
                {paddingTop > 0 && (
                  <tr>
                    <td style={{ height: `${paddingTop}px` }} colSpan={visibleCount} />
                  </tr>
                )}

                {/* Enhanced visible rows */}
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
                      {row.getVisibleCells().map((cell, cellIndex) => (
                        <td 
                          key={cell.id} 
                          className={`
                            px-4 py-3 border-r border-gray-100 last:border-r-0
                            text-gray-700 font-medium
                            ${cellIndex === 0 ? 'font-semibold text-gray-900' : ''}
                          `}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  );
                })}

                {/* bottom spacer */}
                {paddingBottom > 0 && (
                  <tr>
                    <td style={{ height: `${paddingBottom}px` }} colSpan={visibleCount} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}