import 'package:mobile/domain/entities/driver_document.dart';
import 'package:mobile/domain/entities/hos_log.dart';
import 'package:mobile/domain/entities/safety_event.dart';
import 'package:mobile/domain/entities/fuel_monitoring.dart';

abstract class FleetRepository {
  Future<List<HosLog>> getHosLogs();
  Future<List<SafetyEvent>> getSafetyEvents();
  Future<List<DriverDocument>> getDriverDocuments();
  Future<List<FuelTransaction>> getFuelTransactions();
  Future<List<FuelAlert>> getFuelAlerts();
  Future<int> getSafetyScore();
  Future<String> getDutyStatus();
  Future<String> getRemainingDriveTime();
}
