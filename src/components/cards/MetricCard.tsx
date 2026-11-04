import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';

interface MetricCardProps {
  label: string;
  value: number | string;
  sublabel?: string;
  accentColor?: string;
  onPress?: () => void;
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  sublabel,
  accentColor = Colors.primaryBlue,
  onPress,
  icon,
}) => {
  const content = (
    <View style={styles.card}>
      <View style={[styles.accentStrip, { backgroundColor: accentColor }]} />
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.label} numberOfLines={1}>{label}</Text>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
        </View>
        <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
        {sublabel && <Text style={styles.sublabel} numberOfLines={1}>{sublabel}</Text>}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.75} onPress={onPress} style={styles.touchable}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={styles.touchable}>{content}</View>;
};

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
    minWidth: '45%',
  },
  card: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    minHeight: 96,
  },
  accentStrip: {
    height: 4,
    width: '100%',
  },
  body: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  iconContainer: {
    marginLeft: 6,
  },
  value: {
    fontSize: 24,
    fontWeight: '800',
    marginVertical: 2,
  },
  sublabel: {
    fontSize: 11,
    color: Colors.secondaryText,
    marginTop: 2,
  },
});
