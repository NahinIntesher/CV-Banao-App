import React, { type ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
  Switch,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, ChevronDown, X, type LucideIcon } from "lucide-react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { useBanao } from "../lib/store";
export function Label({
  children,
  size = 14,
  bold = false,
  muted = false,
  color,
  style,
}: {
  children: ReactNode;
  size?: number;
  bold?: boolean;
  muted?: boolean;
  color?: string;
  style?: any;
}) {
  const { theme: t } = useBanao();
  return (
    <Text
      style={[
        {
          fontFamily: bold ? "QBold" : "QMedium",
          fontSize: size,
          lineHeight: size * 1.55,
          color: color ?? (muted ? t.muted : t.text),
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}
export function Brand({ size = 38 }: { size?: number }) {
  const { theme: t } = useBanao();
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Rect x={1} y={1} width={46} height={46} rx={14} fill={t.accent} />
      <Path
        d="M29 12H19a7 7 0 0 0-7 7v10a7 7 0 0 0 7 7h11m-8-12 6 7 10-15"
        fill="none"
        stroke="#fff"
        strokeWidth={3.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
export function Button({
  children,
  onPress,
  icon: Icon,
  outline = false,
  subtle = false,
  danger = false,
  disabled = false,
  loading = false,
  style,
  small = false,
}: {
  children: ReactNode;
  onPress: () => void;
  icon?: LucideIcon;
  outline?: boolean;
  subtle?: boolean;
  danger?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  small?: boolean;
}) {
  const { theme: t } = useBanao();
  const color = danger ? t.danger : outline || subtle ? t.accent : t.onAccent;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        {
          minHeight: small ? 40 : 46,
          borderRadius: 11,
          paddingHorizontal: small ? 12 : 17,
          paddingVertical: 10,
          backgroundColor: subtle
            ? "transparent"
            : outline || danger
              ? t.card
              : t.accent,
          borderWidth: subtle ? 0 : 1,
          borderColor: danger ? t.danger : outline ? t.border : t.accent,
          flexDirection: "row",
          gap: 8,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled || loading ? 0.6 : pressed ? 0.8 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color} size="small" />
      ) : (
        Icon && <Icon size={small ? 16 : 18} color={color} />
      )}
      <Label size={small ? 12 : 13} bold color={color}>
        {children}
      </Label>
    </Pressable>
  );
}
export function IconButton({
  icon: Icon,
  onPress,
  label,
  disabled = false,
  danger = false,
}: {
  icon: LucideIcon;
  onPress: () => void;
  label: string;
  disabled?: boolean;
  danger?: boolean;
}) {
  const { theme: t } = useBanao();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      hitSlop={5}
      style={({ pressed }) => ({
        width: 42,
        height: 42,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 11,
        opacity: disabled ? 0.3 : 1,
        backgroundColor: pressed ? t.soft : "transparent",
      })}
    >
      <Icon size={20} color={danger ? t.danger : t.muted} />
    </Pressable>
  );
}
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  const { theme: t } = useBanao();
  return (
    <View
      style={[
        {
          backgroundColor: t.card,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 17,
          padding: 20,
          marginBottom: 18,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
export function Heading({
  title,
  description,
  eyebrow = "YOUR NEXT CHAPTER",
  icon: Icon,
}: {
  title: string;
  description: string;
  eyebrow?: string;
  icon?: LucideIcon;
}) {
  const { theme: t } = useBanao();
  return (
    <View style={{ marginBottom: 25, gap: 9 }}>
      <View style={styles.row}>
        {Icon && <Icon size={15} color={t.accent} />}
        <Label size={9} bold color={t.accent} style={{ letterSpacing: 1.8 }}>
          {eyebrow}
        </Label>
      </View>
      <Label size={29} bold style={{ letterSpacing: -0.8, lineHeight: 37 }}>
        {title}
      </Label>
      <Label size={13} muted>
        {description}
      </Label>
    </View>
  );
}
export function Field({
  label,
  hint,
  multiline = false,
  style,
  ...props
}: TextInputProps & { label: string; hint?: string; style?: any }) {
  const { theme: t } = useBanao();
  return (
    <View style={{ marginVertical: 10, flex: 1, minWidth: 0 }}>
      <Label size={12} bold style={{ marginBottom: 7 }}>
        {label}
      </Label>
      <TextInput
        accessibilityLabel={label}
        autoCorrect={false}
        placeholderTextColor={t.muted}
        multiline={multiline}
        maxLength={multiline ? 20000 : 2000}
        style={[
          {
            fontFamily: "QMedium",
            fontSize: 15,
            lineHeight: 22,
            color: t.text,
            backgroundColor: t.input,
            borderColor: t.border,
            borderWidth: 1,
            borderRadius: 10,
            paddingHorizontal: 13,
            paddingVertical: 12,
            minHeight: multiline ? 100 : 46,
            textAlignVertical: multiline ? "top" : "center",
          },
          style,
        ]}
        {...props}
      />
      {hint && (
        <Label size={10} muted style={{ marginTop: 5 }}>
          {hint}
        </Label>
      )}
    </View>
  );
}
export function Toggle({
  label,
  detail,
  value,
  onChange,
}: {
  label: string;
  detail?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  const { theme: t } = useBanao();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginVertical: 12,
      }}
    >
      <View style={{ flex: 1 }}>
        <Label size={12} bold>
          {label}
        </Label>
        {detail && (
          <Label size={10} muted>
            {detail}
          </Label>
        )}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: t.border, true: t.accent }}
        thumbColor="#fff"
      />
    </View>
  );
}
export function Choice({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; name: string }[];
  onChange: (v: string) => void;
}) {
  const { theme: t } = useBanao();
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Label size={12} bold style={{ marginTop: 12, marginBottom: 7 }}>
        {label}
      </Label>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={() => setOpen(!open)}
        style={{
          minHeight: 47,
          padding: 13,
          borderWidth: 1,
          borderColor: t.border,
          borderRadius: 10,
          backgroundColor: t.input,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Label size={13} style={{ flex: 1 }}>
          {options.find((o) => o.id === value)?.name || "Choose…"}
        </Label>
        <ChevronDown size={17} color={t.muted} />
      </Pressable>
      {open && (
        <View
          style={{
            paddingHorizontal: 13,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: 10,
            marginTop: 5,
            backgroundColor: t.card,
          }}
        >
          {options.map((o) => (
            <Pressable
              key={o.id}
              accessibilityRole="button"
              onPress={() => {
                onChange(o.id);
                setOpen(false);
              }}
              style={{
                paddingVertical: 15,
                borderBottomWidth: 1,
                borderColor: t.border,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
              }}
            >
              <Label size={14} style={{ flex: 1 }}>
                {o.name}
              </Label>
              {o.id === value && <Check size={18} color={t.accent} />}
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}
export function CheckRow({
  label,
  checked,
  onPress,
}: {
  label: string;
  checked: boolean;
  onPress: () => void;
}) {
  const { theme: t } = useBanao();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={onPress}
      style={{
        flexDirection: "row",
        gap: 11,
        alignItems: "center",
        paddingVertical: 11,
      }}
    >
      <View
        style={{
          width: 21,
          height: 21,
          borderWidth: 1,
          borderColor: checked ? t.accent : t.border,
          borderRadius: 6,
          backgroundColor: checked ? t.accent : t.input,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {checked && <Check size={14} color={t.onAccent} />}
      </View>
      <Label size={12} style={{ flex: 1 }}>
        {label}
      </Label>
    </Pressable>
  );
}
export function Sheet({
  visible,
  title,
  description,
  children,
  onClose,
}: {
  visible: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const { theme: t } = useBanao();
  const { width } = useWindowDimensions();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{
          flex: 1,
          backgroundColor: "#0007",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <Pressable
          accessibilityLabel="Close dialog"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <SafeAreaView
          edges={["bottom"]}
          style={{
            width: Math.min(width, 760),
            maxHeight: "92%",
            backgroundColor: t.card,
            borderTopLeftRadius: 25,
            borderTopRightRadius: 25,
            borderWidth: 1,
            borderColor: t.border,
          }}
        >
          <View
            style={{
              padding: 20,
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 10,
              borderBottomWidth: 1,
              borderColor: t.border,
            }}
          >
            <View style={{ flex: 1 }}>
              <Label size={22} bold>
                {title}
              </Label>
              {description && (
                <Label size={12} muted style={{ marginTop: 5 }}>
                  {description}
                </Label>
              )}
            </View>
            <IconButton icon={X} label="Close dialog" onPress={onClose} />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 20, paddingBottom: 30 }}
          >
            {children}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
export function Row({
  children,
  wrap = false,
  style,
}: {
  children: ReactNode;
  wrap?: boolean;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.row, { flexWrap: wrap ? "wrap" : "nowrap" }, style]}>
      {children}
    </View>
  );
}
export const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
});
