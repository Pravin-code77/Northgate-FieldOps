import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../../constants/colors';
import AppConfig from '../../constants/config';
import { WorkOrderStatus } from '../../constants/statuses';
import { PhotoCaptureCard } from '../../components/photos/PhotoCaptureCard';
import { PriorityBadge } from '../../components/status/PriorityBadge';
import { StatusChip } from '../../components/status/StatusChip';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { FormInput } from '../../components/forms/FormInput';
import { LoadingIndicator } from '../../components/common/LoadingIndicator';
import { useSession } from '../../context/SessionContext';
import { useGps } from '../../hooks/useGps';
import { useWorkOrders } from '../../hooks/useWorkOrders';
import { InspectionPhoto } from '../../models/InspectionPhoto';
import { WorkOrder } from '../../models/WorkOrder';
import { getPhotosForWorkOrder } from '../../services/photoService';
import { formatDate, formatDateTime, isOverdue } from '../../utils/dateTime';
import { formatCoordinates, formatDistance } from '../../utils/formatters';
import { GPSVerificationModal } from '../GPSVerification/GPSVerificationModal';

interface WorkOrderDetailScreenProps {
  navigation: any;
  route: {
    params: {
      workOrderId: number;
    };
  };
}

export const WorkOrderDetailScreen: React.FC<WorkOrderDetailScreenProps> = ({ navigation, route }) => {
  const { workOrderId } = route.params;
  const { isAuthenticated, session } = useSession();
  const { getDetail, startWO, saveNotes, completeWO } = useWorkOrders();
  const { currentLocation, refreshLocation } = useGps();

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [beforePhoto, setBeforePhoto] = useState<InspectionPhoto | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<InspectionPhoto | null>(null);
  const [notes, setNotes] = useState<string>('');
  const [notesSaved, setNotesSaved] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [showGpsModal, setShowGpsModal] = useState<boolean>(false);
  const [selectedPreviewPhoto, setSelectedPreviewPhoto] = useState<InspectionPhoto | null>(null);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const wo = await getDetail(workOrderId);
      if (wo) {
        setWorkOrder(wo);
        setNotes(wo.inspection_notes || '');
        setNotesSaved(true);

        const photos = await getPhotosForWorkOrder(wo.id);
        setBeforePhoto(photos.beforePhoto);
        setAfterPhoto(photos.afterPhoto);
      }
    } catch (err) {
      console.error('[WorkOrderDetail] Error loading details:', err);
    } finally {
      setIsLoading(false);
    }
  }, [workOrderId, getDetail]);

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadData();
    });
    return unsubscribe;
  }, [navigation, loadData]);

  if (isLoading || !workOrder) {
    return (
      <View style={styles.centerContainer}>
        <LoadingIndicator message="Loading Work Order Details..." />
      </View>
    );
  }

  const isPending = workOrder.status === WorkOrderStatus.PENDING;
  const isInProgress = workOrder.status === WorkOrderStatus.IN_PROGRESS;
  const isCompleted = workOrder.status === WorkOrderStatus.COMPLETED;
  const overdue = isOverdue(workOrder.due_date, workOrder.status);

  const hasBefore = beforePhoto !== null;
  const hasAfter = afterPhoto !== null;
  const hasValidNotes = notes.trim().length >= AppConfig.minInspectionNotesLength;
  const canComplete = isInProgress && hasBefore && hasAfter && hasValidNotes;

  const handleStartRequest = () => {
    if (!isAuthenticated || !session) {
      Alert.alert('Authentication Required', 'Please authenticate to start this work order.');
      return;
    }
    setShowGpsModal(true);
  };

  const handleGpsSuccess = async (coords: { latitude: number; longitude: number; accuracy: number | null }, distanceMeters: number) => {
    setShowGpsModal(false);
    setIsSubmitting(true);
    try {
      const updated = await startWO({
        workOrder,
        hasActiveSession: isAuthenticated,
        isWithinRadius: true,
        currentLocation: coords,
        distanceMeters,
      });
      setWorkOrder(updated);
      Alert.alert('Work Order Started', `Status updated to IN PROGRESS. GPS proximity verified (${Math.round(distanceMeters)}m).`);
    } catch (err: any) {
      Alert.alert('Start Blocked', err?.message || 'Failed to start work order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNotes = async () => {
    setIsSubmitting(true);
    try {
      await saveNotes(workOrder.id, notes);
      setNotesSaved(true);
      Alert.alert('Saved', 'Inspection notes saved locally in SQLite.');
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Failed to save notes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteWorkOrder = async () => {
    if (!canComplete) {
      Alert.alert(
        'Completion Requirements Missing',
        'To complete this work order you must provide:\n1. BEFORE photo\n2. AFTER photo\n3. Inspection notes (min 10 characters)'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const coords = currentLocation || (await refreshLocation()) || {
        latitude: workOrder.asset_lat ?? 37.7749,
        longitude: workOrder.asset_lng ?? -122.4194,
        accuracy: 10,
      };

      const completed = await completeWO({
        workOrder,
        notes,
        completionCoords: coords,
      });

      setWorkOrder(completed);
      Alert.alert(
        'Work Order Completed',
        `Work order ${workOrder.wo_number} successfully completed and saved in SQLite. Outbound synchronization record queued.`
      );
    } catch (err: any) {
      Alert.alert('Completion Error', err?.message || 'Failed to complete work order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navigateToCamera = (kind: 'before' | 'after') => {
    navigation.navigate('CameraCapture', {
      workOrderId: workOrder.id,
      woNumber: workOrder.wo_number,
      assetName: workOrder.asset_name || 'Industrial Equipment',
      kind,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Overdue Warning */}
      {overdue && (
        <View style={styles.overdueAlert}>
          <Text style={styles.overdueAlertText}>
            ⚠️ OVERDUE MAINTENANCE — High Priority Attention Required
          </Text>
        </View>
      )}

      {/* Header Info Card */}
      <View style={styles.headerCard}>
        <View style={styles.topRow}>
          <Text style={styles.woNumber}>{workOrder.wo_number}</Text>
          <StatusChip status={workOrder.status} />
        </View>

        <Text style={styles.assetName}>{workOrder.asset_name}</Text>
        {workOrder.asset_ref && (
          <Text style={styles.assetRef}>Asset Ref: {workOrder.asset_ref}</Text>
        )}

        <View style={styles.badgeRow}>
          <PriorityBadge priority={workOrder.priority} />
          {workOrder.asset_type_name && (
            <View style={styles.typeBadge}>
              <Text style={styles.typeText}>{workOrder.asset_type_name}</Text>
            </View>
          )}
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Due Date: </Text>
          <Text style={[styles.dateValue, overdue && styles.dateOverdue]}>
            {formatDate(workOrder.due_date)}
          </Text>
        </View>

        {isCompleted && workOrder.completion_date && (
          <View style={styles.completionBanner}>
            <Text style={styles.completionTitle}>✓ Job Completed</Text>
            <Text style={styles.completionText}>
              Date: {formatDateTime(workOrder.completion_date)}
            </Text>
            {workOrder.completion_lat != null && workOrder.completion_lng != null && (
              <Text style={styles.completionCoords}>
                Verified GPS: {formatCoordinates(workOrder.completion_lat, workOrder.completion_lng)}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Work Instructions Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Work Instructions & Description</Text>
        <Text style={styles.descriptionText}>{workOrder.description}</Text>
      </View>

      {/* Target Asset Location Card */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Asset Location & Proximity</Text>
        <Text style={styles.coordsText}>
          Coordinates: {formatCoordinates(workOrder.asset_lat, workOrder.asset_lng)}
        </Text>
        <Text style={styles.coordsSubtext}>
          Proximity verification required prior to starting maintenance.
        </Text>
      </View>

      {/* START WORK ORDER BUTTON (If Pending) */}
      {isPending && (
        <View style={styles.startActionContainer}>
          <PrimaryButton
            title="Verify GPS Proximity & Start Work"
            onPress={handleStartRequest}
            loading={isSubmitting}
          />
        </View>
      )}

      {/* FEATURE 2: BEFORE-AND-AFTER PHOTO CAPTURE MODULE */}
      <PhotoCaptureCard
        beforePhoto={beforePhoto}
        afterPhoto={afterPhoto}
        onCaptureBefore={() => navigateToCamera('before')}
        onCaptureAfter={() => navigateToCamera('after')}
        onPreviewPhoto={(p) => setSelectedPreviewPhoto(p)}
        disabled={isPending || isCompleted}
      />

      {/* FEATURE 1: INSPECTION NOTES MODULE */}
      <View style={styles.sectionCard}>
        <View style={styles.notesHeader}>
          <Text style={styles.sectionTitle}>Engineering Inspection Notes</Text>
          {!notesSaved && <Text style={styles.unsavedBadge}>Unsaved Changes</Text>}
        </View>

        <FormInput
          label="Detailed Technical Observations"
          placeholder="Record condition assessment, parts replaced, sensor readings, lubrication..."
          value={notes}
          onChangeText={(txt) => {
            setNotes(txt);
            setNotesSaved(false);
          }}
          multiline
          minChars={AppConfig.minInspectionNotesLength}
          currentLength={notes.trim().length}
          editable={!isCompleted}
          helperText="Minimum 10 characters required for work-order completion."
        />

        {!isCompleted && (
          <SecondaryButton
            title="Save Inspection Notes Locally"
            onPress={handleSaveNotes}
            loading={isSubmitting}
          />
        )}
      </View>

      {/* COMPLETION VALIDATION CHECKLIST */}
      {isInProgress && (
        <View style={styles.checklistCard}>
          <Text style={styles.checklistTitle}>Completion Requirements Checklist</Text>

          <View style={styles.checkItem}>
            <Text style={styles.checkIcon}>{hasBefore ? '✅' : '⚪'}</Text>
            <Text style={[styles.checkLabel, hasBefore && styles.checkLabelDone]}>
              BEFORE Maintenance Photograph
            </Text>
          </View>

          <View style={styles.checkItem}>
            <Text style={styles.checkIcon}>{hasAfter ? '✅' : '⚪'}</Text>
            <Text style={[styles.checkLabel, hasAfter && styles.checkLabelDone]}>
              AFTER Maintenance Photograph
            </Text>
          </View>

          <View style={styles.checkItem}>
            <Text style={styles.checkIcon}>{hasValidNotes ? '✅' : '⚪'}</Text>
            <Text style={[styles.checkLabel, hasValidNotes && styles.checkLabelDone]}>
              Inspection Notes (Minimum 10 characters)
            </Text>
          </View>

          <View style={styles.completeBtnContainer}>
            <PrimaryButton
              title={canComplete ? 'Complete Work Order' : 'Complete (Requirements Missing)'}
              onPress={handleCompleteWorkOrder}
              disabled={!canComplete || isSubmitting}
              loading={isSubmitting}
              variant="success"
            />
          </View>
        </View>
      )}

      {/* GPS Verification Modal */}
      {workOrder.asset_lat != null && workOrder.asset_lng != null && (
        <GPSVerificationModal
          visible={showGpsModal}
          assetName={workOrder.asset_name || 'Industrial Equipment'}
          assetCoords={{ latitude: workOrder.asset_lat, longitude: workOrder.asset_lng }}
          onVerificationSuccess={handleGpsSuccess}
          onCancel={() => setShowGpsModal(false)}
        />
      )}

      {/* Full Photo Preview Modal */}
      <Modal
        visible={selectedPreviewPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPreviewPhoto(null)}
      >
        <View style={styles.previewBackdrop}>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>
                {selectedPreviewPhoto?.kind.toUpperCase()} PHOTOGRAPH
              </Text>
              <TouchableOpacity onPress={() => setSelectedPreviewPhoto(null)}>
                <Text style={styles.previewClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {selectedPreviewPhoto && (
              <Image
                source={{ uri: selectedPreviewPhoto.file_path }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}

            <View style={styles.previewMeta}>
              <Text style={styles.previewMetaText}>
                Captured: {formatDateTime(selectedPreviewPhoto?.captured_at)}
              </Text>
              {selectedPreviewPhoto?.captured_lat != null && (
                <Text style={styles.previewMetaText}>
                  GPS: {formatCoordinates(selectedPreviewPhoto.captured_lat, selectedPreviewPhoto.captured_lng)}
                </Text>
              )}
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.appBackground,
  },
  overdueAlert: {
    backgroundColor: Colors.dangerRedBg,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFA39E',
  },
  overdueAlertText: {
    color: Colors.dangerRed,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  woNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.darkBlue,
  },
  assetName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryText,
    marginBottom: 2,
  },
  assetRef: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryBlue,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  typeBadge: {
    backgroundColor: Colors.lightBlue,
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primaryBlue,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: 13,
    color: Colors.secondaryText,
  },
  dateValue: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  dateOverdue: {
    color: Colors.dangerRed,
    fontWeight: '800',
  },
  completionBanner: {
    marginTop: 14,
    padding: 12,
    backgroundColor: Colors.successGreenBg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#B7EB8F',
  },
  completionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.successGreen,
    marginBottom: 2,
  },
  completionText: {
    fontSize: 12,
    color: '#135200',
  },
  completionCoords: {
    fontSize: 11,
    color: '#237804',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.primaryText,
    lineHeight: 20,
  },
  coordsText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primaryText,
    marginBottom: 2,
  },
  coordsSubtext: {
    fontSize: 11,
    color: Colors.secondaryText,
  },
  startActionContainer: {
    marginBottom: 14,
  },
  notesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  unsavedBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.warningOrange,
    backgroundColor: Colors.warningOrangeBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  checklistCard: {
    backgroundColor: Colors.cardWhite,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
    marginBottom: 16,
  },
  checklistTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 12,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  checkLabel: {
    fontSize: 13,
    color: Colors.secondaryText,
  },
  checkLabelDone: {
    color: Colors.primaryText,
    fontWeight: '600',
  },
  completeBtnContainer: {
    marginTop: 16,
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: Colors.overlayBackdrop,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  previewCard: {
    width: '100%',
    backgroundColor: Colors.cardWhite,
    borderRadius: 16,
    overflow: 'hidden',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderGrey,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  previewClose: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondaryText,
    padding: 4,
  },
  fullImage: {
    width: '100%',
    height: 320,
    backgroundColor: '#000000',
  },
  previewMeta: {
    padding: 14,
    backgroundColor: Colors.appBackground,
  },
  previewMetaText: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginBottom: 2,
  },
});
