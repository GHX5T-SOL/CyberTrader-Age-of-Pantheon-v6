import { View, Text, ScrollView } from 'react-native';
import { useTheme } from '../theme/colors';

export default function PrivacyPolicy() {
  const theme = useTheme();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={{ padding: 20 }}>
      <Text style={{ color: theme.primary, fontSize: 24, marginBottom: 12 }}>Privacy Policy</Text>
      <Text style={{ color: theme.secondary, fontSize: 14, lineHeight: 20 }}>
        {/* Placeholder privacy policy text. Replace with final copy before store submission. */}
        This app collects and processes user data in accordance with applicable laws and regulations. No personal data is shared with third parties without explicit consent. The app operates under a LocalAuthority model with no wallet integration or real‑money transactions. All gameplay actions are simulated.
      </Text>
    </ScrollView>
  );
}
