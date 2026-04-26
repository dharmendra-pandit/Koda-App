import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { MotiView } from 'moti';
import { ArrowLeft, Camera, User, FileText, BookOpen, Calendar } from 'lucide-react-native';
import { useAuthStore } from '../../src/store/useAuthStore';
import { api } from '../../src/services/api';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Avatar } from '../../src/components/ui/Avatar';
import { Colors } from '../../src/styles/colors';
import { Spacing, BorderRadius } from '../../src/styles/spacing';
import { FontSize, FontWeight } from '../../src/styles/typography';
import { Shadows } from '../../src/styles/shadows';
import { useAlertStore } from '../../src/store/useAlertStore';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG', 'Other'];

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState({
    name: user?.name ?? '',
    institution: user?.institution ?? '',
    year: (user?.year as string) ?? '',
    bio: user?.bio ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.institution.trim()) e.institution = 'Institution is required';
    if (!form.year) e.year = 'Select your year';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const localUri = result.assets[0].uri;
        const filename = localUri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        const formData = new FormData();
        formData.append('avatar', { uri: localUri, name: filename, type } as any);

        setSaving(true);
        const { data } = await api.post('/users/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updateUser(data.data.user);
        useAlertStore.getState().showAlert({
          title: 'Success',
          message: 'Profile picture updated',
          type: 'success'
        });
      }
    } catch (e: any) {
      useAlertStore.getState().showAlert({
        title: 'Error',
        message: e?.response?.data?.message || 'Failed to upload image',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      const { data } = await api.put('/users/update', { name: form.name.trim(), institution: form.institution.trim(), year: form.year, bio: form.bio.trim() });
      updateUser(data.data);
      useAlertStore.getState().showAlert({
        title: 'Success',
        message: 'Profile updated successfully',
        type: 'success',
        actions: [{ text: 'OK', onPress: () => router.back() }]
      });
    } catch (e: any) {
      useAlertStore.getState().showAlert({
        title: 'Error',
        message: e?.response?.data?.message || 'Failed to update profile',
        type: 'error'
      });
    } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <View style={{ width: 34 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <MotiView from={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', delay: 100 }} style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={pickImage} disabled={saving}>
              <Avatar uri={user?.avatar} name={user?.name} size={90} glow />
              <View style={styles.cameraBtn}>
                <Camera size={16} color={Colors.white} />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Tap to change photo</Text>
          </MotiView>

          <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 180 }} style={styles.form}>
            <Input label="Full Name" placeholder="Your full name" value={form.name} onChangeText={(v) => set('name', v)} error={errors.name} leftIcon={<User size={18} color={Colors.textSecondary} />} />
            <Input label="Institution" placeholder="Your college/school" value={form.institution} onChangeText={(v) => set('institution', v)} error={errors.institution} leftIcon={<BookOpen size={18} color={Colors.textSecondary} />} />
            <Input label="Bio" placeholder="Tell us about yourself..." value={form.bio} onChangeText={(v) => set('bio', v)} multiline numberOfLines={3} inputStyle={{ height: 80, textAlignVertical: 'top' }} leftIcon={<FileText size={18} color={Colors.textSecondary} />} />

            <View>
              <Text style={styles.yearLabel}>Year of Study</Text>
              <View style={styles.yearRow}>
                {YEARS.map((y) => (
                  <TouchableOpacity key={y} onPress={() => set('year', y)} style={[styles.yearChip, form.year === y && styles.yearChipActive]}>
                    <Text style={[styles.yearChipText, form.year === y && styles.yearChipTextActive]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
            </View>

            {/* Read-only fields */}
            <View style={styles.readOnly}>
              <Text style={styles.readOnlyLabel}>Username</Text>
              <Text style={styles.readOnlyValue}>@{user?.username}</Text>
            </View>
            <View style={styles.readOnly}>
              <Text style={styles.readOnlyLabel}>Email</Text>
              <Text style={styles.readOnlyValue}>{user?.email}</Text>
            </View>
          </MotiView>

          <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 280 }} style={{ paddingHorizontal: Spacing.screenPadding, paddingBottom: 40, gap: Spacing.sm }}>
            <MotiView animate={saving ? {} : { scale: [1, 1.01, 1] }} transition={{ type: 'timing', duration: 1500, loop: !saving }}>
              <Button title={saving ? 'Saving...' : 'Save Changes'} onPress={handleSave} loading={saving} fullWidth size="lg" />
            </MotiView>
            <Button title="Cancel" onPress={() => router.back()} variant="outline" fullWidth />
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing.md, paddingBottom: Spacing.md },
  backBtn: { padding: 6 },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  scroll: { paddingBottom: 20 },
  avatarSection: { alignItems: 'center', paddingVertical: Spacing.xl, gap: 8 },
  avatarWrapper: { position: 'relative' },
  cameraBtn: { position: 'absolute', bottom: 2, right: 2, width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.background },
  avatarHint: { fontSize: FontSize.sm, color: Colors.textSecondary },
  form: { paddingHorizontal: Spacing.screenPadding, gap: Spacing.base, marginBottom: Spacing.lg },
  yearLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: 8 },
  yearRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  yearChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundAlt, borderWidth: 1.5, borderColor: Colors.border },
  yearChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  yearChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  yearChipTextActive: { color: Colors.white },
  errorText: { color: Colors.error, fontSize: FontSize.xs, marginTop: 4 },
  readOnly: { backgroundColor: Colors.backgroundAlt, borderRadius: BorderRadius.md, padding: Spacing.base, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  readOnlyLabel: { fontSize: FontSize.base, color: Colors.textSecondary },
  readOnlyValue: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textMuted },
});
