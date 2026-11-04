
import { useCallback, useEffect, useState } from 'react';
import { Asset, AssetType } from '../models/Asset';
import {
  createNewAsset,
  deleteExistingAsset,
  fetchAssetById,
  fetchAssets,
  fetchAssetTypes,
  updateExistingAsset,
} from '../services/assetService';

export function useAssets(
  initialSearch: string = '',
  initialStatus: string = 'all',
  initialType: number = 0
) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetTypes, setAssetTypes] = useState<AssetType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Single source of truth for filters
  const [search, setSearch] = useState<string>(initialSearch);
  const [status, setStatus] = useState<string>(initialStatus);
  const [typeId, setTypeId] = useState<number>(initialType);

  const loadAssets = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [assetList, types] = await Promise.all([
        fetchAssets(search, status, typeId),
        fetchAssetTypes(),
      ]);

      setAssets(assetList);
      setAssetTypes(types);
    } catch (err: any) {
      console.error('[useAssets] Error loading assets:', err);
      setError(err?.message || 'Failed to load assets from SQLite.');
    } finally {
      setIsLoading(false);
    }
  }, [search, status, typeId]);

  // Reload whenever search, status, or type changes
  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const addAsset = async (input: {
    asset_ref: string;
    name: string;
    asset_type_id: number;
    status: string;
    latitude: number;
    longitude: number;
    installation_date: string;
    notes?: string | null;
  }): Promise<Asset> => {
    const created = await createNewAsset(input);
    await loadAssets();
    return created;
  };

  const editAsset = async (
    id: number,
    data: Partial<Asset>
  ): Promise<Asset> => {
    const updated = await updateExistingAsset(id, data);
    await loadAssets();
    return updated;
  };

  const removeAsset = async (id: number): Promise<void> => {
    await deleteExistingAsset(id);
    await loadAssets();
  };

  return {
    assets,
    assetTypes,
    isLoading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    typeId,
    setTypeId,
    refresh: loadAssets,
    addAsset,
    editAsset,
    removeAsset,
    getAssetById: fetchAssetById,
  };
}
