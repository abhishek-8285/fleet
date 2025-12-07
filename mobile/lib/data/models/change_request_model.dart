import 'package:mobile/domain/entities/change_request.dart';

class DriverChangeRequestModel extends DriverChangeRequest {
  const DriverChangeRequestModel({
    required super.id,
    required super.driverId,
    required super.requestType,
    required super.requestedChanges,
    required super.status,
    super.reason,
    required super.submittedAt,
    super.adminComments,
  });

  factory DriverChangeRequestModel.fromJson(Map<String, dynamic> json) {
    return DriverChangeRequestModel(
      id: json['id'].toString(),
      driverId: json['driver_id'].toString(),
      requestType: _parseType(json['request_type']),
      requestedChanges: json['requested_changes'] as Map<String, dynamic>,
      status: _parseStatus(json['status']),
      reason: json['reason'],
      submittedAt: DateTime.parse(json['submitted_at']),
      adminComments: json['admin_comments'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'driver_id': driverId,
      'request_type': _typeToString(requestType),
      'requested_changes': requestedChanges,
      'status': _statusToString(status),
      'reason': reason,
      'submitted_at': submittedAt.toIso8601String(),
      'admin_comments': adminComments,
    };
  }

  static RequestType _parseType(String type) {
    switch (type) {
      case 'PROFILE_UPDATE':
        return RequestType.profileUpdate;
      case 'DOCUMENT_UPDATE':
        return RequestType.documentUpdate;
      default:
        return RequestType.profileUpdate;
    }
  }

  static String _typeToString(RequestType type) {
    switch (type) {
      case RequestType.profileUpdate:
        return 'PROFILE_UPDATE';
      case RequestType.documentUpdate:
        return 'DOCUMENT_UPDATE';
    }
  }

  static RequestStatus _parseStatus(String status) {
    switch (status) {
      case 'PENDING':
        return RequestStatus.pending;
      case 'APPROVED':
        return RequestStatus.approved;
      case 'REJECTED':
        return RequestStatus.rejected;
      default:
        return RequestStatus.pending;
    }
  }

  static String _statusToString(RequestStatus status) {
    switch (status) {
      case RequestStatus.pending:
        return 'PENDING';
      case RequestStatus.approved:
        return 'APPROVED';
      case RequestStatus.rejected:
        return 'REJECTED';
    }
  }
}
