declare module 'qrcode' {
  export function toDataURL(text: string): Promise<string>;
  export function toString(text: string, options?: object): Promise<string>;
  export function toBuffer(text: string, options?: object): Promise<Buffer>;
  const QRCode: {
    toDataURL: typeof toDataURL;
    toString: typeof toString;
    toBuffer: typeof toBuffer;
  };
  export default QRCode;
}
