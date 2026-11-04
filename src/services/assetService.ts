
import { Asset, AssetType } from '../models/Asset';

import {
  createAsset as repoCreateAsset,
  getAssetById,
  getAssetTypes,
  searchAssets,
  softDeleteAsset as repoSoftDeleteAsset,
  updateAsset as repoUpdateAsset,
} from '../repositories/assetRepository';

import {
  addAuditLog,
  addOutboundLog,
} from '../repositories/logRepository';

import { enqueue } from '../repositories/syncRepository';
import { validateAsset } from '../validation/assetValidation';

export async function fetchAssets(
  searchQuery: string = '',
  status?: string,
  typeId?: number
): Promise<Asset[]> {
  return await searchAssets(searchQuery, status, typeId);
}

export async function fetchAssetById(
  id: number
): Promise<Asset | null> {
  return await getAssetById(id);
}

export async function fetchAssetTypes(): Promise<AssetType[]> {
  return await getAssetTypes();
}

export async function createNewAsset(input: {
  asset_ref: string;
  name: string;
  asset_type_id: number;
  status: string;
  latitude: number;
  longitude: number;
  installation_date: string;
  notes?: string | null;
}): Promise<Asset> {
  const validation = validateAsset({
    name: input.name,
    asset_type_id: input.asset_type_id,
    latitude: input.latitude,
    longitude: input.longitude,
    installation_date: input.installation_date,
  });

  if (!validation.isValid) {
    throw new Error(validation.errors.join(' '));
  }

  const assetId = await repoCreateAsset(input);

  await addOutboundLog({
    operation: 'create',
    module: 'assets',
    entity: 'asset',
    entity_id: assetId,
    status: 'pending',
  });

  await enqueue({
    entity: 'asset',
    entity_id: assetId,
    operation: 'create',
  });

  await addAuditLog({
    user_id: 1,
    event_type: 'asset_created',
    detail: `Created asset record ${input.asset_ref} (${input.name}).`,
  });

  const created = await getAssetById(assetId);

  if (!created) {
    throw new Error('Failed to retrieve newly created asset.');
  }

  return created;
}

export async function updateExistingAsset(
  id: number,
  data: Partial<Asset>
): Promise<Asset> {
  const current = await getAssetById(id);

  if (!current) {
    throw new Error(`Asset #${id} not found.`);
  }

  const merged = { ...current, ...data };

  const validation = validateAsset({
    name: merged.name,
    asset_type_id: merged.asset_type_id,
    latitude: merged.latitude,
    longitude: merged.longitude,
    installation_date: merged.installation_date,
  });

  if (!validation.isValid) {
    throw new Error(validation.errors.join(' '));
  }

  await repoUpdateAsset(id, data);

  await addOutboundLog({
    operation: 'update',
    module: 'assets',
    entity: 'asset',
    entity_id: id,
    status: 'pending',
  });

  await enqueue({
    entity: 'asset',
    entity_id: id,
    operation: 'update',
  });

  await addAuditLog({
    user_id: 1,
    event_type: 'asset_updated',
    detail: `Updated asset record ${current.asset_ref}.`,
  });

  const updated = await getAssetById(id);

  if (!updated) {
    throw new Error('Failed to retrieve asset after update.');
  }

  return updated;
}

export async function deleteExistingAsset(id: number): Promise<void> {
  const current = await getAssetById(id);

  if (!current) {
    throw new Error(`Asset #${id} not found.`);
  }

  await repoSoftDeleteAsset(id);

  await addOutboundLog({
    operation: 'delete',
    module: 'assets',
    entity: 'asset',
    entity_id: id,
    status: 'pending',
  });

  await enqueue({
    entity: 'asset',
    entity_id: id,
    operation: 'delete',
  });

  await addAuditLog({
    user_id: 1,
    event_type: 'asset_deleted',
    detail: `Soft-deleted asset record ${current.asset_ref}.`,
  });
}
