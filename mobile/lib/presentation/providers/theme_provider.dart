import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/theme/app_theme.dart';

class ThemeProvider extends ChangeNotifier {
  ThemeData _themeData = AppTheme.darkTheme;
  bool _isLoading = false;
  String? _error;

  ThemeData get themeData => _themeData;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Backend URL (Android Emulator localhost)
  static const String _baseUrl = 'http://10.0.2.2:8080/api/theme-config';

  Future<void> fetchTheme() async {
    _isLoading = true;
    notifyListeners();

    try {
      // Simulate network delay
      // await Future.delayed(const Duration(milliseconds: 500));

      final response = await http.get(Uri.parse(_baseUrl)).timeout(const Duration(seconds: 2));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        _updateThemeFromBackend(data);
      } else {
        _error = 'Failed to load theme: ${response.statusCode}';
        // Keep default theme
      }
    } catch (e) {
      _error = 'Backend unreachable for theme, using default. Error: $e';
      debugPrint('ThemeProvider: $_error');
      // Keep default theme
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void _updateThemeFromBackend(Map<String, dynamic> data) {
    // Example JSON: { "mode": "light", "primaryColor": "#0A1929", "accentColor": "#2196F3" }
    
    final mode = data['mode'] as String? ?? 'dark';
    final primaryColorHex = data['primaryColor'] as String?;
    final accentColorHex = data['accentColor'] as String?;

    Color primary = AppTheme.primary;
    Color accent = AppTheme.accent;

    if (primaryColorHex != null) {
      primary = _hexToColor(primaryColorHex);
    }
    if (accentColorHex != null) {
      accent = _hexToColor(accentColorHex);
    }

    if (mode == 'light') {
      _themeData = _buildLightTheme(primary, accent);
    } else {
      _themeData = _buildDarkTheme(primary, accent);
    }
    
    notifyListeners();
  }

  Color _hexToColor(String hex) {
    hex = hex.replaceAll('#', '');
    if (hex.length == 6) {
      hex = 'FF$hex';
    }
    return Color(int.parse(hex, radix: 16));
  }

  ThemeData _buildDarkTheme(Color primary, Color accent) {
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: primary,
      scaffoldBackgroundColor: AppTheme.background,
      colorScheme: ColorScheme.dark(
        primary: accent,
        secondary: accent,
        surface: AppTheme.surface,
        error: AppTheme.safety,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: AppTheme.textPrimary,
      ),
      textTheme: GoogleFonts.robotoTextTheme(
        ThemeData.dark().textTheme,
      ).apply(
        bodyColor: AppTheme.textPrimary,
        displayColor: AppTheme.textPrimary,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: primary,
        elevation: 0,
        centerTitle: true,
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: primary,
        selectedItemColor: accent,
        unselectedItemColor: AppTheme.textSecondary,
        type: BottomNavigationBarType.fixed,
      ),
      cardTheme: const CardThemeData(
        color: AppTheme.surface,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accent,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 56),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: GoogleFonts.roboto(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  ThemeData _buildLightTheme(Color primary, Color accent) {
    return ThemeData(
      brightness: Brightness.light,
      primaryColor: primary,
      scaffoldBackgroundColor: const Color(0xFFF5F5F5),
      colorScheme: ColorScheme.light(
        primary: accent,
        secondary: accent,
        surface: Colors.white,
        error: AppTheme.safety,
        onPrimary: Colors.white,
        onSecondary: Colors.white,
        onSurface: Colors.black87,
      ),
      textTheme: GoogleFonts.robotoTextTheme(
        ThemeData.light().textTheme,
      ).apply(
        bodyColor: Colors.black87,
        displayColor: Colors.black87,
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: primary,
        elevation: 0,
        centerTitle: true,
        foregroundColor: Colors.white,
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: accent,
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
      ),
      cardTheme: const CardThemeData(
        color: Colors.white,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(12)),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: accent,
          foregroundColor: Colors.white,
          minimumSize: const Size(double.infinity, 56),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: GoogleFonts.roboto(
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
