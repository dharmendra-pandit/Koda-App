import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native'
import { MotiView } from 'moti'
import { api } from '../../src/services/api'
import { useAuthStore } from '../../src/store/useAuthStore'
import { Button } from '../../src/components/ui/Button'
import { Input } from '../../src/components/ui/Input'
import { Colors } from '../../src/styles/colors'
import { Spacing, BorderRadius } from '../../src/styles/spacing'
import { FontSize, FontWeight } from '../../src/styles/typography'
import { Shadows } from '../../src/styles/shadows'
import { useAlertStore } from '../../src/store/useAlertStore'

export default function LoginScreen() {
  const router = useRouter()
  const { login } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  )

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {}
    if (!email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(email))
      newErrors.email = 'Invalid email format'
    if (!password) newErrors.password = 'Password is required'
    else if (password.length < 6)
      newErrors.password = 'Password must be at least 6 characters'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async () => {
    if (!validate()) return
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      })
      await login(data.data.token, data.data.user)
      router.replace('/(tabs)')
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || 'Login failed. Check your credentials.'
      useAlertStore.getState().showAlert({
        title: 'Login Failed',
        message: msg,
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient
        colors={[Colors.background, '#E8F5ED', Colors.background]}
        style={styles.gradient}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', delay: 100 }}
            style={styles.logoContainer}
          >
            <Image
              source={require('../../assets/images/KODA.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </MotiView>

          {/* Header */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
          >
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>
              Sign in to continue your study journey
            </Text>
          </MotiView>

          {/* Form */}
          <MotiView
            from={{ opacity: 0, translateY: 24 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 400, delay: 350 }}
            style={styles.form}
          >
            <Input
              label="Email"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              leftIcon={<Mail size={18} color={Colors.textSecondary} />}
            />
            <Input
              label="Password"
              placeholder="Your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              error={errors.password}
              leftIcon={<Lock size={18} color={Colors.textSecondary} />}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={18} color={Colors.textSecondary} />
                  ) : (
                    <Eye size={18} color={Colors.textSecondary} />
                  )}
                </TouchableOpacity>
              }
            />

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={loading}
              fullWidth
              size="lg"
              style={styles.loginBtn}
            />

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.orText}>or</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity
              style={styles.signupLink}
              onPress={() => router.push('/(auth)/signup')}
            >
              <Text style={styles.signupText}>
                Don&apos;t have an account?{' '}
                <Text style={styles.signupAction}>Sign up</Text>
              </Text>
            </TouchableOpacity>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  gradient: { ...StyleSheet.absoluteFillObject },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.screenPadding,
    paddingTop: 20,
    paddingBottom: 40,
  },
  logoContainer: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: Colors.card,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  form: { gap: Spacing.base },
  loginBtn: { marginTop: Spacing.sm },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginVertical: Spacing.sm,
  },
  divider: { flex: 1, height: 1, backgroundColor: Colors.border },
  orText: { color: Colors.textMuted, fontSize: FontSize.sm },
  signupLink: { alignItems: 'center', paddingVertical: Spacing.sm },
  signupText: { fontSize: FontSize.base, color: Colors.textSecondary },
  signupAction: { color: Colors.primary, fontWeight: FontWeight.semibold },
})
