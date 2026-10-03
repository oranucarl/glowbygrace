// Small shared building blocks in the Glow by Grace style.
import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type TextInputProps, type ViewStyle } from 'react-native';
import { C, F } from '../lib/theme';

export function Button({
  title,
  onPress,
  variant = 'dark',
  disabled,
  busy,
  style,
}: {
  title: string;
  onPress?: () => void;
  variant?: 'dark' | 'ghost' | 'gold';
  disabled?: boolean;
  busy?: boolean;
  style?: ViewStyle;
}) {
  const off = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off }}
      onPress={off ? undefined : onPress}
      style={({ pressed }) => [s.btn, s[variant], off && s.off, pressed && !off && { opacity: 0.85 }, style]}
    >
      {busy ? (
        <ActivityIndicator color={variant === 'dark' ? C.cream : C.espresso} />
      ) : (
        <Text style={[s.btnText, variant === 'dark' ? { color: C.cream } : { color: C.espresso }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Field({ label, hint, ...props }: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor={C.muted} style={s.input} {...props} />
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
    </View>
  );
}

export function Chip({ label, active, disabled, sub, onPress }: { label: string; sub?: string; active?: boolean; disabled?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active, disabled: !!disabled }}
      onPress={disabled ? undefined : onPress}
      style={[s.chip, active && s.chipOn, disabled && s.off]}
    >
      <Text style={[s.chipText, active && { color: C.cream }, disabled && { textDecorationLine: 'line-through' }]}>{label}</Text>
      {sub ? <Text style={[s.chipSub, active && { color: C.gold2 }]}>{sub}</Text> : null}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Notice({ tone = 'err', children }: { tone?: 'err' | 'ok'; children: ReactNode }) {
  return (
    <View style={[s.notice, tone === 'ok' ? { backgroundColor: '#dff3e5' } : { backgroundColor: '#fdecea' }]}>
      <Text style={{ fontFamily: F.body, color: tone === 'ok' ? C.ok : '#8c1d18', lineHeight: 20 }}>{children}</Text>
    </View>
  );
}

export const Eyebrow = ({ children }: { children: ReactNode }) => <Text style={s.eyebrow}>{children}</Text>;

const s = StyleSheet.create({
  btn: { minHeight: 52, borderRadius: 999, paddingHorizontal: 22, alignItems: 'center', justifyContent: 'center' },
  dark: { backgroundColor: C.espresso },
  ghost: { borderWidth: 1.5, borderColor: C.espresso },
  gold: { backgroundColor: C.gold },
  off: { opacity: 0.45 },
  btnText: { fontFamily: F.bodyHeavy, fontSize: 13, letterSpacing: 1.6, textTransform: 'uppercase' },
  label: { fontFamily: F.bodyHeavy, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', color: C.cocoa },
  hint: { fontFamily: F.body, fontSize: 12, color: C.muted },
  input: {
    fontFamily: F.body,
    fontSize: 16,
    color: C.espresso,
    backgroundColor: C.cream,
    borderWidth: 1.5,
    borderColor: 'rgba(107,70,54,0.18)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  chip: {
    minWidth: 84,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(107,70,54,0.22)',
    backgroundColor: C.white,
    alignItems: 'center',
  },
  chipOn: { backgroundColor: C.espresso, borderColor: C.espresso },
  chipText: { fontFamily: F.bodyBold, fontSize: 15, color: C.espresso },
  chipSub: { fontFamily: F.body, fontSize: 12, color: C.muted, marginTop: 2 },
  card: {
    backgroundColor: C.white,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(107,70,54,0.08)',
    shadowColor: C.espresso,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  notice: { borderRadius: 12, padding: 12 },
  eyebrow: { fontFamily: F.bodyHeavy, fontSize: 11, letterSpacing: 2.6, textTransform: 'uppercase', color: C.cocoa },
});
