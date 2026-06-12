from fastapi import APIRouter, UploadFile, File, HTTPException
from schemas import LocalScanRequest, FormatRequest, NodeSchema
from services import scanner, formatter
import os
import tempfile
import shutil

router = APIRouter(prefix="/api/v1/analyze", tags=["Analyze"])


@router.post("/scan/local", response_model=NodeSchema)
async def scan_local_path(request: LocalScanRequest):
    """DD-013 策略 A：掃描本地絕對路徑"""
    target = os.path.abspath(request.target_path)
    if not os.path.exists(target):
        raise HTTPException(status_code=404, detail="目標路徑不存在")
    if not os.path.isdir(target):
        raise HTTPException(status_code=400, detail="本地掃描僅支援資料夾路徑")

    ignore_patterns = scanner.load_config("config.json")
    root_node = scanner.scan_directory(target, ignore_patterns)

    if not root_node:
        raise HTTPException(status_code=404, detail="資料夾為空或全被過濾")

    return root_node


@router.post("/scan/zip", response_model=NodeSchema)
async def scan_zip_file(file: UploadFile = File(...)):
    """DD-013 策略 B：上傳 ZIP 檔解析"""
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="僅支援 .zip 檔案")

    # 將上傳的檔案暫存到伺服器本地進行解析
    with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as temp_file:
        shutil.copyfileobj(file.file, temp_file)
        temp_path = temp_file.name

    try:
        ignore_patterns = scanner.load_config("config.json")
        root_node = scanner.scan_zip(temp_path, ignore_patterns)
        if not root_node:
            raise HTTPException(status_code=400, detail="ZIP 解析失敗或為空")
        return root_node
    finally:
        os.remove(temp_path)  # 解析完畢清理暫存檔


@router.post("/format")
async def format_tree(request: FormatRequest):
    """DD-014 預覽區：接收前端傳來的狀態樹，輸出 ASCII 字串"""
    # 這裡我們會調用 formatter，並將 request.root_node 轉換回原本的 OOP Node 進行渲染
    # 並且過濾掉 is_enabled == False 的節點
    # 為了簡化，假設 formatter.render_from_schema 是一個我們新增的轉接函式
    """DD-014 / DD-025 預覽區：接收前端傳來的狀態樹與開關，輸出 ASCII 字串"""
    lines = formatter.render_from_schema(
        request.root_node,
        mode=request.mode,
        enable_truncation=request.enable_truncation
    )
    return {"ascii_tree": "\n".join(lines)}