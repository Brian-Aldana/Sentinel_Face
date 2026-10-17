import React from 'react';
import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../constants/theme';
 
export default function NotFoundScreen() {
  const C = useThemeColors();
  const styles = React.useMemo(() => getStyles(C), [C]);
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <View style={styles.container}>
        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>Pantalla no encontrada</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Volver al inicio</Text>
        </Link>
      </View>
    </>
  );
}
 
const getStyles = (C: any) => StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.background,
  },
  code:     { fontSize: 72, fontWeight: '800', color: C.pinkNeon, opacity: 0.5 },
  title:    { fontSize: 18, color: C.textMuted, marginTop: 8, marginBottom: 24 },
  link:     { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  linkText: { color: C.text, fontSize: 15 },
});