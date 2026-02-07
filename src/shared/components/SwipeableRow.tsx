import React, { useRef } from 'react';
import { View, Animated, PanResponder, StyleSheet } from 'react-native';

const SWIPE_THRESHOLD = -80;

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
}

export function SwipeableRow({ children, onDelete }: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // Always reset to original position
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 5,
        }).start();

        // If swiped past threshold, trigger delete callback (shows modal)
        if (gestureState.dx < SWIPE_THRESHOLD) {
          onDelete();
        }
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.rowContent,
          { transform: [{ translateX }] },
        ]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  rowContent: {
    backgroundColor: 'transparent',
  },
});

export default SwipeableRow;
