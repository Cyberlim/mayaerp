import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';
import '../../../core/services/branch_service.dart';
import '../../../core/services/course_service.dart';
import '../../../core/services/student_service.dart';
import '../../../core/services/attendance_service.dart';
import 'package:intl/intl.dart';

class MarkAttendanceScreen extends StatefulWidget {
  const MarkAttendanceScreen({super.key});

  @override
  State<MarkAttendanceScreen> createState() => _MarkAttendanceScreenState();
}

class _MarkAttendanceScreenState extends State<MarkAttendanceScreen> {
  List<dynamic> _students = [];
  List<dynamic> _branches = [];
  List<dynamic> _courses = [];
  List<dynamic> _subjects = [];

  String? _selectedDeptId; // Maps to Branch
  String? _selectedCourseId; // Maps to Program
  String? _selectedSubjectCode;
  String? _selectedSubjectName;
  DateTime _selectedDate = DateTime.now();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadMetadata();
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
        if (_courses.isNotEmpty) {
          _selectedCourseId = _courses[0]['_id'];
          _updateSubjects();
        }
        _isLoading = false;
      });
      _loadStudentsAndAttendance();
    } catch (e) {
      debugPrint("Error loading metadata: $e");
      setState(() => _isLoading = false);
    }
  }

  void _updateSubjects() {
    if (_selectedCourseId == null) return;
    final course = _courses.firstWhere((c) => c['_id'] == _selectedCourseId, orElse: () => null);
    if (course != null && course['curriculum'] != null) {
      final List<dynamic> allSubjects = [];
      for (var sem in course['curriculum']) {
        if (sem['subjects'] != null) {
          allSubjects.addAll(sem['subjects']);
        }
      }
      setState(() {
        _subjects = allSubjects;
        if (_subjects.isNotEmpty) {
          _selectedSubjectCode = _subjects[0]['code'];
          _selectedSubjectName = _subjects[0]['name'];
        } else {
          _selectedSubjectCode = null;
          _selectedSubjectName = null;
        }
      });
    }
  }

  Future<void> _loadStudentsAndAttendance() async {
    if (_selectedDeptId == null || _selectedCourseId == null) return;
    
    setState(() => _isLoading = true);
    try {
      // 1. Fetch all students for this branch/course
      final studentsData = await StudentService.getAllStudents();
      // Filter by branch and program (dept and course)
      final filteredStudents = studentsData.where((s) => 
        s['selectedBranch'] == _selectedDeptId && s['selectedProgram'] == _selectedCourseId
      ).toList();

      // 2. Fetch attendance for this date
      final dateStr = _selectedDate.toIso8601String().split('T')[0];
      final attendanceData = (_selectedSubjectCode == null) ? [] : await AttendanceService.getAttendanceHistory(
        dateStr, 
        _selectedDeptId!, 
        _selectedCourseId!, 
        _selectedSubjectName!,
        _selectedSubjectCode!
      );

      // 3. Merge
      setState(() {
        _students = filteredStudents.map((s) {
          final att = attendanceData.firstWhere(
            (a) => a['student'] == s['_id'],
            orElse: () => null,
          );
          return {
            "_id": s['_id'],
            "name": "${s['firstName']} ${s['lastName']}",
            "id": s['studentId'] ?? "N/A",
            "avatar": s['avatar'] ?? "https://ui-avatars.com/api/?name=${s['firstName']}",
            "isPresent": att != null ? (att['status'] == 'Present' || att['status'] == 'Late') : false,
            "isLate": att != null ? att['isLate'] == true : false,
          };
        }).toList();
        _isLoading = false;
      });
    } catch (e) {
      debugPrint("Error loading students: $e");
      setState(() => _isLoading = false);
    }
  }

  Future<void> _submitAttendance() async {
    setState(() => _isLoading = true);
    try {
      final dateStr = _selectedDate.toIso8601String().split('T')[0];
      final List<Map<String, dynamic>> list = _students.map((s) => {
        "student": s['_id'],
        "studentId": s['id'],
        "studentName": s['name'],
        "status": s['isPresent'] ? (s['isLate'] ? 'Late' : 'Present') : 'Absent',
        "isLate": s['isLate'],
      }).toList();

      await AttendanceService.submitAttendanceBulk(
        date: dateStr,
        attendanceList: list,
        department: _selectedDeptId!,
        course: _selectedCourseId!,
        section: "Section A", // Defaulting to Section A for this screen or extract from student data
        subject: _selectedSubjectName!,
        subjectCode: _selectedSubjectCode!,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Attendance marked successfully!")),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error: $e")),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    int presentCount = _students.where((s) => s['isPresent']).length;
    int absentCount = _students.length - presentCount;

    return LayoutBuilder(
      builder: (context, constraints) {
        final isMobile = constraints.maxWidth < 1100;

        return Scaffold(
          backgroundColor: const Color(0xFFF8F6F6),
          body: _isLoading 
            ? const Center(child: CircularProgressIndicator())
            : isMobile
              ? Column(
                  children: [
                    _buildMobileHeader(presentCount, absentCount),
                    Expanded(
                      child: ListView.builder(
                        padding: const EdgeInsets.all(20),
                        itemCount: _students.length,
                        itemBuilder: (context, index) =>
                            _studentAttendanceRow(_students[index], index, isMobile),
                      ),
                    ),
                    _buildBulkActions(isMobile),
                  ],
                )
              : Row(
                  children: [
                    // ── LEFT: Filters ──
                    Container(
                      width: 340,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF1E1E2C), Color(0xFF2D2D44)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                      ),
                      child: Stack(
                        children: [
                          Positioned(top: -50, right: -50, child: _blob(200, 0.05)),
                          Padding(
                            padding: const EdgeInsets.all(32),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _backButton(context),
                                const SizedBox(height: 48),
                                const Text(
                                  "Attendance Tracking",
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 28,
                                    letterSpacing: -1,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  "Select class criteria to load student list and mark attendance.",
                                  style: TextStyle(
                                    color: Colors.white.withValues(alpha: 0.6),
                                    fontSize: 13,
                                  ),
                                ),
                                const SizedBox(height: 40),

                                _filterLabel("DEPARTMENT"),
                                _sidebarDropdown(
                                  _branches.map((b) => b['name'].toString()).toList(),
                                  _branches.firstWhere((b) => b['_id'] == _selectedDeptId, orElse: () => {'name': ''})['name'],
                                  (val) {
                                    final id = _branches.firstWhere((b) => b['name'] == val)['_id'];
                                    setState(() => _selectedDeptId = id);
                                    _loadStudentsAndAttendance();
                                  },
                                ),
                                const SizedBox(height: 20),

                                _filterLabel("COURSE / BRANCH"),
                                _sidebarDropdown(
                                  _courses.map((c) => c['name'].toString()).toList(),
                                  _courses.firstWhere((c) => c['_id'] == _selectedCourseId, orElse: () => {'name': ''})['name'],
                                  (val) {
                                    final id = _courses.firstWhere((c) => c['name'] == val)['_id'];
                                    setState(() => _selectedCourseId = id);
                                    setState(() {
                                      _selectedCourseId = id;
                                      _updateSubjects(); // Update subjects when course changes
                                    });
                                    _loadStudentsAndAttendance();
                                  },
                                ),
                                const SizedBox(height: 20),

                                 _filterLabel("SUBJECT"),
                                 _sidebarDropdown(
                                   _subjects.map((s) => s['name'].toString()).toList(),
                                   _subjects.firstWhere((s) => s['code'] == _selectedSubjectCode, orElse: () => {'name': 'Select Subject'})['name'],
                                   (val) {
                                     final sub = _subjects.firstWhere((s) => s['name'] == val);
                                     setState(() {
                                       _selectedSubjectCode = sub['code'];
                                       _selectedSubjectName = sub['name'];
                                     });
                                     _loadStudentsAndAttendance();
                                   },
                                 ),

                                const Spacer(),

                                _miniStat(
                                  "Total",
                                  _students.length.toString(),
                                  Colors.blue,
                                ),
                                const SizedBox(height: 12),
                                _miniStat(
                                  "Present Today",
                                  presentCount.toString(),
                                  Colors.green,
                                ),
                                const SizedBox(height: 12),
                                _miniStat(
                                  "Absent",
                                  absentCount.toString(),
                                  Colors.orange,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),

                    // ── RIGHT: Student List ──
                    Expanded(
                      child: Column(
                        children: [
                          _buildListHeader(isMobile),
                          Expanded(
                            child: ListView.builder(
                              padding: const EdgeInsets.all(32),
                              itemCount: _students.length,
                              itemBuilder: (context, index) =>
                                  _studentAttendanceRow(_students[index], index, isMobile),
                            ),
                          ),
                          _buildBulkActions(isMobile),
                        ],
                      ),
                    ),
                  ],
                ),
        );
      },
    );
  }

  Widget _buildMobileHeader(int present, int absent) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 50, 20, 24),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1E1E2C), Color(0xFF2D2D44)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(32),
          bottomRight: Radius.circular(32),
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              _backButton(context),
              const Spacer(),
              const Text(
                "Mark Attendance",
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const Spacer(),
              const SizedBox(width: 40), // Balance
            ],
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _mobileMiniStat("Total", _students.length.toString(), Colors.blue),
              _mobileMiniStat("Present", present.toString(), Colors.greenAccent),
              _mobileMiniStat("Absent", absent.toString(), Colors.orangeAccent),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: _sidebarDropdown(
                  _branches.map((b) => b['name'].toString()).toList(),
                  _branches.firstWhere((b) => b['_id'] == _selectedDeptId, orElse: () => {'name': ''})['name'],
                  (val) {
                    final id = _branches.firstWhere((b) => b['name'] == val)['_id'];
                    setState(() => _selectedDeptId = id);
                    _loadStudentsAndAttendance();
                  },
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _sidebarDropdown(
                  _subjects.map((s) => s['name'].toString()).toList(),
                  _subjects.firstWhere((s) => s['code'] == _selectedSubjectCode, orElse: () => {'name': 'Select'})['name'],
                  (val) {
                    final sub = _subjects.firstWhere((s) => s['name'] == val);
                    setState(() {
                      _selectedSubjectCode = sub['code'];
                      _selectedSubjectName = sub['name'];
                    });
                    _loadStudentsAndAttendance();
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _mobileMiniStat(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.w900,
            fontSize: 18,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withValues(alpha: 0.5),
            fontSize: 10,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _blob(double size, double opacity) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      color: Colors.white.withValues(alpha: opacity),
    ),
  );

  Widget _backButton(BuildContext context) {
    return InkWell(
      onTap: () => Navigator.pop(context),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.arrow_back_ios_new_rounded,
              color: Colors.white,
              size: 14,
            ),
            SizedBox(width: 8),
            Text(
              "Back",
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _filterLabel(String label) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(
      label,
      style: TextStyle(
        color: Colors.white.withValues(alpha: 0.5),
        fontSize: 10,
        fontWeight: FontWeight.bold,
        letterSpacing: 1.2,
      ),
    ),
  );

  Widget _sidebarDropdown(
    List<String> items,
    String? value,
    Function(String?) onChanged,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          dropdownColor: const Color(0xFF2D2D44),
          icon: const Icon(
            Icons.keyboard_arrow_down_rounded,
            color: Colors.white54,
          ),
          isExpanded: true,
          hint: Text(
            "Select",
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.3),
              fontSize: 13,
            ),
          ),
          items: items
              .map(
                (e) => DropdownMenuItem(
                  value: e,
                  child: Text(
                    e,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                  ),
                ),
              )
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _miniStat(String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.7),
              fontSize: 12,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildListHeader(bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 20 : 48,
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
              Row(
                children: [
                  if (!isMobile) ...[
                    _headerActionBtn(
                      "Submit Today's Attendance", 
                      AppColors.primaryRed, 
                      _submitAttendance
                    ),
                    const SizedBox(width: 16),
                  ],
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "${_courses.firstWhere((c) => c['_id'] == _selectedCourseId, orElse: () => {'name': 'Select'})['name']} - ${_selectedSubjectName ?? 'Select Subject'}",
                        style: AppTheme.titleStyle.copyWith(fontSize: isMobile ? 18 : 22),
                      ),
                      _buildCalendarCarousel(isMobile),
                    ],
                  ),
                ],
              ),
              if (!isMobile)
                Row(
                  children: [
                    _headerActionBtn("Mark All Present", Colors.green, () {
                      setState(() {
                        for (var s in _students) {
                          s['isPresent'] = true;
                        }
                      });
                    }),
                    const SizedBox(width: 12),
                    _headerActionBtn("Mark All Absent", Colors.red, () {
                      setState(() {
                        for (var s in _students) {
                          s['isPresent'] = false;
                        }
                      });
                    }),
                  ],
                ),
            ],
          ),
          if (isMobile) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _headerActionBtn("All Present", Colors.green, () {
                    setState(() {
                      for (var s in _students) {
                        s['isPresent'] = true;
                      }
                    });
                  }),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _headerActionBtn("All Absent", Colors.red, () {
                    setState(() {
                      for (var s in _students) {
                        s['isPresent'] = false;
                      }
                    });
                  }),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _headerActionBtn(String label, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: color,
            fontSize: 12,
            fontWeight: FontWeight.w900,
          ),
        ),
      ),
    );
  }

  Widget _studentAttendanceRow(Map<String, dynamic> student, int index, bool isMobile) {
    bool present = student['isPresent'];
    bool late = student['isLate'];

    if (isMobile) {
      return Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundImage: NetworkImage(student['avatar']),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        student['name'],
                        style: const TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        student['id'],
                        style: TextStyle(
                          color: Colors.grey.shade500,
                          fontSize: 11,
                        ),
                      ),
                    ],
                  ),
                ),
                _lateToggle(student, isMobile),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _attendanceStatusBtn(
                    "ABSENT",
                    !present,
                    Colors.red,
                    isMobile,
                    () => setState(() => student['isPresent'] = false),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _attendanceStatusBtn(
                    "PRESENT",
                    present,
                    Colors.green,
                    isMobile,
                    () => setState(() => student['isPresent'] = true),
                  ),
                ),
              ],
            ),
          ],
        ),
      ).animate(delay: (index * 40).ms).fadeIn().slideY(begin: 0.05);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 20,
            backgroundImage: NetworkImage(student['avatar']),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  student['name'],
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 15,
                  ),
                ),
                Text(
                  student['id'],
                  style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),

          _lateToggle(student, isMobile),
          const SizedBox(width: 24),

          // Attendance Toggle
          Row(
            children: [
              _attendanceStatusBtn(
                "ABSENT",
                !present,
                Colors.red,
                isMobile,
                () => setState(() => student['isPresent'] = false),
              ),
              const SizedBox(width: 8),
              _attendanceStatusBtn(
                "PRESENT",
                present,
                Colors.green,
                isMobile,
                () => setState(() => student['isPresent'] = true),
              ),
            ],
          ),
        ],
      ),
    ).animate(delay: (index * 40).ms).fadeIn().slideX(begin: 0.05);
  }

  Widget _lateToggle(Map<String, dynamic> student, bool isMobile) {
    bool late = student['isLate'];
    return InkWell(
      onTap: () => setState(() => student['isLate'] = !student['isLate']),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: EdgeInsets.symmetric(
          horizontal: isMobile ? 10 : 14,
          vertical: isMobile ? 6 : 8,
        ),
        decoration: BoxDecoration(
          color: late ? Colors.orange : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.schedule_rounded,
              color: late ? Colors.white : Colors.grey,
              size: isMobile ? 14 : 16,
            ),
            const SizedBox(width: 8),
            Text(
              late ? "LATE" : (isMobile ? "TIME" : "ON TIME"),
              style: TextStyle(
                color: late ? Colors.white : Colors.grey,
                fontSize: 10,
                fontWeight: FontWeight.w900,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _attendanceStatusBtn(
    String label,
    bool active,
    Color color,
    bool isMobile,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: isMobile ? double.infinity : 100,
        padding: EdgeInsets.symmetric(vertical: isMobile ? 12 : 10),
        decoration: BoxDecoration(
          color: active ? color : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: active ? color : Colors.grey.shade200,
            width: 2,
          ),
        ),
        child: Center(
          child: Text(
            label,
            style: TextStyle(
              color: active ? Colors.white : Colors.grey.shade400,
              fontWeight: FontWeight.w900,
              fontSize: isMobile ? 12 : 11,
              letterSpacing: 1,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCalendarCarousel(bool isMobile) {
    return Container(
      height: 45,
      margin: const EdgeInsets.only(top: 8),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: 15,
        shrinkWrap: true,
        itemBuilder: (context, index) {
          final date = DateTime.now().subtract(Duration(days: 7 - index));
          final isSelected = DateFormat('yyyy-MM-dd').format(date) == 
                             DateFormat('yyyy-MM-dd').format(_selectedDate);
          
          return GestureDetector(
            onTap: () {
              setState(() => _selectedDate = date);
              _loadStudentsAndAttendance();
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.only(right: 10),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primaryRed : Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isSelected ? AppColors.primaryRed : Colors.grey.shade200,
                ),
                boxShadow: isSelected ? [
                  BoxShadow(
                    color: AppColors.primaryRed.withValues(alpha: 0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  )
                ] : [],
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    DateFormat('E').format(date).toUpperCase(),
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? Colors.white70 : Colors.grey,
                    ),
                  ),
                  Text(
                    DateFormat('dd').format(date),
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w900,
                      color: isSelected ? Colors.white : Colors.black,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildBulkActions(bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 20 : 48,
        vertical: isMobile ? 16 : 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFF1F1F1))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (!isMobile)
            Row(
              children: [
                Icon(
                  Icons.info_outline_rounded,
                  color: Colors.grey.shade400,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Text(
                  "Tip: Click 'Mark All Present' to quickly finish marking for the day.",
                  style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 13,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primaryRed.withValues(alpha: 0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: ElevatedButton.icon(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(
                  Icons.cloud_done_rounded,
                  color: Colors.white,
                  size: 20,
                ),
                label: Text(
                  isMobile ? "Save Attendance" : "Save & Submit Attendance",
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  padding: EdgeInsets.symmetric(
                    horizontal: isMobile ? 20 : 32,
                    vertical: isMobile ? 18 : 20,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
