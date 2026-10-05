import React, { useEffect, useRef } from 'react';

const MenuItem = ({ icon, label, onClick, danger, divider }) => {
  if (divider) return <div className="my-1 border-t border-gray-700/60" />;
  return (
    <button
      onMouseDown={(e) => { e.stopPropagation(); e.preventDefault(); onClick && onClick(); }}
      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-left transition-colors rounded-sm
        ${danger
          ? 'hover:bg-red-500/20 hover:text-red-400 text-gray-300'
          : 'hover:bg-gray-700/80 text-gray-300'
        }
      `}
    >
      <span className="w-4 text-center text-sm">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

const ContextMenu = ({ x, y, node, theme, onClose, onRename, onDelete, onDuplicate, onNewFile, onNewFolder }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    // Small delay so the right-click event doesn't immediately close the menu
    const tid = setTimeout(() => {
      document.addEventListener('mousedown', handleMouseDown);
      document.addEventListener('keydown', handleKey);
    }, 50);
    return () => {
      clearTimeout(tid);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Clamp so menu doesn't overflow viewport
  const menuWidth = 175;
  const menuHeight = node ? 200 : 80;
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 8);
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 8);

  return (
    <div
      ref={menuRef}
      style={{ position: 'fixed', left: adjustedX, top: adjustedY, zIndex: 9999, minWidth: `${menuWidth}px` }}
      className="bg-gray-900 border border-gray-700 rounded-lg shadow-2xl py-1.5 select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Actions on an existing node */}
      {node && (
        <>
          <MenuItem icon="✏️" label="Rename" onClick={onRename} />
          <MenuItem icon="📋" label="Duplicate" onClick={onDuplicate} />
          <MenuItem divider />
          <MenuItem icon="🗑️" label="Delete" onClick={onDelete} danger />
        </>
      )}

      {/* Create actions: always visible for folders, and for blank area right-clicks */}
      {(!node || node.type === 'folder') && (
        <>
          {node && <MenuItem divider />}
          <MenuItem icon="📄" label="New File" onClick={onNewFile} />
          <MenuItem icon="📁" label="New Folder" onClick={onNewFolder} />
        </>
      )}
    </div>
  );
};

export default ContextMenu;
