import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { CV } from "../lib/model";
import { documentHTML } from "../lib/document";
import { documentFont } from "../lib/fonts";
export default function DocumentPreview({ cv }: { cv: CV }) {
  const [html, setHTML] = useState("");
  useEffect(() => {
    let active = true;
    documentFont(cv.design.font)
      .then((font) => {
        if (active) setHTML(documentHTML(cv, font, true));
      })
      .catch(() => {
        if (active) setHTML(documentHTML(cv, undefined, true));
      });
    return () => {
      active = false;
    };
  }, [cv]);
  return (
    <View
      style={{
        height: 850,
        backgroundColor: "#fff",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      {React.createElement("iframe", {
        title: "Live CV preview",
        srcDoc: html,
        sandbox: "allow-scripts",
        style: { width: "100%", height: "100%", border: "none" },
      })}
    </View>
  );
}
