import { useState, useEffect, useRef } from 'react';
import { ArchLensAPI } from './api/client';
import type { TreeNodeData } from './types';
import { TreeNode } from './components/TreeNode';
import { TreeView } from './components/TreeView';

function App() {
  const [targetPath, setTargetPath] = useState('');
  const [rootNode, setRootNode] = useState<TreeNodeData | null>(null);
  const [asciiResult, setAsciiResult] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [mode, setMode] = useState<'basic' | 'full'>('basic');
  const [enableTruncation, setEnableTruncation] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. 本地路徑掃描
  const handleLocalScan = async () => {
    if (!targetPath) return alert("請輸入本地路徑");
    setIsScanning(true);
    try {
      const data = await ArchLensAPI.scanLocalPath(targetPath);
      setRootNode(data);
    } catch (error) {
      alert(error instanceof Error ? error.message : "掃描失敗");
    } finally {
      setIsScanning(false);
    }
  };

  // 2. ZIP 檔案掃描
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsScanning(true);
    try {
      const data = await ArchLensAPI.scanZipFile(file);
      setRootNode(data);
      setTargetPath(`ZIP: ${file.name}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "ZIP 解析失敗");
    } finally {
      setIsScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 3. 自動更新 ASCII 預覽
  useEffect(() => {
    if (!rootNode) return;
    const fetchFormat = async () => {
      setIsFormatting(true);
      try {
        const res = await ArchLensAPI.formatTree(rootNode, mode, enableTruncation);
        setAsciiResult(res.ascii_tree);
      } catch (error) {
        console.error(error);
      } finally {
        setIsFormatting(false);
      }
    };
    fetchFormat();
  }, [rootNode, mode, enableTruncation]);

  // 4. 遞迴狀態更新演算法 (DD-014 / DD-020)
  const toggleNodeState = (node: TreeNodeData, targetRelPath: string, newStatus: boolean): TreeNodeData => {
    const setAllChildren = (n: TreeNodeData, status: boolean): TreeNodeData => ({
      ...n,
      is_enabled: status,
      children: n.children.map(c => setAllChildren(c, status))
    });

    if (node.relative_path === targetRelPath) {
      return setAllChildren(node, newStatus);
    }

    return {
      ...node,
      children: node.children.map(child => toggleNodeState(child, targetRelPath, newStatus))
    };
  };

  const handleToggle = (relPath: string, newStatus: boolean) => {
    if (!rootNode) return;
    setRootNode(toggleNodeState(rootNode, relPath, newStatus));
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white text-2xl">🔍</div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">ArchLens <span className="text-indigo-600 text-sm font-medium">v1.0</span></h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
             <span>架構分析</span>
             <span>•</span>
             <span>README 生成</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 flex flex-col gap-8">
        
        {/* 控制面板 */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">專案來源 (Local Path / ZIP)</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={targetPath}
                onChange={(e) => setTargetPath(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                placeholder="輸入資料夾絕對路徑，例如: C:/Projects/MyWeb"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors border border-slate-200"
                title="上傳 ZIP 檔案"
              >
                📦 ZIP
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleZipUpload} 
                className="hidden" 
                accept=".zip"
              />
            </div>
          </div>
          
          <div className="flex flex-col justify-end gap-2">
            <button 
              onClick={handleLocalScan}
              disabled={isScanning}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
            >
              {isScanning ? '分析中...' : '解析架構'}
            </button>
          </div>
        </section>

        {/* 雙欄視窗 */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[700px]">
          
          {/* 左側：互動樹 */}
          <div className="flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-700">互動式節點配置</h3>
              <div className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">LIVE</div>
            </div>
            <div className="flex-1 overflow-auto p-6 scrollbar-thin scrollbar-thumb-slate-200">
              {rootNode ? (
                <TreeNode node={rootNode} onToggle={handleToggle} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-4">
                  <div className="text-6xl opacity-20">📂</div>
                  <p className="font-medium">尚未載入專案資料</p>
                </div>
              )}
            </div>
          </div>

        {/* 右側：ASCII 預覽 */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            {/* DD-025 智慧折疊開關 */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">智慧折疊機制</span>
              <button 
                onClick={() => setEnableTruncation(!enableTruncation)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enableTruncation ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${enableTruncation ? 'translate-x-4' : 'translate-x-1'}`} />
              </button>
              <span className="text-[10px] text-slate-400">
                {enableTruncation ? '開啟 (略過同質檔)' : '關閉 (顯示全結構)'}
              </span>
            </div>

            {/* 模式切換 */}
            <div className="flex gap-2 p-1 bg-slate-200/50 rounded-xl w-fit">
              <button 
                onClick={() => setMode('basic')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'basic' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                BASIC
              </button>
              <button 
                onClick={() => setMode('full')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === 'full' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                FULL
              </button>
            </div>
          </div>
          <div className="flex-1">
            <TreeView asciiText={asciiResult} isLoading={isFormatting} rootNodeName={rootNode?.name} />
          </div>
        </div>
        </section>
      </main>
    </div>
  );
}

export default App;