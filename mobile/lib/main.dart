import 'package:flutter/material.dart';
import 'package:mobile/core/constants/app_constants.dart';
import 'package:mobile/core/services/feature_flag_service.dart';
import 'package:mobile/data/repositories/api_fleet_repository.dart';
import 'package:mobile/presentation/providers/fleet_view_model.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:mobile/theme/design_system.dart';
import 'package:mobile/screens/home_dashboard_india.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:mobile/l10n/generated/app_localizations.dart';
import 'package:mobile/screens/home_screen.dart';
import 'package:mobile/screens/hos_screen.dart';
import 'package:mobile/screens/documents_screen.dart';
import 'package:mobile/screens/safety_screen.dart';
import 'package:mobile/screens/more_screen.dart';
import 'package:mobile/screens/login_screen.dart';
import 'package:mobile/data/repositories/mock_change_request_repository.dart';
import 'package:mobile/presentation/providers/change_request_provider.dart';
import 'package:mobile/presentation/providers/language_provider.dart';
import 'package:mobile/presentation/providers/theme_provider.dart';
import 'package:provider/provider.dart';

void main() {
  runApp(const FleetFlowApp());
}

class FleetFlowApp extends StatelessWidget {
  const FleetFlowApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => FeatureFlagService()),
        ChangeNotifierProvider(
          create: (_) => FleetViewModel(ApiFleetRepository())..loadDashboardData(),
        ),
        ChangeNotifierProvider(
          create: (_) => ChangeRequestProvider(MockChangeRequestRepository()),
        ),
        ChangeNotifierProvider(create: (_) => LanguageProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: Consumer2<LanguageProvider, ThemeProvider>(
        builder: (context, languageProvider, themeProvider, child) {
          return MaterialApp(
            title: AppConstants.appName,
            theme: themeProvider.themeData,
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            supportedLocales: const [
              Locale('en'), // English
              Locale('hi'), // Hindi
            ],
            debugShowCheckedModeBanner: false,
            locale: languageProvider.locale,
            home: const LoginScreen(),
          );
        },
      ),
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    final featureFlags = Provider.of<FeatureFlagService>(context);

    final List<Widget> screens = [
      featureFlags.isIndiaMode ? const HomeDashboardIndia() : const HomeScreen(),
      if (featureFlags.enableHos) const HosScreen(),
      if (featureFlags.enableCompliance) const DocumentsScreen(),
      if (featureFlags.enableSafety) const SafetyScreen(),
      const MoreScreen(),
    ];

    return Scaffold(
      body: screens[_selectedIndex],
      bottomNavigationBar: NavigationBarTheme(
        data: NavigationBarThemeData(
          backgroundColor: const Color(0xFF0F172A), // Dark Navy
          indicatorColor: AppTheme.accent.withValues(alpha: 0.2),
          labelTextStyle: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return AppTextStyles.label.copyWith(
                color: AppTheme.accent,
                fontWeight: FontWeight.bold,
              );
            }
            return AppTextStyles.label.copyWith(
              color: Colors.white.withValues(alpha: 0.5),
            );
          }),
          iconTheme: WidgetStateProperty.resolveWith((states) {
            if (states.contains(WidgetState.selected)) {
              return const IconThemeData(color: AppTheme.accent);
            }
            return IconThemeData(color: Colors.white.withValues(alpha: 0.5));
          }),
        ),
        child: NavigationBar(
          selectedIndex: _selectedIndex,
          onDestinationSelected: (index) {
            setState(() {
              _selectedIndex = index;
            });
          },
          destinations: [
            NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home),
              label: AppConstants.navHome,
            ),
            if (featureFlags.enableHos)
              NavigationDestination(
                icon: Icon(Icons.access_time_outlined),
                selectedIcon: Icon(Icons.access_time),
                label: AppConstants.navHos,
              ),
            if (featureFlags.enableCompliance)
              NavigationDestination(
                icon: Icon(Icons.folder_outlined),
                selectedIcon: Icon(Icons.folder),
                label: AppLocalizations.of(context)!.compliance,
              ),
            if (featureFlags.enableSafety)
              NavigationDestination(
                icon: Icon(Icons.shield_outlined),
                selectedIcon: Icon(Icons.shield),
                label: AppConstants.navSafety,
              ),
            NavigationDestination(
              icon: Icon(Icons.more_horiz_outlined),
              selectedIcon: Icon(Icons.more_horiz),
              label: AppConstants.navMore,
            ),
          ],
        ),
      ),
    );
  }
}

