import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/app_constants.dart';
import '../../../core/services/student_service.dart';
import '../../../core/services/faculty_service.dart';
import '../../../core/services/user_service.dart';
import '../../../core/services/course_service.dart';
import 'student_detail_screen.dart';

class CourseDetailScreen extends StatefulWidget {
  final Map<String, dynamic> course;
  final Map<String, dynamic> branch;
  final VoidCallback onBack;

  const CourseDetailScreen({
    super.key,
    required this.course,
    required this.branch,
    required this.onBack,
  });

  @override
  State<CourseDetailScreen> createState() => _CourseDetailScreenState();
}

class _CourseDetailScreenState extends State<CourseDetailScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  List<dynamic> _students = [];
  List<dynamic> _faculty = [];
  late Map<String, dynamic> _courseData;
  List<dynamic> _allUsers = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _courseData = Map<String, dynamic>.from(widget.course);
    _tabController = TabController(length: 2, vsync: this);
    _loadAllData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAllData({bool showLoading = true}) async {
    try {
      if (showLoading) setState(() => _isLoading = true);
      
      final results = await Future.wait([
        StudentService.getAllStudents(),
        FacultyService.getCourseFaculty(widget.course['_id']),
        CourseService.getCourseById(widget.course['_id']),
        UserService.getAllUsers(),
      ]);

      final allStudents = results[0] as List<dynamic>;
      final courseStudents = allStudents.where((s) {
        final progRaw = s['selectedProgram'];
        final branchRaw = s['selectedBranch'];
        
        String? sProgId = progRaw is Map ? progRaw['_id']?.toString() : progRaw?.toString();
        String? sBranchId = branchRaw is Map ? branchRaw['_id']?.toString() : branchRaw?.toString();

        return sProgId == widget.course['_id'].toString() && sBranchId == widget.branch['_id'].toString();
      }).toList();
      
      if (mounted) {
        setState(() {
          _students = courseStudents;
          _faculty = results[1] as List<dynamic>;
          _courseData = results[2] as Map<String, dynamic>;
          _allUsers = results[3] as List<dynamic>;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        bool isMobile = constraints.maxWidth < 1100;
        double sidePadding = isMobile ? 20 : 40;

        return Scaffold(
          backgroundColor: const Color(0xFFF8F6F6),
          body: Column(
            children: [
              _buildHeader(isMobile),
              Expanded(
                child: SingleChildScrollView(
                  padding: EdgeInsets.all(sidePadding),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildCourseBanner(isMobile),
                      SizedBox(height: isMobile ? 32 : 48),
                      _buildStatsRow(isMobile),
                      SizedBox(height: isMobile ? 32 : 48),
                      _buildTabBar(isMobile),
                      const SizedBox(height: 32),
                      SizedBox(
                        height: 800, // Increased height for curriculum map
                        child: TabBarView(
                          controller: _tabController,
                          children: [
                            _buildCurriculumTab(isMobile),
                            _buildStudentsTab(),
                          ],
                        ),
                      ),
                    ],
                  ),
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
      padding: EdgeInsets.symmetric(horizontal: isMobile ? 20 : 40, vertical: 24),
      decoration: const BoxDecoration(color: Colors.white, border: Border(bottom: BorderSide(color: Color(0xFFF1F1F1)))),
      child: Row(
        children: [
          IconButton(onPressed: widget.onBack, icon: const Icon(Icons.arrow_back_ios_rounded, size: 20)),
          const SizedBox(width: 24),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(widget.course['name'], style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
              Text("${widget.branch['name']} • ${widget.course['code']}", style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCourseBanner(bool isMobile) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(isMobile ? 24 : 40),
      decoration: BoxDecoration(color: Colors.black, borderRadius: BorderRadius.circular(32)),
      child: Row(
        children: [
          Container(
            width: isMobile ? 60 : 100, height: isMobile ? 60 : 100,
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(24)),
            child: Icon(Icons.school_rounded, color: Colors.white, size: isMobile ? 30 : 50),
          ),
          const SizedBox(width: 32),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    _badge("ACADEMIC UNIT", Colors.blue),
                    const SizedBox(width: 12),
                    _badge(widget.course['status'] ?? "ACTIVE", Colors.green),
                  ],
                ),
                const SizedBox(height: 16),
                Text(widget.course['name'], style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.w900)),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn().scale(begin: const Offset(0.98, 0.98));
  }

  Widget _badge(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6), border: Border.all(color: color.withValues(alpha: 0.2))),
      child: Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
    );
  }

  Widget _buildStatsRow(bool isMobile) {
    return Row(
      children: [
        Expanded(child: _statBox("${_students.length}", "Total Students", Icons.people_rounded)),
        const SizedBox(width: 24),
        Expanded(child: _statBox("${widget.course['duration'] ?? 4} Yrs", "Duration", Icons.timer_rounded)),
        const SizedBox(width: 24),
        if (!isMobile) ...[
          Expanded(child: _statBox("${widget.course['credits'] ?? 160}", "Total Credits", Icons.grade_rounded)),
          const SizedBox(width: 24),
          Expanded(child: _statBox("Active", "Enrollment", Icons.check_circle_rounded)),
        ],
      ],
    );
  }

  Widget _statBox(String val, String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.black.withValues(alpha: 0.03))),
      child: Row(
        children: [
          Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: const Color(0xFFF8F6F6), borderRadius: BorderRadius.circular(12)), child: Icon(icon, size: 20, color: Colors.grey.shade600)),
          const SizedBox(width: 20),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(val, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
            Text(label, style: TextStyle(color: Colors.grey.shade400, fontSize: 11, fontWeight: FontWeight.bold)),
          ]),
        ],
      ),
    );
  }

  Widget _buildTabBar(bool isMobile) {
    return Container(
      decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFFF1F1F1)))),
      child: TabBar(
        controller: _tabController,
        isScrollable: true,
        labelColor: Colors.black,
        unselectedLabelColor: Colors.grey,
        indicatorColor: AppColors.primaryRed,
        indicatorWeight: 3,
        dividerColor: Colors.transparent,
        tabAlignment: TabAlignment.start,
        tabs: const [Tab(text: "Curriculum Map"), Tab(text: "Student Roster")],
      ),
    );
  }

  Widget _buildCurriculumTab(bool isMobile) {
    final curriculum = (_courseData['curriculum'] as List? ?? []);
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 24),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("Academic Curriculum Map", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
              ElevatedButton.icon(
                onPressed: _showAddSemesterDialog,
                icon: const Icon(Icons.add_rounded, size: 18),
                label: const Text("Add Semester"),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.black, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
              ),
            ],
          ),
        ),
        Expanded(
          child: curriculum.isEmpty
              ? _buildEmptyState(Icons.map_rounded, "No curriculum defined.")
              : ListView.separated(
                  itemCount: curriculum.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 24),
                  itemBuilder: (context, i) => _buildSemesterCard(curriculum[i], isMobile),
                ),
        ),
      ],
    );
  }

  Widget _buildSemesterCard(Map<String, dynamic> sem, bool isMobile) {
    final sections = (sem['sections'] as List? ?? []);
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.black.withValues(alpha: 0.02))),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(backgroundColor: const Color(0xFFF8F6F6), radius: 20, child: Text("${sem['semester']}", style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.black))),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("Semester ${sem['semester']}", style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
                  Text("${sem['credits'] ?? 0} Expected Credits", style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
                ],
              ),
              const Spacer(),
              TextButton.icon(
                onPressed: () => _showAddSectionDialog(sem['semester']),
                icon: const Icon(Icons.grid_view_rounded, size: 16),
                label: const Text("Manage Sections"),
                style: TextButton.styleFrom(foregroundColor: const Color(0xFF10B981)),
              ),
            ],
          ),
          const SizedBox(height: 24),
          if (sections.isEmpty)
             Text("No sections configured.", style: TextStyle(color: Colors.grey.shade400, fontStyle: FontStyle.italic))
          else
             Column(children: sections.map((sec) => _buildSectionItem(sem['semester'], sec)).toList()),
        ],
      ),
    );
  }

  Widget _buildSectionItem(int semester, Map<String, dynamic> sec) {
    final subjects = (sec['subjects'] as List? ?? []);
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade100)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(sec['name'] ?? "Section", style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: Color(0xFF64748B))),
              Row(children: [
                IconButton(onPressed: () => _showAddSubjectDialog(semester, sec['name']), icon: const Icon(Icons.add_circle_rounded, size: 18, color: Colors.blue)),
                IconButton(onPressed: () => _deleteSection(semester, sec['name']), icon: const Icon(Icons.delete_forever_rounded, size: 18, color: Colors.redAccent)),
              ]),
            ],
          ),
          const SizedBox(height: 12),
          ...subjects.map((sub) {
             String facultyName = "Not Allocated";
             if (sub['facultyId'] != null) {
                final f = _allUsers.firstWhere((u) => u['_id'].toString() == sub['facultyId'].toString(), orElse: () => null);
                if (f != null) facultyName = "${f['firstName']} ${f['lastName']}";
             }
             return Padding(
               padding: const EdgeInsets.symmetric(vertical: 6),
               child: Row(
                 children: [
                   const Icon(Icons.book_rounded, size: 14, color: Colors.grey),
                   const SizedBox(width: 12),
                   Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(sub['name'] ?? "", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      Text("Instructor: $facultyName", style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
                   ])),
                   _badge("${sub['credits'] ?? 0} Cr", Colors.orange),
                 ],
               ),
             );
          }),
        ],
      ),
    );
  }

  Widget _buildStudentsTab() {
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.black.withValues(alpha: 0.02))),
      child: _students.isEmpty
          ? _buildEmptyState(Icons.people_outline_rounded, "No students enrolled in this course.")
          : ListView.separated(
              padding: const EdgeInsets.all(32),
              itemCount: _students.length,
              separatorBuilder: (_, _) => const Divider(height: 1, color: Color(0xFFF1F1F1)),
              itemBuilder: (context, i) {
                final s = _students[i];
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => StudentDetailScreen(student: s),
                        ),
                      );
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        children: [
                          CircleAvatar(
                            radius: 30,
                            backgroundColor: const Color(0xFFF8F6F6),
                            backgroundImage: s['applicantPhoto'] != null ? NetworkImage(s['applicantPhoto']) : null,
                            child: s['applicantPhoto'] == null ? const Icon(Icons.person, color: Colors.grey) : null,
                          ),
                          const SizedBox(width: 24),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text("${s['firstName']} ${s['lastName']}", style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: -0.5)),
                                const SizedBox(height: 4),
                                Text("ID: ${s['studentId'] ?? "PENDING"}", style: TextStyle(color: Colors.grey.shade500, fontSize: 12, fontWeight: FontWeight.bold)),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Row(
                                children: [
                                  _badge("SEM ${s['selectedSemester'] ?? 1}", Colors.blue),
                                  const SizedBox(width: 8),
                                  _badge(s['selectedSection'] ?? "SEC A", Colors.purple),
                                ],
                              ),
                              const SizedBox(height: 8),
                              Text(s['email'] ?? "No email", style: TextStyle(color: Colors.grey.shade400, fontSize: 11)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
    );
  }

  // --- DIALOGS ---

  void _showAddSemesterDialog() {
    final semController = TextEditingController();
    _showBeautifulDialog(
      title: "New Semester",
      content: _beautifulTextField(controller: semController, label: "Semester Number", icon: Icons.numbers),
      onConfirm: () async {
        final cur = List<Map<String, dynamic>>.from(_courseData['curriculum'] ?? []);
        cur.add({'semester': int.tryParse(semController.text) ?? (cur.length + 1), 'credits': 20, 'sections': [{'name': 'Section A', 'subjects': []}]});
        await _updateCurriculum(cur);
      },
    );
  }

  void _showAddSectionDialog(int semester) {
    final nameController = TextEditingController();
    _showBeautifulDialog(
      title: "Add Section",
      content: _beautifulTextField(controller: nameController, label: "Section Name", icon: Icons.grid_view_rounded),
      onConfirm: () async {
        final cur = List<Map<String, dynamic>>.from(_courseData['curriculum'] ?? []);
        final idx = cur.indexWhere((s) => s['semester'] == semester);
        if (idx != -1) {
          final secs = List<Map<String, dynamic>>.from(cur[idx]['sections'] ?? []);
          secs.add({'name': nameController.text.isEmpty ? 'Section ${String.fromCharCode(65 + secs.length)}' : nameController.text, 'subjects': []});
          cur[idx]['sections'] = secs;
          await _updateCurriculum(cur);
        }
      },
    );
  }

  void _showAddSubjectDialog(int semester, String sectionName) {
    final nameController = TextEditingController();
    final creditsController = TextEditingController();
    String? selectedFacultyId;
    final facultyUsers = _allUsers.where((u) => u['role'] == 'Faculty' || u['role'] == 'Staff').toList();

    _showBeautifulDialog(
      title: "New Subject",
      content: StatefulBuilder(
        builder: (context, setDialogState) => Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _beautifulTextField(controller: nameController, label: "Subject Name", icon: Icons.book_outlined),
            const SizedBox(height: 16),
            _beautifulTextField(controller: creditsController, label: "Credits", icon: Icons.grade_rounded),
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              decoration: const InputDecoration(labelText: "Allocate Faculty"),
              items: facultyUsers.map((f) => DropdownMenuItem(value: f['_id'].toString(), child: Text("${f['firstName']} ${f['lastName']}"))).toList(),
              onChanged: (v) => setDialogState(() => selectedFacultyId = v),
            ),
          ],
        ),
      ),
      onConfirm: () async {
        final cur = List<Map<String, dynamic>>.from(_courseData['curriculum'] ?? []);
        final idx = cur.indexWhere((s) => s['semester'] == semester);
        if (idx != -1) {
          final secs = List<Map<String, dynamic>>.from(cur[idx]['sections'] ?? []);
          final sIdx = secs.indexWhere((s) => s['name'] == sectionName);
          if (sIdx != -1) {
            final subs = List<Map<String, dynamic>>.from(secs[sIdx]['subjects'] ?? []);
            subs.add({'name': nameController.text, 'credits': int.tryParse(creditsController.text) ?? 3, 'facultyId': selectedFacultyId});
            secs[sIdx]['subjects'] = subs;
            cur[idx]['sections'] = secs;
            await _updateCurriculum(cur);
          }
        }
      },
    );
  }

  void _deleteSection(int semester, String sectionName) async {
    final cur = List<Map<String, dynamic>>.from(_courseData['curriculum'] ?? []);
    final idx = cur.indexWhere((s) => s['semester'] == semester);
    if (idx != -1) {
      final secs = List<Map<String, dynamic>>.from(cur[idx]['sections'] ?? []);
      secs.removeWhere((s) => s['name'] == sectionName);
      cur[idx]['sections'] = secs;
      await _updateCurriculum(cur);
    }
  }

  Future<void> _updateCurriculum(List<Map<String, dynamic>> curriculum) async {
    try {
      final updated = await CourseService.updateCourse(widget.course['_id'], {'curriculum': curriculum});
      setState(() => _courseData = updated);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
    }
  }

  // --- HELPERS ---

  void _showBeautifulDialog({required String title, required Widget content, required VoidCallback onConfirm}) {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: '',
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (context, anim1, anim2) => Center(
        child: Material(
          color: Colors.transparent,
          child: Container(
            width: 450, padding: const EdgeInsets.all(32), margin: const EdgeInsets.symmetric(horizontal: 20),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(32), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 30, offset: const Offset(0, 15))]),
            child: Column(
              mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
                const SizedBox(height: 24),
                content,
                const SizedBox(height: 32),
                Row(children: [
                  Expanded(child: TextButton(onPressed: () => Navigator.pop(context), child: const Text("Cancel"))),
                  const SizedBox(width: 16),
                  Expanded(child: ElevatedButton(onPressed: () { onConfirm(); Navigator.pop(context); }, style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))), child: const Text("Confirm"))),
                ]),
              ],
            ),
          ).animate().fadeIn().scale(begin: const Offset(0.95, 0.95)),
        ),
      ),
    );
  }

  Widget _beautifulTextField({TextEditingController? controller, required String label, required IconData icon, Function(String)? onChanged}) {
    return TextField(
      controller: controller, onChanged: onChanged,
      decoration: InputDecoration(
        labelText: label, prefixIcon: Icon(icon, size: 20), filled: true, fillColor: const Color(0xFFF8F6F6),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
      ),
    );
  }

  Widget _buildEmptyState(IconData icon, String message) {
    return Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, size: 48, color: Colors.grey.shade200),
        const SizedBox(height: 16),
        Text(message, style: TextStyle(color: Colors.grey.shade400, fontWeight: FontWeight.bold)),
    ]));
  }
}
