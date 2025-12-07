import 'package:flutter/material.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:signature/signature.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile/l10n/generated/app_localizations.dart';

class ProofOfDeliveryScreen extends StatefulWidget {
  const ProofOfDeliveryScreen({super.key});

  @override
  State<ProofOfDeliveryScreen> createState() => _ProofOfDeliveryScreenState();
}

class _ProofOfDeliveryScreenState extends State<ProofOfDeliveryScreen> {
  final SignatureController _signatureController = SignatureController(
    penStrokeWidth: 3,
    penColor: Colors.black,
    exportBackgroundColor: Colors.white,
  );

  final ImagePicker _picker = ImagePicker();
  bool _isPackagePhotoTaken = false;
  bool _isEWayBillPhotoTaken = false;

  @override
  void dispose() {
    _signatureController.dispose();
    super.dispose();
  }

  Future<void> _takePhoto(bool isPackage) async {
    final XFile? photo = await _picker.pickImage(source: ImageSource.camera);
    if (photo != null) {
      setState(() {
        if (isPackage) {
          _isPackagePhotoTaken = true;
        } else {
          _isEWayBillPhotoTaken = true;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: Text(l10n.proofOfDelivery),
        backgroundColor: AppTheme.primary,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Trip Info Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.border),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.accent.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.local_shipping, color: AppTheme.accent),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${l10n.activeTrip} #1023',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: AppTheme.textPrimary,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Amazon Warehouse, Bhiwandi',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: AppTheme.textSecondary,
                            ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Receiver Details
            Text(
              l10n.receiverName,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
            ),
            const SizedBox(height: 8),
            TextField(
              style: const TextStyle(color: AppTheme.textPrimary),
              decoration: InputDecoration(
                filled: true,
                fillColor: AppTheme.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppTheme.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppTheme.border),
                ),
                hintText: 'Enter name',
                hintStyle: TextStyle(color: AppTheme.textSecondary.withValues(alpha: 0.5)),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              l10n.phoneNumber,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    color: AppTheme.textSecondary,
                  ),
            ),
            const SizedBox(height: 8),
            TextField(
              keyboardType: TextInputType.phone,
              style: const TextStyle(color: AppTheme.textPrimary),
              decoration: InputDecoration(
                filled: true,
                fillColor: AppTheme.surface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppTheme.border),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: AppTheme.border),
                ),
                hintText: 'Enter phone number',
                hintStyle: TextStyle(color: AppTheme.textSecondary.withValues(alpha: 0.5)),
              ),
            ),
            const SizedBox(height: 24),

            // Signature
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  l10n.signature,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppTheme.textPrimary,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                TextButton(
                  onPressed: () => _signatureController.clear(),
                  child: Text(
                    l10n.clear,
                    style: const TextStyle(color: AppTheme.error),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Signature(
                controller: _signatureController,
                height: 200,
                backgroundColor: Colors.white,
              ),
            ),
            const SizedBox(height: 24),

            // Photo Proof
            Row(
              children: [
                Expanded(
                  child: _buildPhotoButton(
                    context,
                    l10n.capturePackage,
                    Icons.inventory_2,
                    _isPackagePhotoTaken,
                    () => _takePhoto(true),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildPhotoButton(
                    context,
                    l10n.captureEWayBill,
                    Icons.receipt_long,
                    _isEWayBillPhotoTaken,
                    () => _takePhoto(false),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),

            // Submit Button
            SizedBox(
              width: double.infinity,
              height: 56,
              child: ElevatedButton(
                onPressed: () {
                  // Handle submission
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.success,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text(
                  l10n.completeDelivery,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPhotoButton(
    BuildContext context,
    String label,
    IconData icon,
    bool isTaken,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 120,
        decoration: BoxDecoration(
          color: isTaken ? AppTheme.success.withValues(alpha: 0.1) : AppTheme.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isTaken ? AppTheme.success : AppTheme.border,
            width: isTaken ? 2 : 1,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isTaken ? Icons.check_circle : icon,
              size: 32,
              color: isTaken ? AppTheme.success : AppTheme.accent,
            ),
            const SizedBox(height: 8),
            Text(
              label,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: isTaken ? AppTheme.success : AppTheme.textSecondary,
                    fontWeight: isTaken ? FontWeight.bold : FontWeight.normal,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
