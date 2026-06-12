import os
from typing import List
from services.scanner import Node
from collections import defaultdict

# [新增 DD-025] 一等公民白名單：這些源始碼檔案永遠不折疊
EXEMPT_EXTENSIONS = {
    '.py', '.js', '.jsx', '.ts', '.tsx', '.json',
    '.md', '.html', '.css', '.java', '.go', '.rs',
    '.cpp', '.c', '.h', '.yml', '.yaml', '.xml'
}

def truncate_and_sort_children(children: list, is_schema: bool = False, enable_truncation: bool = True) -> list:
    """升級版折疊機制：支援全局關閉與局部語意豁免"""
    dirs = [c for c in children if c.is_dir]
    files = [c for c in children if not c.is_dir]

    sorted_dirs = sorted(dirs, key=lambda x: x.name.lower())

    # 如果前端傳來全局關閉，直接純字母排序回傳
    if not enable_truncation:
        return sorted_dirs + sorted(files, key=lambda x: x.name.lower())

    ext_groups = defaultdict(list)
    for f in files:
        ext = os.path.splitext(f.name)[1].lower()
        ext_groups[ext].append(f)

    final_files = []
    for ext in sorted(ext_groups.keys()):
        g_files = sorted(ext_groups[ext], key=lambda x: x.name.lower())

        # 條件判斷：超過 3 個 AND 不在白名單內，才進行折疊
        if len(g_files) > 3 and ext not in EXEMPT_EXTENSIONS:
            final_files.extend(g_files[:3])
            label = f"... (還有 {len(g_files) - 3} 個 {ext or '無副檔名'} 檔案)"

            if is_schema:
                from schemas import NodeSchema
                dummy = NodeSchema(name=label, is_dir=False, relative_path="", size=0, is_enabled=True, children=[])
            else:
                dummy = Node(name=label, is_dir=False, relative_path="", size=0)
            final_files.append(dummy)
        else:
            final_files.extend(g_files)

    return sorted_dirs + final_files

def format_size(size_bytes: int) -> str:
    """將檔案大小轉換為直覺的可讀文字"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.2f} MB"

def render_node(node: Node, mode: str = "basic", prefix: str = "", is_root: bool = True) -> List[str]:
    """CLI 樹狀圖渲染（內建智慧折疊相容）"""
    lines = []
    if is_root:
        lines.append(f"{node.name}/")
        next_prefix = ""
    else:
        next_prefix = prefix

    # 套用智慧折疊排序過濾層
    processed_children = truncate_and_sort_children(node.children, is_schema=False)

    for i, child in enumerate(processed_children):
        is_last = (i == len(processed_children) - 1)
        connector = "└── " if is_last else "├── "

        if child.is_dir:
            display_name = f"{child.name}/"
        else:
            # 如果是虛擬省略節點，不附加檔案大小
            if child.name.startswith("..."):
                display_name = child.name
            else:
                display_name = child.name + (f" ({format_size(child.size)})" if mode == "full" else "")

        lines.append(f"{next_prefix}{connector}{display_name}")

        if child.is_dir:
            child_prefix = next_prefix + ("    " if is_last else "│   ")
            lines.extend(render_node(child, mode, child_prefix, is_root=False))

    return lines


def render_from_schema(node_schema, mode: str = "basic", prefix: str = "", is_root: bool = True,
                       enable_truncation: bool = True) -> List[str]:
    """Web 前端 Pydantic Schema 渲染引擎（接收折疊參數）"""
    if not node_schema.is_enabled:
        return []

    lines = []
    if is_root:
        suffix = " [Root]" if mode == "full" else ""
        lines.append(f"{node_schema.name}{suffix}/")
        next_prefix = ""
    else:
        next_prefix = prefix

    active_children = [c for c in node_schema.children if c.is_enabled]

    # 將參數傳遞給下層排序機制
    processed_children = truncate_and_sort_children(active_children, is_schema=True,
                                                    enable_truncation=enable_truncation)

    for i, child in enumerate(processed_children):
        is_last = (i == len(processed_children) - 1)
        connector = "└── " if is_last else "├── "

        if child.is_dir:
            display_name = f"{child.name}/"
            if mode == "full" and child.relative_path:
                display_name += f" [Path: {child.relative_path}]"
        else:
            if child.name.startswith("..."):
                display_name = child.name
            else:
                display_name = child.name + (f" ({format_size(child.size)})" if mode == "full" else "")

        lines.append(f"{next_prefix}{connector}{display_name}")

        if child.is_dir:
            child_prefix = next_prefix + ("    " if is_last else "│   ")
            lines.extend(
                render_from_schema(child, mode, child_prefix, is_root=False, enable_truncation=enable_truncation))

    return lines

def export_to_output(lines: List[str], filename: str = "structure.txt") -> str:
    """統一將生成結果落地至 output/ 目錄下"""
    output_dir = "output"
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    export_path = os.path.join(output_dir, filename)
    with open(export_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")
    return export_path