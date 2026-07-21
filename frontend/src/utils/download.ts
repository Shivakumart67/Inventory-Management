import api from '../services/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function buildDownloadUrl(endpoint: string, includeToken = false): string {
  const base = `${API_BASE_URL}${endpoint}`;
  if (!includeToken) return base;
  const token = localStorage.getItem('token');
  if (!token) return base;
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}token=${encodeURIComponent(token)}`;
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
  // For mobile WebViews / native apps, blob downloads may be unsupported.
  // In that case, return a direct backend URL (with token) so the native layer can handle the download.
  if (isWebView()) {
    const directUrl = buildDownloadUrl(endpoint, true);
    const payload = JSON.stringify({ type: 'DOWNLOAD', url: directUrl, filename: filename || null });

    // Preferred: Notify React Native WebView bridge
    try {
      const rn = (window as any).ReactNativeWebView;
      if (rn && typeof rn.postMessage === 'function') {
        rn.postMessage(payload);
        return;
      }
    } catch (e) {
      /* ignore */
    }

    // iOS WKWebView handler convention
    try {
      const handler = (window as any).webkit?.messageHandlers?.nativeApp;
      if (handler && typeof handler.postMessage === 'function') {
        handler.postMessage({ url: directUrl, filename: filename || null });
        return;
      }
    } catch (e) {
      /* ignore */
    }

    // Fallback: navigate to URL so native download handlers may pick it up
    window.location.href = directUrl;
    return;
  }

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
