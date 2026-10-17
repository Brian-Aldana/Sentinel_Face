import { customAlert } from "../../store/alertStore";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Camera, CheckCircle, User, X } from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useThemeColors } from "../../constants/theme";
import { api } from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function RegisterScreen() {
  const C = useThemeColors();
  const styles = React.useMemo(() => getStyles(C), [C]);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const [name, setName] = useState("");
  const [documentId, setDocumentId] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      const gallery = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!gallery.granted) {
        customAlert(
          "Permiso denegado",
          "Se requiere acceso a cámara o galería.",
        );
        return;
      }
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });
      if (!res.canceled) setPhotoUri(res.assets[0].uri);
      return;
    }
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!res.canceled) setPhotoUri(res.assets[0].uri);
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      customAlert("Campo requerido", "Ingresa el nombre completo.");
      return;
    }
    if (!photoUri) {
      customAlert(
        "Foto requerida",
        "Captura o selecciona una foto del usuario.",
      );
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("full_name", name.trim());
    formData.append("document_id", documentId.trim() || "Sin documento");
    formData.append("usuario_id", user?.id ?? "");
    formData.append("photo", {
      uri: photoUri,
      name: `employee_${Date.now()}.jpg`,
      type: "image/jpeg",
    } as any);

    try {
      await api.createEmployee(formData);
      setSuccess(true);
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || "No se pudo registrar el usuario. Intenta de nuevo.";
      customAlert("Error", msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <LinearGradient
        colors={C.gradients.bg}
        style={styles.bg}
      >
        <View style={styles.successContainer}>
          <CheckCircle size={64} color={C.success} />
          <Text style={styles.successTitle}>Usuario registrado</Text>
          <Text style={styles.successSub}>
            {name} fue agregado al sistema de control de acceso facial.
          </Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.doneTxt}>Volver a Usuarios</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => {
              setName("");
              setDocumentId("");
              setPhotoUri(null);
              setSuccess(false);
            }}
          >
            <Text style={styles.newTxt}>Registrar otro</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={C.gradients.bg}
      style={styles.bg}
    >
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <X size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Registrar usuario</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.photoBox} onPress={pickPhoto}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Camera size={36} color={C.textMuted} />
              <Text style={styles.photoHint}>Toca para tomar o subir foto</Text>
              <Text style={styles.photoSub}>
                El rostro debe ser claro y frontal
              </Text>
            </View>
          )}
          {photoUri && (
            <View style={styles.changePhoto}>
              <Camera size={16} color="white" />
              <Text style={styles.changeTxt}>Cambiar foto</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.field}>
          <Text style={styles.label}>NOMBRE COMPLETO *</Text>
          <View style={styles.inputWrap}>
            <User size={16} color={C.textMuted} />
            <TextInput
              style={styles.input}
              placeholder="Ej: Juan Carlos Pérez"
              placeholderTextColor={C.textMuted}
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>NÚMERO DE DOCUMENTO</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={[styles.input, { marginLeft: 0 }]}
              placeholder="CC, TI, CE... (opcional)"
              placeholderTextColor={C.textMuted}
              value={documentId}
              onChangeText={setDocumentId}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoTxt}>
            El sistema procesará la foto para extraer el embedding biométrico.
            Asegúrate de que la imagen tenga buena iluminación y muestre el
            rostro de frente.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.registerBtn, loading && { opacity: 0.6 }]}
          onPress={handleRegister}
          disabled={loading}
        >
          <LinearGradient
            colors={C.gradients.admin as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.btnGradient}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.btnTxt}>Registrar usuario</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const getStyles = (C: any) => StyleSheet.create({
  bg: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  topTitle: { color: C.text, fontSize: 17, fontWeight: "600" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  photoBox: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    marginBottom: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  photo: { width: "100%", height: "100%", resizeMode: "cover" },
  photoPlaceholder: { alignItems: "center", gap: 10, padding: 20 },
  photoHint: { color: C.text, fontSize: 15, fontWeight: "600" },
  photoSub: { color: C.textMuted, fontSize: 12, textAlign: "center" },
  changePhoto: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
  },
  changeTxt: { color: "white", fontSize: 13 },
  field: { marginBottom: 20 },
  label: {
    color: C.purpleNeon,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderStrong,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  input: { flex: 1, color: C.text, fontSize: 14 },
  infoBox: {
    backgroundColor: "rgba(144,208,240,0.10)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(144,208,240,0.25)",
    padding: 14,
    marginBottom: 28,
  },
  infoTxt: { color: C.blueNeon, fontSize: 12, lineHeight: 18, opacity: 0.9 },
  registerBtn: { width: "100%", height: 54 },
  btnGradient: {
    flex: 1,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  btnTxt: { color: "white", fontSize: 16, fontWeight: "700", letterSpacing: 1 },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  successTitle: {
    color: C.text,
    fontSize: 24,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
  },
  successSub: {
    color: C.textMuted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 36,
  },
  doneBtn: {
    backgroundColor: C.success,
    borderRadius: 14,
    paddingHorizontal: 36,
    paddingVertical: 14,
    marginBottom: 12,
  },
  doneTxt: { color: C.surface, fontWeight: "700", fontSize: 16 },
  newBtn: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 36,
    paddingVertical: 12,
  },
  newTxt: { color: C.textMuted, fontSize: 15 },
});
