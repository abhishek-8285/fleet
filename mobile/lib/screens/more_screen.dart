import 'package:flutter/material.dart';
import 'package:mobile/screens/app_guide_screen.dart';
import 'package:mobile/screens/change_request_list_screen.dart';
import 'package:mobile/theme/design_system.dart';
import 'package:mobile/widgets/glass_container.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:mobile/core/services/feature_flag_service.dart';
import 'package:provider/provider.dart';

class MoreScreen extends StatelessWidget {
  const MoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppGradients.background,
        ),
        child: SafeArea(
          child: Column(
            children: [
              AppBar(
                title: const Text('More'),
                backgroundColor: Colors.transparent,
                elevation: 0,
                titleTextStyle: AppTextStyles.header,
                iconTheme: const IconThemeData(color: Colors.white),
              ),
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    GlassContainer(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const ChangeRequestListScreen()),
                        );
                      },
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.edit_document, color: Colors.white),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Change Requests',
                                  style: AppTextStyles.subHeader,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Update profile or documents',
                                  style: AppTextStyles.body,
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right, color: Colors.white),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    GlassContainer(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const AppGuideScreen()),
                        );
                      },
                      padding: const EdgeInsets.all(16),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.info_outline, color: Colors.white),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'About FleetFlow',
                                  style: AppTextStyles.subHeader,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Version info, features & help',
                                  style: AppTextStyles.body,
                                ),
                              ],
                            ),
                          ),
                          const Icon(Icons.chevron_right, color: Colors.white),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text('Feature Flags (Debug)', style: AppTextStyles.subHeader),
                    const SizedBox(height: 16),
                    Consumer<FeatureFlagService>(
                      builder: (context, flags, child) {
                        return Column(
                          children: [
                            _buildFeatureToggle(
                              'Fuel Fraud Detection',
                              flags.enableFuelFraudDetection,
                              (val) => flags.toggleFuelFraudDetection(),
                            ),
                            const SizedBox(height: 12),
                            _buildFeatureToggle(
                              'Hours of Service',
                              flags.enableHos,
                              (val) => flags.toggleHos(),
                            ),
                            const SizedBox(height: 12),
                            _buildFeatureToggle(
                              'Safety Scorecard',
                              flags.enableSafety,
                              (val) => flags.toggleSafety(),
                            ),
                            const SizedBox(height: 12),
                            _buildFeatureToggle(
                              'Proof of Delivery',
                              flags.enableProofOfDelivery,
                              (val) => flags.toggleProofOfDelivery(),
                            ),
                            const SizedBox(height: 12),
                            _buildFeatureToggle(
                              'Earnings & Payments',
                              flags.enableEarnings,
                              (val) => flags.toggleEarnings(),
                            ),
                            const SizedBox(height: 12),
                            _buildFeatureToggle(
                              'Compliance Center',
                              flags.enableCompliance,
                              (val) => flags.toggleCompliance(),
                            ),
                          ],
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFeatureToggle(String title, bool value, Function(bool) onChanged) {
    return GlassContainer(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: AppTextStyles.body),
          Switch(
            value: value,
            onChanged: onChanged,
            activeThumbColor: AppTheme.accent,
          ),
        ],
      ),
    );
  }
}

