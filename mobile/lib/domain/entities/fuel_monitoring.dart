class FuelTransaction {
  final String id;
  final String stationName;
  final String location;
  final double liters;
  final double cost;
  final DateTime timestamp;
  final bool isVerified;
  final bool isSuspicious;

  FuelTransaction({
    required this.id,
    required this.stationName,
    required this.location,
    required this.liters,
    required this.cost,
    required this.timestamp,
    this.isVerified = false,
    this.isSuspicious = false,
  });
}

class FuelAlert {
  final String id;
  final String title;
  final String description;
  final DateTime timestamp;
  final String severity; // 'high', 'medium', 'low'

  FuelAlert({
    required this.id,
    required this.title,
    required this.description,
    required this.timestamp,
    required this.severity,
  });
}
