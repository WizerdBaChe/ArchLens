# ArchLens v1.0 - Developer Reference Guide

> **致未來的開發者與 AI 協作者**：
> 本文件為 ArchLens 專案的核心架構指南。本專案採前後端分離之 Monorepo 架構，並透過根目錄的自動化批次腳本進行生命週期管理。在進行任何新功能開發或重構前，請務必閱讀本文件的「雙軌生命週期」與「API 合約」。

## 1. 系統架構與雙軌部署 (Architecture & Lifecycle)

本專案採用 **Monorepo 雙資料夾實體隔離** 設計 (DD-016)，並引進自動化環境腳本，嚴格區分「開發路徑」與「發行路徑」：

```
archlens/ (總根目錄)
├── ADR.md                 # 歷史架構設計決策紀錄 (Architecture Decision Records)
├── Dev_README.md          # 本開發者指南 (本檔案)
├── README.md              # GitHub 使用者說明文件
├── setup.bat              # 自動化環境初始化腳本 (開發者/使用者通用)
├── dev.bat                # 開發者雙伺服器平行啟動腳本 (僅限開發模式)
├── build.bat              # 前端靜態資源打包與轉移腳本 (發布準備)
├── run.bat                # 終端使用者一鍵啟動腳本 (純 Python 執行期)
├── archlens_backend/      # 後端：FastAPI + Python 標準庫
└── archlens_frontend/     # 前端：React + TypeScript + Vite + Tailwind v4 + Axios
```
詳細版本
```
ArchLens/
├── .idea/
│   ├── inspectionProfiles/
│   │   └── profiles_settings.xml
│   ├── ArchLens.iml
│   ├── modules.xml
│   └── workspace.xml
├── archlens_backend/
│   ├── .idea/
│   │   ├── inspectionProfiles/
│   │   │   └── profiles_settings.xml
│   │   ├── .gitignore
│   │   ├── archlens_backend.iml
│   │   ├── misc.xml
│   │   ├── modules.xml
│   │   └── workspace.xml
│   ├── routers/
│   │   └── analyze.py
│   ├── services/
│   │   ├── formatter.py
│   │   └── scanner.py
│   ├── config.json
│   ├── main.py
│   ├── schemas.py
│   └── requirements.txt
├── archlens_frontend/
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── assets/
│   │   │   ├── hero.png
│   │   │   ├── react.svg
│   │   │   └── vite.svg
│   │   ├── components/
│   │   │   ├── TreeNode.tsx
│   │   │   └── TreeView.tsx
│   │   ├── App.css
│   │   ├── index.css
│   │   ├── types.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .gitignore
│   ├── index.html
│   ├── eslint.config.js
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.app.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── README.md
│   └── vite.config.ts
├── ADR.md
├── Dev_README.md
└── README.md
```
### 1.1 雙軌部署設計哲學 (DD-027)
1. **開發路徑 (Development Path)**：開發者本機需安裝 Python 與 Node.js。透過 `dev.bat` 同時啟動 FastAPI（Port 8000）與 Vite 開發伺服器（Port 5173）。前端透過 Vite Proxy 將 API 請求透明轉發，實現極速熱更新。
2. **發行路徑 (Production/Distribution Path)**：最終使用者**完全不需要**安裝 Node.js 與 npm。開發者在發布前執行 `build.bat`，將前端編譯為純靜態檔案並落地至 `archlens_backend/static/`。後端 FastAPI 會自動掛載此目錄，由 Python 獨立提供全套網頁與 API 服務。最終使用者僅需點擊 `run.bat` 即可運作。

---

## 2. 核心機制與設計決策 (Core Mechanics)

* **絕對路徑正規化 (DD-010)**: 後端接收路徑後，一律轉換為絕對路徑，消除相對參照符號 (`.`, `..`) 導致根目錄名稱遺失的問題。
* **雙重動態防禦 (DD-021)**: 除了 `config.json` 的全域過濾清單外，後端走訪目錄時若遇見 `.gitignore`，會動態局部疊加忽略規則，實現提早剪枝（Pruning）。
* **智慧折疊與語意豁免 (DD-022, DD-025)**: 同目錄下若相同副檔名的非重要檔案（如 `.dll`）超過 3 個，自動收合為虛擬省略節點；而核心源始碼檔案（如 `.py`, `.ts`）受到語意白名單保護，永遠完整顯現。
* **半透明剪枝無視圖 (DD-014)**: 左側控制樹取消勾選時，前端套用半透明與刪除線樣式（狀態保留）；右側文字預覽區則連動觸發後端剪枝演算法，即時重新渲染。
* **純前端極速匯出 (DD-026)**: 下載 `.txt` 或 `.md` 完全由前端透過 Blob 物件與動態檔名生成器實作，不消耗後端資源，且檔名會自動與專案根目錄名稱（`rootNode.name`）完美對齊。

