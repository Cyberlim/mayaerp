import 'package:flutter/material.dart';

class StaffPlaceholderScreen extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color themeColor;

  const StaffPlaceholderScreen({
    super.key,
    required this.title,
    required this.icon,
    this.themeColor = const Color(0xFF10B981),
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
              style: const TextStyle(
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

class StudentsScreen extends StatelessWidget {
  const StudentsScreen({super.key});
  @override
  Widget build(BuildContext context) => const StaffPlaceholderScreen(title: "Students", icon: Icons.people_alt_rounded);
}

class AttendanceScreen extends StatelessWidget {
  const AttendanceScreen({super.key});
  @override
  Widget build(BuildContext context) => const StaffPlaceholderScreen(title: "Attendance", icon: Icons.how_to_reg_rounded);
}

class ExamsScreen extends StatelessWidget {
  const ExamsScreen({super.key});
  @override
  Widget build(BuildContext context) => const StaffPlaceholderScreen(title: "Exams", icon: Icons.assignment_rounded);
}

class ClassesScreen extends StatelessWidget {
  const ClassesScreen({super.key});
  @override
  Widget build(BuildContext context) => const StaffPlaceholderScreen(title: "Classes & Subjects", icon: Icons.class_rounded);
}

class NoticesScreen extends StatelessWidget {
  const NoticesScreen({super.key});
  @override
  Widget build(BuildContext context) => const StaffPlaceholderScreen(title: "Notices", icon: Icons.campaign_rounded);
}

class LeaveScreen extends StatelessWidget {
  const LeaveScreen({super.key});
  @override
  Widget build(BuildContext context) => const StaffPlaceholderScreen(title: "Leave Requests", icon: Icons.event_busy_rounded);
}

class ReportsScreen extends StatelessWidget {
  const ReportsScreen({super.key});
  @override
  Widget build(BuildContext context) => const StaffPlaceholderScreen(title: "Reports", icon: Icons.bar_chart_rounded);
}

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});
  @override
  Widget build(BuildContext context) => const StaffPlaceholderScreen(title: "Profile", icon: Icons.person_rounded);
}
