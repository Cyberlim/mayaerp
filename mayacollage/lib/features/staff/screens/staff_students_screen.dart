import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/student_service.dart';
import '../../../core/services/course_service.dart';
import '../../../core/services/branch_service.dart';
import 'student_detail_screen.dart';
import 'package:url_launcher/url_launcher.dart';

class HoverScaleCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double scale;
  final EdgeInsetsGeometry? padding;

  const HoverScaleCard({
    super.key,
    required this.child,
    this.onTap,
    this.scale = 1.03,
    this.padding,
  });

  @override
  State<HoverScaleCard> createState() => _HoverScaleCardState();
}

class _HoverScaleCardState extends State<HoverScaleCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      cursor: widget.onTap != null
          ? SystemMouseCursors.click
          : SystemMouseCursors.basic,
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedScale(
          scale: _isHovered ? widget.scale : 1.0,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
          child: Padding(
            padding: widget.padding ?? EdgeInsets.zero,
            child: widget.child,
          ),
        ),
      ),
    );
  }
}

class StaffStudentsScreen extends StatefulWidget {
  const StaffStudentsScreen({super.key});

  @override
  State<StaffStudentsScreen> createState() => _StaffStudentsScreenState();
}

class _StaffStudentsScreenState extends State<StaffStudentsScreen> {
  String _searchQuery = '';
  String? _selectedCourse;
  String? _selectedClass;
  bool _isLoading = true;

  List<String> _courses = [];
  final List<String> _classes = ["1st Year", "2nd Year", "3rd Year", "Final Year"];

  List<dynamic> _students = [];
  Map<String, String> _courseIdToName = {};
  Map<String, String> _branchIdToName = {};

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      setState(() => _isLoading = true);
      final studentsList = await StudentService.getAllStudents();
      final coursesList = await CourseService.getAllCourses();
      final branchesList = await BranchService.getAllBranches();
      
      final Map<String, String> cMap = {};
      for (var c in coursesList) {
         if (c['_id'] != null && c['name'] != null) {
           cMap[c['_id'].toString()] = c['name'].toString();
         }
      }

      final Map<String, String> bMap = {};
      for (var b in branchesList) {
         if (b['_id'] != null && b['name'] != null) {
           bMap[b['_id'].toString()] = b['name'].toString();
         }
      }

