import 'package:flutter/material.dart';

class PlaceholderScreen extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color themeColor;

  const PlaceholderScreen({
    super.key,
    required this.title,
    required this.icon,
    this.themeColor = const Color(0xFF4F46E5),
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: const Color(0xFFF8FAFC),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: themeColor.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 80, color: themeColor),
            ),
            const SizedBox(height: 32),
            Text(
              title,
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.w900,
                color: Colors.black87,
                letterSpacing: -1,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              "This module is currently under development.",
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class BookReturnScreen extends StatelessWidget {
  const BookReturnScreen({super.key});
  @override
  Widget build(BuildContext context) => const PlaceholderScreen(
        title: "Book Return",
        icon: Icons.inbox_rounded,
        themeColor: Color(0xFF10B981),
      );
}

class BookSearchScreen extends StatelessWidget {
  const BookSearchScreen({super.key});
  @override
  Widget build(BuildContext context) => const PlaceholderScreen(
      title: "Book Search", icon: Icons.search_rounded);
}

class ReportsAnalyticsScreen extends StatelessWidget {
  const ReportsAnalyticsScreen({super.key});
  @override
  Widget build(BuildContext context) => const PlaceholderScreen(
        title: "Reports & Analytics",
        icon: Icons.bar_chart_rounded,
        themeColor: Color(0xFF9333EA),
      );
}

class VendorsScreen extends StatelessWidget {
  const VendorsScreen({super.key});
  @override
  Widget build(BuildContext context) => const PlaceholderScreen(
      title: "Vendors", icon: Icons.storefront_rounded);
}
