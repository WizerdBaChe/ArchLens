import os
import json
import fnmatch
import zipfile
from pathlib import Path
from typing import List, Optional


class Node:
    """OOP Node Instance: 承載完整中繼資料的目錄樹節點"""

    def __init__(self, name: str, is_dir: bool, relative_path: str, size: int = 0):
        self.name: str = name
        self.is_dir: bool = is_dir
        self.relative_path: str = relative_path
        self.size: int = size
        self.children: List['Node'] = []

    def add_child(self, child: 'Node'):
        self.children.append(child)


def load_config(config_path: str = "config.json") -> List[str]:
    """讀取外部 JSON 配置檔中的基本過濾規則"""
    if os.path.exists(config_path):
        with open(config_path, "r", encoding="utf-8") as f:
            try:
                return json.load(f).get("ignore_patterns", [])
            except json.JSONDecodeError:
                print(f"警告：'{config_path}' 格式錯誤，將不使用任何基礎過濾規則。")
                return []
    return []


def parse_gitignore(gitignore_path: str) -> List[str]:
    """[新增 DD-021] 動態解析目標專案內的 .gitignore 規則"""
    patterns = []
    if os.path.exists(gitignore_path):
        with open(gitignore_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                # 略過空行與註解
                if not line or line.startswith("#"):
                    continue
                # 標準化：移除結尾斜線以相容 fnmatch 目錄名稱比對
                if line.endswith("/"):
                    line = line[:-1]
                patterns.append(line)
    return patterns


def should_ignore(name: str, patterns: List[str]) -> bool:
    """利用 fnmatch 標準庫檢查名稱是否命中萬用字元規則"""
    return any(fnmatch.fnmatch(name, pattern) for pattern in patterns)


def scan_directory(dir_path: str, ignore_patterns: List[str], root_path: Optional[str] = None) -> Optional[Node]:
    """遞迴走訪本地資料夾，動態載入局部 .gitignore 並建立 Node 樹"""
    if root_path is None:
        root_path = dir_path

    path_obj = Path(dir_path)
    if should_ignore(path_obj.name, ignore_patterns):
        return None

    # [實作 DD-021] 動態建立當前目錄層級的忽略規則副本，防範全域污染
    local_patterns = ignore_patterns.copy()
    local_gitignore = os.path.join(dir_path, ".gitignore")
    if os.path.exists(local_gitignore):
        local_patterns.extend(parse_gitignore(local_gitignore))

    rel_path = os.path.relpath(dir_path, root_path)
    if rel_path == ".":
        rel_path = ""

    node = Node(name=path_obj.name, is_dir=True, relative_path=rel_path)

    try:
        for entry in os.scandir(dir_path):
            if should_ignore(entry.name, local_patterns):
                continue

            if entry.is_dir(follow_symlinks=False):
                # 將新疊加的局部過濾清單向下傳遞給子樹
                child_node = scan_directory(entry.path, local_patterns, root_path)
                if child_node:
                    node.add_child(child_node)
            else:
                stat = entry.stat()
                child_rel_path = os.path.relpath(entry.path, root_path)
                child_node = Node(
                    name=entry.name,
                    is_dir=False,
                    relative_path=child_rel_path,
                    size=stat.st_size
                )
                node.add_child(child_node)
    except PermissionError:
        pass

    return node


def scan_zip(zip_path: str, ignore_patterns: List[str]) -> Optional[Node]:
    """解析 ZIP 壓縮檔結構，並在記憶體中重構為 Node 樹"""
    path_obj = Path(zip_path)
    root_node = Node(name=path_obj.name, is_dir=True, relative_path="")
    nodes_map = {"": root_node}

    with zipfile.ZipFile(zip_path, 'r') as z:
        for info in z.infolist():
            full_path = info.filename.rstrip('/')
            if not full_path:
                continue

            parts = full_path.split('/')
            if any(should_ignore(part, ignore_patterns) for part in parts):
                continue

            current_parts = []
            for i, part in enumerate(parts):
                current_parts.append(part)
                current_rel_path = "/".join(current_parts)
                parent_rel_path = "/".join(current_parts[:-1])

                if current_rel_path not in nodes_map:
                    is_dir = info.is_dir() if i == len(parts) - 1 else True
                    size = info.file_size if (i == len(parts) - 1 and not is_dir) else 0

                    new_node = Node(name=part, is_dir=is_dir, relative_path=current_rel_path, size=size)
                    nodes_map[current_rel_path] = new_node

                    if parent_rel_path in nodes_map:
                        nodes_map[parent_rel_path].add_child(new_node)
                    else:
                        root_node.add_child(new_node)

    return root_node