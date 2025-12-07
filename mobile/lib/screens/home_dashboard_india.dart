import 'package:flutter/material.dart';
import 'package:mobile/presentation/providers/fleet_view_model.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:mobile/theme/design_system.dart';
import 'package:mobile/core/services/feature_flag_service.dart';
import 'package:mobile/presentation/providers/language_provider.dart';
import 'package:mobile/screens/proof_of_delivery_screen.dart';
import 'package:mobile/screens/earnings_screen.dart';
import 'package:mobile/widgets/duty_status_ring.dart';
import 'package:mobile/widgets/glass_container.dart';
import 'package:provider/provider.dart';
import 'package:mobile/l10n/generated/app_localizations.dart';

class HomeDashboardIndia extends StatelessWidget {
  const HomeDashboardIndia({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppGradients.background,
        ),
        child: SafeArea(
          child: Consumer<FleetViewModel>(
            builder: (context, viewModel, child) {
              if (viewModel.isLoading) {
                return const Center(child: CircularProgressIndicator());
              }

              return SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Header
                    GlassContainer(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: Row(
                        children: [
                          const CircleAvatar(
                            backgroundImage: NetworkImage('https://i.pravatar.cc/150?img=11'),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Good Morning,',
                                style: AppTextStyles.label,
                              ),
                              Text(
                                'Rajesh Kumar',
                                style: AppTextStyles.subHeader,
                              ),
                            ],
                          ),
                          const Spacer(),
                          // Language Switcher
                          GestureDetector(
                            onTap: () {
                              Provider.of<LanguageProvider>(context, listen: false).toggleLanguage();
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppTheme.accent.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(color: AppTheme.accent.withValues(alpha: 0.5)),
                              ),
                              child: Text(
                                Localizations.localeOf(context).languageCode == 'en' ? '🇮🇳 HI' : '🇺🇸 EN',
                                style: AppTextStyles.label.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Row(
                              children: [
                                const Icon(Icons.local_shipping, color: Colors.white, size: 16),
                                const SizedBox(width: 4),
                                Text(
                                  'KA-01-HH-1234',
                                  style: AppTextStyles.label.copyWith(fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Hero Section: Duty Status Ring
                    const Center(
                      child: DutyStatusRing(
                        status: 'ON DUTY', // Keeping status code as is for logic, but display should ideally be localized inside widget or passed here
                        remainingTime: '04:12',
                        progress: 0.65,
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Quick Actions Grid
                    Text('Quick Actions', style: AppTextStyles.subHeader),
                    const SizedBox(height: 16),
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 1.5,
                      children: [
                        _buildActionCard(
                          icon: Icons.play_arrow,
                          label: AppLocalizations.of(context)!.startTrip,
                          color: AppTheme.success,
                          onTap: () {},
                        ),
                        if (Provider.of<FeatureFlagService>(context).enableProofOfDelivery)
                          _buildActionCard(
                            label: 'Complete Delivery',
                            icon: Icons.check_circle_outline,
                            color: AppTheme.success,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => const ProofOfDeliveryScreen(),
                                ),
                              );
                            },
                          ),
                        if (Provider.of<FeatureFlagService>(context).enableFuelFraudDetection)
                          _buildActionCard(
                            icon: Icons.local_gas_station,
                            label: AppLocalizations.of(context)!.logFuel,
                            color: Colors.orange,
                            onTap: () {},
                          ),
                        if (Provider.of<FeatureFlagService>(context).enableEarnings)
                          _buildActionCard(
                            icon: Icons.currency_rupee,
                            label: AppLocalizations.of(context)!.earnings,
                            color: Colors.purple,
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (context) => const EarningsScreen(),
                                ),
                              );
                            },
                          ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildActionCard({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return GlassContainer(
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: AppTextStyles.body.copyWith(
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

