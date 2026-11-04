import { getDatabase } from '../db/database';
import { InspectionPhoto } from '../models/InspectionPhoto';

export async function getPhotosByWorkOrderId(workOrderId: number): Promise<InspectionPhoto[]> {
  const db = await getDatabase();
  return await db.getAllAsync<InspectionPhoto>(
    'SELECT * FROM inspection_photos WHERE work_order_id = ? ORDER BY captured_at ASC;',
    workOrderId
  );
}

export async function getPhotoByKind(
  workOrderId: number,
  kind: 'before' | 'after'
): Promise<InspectionPhoto | null> {
  const db = await getDatabase();
  const photo = await db.getFirstAsync<InspectionPhoto>(
    'SELECT * FROM inspection_photos WHERE work_order_id = ? AND kind = ? ORDER BY id DESC LIMIT 1;',
    workOrderId,
    kind
  );
  return photo ?? null;
}

export async function addPhoto(photo: Omit<InspectionPhoto, 'id'>): Promise<number> {
  const db = await getDatabase();
  // If a photo of the same kind already exists for this work order, replace it or remove previous
  await db.runAsync(
    'DELETE FROM inspection_photos WHERE work_order_id = ? AND kind = ?;',
    photo.work_order_id,
    photo.kind
  );

  const result = await db.runAsync(
    `INSERT INTO inspection_photos (work_order_id, kind, file_path, captured_at, captured_lat, captured_lng)
     VALUES (?, ?, ?, ?, ?, ?);`,
    photo.work_order_id,
    photo.kind,
    photo.file_path,
    photo.captured_at,
    photo.captured_lat,
    photo.captured_lng
  );
  return result.lastInsertRowId;
}

export async function deletePhoto(id: number): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM inspection_photos WHERE id = ?;', id);
}
