import React from 'react';
import {
  StyleProp,
  StyleSheet,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { useThemeColors } from '../../constants/theme';

interface Props extends TextInputProps {
  icon:            React.ReactNode;
  rightElement?:   React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;  
}

export default function InputField({ icon, rightElement, containerStyle, ...rest }: Props) {
  const C = useThemeColors();
  const styles = React.useMemo(() => getStyles(C), [C]);

  return (
    <View style={[styles.wrap, containerStyle]}>  
      <View style={styles.iconWrap}>{icon}</View>
      <TextInput
        style={styles.input}
        placeholderTextColor={C.textSubtle}
        {...rest}
      />
      {rightElement && (
        <TouchableOpacity style={styles.right}>{rightElement}</TouchableOpacity>
      )}
    </View>
  );
}
 
const getStyles = (C: any) => StyleSheet.create({
  wrap: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: C.surface,
    borderRadius:    12,
    borderWidth:     1,
    borderColor:     C.border,
    paddingHorizontal: 14,
    height:          52,
  },
  iconWrap: { marginRight: 10 },
  input: {
    flex:     1,
    color:    C.text,
    fontSize: 15,
  },
  right: { padding: 6 },
});