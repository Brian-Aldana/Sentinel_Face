import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '../../constants/theme';
 
type Status = 'active' | 'inactive' | 'blocked' | 'warning' | 'info';
 
interface Props {
  status: Status;
  label?: string; 
}
 
/**
 * StatusBadge
 * estado coloreada. Usada en Users, Reports, Profile.
 */
export default function StatusBadge({ status, label }: Props) {
  const C = useThemeColors();

  const CONFIG: Record<Status, { label: string; color: string }> = {
    active:   { label: 'Activo',    color: C.success },
    inactive: { label: 'Inactivo',  color: C.warning },
    blocked:  { label: 'Bloqueado', color: C.error   },
    warning:  { label: 'Alerta',    color: C.warning },
    info:     { label: 'Info',      color: C.info    },
  };

  const { label: defaultLabel, color } = CONFIG[status];
  const text = label ?? defaultLabel;
 
  return (
    <View style={[styles.badge, { borderColor: `${color}40`, backgroundColor: `${color}14` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{text}</Text>
    </View>
  );
}
 
const styles = StyleSheet.create({
  badge: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            5,
    paddingHorizontal: 9,
    paddingVertical:   4,
    borderRadius:   20,
    borderWidth:    1,
  },
  dot:  { width: 6, height: 6, borderRadius: 3 },
  text: { fontSize: 11, fontWeight: '600' },
});