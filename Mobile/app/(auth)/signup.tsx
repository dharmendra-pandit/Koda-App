import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { User, AtSign, Mail, Lock, BookOpen, Calendar, Eye, EyeOff } from 'lucide-react-native';
import { MotiView } from 'moti';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { Colors } from '../../src/styles/colors';
import { Spacing, BorderRadius } from '../../src/styles/spacing';
import { FontSize, FontWeight } from '../../src/styles/typography';
import { useAlertStore } from '../../src/store/useAlertStore';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG', 'Other'];

export default function SignupScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', institution: '', year: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.username.trim()) e.username = 'Username is required';
    else if (form.username.length < 3) e.username = 'Min 3 characters';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
    if (!form.institution.trim()) e.institution = 'Institution is required';
    if (!form.year) e.year = 'Select your year';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        ...form,
        email: form.email.trim().toLowerCase(),
        username: form.username.trim().toLowerCase(),
      });
      await login(data.data.token, data.data.user);
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Signup failed. Try again.';
      useAlertStore.getState().showAlert({
        title: 'Signup Failed',
        message: msg,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[Colors.background, '#E8F5ED', Colors.background]} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <MotiView from={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', delay: 80 }} style={styles.logoContainer}>
            <Image source={require('../../assets/images/KODA.png')} style={styles.logo} resizeMode="contain" />
          </MotiView>

          <MotiView from={{ opacity: 0, translateY: 16 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 180 }}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join thousands of focused students</Text>
          </MotiView>

          <MotiView from={{ opacity: 0, translateY: 24 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 400, delay: 300 }} style={styles.form}>
            <Input label="Full Name" placeholder="Your full name" value={form.name} onChangeText={(v) => set('name', v)} error={errors.name} leftIcon={<User size={18} color={Colors.textSecondary} />} />
            <Input label="Username" placeholder="@username" value={form.username} onChangeText={(v) => set('username', v)} autoCapitalize="none" error={errors.username} leftIcon={<AtSign size={18} color={Colors.textSecondary} />} />
            <Input label="Email" placeholder="you@example.com" value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" error={errors.email} leftIcon={<Mail size={18} color={Colors.textSecondary} />} />
            <Input label="Password" placeholder="Min 6 characters" value={form.password} onChangeText={(v) => set('password', v)} secureTextEntry={!showPassword} error={errors.password} leftIcon={<Lock size={18} color={Colors.textSecondary} />} rightIcon={<TouchableOpacity onPress={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} color={Colors.textSecondary} /> : <Eye size={18} color={Colors.textSecondary} />}</TouchableOpacity>} />
            <Input label="Institution" placeholder="Your college/school" value={form.institution} onChangeText={(v) => set('institution', v)} error={errors.institution} leftIcon={<BookOpen size={18} color={Colors.textSecondary} />} />

            {/* Year selector */}
            <View>
              <Text style={styles.yearLabel}>Year of Study</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.yearRow}>
                {YEARS.map((y) => (
                  <TouchableOpacity key={y} onPress={() => set('year', y)} style={[styles.yearChip, form.year === y && styles.yearChipActive]}>
                    <Text style={[styles.yearChipText, form.year === y && styles.yearChipTextActive]}>{y}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
            </View>

            <Button title="Create Account" onPress={handleSignup} loading={loading} fullWidth size="lg" style={{ marginTop: Spacing.sm }} />

            <TouchableOpacity style={styles.loginLink} onPress={() => router.back()}>
              <Text style={styles.loginText}>Already have an account? <Text style={styles.loginAction}>Sign in</Text></Text>
            </TouchableOpacity>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.screenPadding, paddingTop: 20, paddingBottom: 40 },
  logoContainer: { alignItems: 'center', marginBottom: Spacing.lg },
  logo: { width: 90, height: 90, borderRadius: 45, overflow: 'hidden', backgroundColor: Colors.card },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  form: { gap: Spacing.base },
  yearLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, marginBottom: 8 },
  yearRow: { gap: 8, paddingBottom: 4 },
  yearChip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: BorderRadius.full, backgroundColor: Colors.backgroundAlt, borderWidth: 1.5, borderColor: Colors.border },
  yearChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  yearChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  yearChipTextActive: { color: Colors.white },
  errorText: { color: Colors.error, fontSize: FontSize.xs, marginTop: 4 },
  loginLink: { alignItems: 'center', paddingVertical: Spacing.sm },
  loginText: { fontSize: FontSize.base, color: Colors.textSecondary },
  loginAction: { color: Colors.primary, fontWeight: FontWeight.semibold },
});
