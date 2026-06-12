@echo off
chcp 65001 >nul
echo ==========================================
echo    ArchLens - 雙伺服器開發模式啟動
echo ==========================================

echo 正在啟動 FastAPI 後端...
start "ArchLens Backend" cmd /k "cd archlens_backend && call .venv\Scripts\activate.bat && python main.py"

echo 正在啟動 Vite 前端...
start "ArchLens Frontend" cmd /k "cd archlens_frontend && npm run dev"

echo 啟動指令已發送，請查看新彈出的終端機視窗。
exit