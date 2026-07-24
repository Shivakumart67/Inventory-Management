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

function showMobileDownloadModal(directUrl: string, filename: string) {
  // Check if modal already exists
  const existing = document.getElementById('mobile-download-modal');
  if (existing) {
    existing.remove();
  }

  // Create overlay
  const overlay = document.createElement('div');
  overlay.id = 'mobile-download-modal';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
  overlay.style.backdropFilter = 'blur(8px)';
  (overlay.style as any).webkitBackdropFilter = 'blur(8px)';
  overlay.style.zIndex = '99999';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.padding = '20px';
  overlay.style.boxSizing = 'border-box';
  overlay.style.fontFamily = 'Inter, system-ui, sans-serif';

  // Create content card
  const card = document.createElement('div');
  card.style.backgroundColor = '#ffffff';
  card.style.borderRadius = '16px';
  card.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)';
  card.style.width = '100%';
  card.style.maxWidth = '400px';
  card.style.padding = '24px';
  card.style.boxSizing = 'border-box';
  card.style.position = 'relative';
  card.style.animation = 'slideUp 0.3s ease-out';
  card.style.border = '1px solid rgba(226, 232, 240, 0.8)';

  // Style animation
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .modal-btn {
      transition: all 0.2s ease-in-out;
    }
    .modal-btn:active {
      transform: scale(0.97);
    }
  `;
  document.head.appendChild(style);

  const closeModal = () => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.2s ease-out';
    setTimeout(() => {
      overlay.remove();
    }, 200);
  };

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  card.innerHTML = `
    <div style="text-align: center;">
      <div style="background-color: #f0fdf4; width: 56px; height: 56px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; border: 1px solid #dcfce7;">
        <span style="font-size: 28px;">📥</span>
      </div>
      <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 18px; font-weight: 700; line-height: 1.4;">Download File</h3>
      <p style="margin: 0 0 4px 0; color: #0f766e; font-size: 13px; font-weight: 600; word-break: break-all;">
        ${filename}
      </p>
      <p style="margin: 0 0 20px 0; color: #64748b; font-size: 13px; line-height: 1.5;">
        Since you are using a mobile application container, direct downloads may be restricted. Please choose one of the options below:
      </p>
      
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <a id="btn-open-browser" href="${directUrl}" target="_blank" rel="noopener noreferrer" class="modal-btn" style="background-color: #0f766e; color: #ffffff; text-decoration: none; padding: 12px; border-radius: 10px; font-weight: 600; font-size: 14px; display: block; text-align: center; box-shadow: 0 4px 6px -1px rgba(15, 118, 110, 0.2);">
          Open in Web Browser
        </a>
        <button id="btn-copy-link" class="modal-btn" style="background-color: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; padding: 12px; border-radius: 10px; font-weight: 600; font-size: 14px; cursor: pointer; display: block; width: 100%; outline: none; box-sizing: border-box;">
          Copy Download Link
        </button>
        <button id="btn-cancel" class="modal-btn" style="background-color: transparent; color: #64748b; border: none; padding: 10px; font-weight: 500; font-size: 14px; cursor: pointer; outline: none; margin-top: 4px;">
          Cancel
        </button>
      </div>
    </div>
  `;

  overlay.appendChild(card);
  document.body.appendChild(overlay);

  const btnOpen = card.querySelector('#btn-open-browser') as HTMLElement | null;
  if (btnOpen) {
    btnOpen.addEventListener('click', () => {
      setTimeout(closeModal, 1500);
    });
  }

  const btnCopy = card.querySelector('#btn-copy-link') as HTMLElement | null;
  if (btnCopy) {
    btnCopy.addEventListener('click', () => {
      navigator.clipboard.writeText(directUrl)
        .then(() => {
          btnCopy.textContent = '✓ Link Copied!';
          btnCopy.style.backgroundColor = '#dcfce7';
          btnCopy.style.color = '#15803d';
          btnCopy.style.borderColor = '#bbf7d0';
          setTimeout(() => {
            btnCopy.textContent = 'Copy Download Link';
            btnCopy.style.backgroundColor = '#f1f5f9';
            btnCopy.style.color = '#334155';
            btnCopy.style.borderColor = '#e2e8f0';
          }, 2000);
        })
        .catch((err) => {
          alert('Failed to copy link: ' + err);
        });
    });
  }

  const btnCancel = card.querySelector('#btn-cancel') as HTMLElement | null;
  if (btnCancel) {
    btnCancel.addEventListener('click', closeModal);
  }
}

export async function downloadFile(endpoint: string, filename?: string): Promise<void> {
  const resolvedFilename = filename || 'document';
  
  if (isMobileOrWebView()) {
    const directUrl = buildDownloadUrl(endpoint, true);

    // Preferred: Notify React Native WebView bridge
    try {
      const rn = (window as any).ReactNativeWebView;
      if (rn && typeof rn.postMessage === 'function') {
        rn.postMessage(JSON.stringify({ type: 'DOWNLOAD', url: directUrl, filename: resolvedFilename }));
        return;
      }
    } catch (e) {
      /* ignore */
    }

    // iOS WKWebView handler convention
    try {
      const handler = (window as any).webkit?.messageHandlers?.nativeApp;
      if (handler && typeof handler.postMessage === 'function') {
        handler.postMessage({ url: directUrl, filename: resolvedFilename });
        return;
      }
    } catch (e) {
      /* ignore */
    }

    // Fallback: Navigate / show popup helper
    showMobileDownloadModal(directUrl, resolvedFilename);
    return;
  }

  const response = await api.get(endpoint, {
    responseType: 'blob',
  });

  const contentType: any = response.headers['content-type'] || 'application/octet-stream';
  const blob = new Blob([response.data], { type: contentType });
  const finalFilename = filename || getFilenameFromDisposition(response.headers['content-disposition'], `download.${getExtensionFromMime(contentType)}`);

  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', finalFilename);
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

export function isMobileOrWebView(): boolean {
  const ua = navigator.userAgent || '';
  const isWebViewFlag = isWebView();
  const isMobileFlag = /Mobi|Android|iPhone|iPad|iPod/i.test(ua);
  return isWebViewFlag || isMobileFlag;
}
