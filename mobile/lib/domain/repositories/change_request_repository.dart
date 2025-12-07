import 'package:mobile/domain/entities/change_request.dart';

abstract class ChangeRequestRepository {
  Future<void> submitChangeRequest(RequestType type, Map<String, dynamic> changes, String reason);
  Future<List<DriverChangeRequest>> getChangeRequests();
  Future<void> cancelChangeRequest(String id);
}
