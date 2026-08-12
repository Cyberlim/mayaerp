import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';
import 'mark_attendance_screen.dart';
import '../../../core/services/branch_service.dart';
import '../../../core/services/course_service.dart';
import '../../../core/services/student_service.dart';
import '../../../core/services/attendance_service.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  List<dynamic> _branches = [];
  List<dynamic> _courses = [];
  final List<String> _sections = ['Section A', 'Section B', 'Section C'];

  String? _selectedDeptId;
  String? _selectedCourseId;
  String _selectedSection = 'Section A';

  bool _isLoading = false;
  List<dynamic> _students = [];
  Map<String, dynamic> _statsToday = {
    'presentToday': 0,
    'lateToday': 0,
    'totalStudents': 0,
    'absentToday': 0
  };

  @override
  void initState() {
    super.initState();
    _loadMetadata();
    _loadStats();
  }

  Future<void> _loadMetadata() async {
    setState(() => _isLoading = true);
    try {
      final br = await BranchService.getAllBranches();
      final cr = await CourseService.getAllCourses();
      setState(() {
        _branches = br;
        _courses = cr;
        if (_branches.isNotEmpty) _selectedDeptId = _branches[0]['_id'];
        if (_courses.isNotEmpty) _selectedCourseId = _courses[0]['_id'];
      });
      _loadStudents();
    } catch (e) {
      debugPrint("Error loading metadata: $e");
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadStats() async {
    try {
      final s = await AttendanceService.getAttendanceStats();
      setState(() => _statsToday = s);
    } catch (e) {
      debugPrint("Error loading stats: $e");
    }
  }

  Future<void> _loadStudents() async {
    if (_selectedDeptId == null || _selectedCourseId == null) return;
    setState(() => _isLoading = true);
    try {
      final all = await StudentService.getAllStudents();
      setState(() {
        _students = all.where((s) => 
          s['selectedBranch'] == _selectedDeptId && s['selectedProgram'] == _selectedCourseId
        ).toList();
        _isLoading = false;
      });
    } catch (e) {
      debugPrint("Error loading students: $e");
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 1100;

    return Container(
      color: const Color(0xFFF8F6F6),
      child: Column(
        children: [
          _buildHeader(isMobile),
          Expanded(
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator())
              : _buildAttendanceTab(isMobile),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 20 : 40,
        vertical: isMobile ? 16 : 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFF1F1F1))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Attendance Tracker",
                style: AppTheme.titleStyle.copyWith(
                  fontSize: isMobile ? 20 : 26,
                  fontWeight: FontWeight.w900,
                ),
              ),
              if (!isMobile)
                Text("Monitor and manage daily student presence", style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
            ],
          ),
          ElevatedButton.icon(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const MarkAttendanceScreen())),
            icon: const Icon(Icons.fact_check_rounded, size: 18),
            label: const Text("Mark Attendance"),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryRed,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceTab(bool isMobile) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(isMobile ? 16 : 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildAttendanceStats(isMobile),
          SizedBox(height: isMobile ? 24 : 32),
          _buildAttendanceFilters(isMobile),
          const SizedBox(height: 24),
          _buildAttendanceList(isMobile),
        ],
      ),
    );
  }

  Widget _buildAttendanceStats(bool isMobile) {
    final stats = [
      {"label": "Total Enrolled", "value": _statsToday['totalStudents'].toString(), "icon": Icons.analytics_rounded, "colors": [const Color(0xFF6366F1), const Color(0xFF818CF8)]},
      {"label": "Present Today", "value": _statsToday['presentToday'].toString(), "icon": Icons.people_rounded, "colors": [const Color(0xFF10B981), const Color(0xFF34D399)]},
      {"label": "Late Arrival", "value": _statsToday['lateToday'].toString(), "icon": Icons.event_busy_rounded, "colors": [const Color(0xFFF59E0B), const Color(0xFFFBBF24)]},
      {"label": "Absent Alerts", "value": _statsToday['absentToday'].toString(), "icon": Icons.warning_amber_rounded, "colors": [const Color(0xFFEC1349), const Color(0xFFFF6B6B)]},
    ];

    return Row(
      children: stats.map((s) => Expanded(
        child: Container(
          margin: const EdgeInsets.only(right: 16),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: LinearGradient(colors: s['colors'] as List<Color>),
            borderRadius: BorderRadius.circular(22),
            boxShadow: [BoxShadow(color: (s['colors'] as List<Color>).last.withValues(alpha: 0.2), blurRadius: 15, offset: const Offset(0, 8))],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(s['icon'] as IconData, color: Colors.white, size: 20),
              const SizedBox(height: 16),
              Text(s['value'].toString(), style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Colors.white)),
              Text(s['label'].toString(), style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white.withValues(alpha: 0.9))),
            ],
          ),
        ),
      )).toList(),
    ).animate().fadeIn().slideY(begin: 0.1);
  }

  Widget _buildAttendanceFilters(bool isMobile) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(18)),
      child: Row(
        children: [
          Expanded(child: _filterDropdown("Department", _branches.firstWhere((b) => b['_id'] == _selectedDeptId, orElse: () => {'name': ''})['name'], _branches.map((b) => b['name'].toString()).toList(), (v) {
            final id = _branches.firstWhere((b) => b['name'] == v)['_id'];
            setState(() => _selectedDeptId = id);
            _loadStudents();
          })),
          const SizedBox(width: 16),
          Expanded(child: _filterDropdown("Course", _courses.firstWhere((c) => c['_id'] == _selectedCourseId, orElse: () => {'name': ''})['name'], _courses.map((c) => c['name'].toString()).toList(), (v) {
            final id = _courses.firstWhere((c) => c['name'] == v)['_id'];
            setState(() => _selectedCourseId = id);
            _loadStudents();
          })),
          const SizedBox(width: 16),
          Expanded(child: _filterDropdown("Section", _selectedSection, _sections, (v) {
            setState(() => _selectedSection = v!);
            _loadStudents();
          })),
          const SizedBox(width: 24),
          Expanded(flex: 2, child: TextField(decoration: InputDecoration(hintText: "Search...", prefixIcon: const Icon(Icons.search_rounded), filled: true, fillColor: const Color(0xFFF8F6F6), border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none)))),
        ],
      ),
    );
  }

  Widget _filterDropdown(String label, String value, List<String> items, Function(String?) onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(color: const Color(0xFFF8F6F6), borderRadius: BorderRadius.circular(10)),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: items.contains(value) ? value : null,
              isExpanded: true,
              items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)))).toList(),
              onChanged: onChanged,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAttendanceList(bool isMobile) {
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(22)),
      child: ListView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: _students.length,
        itemBuilder: (context, i) {
          final data = _students[i];
          return ListTile(
            leading: CircleAvatar(backgroundImage: NetworkImage(data['avatar'] ?? "https://ui-avatars.com/api/?name=${data['firstName']}")),
            title: Text("${data['firstName']} ${data['lastName']}", style: const TextStyle(fontWeight: FontWeight.bold)),
            subtitle: Text(data['studentId'] ?? "N/A"),
            trailing: const Icon(Icons.chevron_right_rounded),
          );
        },
      ),
    );
  }
}
