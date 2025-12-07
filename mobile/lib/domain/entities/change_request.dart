enum RequestType { profileUpdate, documentUpdate }
enum RequestStatus { pending, approved, rejected }

class DriverChangeRequest {
  final String id;
  final String driverId;
  final RequestType requestType;
  final Map<String, dynamic> requestedChanges;
  final RequestStatus status;
  final String? reason;
  final DateTime submittedAt;
  final String? adminComments;

  const DriverChangeRequest({
    required this.id,
    required this.driverId,
    required this.requestType,
    required this.requestedChanges,
    required this.status,
    this.reason,
    required this.submittedAt,
    this.adminComments,
  });
}
