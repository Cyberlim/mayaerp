import 'package:flutter/material.dart';
import '../../../widgets/admin_sidebar.dart';
import 'admin_dashboard.dart';
import 'user_management_screen.dart';
import 'student_management_screen.dart';
import 'admission_management_screen.dart';
import 'finance_fees_screen.dart';
import 'exams_screen.dart';
import 'attendance_screen.dart';
import 'time_table_management_screen.dart';
import 'library_management_screen.dart';
import 'reports_settings_screen.dart';
import 'inquiries_screen.dart';
import 'transport_management_screen.dart';
import 'academic_management_screen.dart';

class AdminShell extends StatefulWidget {
  const AdminShell({super.key});

  @override
  State<AdminShell> createState() => _AdminShellState();
}

class _AdminShellState extends State<AdminShell> {
  int _selectedIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  final List<Widget> _screens = [
    const AdminDashboard(), // 0
    const AdmissionManagementScreen(), // 1
    const AcademicManagementScreen(), // 2
    const FinanceFeesScreen(), // 3
    const UserManagementScreen(), // 4
    const StudentManagementScreen(), // 5
    const ExamsScreen(key: ValueKey('exams')), // 6
    const LibraryManagementScreen(), // 7
    const ReportsSettingsScreen(), // 8
    const InquiriesScreen(), // 9
    const TransportManagementScreen(), // 10
    const TimeTableManagementScreen(key: ValueKey('timetable')), // 11
    const AttendanceScreen(key: ValueKey('attendance')), // 12
  ];

  @override
  Widget build(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 1100;

    return Scaffold(
      key: _scaffoldKey,
      drawer: Drawer(
        width: 280,
        backgroundColor: Colors.white,
        child: AdminSidebar(
          selectedIndex: _selectedIndex,
          onItemSelected: (index) {
            setState(() => _selectedIndex = index);
            Navigator.pop(context);
          },
        ),
      ),
      body: Row(
        children: [
          if (!isMobile)
            AdminSidebar(
              selectedIndex: _selectedIndex,
              onItemSelected: (index) {
                setState(() => _selectedIndex = index);
              },
            ),
          Expanded(
            child: IndexedStack(
              index: _selectedIndex,
              children: _screens,
            ),
          ),
        ],
      ),
    );
  }
}
