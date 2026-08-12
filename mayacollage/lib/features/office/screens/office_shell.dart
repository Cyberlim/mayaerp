import 'package:flutter/material.dart';
import '../widgets/office_sidebar.dart';
import '../../admin/screens/admin_dashboard.dart';
import '../../admin/screens/user_management_screen.dart';
import '../../admin/screens/student_management_screen.dart';
import '../../admin/screens/admission_management_screen.dart';
import '../../admin/screens/finance_fees_screen.dart';
import '../../admin/screens/reports_settings_screen.dart';
import '../../admin/screens/inquiries_screen.dart';
import '../../admin/screens/transport_management_screen.dart';

class OfficeShell extends StatefulWidget {
  const OfficeShell({super.key});

  @override
  State<OfficeShell> createState() => _OfficeShellState();
}

class _OfficeShellState extends State<OfficeShell> {
  int _selectedIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  final List<Widget> _screens = [
    const AdminDashboard(), // 0
    const AdmissionManagementScreen(), // 1
    const SizedBox(), // Placeholder for Academics (index 2 in sidebar logic usually)
    const FinanceFeesScreen(), // 3
    const UserManagementScreen(), // 4
    const StudentManagementScreen(), // 5
    const SizedBox(), // Placeholder 6
    const SizedBox(), // Placeholder 7
    const ReportsSettingsScreen(), // 8
    const InquiriesScreen(), // 9
    const TransportManagementScreen(), // 10
  ];

  @override
  Widget build(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 1100;

    return Scaffold(
      key: _scaffoldKey,
      drawer: Drawer(
        width: 280,
        backgroundColor: Colors.white,
        child: OfficeSidebar(
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
            OfficeSidebar(
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
