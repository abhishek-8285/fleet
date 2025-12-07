import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/data/repositories/mock_change_request_repository.dart';
import 'package:mobile/domain/entities/change_request.dart';
import 'package:mobile/presentation/providers/change_request_provider.dart';

void main() {
  group('ChangeRequestProvider', () {
    late ChangeRequestProvider provider;
    late MockChangeRequestRepository repository;

    setUp(() {
      repository = MockChangeRequestRepository();
      provider = ChangeRequestProvider(repository);
    });

    test('initial state is correct', () {
      expect(provider.requests, isEmpty);
      expect(provider.isLoading, false);
      expect(provider.error, null);
    });

    test('loadRequests populates requests', () async {
      await provider.loadRequests();
      expect(provider.requests, isNotEmpty);
      expect(provider.requests.length, 2); // Mock has 2 initially
      expect(provider.isLoading, false);
    });

    test('submitRequest adds a new request', () async {
      // First load to get initial state
      await provider.loadRequests();
      final initialCount = provider.requests.length;

      final success = await provider.submitRequest(
        RequestType.profileUpdate,
        {'phone': '1234567890'},
        'New phone',
      );

      expect(success, true);
      expect(provider.requests.length, initialCount + 1);
      expect(provider.requests.first.reason, 'New phone');
    });

    test('cancelRequest removes a request', () async {
      await provider.loadRequests();
      final initialCount = provider.requests.length;
      final idToDelete = provider.requests.first.id;

      await provider.cancelRequest(idToDelete);

      expect(provider.requests.length, initialCount - 1);
    });
  });
}
