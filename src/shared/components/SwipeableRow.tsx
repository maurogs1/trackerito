import React, { useRef } from 'react';
import { View, Animated, PanResponder, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = -80;
const DELETE_THRESHOLD = -150;

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  backgroundColor?: string;
}

export function SwipeableRow({ children, onDelete, backgroundColor = '#FF3B30' }: SwipeableRowProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal swipes
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderGrant: () => {
        translateX.setOffset(translateX._value);
        translateX.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow left swipe (negative dx)
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);

          // Fade in delete button as user swipes
          const opacity = Math.min(Math.abs(gestureState.dx) / 80, 1);
          deleteOpacity.setValue(opacity);
        } else if (gestureState.dx > 0 && translateX._offset < 0) {
          // Allow swiping back to the right
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateX.flattenOffset();

        const currentValue = gestureState.dx + (translateX._offset || 0);

        if (currentValue < DELETE_THRESHOLD) {
          // Full swipe - delete immediately
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onDelete();
          });
        } else if (currentValue < SWIPE_THRESHOLD) {
          // Partial swipe - show delete button
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: true,
            bounciness: 5,
          }).start();
          deleteOpacity.setValue(1);
        } else {
          // Reset to original position
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 5,
          }).start();
          Animated.timing(deleteOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 5,
    }).start();
    Animated.timing(deleteOpacity, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleDelete = () => {
    Animated.timing(translateX, {
      toValue: -SCREEN_WIDTH,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDelete();
    });
  };

  return (
    <View style={styles.container}>
      {/* Delete button behind the row */}
      <Animated.View style={[styles.deleteContainer, { opacity: deleteOpacity, backgroundColor }]}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
          <Text style={styles.deleteText}>Eliminar</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* The actual row content */}
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
  deleteContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  rowContent: {
    backgroundColor: 'transparent',
  },
});

export default SwipeableRow;
