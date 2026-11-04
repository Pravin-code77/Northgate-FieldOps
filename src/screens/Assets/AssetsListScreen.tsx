
import React, { useState } from 'react';

import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Colors from '../../constants/colors';
import { AssetCard } from '../../components/cards/AssetCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { useAssets } from '../../hooks/useAssets';
import { Asset } from '../../models/Asset';
import { AssetEditModal } from '../AssetDetail/AssetEditModal';

interface AssetsListScreenProps {
  navigation: any;
}

const STATUS_FILTERS = [
  { id: 'all', label: 'All Equipment' },
  { id: 'operational', label: 'Operational' },
  { id: 'fault', label: 'Fault' },
  { id: 'retired', label: 'Retired' },
];

export const AssetsListScreen: React.FC<AssetsListScreenProps> = ({
  navigation,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Use the hook's state directly
  const {
    assets,
    assetTypes,
    isLoading,
    error,
    refresh,
    addAsset,
    search,
    setSearch,
    status,
    setStatus,
  } = useAssets();

  const handleCreateAsset = async (input: any) => {
    try {
      await addAsset(input);
      setShowCreateModal(false);
    } catch (err: any) {
      console.error('Error creating asset:', err);
    }
  };

  const renderItem = ({ item }: { item: Asset }) => (
    <AssetCard
      asset={item}
      onPress={() =>
        navigation.navigate('AssetDetail', {
          assetId: item.id,
        })
      }
    />
  );

  return (
    <View style={styles.container}>
      {/* Search and Create Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search equipment name or reference..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.addButtonText}>+ New Asset</Text>
        </TouchableOpacity>
      </View>

      {/* Status Filters */}
      <View style={styles.statusChipsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STATUS_FILTERS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chipsContent}
          renderItem={({ item }) => {
            const isSelected = status === item.id;

            return (
              <TouchableOpacity
                onPress={() => setStatus(item.id)}
                style={[
                  styles.chip,
                  isSelected && styles.chipActive,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    isSelected && styles.chipTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Asset Count */}
      <View style={styles.subBar}>
        <Text style={styles.subBarText}>
          {assets.length} industrial asset
          {assets.length === 1 ? '' : 's'} registered
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity onPress={refresh}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Assets List */}
      {isLoading && assets.length === 0 ? (
        <LoadingIndicator message="Loading Assets from SQLite..." />
      ) : (
        <FlatList
          data={assets}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refresh}
              colors={[Colors.primaryBlue]}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="No Industrial Assets Found"
              description="No equipment matches your search or selected filter."
              actionTitle="Create New Asset"
              onActionPress={() => setShowCreateModal(true)}
            />
          }
        />
      )}

      {/* Create Asset Modal */}
      <AssetEditModal
        visible={showCreateModal}
        assetTypes={assetTypes}
        onSave={handleCreateAsset}
        onCancel={() => setShowCreateModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.appBackground,
  },

  topBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
    alignItems: 'center',
  },

  searchWrapper: {
    flex: 1,
  },

  searchInput: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
    color: Colors.primaryText,
  },

  addButton: {
    backgroundColor: Colors.primaryBlue,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },

  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },

  statusChipsContainer: {
    paddingBottom: 6,
  },

  chipsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },

  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.cardWhite,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
  },

  chipActive: {
    backgroundColor: Colors.primaryBlue,
    borderColor: Colors.primaryBlue,
  },

  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.secondaryText,
  },

  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  subBar: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dividerGrey,
  },

  subBarText: {
    fontSize: 12,
    color: Colors.secondaryText,
    fontWeight: '600',
  },

  listContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },

  errorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  errorText: {
    color: '#DC2626',
    fontSize: 13,
  },

  retryText: {
    color: Colors.primaryBlue,
    fontWeight: '700',
    marginTop: 5,
  },
});
