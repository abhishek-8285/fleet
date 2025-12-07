import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/constants/app_constants.dart';
import 'package:mobile/data/repositories/mock_fleet_repository.dart';
import 'package:mobile/presentation/providers/fleet_view_model.dart';
import 'package:mobile/screens/home_screen.dart';
import 'package:provider/provider.dart';

void main() {
  Widget createHomeScreen() {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => FleetViewModel(MockFleetRepository())..loadDashboardData(),
        ),
      ],
      child: const MaterialApp(
        home: HomeScreen(),
      ),
    );
  }

  testWidgets('HomeScreen displays greeting and quick actions', (tester) async {
    await tester.pumpWidget(createHomeScreen());
    await tester.pumpAndSettle();

    expect(find.text(AppConstants.greeting), findsOneWidget);
    expect(find.text(AppConstants.quickActions), findsOneWidget);
    expect(find.text('Start Trip'), findsOneWidget);
  });
}
