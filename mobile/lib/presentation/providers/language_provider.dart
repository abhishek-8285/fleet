import 'package:flutter/material.dart';

class LanguageProvider extends ChangeNotifier {
  Locale _locale = const Locale('en');

  Locale get locale => _locale;

  void setLocale(Locale locale) {
    if (!['en', 'hi'].contains(locale.languageCode)) return;
    _locale = locale;
    notifyListeners();
  }

  void toggleLanguage() {
    if (_locale.languageCode == 'en') {
      setLocale(const Locale('hi'));
    } else {
      setLocale(const Locale('en'));
    }
  }
}
