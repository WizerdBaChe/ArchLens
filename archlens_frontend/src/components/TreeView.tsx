// src/components/TreeView.tsx
import React, { useState } from 'react';

interface TreeViewProps {
  asciiText: string;
  isLoading: boolean;
  rootNodeName?: string; // [新增] 接收來自父組件的根目錄名稱
}

export const TreeView: React.FC<TreeViewProps> = ({ asciiText, isLoading, rootNodeName }) => {
  const [showDropdown, setShowDropdown] = useState(false);

  const triggerDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    setShowDropdown(false);
  };

  // [新增] 動態檔名生成器 (並過濾作業系統不允許的非法字元)
  const getDynamicFilename = (extension: string) => {
    const safeName = rootNodeName ? rootNodeName.replace(/[<>:"/\\|?*]+/g, '') : 'Project';
    return `${safeName}_File_Structure.${extension}`;
  };

  const exportAsTxt = () => {
    if (!asciiText) return;
    triggerDownload(getDynamicFilename('txt'), asciiText);
  };

  const exportAsMd = () => {
    if (!asciiText) return;
    const title = rootNodeName ? rootNodeName.replace(/[<>:"/\\|?*]+/g, '') : 'Project';
    const markdownContent = `# ${title} Structure\n\n\`\`\`text\n${asciiText}\`\`\`\n`;
    triggerDownload(getDynamicFilename('md'), markdownContent);
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      <div className="bg-slate-900 px-6 py-3.5 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="text-slate-400 font-mono text-xs uppercase tracking-wider font-bold">ASCII Preview</span>
        </div>
        
        <div className="flex items-center gap-2 relative">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(asciiText);
              alert("已成功複製樹狀圖至剪貼簿！");
            }}
            disabled={!asciiText}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold px-4 py-2 rounded-xl border border-slate-700 cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            📋 複製文字
          </button>

          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            disabled={!asciiText}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl shadow-md shadow-indigo-950/50 cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            📥 匯出檔案 ▼
          </button>

          {showDropdown && asciiText && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowDropdown(false)}></div>
              <div className="absolute right-0 top-10 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 overflow-hidden py-1 animate-in fade-in slide-in-from-top-1 duration-100">
                <button 
                  onClick={exportAsTxt}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-700 font-medium transition-colors cursor-pointer"
                >
                  📄 匯出純文字 (.txt)
                </button>
                <button 
                  onClick={exportAsMd}
                  className="w-full text-left px-4 py-2.5 text-xs text-slate-300 hover:bg-slate-700 font-medium transition-colors border-t border-slate-700/50 cursor-pointer"
                >
                  markdown 匯出 (.md)
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="p-6 overflow-auto flex-1 relative bg-slate-950/50 scrollbar-thin scrollbar-thumb-slate-800">
        {isLoading && (
          <div className="absolute inset-0 bg-slate-950/80 flex items-center justify-center text-emerald-400 font-mono text-xs tracking-widest animate-pulse z-10">
            [ ENGINE RENDERING... ]
          </div>
        )}
        <pre className="text-emerald-400 font-mono text-sm leading-relaxed whitespace-pre font-normal tracking-wide selection:bg-indigo-500/30">
          {asciiText || (
            <span className="text-slate-600 italic font-light">
              等待左側解析完成後，此處將即時渲染 ASCII 結構圖...
            </span>
          )}
        </pre>
      </div>
    </div>
  );
};