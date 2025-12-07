import 'package:flutter/material.dart';
import 'package:mobile/theme/app_theme.dart';

class NavigationBottomBar extends StatelessWidget {
  final String eta;
  final String remainingDistance;
  final VoidCallback onSosPressed;

  const NavigationBottomBar({
    super.key,
    required this.eta,
    required this.remainingDistance,
    required this.onSosPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24.0),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  eta,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.success,
                      ),
                ),
                Text(
                  remainingDistance,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                        color: AppTheme.textSecondary,
                      ),
                ),
              ],
            ),
            FloatingActionButton.large(
              onPressed: onSosPressed,
              backgroundColor: AppTheme.error,
              child: const Text(
                'SOS',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  fontSize: 20,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
