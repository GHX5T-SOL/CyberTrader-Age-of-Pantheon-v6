import { View, Text, StyleSheet } from 'react-native';
import { palette } from '@brand/color/tokens';

export default function BootScreen() {
  // Phase 0 placeholder — replaced in Phase 1 with real intro cinematic + boot sequence.
  return (
    <View style={styles.container}>
      <Text style={styles.line}>Ag3nt_0S//pIRAT3</Text>
      <Text style={styles.line}>BIOS_0X3F .......... ok</Text>
      <Text style={styles.line}>rootfs mount /scratch .......... ok</Text>
      <Text style={styles.line}>signal integrity .......... 78%</Text>
      <Text style={styles.line}>eAgent cloak .......... on (unstable)</Text>
      <Text style={styles.cursor}>_</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.bg.void,
    padding: 24,
    justifyContent: 'center',
  },
  line: {
    color: palette.accent.cyan,
    fontFamily: 'Menlo',
    fontSize: 14,
    marginVertical: 4,
  },
  cursor: {
    color: palette.accent.acidGreen,
    fontFamily: 'Menlo',
    fontSize: 16,
    marginTop: 12,
  },
});
