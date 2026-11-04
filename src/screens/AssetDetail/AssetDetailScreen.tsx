import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../../constants/colors';
import { ConfirmationDialog } from '../../components/common/ConfirmationDialog';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { SectionHeader } from '../../components/common/SectionHeader';
import { StatusChip } from '../../components/status/StatusChip';
import { WorkOrderCard } from '../../components/cards/WorkOrderCard';
import { useAssets } from '../../hooks/useAssets';
import { useWorkOrders } from '../../hooks/useWorkOrders';
import { Asset } from '../../models/Asset';
import { formatDate } from '../../utils/dateTime';
import { formatCoordinates } from '../../utils/formatters';
import { AssetEditModal } from './AssetEditModal';

interface AssetDetailScreenProps {
  navigation: any;
  route: {
    params: {
      assetId: number;
    };
  };
}

export const AssetDetailScreen: React.FC<AssetDetailScreenProps> = ({ navigation, route }) => {
  const { assetId } = route.params;
  const { getAssetById, assetTypes, editAsset, removeAsset } = useAssets();
  const { workOrders } = useWorkOrders();

  const [asset, setAsset] = useState<Asset | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const loadAsset = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getAssetById(assetId);
      setAsset(data);
    } catch (err) {
      console.error('[AssetDetail] Error loading asset:', err);
    } finally {
      setIsLoading(false);
    }
  }, [assetId, getAssetById]);

  useEffect(() => {
    loadAsset();
  }, [loadAsset]);

  const handleEditSave = async (updatedData: any) => {
    await editAsset(assetId, updatedData);
    setShowEditModal(false);
    await loadAsset();
    Alert.alert('Success', 'Asset record updated in SQLite database.');
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false);
    try {
      await removeAsset(assetId);
      Alert.alert('Asset Deleted', 'Equipment was safely soft-deleted from active registry.');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Delete Failed', err?.message || 'Could not delete asset.');
    }
  };

  if (isLoading || !asset) {
    return (
      <View style={styles.centerContainer}>
        <LoadingIndicator message="Loading Asset Details..." />
      </View>
    );
  }

  // Find work orders for this asset
  const assetWorkOrders = workOrders.filter((wo) => wo.asset_id === asset.id);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header Info */}
      <View style={styles.card}>
        <View style={styles.topRow}>
          <Text style={styles.refCode}>{asset.asset_ref}</Text>
          <StatusChip status={asset.status} />
        </View>

        <Text style={styles.name}>{asset.name}</Text>

        {asset.asset_type_name && (
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{asset.asset_type_name}</Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>GPS Coordinates</Text>
          <Text style={styles.infoValue}>
            {formatCoordinates(asset.latitude, asset.longitude)}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Commissioning Date</Text>
          <Text style={styles.infoValue}>{formatDate(asset.installation_date)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Last Field Inspection</Text>
          <Text style={styles.infoValue}>{formatDate(asset.last_inspection_date)}</Text>
        </View>

        {asset.notes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesLabel}>Engineering Notes:</Text>
            <Text style={styles.notesText}>{asset.notes}</Text>
          </View>
        ) : null}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        <View style={styles.btnCol}>
          <SecondaryButton
            title="Edit Details"
            onPress={() => setShowEditModal(true)}
          />
        </View>
        <View style={styles.btnCol}>
          <PrimaryButton
            title="Delete Asset"
            onPress={() => setShowDeleteConfirm(true)}
            variant="danger"
          />
        </View>
      </View>

      {/* Associated Work Orders */}
      <SectionHeader
        title="Associated Work Orders"
        badge={assetWorkOrders.length}
      />

      {assetWorkOrders.length > 0 ? (
        assetWorkOrders.map((wo) => (
          <WorkOrderCard
            key={wo.id}
            workOrder={wo}
            onPress={() => navigation.navigate('WorkOrderDetail', { workOrderId: wo.id })}
          />
        ))
      ) : (
        <View style={styles.emptyWOs}>
          <Text style={styles.emptyWOsText}>No work orders currently linked to this equipment.</Text>
        </View>
      )}

      {/* Edit Modal */}
      <AssetEditModal
        visible={showEditModal}
        asset={asset}
        assetTypes={assetTypes}
        onSave={handleEditSave}
        onCancel={() => setShowEditModal(false)}
      />

      {/* Soft Delete Confirmation Dialog */}
      <ConfirmationDialog
        visible={showDeleteConfirm}
        title="Soft Delete Industrial Asset"
        message={`Are you sure you want to remove ${asset.asset_ref} (${asset.name}) from the active equipment registry? Outbound audit records will be retained.`}
        confirmText="Confirm Delete"
        isDestructive
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBackground,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 36,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.appBackground,
  },
  card: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refCode: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.darkBlue,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primaryText,
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: Colors.lightBlue,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryBlue,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dividerGrey,
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.secondaryText,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  notesBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.appBackground,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 13,
    color: Colors.secondaryText,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  btnCol: {
    flex: 1,
  },
  emptyWOs: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 10,
    padding: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.borderGrey,
  },
  emptyWOsText: {
    fontSize: 13,
    color: Colors.secondaryText,
  },
});
