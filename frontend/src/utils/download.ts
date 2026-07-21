import api from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function buildDownloadUrl(endpoint: string): string {
  return `${API_BASE_URL}${endpoint}`;
}

const getFilenameFromDisposition = (contentDisposition?: string | null, fallbackFilename = 'download.bin'): string => {
  if (!contentDisposition) return fallbackFilename;
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)/i.exec(contentDisposition);
  if (!match) return fallbackFilename;
  return match[1].replace(/['"]+/g, '');
};

const getExtensionFromMime = (mimeType: string): string => {
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('vnd.openxmlformats-officedocument.spreadsheetml.sheet')) return 'xlsx';
  if (mimeType.includes('csv')) return 'csv';
  return 'bin';
};

export async function downloadFile(endpoint: string, filename?: string): Promise<void> {
  const response = await api.get(endpoint, {
    responseType: 'blob',
  });

  const contentType: any = response.headers['content-type'] || 'application/octet-stream';
  const blob = new Blob([response.data], { type: contentType });
  const resolvedFilename = filename || getFilenameFromDisposition(response.headers['content-disposition'], `download.${getExtensionFromMime(contentType)}`);

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', resolvedFilename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export function isWebView(): boolean {
  const ua = navigator.userAgent || '';
  const isAndroidWebView = /Android/.test(ua) && (/wv\)/.test(ua) || !/Chrome/.test(ua));
  const isIosWebView = /iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua);
  return isAndroidWebView || isIosWebView;
}
