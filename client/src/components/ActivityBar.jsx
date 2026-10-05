import React from 'react';
import { Settings, Package, Home, FolderCode } from 'lucide-react';

const ActivityBar = ({ theme, onHomeClick, isProjectLoaded, activeTab, onTabChange, onSettingsClick }) => {
  const dark = theme === 'dark';

  return (
    <div className={`w-12 h-full flex flex-col items-center py-4 border-r shrink-0 z-10
      ${dark ? 'bg-[#181818] border-gray-800' : 'bg-gray-100 border-gray-300'}
    `}>
      {/* Home / Templates Icon */}
      <button 
        onClick={onHomeClick}
        title="Home / Templates"
        className={`p-2 rounded-xl mb-4 transition-colors
          ${dark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}
        `}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>

      {/* Explorer Icon */}
      {isProjectLoaded && (
        <>
          <button 
            onClick={() => onTabChange('explorer')}
            title="Explorer"
            className={`p-2 rounded-xl mb-4 transition-colors relative
              ${activeTab === 'explorer' 
                ? (dark ? 'text-white bg-gray-800/50' : 'text-gray-900 bg-gray-200/50') 
                : (dark ? 'text-gray-500 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200')}
            `}
          >
            {activeTab === 'explorer' && <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />}
            <FolderCode className="w-6 h-6" strokeWidth={1.5} />
          </button>

          {/* Dependencies Icon */}
          <button 
            onClick={() => onTabChange('dependencies')}
            title="Dependencies"
            className={`p-2 rounded-xl mb-4 transition-colors relative
              ${activeTab === 'dependencies' 
                ? (dark ? 'text-white bg-gray-800/50' : 'text-gray-900 bg-gray-200/50') 
                : (dark ? 'text-gray-500 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200')}
            `}
          >
            {activeTab === 'dependencies' && <div className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />}
            <Package className="w-6 h-6" strokeWidth={1.5} />
          </button>
        </>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings Icon */}
      <button 
        onClick={onSettingsClick}
        title="Settings"
        className={`p-2 rounded-xl transition-colors
          ${dark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200'}
        `}
      >
        <Settings className="w-6 h-6" strokeWidth={1.5} />
      </button>
    </div>
  );
};

export default ActivityBar;
