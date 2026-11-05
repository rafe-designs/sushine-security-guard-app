// src/components/SideMenu.js
// A slide-out menu (left drawer) with a dimmed backdrop. No extra libraries needed.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const PANEL_WIDTH = Math.min(330, Math.round(Dimensions.get('window').width * 0.84));

/** The ☰ button that sits in a screen header and opens the menu. */
export function MenuButton({ onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.menuBtn} hitSlop={8} accessibilityRole="button" accessibilityLabel="Open menu">
      <Text style={styles.menuBtnText}>☰</Text>
    </Pressable>
  );
}

/**
 * items: [{ key, icon, label, tint, badge, active, danger, onPress }, { divider: true }, ...]
 */
export default function SideMenu({ visible, onClose, title = 'Menu', subtitle = 'Navigation', items = [] }) {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const slide = useRef(new Animated.Value(-PANEL_WIDTH)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) setMounted(true);
  }, [visible]);

  // Runs after the panel is on screen: slide in when `visible`, slide out (then unmount) when not.
  useEffect(() => {
    if (!mounted) return;
    Animated.parallel([
      Animated.timing(slide, { toValue: visible ? 0 : -PANEL_WIDTH, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(fade, { toValue: visible ? 1 : 0, duration: 220, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished && !visible) setMounted(false);
    });
  }, [visible, mounted, slide, fade]);

  if (!mounted) return null;

  // Close first, then run the action. (Opening another modal or an Alert while this one is still
  // closing can be ignored on iOS, so the action waits for the close animation to finish.)
  const handlePress = (item) => {
    onClose();
    if (item.onPress) setTimeout(item.onPress, 260);
  };

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: fade }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close menu" />
        </Animated.View>

        <Animated.View
          style={[
            styles.panel,
            { width: PANEL_WIDTH, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 12, transform: [{ translateX: slide }] },
          ]}
        >
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close menu">
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
          <View style={styles.headerRule} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
            {items.map((item, i) =>
              item.divider ? (
                <View key={`divider-${i}`} style={styles.divider} />
              ) : (
                <Pressable
                  key={item.key}
                  onPress={() => handlePress(item)}
                  style={({ pressed }) => [styles.row, item.active && styles.rowActive, pressed && styles.rowPressed]}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                >
                  <View style={[styles.iconBox, { backgroundColor: item.tint || 'rgba(148, 163, 184, 0.15)' }]}>
                    <Text style={styles.icon}>{item.icon}</Text>
                  </View>
                  <Text style={[styles.label, item.danger && styles.labelDanger]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  {item.badge !== undefined && item.badge !== null ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              )
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  menuBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  menuBtnText: { color: '#f8fafc', fontSize: 20, lineHeight: 22 },

  root: { flex: 1, flexDirection: 'row' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.6)' },
  panel: { position: 'absolute', top: 0, bottom: 0, left: 0, backgroundColor: '#0b1220', borderRightWidth: 1, borderRightColor: '#1e293b', paddingHorizontal: 20 },

  header: { flexDirection: 'row', alignItems: 'center', paddingBottom: 14 },
  title: { color: '#ffffff', fontSize: 26, fontWeight: 'bold' },
  subtitle: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: '#f8fafc', fontSize: 24 },
  headerRule: { height: 1, backgroundColor: '#1e293b', marginHorizontal: -20 },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 8, borderRadius: 14, marginVertical: 2 },
  rowActive: { backgroundColor: 'rgba(251, 191, 36, 0.10)' },
  rowPressed: { backgroundColor: 'rgba(148, 163, 184, 0.10)' },
  iconBox: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  icon: { fontSize: 20 },
  label: { flex: 1, color: '#f8fafc', fontSize: 16, fontWeight: '600' },
  labelDanger: { color: '#ef4444' },
  badge: { minWidth: 26, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: '#1e293b', alignItems: 'center', marginRight: 8 },
  badgeText: { color: '#fbbf24', fontSize: 12, fontWeight: 'bold' },
  chevron: { color: '#94a3b8', fontSize: 26, lineHeight: 28 },
  divider: { height: 1, backgroundColor: '#1e293b', marginVertical: 10 },
});