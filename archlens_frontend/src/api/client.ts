import type { TreeNodeData, FormatResponse } from '../types';
import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  timeout: 10000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorMsg = error.response?.data?.detail || '網路連線異常，請檢查後端是否啟動';
    console.error('[ArchLens API 錯誤]:', errorMsg);
    return Promise.reject(new Error(errorMsg));
  }
);

export const ArchLensAPI = {
  scanLocalPath: (targetPath: string): Promise<TreeNodeData> => {
    return api.post('/api/v1/analyze/scan/local', { target_path: targetPath });
  },

  scanZipFile: (zipFile: File): Promise<TreeNodeData> => {
    const formData = new FormData();
    formData.append('file', zipFile);
    return api.post('/api/v1/analyze/scan/zip', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // 在 ArchLensAPI 內更新 formatTree 函式：
  formatTree: (rootNode: TreeNodeData, mode: 'basic' | 'full' = 'basic', enableTruncation: boolean = true): Promise<FormatResponse> => {
    return api.post('/api/v1/analyze/format', {
      root_node: rootNode,
      mode: mode,
      enable_truncation: enableTruncation,
    });
  }
};