---

## 3. 自動化批次腳本工作流 (Automation Scripts)

為維持專案環境純淨，開發與啟動一律透過根目錄的 `.bat` 檔案完成：

1. **`setup.bat` (環境初始化)**
   * **行為**：檢查 Python 環境 -> 於 `archlens_backend/` 建立 `.venv` 並安裝 `requirements.txt` -> 檢查 Node.js 環境 -> 若存在，則進入 `archlens_frontend/` 執行 `npm install`。
   * **適用時機**：首次複製專案後、或後端依賴有更新時。
2. **`dev.bat` (雙開開發模式)**
   * **行為**：平行彈出兩個獨立的命令列視窗，分別執行 Uvicorn 後端重載伺服器與 Vite 前端開發伺服器。
   * **適用時機**：日常功能開發、介面調整。
3. **`build.bat` (靜態打包轉移)**
   * **行為**：在前端執行 `npm run build` 產生 `dist/` 清單 -> 清空並建立 `archlens_backend/static/` -> 將靜態編譯產物全數複製過去。
   * **適用時機**：準備發布新版本給使用者前。
4. **`run.bat` (使用者純 Python 模式)**
   * **行為**：檢查 `static/index.html` 是否存在 -> 自動開啟預設瀏覽器至 `http://127.0.0.1:8000` -> 啟動後端整合式伺服器。

---

## 4. API 介面合約 (Interface Contract)

前後端通訊完全遵循 Pydantic Schema 與 TypeScript Interface 的 1:1 鐵血映射。

### 4.1 資料模型模型 (Data Models)
```typescript
// 前端: src/types.ts | 後端: schemas.py
export interface TreeNodeData {
  name: string;             // 檔案或資料夾名稱
  is_dir: boolean;          // 是否為目錄
  relative_path: string;    // 相對於掃描根目錄的路徑 (全域唯一 Key)
  size: number;             // 檔案大小 (Bytes)
  is_enabled: boolean;      // 控制該節點是否參與最終 ASCII 渲染
  children: TreeNodeData[]; // 遞迴子節點清單
}
```

### 4.2 路由端點控制
**Base URL**: `/api/v1/analyze`

* `POST /scan/local`: 接收 `{ "target_path": "string" }`，回傳本地目錄解析之 `TreeNodeData`。
* `POST /scan/zip`: 接收 `multipart/form-data` 壓縮檔，回傳記憶體重構之 `TreeNodeData`。
* `POST /format`: 接收 `{ "root_node": TreeNodeData, "mode": "basic"|"full", "enable_truncation": bool }`，傳回即時渲染之 `{ "ascii_tree": "string" }`。
---

## 5. 開發環境完全啟動指南 (Quick Start)

開啟兩個終端機視窗：

**終端機 1：啟動後端**
```bash
cd archlens_backend
# 啟動虛擬環境 (Windows)
.venv\Scripts\activate
# (或 Mac/Linux) source .venv/bin/activate
uvicorn main:app --reload
# 伺服器運行於 http://127.0.0.1:8000
```

**終端機 2：啟動前端**
```bash
cd archlens_frontend
npm run dev
# 伺服器運行於 http://localhost:5173
```

## 6 .開發者快速啟動方式
1. 請確保您的本機已安裝 `Node.js` 與 `npm`。
2. 執行 `setup.bat`，腳本偵測到 Node 環境後會自動幫前端安裝完所有 npm 套件。
3. 日常開發時，在根目錄執行 **`dev.bat`**。系統會平行彈出兩個視窗，同時啟動後端 FastAPI 與前端 Vite 熱更新伺服器（localhost:5173）。
4. 修改完畢準備發布新版本時，執行 **`build.bat`**。腳本會自動將前端 React TypeScript 專案打包編譯為靜態檔案，並精確轉移至後端的靜態資源目錄中，供 `run.bat` 使用。