      setState(() {
        _students = studentsList;
        _courses = coursesList.map((c) => (c['name'] ?? 'Unknown').toString()).toList();
        _courseIdToName = cMap;
        _branchIdToName = bMap;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        debugPrint("Error loading students: $e");
      }
    }
  }

  String _getCourseName(dynamic idOrName) {
    if (idOrName == null) return "Unknown";
    final String key = idOrName.toString();
    return _courseIdToName[key] ?? key;
  }

  String _getBranchName(dynamic idOrName) {
    if (idOrName == null) return "General";
    final String key = idOrName.toString();
    return _branchIdToName[key] ?? key;
  }

  void _navigateToDetail(dynamic s) {
    final resolvedStudent = Map<String, dynamic>.from(s);
    resolvedStudent['selectedProgram'] = _getCourseName(s['selectedProgram']);
    resolvedStudent['selectedBranch'] = _getBranchName(s['selectedBranch']);
    Navigator.push(context, MaterialPageRoute(builder: (_) => StudentDetailScreen(student: resolvedStudent)));
  }

  @override
  Widget build(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 800;

    final filteredStudents = _students.where((s) {
      final String name = "${s['firstName'] ?? ''} ${s['lastName'] ?? ''}".toLowerCase();
      final String roll = (s['studentId'] ?? s['enrollmentNumber'] ?? '').toString().toLowerCase();
      final String query = _searchQuery.toLowerCase();
      
      if (_searchQuery.isNotEmpty && !name.contains(query) && !roll.contains(query)) return false;
      if (_selectedCourse != null && _getCourseName(s['selectedProgram']) != _selectedCourse) return false;
      if (_selectedClass != null && s['sessionYear'] != _selectedClass) return false;
      return true;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : RefreshIndicator(
            onRefresh: _loadData,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: EdgeInsets.all(isMobile ? 16 : 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeader(isMobile),
                  const SizedBox(height: 32),
                  _buildFiltersAndActions(isMobile),
                  const SizedBox(height: 24),
                  _buildStudentsList(filteredStudents, isMobile),
                ],
              ),
            ),
          ),
    );
  }

  Widget _buildHeader(bool isMobile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Student Management", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), letterSpacing: -1)),
        const SizedBox(height: 4),
        Text("View and manage students enrolled in Maya Institute.", style: TextStyle(fontSize: 14, color: Colors.grey.shade500)),
      ],
    ).animate().fadeIn().slideY(begin: -0.1);
  }

  Widget _buildFiltersAndActions(bool isMobile) {
    if (isMobile) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            onChanged: (v) => setState(() => _searchQuery = v),
            decoration: InputDecoration(
              hintText: "Search by name or Roll No...",
              prefixIcon: const Icon(Icons.search_rounded, color: Colors.grey),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(vertical: 16),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade200)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey.shade200)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFF10B981))),
            ),
          ),
          const SizedBox(height: 16),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            child: Row(
              children: [
                _dropdown("Course", _courses, _selectedCourse, (v) => setState(() => _selectedCourse = v)),
                const SizedBox(width: 12),
                _dropdown("Year", _classes, _selectedClass, (v) => setState(() => _selectedClass = v)),
                if (_selectedCourse != null || _selectedClass != null || _searchQuery.isNotEmpty) ...[
                  const SizedBox(width: 12),
                  _clearFiltersBtn(),
                ],
              ],
            ),
          ),
        ],
      );
    }

    return Wrap(
      spacing: 16,
      runSpacing: 16,
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        SizedBox(
          width: 300,
          child: TextField(
            onChanged: (v) => setState(() => _searchQuery = v),
            decoration: InputDecoration(
              hintText: "Search by name or Roll No...",
              prefixIcon: const Icon(Icons.search_rounded, color: Colors.grey),
              filled: true,
              fillColor: Colors.white,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF10B981))),
            ),
          ),
        ),
        _dropdown("Course", _courses, _selectedCourse, (v) => setState(() => _selectedCourse = v)),
        _dropdown("Year", _classes, _selectedClass, (v) => setState(() => _selectedClass = v)),
        if (_selectedCourse != null || _selectedClass != null || _searchQuery.isNotEmpty)
          _clearFiltersBtn(),
      ],
    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1);
  }

  Widget _clearFiltersBtn() {
    return TextButton.icon(
      onPressed: () => setState(() { _selectedCourse = null; _selectedClass = null; _searchQuery = ''; }),
      icon: const Icon(Icons.clear_rounded, size: 16),
      label: const Text("Clear Filters", style: TextStyle(fontWeight: FontWeight.bold)),
      style: TextButton.styleFrom(
        foregroundColor: Colors.red,
        backgroundColor: Colors.red.withValues(alpha: 0.05),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  Widget _dropdown(String hint, List<String> items, String? val, Function(String?) onCh) {
    return Container(
      width: 180,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: val,
          hint: Text(hint, style: TextStyle(color: Colors.grey.shade500, fontSize: 14)),
          isExpanded: true,
          icon: Icon(Icons.keyboard_arrow_down_rounded, color: Colors.grey.shade400),
          items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 14)))).toList(),
          onChanged: onCh,
        ),
      ),
    );
  }

  Widget _buildStudentsList(List<dynamic> students, bool isMobile) {
    if (students.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(48.0),
          child: Column(
            children: [
              Icon(Icons.search_off_rounded, size: 64, color: Colors.grey.shade300),
              const SizedBox(height: 16),
              Text("No students matched your search", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey.shade500)),
            ],
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (!isMobile)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            decoration: BoxDecoration(color: const Color(0xFFF8FAFC), border: Border(bottom: BorderSide(color: Colors.grey.shade200))),
            child: Row(
              children: [
                Expanded(flex: 3, child: Text("STUDENT", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade500))),
                Expanded(flex: 2, child: Text("COURSE & CLASS", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade500))),
                Expanded(flex: 2, child: Text("CONTACT", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade500))),
                Expanded(flex: 1, child: Text("STATUS", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade500))),
                Expanded(flex: 1, child: Align(alignment: Alignment.centerRight, child: Text("ACTIONS", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade500)))),
              ],
            ),
          ),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: students.length,
          itemBuilder: (context, index) {
            final s = students[index];
            return HoverScaleCard(
              onTap: () => _navigateToDetail(s),
              child: Container(
                margin: EdgeInsets.only(bottom: isMobile ? 12 : 16),
                padding: EdgeInsets.all(isMobile ? 16 : 24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: const Color(0xFF10B981).withValues(alpha: 0.04), blurRadius: 20, offset: const Offset(0, 8))],
                ),
                child: isMobile ? _buildMobileRow(s) : _buildDesktopRow(s),
              ),
            ).animate().fadeIn(delay: (50 * index).ms).slideX(begin: 0.05);
          },
        ),
      ],
    );
  }

  Widget _buildDesktopRow(dynamic s) {
    bool isLibraryMember = s['libraryMember'] ?? false;
    return Row(
      children: [
        Expanded(
          flex: 3,
          child: Row(
            children: [
              CircleAvatar(
                backgroundColor: const Color(0xFF10B981).withValues(alpha: 0.1), 
                backgroundImage: s['applicantPhoto'] != null ? NetworkImage(s['applicantPhoto']) : NetworkImage("https://i.pravatar.cc/150?u=${s['rollNumber'] ?? s['studentId'] ?? ''}")
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("${s['firstName'] ?? ''} ${s['lastName'] ?? ''}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)), 
                    Text("Reg: ${s['studentId'] ?? s['enrollmentNumber'] ?? s['admissionNumber'] ?? 'N/A'}", style: TextStyle(color: Colors.grey.shade500, fontSize: 13))
                  ],
                ),
              ),
            ],
          ),
        ),
        Expanded(flex: 2, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(_getCourseName(s['selectedProgram'] ?? s['selectedBranch']), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)), Text(s['sessionYear'] ?? s['currentYear'] ?? 'N/A', style: TextStyle(color: Colors.grey.shade500, fontSize: 13))])),
        Expanded(flex: 2, child: Text(s['mobile'] ?? s['alternateMobile'] ?? 'N/A', style: TextStyle(color: Colors.grey.shade700, fontSize: 14))),
        Expanded(
          flex: 1,
          child: Align(
            alignment: Alignment.centerLeft,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: (isLibraryMember ? Colors.green : Colors.grey).withValues(alpha: 0.1), 
                borderRadius: BorderRadius.circular(8)
              ),
              child: Text(
                isLibraryMember ? "Library Active" : "Regular", 
                style: TextStyle(color: isLibraryMember ? Colors.green : Colors.grey, fontWeight: FontWeight.bold, fontSize: 11)
              ),
            ),
          ),
        ),
        Expanded(
          flex: 1,
          child: Align(
            alignment: Alignment.centerRight,
            child: PopupMenuButton<String>(
              onSelected: (val) {
                if (val == 'profile') {
                  _navigateToDetail(s);
                } else if (val == 'contact') {
                  launchUrl(Uri(scheme: 'tel', path: s['mobile'] ?? ''));
                }
              },
              icon: const Icon(Icons.more_vert_rounded, color: Colors.grey),
              itemBuilder: (context) => [
                const PopupMenuItem(value: 'profile', child: Row(children: [Icon(Icons.person_rounded, size: 18, color: Colors.blue), SizedBox(width: 8), Text("View Profile")])),
                const PopupMenuItem(value: 'contact', child: Row(children: [Icon(Icons.phone_rounded, size: 18, color: Colors.green), SizedBox(width: 8), Text("Contact")])),
                const PopupMenuItem(value: 'records', child: Row(children: [Icon(Icons.history_edu_rounded, size: 18, color: Colors.purple), SizedBox(width: 8), Text("Full Records")])),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMobileRow(dynamic s) {
    bool isLibraryMember = s['libraryMember'] ?? false;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: const Color(0xFF10B981).withValues(alpha: 0.1), 
                  backgroundImage: s['applicantPhoto'] != null ? NetworkImage(s['applicantPhoto']) : NetworkImage("https://i.pravatar.cc/150?u=${s['rollNumber'] ?? s['studentId'] ?? ''}")
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("${s['firstName'] ?? ''} ${s['lastName'] ?? ''}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)), 
                    Text("Reg No: ${s['studentId'] ?? s['enrollmentNumber'] ?? s['admissionNumber'] ?? 'N/A'}", style: TextStyle(color: Colors.grey.shade500, fontSize: 13))
                  ],
                ),
              ],
            ),
            PopupMenuButton<String>(
              onSelected: (val) {
                if (val == 'profile') {
                  _navigateToDetail(s);
                } else if (val == 'contact') {
                  launchUrl(Uri(scheme: 'tel', path: s['mobile'] ?? ''));
                }
              },
              icon: const Icon(Icons.more_vert_rounded, color: Colors.grey),
              itemBuilder: (context) => [
                const PopupMenuItem(value: 'profile', child: Row(children: [Icon(Icons.person_rounded, size: 18, color: Colors.blue), SizedBox(width: 8), Text("View Profile")])),
                const PopupMenuItem(value: 'contact', child: Row(children: [Icon(Icons.phone_rounded, size: 18, color: Colors.green), SizedBox(width: 8), Text("Contact")])),
              ],
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(_getCourseName(s['selectedProgram'] ?? s['selectedBranch']), style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)), Text(s['sessionYear'] ?? s['currentYear'] ?? 'N/A', style: TextStyle(color: Colors.grey.shade500, fontSize: 13))]),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: (isLibraryMember ? Colors.green : Colors.blue).withValues(alpha: 0.1), 
                borderRadius: BorderRadius.circular(8)
              ),
              child: Text(
                isLibraryMember ? "Member" : "Student", 
                style: TextStyle(color: isLibraryMember ? Colors.green : Colors.blue, fontWeight: FontWeight.bold, fontSize: 11)
              ),
            ),
          ],
        ),
      ],
    );
  }
}
