import React, { useState, useRef, useCallback, useEffect } from 'react';

const ResizablePanels = ({ children, direction = 'horizontal', className = '', minSizes = [], initialSizes = null }) => {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Convert children to array to strip out false/null/undefined dynamically rendered blocks
  const childArray = React.Children.toArray(children);
  const activeCount = childArray.length;

  const [sizes, setSizes] = useState(() => {
    if (initialSizes && initialSizes.length === activeCount) {
      return initialSizes;
    }
    const defaultSize = 100 / activeCount;
    return Array(activeCount).fill(defaultSize);
  });
  const dragging = useRef(null);

  useEffect(() => {
    if (sizes.length !== activeCount) {
      // If we are dynamically showing/hiding panels, re-balance the remaining space
      if (initialSizes && initialSizes.length === activeCount) {
        setSizes(initialSizes);
      } else {
        setSizes(Array(activeCount).fill(100 / activeCount));
      }
    }
  }, [activeCount, sizes.length, initialSizes]);

  const onMouseDown = useCallback((e, index) => {
    e.preventDefault();
    setIsDragging(true);
    dragging.current = { index, startX: e.clientX, startY: e.clientY, startSizes: [...sizes] };

    const onMouseMove = (moveEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const total = direction === 'horizontal' ? rect.width : rect.height;
      const delta = direction === 'horizontal'
        ? (moveEvent.clientX - dragging.current.startX) / total * 100
        : (moveEvent.clientY - dragging.current.startY) / total * 100;

      const { index: idx, startSizes } = dragging.current;
      const leftMin = minSizes[idx] ?? 10;
      const rightMin = minSizes[idx + 1] ?? 10;

      let newLeft = startSizes[idx] + delta;
      let newRight = startSizes[idx + 1] - delta;

      if (newLeft < leftMin) { newRight += newLeft - leftMin; newLeft = leftMin; }
      if (newRight < rightMin) { newLeft += newRight - rightMin; newRight = rightMin; }

      const newSizes = [...startSizes];
      newSizes[idx] = newLeft;
      newSizes[idx + 1] = newRight;
      setSizes(newSizes);
    };

    const onMouseUp = () => {
      dragging.current = null;
      setIsDragging(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }, [sizes, direction, minSizes]);

  return (
    <div
      ref={containerRef}
      className={`${className} ${direction === 'horizontal' ? 'flex flex-row' : 'flex flex-col'} w-full h-full overflow-hidden`}
    >
      {childArray.map((child, i) => (
        <React.Fragment key={i}>
          <div
            style={direction === 'horizontal' ? { width: `${sizes[i]}%`, minWidth: 0 } : { height: `${sizes[i]}%`, minHeight: 0 }}
            className={`overflow-hidden flex-shrink-0 ${isDragging ? 'pointer-events-none select-none' : ''}`}
          >
            {child}
          </div>
          {i < childArray.length - 1 && (
            <div
              onMouseDown={(e) => onMouseDown(e, i)}
              className={`
                flex-shrink-0 z-10 group relative
                ${direction === 'horizontal' ? 'w-1 cursor-col-resize hover:w-1' : 'h-1 cursor-row-resize hover:h-1'}
                bg-gray-700 hover:bg-blue-500 transition-colors duration-150
              `}
              style={direction === 'horizontal' ? { width: '4px' } : { height: '4px' }}
            >
              <div className={`
                absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100
              `}>
                {direction === 'horizontal'
                  ? <div className="h-8 w-0.5 bg-blue-400 rounded-full" />
                  : <div className="w-8 h-0.5 bg-blue-400 rounded-full" />
                }
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default ResizablePanels;
