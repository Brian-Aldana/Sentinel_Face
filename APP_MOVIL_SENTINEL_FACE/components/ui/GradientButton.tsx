import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { useThemeColors } from '../../constants/theme';
 
interface Props extends TouchableOpacityProps {
  label:    string;
  loading?: boolean;
  colors?:  [string, string];
}
 
/**
 * GradientButton
 * Botón principal con degradado. Usado en Login, EditProfile
 */
export default function GradientButton({
  label,
  loading = false,
  colors,
  style,
  ...rest
}: Props) {
  const C = useThemeColors();
  const buttonColors = colors ?? (C.gradients.primary as [string, string]);

  return (
    <TouchableOpacity activeOpacity={0.85} style={style} {...rest}>
      <LinearGradient
        colors={buttonColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.label}>{label}</Text>
        }
      </LinearGradient>
    </TouchableOpacity>
  );
}
 
const styles = StyleSheet.create({
  gradient: {
    height:          52,
    borderRadius:    14,
    alignItems:      'center',
    justifyContent:  'center',
  },
  label: {
    color:          '#fff',
    fontSize:       16,
    fontWeight:     '700',
    letterSpacing:  0.5,
  },
});