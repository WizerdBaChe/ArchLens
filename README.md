# 🔍 ArchLens 

**ArchLens** 是一款專為現代開發者打造的「專案目錄結構視覺化與 README 樹狀圖生成工具」。

你是否曾為了在 GitHub README 中貼上漂亮的專案結構圖，而手動用鍵盤敲打 `├──` 與 `└──`？或者在使用自動化工具時，畫面被 `node_modules`、`.git` 或成百上千個編譯暫存檔（`.dll`, `.map`）洗版到完全失去閱讀價值？

告別手動排版或被 `node_modules` 與海量 `.dll` 洗版的痛苦。ArchLens 能以極高的效能解析本地資料夾或 ZIP 壓縮檔，並提供一個**「可互動的拼圖式 UI」**，讓你隨心所欲地勾選、剪枝、折疊，一鍵匯出最完美的專案架構圖。

---

## ✨ 核心特色 (Features)

* 🌳 **可互動半透明剪枝 (Interactive Pruning)**
  * 在左側互動樹中，任意取消勾選不需要呈現在文件中的檔案。被取消的節點不會生硬地消失，而是會以「半透明加刪除線」保留在畫面上（保留全域架構視角），而右側的 ASCII 預覽區則會**即時同步**將其剪枝剔除。
* 🧠 **雙重動態防禦引擎 (Dynamic Ignore Engine)**
  * 內建全域廢棄物過濾清單。更強大的是，系統在走訪目錄時會**自動、即時地解讀專案各層級的 `.gitignore` 規則**並動態疊加。工具會自動適應你的專案環境，將雜訊降到最低。
* 📂 **智慧折疊與語意豁免 (Smart Truncation & Exemption)**
  * **自動收合**：同目錄下若出現超過 3 個同類型的非重要檔案（如大量圖片、`.dll`、`.class` 編譯產物），系統會自動將其折疊為單一行省略號（例如：`... (還有 12 個 .dll 檔案)`），防止結構圖破版。
  * **語意白名單**：核心源始碼檔案（如 `.py`, `.ts`, `.md`, `.json` 等）被視為專案骨幹，受到語意豁免保護，數量再多也絕對不會被系統強行收合。
  * **全局掌控**：UI 提供全局開關，允許你隨時一鍵關閉智慧折疊，檢視 100% 的真實全結構。
* ⚡ **動態對齊與純前端匯出 (Dynamic Named Export)**
  * 下載功能完全由前端 Blob 技術實作，0 延遲且不佔用伺服器資源。支援純文字 (`.txt`) 與直接包裹好 Markdown 程式碼區塊的 (`.md`) 格式。匯出時，**檔案名稱會自動對齊你所掃描的專案根目錄名稱**（例如掃描 ArchLens 專案，匯出檔名將全自動命名為 `ArchLens_File_Structure.md`）。

---

## 🛠️ 技術棧 (Tech Stack)

本專案採用嚴謹的 **Monorepo 前後端物理隔離架構**：

* **Backend**: `Python 3.x` + `FastAPI` + `Pydantic` (100% 依賴 Python 標準函式庫處理 I/O，零外部演算法依賴)
* **Frontend**: `React 18` + `TypeScript` + `Vite` + `Tailwind CSS v4` + `Axios`

---

## 🚀 快速開始 (Getting Started)

ArchLens 採用精準的生命週期分離設計。如果您只是想使用此工具的**終端使用者**，您的機台**完全不需要安裝 Node.js 或 npm**，只需擁有 Python 環境即可！

### 1. 首次複製專案後初始化
不論您是開發者還是使用者，請先在專案總根目錄下雙擊執行：
```bash
setup.bat
```
> 該腳本會全自動檢查環境、建立後端 Python 虛擬環境（`.venv`）並安裝所有必要依賴。

### 2. 終端使用者：一鍵運行 (Production Mode)
初始化完成後，直接在根目錄雙擊執行：
```bash
run.bat
```
> 系統會自動為您開啟瀏覽器並定位至 `http://127.0.0.1:8000`，您即可直接開始享受極速的專案分析服務！

---

## 👨‍💻 開發者模式 (Developer Mode)

如果您希望對 ArchLens 進行源碼修改、重構或添加新功能：

1. 請確保您的本機已安裝 `Node.js` 與 `npm`。
2. 執行 `setup.bat`，腳本偵測到 Node 環境後會自動幫前端安裝完所有 npm 套件。
3. 日常開發時，在根目錄執行 **`dev.bat`**。系統會平行彈出兩個視窗，同時啟動後端 FastAPI 與前端 Vite 熱更新伺服器（localhost:5173）。
4. 修改完畢準備發布新版本時，執行 **`build.bat`**。腳本會自動將前端 React TypeScript 專案打包編譯為靜態檔案，並精確轉移至後端的靜態資源目錄中，供 `run.bat` 使用。

## 👨‍💻 開發者詳細操作：

### 1. 啟動後端 (FastAPI)
請確保你的電腦已安裝 Python 3.8+。
```bash
cd archlens_backend

# 建立並啟動虛擬環境 (建議)
python -m venv .venv
# Windows: .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate

# 安裝核心依賴
pip install -r requirements.txt

# 啟動伺服器
uvicorn main:app --reload
```
> 後端伺服器將運行於 `http://127.0.0.1:8000`，你可前往 `/docs` 檢視完整的 Swagger UI API 文件。

### 2. 啟動前端 (React + Vite)
請確保你的電腦已安裝 Node.js (建議 v18+)。打開一個全新的終端機視窗：
```bash
cd archlens_frontend

# 安裝 npm 套件
npm install

# 啟動 Vite 開發伺服器
npm run dev
```
> 前端伺服器將運行於 `http://localhost:5173`。Vite 已配置透明代理 (Proxy)，會自動將 API 請求轉發至後端。

---

## 💡 使用指南 (How to Use)

1. **專案載入**：在上方輸入框輸入您想分析的本地專案「絕對路徑」，或點擊 `📦 ZIP` 按鈕直接上傳壓縮檔。點擊「解析架構」。
2. **層級導覽**：左側互動樹內建預設收合機制，僅展開根目錄。點擊資料夾左側的 `▶` 箭頭即可優雅展開子層，並有視覺引導線協助閱讀。
3. **客製剪枝**：透過 Checkbox 的取消勾選，即時讓右側 ASCII 樹狀圖達到您想要的清爽度。
4. **極速匯出**：切換 `BASIC` 或 `FULL`（帶有檔案大小中繼資料）模式後，點擊右上角 `📥 匯出檔案 ▼`，即可直接下載全自動命名的結構檔案！

---

## 👨‍💻 作者與授權 (Author & License)

* **Author**: NathanBache
* **License**: MIT License

歡迎提交 Issue 或 Pull Request 來共同完善這個工具！若這個專案對你有幫助，請不吝給予一顆 ⭐️ Star。