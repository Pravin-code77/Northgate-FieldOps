import * as FileSystem from 'expo-file-system/legacy';
import { InspectionPhoto } from '../models/InspectionPhoto';
import { addAuditLog, addOutboundLog } from '../repositories/logRepository';
import {
  addPhoto,
  deletePhoto,
  getPhotoByKind,
  getPhotosByWorkOrderId,
} from '../repositories/photoRepository';
import { enqueue } from '../repositories/syncRepository';
import { getNowIso } from '../utils/dateTime';

/**
 * Get the private application storage directory for work order inspection photos
 */
export function getWorkOrderPhotoDirectory(woNumber: string): string {
  // Use FileSystem.documentDirectory which is private to the application
  const baseDir = `${FileSystem.documentDirectory}fieldops/photos/${woNumber}/`;
  return baseDir;
}

/**
 * Ensure the directory exists in private file storage
 */
export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(dirPath);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
  }
}

/**
 * Save captured photo to private storage and record metadata in SQLite
 */
export async function saveInspectionPhoto(params: {
  workOrderId: number;
  woNumber: string;
  kind: 'before' | 'after';
  tempUri: string;
  location?: { lat: number; lng: number } | null;
}): Promise<InspectionPhoto> {
  const { workOrderId, woNumber, kind, tempUri, location } = params;

  // 1. Verify source temporary file exists
  const tempFileInfo = await FileSystem.getInfoAsync(tempUri);
  if (!tempFileInfo.exists) {
    throw new Error('Temporary captured photo was not found on device.');
  }

  // 2. Prepare private storage directory
  const destDir = getWorkOrderPhotoDirectory(woNumber);
  await ensureDirectoryExists(destDir);

  // 3. Generate unique destination path
  const filename = `${kind}_${Date.now()}.jpg`;
  const destPath = `${destDir}${filename}`;

  // 4. Copy file into private app storage
  await FileSystem.copyAsync({
    from: tempUri,
    to: destPath,
  });

  // 5. Verify the copied file exists before writing to database
  const destFileInfo = await FileSystem.getInfoAsync(destPath);
  if (!destFileInfo.exists) {
    throw new Error('Failed to persist photo into private application storage.');
  }

  const now = getNowIso();

  // 6. Save metadata record to SQLite
  const photoRecordId = await addPhoto({
    work_order_id: workOrderId,
    kind,
    file_path: destPath,
    captured_at: now,
    captured_lat: location?.lat ?? null,
    captured_lng: location?.lng ?? null,
  });

  // 7. Create outbound log and sync queue item
  await addOutboundLog({
    operation: 'create',
    module: 'photos',
    entity: 'inspection_photo',
    entity_id: photoRecordId,
    status: 'pending',
  });

  await enqueue({
    entity: 'inspection_photo',
    entity_id: photoRecordId,
    operation: 'create',
  });

  await addAuditLog({
    user_id: 1,
    event_type: 'photo_captured',
    detail: `Captured ${kind.toUpperCase()} inspection photo for ${woNumber}.`,
  });

  return {
    id: photoRecordId,
    work_order_id: workOrderId,
    kind,
    file_path: destPath,
    captured_at: now,
    captured_lat: location?.lat ?? null,
    captured_lng: location?.lng ?? null,
  };
}

/**
 * Retrieve both before and after photos for a work order
 */
export async function getPhotosForWorkOrder(workOrderId: number): Promise<{
  beforePhoto: InspectionPhoto | null;
  afterPhoto: InspectionPhoto | null;
  allPhotos: InspectionPhoto[];
}> {
  const allPhotos = await getPhotosByWorkOrderId(workOrderId);
  const beforePhoto = allPhotos.find((p) => p.kind === 'before') ?? null;
  const afterPhoto = allPhotos.find((p) => p.kind === 'after') ?? null;

  return {
    beforePhoto,
    afterPhoto,
    allPhotos,
  };
}

/**
 * Check if the photo file exists in filesystem
 */
export async function checkPhotoExists(filePath: string): Promise<boolean> {
  if (!filePath) return false;
  try {
    const info = await FileSystem.getInfoAsync(filePath);
    return info.exists;
  } catch {
    return false;
  }
}

/**
 * Remove photo from filesystem and SQLite
 */
export async function removePhoto(photo: InspectionPhoto): Promise<void> {
  try {
    const fileExists = await checkPhotoExists(photo.file_path);
    if (fileExists) {
      await FileSystem.deleteAsync(photo.file_path, { idempotent: true });
    }
  } catch (err) {
    console.warn('[PhotoService] Failed to delete photo file:', err);
  }

  await deletePhoto(photo.id);
}
