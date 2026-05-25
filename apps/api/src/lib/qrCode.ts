import QRCode from "qrcode";

export async function renderQrPng(url: string, sizePx = 320): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: "png",
    width: sizePx,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#003B8E", light: "#FFFFFF" }
  });
}
