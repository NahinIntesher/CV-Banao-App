import { Platform } from "react-native";
import { DocumentPickerAsset } from "expo-document-picker";
export function apiURL(base: string) {
  try {
    const url = new URL(base.trim());
    if (
      !["http:", "https:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      throw Error();
    return url.href.replace(/\/$/, "");
  } catch {
    throw new Error(
      "Set a valid backend URL in Settings, e.g. http://192.168.1.10:4000. On a phone, localhost refers to the phone itself.",
    );
  }
}
export async function request(
  base: string,
  code: string,
  path: string,
  body: unknown,
  signal?: AbortSignal,
) {
  const response = await fetch(apiURL(base) + path, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-cv-access-code": code },
    body: JSON.stringify(body),
    signal,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Server request failed.");
  return result;
}
export async function upload(
  base: string,
  code: string,
  path: string,
  file: DocumentPickerAsset,
  ocr: boolean,
  signal?: AbortSignal,
) {
  if (!code.trim())
    throw new Error("Enter your private workspace access code in Settings.");
  const form = new FormData();
  if (Platform.OS === "web" && file.file) form.append("file", file.file);
  else
    form.append("file", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType ?? "application/octet-stream",
    } as unknown as Blob);
  form.append("ocr", String(ocr));
  const response = await fetch(apiURL(base) + path, {
    method: "POST",
    headers: { "x-cv-access-code": code },
    body: form,
    signal,
  });
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error(
      "Backend did not return readable data. Check its address and logs.",
    );
  }
  if (!response.ok) throw new Error(result.error || "File import failed.");
  return result;
}
