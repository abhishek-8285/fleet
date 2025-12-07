class HosLog {
  final String status;
  final DateTime timestamp;
  final double durationHours;

  const HosLog({
    required this.status,
    required this.timestamp,
    required this.durationHours,
  });
}

class HosStatus {
  static const String offDuty = 'OFF';
  static const String sleeperBerth = 'SB';
  static const String driving = 'D';
  static const String onDuty = 'ON';
}
