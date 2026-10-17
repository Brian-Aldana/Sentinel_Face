import { LinearGradient } from "expo-linear-gradient";
import { Redirect, useRouter } from "expo-router";
import {
    Eye,
    EyeOff,
    Fingerprint,
    Lock,
    Mail,
    ShieldCheck,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    ImageBackground,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors } from "../constants/theme";
import { useAuthStore } from "../store/authStore";

export default function LoginScreen() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const faceAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(faceAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(faceAnim, {
          toValue: 0.3,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [faceAnim]);

  // Redirección automática si ya hay sesión válida (F-01/F-02)
  if (isAuthenticated && !isLoading) {
    return <Redirect href="/(admin)/dashboard" />;
  }

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Ingresa tus credenciales.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/(admin)/dashboard");
    } catch (e: any) {
      setError(
        e?.response?.data?.message ?? e.message ?? "Credenciales inválidas.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/images/facial_scan_bg.png")}
      style={styles.container}
      resizeMode="cover"
    >
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={Colors.Gradients.overlay as any}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Animated.View style={[styles.logoContainer, { opacity: faceAnim }]}>
            <LinearGradient
              colors={Colors.Gradients.admin as any}
              style={styles.logoGlow}
            >
              <View style={styles.logoInner}>
                <ShieldCheck color="white" size={45} />
              </View>
            </LinearGradient>
          </Animated.View>

          <Text style={styles.title}>Sentinel Face</Text>
          <Text style={styles.subtitle}>PANEL DE ADMINISTRACIÓN</Text>

          <View style={styles.loginCard}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>CORREO ADMINISTRADOR</Text>
              <View style={styles.inputContainer}>
                <Mail
                  color="rgba(255,255,255,0.4)"
                  size={18}
                  style={styles.iconStyle}
                />
                <TextInput
                  placeholder="admin@admin.com"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.label}>CONTRASEÑA</Text>
              <View style={styles.inputContainer}>
                <Lock
                  color="rgba(255,255,255,0.4)"
                  size={18}
                  style={styles.iconStyle}
                />
                <TextInput
                  placeholder="••••••••••••"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  secureTextEntry={!showPass}
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPass((p) => !p)}>
                  {showPass ? (
                    <Eye color="white" size={18} />
                  ) : (
                    <EyeOff color="rgba(255,255,255,0.4)" size={18} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={loading}
            >
              <LinearGradient
                colors={Colors.Gradients.admin as any}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <View style={styles.buttonInner}>
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>ACCEDER AL SISTEMA</Text>
                      <Fingerprint color="white" size={20} />
                    </>
                  )}
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center" },
  content: {
    alignItems: "center",
    paddingHorizontal: 25,
    paddingTop: Platform.OS === "android" ? 60 : 30,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  logoGlow: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.dark.adminGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 20,
  },
  logoInner: {
    width: "100%",
    height: "100%",
    backgroundColor: "#050514",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "300",
    color: "white",
    letterSpacing: 6,
    textAlign: "center",
    marginBottom: 5,
  },
  subtitle: {
    color: Colors.dark.adminGold,
    fontSize: 9,
    letterSpacing: 3,
    textAlign: "center",
    marginBottom: 40,
    opacity: 0.8,
  },
  loginCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    padding: 25,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.15)",
  },
  inputWrapper: { marginBottom: 25 },
  label: {
    color: "rgba(195,160,240,0.9)",
    fontSize: 9,
    marginBottom: 10,
    fontWeight: "600",
    letterSpacing: 2,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 52,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  input: { flex: 1, color: "white", fontSize: 14 },
  iconStyle: { marginRight: 12 },
  errorText: {
    color: Colors.dark.redAlert,
    fontSize: 12,
    marginBottom: 12,
    textAlign: "center",
  },
  button: { width: "100%", height: 58, marginTop: 10 },
  buttonGradient: { flex: 1, borderRadius: 15, justifyContent: "center" },
  buttonInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    marginRight: 12,
    letterSpacing: 2,
  },
});
