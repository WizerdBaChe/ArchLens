from pydantic import BaseModel
from typing import List, Optional

class NodeSchema(BaseModel):
    name: str
    is_dir: bool
    relative_path: str
    size: int = 0
    is_enabled: bool = True
    children: List['NodeSchema'] = []

NodeSchema.model_rebuild()

class LocalScanRequest(BaseModel):
    target_path: str

class FormatRequest(BaseModel):
    root_node: NodeSchema
    mode: str = "basic"
    enable_truncation: bool = True  # [新增 DD-025] 全局折疊開關