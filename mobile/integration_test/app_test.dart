import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('end-to-end test', () {
    testWidgets('verify app startup and navigation', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Verify Home Screen
      // Verify Home Screen (India Mode)
      expect(find.text('Good Morning,'), findsOneWidget);
      expect(find.text('Start Trip'), findsOneWidget);

      // Navigate to HOS
      await tester.tap(find.byIcon(Icons.access_time_outlined));
      await tester.pumpAndSettle();
      expect(find.text('Hours of Service'), findsOneWidget);

      // Navigate to Documents
      await tester.tap(find.byIcon(Icons.folder_outlined));
      await tester.pumpAndSettle();
      expect(find.text('Digital Wallet'), findsOneWidget);

      // Navigate to Safety
      await tester.tap(find.byIcon(Icons.shield_outlined));
      await tester.pumpAndSettle();
      expect(find.text('Driver Scorecard'), findsOneWidget);
    });
  });
}
