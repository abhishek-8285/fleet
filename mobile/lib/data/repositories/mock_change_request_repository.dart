import 'package:mobile/domain/entities/change_request.dart';
import 'package:mobile/domain/repositories/change_request_repository.dart';

class MockChangeRequestRepository implements ChangeRequestRepository {
  final List<DriverChangeRequest> _requests = [
    DriverChangeRequest(
      id: '1',
      driverId: 'current_user',
      requestType: RequestType.profileUpdate,
      requestedChanges: {'phone': '+91 98765 43210'},
      status: RequestStatus.pending,
      reason: 'Changed phone number',
      submittedAt: DateTime.now().subtract(const Duration(days: 1)),
    ),
    DriverChangeRequest(
      id: '2',
      driverId: 'current_user',
      requestType: RequestType.documentUpdate,
      requestedChanges: {'license_expiry': '2030-01-01'},
      status: RequestStatus.approved,
      reason: 'Renewed license',
      submittedAt: DateTime.now().subtract(const Duration(days: 5)),
      adminComments: 'Verified with RTO',
    ),
  ];

  @override
  Future<void> submitChangeRequest(RequestType type, Map<String, dynamic> changes, String reason) async {
    await Future.delayed(const Duration(seconds: 1));
    final newRequest = DriverChangeRequest(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      driverId: 'current_user',
      requestType: type,
      requestedChanges: changes,
      status: RequestStatus.pending,
      reason: reason,
      submittedAt: DateTime.now(),
    );
    _requests.insert(0, newRequest);
  }

  @override
  Future<List<DriverChangeRequest>> getChangeRequests() async {
    await Future.delayed(const Duration(milliseconds: 500));
    return List.from(_requests);
  }

  @override
  Future<void> cancelChangeRequest(String id) async {
    await Future.delayed(const Duration(milliseconds: 500));
    _requests.removeWhere((r) => r.id == id);
  }
}
