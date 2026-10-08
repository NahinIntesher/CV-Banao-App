import React from "react";
import { Pressable, View, Text } from "react-native";
import {
  Check,
  GraduationCap,
  Microscope,
  BookOpen,
  BriefcaseBusiness,
} from "lucide-react-native";
import { Template, templates, fonts, purposeOf, layoutOf } from "../lib/model";
import { Label } from "./UI";
import { useBanao } from "../lib/store";
export function TemplateCard({
  id,
  selected,
  onPress,
}: {
  id: Template;
  selected: boolean;
  onPress: () => void;
}) {
  const { theme: t } = useBanao();
  const item = templates.find((x) => x.id === id)!,
    layout = layoutOf(id),
    purpose = purposeOf(id);
  const Icon =
    purpose === "academic"
      ? GraduationCap
      : purpose === "research"
        ? Microscope
        : purpose === "phd"
          ? BookOpen
          : BriefcaseBusiness;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.name + " " + item.category}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{ width: "48%", marginBottom: 22 }}
    >
      <View
        style={{
          backgroundColor: t.soft,
          borderWidth: selected ? 2 : 1,
          borderColor: selected ? t.accent : t.border,
          padding: 15,
          borderRadius: 12,
          height: 196,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            height: 166,
            width: "100%",
            backgroundColor: "#fff",
            padding: 13,
            borderLeftWidth: layout === "rail" ? 4 : 0,
            borderLeftColor: item.color,
            borderRadius: 2,
          }}
        >
          <Text
            style={{
              fontFamily:
                fonts.find((f) => f.id === item.font)!.family + "Bold",
              fontSize: layout === "editorial" ? 15 : 12,
              color: item.color,
              textAlign:
                layout === "editorial" ||
                (layout === "classic" && ["academic", "phd"].includes(purpose))
                  ? "center"
                  : "left",
              borderWidth: layout === "banner" ? 1 : 0,
              borderColor: item.color,
              padding: layout === "banner" ? 6 : 0,
            }}
          >
            Alex Morgan
          </Text>
          <Text
            style={{
              fontSize: 4.5,
              letterSpacing: 0.6,
              color: "#85858b",
              marginTop: 4,
              textAlign: layout === "editorial" ? "center" : "left",
            }}
          >
            RESEARCH · DISCOVERY · IMPACT
          </Text>
          <View
            style={{
              height: 1,
              backgroundColor: item.color + "55",
              marginVertical: 9,
            }}
          />
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ marginBottom: 8 }}>
              <View
                style={{
                  width: "45%",
                  height: layout === "banner" ? 6 : 3,
                  backgroundColor: item.color,
                  opacity: 0.4,
                  marginBottom: 4,
                }}
              />
              {[0, 1, 2].map((j) => (
                <View
                  key={j}
                  style={{
                    width: j === 2 ? "72%" : "100%",
                    height: 2,
                    marginBottom: 3,
                    backgroundColor: "#eeeef1",
                  }}
                />
              ))}
            </View>
          ))}
        </View>
        {selected && (
          <View
            style={{
              position: "absolute",
              right: 9,
              bottom: 9,
              width: 25,
              height: 25,
              borderRadius: 13,
              backgroundColor: t.accent,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={14} color={t.onAccent} />
          </View>
        )}
      </View>
      <Label size={12} bold style={{ marginTop: 10 }}>
        {item.name}
      </Label>
      <View
        style={{
          flexDirection: "row",
          gap: 5,
          alignItems: "center",
          marginTop: 4,
        }}
      >
        <Icon size={11} color={t.muted} />
        <Label size={9} muted>
          {item.category}
        </Label>
      </View>
    </Pressable>
  );
}
export function TemplateGrid({
  value,
  onChange,
  filter = "All",
  query = "",
}: {
  value: Template;
  onChange: (id: Template) => void;
  filter?: string;
  query?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        flexWrap: "wrap",
      }}
    >
      {templates
        .filter(
          (t) =>
            (filter === "All" || t.category === filter) &&
            [t.name, t.category]
              .join(" ")
              .toLowerCase()
              .includes(query.toLowerCase()),
        )
        .map((t) => (
          <TemplateCard
            key={t.id}
            id={t.id}
            selected={value === t.id}
            onPress={() => onChange(t.id)}
          />
        ))}
    </View>
  );
}
