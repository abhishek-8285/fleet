import 'package:flutter/material.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:mobile/theme/design_system.dart';
import 'package:mobile/widgets/glass_container.dart';
import 'package:mobile/widgets/hos_chart.dart';
import 'package:mobile/widgets/hos_timer_card.dart';
import 'package:mobile/l10n/generated/app_localizations.dart';
import 'package:intl/intl.dart';

class HosScreen extends StatelessWidget {
  const HosScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final dateStr = DateFormat('MMM d').format(DateTime.now());

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppGradients.background,
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Text(
                  l10n.hoursOfService,
                  style: AppTextStyles.header,
                ),
                const SizedBox(height: 16),

                // Date Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.chevron_left, color: Colors.white),
                      onPressed: () {},
                    ),
                    Text(
                      'Today, $dateStr',
                      style: AppTextStyles.subHeader,
                    ),
                    IconButton(
                      icon: const Icon(Icons.chevron_right, color: Colors.white),
                      onPressed: () {},
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Chart
                const GlassContainer(
                  padding: EdgeInsets.all(16),
                  child: HosChart(),
                ),
                const SizedBox(height: 24),

                // Timers
                Row(
                  children: [
                    Expanded(
                      child: HosTimerCard(
                        label: l10n.breakTime,
                        time: '07:48',
                        progress: 0.8,
                        color: AppTheme.success,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: HosTimerCard(
                        label: l10n.driveTime,
                        time: '04:12',
                        progress: 0.4,
                        color: AppTheme.accent,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: HosTimerCard(
                        label: l10n.shiftTime,
                        time: '06:30',
                        progress: 0.6,
                        color: Colors.orange,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: HosTimerCard(
                        label: l10n.cycleTime,
                        time: '34:00',
                        progress: 0.5,
                        color: AppTheme.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 32),

                // Certify Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.edit),
                    label: Text(l10n.certifyLogs),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.accent,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                
                // Violations
                GlassContainer(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      const Icon(Icons.check_circle, color: AppTheme.success),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Text(
                          l10n.noViolations,
                          style: AppTextStyles.body.copyWith(
                            color: AppTheme.success,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

