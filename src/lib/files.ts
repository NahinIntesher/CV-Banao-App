import { Platform } from "react-native";
import * as FS from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as Print from "expo-print";
import * as Picker from "expo-document-picker";
import { CV, filename, plainText } from "./model";
import { documentFont } from "./fonts";
import { documentHTML } from "./document";
export async function pickFile() {
  const result = await Picker.getDocumentAsync({
    type: [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/json",
      "text/plain",
    ],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled) return null;
  const file = result.assets[0];
  if ((file.size ?? 0) > 10 * 1024 * 1024)
    throw new Error("Choose a file up to 10 MB.");
  return file;
}
export async function readPicked(file: Picker.DocumentPickerAsset) {
  if (Platform.OS === "web" && file.file) return file.file.text();
  return FS.readAsStringAsync(file.uri);
}
export async function shareText(text: string, name: string) {
  if (Platform.OS === "web") {
    const blob = new Blob([text], {
      type: name.endsWith(".json") ? "application/json" : "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    return;
  }
  const uri = FS.cacheDirectory + name;
  await FS.writeAsStringAsync(uri, text);
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("File sharing is unavailable on this device.");
  await Sharing.shareAsync(uri, {
    mimeType: name.endsWith(".json") ? "application/json" : "text/plain",
    dialogTitle: "Export from CV Banao",
  });
}
export async function exportCV(cv: CV, format: "pdf" | "json" | "txt") {
  if (format === "json")
    return shareText(
      JSON.stringify({ format: "cv-studio", version: 1, cv }, null, 2),
      filename(cv) + ".json",
    );
  if (format === "txt") return shareText(plainText(cv), filename(cv) + ".txt");
  const html = documentHTML(cv, await documentFont(cv.design.font));
  if (Platform.OS === "web") {
    const frame = document.createElement("iframe");
    frame.style.display = "none";
    frame.srcdoc = html;
    document.body.append(frame);
    frame.onload = () => {
      setTimeout(() => {
        frame.contentWindow?.print();
        setTimeout(() => frame.remove(), 2000);
      }, 400);
    };
    return;
  }
  const result = await Print.printToFileAsync({
    html,
    width: cv.design.paper === "A4" ? 595 : 612,
    height: cv.design.paper === "A4" ? 842 : 792,
  });
  const uri = FS.cacheDirectory + filename(cv) + ".pdf";
  await FS.copyAsync({ from: result.uri, to: uri });
  await Sharing.shareAsync(uri, {
    mimeType: "application/pdf",
    UTI: ".pdf",
    dialogTitle: "Your professional CV",
  });
}
