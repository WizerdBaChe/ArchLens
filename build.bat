@echo off
chcp 65001 >nul
echo ==========================================
echo    ArchLens - 靜態資源打包發行腳本
echo ==========================================

cd archlens_frontend
echo [1/2] 正在執行 Vite Build...
call npm run build

echo.
echo [2/2] 正在轉移靜態檔案至後端 static 目錄...
cd ..
if exist "archlens_backend\static" rmdir /s /q "archlens_backend\static"
mkdir "archlens_backend\static"
xcopy "archlens_frontend\dist\*" "archlens_backend\static\" /s /e /y

echo.
echo ==========================================
echo    打包完成！發行版本已就緒。
echo    現在您可以直接執行 run.bat 啟動系統。
echo ==========================================
pause