import React, { useEffect, useRef } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAlertStore } from '../../store/alertStore';
import { useThemeColors } from '../../constants/theme';

const { width } = Dimensions.get('window');

export default function CustomAlert() {
  const { visible, options, hideAlert } = useAlertStore();
  const C = useThemeColors();

  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible || !options) return null;

  const { title, message, buttons = [{ text: 'Aceptar' }] } = options;

  const handlePress = (onPress?: () => void) => {
    hideAlert();
    if (onPress) {
      onPress();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={hideAlert}
    >
      <View style={styles.overlay}>
        {/* Semi-transparent Backdrop */}
        <Animated.View 
          style={[
            styles.backdrop, 
            { 
              backgroundColor: C.overlay,
              opacity: fadeAnim 
            }
          ]} 
        />
        
        {/* Alert Container */}
        <Animated.View
          style={[
            styles.alertBox,
            {
              backgroundColor: C.surface,
              borderColor: C.border,
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Header Title */}
          <Text style={[styles.title, { color: C.text }]}>{title}</Text>
          
          {/* Body Message */}
          {message ? (
            <Text style={[styles.message, { color: C.textMuted }]}>{message}</Text>
          ) : null}

          {/* Buttons Layout */}
          <View style={buttons.length > 2 ? styles.buttonColumn : styles.buttonRow}>
            {buttons.map((btn, idx) => {
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';

              let btnBgColor = C.inputBg;
              let textColor = C.text;

              if (isDestructive) {
                btnBgColor = `${C.error}15`;
                textColor = C.error;
              } else if (isCancel) {
                btnBgColor = 'transparent';
                textColor = C.textSubtle;
              }

              // If it's a default/primary action, let's make it shine!
              const isPrimary = !isDestructive && !isCancel && idx === buttons.length - 1;

              if (isPrimary) {
                return (
                  <TouchableOpacity
                    key={idx}
                    activeOpacity={0.85}
                    style={[styles.button, styles.flexButton]}
                    onPress={() => handlePress(btn.onPress)}
                  >
                    <LinearGradient
                      colors={C.gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientBtn}
                    >
                      <Text style={styles.primaryText}>{btn.text}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.75}
                  style={[
                    styles.button,
                    buttons.length <= 2 && styles.flexButton,
                    { 
                      backgroundColor: btnBgColor,
                      borderWidth: isCancel ? 0 : 1,
                      borderColor: isDestructive ? `${C.error}30` : C.border,
                    }
                  ]}
                  onPress={() => handlePress(btn.onPress)}
                >
                  <Text style={[styles.btnText, { color: textColor }]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  alertBox: {
    width: width * 0.85,
    maxWidth: 340,
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'space-between',
  },
  buttonColumn: {
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  flexButton: {
    flex: 1,
  },
  gradientBtn: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
