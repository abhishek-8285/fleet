import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';
import 'package:mobile/core/services/feature_flag_service.dart';
import 'package:mobile/presentation/providers/fleet_view_model.dart';
import 'package:mobile/data/repositories/mock_fleet_repository.dart';
import 'package:provider/provider.dart';

void main() {
  testWidgets('Navigation between tabs works', (WidgetTester tester) async {
    // Build our app and trigger a frame.
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => FeatureFlagService()),
          ChangeNotifierProvider(
            create: (_) => FleetViewModel(MockFleetRepository()),
          ),
        ],
        child: const MaterialApp(
          home: MainScreen(),
        ),
      ),
    );

    // Verify we start on Home (India Dashboard or US Home depending on default flag)
    // Default is India Mode = true.
    expect(find.text('Good Morning,'), findsOneWidget); 

    // Tap on HOS tab
    await tester.tap(find.byIcon(Icons.access_time_outlined));
    await tester.pumpAndSettle();
    expect(find.text('Hours of Service'), findsOneWidget);

    // Tap on Documents tab
    await tester.tap(find.byIcon(Icons.folder_outlined));
    await tester.pumpAndSettle();
    expect(find.text('Digital Wallet'), findsOneWidget);

    // Tap on Safety tab
    await tester.tap(find.byIcon(Icons.shield_outlined));
    await tester.pumpAndSettle();
    expect(find.text('Driver Scorecard'), findsOneWidget);
  });
}
