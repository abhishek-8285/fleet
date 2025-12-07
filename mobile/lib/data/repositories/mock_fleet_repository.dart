import 'package:flutter/material.dart';
import 'package:mobile/core/constants/app_constants.dart';
import 'package:mobile/domain/entities/hos_log.dart';
import 'package:mobile/domain/entities/safety_event.dart';
import 'package:mobile/domain/entities/driver_document.dart';
import 'package:mobile/domain/entities/fuel_monitoring.dart';
import 'package:mobile/domain/repositories/fleet_repository.dart';
import 'package:mobile/theme/app_theme.dart';

class MockFleetRepository implements FleetRepository {
  @override
  Future<List<HosLog>> getHosLogs() async {
    await Future.delayed(const Duration(milliseconds: 500)); // Simulate network
    return [
      HosLog(status: HosStatus.offDuty, timestamp: DateTime.now(), durationHours: 6),
      HosLog(status: HosStatus.sleeperBerth, timestamp: DateTime.now(), durationHours: 1),
      HosLog(status: HosStatus.driving, timestamp: DateTime.now(), durationHours: 4),
      HosLog(status: HosStatus.offDuty, timestamp: DateTime.now(), durationHours: 1),
      HosLog(status: HosStatus.driving, timestamp: DateTime.now(), durationHours: 4),
      HosLog(status: HosStatus.onDuty, timestamp: DateTime.now(), durationHours: 1),
      HosLog(status: HosStatus.offDuty, timestamp: DateTime.now(), durationHours: 7),
    ];
  }

  @override
  Future<List<SafetyEvent>> getSafetyEvents() async {
    await Future.delayed(const Duration(milliseconds: 500));
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
      SafetyEvent(
        id: '2',
        title: 'Speeding',
        timestamp: DateTime.now(),
        details: '>85 km/h • -5 pts',
        scoreImpact: -5,
        icon: Icons.speed,
        severityColor: AppTheme.safety,
      ),
    ];
  }

  @override
  Future<List<DriverDocument>> getDriverDocuments() async {
    await Future.delayed(const Duration(milliseconds: 500));
    return [
      DriverDocument(
        id: '1',
        title: 'Driving License',
        subtitle: 'Exp: 12/2028 • DL-14201008291',
        icon: Icons.badge,
        color: const Color(0xFF1565C0),
        expiryDate: DateTime(2028, 12, 31),
      ),
      DriverDocument(
        id: '2',
        title: 'Vehicle Registration',
        subtitle: 'KA-01-HH-1234 • Valid',
        icon: Icons.directions_car,
        color: const Color(0xFF2E7D32),
        expiryDate: DateTime(2025, 12, 31),
      ),
      DriverDocument(
        id: '3',
        title: 'Insurance Certificate',
        subtitle: 'Policy #987654321',
        icon: Icons.security,
        color: const Color(0xFFC62828),
        expiryDate: DateTime(2024, 12, 31),
      ),
      DriverDocument(
        id: '4',
        title: 'National Permit',
        subtitle: 'All India Permit • Valid',
        icon: Icons.map,
        color: const Color(0xFFF9A825),
        expiryDate: DateTime(2026, 12, 31),
      ),
    ];
  }

  @override
  Future<int> getSafetyScore() async {
    await Future.delayed(const Duration(milliseconds: 500));
    return 85;
  }

  @override
  Future<String> getDutyStatus() async {
    await Future.delayed(const Duration(milliseconds: 200));
    return AppConstants.dutyStatusOn;
  }

  @override
  Future<String> getRemainingDriveTime() async {
    await Future.delayed(const Duration(milliseconds: 200));
    return '4h 12m';
  }

  @override
  Future<List<FuelTransaction>> getFuelTransactions() async {
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
      FuelTransaction(
        id: '2',
        stationName: 'Highway Pump, NH48',
        location: 'NH48, MH',
        liters: 20.0,
        cost: 2100.0,
        timestamp: DateTime.now().subtract(const Duration(days: 1)),
        isSuspicious: true,
      ),
      FuelTransaction(
        id: '3',
        stationName: 'HP Petrol Pump',
        location: 'Mumbai, MH',
        liters: 45.0,
        cost: 4800.0,
        timestamp: DateTime.now().subtract(const Duration(days: 3)),
        isVerified: true,
      ),
    ];
  }

  @override
  Future<List<FuelAlert>> getFuelAlerts() async {
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
}
