import 'package:flutter/material.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:mobile/theme/design_system.dart';
import 'package:mobile/widgets/glass_container.dart';

class LearningScreen extends StatelessWidget {
  const LearningScreen({super.key});

  @override
  Widget build(BuildContext context) {
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
                  children: [
                    IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Driver Coaching',
                      style: AppTextStyles.header,
                    ),
                  ],
                ),
              ),

              // Hero Course
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: GlassContainer(
                  padding: EdgeInsets.zero,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        height: 180,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.5),
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(16),
                          ),
                          image: const DecorationImage(
                            image: NetworkImage('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1000&auto=format&fit=crop'),
                            fit: BoxFit.cover,
                            opacity: 0.6,
                          ),
                        ),
                        child: Center(
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.2),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.play_arrow, color: Colors.white, size: 40),
                          ),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTheme.accent.withValues(alpha: 0.2),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'RECOMMENDED',
                                style: AppTextStyles.label.copyWith(
                                  color: AppTheme.accent,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Defensive Driving: Highway Safety',
                              style: AppTextStyles.subHeader,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Learn how to maintain safe following distances and anticipate hazards.',
                              style: AppTextStyles.body.copyWith(
                                color: Colors.white.withValues(alpha: 0.7),
                              ),
                            ),
                            const SizedBox(height: 16),
                            LinearProgressIndicator(
                              value: 0.0,
                              backgroundColor: Colors.white.withValues(alpha: 0.1),
                              valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.accent),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '0% Completed • 15 mins',
                              style: AppTextStyles.label,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 24),

              // Course List
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Text('All Courses', style: AppTextStyles.subHeader),
              ),
              const SizedBox(height: 12),
              
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    _buildCourseItem(
                      title: 'Pre-Trip Inspection Guide',
                      duration: '10 mins',
                      progress: 1.0,
                      isLocked: false,
                    ),
                    _buildCourseItem(
                      title: 'Fuel Efficiency Masterclass',
                      duration: '25 mins',
                      progress: 0.45,
                      isLocked: false,
                    ),
                    _buildCourseItem(
                      title: 'Night Driving Safety',
                      duration: '12 mins',
                      progress: 0.0,
                      isLocked: true,
                    ),
                    _buildCourseItem(
                      title: 'Handling Hazardous Materials',
                      duration: '30 mins',
                      progress: 0.0,
                      isLocked: true,
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

  Widget _buildCourseItem({
    required String title,
    required String duration,
    required double progress,
    required bool isLocked,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: GlassContainer(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Icon(
                isLocked ? Icons.lock : (progress == 1.0 ? Icons.check_circle : Icons.play_circle_outline),
                color: isLocked ? Colors.white38 : (progress == 1.0 ? AppTheme.success : Colors.white),
                size: 28,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTextStyles.body.copyWith(
                      fontWeight: FontWeight.bold,
                      color: isLocked ? Colors.white38 : Colors.white,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        duration,
                        style: AppTextStyles.label,
                      ),
                      if (progress > 0 && progress < 1.0) ...[
                        const SizedBox(width: 8),
                        Text(
                          '• ${(progress * 100).toInt()}%',
                          style: AppTextStyles.label.copyWith(color: AppTheme.accent),
                        ),
                      ],
                    ],
                  ),
                  if (progress > 0 && progress < 1.0) ...[
                    const SizedBox(height: 8),
                    LinearProgressIndicator(
                      value: progress,
                      backgroundColor: Colors.white.withValues(alpha: 0.1),
                      valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.accent),
                      minHeight: 2,
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
