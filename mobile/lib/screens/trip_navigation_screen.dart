import 'package:flutter/material.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:mobile/theme/design_system.dart';
import 'package:mobile/widgets/glass_container.dart';
import 'package:mobile/widgets/navigation_bottom_bar.dart';
import 'package:mobile/widgets/navigation_header.dart';

class TripNavigationScreen extends StatelessWidget {
  const TripNavigationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppGradients.background,
        ),
        child: Stack(
          children: [
            // Placeholder for 3D Map
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.map, size: 100, color: Colors.white.withValues(alpha: 0.1)),
                  const SizedBox(height: 16),
                  Text(
                    'Map Navigation View',
                    style: AppTextStyles.label,
                  ),
                ],
              ),
            ),
            
            // Route Line Simulation (Simple visual cue)
            Positioned.fill(
              child: CustomPaint(
                painter: RouteLinePainter(),
              ),
            ),

            // Top Header
            const Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: NavigationHeader(
                instruction: 'Turn Right',
                distance: '500m',
                icon: Icons.turn_right,
              ),
            ),

            // Speed Overlay
            Positioned(
              top: 160,
              left: 24,
              child: GlassContainer(
                padding: const EdgeInsets.all(16),
                borderRadius: BorderRadius.circular(50),
                child: Column(
                  children: [
                    Text(
                      '65',
                      style: AppTextStyles.header.copyWith(
                        fontSize: 24,
                        color: Colors.white,
                      ),
                    ),
                    Text(
                      'km/h',
                      style: AppTextStyles.label.copyWith(fontSize: 10),
                    ),
                  ],
                ),
              ),
            ),

            // Bottom Bar
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: NavigationBottomBar(
                eta: '45 min',
                remainingDistance: '32 km',
                onSosPressed: () {
                  // Handle SOS
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('SOS Alert Triggered!')),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class RouteLinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = AppTheme.accent
      ..strokeWidth = 8
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();
    path.moveTo(size.width * 0.5, size.height);
    path.quadraticBezierTo(
      size.width * 0.5,
      size.height * 0.6,
      size.width * 0.8,
      size.height * 0.4,
    );
    
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

