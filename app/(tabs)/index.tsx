import GettingStartedCard from "@/lib/components/Cards/GettingStartedCard";
import { Locales } from "@/lib/locales";
import { useRouter } from "expo-router";
import { View, StyleSheet } from "react-native";
import { Button, Text } from "react-native-paper";
import { useAuth } from "@/lib/hooks/useAuth";

export default function HomeScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <GettingStartedCard
        style={{ padding: 16 }}
        content={Locales.t("getStartedMessage")}
        call_to_action={Locales.t("getStartedCallToAction")}
        on_get_started={() => router.navigate("./exercises")}
      />
      
      <View style={styles.authInfo}>
        <Text variant="bodyMedium" style={styles.userInfo}>
          {user?.isAnonymous 
            ? "Signed in as Guest" 
            : `Signed in as: ${user?.email || "Unknown"}`
          }
        </Text>
        <Button 
          mode="outlined" 
          onPress={handleSignOut}
          style={styles.signOutButton}
        >
          Sign Out
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  authInfo: {
    padding: 16,
    alignItems: "center",
  },
  userInfo: {
    marginBottom: 12,
    textAlign: "center",
  },
  signOutButton: {
    minWidth: 120,
  },
});
