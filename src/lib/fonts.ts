import { Asset } from "expo-asset";
import * as FS from "expo-file-system/legacy";
import { Font } from "./model";
import { Platform } from "react-native";
const assets = {
  inter: [
    require("../../assets/fonts/inter-400.ttf"),
    require("../../assets/fonts/inter-700.ttf"),
  ],
  source: [
    require("../../assets/fonts/source-400.ttf"),
    require("../../assets/fonts/source-700.ttf"),
  ],
  lora: [
    require("../../assets/fonts/lora-400.ttf"),
    require("../../assets/fonts/lora-700.ttf"),
  ],
  garamond: [
    require("../../assets/fonts/garamond-400.ttf"),
    require("../../assets/fonts/garamond-700.ttf"),
  ],
  roboto: [
    require("../../assets/fonts/roboto-400.ttf"),
    require("../../assets/fonts/roboto-700.ttf"),
  ],
  opensans: [
    require("../../assets/fonts/opensans-400.ttf"),
    require("../../assets/fonts/opensans-700.ttf"),
  ],
  merriweather: [
    require("../../assets/fonts/merriweather-400.ttf"),
    require("../../assets/fonts/merriweather-700.ttf"),
  ],
  baskerville: [
    require("../../assets/fonts/baskerville-400.ttf"),
    require("../../assets/fonts/baskerville-700.ttf"),
  ],
  noto: [
    require("../../assets/fonts/noto-400.ttf"),
    require("../../assets/fonts/noto-700.ttf"),
  ],
  dm: [
    require("../../assets/fonts/dm-400.ttf"),
    require("../../assets/fonts/dm-700.ttf"),
  ],
};
const cache = new Map<string, Promise<{ regular: string; bold: string }>>();
export function documentFont(id: Font) {
  if (!cache.has(id))
    cache.set(
      id,
      (async () => {
        const read = async (module: number) => {
          const asset = Asset.fromModule(module);
          await asset.downloadAsync();
          if (Platform.OS === "web") {
            const bytes = new Uint8Array(
              await (await fetch(asset.uri)).arrayBuffer(),
            );
            let binary = "";
            for (const b of bytes) binary += String.fromCharCode(b);
            return btoa(binary);
          }
          return FS.readAsStringAsync(asset.localUri ?? asset.uri, {
            encoding: FS.EncodingType.Base64,
          });
        };
        const [regular, bold] = await Promise.all(assets[id].map(read));
        return { regular, bold };
      })(),
    );
  return cache.get(id)!;
}
