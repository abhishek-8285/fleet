import 'package:flutter/material.dart';
import 'package:mobile/theme/app_theme.dart';

class DutyStatusCircle extends StatelessWidget {
  final String status;
  final String timeRemaining;
  final double progress;

  const DutyStatusCircle({
    super.key,
    required this.status,
    required this.timeRemaining,
    required this.progress,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SizedBox(
        width: 250,
        height: 250,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // Background Circle
            SizedBox(
              width: 250,
              height: 250,
              child: CircularProgressIndicator(
                value: 1.0,
                strokeWidth: 20,
                color: AppTheme.surface,
              ),
            ),
            // Progress Circle
            SizedBox(
              width: 250,
              height: 250,
              child: CircularProgressIndicator(
                value: progress,
                strokeWidth: 20,
                color: AppTheme.success,
                strokeCap: StrokeCap.round,
              ),
            ),
            // Text Content
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  timeRemaining,
                  style: Theme.of(context).textTheme.displayMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  status,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: AppTheme.accent,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  'REMAINING',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
