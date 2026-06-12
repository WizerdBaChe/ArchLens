import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routers import analyze

app = FastAPI(
    title="ArchLens API",
    description="專案目錄結構分析與視覺化引擎",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 掛載 API 路由
app.include_router(analyze.router)

# [新增 DD-027] 發行路徑靜態檔掛載
# 檢查 static 目錄是否存在 (供 run.bat 使用)
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

if os.path.exists(STATIC_DIR):
    # 掛載 Vite 產生的 assets 目錄 (JS/CSS)
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    # 攔截根目錄請求，回傳 Vite 產生的 index.html
    @app.get("/")
    async def serve_frontend():
        index_path = os.path.join(STATIC_DIR, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)
        return {"message": "前端靜態檔遺失，請執行 build.bat"}
else:
    @app.get("/")
    async def dev_mode_notice():
        return {"message": "目前為 API 開發模式。請透過 localhost:5173 存取前端，或執行 build.bat 產生靜態檔。"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)