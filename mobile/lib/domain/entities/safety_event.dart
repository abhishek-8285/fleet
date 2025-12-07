import 'package:flutter/material.dart';

class SafetyEvent {
  final String id;
  final String title;
  final DateTime timestamp;
  final String details;
  final int scoreImpact;
  final IconData icon;
  final Color severityColor;

  const SafetyEvent({
    required this.id,
    required this.title,
    required this.timestamp,
    required this.details,
    required this.scoreImpact,
    required this.icon,
    required this.severityColor,
  });
}
