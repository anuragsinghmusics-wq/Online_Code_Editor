import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Loader, Trash2, Check } from 'lucide-react';
import { webContainerService } from '../services/WebContainerService';

const DependenciesPane = ({ files, theme, language }) => {
  const [dependencies, setDependencies] = useState({});
  const [devDependencies, setDevDependencies] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [installingPkg, setInstallingPkg] = useState(null);

  const dark = theme === 'dark';

  // Parse package.json whenever files change
  useEffect(() => {
    const pkgFile = files?.find(f => f.name === 'package.json');
    if (pkgFile && pkgFile.content) {
      try {
        const pkgStr = pkgFile.content;
        const pkg = JSON.parse(pkgStr);
        setDependencies(pkg.dependencies || {});
        setDevDependencies(pkg.devDependencies || {});
      } catch (e) {
        console.warn('Could not parse package.json in DependenciesPane', e);
      }
    } else {
      setDependencies({});
      setDevDependencies({});
    }
  }, [files]);

  // Debounced search NPM registry
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await fetch(`https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(searchQuery)}&size=5`);
        const data = await res.json();
        setSearchResults(data.objects || []);
      } catch (err) {
        console.error('NPM search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleInstall = async (pkgName, isDev = false) => {
    // Only attempt install if WebContainer is booted
    if (!webContainerService.instance) {
      alert("Please start the development server first to install packages.");
      return;
    }

    setInstallingPkg(pkgName);
    try {
      const args = ['install', pkgName];
      if (isDev) args.push('-D');
      
      const process = await webContainerService.spawn('npm', args);
      const exitCode = await process.exit;
      if (exitCode !== 0) {
        console.error(`Failed to install ${pkgName}`);
      }
      setSearchQuery('');
    } catch (err) {
      console.error(err);
    } finally {
      setInstallingPkg(null);
    }
  };

  const isInstalled = (pkgName) => !!dependencies[pkgName] || !!devDependencies[pkgName];

  return (
    <div className={`h-full flex flex-col ${dark ? 'text-gray-200' : 'text-gray-800'}`}>
      <div className={`px-4 py-3 border-b flex flex-col gap-3 ${dark ? 'border-[#333333]' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-orange-500" />
          <h2 className="text-xs font-bold uppercase tracking-wider">Dependencies</h2>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className={`absolute left-2.5 top-2 w-3.5 h-3.5 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search npm packages..."
            className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-md border focus:outline-none focus:ring-1 focus:ring-blue-500
              ${dark ? 'bg-[#181818] border-[#333333] text-gray-200 placeholder-gray-500' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-400'}
            `}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Search Results */}
        {searchQuery && (
          <div className={`border-b ${dark ? 'border-[#333333]' : 'border-gray-200'} pb-2`}>
            <div className={`px-4 py-2 text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
              Search Results
            </div>
            {isSearching ? (
              <div className="flex justify-center py-4">
                <Loader className="w-4 h-4 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="flex flex-col">
                {searchResults.map((res) => {
                  const pkg = res.package;
                  const installed = isInstalled(pkg.name);
                  const installing = installingPkg === pkg.name;

                  return (
                    <div key={pkg.name} className={`px-4 py-2 flex items-center justify-between group
                      ${dark ? 'hover:bg-[#2d2d2d]' : 'hover:bg-gray-100'}
                    `}>
                      <div className="flex flex-col overflow-hidden mr-2">
                        <span className="text-sm font-medium truncate" title={pkg.name}>{pkg.name}</span>
                        <span className={`text-[10px] truncate ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{pkg.version}</span>
                      </div>
                      
                      {installed ? (
                        <Check className="w-4 h-4 text-green-500 shrink-0" />
                      ) : installing ? (
                        <Loader className="w-4 h-4 animate-spin text-blue-500 shrink-0" />
                      ) : (
                        <button
                          onClick={() => handleInstall(pkg.name)}
                          className={`p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity
                            ${dark ? 'bg-[#333333] hover:bg-blue-600' : 'bg-gray-200 hover:bg-blue-500 hover:text-white'}
                          `}
                          title={`Install ${pkg.name}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
                {searchResults.length === 0 && !isSearching && (
                  <div className={`px-4 py-2 text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>No packages found.</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Installed Dependencies */}
        {!searchQuery && (
          <div className="py-2">
            <div className="flex flex-col">
              {Object.entries(dependencies).map(([name, version]) => (
                <div key={name} className={`px-4 py-1.5 flex items-center justify-between group
                  ${dark ? 'hover:bg-[#2d2d2d]' : 'hover:bg-gray-100'}
                `}>
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Package className={`w-3.5 h-3.5 shrink-0 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                    <span className="text-sm truncate" title={name}>{name}</span>
                  </div>
                  <span className={`text-[10px] font-mono shrink-0 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{version}</span>
                </div>
              ))}
              
              {Object.keys(devDependencies).length > 0 && (
                <>
                  <div className={`px-4 py-2 mt-2 text-[10px] font-semibold uppercase tracking-wider ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Dev Dependencies
                  </div>
                  {Object.entries(devDependencies).map(([name, version]) => (
                    <div key={name} className={`px-4 py-1.5 flex items-center justify-between group
                      ${dark ? 'hover:bg-[#2d2d2d]' : 'hover:bg-gray-100'}
                    `}>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Package className={`w-3.5 h-3.5 shrink-0 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className="text-sm truncate" title={name}>{name}</span>
                      </div>
                      <span className={`text-[10px] font-mono shrink-0 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{version}</span>
                    </div>
                  ))}
                </>
              )}

              {Object.keys(dependencies).length === 0 && Object.keys(devDependencies).length === 0 && (
                <div className={`px-4 py-4 text-xs text-center ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                  No dependencies found in package.json.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DependenciesPane;
