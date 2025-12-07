import 'package:flutter/material.dart';
import 'package:mobile/theme/app_theme.dart';

class SafetyEventCard extends StatelessWidget {
  final String title;
  final String time;
  final String details;
  final IconData icon;
  final Color color;

  const SafetyEventCard({
    super.key,
    required this.title,
    required this.time,
    required this.details,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: AppTheme.surface,
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withValues(alpha: 0.2),
          child: Icon(icon, color: color),
        ),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(time),
            Text(
              details,
              style: TextStyle(color: color),
            ),
          ],
        ),
        trailing: const Icon(Icons.map, color: AppTheme.textSecondary),
      ),
    );
  }
}
