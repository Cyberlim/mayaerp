import 'package:flutter/material.dart';

class AppColors {
  static const Color primaryRed = Color(0xFFC62828);
  static const Color primaryPink = Color(0xFFEC407A);
  static const Color secondaryRose = Color(0xFFF06292);
  static const Color backgroundBlush = Color(0xFFFFF5F8);
  static const Color cardShadow = Color(0x1A000000);
  static const Color textMain = Color(0xFF0F172A);
  static const Color textSecondary = Color(0xFF64748B);

  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primaryRed, primaryPink],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}

class AppConstants {
  static const String apiBaseUrl = 'http://localhost:5000/api';
  static const String socketUrl = 'http://localhost:5000';
}
