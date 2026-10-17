import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import "react-native-reanimated";
import { Colors } from "../constants/theme";
import { useAuthStore } from "../store/authStore";
import { useSettingsStore } from "../store/settingsStore";
import CustomAlert from "../components/ui/CustomAlert";

function RootNavigator() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const darkMode = useSettingsStore((s) => s.darkMode);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#050514",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator size="large" color={Colors.dark.adminGold} />
      </View>
    );
  }

  return (
    <ThemeProvider value={darkMode ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(admin)" options={{ gestureEnabled: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={darkMode ? "light" : "dark"} />
      <CustomAlert />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return <RootNavigator />;
}
