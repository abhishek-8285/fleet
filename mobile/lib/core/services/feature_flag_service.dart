import 'package:flutter/foundation.dart';

import 'dart:convert';
import 'package:http/http.dart' as http;

class FeatureFlagService extends ChangeNotifier {
  // Flags
  bool _isIndiaMode = true;
  bool _enableFuelFraudDetection = true;
  bool _enableVoiceGuidance = true;
  bool _enableDvIR = false;
  bool _enableCoaching = true;
  bool _enableProofOfDelivery = true;
  bool _enableEarnings = true;
  bool _enableCompliance = true;
  bool _enableHos = false;
  bool _enableSafety = true;

  bool _isLoading = true;
  String? _error;

  // Getters
  bool get isIndiaMode => _isIndiaMode;
  bool get enableFuelFraudDetection => _enableFuelFraudDetection;
  bool get enableVoiceGuidance => _enableVoiceGuidance;
  bool get enableDvIR => _enableDvIR;
  bool get enableCoaching => _enableCoaching;
  bool get enableProofOfDelivery => _enableProofOfDelivery;
  bool get enableEarnings => _enableEarnings;
  bool get enableCompliance => _enableCompliance;
  bool get enableHos => _enableHos;
  bool get enableSafety => _enableSafety;
  
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Backend URL (Android Emulator localhost)
  static const String _baseUrl = 'http://10.0.2.2:8080/api/feature-flags';

  Future<void> fetchFlags() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Simulate network delay for better UX demonstration if backend is not reachable immediately
      // await Future.delayed(const Duration(seconds: 1)); 

      final response = await http.get(Uri.parse(_baseUrl)).timeout(const Duration(seconds: 2));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _updateFlagsFromBackend(data);
      } else {
        _error = 'Failed to load flags: ${response.statusCode}';
        // Fallback to defaults (already set)
      }
    } catch (e) {
      _error = 'Backend unreachable, using defaults. Error: $e';
      // Fallback to defaults (already set)
      debugPrint('FeatureFlagService: $_error');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void _updateFlagsFromBackend(Map<String, dynamic> data) {
    if (data.containsKey('isIndiaMode')) _isIndiaMode = data['isIndiaMode'];
    if (data.containsKey('enableFuelFraudDetection')) _enableFuelFraudDetection = data['enableFuelFraudDetection'];
    if (data.containsKey('enableVoiceGuidance')) _enableVoiceGuidance = data['enableVoiceGuidance'];
    if (data.containsKey('enableDvIR')) _enableDvIR = data['enableDvIR'];
    if (data.containsKey('enableCoaching')) _enableCoaching = data['enableCoaching'];
    if (data.containsKey('enableProofOfDelivery')) _enableProofOfDelivery = data['enableProofOfDelivery'];
    if (data.containsKey('enableEarnings')) _enableEarnings = data['enableEarnings'];
    if (data.containsKey('enableCompliance')) _enableCompliance = data['enableCompliance'];
    if (data.containsKey('enableHos')) _enableHos = data['enableHos'];
    if (data.containsKey('enableSafety')) _enableSafety = data['enableSafety'];
  }

  // Toggles (Local overrides for testing)
  void toggleIndiaMode() {
    _isIndiaMode = !_isIndiaMode;
    notifyListeners();
  }

  void setIndiaMode(bool value) {
    _isIndiaMode = value;
    notifyListeners();
  }
  
  void toggleFuelFraudDetection() {
    _enableFuelFraudDetection = !_enableFuelFraudDetection;
    notifyListeners();
  }

  void toggleVoiceGuidance() {
    _enableVoiceGuidance = !_enableVoiceGuidance;
    notifyListeners();
  }

  void toggleDvIR() {
    _enableDvIR = !_enableDvIR;
    notifyListeners();
  }

  void toggleCoaching() {
    _enableCoaching = !_enableCoaching;
    notifyListeners();
  }

  void toggleProofOfDelivery() {
    _enableProofOfDelivery = !_enableProofOfDelivery;
    notifyListeners();
  }

  void toggleEarnings() {
    _enableEarnings = !_enableEarnings;
    notifyListeners();
  }

  void toggleCompliance() {
    _enableCompliance = !_enableCompliance;
    notifyListeners();
  }

  void toggleHos() {
    _enableHos = !_enableHos;
    notifyListeners();
  }

  void toggleSafety() {
    _enableSafety = !_enableSafety;
    notifyListeners();
  }
}
