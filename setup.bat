@echo off
chcp 65001 >nul
echo ==========================================
echo    ArchLens - 開發環境初始化腳本
echo ==========================================

:: 1. 檢查 Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [錯誤] 找不到 Python，請確認已安裝並加入環境變數 PATH 中。
    pause
    exit /b
)

:: 2. 設定後端虛擬環境
echo.
echo [1/3] 正在設定後端 Python 虛擬環境...
cd archlens_backend
if not exist ".venv\" (
    python -m venv .venv
    echo 虛擬環境建立完成。
) else (
    echo 虛擬環境已存在。
)

echo 安裝 Python 依賴套件...
call .venv\Scripts\activate.bat
pip install -r requirements.txt
cd ..

:: 3. 檢查 Node.js (決定是否安裝前端)
echo.
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [提示] 找不到 Node.js，跳過前端 npm 模組安裝。
    echo (若您是終端使用者，此為正常現象，請直接執行 run.bat)
    pause
    exit /b
)

:: 4. 設定前端環境
echo [2/3] 偵測到 Node.js，正在設定前端開發環境...
cd archlens_frontend
call npm install
cd ..

echo.
echo ==========================================
echo    初始化完成！
echo    開發請執行: dev.bat
echo    發行請執行: build.bat
echo ==========================================
pause