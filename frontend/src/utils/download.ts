export function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Download a PDF from a base64 string.
 * Works in both desktop browsers and mobile WebView / APK wrappers.
 */
export function downloadBase64PDF(base64: string, filename: string): void {
  // Convert base64 → binary → Blob, then trigger via anchor
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: 'application/pdf' });
  downloadBlob(blob, filename);
}

/**
 * Detect if the app is running inside a WebView-based APK wrapper.
 * HTMLtoAPK / WebViewGold wrappers typically don't include 'Chrome' in the UA
 * or include 'wv' in it, or have no proper download handling.
 */
export function isWebView(): boolean {
  const ua = navigator.userAgent || '';
  // Android WebView: contains 'wv' in parentheses or is Android without Chrome
  const isAndroidWebView = /Android/.test(ua) && (/wv\)/.test(ua) || !/Chrome/.test(ua));
  // iOS WebView: is iOS but NOT Safari standalone
  const isIosWebView = /iPhone|iPad|iPod/.test(ua) && !/Safari/.test(ua);
  return isAndroidWebView || isIosWebView;
}
