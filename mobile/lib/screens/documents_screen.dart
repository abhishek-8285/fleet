import 'package:flutter/material.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:mobile/theme/design_system.dart';
import 'package:mobile/widgets/document_stack.dart';
import 'package:mobile/widgets/glass_container.dart';
import 'package:mobile/l10n/generated/app_localizations.dart';

class DocumentsScreen extends StatelessWidget {
  const DocumentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    final List<DocumentItem> documents = [
      DocumentItem(
        title: l10n.dlStatus,
        subtitle: 'DL-KA-01-2023-0012345',
        expiryDate: '12/2028',
        icon: Icons.badge,
        color: Colors.blue.shade800,
      ),
      DocumentItem(
        title: l10n.rcStatus,
        subtitle: 'KA-01-HH-1234',
        expiryDate: '08/2026',
        icon: Icons.directions_car,
        color: Colors.teal.shade800,
      ),
      DocumentItem(
        title: l10n.insurance,
        subtitle: 'POL-987654321',
        expiryDate: '01/2026',
        icon: Icons.security,
        color: Colors.purple.shade800,
      ),
      DocumentItem(
        title: l10n.puc,
        subtitle: 'NP-IND-2024-555',
        expiryDate: '03/2025',
        icon: Icons.cloud_queue,
        color: Colors.orange.shade900,
      ),
    ];

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppGradients.background,
        ),
        child: SafeArea(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(l10n.compliance, style: AppTextStyles.header),
                    IconButton(
                      icon: const Icon(Icons.add_circle_outline, color: Colors.white),
                      onPressed: () {},
                    ),
                  ],
                ),
              ),

              // DigiLocker Connect Card
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [Colors.blue.shade800, Colors.blue.shade600],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.blue.withValues(alpha: 0.3),
                        blurRadius: 8,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.cloud_done, color: Colors.white, size: 24),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              l10n.digiLockerConnect,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Fetch documents automatically',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios, color: Colors.white70, size: 16),
                    ],
                  ),
                ),
              ),

              // Document Stack (Apple Wallet Style)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 16),
                child: DocumentStack(documents: documents),
              ),

              // Recent Actions / Info
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(l10n.weeklySummary, style: AppTextStyles.subHeader), // Reusing string for section header
                      const SizedBox(height: 16),
                      GlassContainer(
                        onTap: () {},
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            const Icon(Icons.share, color: AppTheme.accent),
                            const SizedBox(width: 16),
                            Text('Share All Documents', style: AppTextStyles.body),
                            const Spacer(),
                            const Icon(Icons.chevron_right, color: Colors.white54),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      GlassContainer(
                        onTap: () {},
                        padding: const EdgeInsets.all(16),
                        child: Row(
                          children: [
                            const Icon(Icons.history, color: Colors.orange),
                            const SizedBox(width: 16),
                            Text('View Expired Docs', style: AppTextStyles.body),
                            const Spacer(),
                            const Icon(Icons.chevron_right, color: Colors.white54),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

