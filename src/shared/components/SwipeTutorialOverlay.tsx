import React, { useEffect, useLayoutEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated, PanResponder, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../../store/useStore';
import { theme, spacing, borderRadius } from '../theme';

const TUTORIAL_KEY = '@trackerito_swipe_tutorial_seen';
const SWIPE_THRESHOLD = -80;

export async function hasSeenSwipeTutorial(): Promise<boolean> {
  const val = await AsyncStorage.getItem(TUTORIAL_KEY);
  return val === '1';
}

export async function markSwipeTutorialSeen(): Promise<void> {
  await AsyncStorage.setItem(TUTORIAL_KEY, '1');
}

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

export function SwipeTutorialOverlay({ visible, onDismiss }: Props) {
  const { preferences } = useStore();
  const isDark = preferences.theme === 'dark';
  const currentTheme = isDark ? theme.dark : theme.light;

  // Siempre ref actualizada de onDismiss para evitar stale closure en PanResponder
  const onDismissRef = useRef(onDismiss);
  useLayoutEffect(() => { onDismissRef.current = onDismiss; });

  const slideX = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const isDragging = useRef(false);

  const stopAnim = () => {
    animRef.current?.stop();
    animRef.current = null;
  };

  const startAnim = () => {
    isDragging.current = false;
    stopAnim();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(slideX, { toValue: -75, duration: 550, useNativeDriver: true }),
        Animated.delay(400),
        Animated.timing(slideX, { toValue: 0, duration: 350, useNativeDriver: true }),
        Animated.delay(500),
      ])
    );
    animRef.current = loop;
    loop.start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > Math.abs(gs.dy) && Math.abs(gs.dx) > 8,
      onPanResponderGrant: () => {
        if (!isDragging.current) {
          isDragging.current = true;
          animRef.current?.stop();
          animRef.current = null;
          slideX.setValue(0);
        }
      },
      onPanResponderMove: (_, gs) => {
        if (gs.dx < 0) slideX.setValue(gs.dx);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < SWIPE_THRESHOLD) {
          // Swipe exitoso → completar tutorial con animación de salida
          Animated.timing(slideX, { toValue: -400, duration: 220, useNativeDriver: true }).start(() => {
            onDismissRef.current();
          });
        } else {
          // No llegó al umbral → volver y reiniciar animación de demo
          Animated.spring(slideX, { toValue: 0, bounciness: 5, useNativeDriver: true }).start(() => {
            isDragging.current = false;
            const loop = Animated.loop(
              Animated.sequence([
                Animated.delay(700),
                Animated.timing(slideX, { toValue: -75, duration: 550, useNativeDriver: true }),
                Animated.delay(400),
                Animated.timing(slideX, { toValue: 0, duration: 350, useNativeDriver: true }),
                Animated.delay(500),
              ])
            );
            animRef.current = loop;
            loop.start();
          });
        }
      },
    })
  ).current;

  useEffect(() => {
    if (!visible) {
      stopAnim();
      slideX.setValue(0);
      return;
    }
    isDragging.current = false;
    startAnim();
    return () => stopAnim();
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: currentTheme.card, borderColor: currentTheme.border }]}>
          <Text style={[styles.title, { color: currentTheme.text }]}>💡 Tip rápido</Text>
          <Text style={[styles.subtitle, { color: currentTheme.textSecondary }]}>
            Para eliminar, deslizá la fila hacia la izquierda
          </Text>

          {/* Mock row interactiva */}
          <View style={[styles.mockRowWrapper, { borderColor: currentTheme.border }]}>
            {/* Fondo rojo (sin icono para que no confunda) */}
            <View style={styles.deleteBackground} />

            {/* Fila deslizable */}
            <Animated.View
              style={[
                styles.mockRow,
                { backgroundColor: currentTheme.card, transform: [{ translateX: slideX }] },
              ]}
              {...panResponder.panHandlers}
            >
              <Text style={styles.mockEmoji}>🛒</Text>
              <View style={styles.mockRowInfo}>
                <Text style={[styles.mockRowTitle, { color: currentTheme.text }]}>Supermercado</Text>
                <Text style={[styles.mockRowSub, { color: currentTheme.textSecondary }]}>Hoy</Text>
              </View>
              <Text style={[styles.mockRowAmount, { color: currentTheme.error }]}>-$1.500</Text>
            </Animated.View>
          </View>

          <Text style={[styles.hint, { color: currentTheme.primary }]}>
            ← Intentá deslizarlo
          </Text>

          <TouchableOpacity onPress={onDismiss} style={styles.skipButton}>
            <Text style={[styles.skipText, { color: currentTheme.textSecondary }]}>Omitir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.80)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  mockRowWrapper: {
    width: '100%',
    height: 64,
    overflow: 'hidden',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    position: 'relative',
    marginTop: spacing.xs,
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#EF5350',
  },
  mockRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  mockEmoji: {
    fontSize: 20,
  },
  mockRowInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  mockRowTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  mockRowSub: {
    fontSize: 12,
    marginTop: 2,
  },
  mockRowAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  hint: {
    fontSize: 12,
    fontWeight: '500',
  },
  skipButton: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skipText: {
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
