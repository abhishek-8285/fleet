import 'package:flutter/material.dart';
import 'package:mobile/domain/entities/fuel_monitoring.dart';
import 'package:mobile/presentation/providers/fleet_view_model.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:mobile/theme/design_system.dart';
import 'package:mobile/widgets/glass_container.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

class FuelMonitoringScreen extends StatelessWidget {
  const FuelMonitoringScreen({super.key});

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
                title: const Text('Fuel Monitoring'),
                backgroundColor: Colors.transparent,
                elevation: 0,
                titleTextStyle: AppTextStyles.header,
                iconTheme: const IconThemeData(color: Colors.white),
              ),
              Expanded(
                child: Consumer<FleetViewModel>(
                  builder: (context, viewModel, child) {
                    if (viewModel.isLoading) {
                      return const Center(child: CircularProgressIndicator());
                    }

                    return RefreshIndicator(
                      onRefresh: viewModel.loadDashboardData,
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildFuelGauge(),
                            const SizedBox(height: 24),
                            if (viewModel.fuelAlerts.isNotEmpty) ...[
                              Text(
                                'ALERTS',
                                style: AppTextStyles.label,
                              ),
                              const SizedBox(height: 8),
                              ...viewModel.fuelAlerts.map((alert) => _buildAlertCard(alert)),
                              const SizedBox(height: 24),
                            ],
                            Text(
                              'RECENT TRANSACTIONS',
                              style: AppTextStyles.label,
                            ),
                            const SizedBox(height: 8),
                            ...viewModel.fuelTransactions.map((tx) => _buildTransactionCard(tx)),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFuelGauge() {
    return GlassContainer(
      hasGlow: true,
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          SizedBox(
            height: 150,
            width: 150,
            child: Stack(
              fit: StackFit.expand,
              children: [
                CircularProgressIndicator(
                  value: 0.75,
                  strokeWidth: 12,
                  backgroundColor: Colors.white.withValues(alpha: 0.1),
                  valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                ),
                Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.local_gas_station,
                          color: AppTheme.primary, size: 32),
                      const SizedBox(height: 4),
                      Text(
                        '75%',
                        style: AppTextStyles.header.copyWith(fontSize: 32),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Range: 450 km',
            style: AppTextStyles.subHeader,
          ),
        ],
      ),
    );
  }

  Widget _buildAlertCard(FuelAlert alert) {
    return GlassContainer(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.warning_amber_rounded, color: AppTheme.error, size: 28),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  alert.title,
                  style: AppTextStyles.subHeader.copyWith(
                    color: AppTheme.error,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  alert.description,
                  style: AppTextStyles.body,
                ),
                const SizedBox(height: 8),
                Text(
                  DateFormat('MMM d, h:mm a').format(alert.timestamp),
                  style: AppTextStyles.label,
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.error,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: const Text('REPORT ISSUE'),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionCard(FuelTransaction tx) {
    return GlassContainer(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: tx.isSuspicious
                  ? AppTheme.error.withValues(alpha: 0.1)
                  : AppTheme.success.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              tx.isSuspicious ? Icons.warning : Icons.check_circle,
              color: tx.isSuspicious ? AppTheme.error : AppTheme.success,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tx.stationName,
                  style: AppTextStyles.subHeader.copyWith(fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text(
                  DateFormat('MMM d, h:mm a').format(tx.timestamp),
                  style: AppTextStyles.label,
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${tx.liters} L',
                style: AppTextStyles.subHeader.copyWith(fontSize: 16),
              ),
              const SizedBox(height: 4),
              Text(
                '₹${tx.cost.toStringAsFixed(0)}',
                style: AppTextStyles.body,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

