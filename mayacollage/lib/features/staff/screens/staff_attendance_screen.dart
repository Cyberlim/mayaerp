import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../../core/services/branch_service.dart';
import '../../../core/services/course_service.dart';
import '../../../core/services/attendance_service.dart';

class StaffAttendanceScreen extends StatefulWidget {
  const StaffAttendanceScreen({super.key});

  @override
  State<StaffAttendanceScreen> createState() => _StaffAttendanceScreenState();
}

class _StaffAttendanceScreenState extends State<StaffAttendanceScreen> {
  // Lists for metadata
  List<dynamic> _branches = [];
  List<dynamic> _courses = [];
  List<dynamic> _subjects = [];
  final List<String> _sections = ["Section A", "Section B", "Section C", "Section D", "Section E"];
  List<String> _semesters = [];

  // Filter values
  String? _selectedBranchId;
  String? _selectedCourseId;
  String? _selectedSemester;
  String? _selectedSection;
  String? _selectedSubjectCode;
  String? _selectedSubjectName;
  DateTime _selectedDate = DateTime.now();

  // State
  List<dynamic> _students = [];
  bool _isLoading = true;
  bool _studentsLoaded = false;
  final Map<String, String> _attendanceState = {}; // studentId -> status

  @override
  void initState() {
    super.initState();
    _loadMetadata();
  }

