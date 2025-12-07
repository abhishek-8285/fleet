import 'package:flutter/material.dart';
import 'package:mobile/domain/entities/change_request.dart';
import 'package:mobile/presentation/providers/change_request_provider.dart';
import 'package:mobile/screens/change_request_form_screen.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:mobile/theme/design_system.dart';
import 'package:mobile/widgets/glass_container.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

class ChangeRequestListScreen extends StatefulWidget {
  const ChangeRequestListScreen({super.key});

  @override
  State<ChangeRequestListScreen> createState() => _ChangeRequestListScreenState();
}

class _ChangeRequestListScreenState extends State<ChangeRequestListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<ChangeRequestProvider>().loadRequests();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: AppGradients.background,
        ),
        child: SafeArea(
          child: Column(
            children: [
              AppBar(
                title: const Text('Change Requests'),
                backgroundColor: Colors.transparent,
                elevation: 0,
                titleTextStyle: AppTextStyles.header,
                iconTheme: const IconThemeData(color: Colors.white),
              ),
              Expanded(
                child: Consumer<ChangeRequestProvider>(
                  builder: (context, provider, child) {
                    if (provider.isLoading && provider.requests.isEmpty) {
                      return const Center(child: CircularProgressIndicator());
                    }

                    if (provider.requests.isEmpty) {
                      return Center(
                        child: Text(
                          'No change requests found',
                          style: AppTextStyles.body,
                        ),
                      );
                    }

                    return ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: provider.requests.length,
                      itemBuilder: (context, index) {
                        final request = provider.requests[index];
                        return _buildRequestCard(request);
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: AppTheme.accent,
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const ChangeRequestFormScreen()),
          );
        },
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildRequestCard(DriverChangeRequest request) {
    Color statusColor;
    IconData statusIcon;

    switch (request.status) {
      case RequestStatus.pending:
        statusColor = Colors.orange;
        statusIcon = Icons.access_time;
        break;
      case RequestStatus.approved:
        statusColor = AppTheme.success;
        statusIcon = Icons.check_circle;
        break;
      case RequestStatus.rejected:
        statusColor = AppTheme.error;
        statusIcon = Icons.cancel;
        break;
    }

    return GlassContainer(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(statusIcon, color: statusColor, size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  request.requestType == RequestType.profileUpdate
                      ? 'Profile Update'
                      : 'Document Update',
                  style: AppTextStyles.subHeader.copyWith(fontSize: 16),
                ),
                const SizedBox(height: 4),
                Text(
                  request.reason ?? 'No reason provided',
                  style: AppTextStyles.body,
                ),
                const SizedBox(height: 8),
                Text(
                  DateFormat('MMM d, y h:mm a').format(request.submittedAt),
                  style: AppTextStyles.label,
                ),
                if (request.adminComments != null) ...[
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      'Admin: ${request.adminComments}',
                      style: AppTextStyles.body.copyWith(
                        color: statusColor,
                        fontStyle: FontStyle.italic,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (request.status == RequestStatus.pending)
            IconButton(
              icon: const Icon(Icons.delete_outline, color: Colors.white70),
              onPressed: () {
                Provider.of<ChangeRequestProvider>(context, listen: false)
                    .cancelRequest(request.id);
              },
            ),
        ],
      ),
    );
  }
}

