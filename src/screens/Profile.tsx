import React from "react";
import { View } from "react-native";
import { Copy, Plus, UserRound } from "lucide-react-native";
import { useBanao } from "../lib/store";
import { profileKeys, profileLabels } from "../lib/import-cv";
import { clone } from "../lib/clone";
import { Button, Card, Field, Heading, Label } from "../components/UI";
export default function Profile({ onNew }: { onNew: () => void }) {
  const { state, cv, setWorkspace, theme: t, notify } = useBanao();
  const profile = state.workspace.profile;
  return (
    <>
      <Heading
        icon={UserRound}
        title="A profile you can reuse."
        description="Your personal details, ready for your next CV."
      />
      <Card>
        <View
          style={{
            width: 78,
            height: 78,
            borderRadius: 25,
            backgroundColor: t.soft,
            alignSelf: "center",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {profile.name ? (
            <Label size={25} bold color={t.accent}>
              {profile.name
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </Label>
          ) : (
            <UserRound size={32} color={t.accent} />
          )}
        </View>
        <Label size={22} bold style={{ textAlign: "center", marginTop: 17 }}>
          {profile.name || "Your profile"}
        </Label>
        <Label
          size={12}
          muted
          style={{ textAlign: "center", marginTop: 9, marginBottom: 24 }}
        >
          Saved separately from each CV. Changes here will not overwrite
          existing drafts.
        </Label>
        {profileKeys.map((k) => (
          <Field
            key={k}
            label={profileLabels[k]}
            value={profile[k]}
            keyboardType={
              k === "email"
                ? "email-address"
                : k === "phone"
                  ? "phone-pad"
                  : "default"
            }
            autoCapitalize={
              ["email", "website", "linkedin", "scholar"].includes(k)
                ? "none"
                : "sentences"
            }
            onChangeText={(value) =>
              setWorkspace((w) => ({
                ...w,
                profile: { ...w.profile, [k]: value },
              }))
            }
          />
        ))}
        <Button
          outline
          icon={Copy}
          style={{ marginTop: 15 }}
          onPress={() => {
            setWorkspace((w) => ({ ...w, profile: clone(cv.profile) }));
            notify("Current CV details copied to your reusable profile.");
          }}
        >
          Copy from current CV
        </Button>
        <Button icon={Plus} style={{ marginTop: 13 }} onPress={onNew}>
          Create a CV
        </Button>
        <Label size={10} muted style={{ marginTop: 17 }}>
          Profile saves automatically on this device.
        </Label>
      </Card>
    </>
  );
}
