import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/constants/app_constants.dart';
import 'package:mobile/data/repositories/mock_fleet_repository.dart';
import 'package:mobile/presentation/providers/fleet_view_model.dart';

void main() {
  group('FleetViewModel', () {
    late FleetViewModel viewModel;
    late MockFleetRepository repository;

    setUp(() {
      repository = MockFleetRepository();
      viewModel = FleetViewModel(repository);
    });

    test('initial values are correct', () {
      expect(viewModel.isLoading, false);
      expect(viewModel.dutyStatus, '');
      expect(viewModel.safetyScore, 0);
    });

    test('loadDashboardData updates state correctly', () async {
      // Act
      await viewModel.loadDashboardData();

      // Assert
      expect(viewModel.isLoading, false);
      expect(viewModel.dutyStatus, AppConstants.dutyStatusOn);
      expect(viewModel.safetyScore, 85);
      expect(viewModel.hosLogs.isNotEmpty, true);
      expect(viewModel.safetyEvents.isNotEmpty, true);
      expect(viewModel.documents.isNotEmpty, true);
    });
  });
}
