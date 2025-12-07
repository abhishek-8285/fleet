import 'package:flutter/material.dart';
import 'package:mobile/theme/app_theme.dart';
import 'package:mobile/theme/design_system.dart';

class DocumentStack extends StatefulWidget {
  final List<DocumentItem> documents;

  const DocumentStack({super.key, required this.documents});

  @override
  State<DocumentStack> createState() => _DocumentStackState();
}

class _DocumentStackState extends State<DocumentStack> {
  late PageController _pageController;
  double _currentPage = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController(viewportFraction: 0.85);
    _pageController.addListener(() {
      setState(() {
        _currentPage = _pageController.page!;
      });
    });
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 220,
      child: PageView.builder(
        controller: _pageController,
        itemCount: widget.documents.length,
        itemBuilder: (context, index) {
          double value = 0.0;
          if (index == _currentPage.floor()) {
            value = 1 - (_currentPage - index);
          } else if (index == _currentPage.floor() + 1) {
            value = (_currentPage - index) + 1;
          } else {
            value = 0.0;
          }
          
          // Scale and Fade effect for stack feel
          final double scale = 0.9 + (value * 0.1);
          final double opacity = 0.5 + (value * 0.5);

          return Transform.scale(
            scale: scale,
            child: Opacity(
              opacity: opacity,
              child: _buildDocumentCard(widget.documents[index]),
            ),
          );
        },
      ),
    );
  }

  Widget _buildDocumentCard(DocumentItem doc) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            doc.color.withValues(alpha: 0.8),
            doc.color.withValues(alpha: 0.4),
          ],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
        border: Border.all(
          color: Colors.white.withValues(alpha: 0.2),
          width: 1,
        ),
      ),
      child: Stack(
        children: [
          // Background Pattern
          Positioned(
            right: -20,
            top: -20,
            child: Icon(
              doc.icon,
              size: 150,
              color: Colors.white.withValues(alpha: 0.1),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Icon(doc.icon, color: Colors.white, size: 32),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.3),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'VERIFIED',
                        style: AppTextStyles.label.copyWith(
                          color: AppTheme.success,
                          fontWeight: FontWeight.bold,
                          fontSize: 10,
                        ),
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                Text(
                  doc.title,
                  style: AppTextStyles.header.copyWith(fontSize: 20),
                ),
                const SizedBox(height: 4),
                Text(
                  doc.subtitle,
                  style: AppTextStyles.body.copyWith(
                    color: Colors.white.withValues(alpha: 0.8),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'EXP: ${doc.expiryDate}',
                      style: AppTextStyles.label,
                    ),
                    const Icon(Icons.qr_code, color: Colors.white),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class DocumentItem {
  final String title;
  final String subtitle;
  final String expiryDate;
  final IconData icon;
  final Color color;

  DocumentItem({
    required this.title,
    required this.subtitle,
    required this.expiryDate,
    required this.icon,
    required this.color,
  });
}
