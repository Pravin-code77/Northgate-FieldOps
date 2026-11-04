
import { getDatabase } from '../db/database';
import { Asset, AssetType } from '../models/Asset';
import { getNowIso } from '../utils/dateTime';

export async function getAllAssets(
  includeDeleted = false
): Promise<Asset[]> {
  const db = await getDatabase();

  const whereClause = includeDeleted
    ? ''
    : 'WHERE a.is_deleted = 0';

  const query = `
    SELECT
      a.*,
      at.name AS asset_type_name
    FROM assets a
    LEFT JOIN asset_types at ON a.asset_type_id = at.id
    ${whereClause}
    ORDER BY a.name ASC;
  `;

  return await db.getAllAsync<Asset>(query);
}

export async function getAssetById(
  id: number
): Promise<Asset | null> {
  const db = await getDatabase();

  const query = `
    SELECT
      a.*,
      at.name AS asset_type_name
    FROM assets a
    LEFT JOIN asset_types at ON a.asset_type_id = at.id
    WHERE a.id = ?;
  `;

  const asset = await db.getFirstAsync<Asset>(query, id);
  return asset ?? null;
}

export async function getAssetTypes(): Promise<AssetType[]> {
  const db = await getDatabase();

  return await db.getAllAsync<AssetType>(
    'SELECT * FROM asset_types ORDER BY name ASC;'
  );
}

export async function createAsset(data: {
  asset_ref: string;
  name: string;
  asset_type_id: number;
  status: string;
  latitude: number;
  longitude: number;
  installation_date: string;
  notes?: string | null;
}): Promise<number> {
  const db = await getDatabase();
  const now = getNowIso();

  const result = await db.runAsync(
    `INSERT INTO assets (
      asset_ref,
      name,
      asset_type_id,
      status,
      latitude,
      longitude,
      installation_date,
      last_inspection_date,
      notes,
      is_deleted,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, 0, ?);`,
    data.asset_ref,
    data.name,
    data.asset_type_id,
    data.status,
    data.latitude,
    data.longitude,
    data.installation_date,
    data.notes ?? null,
    now
  );

  return result.lastInsertRowId;
}

export async function updateAsset(
  id: number,
  data: Partial<Asset>
): Promise<void> {
  const db = await getDatabase();
  const now = getNowIso();

  const updates: string[] = ['updated_at = ?'];
  const params: (string | number | null)[] = [now];

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }

  if (data.asset_type_id !== undefined) {
    updates.push('asset_type_id = ?');
    params.push(data.asset_type_id);
  }

  if (data.status !== undefined) {
    updates.push('status = ?');
    params.push(data.status);
  }

  if (data.latitude !== undefined) {
    updates.push('latitude = ?');
    params.push(data.latitude);
  }

  if (data.longitude !== undefined) {
    updates.push('longitude = ?');
    params.push(data.longitude);
  }

  if (data.installation_date !== undefined) {
    updates.push('installation_date = ?');
    params.push(data.installation_date);
  }

  if (data.last_inspection_date !== undefined) {
    updates.push('last_inspection_date = ?');
    params.push(data.last_inspection_date);
  }

  if (data.notes !== undefined) {
    updates.push('notes = ?');
    params.push(data.notes);
  }

  params.push(id);

  const sql = `
    UPDATE assets
    SET ${updates.join(', ')}
    WHERE id = ?;
  `;

  await db.runAsync(sql, ...params);
}

export async function softDeleteAsset(id: number): Promise<void> {
  const db = await getDatabase();
  const now = getNowIso();

  await db.runAsync(
    'UPDATE assets SET is_deleted = 1, updated_at = ? WHERE id = ?;',
    now,
    id
  );
}

// Search + Status + Asset Type filtering
export async function searchAssets(
  searchQuery: string = '',
  status?: string,
  typeId?: number
): Promise<Asset[]> {
  const db = await getDatabase();

  const conditions: string[] = ['a.is_deleted = 0'];
  const params: (string | number)[] = [];

  // Search by equipment name or asset reference
  const trimmedSearch = searchQuery.trim();

  if (trimmedSearch.length > 0) {
    conditions.push(`
      (
        a.name LIKE ?
        OR a.asset_ref LIKE ?
      )
    `);

    const searchTerm = `%${trimmedSearch}%`;

    params.push(searchTerm, searchTerm);
  }

  // Filter by equipment status
  if (status && status.toLowerCase() !== 'all') {
    conditions.push('LOWER(a.status) = LOWER(?)');
    params.push(status.trim());
  }

  // Filter by equipment type
  if (typeId && typeId > 0) {
    conditions.push('a.asset_type_id = ?');
    params.push(typeId);
  }

  const query = `
    SELECT
      a.*,
      at.name AS asset_type_name
    FROM assets a
    LEFT JOIN asset_types at
      ON a.asset_type_id = at.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY a.name COLLATE NOCASE ASC;
  `;

  console.log('[searchAssets] Search:', searchQuery);
  console.log('[searchAssets] Status:', status);
  console.log('[searchAssets] Type ID:', typeId);

  return await db.getAllAsync<Asset>(query, ...params);
}
