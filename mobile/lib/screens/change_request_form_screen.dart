import 'package:flutter/material.dart';
import 'package:mobile/domain/entities/change_request.dart';
import 'package:mobile/presentation/providers/change_request_provider.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:mobile/theme/design_system.dart';
import 'package:mobile/widgets/glass_container.dart';
import 'package:provider/provider.dart';

class ChangeRequestFormScreen extends StatefulWidget {
  const ChangeRequestFormScreen({super.key});

  @override
  State<ChangeRequestFormScreen> createState() => _ChangeRequestFormScreenState();
}

class _ChangeRequestFormScreenState extends State<ChangeRequestFormScreen> {
  final _formKey = GlobalKey<FormState>();
  RequestType _selectedType = RequestType.profileUpdate;
  final _reasonController = TextEditingController();
  
  // For profile update
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();

  // For document update (simplified for now)
  final _docTypeController = TextEditingController();
  final _docNumberController = TextEditingController();

  @override
  void dispose() {
    _reasonController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _docTypeController.dispose();
    _docNumberController.dispose();
    super.dispose();
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
                title: const Text('New Request'),
                backgroundColor: Colors.transparent,
                elevation: 0,
                titleTextStyle: AppTextStyles.header,
                iconTheme: const IconThemeData(color: Colors.white),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16.0),
                  child: GlassContainer(
                    padding: const EdgeInsets.all(24),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          DropdownButtonFormField<RequestType>(
                            initialValue: _selectedType,
                            decoration: _buildInputDecoration('Request Type'),
                            dropdownColor: AppTheme.surface,
                            style: AppTextStyles.body,
                            items: [
                              DropdownMenuItem(
                                value: RequestType.profileUpdate,
                                child: Text('Profile Update', style: AppTextStyles.body),
                              ),
                              DropdownMenuItem(
                                value: RequestType.documentUpdate,
                                child: Text('Document Update', style: AppTextStyles.body),
                              ),
                            ],
                            onChanged: (value) {
                              setState(() {
                                _selectedType = value!;
                              });
                            },
                          ),
                          const SizedBox(height: 16),
                          if (_selectedType == RequestType.profileUpdate) ...[
                            TextFormField(
                              controller: _phoneController,
                              decoration: _buildInputDecoration('New Phone Number'),
                              style: AppTextStyles.body,
                              keyboardType: TextInputType.phone,
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _addressController,
                              decoration: _buildInputDecoration('New Address'),
                              style: AppTextStyles.body,
                              maxLines: 2,
                            ),
                          ] else ...[
                            TextFormField(
                              controller: _docTypeController,
                              decoration: _buildInputDecoration('Document Type'),
                              style: AppTextStyles.body,
                            ),
                            const SizedBox(height: 16),
                            TextFormField(
                              controller: _docNumberController,
                              decoration: _buildInputDecoration('Document Number'),
                              style: AppTextStyles.body,
                            ),
                          ],
                          const SizedBox(height: 16),
                          TextFormField(
                            controller: _reasonController,
                            decoration: _buildInputDecoration('Reason for Change'),
                            style: AppTextStyles.body,
                            validator: (value) {
                              if (value == null || value.isEmpty) {
                                return 'Please provide a reason';
                              }
                              return null;
                            },
                            maxLines: 3,
                          ),
                          const SizedBox(height: 24),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              onPressed: _submitForm,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppTheme.accent,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              child: const Text('Submit Request'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  InputDecoration _buildInputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: AppTextStyles.label,
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.2)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: AppTheme.accent),
      ),
      filled: true,
      fillColor: Colors.white.withValues(alpha: 0.05),
    );
  }

  void _submitForm() async {
    if (_formKey.currentState!.validate()) {
      final Map<String, dynamic> changes = {};
      
      if (_selectedType == RequestType.profileUpdate) {
        if (_phoneController.text.isNotEmpty) {
          changes['phone'] = _phoneController.text;
        }
        if (_addressController.text.isNotEmpty) {
          changes['address'] = _addressController.text;
        }
        if (changes.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please enter at least one change')),
          );
          return;
        }
      } else {
        if (_docTypeController.text.isEmpty || _docNumberController.text.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Please fill all document fields')),
          );
          return;
        }
        changes['document_type'] = _docTypeController.text;
        changes['document_number'] = _docNumberController.text;
      }

      final success = await Provider.of<ChangeRequestProvider>(context, listen: false)
          .submitRequest(_selectedType, changes, _reasonController.text);

      if (success && mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Request submitted successfully')),
        );
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to submit request')),
        );
      }
    }
  }
}

