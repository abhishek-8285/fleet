import 'package:flutter/material.dart';
import 'package:mobile/core/constants/app_constants.dart';
import 'package:mobile/presentation/providers/fleet_view_model.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:mobile/widgets/duty_status_circle.dart';
import 'package:mobile/widgets/quick_action_card.dart';
import 'package:provider/provider.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      body: Consumer<FleetViewModel>(
        builder: (context, viewModel, child) {
          if (viewModel.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }
          return SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            AppConstants.greeting,
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  color: AppTheme.textSecondary,
                                ),
                          ),
                          Text(
                            AppConstants.driverName,
                            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.wb_sunny, color: Colors.orange, size: 20),
                              const SizedBox(width: 4),
                              Text(
                                '24°C',
                                style: Theme.of(context).textTheme.bodyMedium,
                              ),
                            ],
                          ),
                          Text(
                            AppConstants.vehicleId,
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: AppTheme.accent,
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Duty Status Circle
                  DutyStatusCircle(
                    status: viewModel.dutyStatus,
                    timeRemaining: viewModel.remainingDriveTime,
                    progress: 0.75,
                  ),
                  const SizedBox(height: 32),

                  // Quick Actions
                  Text(
                    AppConstants.quickActions,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    childAspectRatio: 1.5,
                    children: [
                      QuickActionCard(
                        label: 'Start Trip',
                        icon: Icons.play_arrow,
                        color: AppTheme.success,
                        onTap: () {},
                      ),
                      QuickActionCard(
                        label: 'DVIR',
                        icon: Icons.build,
                        onTap: () {},
                      ),
                      QuickActionCard(
                        label: 'Fuel',
                        icon: Icons.local_gas_station,
                        onTap: () {},
                      ),
                      QuickActionCard(
                        label: 'Inbox',
                        icon: Icons.mail,
                        onTap: () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Recent Activity
                  Text(
                    AppConstants.recentActivity,
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),
                  Card(
                    child: ListTile(
                      leading: const CircleAvatar(
                        backgroundColor: AppTheme.primary,
                        child: Icon(Icons.check, color: AppTheme.success),
                      ),
                      title: const Text('Trip #1023 completed'),
                      subtitle: const Text('45km • 2 hours ago'),
                      trailing: const Icon(Icons.chevron_right),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
