import QRCode from 'qrcode';

/** Render a raw QRIS payload string to a PNG data URL for the frontend. */
export async function toDataUrl(text) {
  return QRCode.toDataURL(text, { margin: 1, width: 320, errorCorrectionLevel: 'M' });
}

export default { toDataUrl };
