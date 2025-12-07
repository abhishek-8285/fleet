import 'package:flutter/material.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:mobile/theme/design_system.dart';

class DutyStatusRing extends StatefulWidget {
  final String status;
  final String remainingTime;
  final double progress; // 0.0 to 1.0

  const DutyStatusRing({
    super.key,
    required this.status,
    required this.remainingTime,
    required this.progress,
  });

  @override
  State<DutyStatusRing> createState() => _DutyStatusRingState();
}

class _DutyStatusRingState extends State<DutyStatusRing> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _animation = Tween<double>(begin: 0, end: widget.progress).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );
    _controller.forward();
  }

  @override
  void didUpdateWidget(DutyStatusRing oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.progress != widget.progress) {
      _animation = Tween<double>(begin: oldWidget.progress, end: widget.progress).animate(
        CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
      );
      _controller
        ..reset()
        ..forward();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Color _getStatusColor() {
    switch (widget.status) {
      case 'ON DUTY':
        return AppTheme.success;
      case 'DRIVING':
        return AppTheme.accent;
      case 'OFF DUTY':
        return Colors.grey;
      case 'SLEEPER':
        return Colors.orange;
      default:
        return AppTheme.accent;
    }
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 220,
      width: 220,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Background Ring
          SizedBox(
            height: 200,
            width: 200,
            child: CircularProgressIndicator(
              value: 1.0,
              strokeWidth: 15,
              valueColor: AlwaysStoppedAnimation<Color>(
                Colors.white.withValues(alpha: 0.1),
              ),
            ),
          ),
          // Animated Progress Ring
          AnimatedBuilder(
            animation: _animation,
            builder: (context, child) {
              return SizedBox(
                height: 200,
                width: 200,
                child: CircularProgressIndicator(
                  value: _animation.value,
                  strokeWidth: 15,
                  strokeCap: StrokeCap.round,
                  valueColor: AlwaysStoppedAnimation<Color>(_getStatusColor()),
                  backgroundColor: Colors.transparent,
                ),
              );
            },
          ),
          // Glow Effect
          Container(
            height: 180,
            width: 180,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: _getStatusColor().withValues(alpha: 0.2),
                  blurRadius: 30,
                  spreadRadius: 5,
                ),
              ],
            ),
          ),
          // Center Content
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'REMAINING',
                style: AppTextStyles.label.copyWith(
                  letterSpacing: 1.5,
                  fontSize: 10,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                widget.remainingTime,
                style: AppTextStyles.header.copyWith(
                  fontSize: 36,
                  height: 1,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: _getStatusColor().withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: _getStatusColor().withValues(alpha: 0.5),
                  ),
                ),
                child: Text(
                  widget.status,
                  style: AppTextStyles.label.copyWith(
                    color: _getStatusColor(),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
