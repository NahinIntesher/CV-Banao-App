export function checkDocx(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65557); i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error("This is not a readable DOCX file.");
  const count = view.getUint16(end + 10, true);
  let at = view.getUint32(end + 16, true);
  let total = 0;
  if (count > 1000)
    throw new Error("This DOCX contains too many embedded files.");
  for (let i = 0; i < count; i++) {
    if (at + 46 > bytes.length || view.getUint32(at, true) !== 0x02014b50)
      throw new Error("Invalid DOCX directory.");
    if (view.getUint16(at + 8, true) & 1)
      throw new Error("Remove the password before importing.");
    const size = view.getUint32(at + 24, true);
    total += size;
    if (size > 20000000 || total > 50000000)
      throw new Error(
        "DOCX expanded size is too large. Export a text-only CV.",
      );
    at +=
      46 +
      view.getUint16(at + 28, true) +
      view.getUint16(at + 30, true) +
      view.getUint16(at + 32, true);
  }
}
