import 'package:flutter/material.dart';
import 'package:mobile/presentation/providers/fleet_view_model.dart';
import 'package:mobile/screens/learning_screen.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:mobile/theme/design_system.dart';
import 'package:mobile/widgets/glass_container.dart';
import 'package:mobile/widgets/safety_event_card.dart';
import 'package:provider/provider.dart';
import 'package:mobile/l10n/generated/app_localizations.dart';

class SafetyScreen extends StatelessWidget {
  const SafetyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppGradients.background,
        ),
        child: Consumer<FleetViewModel>(
          builder: (context, viewModel, child) {
            return SafeArea(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    // Header
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        l10n.safety,
                        style: AppTextStyles.header,
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Hero Score
                    GlassContainer(
                      hasGlow: true,
                      padding: const EdgeInsets.all(24),
                      borderRadius: BorderRadius.circular(24),
                      child: Column(
                        children: [
                          Text(
                            l10n.safetyScore,
                            style: AppTextStyles.label.copyWith(
                              letterSpacing: 1.5,
                              fontSize: 14,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            '${viewModel.safetyScore}',
                            style: AppTextStyles.header.copyWith(
                              fontSize: 64,
                              color: AppTheme.success,
                              height: 1,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.success.withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: AppTheme.success.withValues(alpha: 0.3),
                              ),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.arrow_upward,
                                    color: AppTheme.success, size: 16),
                                const SizedBox(width: 8),
                                Text(
                                  '2 pts since last week', // TODO: Localize dynamic string
                                  style: AppTextStyles.body.copyWith(
                                    color: AppTheme.success,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // Events List
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        l10n.safetyEvents,
                        style: AppTextStyles.subHeader,
                      ),
                    ),
                    const SizedBox(height: 16),
                    ...viewModel.safetyEvents.map((event) => Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: SafetyEventCard(
                            title: event.title,
                            time: 'Today • 02:15 PM', // TODO: Format timestamp
                            details: event.details,
                            icon: event.icon,
                            color: event.severityColor,
                          ),
                        )),
                    const SizedBox(height: 32),

                    // Coaching
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text(
                        l10n.coaching,
                        style: AppTextStyles.subHeader,
                      ),
                    ),
                    const SizedBox(height: 16),
                    GlassContainer(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => const LearningScreen()),
                        );
                      },
                      padding: EdgeInsets.zero,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            height: 150,
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: Colors.grey[900],
                              borderRadius: const BorderRadius.vertical(
                                top: Radius.circular(16),
                              ),
                            ),
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                Icon(Icons.play_circle_fill,
                                    size: 64, color: Colors.white.withValues(alpha: 0.8)),
                              ],
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(16.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Maintaining Safe Distance',
                                  style: AppTextStyles.subHeader.copyWith(fontSize: 16),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Recommended based on your recent harsh braking events.',
                                  style: AppTextStyles.body,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
