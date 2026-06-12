/**
 * 嚴格對齊 FastAPI 後端的 Pydantic NodeSchema
 */
export interface TreeNodeData {
  name: string;
  is_dir: boolean;
  relative_path: string;
  size: number;
  is_enabled: boolean;
  children: TreeNodeData[]; // 遞迴型別：子節點也是 TreeNodeData
}

export interface FormatResponse {
  ascii_tree: string;
}