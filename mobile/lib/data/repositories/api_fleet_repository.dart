import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/core/constants/app_constants.dart';
import 'package:mobile/domain/entities/driver_document.dart';
import 'package:mobile/domain/entities/fuel_monitoring.dart';
import 'package:mobile/domain/entities/hos_log.dart';
import 'package:mobile/domain/entities/safety_event.dart';
import 'package:mobile/domain/repositories/fleet_repository.dart';
import 'package:mobile/theme/app_theme.dart';

class ApiFleetRepository implements FleetRepository {
  // Backend URL (Android Emulator localhost)
  static const String _baseUrl = 'http://10.0.2.2:8080/api';

  @override
  Future<List<HosLog>> getHosLogs() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/eld/logs'));
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => HosLog(
          status: _parseHosStatus(json['status']),
          timestamp: DateTime.parse(json['timestamp']),
          durationHours: json['durationHours'],
        )).toList();
      }
    } catch (e) {
      debugPrint('Error fetching HOS logs: $e');
    }
    // Fallback/Mock for demo if backend not ready
    return [
      HosLog(status: HosStatus.offDuty, timestamp: DateTime.now(), durationHours: 6),
      HosLog(status: HosStatus.sleeperBerth, timestamp: DateTime.now(), durationHours: 1),
      HosLog(status: HosStatus.driving, timestamp: DateTime.now(), durationHours: 4),
    ];
  }

  @override
  Future<List<SafetyEvent>> getSafetyEvents() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/safety/events'));
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => SafetyEvent(
          id: json['id'],
          title: json['title'],
          timestamp: DateTime.parse(json['timestamp']),
          details: json['details'],
          scoreImpact: json['scoreImpact'],
          icon: _parseIcon(json['icon']),
          severityColor: _parseColor(json['severityColor']),
        )).toList();
      }
    } catch (e) {
      debugPrint('Error fetching safety events: $e');
    }
    return [
      SafetyEvent(
        id: '1',
        title: 'Harsh Braking',
        timestamp: DateTime.now().subtract(const Duration(days: 1)),
        details: '-2 pts',
        scoreImpact: -2,
        icon: Icons.warning,
        severityColor: Colors.orange,
      ),
    ];
  }

  @override
  Future<List<DriverDocument>> getDriverDocuments() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/driver/documents'));
      if (response.statusCode == 200) {
        final List<dynamic> data = json.decode(response.body);
        return data.map((json) => DriverDocument(
          id: json['id'],
          title: json['title'],
          subtitle: json['subtitle'],
          icon: _parseIcon(json['icon']),
          color: _parseColor(json['color']),
          expiryDate: DateTime.parse(json['expiryDate']),
        )).toList();
      }
    } catch (e) {
      debugPrint('Error fetching documents: $e');
    }
    return [
      DriverDocument(
        id: '1',
        title: 'Driving License',
        subtitle: 'Exp: 12/2028 • DL-14201008291',
        icon: Icons.badge,
        color: const Color(0xFF1565C0),
        expiryDate: DateTime(2028, 12, 31),
      ),
    ];
  }

  @override
  Future<int> getSafetyScore() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/driver/stats'));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['safetyScore'];
      }
    } catch (e) {
      debugPrint('Error fetching safety score: $e');
    }
    return 85;
  }

  @override
  Future<String> getDutyStatus() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/eld/status'));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['status'];
      }
    } catch (e) {
      debugPrint('Error fetching duty status: $e');
    }
    return AppConstants.dutyStatusOn;
  }

  @override
  Future<String> getRemainingDriveTime() async {
    try {
      final response = await http.get(Uri.parse('$_baseUrl/eld/clocks'));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['remainingDriveTime'];
      }
    } catch (e) {
      debugPrint('Error fetching remaining drive time: $e');
    }
    return '4h 12m';
  }

  @override
  Future<List<FuelTransaction>> getFuelTransactions() async {
    // Mock implementation for now as backend might not have this yet
    await Future.delayed(const Duration(milliseconds: 500));
    return [
      FuelTransaction(
        id: '1',
        stationName: 'Shell Station, Pune',
        location: 'Pune, MH',
        liters: 50.0,
        cost: 5200.0,
        timestamp: DateTime.now().subtract(const Duration(hours: 2)),
        isVerified: true,
      ),
    ];
  }

  @override
  Future<List<FuelAlert>> getFuelAlerts() async {
    // Mock implementation for now
    await Future.delayed(const Duration(milliseconds: 500));
    return [
      FuelAlert(
        id: '1',
        title: 'Potential Fuel Theft Detected',
        description: 'Sudden drop of 10L at 2:30 AM while vehicle was stationary.',
        timestamp: DateTime.now().subtract(const Duration(hours: 5)),
        severity: 'high',
      ),
    ];
  }

  // Helpers
  HosStatus _parseHosStatus(String status) {
    switch (status) {
      case 'OFF': return HosStatus.offDuty;
      case 'SB': return HosStatus.sleeperBerth;
      case 'D': return HosStatus.driving;
      case 'ON': return HosStatus.onDuty;
      default: return HosStatus.offDuty;
    }
  }

  IconData _parseIcon(String iconName) {
    // Simple mapping, can be expanded
    switch (iconName) {
      case 'warning': return Icons.warning;
      case 'speed': return Icons.speed;
      case 'badge': return Icons.badge;
      case 'directions_car': return Icons.directions_car;
      case 'security': return Icons.security;
      case 'map': return Icons.map;
      default: return Icons.info;
    }
  }

  Color _parseColor(String? colorHex) {
    if (colorHex == null) return Colors.grey;
    return Color(int.parse(colorHex.replaceAll('#', '0xFF')));
  }
}
