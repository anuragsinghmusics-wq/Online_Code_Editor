import React, { useState, useEffect } from 'react';
import { X, Settings, Monitor, Type, WrapText, AlignLeft } from 'lucide-react';

const SettingsModal = ({ isOpen, onClose, settings, onSettingsChange, theme }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  if (!isOpen) return null;

  const dark = theme === 'dark';

  const handleChange = (key, value) => {
    const updated = { ...localSettings, [key]: value };
    setLocalSettings(updated);
    onSettingsChange(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl border flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200
        ${dark ? 'bg-[#1e1e1e] border-[#333333] text-gray-200' : 'bg-white border-gray-200 text-gray-800'}
      `}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${dark ? 'border-[#333333]' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Editor Settings</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${dark ? 'hover:bg-[#333333]' : 'hover:bg-gray-100'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Font Size */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Type className={`w-5 h-5 ${dark ? 'text-gray-400' : 'text-gray-500'}`} />
              <div>
                <h3 className="font-medium">Font Size</h3>
                <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Editor text size in pixels</p>
              </div>
            </div>
            <input
              type="number"
              min="10"
              max="30"
              value={localSettings.fontSize}
              onChange={(e) => handleChange('fontSize', parseInt(e.target.value) || 16)}
              className={`w-20 px-3 py-1.5 text-sm rounded-md border focus:outline-none focus:ring-2 focus:ring-blue-500
                ${dark ? 'bg-[#2d2d2d] border-[#444444] text-white' : 'bg-white border-gray-300'}
              `}
            />
          </div>

          {/* Word Wrap */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <WrapText className={`w-5 h-5 ${dark ? 'text-gray-400' : 'text-gray-500'}`} />
              <div>
                <h3 className="font-medium">Word Wrap</h3>
                <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Wrap lines that exceed editor width</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={localSettings.wordWrap}
                onChange={(e) => handleChange('wordWrap', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Minimap */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Monitor className={`w-5 h-5 ${dark ? 'text-gray-400' : 'text-gray-500'}`} />
              <div>
                <h3 className="font-medium">Minimap</h3>
                <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Show code overview on the right</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={localSettings.minimap}
                onChange={(e) => handleChange('minimap', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Format on Paste */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlignLeft className={`w-5 h-5 ${dark ? 'text-gray-400' : 'text-gray-500'}`} />
              <div>
                <h3 className="font-medium">Format on Paste</h3>
                <p className={`text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Automatically format pasted code</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={localSettings.formatOnPaste}
                onChange={(e) => handleChange('formatOnPaste', e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t flex justify-end ${dark ? 'border-[#333333] bg-[#2d2d2d]' : 'border-gray-200 bg-gray-50'}`}>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
