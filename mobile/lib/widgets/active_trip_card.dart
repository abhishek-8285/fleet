import 'package:flutter/material.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:mobile/theme/design_system.dart';
import 'package:mobile/widgets/glass_container.dart';

class ActiveTripCard extends StatelessWidget {
  final String tripId;
  final String pickupLocation;
  final String dropLocation;
  final String status;

  const ActiveTripCard({
    super.key,
    required this.tripId,
    required this.pickupLocation,
    required this.dropLocation,
    required this.status,
  });

  @override
  Widget build(BuildContext context) {
    return GlassContainer(
      hasGlow: true,
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Current Trip',
                    style: AppTextStyles.label,
                  ),
                  Text(
                    '#$tripId',
                    style: AppTextStyles.header.copyWith(fontSize: 20),
                  ),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  gradient: AppGradients.primaryAccent,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: AppTheme.accent.withValues(alpha: 0.4),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Text(
                  status,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Stack(
            children: [
              Positioned(
                left: 9,
                top: 24,
                bottom: 24,
                child: Container(
                  width: 2,
                  color: Colors.white.withValues(alpha: 0.1),
                ),
              ),
              Column(
                children: [
                  _buildLocationRow(
                    context,
                    Icons.circle,
                    AppTheme.accent,
                    'Pickup',
                    pickupLocation,
                    isFirst: true,
                  ),
                  const SizedBox(height: 24),
                  _buildLocationRow(
                    context,
                    Icons.location_on,
                    AppTheme.success,
                    'Drop',
                    dropLocation,
                    isLast: true,
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLocationRow(
    BuildContext context,
    IconData icon,
    Color iconColor,
    String label,
    String value, {
    bool isFirst = false,
    bool isLast = false,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.1),
            shape: BoxShape.circle,
            border: Border.all(
              color: iconColor.withValues(alpha: 0.5),
              width: 1,
            ),
          ),
          child: Icon(icon, color: iconColor, size: 12),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: AppTextStyles.label,
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: AppTextStyles.body.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

