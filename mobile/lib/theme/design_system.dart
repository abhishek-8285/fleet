import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppGradients {
  static const LinearGradient background = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFF0A1929), // Deep Navy
      Color(0xFF000000), // Pure Black
    ],
  );

  static const LinearGradient cardSurface = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xCC1E2D3D), // Semi-transparent Navy
      Color(0xCC0A1929), // Semi-transparent Darker Navy
    ],
  );

  static const LinearGradient primaryAccent = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [
      Color(0xFF2196F3), // Blue
      Color(0xFF1976D2), // Darker Blue
    ],
  );

  static const LinearGradient danger = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [
      Color(0xFFD32F2F),
      Color(0xFFC62828),
    ],
  );
  
  static const LinearGradient success = LinearGradient(
    begin: Alignment.centerLeft,
    end: Alignment.centerRight,
    colors: [
      Color(0xFF43A047),
      Color(0xFF2E7D32),
    ],
  );
}

class AppShadows {
  static List<BoxShadow> get card => [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.3),
          blurRadius: 12,
          offset: const Offset(0, 4),
        ),
      ];

  static List<BoxShadow> get glow => [
        BoxShadow(
          color: const Color(0xFF2196F3).withValues(alpha: 0.3),
          blurRadius: 16,
          spreadRadius: -4,
          offset: const Offset(0, 8),
        ),
      ];
}

class AppTextStyles {
  static TextStyle get header => GoogleFonts.outfit(
        fontSize: 24,
        fontWeight: FontWeight.bold,
        color: Colors.white,
        letterSpacing: -0.5,
      );

  static TextStyle get subHeader => GoogleFonts.outfit(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: Colors.white.withValues(alpha: 0.9),
      );

  static TextStyle get body => GoogleFonts.inter(
        fontSize: 14,
        color: Colors.white.withValues(alpha: 0.7),
        height: 1.5,
      );
      
  static TextStyle get label => GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: Colors.white.withValues(alpha: 0.5),
        letterSpacing: 0.5,
      );
}
