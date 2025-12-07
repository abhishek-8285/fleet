import 'package:flutter/material.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:mobile/theme/design_system.dart';
import 'package:mobile/widgets/glass_container.dart';

class HosTimerCard extends StatelessWidget {
  final String label;
  final String time;
  final double progress;
  final Color? color;

  const HosTimerCard({
    super.key,
    required this.label,
    required this.time,
    required this.progress,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return GlassContainer(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          SizedBox(
            height: 60,
            width: 60,
            child: Stack(
              alignment: Alignment.center,
              children: [
                CircularProgressIndicator(
                  value: progress,
                  strokeWidth: 6,
                  backgroundColor: Colors.white.withValues(alpha: 0.1),
                  color: color ?? AppTheme.success,
                ),
                Text(
                  time,
                  style: AppTextStyles.body.copyWith(
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: AppTextStyles.label.copyWith(fontSize: 10),
          ),
        ],
      ),
    );
  }
}

