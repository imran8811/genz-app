import React, { useState } from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fonts, radius } from '@/theme';

/**
 * Renders a menu/deal image from its URL, falling back to a branded
 * placeholder (first letter on a dark tile) when there's no image or it
 * fails to load. Images originate in genz-admin and arrive as absolute URLs.
 */
export function FoodImage({
  uri,
  name,
  style,
  rounded = radius.md,
}: {
  uri: string | null;
  name: string;
  style?: ViewStyle;
  rounded?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = !!uri && !failed;

  return (
    <View style={[styles.wrap, { borderRadius: rounded }, style]}>
      {showImage ? (
        <Image
          source={{ uri: uri! }}
          style={styles.img}
          resizeMode="cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: 'hidden', backgroundColor: colors.surfaceAlt },
  img: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  placeholderText: { fontFamily: fonts.display, fontSize: 40, color: colors.textMuted },
});
