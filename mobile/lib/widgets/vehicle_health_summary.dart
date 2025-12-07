import 'package:flutter/material.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:mobile/theme/design_system.dart';
import 'package:mobile/widgets/glass_container.dart';

class VehicleHealthSummary extends StatelessWidget {
  final double fuelLevel;
  final bool isPucValid;
  final bool isInsuranceValid;
  final VoidCallback? onFuelTap;

  const VehicleHealthSummary({
    super.key,
    required this.fuelLevel,
    required this.isPucValid,
    required this.isInsuranceValid,
    this.onFuelTap,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: GlassContainer(
            onTap: onFuelTap,
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                SizedBox(
                  height: 48,
                  width: 48,
                  child: Stack(
                    children: [
                      CircularProgressIndicator(
                        value: fuelLevel,
                        backgroundColor: Colors.white.withValues(alpha: 0.1),
                        color: fuelLevel > 0.2 ? AppTheme.success : AppTheme.error,
                        strokeWidth: 4,
                      ),
                      Center(
                        child: Icon(
                          Icons.local_gas_station,
                          color: fuelLevel > 0.2 ? AppTheme.success : AppTheme.error,
                          size: 20,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Text('Fuel', style: AppTextStyles.label),
                const SizedBox(height: 4),
                Text(
                  '${(fuelLevel * 100).toInt()}%',
                  style: AppTextStyles.body.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatusCard(
            'PUC',
            isPucValid ? 'Valid' : 'Expired',
            Icons.verified_user,
            isPucValid ? AppTheme.success : AppTheme.error,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatusCard(
            'Insurance',
            isInsuranceValid ? 'Valid' : 'Expiring',
            Icons.security,
            isInsuranceValid ? AppTheme.success : Colors.orange,
          ),
        ),
      ],
    );
  }

  Widget _buildStatusCard(String label, String value, IconData icon, Color color) {
    return GlassContainer(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 12),
          Text(label, style: AppTextStyles.label),
          const SizedBox(height: 4),
          Text(
            value,
            style: AppTextStyles.body.copyWith(
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

