@echo off
chcp 65001 >nul
echo ==========================================
echo    ArchLens - 啟動中...
echo ==========================================

cd archlens_backend

:: 檢查靜態檔是否存在
if not exist "static\index.html" (
    echo [警告] 找不到前端靜態檔！
    echo 請開發者先執行 build.bat 進行打包。
    pause
    exit /b
)

:: 自動開啟瀏覽器 (延遲 2 秒確保伺服器已啟動)
start "" "http://127.0.0.1:8000"

:: 啟動後端伺服器 (靜態掛載模式)
call .venv\Scripts\activate.bat
python main.py