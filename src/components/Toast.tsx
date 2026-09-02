import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors, fonts, radius } from '@/theme';

/** Lightweight transient toast, shown near the bottom of the screen. */
export function useToast(duration = 1600) {
  const [toast, setToast] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string) => {
      setToast(message);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(''), duration);
    },
    [duration],
  );

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return { toast, show };
}

export function Toast({ message }: { message: string }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (message) {
      setRendered(true);
      Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }).start(
        ({ finished }) => finished && setRendered(false),
      );
    }
  }, [message, opacity]);

  if (!rendered) return null;

  return (
    <Animated.View style={[styles.toast, { opacity }]} pointerEvents="none">
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 96,
    alignSelf: 'center',
    backgroundColor: colors.text,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: radius.pill,
    maxWidth: '86%',
  },
  toastText: { color: colors.bg, fontFamily: fonts.bodySemibold, fontSize: 14, textAlign: 'center' },
});
