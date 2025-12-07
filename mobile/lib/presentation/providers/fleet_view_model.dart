import 'package:flutter/material.dart';
import 'package:mobile/domain/entities/driver_document.dart';
import 'package:mobile/domain/entities/hos_log.dart';
import 'package:mobile/domain/entities/safety_event.dart';
import 'package:mobile/domain/entities/fuel_monitoring.dart';
import 'package:mobile/domain/repositories/fleet_repository.dart';

class FleetViewModel extends ChangeNotifier {
  final FleetRepository _repository;

  FleetViewModel(this._repository);

  // State
  bool _isLoading = false;
  String _dutyStatus = '';
  String _remainingDriveTime = '';
  int _safetyScore = 0;
  List<HosLog> _hosLogs = [];
  List<SafetyEvent> _safetyEvents = [];
  List<DriverDocument> _documents = [];
  List<FuelTransaction> _fuelTransactions = [];
  List<FuelAlert> _fuelAlerts = [];

  // Getters
  bool get isLoading => _isLoading;
  String get dutyStatus => _dutyStatus;
  String get remainingDriveTime => _remainingDriveTime;
  int get safetyScore => _safetyScore;
  List<HosLog> get hosLogs => _hosLogs;
  List<SafetyEvent> get safetyEvents => _safetyEvents;
  List<DriverDocument> get documents => _documents;
  List<FuelTransaction> get fuelTransactions => _fuelTransactions;
  List<FuelAlert> get fuelAlerts => _fuelAlerts;

  // Actions
  Future<void> loadDashboardData() async {
    _setLoading(true);
    try {
      final results = await Future.wait([
        _repository.getDutyStatus(),
        _repository.getRemainingDriveTime(),
        _repository.getSafetyScore(),
      ]);

      _dutyStatus = results[0] as String;
      _remainingDriveTime = results[1] as String;
      _safetyScore = results[2] as int;

      _hosLogs = await _repository.getHosLogs();
      _safetyEvents = await _repository.getSafetyEvents();
      _documents = await _repository.getDriverDocuments();
      _fuelTransactions = await _repository.getFuelTransactions();
      _fuelAlerts = await _repository.getFuelAlerts();
    } catch (e) {
      debugPrint('Error loading dashboard data: $e');
    } finally {
      _setLoading(false);
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }
}