  Future<void> _loadMetadata() async {
    try {
      final br = await BranchService.getAllBranches();
      final cr = await CourseService.getAllCourses();
      if (mounted) {
        setState(() {
          _branches = br;
          _courses = cr;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _onCourseSelected(String? val) {
    if (val == null) return;
    final course = _courses.firstWhere((c) => c['name'] == val);
    final duration = course['duration'] ?? 4;
    final totalSems = duration * 2;
    
    setState(() {
      _selectedCourseId = course['_id'];
      _semesters = List.generate(totalSems, (i) => (i + 1).toString());
      _selectedSemester = null;
      _subjects = [];
      _selectedSubjectName = null;
      _selectedSubjectCode = null;
    });
  }

  void _onSemesterSelected(String? val) {
    if (val == null || _selectedCourseId == null) return;
    
    final course = _courses.firstWhere((c) => c['_id'] == _selectedCourseId);
    if (course != null && course['curriculum'] != null) {
      final cur = course['curriculum'] as List;
      final targetSem = cur.firstWhere(
        (s) => s['semester']?.toString() == val,
        orElse: () => null
      );

      if (targetSem != null) {
        // Collect ALL subjects defined in this semester curriculum
        final List<dynamic> allSemSubjects = [];
        final secs = targetSem['sections'] as List? ?? [];
        for (var sec in secs) {
          if (sec['subjects'] != null) {
            allSemSubjects.addAll(sec['subjects']);
          }
        }

        // De-duplicate subjects
        final Map<String, dynamic> uniqueSubs = {};
        for (var s in allSemSubjects) {
          if (s['name'] != null) uniqueSubs[s['name']] = s;
        }

        setState(() {
          _selectedSemester = val;
          _subjects = uniqueSubs.values.toList();
          _selectedSubjectName = null;
          _selectedSubjectCode = null;
        });
      } else {
        setState(() {
          _selectedSemester = val;
          _subjects = [];
        });
      }
    }
  }

  void _markAll(String status) {
    setState(() {
      for (var s in _students) {
        _attendanceState[s['_id']] = status;
      }
    });
  }

  int _getCount(String status) => _attendanceState.values.where((v) => v == status).length;

  Future<void> _fetchStudentsInSection() async {
    if (_selectedBranchId == null || _selectedCourseId == null || _selectedSemester == null || _selectedSection == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Please select branch, course, semester and section")));
      return;
    }

    setState(() => _isLoading = true);
    try {
      // Logic: Show all students in that section (independent of subject)
      final students = await AttendanceService.getStudentsForAttendance(
        branchId: _selectedBranchId!,
        courseId: _selectedCourseId!,
        semester: _selectedSemester,
        section: _selectedSection!,
      );
      
      if (mounted) {
        setState(() {
          _students = students;
          _attendanceState.clear();
          for (var s in students) {
            _attendanceState[s['_id']] = 'Present';
          }
          _studentsLoaded = true;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Core error: $e")));
      }
    }
  }

  Future<void> _submitAttendance() async {
    if (_selectedSubjectCode == null || _students.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Please load students and select a subject for marking")));
      return;
    }

    setState(() => _isLoading = true);
    try {
      final List<Map<String, dynamic>> list = _students.map((s) => {
        "student": s['_id'],
        "studentId": s['studentId'],
        "studentName": "${s['firstName']} ${s['lastName']}",
        "status": _attendanceState[s['_id']],
        "isLate": _attendanceState[s['_id']] == 'Late',
      }).toList();

      final branch = _branches.firstWhere((b) => b['_id'] == _selectedBranchId)['name'];
      final course = _courses.firstWhere((c) => c['_id'] == _selectedCourseId)['name'];

      await AttendanceService.submitAttendanceBulk(
        date: DateFormat('yyyy-MM-dd').format(_selectedDate),
        attendanceList: list,
        department: branch,
        course: course,
        section: _selectedSection!,
        subject: _selectedSubjectName!,
        subjectCode: _selectedSubjectCode!,
      );

      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Attendance saved with subject info successfully!"), backgroundColor: Colors.green));
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Submission failed: $e")));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Determine screen type
    final double width = MediaQuery.of(context).size.width;
    final bool isMobile = width < 700;
    final bool isTablet = width >= 700 && width < 1100;

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : CustomScrollView(
            slivers: [
              _buildSliverHeader(isMobile),
              SliverPadding(
                padding: EdgeInsets.all(isMobile ? 12 : (isTablet ? 20 : 32)),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    _buildFilterCockpit(isMobile, isTablet),
                    const SizedBox(height: 24),
                    if (_studentsLoaded) ...[
                      _buildSummaryStrip(isMobile, isTablet),
                      const SizedBox(height: 24),
                      _buildRosterView(isMobile),
                    ] else
                      _buildEmptyPrompt(isMobile),
                  ]),
                ),
              ),
            ],
          ),
    );
  }

  Widget _buildSliverHeader(bool isMobile) {
    return SliverAppBar(
      expandedHeight: isMobile ? 100 : 120, pinned: true, elevation: 0,
      backgroundColor: Colors.black,
      flexibleSpace: FlexibleSpaceBar(
        titlePadding: EdgeInsets.symmetric(horizontal: isMobile ? 16 : 24, vertical: 16),
        title: Text(
          "Academic Gatekeeper", 
          style: TextStyle(
            color: Colors.white, 
            fontWeight: FontWeight.w900, 
            fontSize: isMobile ? 14 : 18
          )
        ),
        background: Opacity(opacity: 0.2, child: Container(decoration: const BoxDecoration(gradient: LinearGradient(colors: [Colors.blue, Colors.purple])))),
      ),
    );
  }

  Widget _buildFilterCockpit(bool isMobile, bool isTablet) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 16 : 28),
      decoration: BoxDecoration(
        color: Colors.white, 
        borderRadius: BorderRadius.circular(isMobile ? 20 : 28), 
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 40)]
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("LOGISTICS CONTEXT", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Colors.blue, letterSpacing: 1.5)),
          const SizedBox(height: 24),
          Wrap(
            spacing: 16, runSpacing: 20, crossAxisAlignment: WrapCrossAlignment.end,
            children: [
              _attDropdown("Branch", _branches.map((b) => b['name'].toString()).toList(), _selectedBranchId != null ? _branches.firstWhere((b) => b['_id'] == _selectedBranchId)['name'] : null, (v) {
                setState(() => _selectedBranchId = _branches.firstWhere((b) => b['name'] == v)['_id']);
              }, isMobile),
              _attDropdown("Course", _courses.map((c) => c['name'].toString()).toList(), _selectedCourseId != null ? _courses.firstWhere((c) => c['_id'] == _selectedCourseId)['name'] : null, _onCourseSelected, isMobile),
              _attDropdown("Semester", _semesters, _selectedSemester, _onSemesterSelected, isMobile),
              _attDropdown("Section", _sections, _selectedSection, (v) => setState(() => _selectedSection = v), isMobile),
              _attDropdown("Subject for Attendance", _subjects.map((s) => s['name']?.toString() ?? "Untitled").toList(), _selectedSubjectName, (v) {
                final sub = _subjects.firstWhere((s) => s['name'] == v);
                setState(() {
                  _selectedSubjectCode = sub['code'] ?? sub['name'];
                  _selectedSubjectName = sub['name'];
                });
              }, isMobile),
              _buildDateTile(isMobile),
              SizedBox(
                width: isMobile ? double.infinity : null,
                child: _primaryActionBtn("LOAD ROSTER", Icons.groups_rounded, _fetchStudentsInSection, Colors.black, isMobile),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.05);
  }

  Widget _attDropdown(String label, List<String> items, String? val, Function(String?) onCh, bool isMobile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 9, color: Colors.grey, letterSpacing: 1)),
        const SizedBox(height: 10),
        Container(
          width: isMobile ? double.infinity : 220, padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFE2E8F0))),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: val, hint: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
              isExpanded: true, icon: const Icon(Icons.arrow_drop_down_rounded, color: Colors.blue),
              items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)))).toList(),
              onChanged: onCh,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDateTile(bool isMobile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("SESSION DATE", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 9, color: Colors.grey, letterSpacing: 1)),
        const SizedBox(height: 10),
        InkWell(
          onTap: () async {
            DateTime? p = await showDatePicker(context: context, initialDate: _selectedDate, firstDate: DateTime(2000), lastDate: DateTime(2101));
            if (p != null) setState(() => _selectedDate = p);
          },
          child: Container(
            width: isMobile ? double.infinity : 180, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(14), border: Border.all(color: const Color(0xFFE2E8F0))),
            child: Row(children: [const Icon(Icons.calendar_month, size: 16, color: Colors.blue),const SizedBox(width: 10),Text(DateFormat('dd MMM yyyy').format(_selectedDate),style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold))]),
          ),
        ),
      ],
    );
  }

  Widget _primaryActionBtn(String label, IconData icon, VoidCallback tap, Color bg, bool isMobile) {
    return ElevatedButton.icon(
      onPressed: tap, icon: Icon(icon, color: Colors.white, size: 16),
      label: Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11, letterSpacing: 0.5)),
      style: ElevatedButton.styleFrom(
        backgroundColor: bg, 
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: isMobile ? 18 : 22), 
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)), 
        elevation: 0,
        minimumSize: isMobile ? const Size(double.infinity, 54) : null
      ),
    );
  }

  Widget _buildSummaryStrip(bool isMobile, bool isTablet) {
    if (isMobile) {
      return Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFE2E8F0))),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _miniMetric("TOTAL", _students.length, Colors.blue),
                _miniMetric("PRESENT", _getCount('Present'), Colors.green),
                _miniMetric("ABSENT", _getCount('Absent'), Colors.red),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 12),
            _bulkMarkMenu(isMobile),
          ],
        ),
      );
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: const Color(0xFFE2E8F0))),
      child: Row(
        children: [
          _miniMetric("TOTAL STUDENTS", _students.length, Colors.blue),
          _divider(),
          _miniMetric("STAY PRESENT", _getCount('Present'), Colors.green),
          _divider(),
          _miniMetric("ABSENT", _getCount('Absent'), Colors.red),
          const Spacer(),
          _bulkMarkMenu(isMobile),
        ],
      ),
    );
  }

  Widget _miniMetric(String label, int val, Color c) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 0.5)),
      Text("$val", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: c)),
    ]);
  }

  Widget _divider() => Container(height: 30, width: 1, color: Colors.grey.shade100, margin: const EdgeInsets.symmetric(horizontal: 32));

  Widget _bulkMarkMenu(bool isMobile) {
    return PopupMenuButton<String>(
      onSelected: (v) => _markAll(v),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10), 
        decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(12)), 
        child: Row(
          mainAxisSize: isMobile ? MainAxisSize.max : MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Text("FAST MARK", style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900)),
            SizedBox(width: 8),
            Icon(Icons.bolt, color: Colors.yellow, size: 16)
          ]
        )
      ),
      itemBuilder: (ctx) => [const PopupMenuItem(value: 'Present', child: Text("All Present")), const PopupMenuItem(value: 'Late', child: Text("All Late")), const PopupMenuItem(value: 'Absent', child: Text("All Absent"))],
    );
  }

  Widget _buildRosterView(bool isMobile) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white, 
        borderRadius: BorderRadius.circular(isMobile ? 22 : 28), 
        border: Border.all(color: const Color(0xFFE2E8F0))
      ),
      child: Column(
        children: [
          ListView.separated(
            shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
            itemCount: _students.length,
            separatorBuilder: (ctx, i) => Divider(height: 1, color: Colors.grey.shade100),
            itemBuilder: (ctx, i) => _studentListTile(_students[i], isMobile),
          ),
          _finalizeFooter(isMobile),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.05);
  }

  Widget _studentListTile(Map<String, dynamic> s, bool isMobile) {
    return Padding(
      padding: EdgeInsets.all(isMobile ? 12 : 20),
      child: Row(
        children: [
          Hero(
            tag: s['_id'], 
            child: CircleAvatar(
              radius: isMobile ? 22 : 26, 
              backgroundImage: s['applicantPhoto'] != null ? NetworkImage(s['applicantPhoto']) : null, 
              child: s['applicantPhoto'] == null ? const Icon(Icons.person) : null
            )
          ),
          SizedBox(width: isMobile ? 12 : 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start, 
              children: [
                Text(
                  "${s['firstName']} ${s['lastName']}", 
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: isMobile ? 14 : 16, letterSpacing: -0.5),
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                ), 
                Text(
                  "ID: ${s['studentId']}", 
                  style: const TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold)
                )
              ]
            )
          ),
          _radioToggle(s['_id'], isMobile),
        ],
      ),
    );
  }

  Widget _radioToggle(String sid, bool isMobile) {
    return Container(
      padding: const EdgeInsets.all(4), decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(14)),
      child: Row(children: [_toggleItem(sid, 'P', 'Present', Colors.green), _toggleItem(sid, 'L', 'Late', Colors.amber), _toggleItem(sid, 'A', 'Absent', Colors.red)]),
    );
  }

  Widget _toggleItem(String sid, String label, String role, Color c) {
    bool sel = _attendanceState[sid] == role;
    return GestureDetector(
      onTap: () => setState(() => _attendanceState[sid] = role),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(color: sel ? c : Colors.transparent, borderRadius: BorderRadius.circular(10)),
        child: Text(label, style: TextStyle(color: sel ? Colors.white : Colors.grey, fontWeight: FontWeight.w900, fontSize: 11)),
      ),
    );
  }

  Widget _finalizeFooter(bool isMobile) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 20 : 32), 
      decoration: const BoxDecoration(color: Color(0xFFF8FAFC), borderRadius: BorderRadius.vertical(bottom: Radius.circular(22))),
      child: isMobile 
        ? Column(
            children: [
               Row(
                 mainAxisAlignment: MainAxisAlignment.spaceBetween,
                 children: [
                    const Text("LEDGER", style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)),
                    Text(_selectedSubjectName ?? "Select Subject", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.black87)),
                 ],
               ),
               const SizedBox(height: 16),
               _primaryActionBtn("COMMIT ATTENDANCE", Icons.verified_rounded, _submitAttendance, const Color(0xFF10B981), isMobile),
            ],
          )
        : Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [const Text("PREPARING LEDGER", style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)), Text(_selectedSubjectName ?? "Select Subject", style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black87))]),
              _primaryActionBtn("COMMIT ATTENDANCE", Icons.verified_rounded, _submitAttendance, const Color(0xFF10B981), isMobile),
            ],
          ),
    );
  }

  Widget _buildEmptyPrompt(bool isMobile) {
    return Center(child: Padding(padding: const EdgeInsets.only(top: 60), child: Column(children: [Icon(Icons.hub_outlined, size: isMobile ? 60 : 80, color: Colors.grey.shade200), const SizedBox(height: 24), const Text("ORCHESTRATE SECTION ROSTER", style: TextStyle(fontSize: 14, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5))]))).animate().fadeIn();
  }
}
