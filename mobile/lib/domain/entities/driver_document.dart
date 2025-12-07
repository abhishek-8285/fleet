import 'package:flutter/material.dart';

class DriverDocument {
  final String id;
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final DateTime expiryDate;

  const DriverDocument({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.expiryDate,
  });
}
