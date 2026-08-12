import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../widgets/staff_sidebar.dart';
import '../widgets/staff_bottom_bar.dart';
import 'staff_dashboard_screen.dart';
import 'staff_students_screen.dart';
import 'staff_attendance_screen.dart';
import 'staff_time_table_screen.dart';
import 'staff_notices_screen.dart';
import 'staff_leave_screen.dart';
import 'staff_profile_screen.dart';

class StaffShell extends StatefulWidget {
  const StaffShell({super.key});

  @override
  State<StaffShell> createState() => _StaffShellState();
}

class _StaffShellState extends State<StaffShell> {
  int _selectedIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  final List<Widget> _screens = [
    const StaffDashboardScreen(),
    const StaffStudentsScreen(),
    const StaffAttendanceScreen(),
    const StaffTimeTableScreen(),
    const StaffNoticesScreen(),
    const StaffLeaveScreen(),
    const StaffProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 1100;

    return Scaffold(
      key: _scaffoldKey,
      drawer: Drawer(
        width: 280,
        backgroundColor: Colors.white,
        child: StaffSidebar(
          selectedIndex: _selectedIndex,
          onItemSelected: (index) {
            setState(() => _selectedIndex = index);
            Navigator.pop(context); // Close drawer
          },
        ),
      ),
      body: Stack(
        children: [
          Row(
            children: [
              if (!isMobile)
                StaffSidebar(
                  selectedIndex: _selectedIndex,
                  onItemSelected: (index) {
                    setState(() => _selectedIndex = index);
                  },
                ),
              Expanded(
                child: Stack(
                  children: [
                    if (isMobile && _selectedIndex == 0)
                      Container(
                        height: 360,
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Color(0xFFFCE4EC), Color(0xFFF8F6F6)],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                          ),
                          borderRadius: BorderRadius.only(
                            bottomLeft: Radius.circular(50),
                            bottomRight: Radius.circular(50),
                          ),
                        ),
                      ),
                    Column(
                      children: [
                        if (isMobile) _buildMobileNavbar(isTransparent: _selectedIndex == 0),
                        Expanded(
                          child: Padding(
                            padding: EdgeInsets.only(bottom: isMobile ? 100 : 0),
                            child: IndexedStack(
                              index: _selectedIndex,
                              children: _screens,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (isMobile)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  StaffBottomBar(
                    selectedIndex: _selectedIndex,
                    onItemSelected: (index) {
                      setState(() => _selectedIndex = index);
                    },
                  ),
                  StaffBottomBar.floatingCenterButton(context, () {
                    // Logic for "More Modules"
                    _showMoreMenu(context);
                  }),
                ],
              ),
            ),
        ],
      ),
    );
  }

  void _showMoreMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) => _moreMenuSlider(context),
    );
  }

  Widget _moreMenuSlider(BuildContext context) {
    final List<Map<String, dynamic>> moreItems = [
      {"icon": Icons.schedule_rounded, "label": "Time Table", "index": 3},
      {"icon": Icons.campaign_rounded, "label": "Notices", "index": 4},
      {"icon": Icons.event_busy_rounded, "label": "Leave Requests", "index": 5},
      {"icon": Icons.person_rounded, "label": "Profile", "index": 6},
    ];

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(32),
          topRight: Radius.circular(32),
        ),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 50,
            height: 5,
            decoration: BoxDecoration(
              color: Colors.grey.shade200,
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          const SizedBox(height: 32),
          const Text(
            "More Modules",
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: Color(0xFF1E293B),
            ),
          ),
          const SizedBox(height: 24),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 20,
              crossAxisSpacing: 20,
              childAspectRatio: 1,
            ),
            itemCount: moreItems.length,
            itemBuilder: (context, index) {
              final item = moreItems[index];
              return _menuGridItem(context, item);
            },
          ),
          const SizedBox(height: 16),
        ],
      ),
    ).animate().slideY(begin: 1.0, curve: Curves.easeOutCubic, duration: 400.ms);
  }

  Widget _menuGridItem(BuildContext context, Map<String, dynamic> item) {
    bool isSelected = _selectedIndex == item['index'];
    return GestureDetector(
      onTap: () {
        setState(() => _selectedIndex = item['index']);
        Navigator.pop(context);
      },
      child: Container(
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF10B981).withValues(alpha: 0.05) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF10B981).withValues(alpha: 0.2) : Colors.grey.shade100,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF10B981) : Colors.white,
                shape: BoxShape.circle,
              ),
              child: Icon(
                item['icon'],
                color: isSelected ? Colors.white : Colors.grey.shade600,
                size: 24,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              item['label'],
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: isSelected ? const Color(0xFF10B981) : Colors.grey.shade700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMobileNavbar({bool isTransparent = false}) {
    return Container(
      height: 75,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: isTransparent ? Colors.transparent : Colors.white,
        boxShadow: isTransparent ? [] : [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          IconButton(
            onPressed: () => _scaffoldKey.currentState?.openDrawer(),
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isTransparent ? Colors.black.withValues(alpha: 0.05) : const Color(0xFF10B981).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(Icons.menu_rounded, color: isTransparent ? const Color(0xFF1E293B) : const Color(0xFF10B981), size: 20),
            ),
          ),
          const SizedBox(width: 12),
          Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Maya ERP",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: const Color(0xFF1E293B),
                ),
              ),
              Text(
                "STAFF PORTAL",
                style: TextStyle(
                  fontSize: 9,
                  fontWeight: FontWeight.bold,
                  color: isTransparent ? const Color(0xFF10B981) : const Color(0xFF10B981),
                  letterSpacing: 1,
                ),
              ),
            ],
          ),
          const Spacer(),
          Stack(
            children: [
              const CircleAvatar(
                radius: 20,
                backgroundColor: Color(0xFFF1F5F9),
                backgroundImage: NetworkImage("https://i.pravatar.cc/150?u=IT2023-042"),
              ),
              Positioned(
                right: 0,
                bottom: 0,
                child: Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: Colors.green,
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
