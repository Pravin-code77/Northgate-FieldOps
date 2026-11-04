import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getStatusBadgeColors } from '../../utils/formatters';

interface StatusChipProps {
  status: string;
  size?: 'small' | 'medium';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'medium' }) => {
  const colors = getStatusBadgeColors(status);
  const formattedText = status.replace(/_/g, ' ').toUpperCase();

  return (
    <View
      style={[
        styles.chip,
        size === 'small' ? styles.chipSmall : styles.chipMedium,
        { backgroundColor: colors.bg, borderColor: colors.border },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: colors.text }]} />
      <Text
        style={[
          styles.text,
          size === 'small' ? styles.textSmall : styles.textMedium,
          { color: colors.text },
        ]}
      >
        {formattedText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  chipSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipMedium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  textSmall: {
    fontSize: 10,
  },
  textMedium: {
    fontSize: 11,
  },
});
