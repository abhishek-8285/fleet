import 'package:flutter/material.dart';
import 'package:mobile/domain/entities/change_request.dart';
import 'package:mobile/domain/repositories/change_request_repository.dart';

class ChangeRequestProvider extends ChangeNotifier {
  final ChangeRequestRepository _repository;
  
  List<DriverChangeRequest> _requests = [];
  bool _isLoading = false;
  String? _error;

  ChangeRequestProvider(this._repository);

  List<DriverChangeRequest> get requests => _requests;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadRequests() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _requests = await _repository.getChangeRequests();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> submitRequest(RequestType type, Map<String, dynamic> changes, String reason) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _repository.submitChangeRequest(type, changes, reason);
      await loadRequests(); // Refresh list
      return true;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> cancelRequest(String id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _repository.cancelChangeRequest(id);
      await loadRequests();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
