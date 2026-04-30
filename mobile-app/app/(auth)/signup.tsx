import { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { colors, spacing } from '@/theme/colors';

export default function SignupScreen() {
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { signUp, loading } = useAuth();
  const router = useRouter();

  const handleSignup = async () => {
    setError('');

    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }

    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }

    if (!username.trim()) {
      setError('Username is required');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await signUp(fullName.trim(), companyName.trim(), username.trim(), password);
      router.replace('/(tabs)/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.logoContainer}>
          <Text variant="displaySmall" style={styles.logo}>
            🌲 TimberLog Pro
          </Text>
          <Text variant="bodyLarge" style={styles.tagline}>
            Start your 14-day free trial
          </Text>
        </View>

        <View style={styles.formContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            Create Account
          </Text>

          <TextInput
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="account" />}
          />

          <TextInput
            label="Company Name"
            value={companyName}
            onChangeText={setCompanyName}
            autoCapitalize="words"
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="office-building" />}
          />

          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoComplete="username"
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="account-circle" />}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="lock" />}
            right={<TextInput.Icon icon={showPassword ? 'eye-off' : 'eye'} onPress={() => setShowPassword(!showPassword)} />}
          />

          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="lock-check" />}
          />

          {error ? (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          ) : null}

          <Button
            mode="contained"
            onPress={handleSignup}
            loading={loading}
            disabled={loading}
            style={styles.signupButton}
            contentStyle={styles.buttonContent}
          >
            Create Account
          </Button>

          <Button
            mode="text"
            onPress={() => router.back()}
            style={styles.loginButton}
          >
            Already have an account? Login
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    marginBottom: spacing.xl,
  },
  logo: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  tagline: {
    color: colors.accent,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  formContainer: {
    flex: 1,
  },
  title: {
    marginBottom: spacing.lg,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: spacing.md,
  },
  signupButton: {
    marginTop: spacing.md,
    backgroundColor: colors.primary,
  },
  buttonContent: {
    height: 56,
  },
  loginButton: {
    marginTop: spacing.sm,
  },
});