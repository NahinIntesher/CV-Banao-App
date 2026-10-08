import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { WebView } from "react-native-webview";
import { CV } from "../lib/model";
import { documentHTML } from "../lib/document";
import { documentFont } from "../lib/fonts";
import { Label } from "./UI";
export default function DocumentPreview({ cv }: { cv: CV }) {
  const [html, setHTML] = useState(""),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    documentFont(cv.design.font)
      .then((font) => {
        if (active) {
          setError("");
          setHTML(documentHTML(cv, font, true));
        }
      })
      .catch(() => {
        if (active)
          setError(
            "Preview could not load. Try exporting your CV or choose another font.",
          );
      });
    return () => {
      active = false;
    };
  }, [cv]);
  return (
    <View
      style={{
        flex: 1,
        minHeight: 300,
        backgroundColor: "#fff",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {error ? (
        <Label>{error}</Label>
      ) : html ? (
        <WebView
          source={{ html }}
          originWhitelist={["*"]}
          javaScriptEnabled
          scrollEnabled
          scalesPageToFit={false}
          automaticallyAdjustContentInsets={false}
          onShouldStartLoadWithRequest={(req) =>
            req.url === "about:blank" || req.url.startsWith("data:")
          }
          accessibilityLabel="Live CV preview"
        />
      ) : (
        <ActivityIndicator style={{ marginTop: 40 }} />
      )}
    </View>
  );
}
