import React, { useEffect, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Colors from '../../constants/colors';
import { Asset, AssetType } from '../../models/Asset';
import { FormInput } from '../../components/forms/FormInput';
import { PrimaryButton } from '../../components/common/PrimaryButton';
import { SecondaryButton } from '../../components/common/SecondaryButton';
import { useGps } from '../../hooks/useGps';
import { validateAsset } from '../../validation/assetValidation';

interface AssetEditModalProps {
  visible: boolean;
  asset?: Asset | null;
  assetTypes: AssetType[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export const AssetEditModal: React.FC<AssetEditModalProps> = ({
  visible,
  asset,
  assetTypes,
  onSave,
  onCancel,
}) => {
  const isEditing = !!asset;
  const { currentLocation, refreshLocation, isLocating } = useGps();

  const [assetRef, setAssetRef] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [typeId, setTypeId] = useState<number>(1);
  const [status, setStatus] = useState<string>('operational');
  const [latitudeStr, setLatitudeStr] = useState<string>('');
  const [longitudeStr, setLongitudeStr] = useState<string>('');
  const [installationDate, setInstallationDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (asset) {
      setAssetRef(asset.asset_ref);
      setName(asset.name);
      setTypeId(asset.asset_type_id);
      setStatus(asset.status);
      setLatitudeStr(asset.latitude.toString());
      setLongitudeStr(asset.longitude.toString());
      setInstallationDate(asset.installation_date);
      setNotes(asset.notes || '');
    } else {
      // Default new asset values
      const rnd = Math.floor(100 + Math.random() * 900);
      setAssetRef(`AST-NEW-${rnd}`);
      setName('');
      setTypeId(assetTypes[0]?.id || 1);
      setStatus('operational');
      setLatitudeStr('37.7749');
      setLongitudeStr('-122.4194');
      const today = new Date().toISOString().split('T')[0];
      setInstallationDate(today);
      setNotes('');
    }
    setErrorMsg(null);
  }, [asset, assetTypes, visible]);

  const handleUseCurrentGps = async () => {
    const loc = await refreshLocation();
    if (loc) {
      setLatitudeStr(loc.latitude.toFixed(5));
      setLongitudeStr(loc.longitude.toFixed(5));
    }
  };

  const handleSave = async () => {
    const lat = parseFloat(latitudeStr);
    const lng = parseFloat(longitudeStr);

    const validation = validateAsset({
      name,
      asset_type_id: typeId,
      latitude: lat,
      longitude: lng,
      installation_date: installationDate,
    });

    if (!validation.isValid) {
      setErrorMsg(validation.errors.join(' '));
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onSave({
        asset_ref: assetRef,
        name,
        asset_type_id: typeId,
        status,
        latitude: lat,
        longitude: lng,
        installation_date: installationDate,
        notes: notes.trim() ? notes.trim() : null,
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to save asset in SQLite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {isEditing ? `Edit Asset: ${asset?.asset_ref}` : 'Register New Asset'}
            </Text>
            <TouchableOpacity onPress={onCancel}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll}>
            {!isEditing && (
              <FormInput
                label="Asset Reference Code"
                value={assetRef}
                onChangeText={setAssetRef}
                placeholder="AST-PUMP-01"
              />
            )}

            <FormInput
              label="Equipment Name *"
              value={name}
              onChangeText={setName}
              placeholder="e.g. Centrifugal Slurry Pump #3"
            />

            {/* Asset Type Selector */}
            <Text style={styles.fieldLabel}>Equipment Type *</Text>
            <View style={styles.typeSelector}>
              {assetTypes.map((at) => (
                <TouchableOpacity
                  key={at.id}
                  style={[styles.typeOption, typeId === at.id && styles.typeOptionActive]}
                  onPress={() => setTypeId(at.id)}
                >
                  <Text style={[styles.typeOptionText, typeId === at.id && styles.typeOptionTextActive]}>
                    {at.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status Selector */}
            <Text style={styles.fieldLabel}>Operational Status *</Text>
            <View style={styles.statusRow}>
              {['operational', 'fault', 'retired'].map((st) => (
                <TouchableOpacity
                  key={st}
                  style={[styles.statusOption, status === st && styles.statusOptionActive]}
                  onPress={() => setStatus(st)}
                >
                  <Text style={[styles.statusText, status === st && styles.statusTextActive]}>
                    {st.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Coordinates */}
            <View style={styles.gpsRow}>
              <View style={styles.coordsCol}>
                <FormInput
                  label="Latitude (-90 to 90) *"
                  value={latitudeStr}
                  onChangeText={setLatitudeStr}
                  keyboardType="numeric"
                  placeholder="37.7749"
                />
              </View>
              <View style={styles.coordsCol}>
                <FormInput
                  label="Longitude (-180 to 180) *"
                  value={longitudeStr}
                  onChangeText={setLongitudeStr}
                  keyboardType="numeric"
                  placeholder="-122.4194"
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.gpsAutoBtn}
              onPress={handleUseCurrentGps}
              disabled={isLocating}
            >
              <Text style={styles.gpsAutoBtnText}>
                {isLocating ? 'Acquiring GPS fix...' : '📍 Use Current GPS Location'}
              </Text>
            </TouchableOpacity>

            <FormInput
              label="Installation Date (YYYY-MM-DD) *"
              value={installationDate}
              onChangeText={setInstallationDate}
              placeholder="2024-01-15"
            />

            <FormInput
              label="Asset Engineering Notes"
              value={notes}
              onChangeText={setNotes}
              placeholder="Operating conditions, warranty, manufacturer remarks..."
              multiline
            />

            {errorMsg && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {errorMsg}</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.actions}>
            <View style={styles.btnWrapper}>
              <SecondaryButton title="Cancel" onPress={onCancel} />
            </View>
            <View style={styles.btnWrapper}>
              <PrimaryButton
                title={isEditing ? 'Save Changes' : 'Create Asset'}
                onPress={handleSave}
                loading={isSubmitting}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: Colors.overlayBackdrop,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.cardWhite,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primaryText,
  },
  closeBtn: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.secondaryText,
    padding: 4,
  },
  formScroll: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primaryText,
    marginBottom: 8,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  typeOption: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: Colors.appBackground,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
  },
  typeOptionActive: {
    backgroundColor: Colors.lightBlue,
    borderColor: Colors.primaryBlue,
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.secondaryText,
  },
  typeOptionTextActive: {
    color: Colors.primaryBlue,
    fontWeight: '700',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.appBackground,
    borderWidth: 1,
    borderColor: Colors.borderGrey,
  },
  statusOptionActive: {
    backgroundColor: Colors.darkBlue,
    borderColor: Colors.darkBlue,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.secondaryText,
  },
  statusTextActive: {
    color: '#FFFFFF',
  },
  gpsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  coordsCol: {
    flex: 1,
  },
  gpsAutoBtn: {
    backgroundColor: Colors.lightBlue,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C6D9FF',
  },
  gpsAutoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primaryBlue,
  },
  errorBox: {
    backgroundColor: Colors.dangerRedBg,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: Colors.dangerRed,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.dividerGrey,
  },
  btnWrapper: {
    flex: 1,
  },
});
