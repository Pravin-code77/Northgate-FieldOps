import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Colors from '../../constants/colors';
import { Asset } from '../../models/Asset';
import { formatDate } from '../../utils/dateTime';
import { formatCoordinates } from '../../utils/formatters';
import { StatusChip } from '../status/StatusChip';

interface AssetCardProps {
  asset: Asset;
  onPress: () => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onPress }) => {
  return (
    <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.refContainer}>
          <Text style={styles.assetRef}>{asset.asset_ref}</Text>
          {asset.asset_type_name && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{asset.asset_type_name}</Text>
            </View>
          )}
        </View>
        <StatusChip status={asset.status} size="small" />
      </View>

      <Text style={styles.name}>{asset.name}</Text>

      <View style={styles.coordsRow}>
        <Text style={styles.coordsLabel}>Location: </Text>
        <Text style={styles.coordsValue}>
          {formatCoordinates(asset.latitude, asset.longitude)}
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.metaText}>
          Installed: {formatDate(asset.installation_date)}
        </Text>
        <Text style={styles.metaText}>
          Last Checked: {formatDate(asset.last_inspection_date)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  assetRef: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.darkBlue,
  },
  typeBadge: {
    backgroundColor: Colors.lightBlue,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryBlue,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 8,
  },
  coordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  coordsLabel: {
    fontSize: 12,
    color: Colors.secondaryText,
  },
  coordsValue: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.dividerGrey,
    paddingTop: 8,
  },
  metaText: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
});
