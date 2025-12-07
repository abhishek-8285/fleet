import 'package:flutter/material.dart';
import 'package:mobile/core/constants/app_constants.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:mobile/theme/design_system.dart';
import 'package:mobile/widgets/glass_container.dart';

class AppGuideScreen extends StatelessWidget {
  const AppGuideScreen({super.key});

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
              // Header
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'About FleetFlow',
                      style: AppTextStyles.header,
                    ),
                  ],
                ),
              ),

              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    // App Info Card
                    Center(
                      child: Column(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: AppTheme.accent.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppTheme.accent.withValues(alpha: 0.3),
                                width: 2,
                              ),
                            ),
                            child: const Icon(
                              Icons.local_shipping,
                              size: 48,
                              color: AppTheme.accent,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            AppConstants.appName,
                            style: AppTextStyles.header.copyWith(fontSize: 24),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Version 2.0.0 (Premium)',
                            style: AppTextStyles.label,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    // What's New Section
                    Text('What\'s New', style: AppTextStyles.subHeader),
                    const SizedBox(height: 12),
                    GlassContainer(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        children: [
                          _buildFeatureItem(
                            icon: Icons.timelapse,
                            title: 'Duty Status Ring',
                            description: 'Track your remaining drive time with the new animated ring on the home screen.',
                          ),
                          const Divider(color: Colors.white24, height: 24),
                          _buildFeatureItem(
                            icon: Icons.wallet,
                            title: 'Digital Wallet',
                            description: 'Access your documents in a new 3D stack view. Tap to expand and view details.',
                          ),
                          const Divider(color: Colors.white24, height: 24),
                          _buildFeatureItem(
                            icon: Icons.school,
                            title: 'Driver Coaching',
                            description: 'Watch safety videos and track your learning progress directly in the app.',
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Help & Support
                    Text('Help & Support', style: AppTextStyles.subHeader),
                    const SizedBox(height: 12),
                    GlassContainer(
                      padding: EdgeInsets.zero,
                      child: Column(
                        children: [
                          _buildMenuItem(
                            icon: Icons.book,
                            title: 'User Guide',
                            onTap: () {},
                          ),
                          const Divider(color: Colors.white24, height: 1),
                          _buildMenuItem(
                            icon: Icons.support_agent,
                            title: 'Contact Support',
                            onTap: () {},
                          ),
                          const Divider(color: Colors.white24, height: 1),
                          _buildMenuItem(
                            icon: Icons.privacy_tip,
                            title: 'Privacy Policy',
                            onTap: () {},
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 32),
                    Center(
                      child: Text(
                        '© 2024 FleetFlow Inc. All rights reserved.',
                        style: AppTextStyles.label.copyWith(
                          color: Colors.white.withValues(alpha: 0.3),
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
    );
  }

  Widget _buildFeatureItem({
    required IconData icon,
    required String title,
    required String description,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppTheme.accent, size: 20),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: AppTextStyles.body.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: AppTextStyles.label.copyWith(
                  color: Colors.white.withValues(alpha: 0.7),
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMenuItem({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return ListTile(
      onTap: onTap,
      leading: Icon(icon, color: Colors.white70),
      title: Text(title, style: AppTextStyles.body),
      trailing: const Icon(Icons.chevron_right, color: Colors.white38),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
    );
  }
}
