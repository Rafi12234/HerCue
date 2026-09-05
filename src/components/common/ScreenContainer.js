import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { layout } from '../../theme/spacing';
import { AmbientBackground } from './AmbientBackground';

/**
 * Standard screen frame: ambient background, safe-area aware padding and
 * enough bottom clearance for the floating tab bar.
 */
export function ScreenContainer({
  children,
  tone = 'home',
  scroll = true,
  scrollRef,
  contentContainerStyle,
  style,
  header = null,
  ...scrollProps
}) {
  const insets = useSafeAreaInsets();

  const padding = {
    paddingTop: insets.top + 8,
    paddingBottom: layout.tabBarClearance + insets.bottom,
    paddingHorizontal: layout.screenPadding,
  };

  if (!scroll) {
    return (
      <View style={[styles.root, style]}>
        <AmbientBackground tone={tone} />
        {header}
        <View style={[styles.staticContent, padding, contentContainerStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.root, style]}>
      <AmbientBackground tone={tone} />
      {header}
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[padding, contentContainerStyle]}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  staticContent: {
    flex: 1,
  },
});
