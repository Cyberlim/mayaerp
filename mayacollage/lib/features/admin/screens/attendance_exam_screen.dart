import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';
import 'mark_attendance_screen.dart';
import 'create_exam_screen.dart';
import 'publish_result_screen.dart';
import '../../../core/services/branch_service.dart';
import '../../../core/services/course_service.dart';
import '../../../core/services/student_service.dart';
import '../../../core/services/attendance_service.dart';

class AttendanceExamScreen extends StatefulWidget {
  const AttendanceExamScreen({super.key});

  @override
  State<AttendanceExamScreen> createState() => _AttendanceExamScreenState();
}

class _AttendanceExamScreenState extends State<AttendanceExamScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  // Attendance Filters
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

  // Removed demo data

  final List<Map<String, dynamic>> _examSchedule = [
    {
      "subject": "Data Structures",
      "date": "12 Mar",
      "time": "10:00 AM",
      "venue": "Hall A",
      "type": "Theory",
      "color": Colors.indigo,
    },
    {
      "subject": "Object Oriented Programming",
      "date": "14 Mar",
      "time": "02:00 PM",
      "venue": "Lab 1",
      "type": "Practical",
      "color": Colors.orange,
    },
    {
      "subject": "Computer Architecture",
      "date": "16 Mar",
      "time": "10:00 AM",
      "venue": "Hall B",
      "type": "Theory",
      "color": Colors.pink,
    },
    {
      "subject": "Software Engineering",
      "date": "18 Mar",
      "time": "09:00 AM",
      "venue": "Seminar Room",
      "type": "Viva",
      "color": Colors.teal,
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
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
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        bool isMobile = constraints.maxWidth < 1100;

        return Container(
          color: const Color(0xFFF8F6F6),
          child: Column(
            children: [
              _buildHeader(isMobile),
              _buildTabBar(isMobile),
              Expanded(
                child: _isLoading 
                  ? const Center(child: CircularProgressIndicator())
                  : TabBarView(
                      controller: _tabController,
                      children: [
                        _buildAttendanceTab(isMobile),
                        _buildExamsTab(isMobile),
                      ],
                    ),
              ),
            ],
          ),
        );
      },
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
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Academic Management",
                      style: AppTheme.titleStyle.copyWith(
                        fontSize: isMobile ? 20 : 26,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    if (!isMobile) ...[
                      const SizedBox(height: 4),
                      Text(
                        "Control attendance, exams, and academic performance",
                        style: TextStyle(
                          color: Colors.grey.shade500,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (!isMobile)
                Row(
                  children: [
                    _gradientBtn(
                      Icons.fact_check_rounded,
                      "Mark Attendance",
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const MarkAttendanceScreen(),
                          ),
                        );
                      },
                    ),
                    const SizedBox(width: 14),
                    _gradientBtn(
                      Icons.upload_file_rounded,
                      "Publish Results",
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const PublishResultScreen(),
                          ),
                        );
                      },
                    ),
                  ],
                ),
            ],
          ),
          if (isMobile) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _gradientBtn(
                    Icons.fact_check_rounded,
                    "Attendance",
                    isMobile: true,
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const MarkAttendanceScreen(),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _gradientBtn(
                    Icons.upload_file_rounded,
                    "Results",
                    isMobile: true,
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => const PublishResultScreen(),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTabBar(bool isMobile) {
    return Container(
      color: Colors.white,
      width: double.infinity,
      padding: EdgeInsets.symmetric(horizontal: isMobile ? 10 : 40),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _tabItem("Attendance", 0, isMobile),
            _tabItem("Exams & Schedule", 1, isMobile),
          ],
        ),
      ),
    );
  }

  Widget _tabItem(String title, int index, bool isMobile) {
    final isSelected = _tabController.index == index;
    return InkWell(
      onTap: () => setState(() => _tabController.index = index),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: EdgeInsets.symmetric(
          horizontal: isMobile ? 16 : 24,
          vertical: isMobile ? 12 : 16,
        ),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: isSelected ? AppColors.primaryRed : Colors.transparent,
              width: 3,
            ),
          ),
        ),
        child: Text(
          title,
          style: TextStyle(
            fontSize: isMobile ? 13 : 14,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? AppColors.primaryRed : Colors.grey.shade500,
          ),
        ),
      ),
    );
  }

  // ─────────── ATTENDANCE TAB ───────────
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
      {
        "label": "Total Students",
        "value": _statsToday['totalStudents'].toString(),
        "sub": "Enrolled",
        "icon": Icons.analytics_rounded,
        "colors": [const Color(0xFF6366F1), const Color(0xFF818CF8)],
      },
      {
        "label": "Present Today",
        "value": _statsToday['presentToday'].toString(),
        "sub": "at campus",
        "icon": Icons.people_rounded,
        "colors": [const Color(0xFF10B981), const Color(0xFF34D399)],
      },
      {
        "label": "On Late",
        "value": _statsToday['lateToday'].toString(),
        "sub": "Arrivals",
        "icon": Icons.event_busy_rounded,
        "colors": [const Color(0xFFF59E0B), const Color(0xFFFBBF24)],
      },
      {
        "label": "Absent Today",
        "value": _statsToday['absentToday'].toString(),
        "sub": "Alerts",
        "icon": Icons.warning_amber_rounded,
        "colors": [const Color(0xFFEC1349), const Color(0xFFFF6B6B)],
      },
    ];

    if (isMobile) {
      return GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        childAspectRatio: 1.25,
        children: List.generate(
          stats.length,
          (i) => _statItem(
            stats[i],
            isMobile,
          ).animate(delay: (i * 100).ms).fadeIn().slideY(begin: 0.1),
        ),
      );
    }

    return Row(
      children: List.generate(stats.length, (i) {
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: i < stats.length - 1 ? 20 : 0),
            child: _statItem(stats[i], isMobile),
          ),
        );
      }),
    ).animate(delay: 50.ms).fadeIn().slideY(begin: 0.1);
  }

  Widget _statItem(Map<String, dynamic> spec, bool isMobile) {
    final colors = spec['colors'] as List<Color>;
    return Container(
      padding: EdgeInsets.all(isMobile ? 16 : 24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(isMobile ? 18 : 22),
        boxShadow: [
          BoxShadow(
            color: colors.last.withValues(alpha: 0.2),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  spec['icon'] as IconData,
                  color: Colors.white,
                  size: isMobile ? 18 : 20,
                ),
              ),
              const Icon(Icons.trending_up, color: Colors.white70, size: 14),
            ],
          ),
          SizedBox(height: isMobile ? 12 : 16),
          Text(
            spec['value'] as String,
            style: TextStyle(
              fontSize: isMobile ? 22 : 28,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              height: 1,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            spec['label'] as String,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: Colors.white.withValues(alpha: 0.9),
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceFilters(bool isMobile) {
    if (isMobile) {
      return Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _filterDropdown(
                        "Dept",
                        _branches.firstWhere((b) => b['_id'] == _selectedDeptId, orElse: () => {'name': ''})['name'],
                        _branches.map((b) => b['name'].toString()).toList(),
                        (v) {
                           final id = _branches.firstWhere((b) => b['name'] == v)['_id'];
                           setState(() => _selectedDeptId = id);
                           _loadStudents();
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _filterDropdown(
                        "Course",
                        _courses.firstWhere((c) => c['_id'] == _selectedCourseId, orElse: () => {'name': ''})['name'],
                        _courses.map((c) => c['name'].toString()).toList(),
                        (v) {
                           final id = _courses.firstWhere((c) => c['name'] == v)['_id'];
                           setState(() => _selectedCourseId = id);
                           _loadStudents();
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _filterDropdown(
                  "Section",
                  _selectedSection,
                  _sections,
                  (v) {
                    setState(() => _selectedSection = v!);
                    _loadStudents();
                  },
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            decoration: InputDecoration(
              hintText: "Search student...",
              hintStyle: TextStyle(fontSize: 13, color: Colors.grey.shade400),
              prefixIcon: Icon(
                Icons.search_rounded,
                color: AppColors.primaryRed,
                size: 18,
              ),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ],
      );
    }

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 15),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: _filterDropdown(
              "Department",
              _branches.firstWhere((b) => b['_id'] == _selectedDeptId, orElse: () => {'name': ''})['name'],
              _branches.map((b) => b['name'].toString()).toList(),
              (v) {
                 final id = _branches.firstWhere((b) => b['name'] == v)['_id'];
                 setState(() => _selectedDeptId = id);
                 _loadStudents();
              },
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _filterDropdown(
              "Course",
              _courses.firstWhere((c) => c['_id'] == _selectedCourseId, orElse: () => {'name': ''})['name'],
              _courses.map((c) => c['name'].toString()).toList(),
              (v) {
                 final id = _courses.firstWhere((c) => c['name'] == v)['_id'];
                 setState(() => _selectedCourseId = id);
                 _loadStudents();
              },
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _filterDropdown(
              "Section",
              _selectedSection,
              _sections,
              (v) {
                setState(() => _selectedSection = v!);
                _loadStudents();
              },
            ),
          ),
          const SizedBox(width: 24),
          Expanded(
            flex: 2,
            child: TextField(
              decoration: InputDecoration(
                hintText: "Search Student ID or Name...",
                hintStyle: TextStyle(fontSize: 13, color: Colors.grey.shade400),
                prefixIcon: Icon(
                  Icons.search_rounded,
                  color: AppColors.primaryRed,
                  size: 20,
                ),
                filled: true,
                fillColor: const Color(0xFFF8F6F6),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ),
          const SizedBox(width: 16),
          _gradientIconButton(Icons.download_rounded, () {}),
        ],
      ),
    );
  }

  Widget _buildAttendanceList(bool isMobile) {
    if (isMobile) {
      return ListView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: _students.length,
        itemBuilder: (context, i) {
          final data = _students[i];
          final status = "Good"; // Placeholder or calc from history
          final statusColor = Colors.green;

          return Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundImage: NetworkImage(data['avatar'] ?? "https://ui-avatars.com/api/?name=${data['firstName']}"),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            "${data['firstName']} ${data['lastName']}",
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          Text(
                            data['studentId'] ?? "N/A",
                            style: TextStyle(
                              color: Colors.grey.shade500,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                    _statusBadge(status, statusColor),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _miniStat("City", data['city'] ?? "N/A", Colors.black),
                    _miniStat(
                      "Phone",
                      data['phone'] ?? "N/A",
                      Colors.orange,
                    ),
                    Row(
                      children: [
                        _iconBtn(Icons.visibility_rounded, Colors.blue),
                        const SizedBox(width: 8),
                        _iconBtn(Icons.mail_outline_rounded, Colors.orange),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ).animate(delay: (i * 50).ms).fadeIn().slideY(begin: 0.05);
        },
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 20),
        ],
      ),
      child: Column(
        children: [
          // Table Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(22),
              ),
            ),
            child: const Row(
              children: [
                Expanded(
                  flex: 3,
                  child: Text(
                    "STUDENT INFO",
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      color: Colors.grey,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Text(
                    "STUDENT ID",
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      color: Colors.grey,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Text(
                    "ATTENDANCE",
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      color: Colors.grey,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Text(
                    "LATE COUNT",
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      color: Colors.grey,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Text(
                    "STATUS",
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      color: Colors.grey,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                SizedBox(
                  width: 80,
                  child: Text(
                    "ACTIONS",
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w900,
                      color: Colors.grey,
                      letterSpacing: 0.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
          ),
          // Table Body
          ...List.generate(_students.length, (i) {
            final data = _students[i];
            final status = "Good";
            final statusColor = Colors.green;

            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
              decoration: BoxDecoration(
                border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
              ),
              child: Row(
                children: [
                  Expanded(
                    flex: 3,
                    child: Row(
                      children: [
                        CircleAvatar(
                          radius: 18,
                          backgroundImage: NetworkImage(data['avatar'] ?? "https://ui-avatars.com/api/?name=${data['firstName']}"),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          "${data['firstName']} ${data['lastName']}",
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    flex: 2,
                    child: Text(
                      data['studentId'] ?? "N/A",
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                  Expanded(
                    flex: 2,
                    child: Text(
                      data['city'] ?? "N/A",
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 14,
                      ),
                    ),
                  ),
                  Expanded(
                    flex: 2,
                    child: Text(
                      data['phone'] ?? "N/A",
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  Expanded(flex: 2, child: _statusBadge(status, statusColor)),
                  SizedBox(
                    width: 80,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _iconBtn(Icons.visibility_rounded, Colors.blue),
                        const SizedBox(width: 8),
                        _iconBtn(Icons.mail_outline_rounded, Colors.orange),
                      ],
                    ),
                  ),
                ],
              ),
            ).animate(delay: (i * 50).ms).fadeIn().slideX(begin: 0.05);
          }),
        ],
      ),
    );
  }

  Widget _miniStat(String label, String val, Color c) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 9,
            color: Colors.grey,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          val,
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: c),
        ),
      ],
    );
  }

  // ─────────── EXAMS TAB ───────────
  Widget _buildExamsTab(bool isMobile) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(isMobile ? 16 : 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildExamDashboardHeader(isMobile),
          SizedBox(height: isMobile ? 24 : 32),
          _buildExamFilters(isMobile),
          SizedBox(height: isMobile ? 24 : 32),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: isMobile ? 1 : 2,
              childAspectRatio: isMobile ? 2.0 : 2.4,
              crossAxisSpacing: 24,
              mainAxisSpacing: 24,
            ),
            itemCount: _examSchedule.length,
            itemBuilder: (_, i) => _examCard(_examSchedule[i], i, isMobile),
          ),
          const SizedBox(height: 48),
          _buildAcademicControls(isMobile),
        ],
      ),
    );
  }

  Widget _buildExamDashboardHeader(bool isMobile) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Exam Schedule",
                    style: AppTheme.titleStyle.copyWith(
                      fontSize: isMobile ? 20 : 24,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  if (!isMobile) ...[
                    const SizedBox(height: 4),
                    Text(
                      "Manage and view all upcoming assessments across departments",
                      style: TextStyle(
                        color: Colors.grey.shade500,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (!isMobile)
              _gradientBtn(
                Icons.add_task_rounded,
                "Create Exam Plan",
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const CreateExamScreen()),
                  );
                },
              ),
          ],
        ),
        if (isMobile) ...[
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: _gradientBtn(
              Icons.add_task_rounded,
              "Create New Exam Plan",
              isMobile: true,
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const CreateExamScreen()),
                );
              },
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildExamFilters(bool isMobile) {
    if (isMobile) {
      return Container(
        margin: const EdgeInsets.symmetric(horizontal: 20),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(18),
        ),
        child: Column(
          children: [
            Row(
              children: [
                const Icon(Icons.filter_list_rounded, color: Colors.indigo, size: 20),
                const SizedBox(width: 12),
                Text(
                  "Filter Exams",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Colors.grey.shade700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _examFilterChip("All Exams", true, isMobile),
                _examFilterChip("Theory", false, isMobile),
                _examFilterChip("Practicals", false, isMobile),
                _examFilterChip("Vivas", false, isMobile),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: _filterDropdown(
                    "Course",
                    _courses.firstWhere((c) => c['_id'] == _selectedCourseId, orElse: () => {'name': ''})['name'],
                    _courses.map((c) => c['name'].toString()).toList(),
                    (v) {
                       final id = _courses.firstWhere((c) => c['name'] == v)['_id'];
                       setState(() => _selectedCourseId = id);
                       _loadStudents();
                    },
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _filterDropdown("Semester", "Sem 1", ["Sem 1", "Sem 2", "Sem 3"], (v) {}),
                ),
              ],
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10),
        ],
      ),
      child: Row(
        children: [
          const Icon(Icons.filter_list_rounded, color: Colors.indigo, size: 20),
          const SizedBox(width: 16),
          _examFilterChip("All Exams", true, isMobile),
          const SizedBox(width: 12),
          _examFilterChip("Theory", false, isMobile),
          const SizedBox(width: 12),
          _examFilterChip("Practicals", false, isMobile),
          const SizedBox(width: 12),
          _examFilterChip("Vivas", false, isMobile),
          const Spacer(),
          SizedBox(
            width: 160,
            child: _filterDropdown(
              "Course",
              _courses.firstWhere((c) => c['_id'] == _selectedCourseId, orElse: () => {'name': ''})['name'],
              _courses.map((c) => c['name'].toString()).toList(),
              (val) {
                 final id = _courses.firstWhere((c) => c['name'] == val)['_id'];
                 setState(() => _selectedCourseId = id);
                 _loadStudents();
              },
            ),
          ),
          const SizedBox(width: 16),
          SizedBox(
            width: 140,
            child: _filterDropdown("Semester", "Sem 1", [
              "Sem 1",
              "Sem 2",
              "Sem 3",
            ], (v) {}),
          ),
        ],
      ),
    );
  }

  Widget _examCard(Map<String, dynamic> exam, int index, bool isMobile) {
    final color = exam['color'] as Color;
    return Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(isMobile ? 20 : 24),
            border: Border.all(color: color.withValues(alpha: 0.08), width: 1.5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 20,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(isMobile ? 20 : 24),
            child: Stack(
              children: [
                Positioned(
                  right: -20,
                  top: -20,
                  child: Icon(
                    Icons.assignment_outlined,
                    size: isMobile ? 100 : 120,
                    color: color.withValues(alpha: 0.04),
                  ),
                ),
                Padding(
                  padding: EdgeInsets.all(isMobile ? 16 : 24),
                  child: Row(
                    children: [
                      Container(
                        width: isMobile ? 50 : 60,
                        height: isMobile ? 50 : 60,
                        decoration: BoxDecoration(
                          color: color.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(18),
                        ),
                        child: Center(
                          child: Icon(
                            _getExamIcon(exam['type']),
                            color: color,
                            size: 24,
                          ),
                        ),
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Row(
                              children: [
                                Text(
                                  exam['type'].toString().toUpperCase(),
                                  style: TextStyle(
                                    color: color,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 1,
                                  ),
                                ),
                                const Spacer(),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.blue.withValues(alpha: 0.05),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    exam['date'],
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 11,
                                      color: Colors.blue,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              exam['subject'],
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: 17,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Row(
                              children: [
                                _examInfoBox(
                                  Icons.schedule_rounded,
                                  exam['time'],
                                ),
                                const SizedBox(width: 12),
                                _examInfoBox(
                                  Icons.location_on_rounded,
                                  exam['venue'],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        )
        .animate(delay: (index * 60).ms)
        .fadeIn()
        .scale(begin: const Offset(0.98, 0.98), curve: Curves.easeOut);
  }

  Widget _examFilterChip(String label, bool isActive, bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 12 : 16,
        vertical: isMobile ? 6 : 8,
      ),
      decoration: BoxDecoration(
        color: isActive
            ? Colors.indigo.withValues(alpha: 0.1)
            : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isActive
              ? Colors.indigo.withValues(alpha: 0.2)
              : Colors.grey.shade200,
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: isActive ? Colors.indigo : Colors.grey.shade600,
          fontSize: isMobile ? 11 : 12,
          fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
        ),
      ),
    );
  }

  IconData _getExamIcon(String type) {
    if (type.contains('Theory')) return Icons.menu_book_rounded;
    if (type.contains('Practical')) return Icons.biotech_rounded;
    return Icons.record_voice_over_rounded;
  }

  Widget _examInfoBox(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F6F6),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: Colors.grey.shade400),
          const SizedBox(width: 4),
          Text(
            text,
            style: TextStyle(
              fontSize: 10,
              color: Colors.grey.shade500,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAcademicControls(bool isMobile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Quick Academic Actions",
          style: TextStyle(
            fontSize: isMobile ? 16 : 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 20),
        if (isMobile)
          Column(
            children: [
              Row(
                children: [
                  _controlCard(
                    "Sections",
                    Icons.layers_rounded,
                    Colors.teal,
                    isMobile,
                  ),
                  const SizedBox(width: 12),
                  _controlCard(
                    "Catalog",
                    Icons.library_books_rounded,
                    Colors.indigo,
                    isMobile,
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  _controlCard(
                    "Subject",
                    Icons.person_search_rounded,
                    Colors.pink,
                    isMobile,
                  ),
                  const SizedBox(width: 12),
                  _controlCard(
                    "Timetable",
                    Icons.calendar_view_week_rounded,
                    Colors.orange,
                    isMobile,
                  ),
                ],
              ),
            ],
          )
        else
          Row(
            children: [
              _controlCard(
                "Manage Sections",
                Icons.layers_rounded,
                Colors.teal,
                isMobile,
              ),
              const SizedBox(width: 20),
              _controlCard(
                "Course Catalog",
                Icons.library_books_rounded,
                Colors.indigo,
                isMobile,
              ),
              const SizedBox(width: 20),
              _controlCard(
                "Subject Allocation",
                Icons.person_search_rounded,
                Colors.pink,
                isMobile,
              ),
              const SizedBox(width: 20),
              _controlCard(
                "Class Timetable",
                Icons.calendar_view_week_rounded,
                Colors.orange,
                isMobile,
              ),
            ],
          ),
      ],
    );
  }

  Widget _controlCard(String label, IconData icon, Color color, bool isMobile) {
    return Expanded(
      child: Container(
        padding: EdgeInsets.all(isMobile ? 16 : 24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(isMobile ? 16 : 20),
          border: Border.all(color: color.withValues(alpha: 0.1)),
          boxShadow: [
            BoxShadow(
              color: color.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: color, size: isMobile ? 22 : 28),
            ),
            const SizedBox(height: 16),
            Text(
              label,
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: isMobile ? 11 : 13,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  // ─────────── HELPERS ───────────
  Widget _gradientBtn(
    IconData icon,
    String label, {
    VoidCallback? onPressed,
    bool isMobile = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryRed.withValues(alpha: 0.3),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ElevatedButton.icon(
        onPressed: onPressed ?? () {},
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          padding: EdgeInsets.symmetric(
            horizontal: isMobile ? 16 : 20,
            vertical: isMobile ? 12 : 14,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        icon: Icon(icon, color: Colors.white, size: isMobile ? 16 : 18),
        label: Text(
          label,
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: isMobile ? 12 : 13,
          ),
        ),
      ),
    );
  }

  Widget _secondaryBtn(
    IconData icon,
    String label, {
    VoidCallback? onPressed,
    bool isMobile = false,
  }) {
    return ElevatedButton.icon(
      onPressed: onPressed ?? () {},
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primaryRed.withValues(alpha: 0.08),
        shadowColor: Colors.transparent,
        padding: EdgeInsets.symmetric(
          horizontal: isMobile ? 16 : 20,
          vertical: isMobile ? 12 : 14,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      icon: Icon(icon, color: AppColors.primaryRed, size: isMobile ? 16 : 18),
      label: Text(
        label,
        style: TextStyle(
          color: AppColors.primaryRed,
          fontWeight: FontWeight.bold,
          fontSize: isMobile ? 12 : 13,
        ),
      ),
    );
  }

  Widget _filterDropdown(
    String label,
    String value,
    List<String> items,
    Function(String?) onChange,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: Colors.grey,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFF8F6F6),
            borderRadius: BorderRadius.circular(10),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              style: const TextStyle(
                color: Colors.black,
                fontSize: 13,
                fontWeight: FontWeight.bold,
              ),
              onChanged: onChange,
              items: items
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _gradientIconButton(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          gradient: AppColors.primaryGradient,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }

  Widget _statusBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Text(
        text,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.bold,
        ),
        textAlign: TextAlign.center,
      ),
    );
  }

  Widget _iconBtn(IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(icon, color: color, size: 16),
    );
  }

  Widget _circleAction(IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        shape: BoxShape.circle,
      ),
      child: Icon(icon, color: color, size: 18),
    );
  }
}
