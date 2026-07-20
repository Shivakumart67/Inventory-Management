const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function buildDownloadUrl(endpoint: string): string {
  const token = localStorage.getItem('token');
  const params = new URLSearchParams();

  if (token) {
    params.set('token', token);
  }

  const queryString = params.toString();
  return `${API_BASE_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;
}

export function triggerDownload(endpoint: string): void {
  const downloadUrl = buildDownloadUrl(endpoint);
  window.location.href = downloadUrl;
}

export function isWebView(): boolean {
  const ua = navigator.userAgent || '';
  const isAndroidWebView = /Android/.test(ua) && (/wv\)/.test(ua) || !/Chrome/.test(ua));
  const isIosWebView = /iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua);
  return isAndroidWebView || isIosWebView;
}
