import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';
import 'create_student_screen.dart';
import 'student_detail_screen.dart';
import '../../../core/services/student_service.dart';
import '../../../core/services/course_service.dart';
import '../../../core/services/branch_service.dart';

class StudentManagementScreen extends StatefulWidget {
  const StudentManagementScreen({super.key});

  @override
  State<StudentManagementScreen> createState() =>
      _StudentManagementScreenState();
}

class _StudentManagementScreenState extends State<StudentManagementScreen> {
  String _activeFilter = 'All';
  String _searchQuery = '';
  String? _selectedBranchFilter;
  String? _selectedYearFilter;
  
  final List<String> _filters = ['All', 'Pending', 'Approved', 'Rejected'];
  List<dynamic> _students = [];
  List<dynamic> _courses = [];
  List<dynamic> _branches = [];
  bool _isLoading = true;

  List<String> get _availableYears {
    final years = _students.map((s) => s['sessionYear']?.toString() ?? '').where((y) => y.isNotEmpty).toSet().toList();
    years.sort((a, b) => b.compareTo(a));
    return years;
  }

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      setState(() => _isLoading = true);
      final students = await StudentService.getAllStudents();
      final courses = await CourseService.getAllCourses();
      final branches = await BranchService.getAllBranches();
      if (mounted) {
        setState(() {
          _students = students;
          _courses = courses;
          _branches = branches;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error loading data: $e')));
      }
    }
  }

  Future<void> _handleDelete(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Delete'),
        content: const Text('Are you sure you want to delete this student?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await StudentService.deleteStudent(id);
        _loadData();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('student deleted successfully')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text('Error deleting student: $e')));
        }
      }
    }
  }

  Future<void> _handleUpdateStatus(String id, String status) async {
    try {
      await StudentService.updateStudent(id, {'status': status});
      _loadData();
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('student marked as $status')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Error updating student: $e')));
      }
    }
  }

  // ── Batch Semester Update Dialog ──
  Future<void> _showBatchSemesterDialog() async {
    String? selectedYear;
    String? selectedProgramId;
    String? selectedBranchId;
    int selectedSemester = 1;
    bool isUpdating = false;

    // Build year list from students
    final years = _students
        .map((s) => s['sessionYear']?.toString() ?? '')
        .where((y) => y.isNotEmpty)
        .toSet()
        .toList()
      ..sort((a, b) => b.compareTo(a));

    await showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: '',
      transitionDuration: const Duration(milliseconds: 350),
      pageBuilder: (ctx, anim1, anim2) => Center(
        child: StatefulBuilder(
          builder: (ctx2, setDlg) {
            // Compute preview count
            int previewCount = _students.where((s) {
              bool match = true;
              if (selectedYear != null && selectedYear!.isNotEmpty) {
                match = match && (s['sessionYear']?.toString() == selectedYear);
              }
              if (selectedProgramId != null && selectedProgramId!.isNotEmpty) {
                final progRaw = s['selectedProgram'];
                final pid = progRaw is Map ? progRaw['_id']?.toString() : progRaw?.toString();
                match = match && (pid == selectedProgramId);
              }
              if (selectedBranchId != null && selectedBranchId!.isNotEmpty) {
                final brRaw = s['selectedBranch'];
                final bid = brRaw is Map ? brRaw['_id']?.toString() : brRaw?.toString();
                match = match && (bid == selectedBranchId);
              }
              return match;
            }).length;

            return Material(
              color: Colors.transparent,
              child: Container(
                width: 520,
                margin: const EdgeInsets.symmetric(horizontal: 20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(32),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.15),
                      blurRadius: 40,
                      offset: const Offset(0, 20),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // ── Header ──
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(28),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                      ),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.upgrade_rounded, color: Colors.white, size: 22),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Batch Semester Promotion',
                                  style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900),
                                ),
                                Text(
                                  'Update semester for entire batch in one click',
                                  style: TextStyle(color: Colors.white.withValues(alpha: 0.75), fontSize: 12),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            onPressed: () => Navigator.pop(ctx),
                            icon: const Icon(Icons.close_rounded, color: Colors.white, size: 20),
                          ),
                        ],
                      ),
                    ),

                    // ── Body ──
                    Padding(
                      padding: const EdgeInsets.all(28),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Batch Year Filter
                          _dlgLabel('Filter by Batch Year'),
                          const SizedBox(height: 8),
                          _dlgDropdown(
                            value: selectedYear,
                            hint: 'All years',
                            items: [
                              const DropdownMenuItem(value: null, child: Text('All years')),
                              ...years.map((y) => DropdownMenuItem(value: y, child: Text(y))),
                            ],
                            onChanged: (v) => setDlg(() => selectedYear = v),
                          ),
                          const SizedBox(height: 16),

                          // Course Filter
                          _dlgLabel('Filter by Course'),
                          const SizedBox(height: 8),
                          _dlgDropdown(
                            value: selectedProgramId,
                            hint: 'All courses',
                            items: [
                              const DropdownMenuItem(value: null, child: Text('All courses')),
                              ..._courses.map((c) => DropdownMenuItem(
                                value: c['_id'].toString(),
                                child: Text('${c['code'] ?? ''} — ${c['name'] ?? ''}'),
                              )),
                            ],
                            onChanged: (v) => setDlg(() => selectedProgramId = v),
                          ),
                          const SizedBox(height: 16),

                          // Branch Filter
                          _dlgLabel('Filter by Branch'),
                          const SizedBox(height: 8),
                          _dlgDropdown(
                            value: selectedBranchId,
                            hint: 'All branches',
                            items: [
                              const DropdownMenuItem(value: null, child: Text('All branches')),
                              ..._branches.map((b) => DropdownMenuItem(
                                value: b['_id'].toString(),
                                child: Text(b['name'] ?? b['code'] ?? ''),
                              )),
                            ],
                            onChanged: (v) => setDlg(() => selectedBranchId = v),
                          ),
                          const SizedBox(height: 20),

                          // Semester Picker
                          _dlgLabel('Promote to Semester'),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: List.generate(8, (i) {
                              final sem = i + 1;
                              final selected = selectedSemester == sem;
                              return GestureDetector(
                                onTap: () => setDlg(() => selectedSemester = sem),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  margin: const EdgeInsets.symmetric(horizontal: 4),
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    gradient: selected
                                        ? const LinearGradient(
                                            colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                                          )
                                        : null,
                                    color: selected ? null : const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(12),
                                    boxShadow: selected
                                        ? [
                                            BoxShadow(
                                              color: const Color(0xFF6366F1).withValues(alpha: 0.4),
                                              blurRadius: 12,
                                              offset: const Offset(0, 4),
                                            ),
                                          ]
                                        : [],
                                  ),
                                  child: Center(
                                    child: Text(
                                      '$sem',
                                      style: TextStyle(
                                        color: selected ? Colors.white : Colors.grey.shade600,
                                        fontWeight: FontWeight.w900,
                                        fontSize: 15,
                                      ),
                                    ),
                                  ),
                                ),
                              );
                            }),
                          ),
                          const SizedBox(height: 20),

                          // Preview Badge
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: previewCount > 0
                                  ? const Color(0xFFF0FDF4)
                                  : const Color(0xFFFFF7ED),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: previewCount > 0
                                    ? const Color(0xFF10B981).withValues(alpha: 0.3)
                                    : const Color(0xFFF59E0B).withValues(alpha: 0.3),
                              ),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  previewCount > 0
                                      ? Icons.groups_rounded
                                      : Icons.warning_amber_rounded,
                                  color: previewCount > 0
                                      ? const Color(0xFF10B981)
                                      : const Color(0xFFF59E0B),
                                  size: 20,
                                ),
                                const SizedBox(width: 12),
                                RichText(
                                  text: TextSpan(
                                    style: const TextStyle(fontSize: 13),
                                    children: [
                                      TextSpan(
                                        text: '$previewCount students ',
                                        style: TextStyle(
                                          fontWeight: FontWeight.w900,
                                          color: previewCount > 0
                                              ? const Color(0xFF10B981)
                                              : const Color(0xFFF59E0B),
                                          fontSize: 15,
                                        ),
                                      ),
                                      TextSpan(
                                        text: previewCount > 0
                                            ? 'will be promoted to Semester $selectedSemester'
                                            : 'match current filters — adjust filters above',
                                        style: TextStyle(
                                          color: Colors.grey.shade600,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Action Buttons
                          Row(
                            children: [
                              Expanded(
                                child: TextButton(
                                  onPressed: () => Navigator.pop(ctx),
                                  style: TextButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(14),
                                      side: BorderSide(color: Colors.grey.shade200),
                                    ),
                                  ),
                                  child: const Text('Cancel', style: TextStyle(fontWeight: FontWeight.bold)),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                flex: 2,
                                child: Container(
                                  decoration: BoxDecoration(
                                    gradient: previewCount > 0
                                        ? const LinearGradient(
                                            colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                                          )
                                        : null,
                                    color: previewCount == 0 ? Colors.grey.shade200 : null,
                                    borderRadius: BorderRadius.circular(14),
                                    boxShadow: previewCount > 0
                                        ? [
                                            BoxShadow(
                                              color: const Color(0xFF6366F1).withValues(alpha: 0.3),
                                              blurRadius: 12,
                                              offset: const Offset(0, 6),
                                            ),
                                          ]
                                        : [],
                                  ),
                                  child: ElevatedButton.icon(
                                    onPressed: previewCount == 0 || isUpdating
                                        ? null
                                        : () async {
                                            setDlg(() => isUpdating = true);
                                            try {
                                              final result = await StudentService.batchUpdateSemester(
                                                sessionYear: selectedYear,
                                                selectedProgram: selectedProgramId,
                                                selectedBranch: selectedBranchId,
                                                newSemester: selectedSemester,
                                              );
                                              if (mounted) {
                                                Navigator.pop(ctx);
                                                _loadData();
                                                ScaffoldMessenger.of(context).showSnackBar(
                                                  SnackBar(
                                                    backgroundColor: const Color(0xFF10B981),
                                                    behavior: SnackBarBehavior.floating,
                                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                                    content: Row(
                                                      children: [
                                                        const Icon(Icons.check_circle_rounded, color: Colors.white),
                                                        const SizedBox(width: 12),
                                                        Text(
                                                          '${result['modifiedCount']} students promoted to Semester $selectedSemester!',
                                                          style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                );
                                              }
                                            } catch (e) {
                                              setDlg(() => isUpdating = false);
                                              if (mounted) {
                                                ScaffoldMessenger.of(context).showSnackBar(
                                                  SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
                                                );
                                              }
                                            }
                                          },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.transparent,
                                      shadowColor: Colors.transparent,
                                      padding: const EdgeInsets.symmetric(vertical: 16),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                                    ),
                                    icon: isUpdating
                                        ? const SizedBox(
                                            width: 16, height: 16,
                                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                          )
                                        : const Icon(Icons.upgrade_rounded, color: Colors.white, size: 18),
                                    label: Text(
                                      isUpdating ? 'Updating...' : 'Promote to Sem $selectedSemester',
                                      style: TextStyle(
                                        color: previewCount > 0 ? Colors.white : Colors.grey,
                                        fontWeight: FontWeight.w900,
                                        fontSize: 13,
                                      ),
                                    ),
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
              ).animate().fadeIn(duration: 250.ms).scale(begin: const Offset(0.95, 0.95)),
            );
          },
        ),
      ),
    );
  }

  Widget _dlgLabel(String text) => Text(
        text,
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF374151)),
      );

  Widget _dlgDropdown({
    required String? value,
    required String hint,
    required List<DropdownMenuItem<String?>> items,
    required void Function(String?) onChanged,
  }) =>
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 14),
        decoration: BoxDecoration(
          color: const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: const Color(0xFFE2E8F0)),
        ),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<String?>(
            value: value,
            isExpanded: true,
            hint: Text(hint, style: TextStyle(color: Colors.grey.shade400, fontSize: 13)),
            items: items,
            onChanged: onChanged,
            style: const TextStyle(color: Color(0xFF1E293B), fontSize: 13, fontWeight: FontWeight.w500),
          ),
        ),
      );

  Map<String, Map<String, dynamic>> get _programStats {
    final Map<String, Color> colors = {
      '0': const Color(0xFF4F46E5),
      '1': const Color(0xFFEA580C),
      '2': const Color(0xFF7C3AED),
      '3': const Color(0xFF0D9488),
      '4': const Color(0xFFDB2777),
      '5': const Color(0xFF2563EB),
      '6': const Color(0xFF059669),
      '7': const Color(0xFF9333EA),
      '8': const Color(0xFFDC2626),
    };

    final stats = <String, Map<String, dynamic>>{};

    // Initialize stats from database courses
    int colorIndex = 0;
    for (var c in _courses) {
      final id = c['_id'] as String;
      final name = c['name'] ?? 'Unknown Course';
      final cap = c['intakeCapacity'] ?? 100;

      stats[id] = {
        'name': name,
        'total': cap,
        'filled': 0,
        'color': colors[(colorIndex % colors.length).toString()] ?? Colors.grey,
      };
      colorIndex++;
    }

    // Count students (only Active/Approved/Accepted count as filled seats)
    for (var student in _students) {
      final progRaw = student['selectedProgram'];
      final status = student['status'] as String?;
      final studentStatus = student['studentStatus'] as String?;
      
      if (progRaw == null) continue;
      
      String? matchedId;
      if (progRaw is Map) {
        matchedId = progRaw['_id']?.toString();
      } else {
        matchedId = progRaw.toString();
        // Check if progVal is actually a name, if so match to ID
        if (!stats.containsKey(matchedId)) {
          final match = _courses.firstWhere((c) => c['name'] == matchedId, orElse: () => null);
          if (match != null) matchedId = match['_id'] as String?;
        }
      }

      if (matchedId != null && stats.containsKey(matchedId)) {
        if (status == 'Accepted' ||
            status == 'Approved' ||
            studentStatus == 'Active') {
          stats[matchedId]!['filled'] =
              (stats[matchedId]!['filled'] as int) + 1;
        }
      }
    }

    return stats;
  }

  List<dynamic> get _filtered {
     return _students.where((a) {
        // Status filter
        final status = a['status'] as String? ?? 'Pending';
        bool matchesStatus = _activeFilter == 'All';
        if (!matchesStatus) {
           if (_activeFilter == 'Approved') {
              matchesStatus = (status == 'Approved' || status == 'Accepted');
           } else {
              matchesStatus = (status == _activeFilter);
           }
        }
        if (!matchesStatus) return false;

        // Search query
        if (_searchQuery.isNotEmpty) {
           final q = _searchQuery.toLowerCase();
           final name = "${a['firstName']} ${a['lastName']}".toLowerCase();
           final id = "${a['studentId'] ?? ''} ${a['admissionNumber'] ?? ''} ${a['aadharNumber'] ?? ''}".toLowerCase();
           
           final courseRaw = a['selectedProgram'];
           String courseName = '';
           if (courseRaw is Map) {
             courseName = (courseRaw['name'] ?? '').toString().toLowerCase();
           } else if (courseRaw != null) {
             courseName = (_courses.firstWhere((c) => c['_id'] == courseRaw, orElse: () => {})['name'] ?? '').toString().toLowerCase();
           }

           if (!name.contains(q) && !id.contains(q) && !courseName.contains(q)) return false;
        }

        // Branch filter
        if (_selectedBranchFilter != null && _selectedBranchFilter!.isNotEmpty) {
           final branchRaw = a['selectedBranch'];
           final bId = branchRaw is Map ? branchRaw['_id']?.toString() : branchRaw?.toString();
           if (bId != _selectedBranchFilter) return false;
        }

        // Year filter
        if (_selectedYearFilter != null && _selectedYearFilter!.isNotEmpty) {
           if (a['sessionYear']?.toString() != _selectedYearFilter) return false;
        }

        return true;
     }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final isMobile = width < 850;
        final isNarrow = width < 1200;

        return Container(
          color: const Color(0xFFF8F6F6),
          child: Column(
            children: [
              _buildHeader(context, width),
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : SingleChildScrollView(
                        padding: EdgeInsets.all(isMobile ? 16 : 32),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildKPICards(width),
                            SizedBox(height: isMobile ? 24 : 36),
                            if (isNarrow) ...[
                              _buildProgramAllocation(width),
                              const SizedBox(height: 24),
                              _buildAdmissionFunnel(),
                            ] else
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    flex: 5,
                                    child: _buildProgramAllocation(width),
                                  ),
                                  const SizedBox(width: 28),
                                  Expanded(
                                    flex: 2,
                                    child: _buildAdmissionFunnel(),
                                  ),
                                ],
                              ),
                            SizedBox(height: isMobile ? 24 : 36),
                            _buildstudentsCardSection(context, width),
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

  // ─────────── HEADER ───────────
  Widget _buildHeader(BuildContext context, double width) {
    bool isMobile = width < 700;
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 16 : 40,
        vertical: isMobile ? 16 : 22,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFF1F1F1))),
      ),
      child: isMobile
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "students",
                  style: AppTheme.titleStyle.copyWith(fontSize: 22),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _gradientBtn(
                        context,
                        Icons.post_add_rounded,
                        "New student",
                      ),
                    ),
                    const SizedBox(width: 10),
                    _headerBtn(
                      Icons.file_download_rounded,
                      "",
                      const Color(0xFF4F46E5),
                    ),
                  ],
                ),
              ],
            )
          : Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Enrollment & students",
                      style: AppTheme.titleStyle.copyWith(fontSize: 26),
                    ),
                    Text(
                      "Academic Year 2023–24 • Intake open",
                      style: TextStyle(
                        color: Colors.grey.shade500,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                Row(
                  children: [
                    _headerBtn(
                      Icons.file_download_rounded,
                      "Export Report",
                      const Color(0xFF4F46E5),
                    ),
                    const SizedBox(width: 14),
                    // ─── Batch Semester Promote ───
                    Container(
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                        ),
                        borderRadius: BorderRadius.circular(13),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF6366F1).withValues(alpha: 0.3),
                            blurRadius: 14,
                            offset: const Offset(0, 6),
                          ),
                        ],
                      ),
                      child: ElevatedButton.icon(
                        onPressed: _showBatchSemesterDialog,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
                        ),
                        icon: const Icon(Icons.upgrade_rounded, color: Colors.white, size: 18),
                        label: const Text(
                          'Batch Promote',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                        ),
                      ),
                    ),
                    const SizedBox(width: 14),
                    _gradientBtn(
                      context,
                      Icons.post_add_rounded,
                      "New student",
                    ),
                  ],
                ),
              ],
            ),
    );
  }

  Widget _headerBtn(IconData icon, String label, Color color) {
    return ElevatedButton.icon(
      onPressed: () {},
      style: ElevatedButton.styleFrom(
        backgroundColor: color.withValues(alpha: 0.08),
        shadowColor: Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
      ),
      icon: Icon(icon, color: color, size: 18),
      label: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 13,
        ),
      ),
    );
  }

  Widget _gradientBtn(BuildContext context, IconData icon, String label) {
    return Container(
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(13),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryRed.withValues(alpha: 0.3),
            blurRadius: 14,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ElevatedButton.icon(
        onPressed: () =>
            Navigator.push(context, _slideRoute(const CreateStudentScreen())),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(13),
          ),
        ),
        icon: Icon(icon, color: Colors.white, size: 18),
        label: Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  // ─────────── KPI CARDS ───────────
  Widget _buildKPICards(double width) {
    bool isMobile = width < 850;

    final totalCount = _students.length;
    final pendingCount = _students
        .where((a) => a['status'] == 'Pending')
        .length;
    final approvedCount = _students
        .where((a) => a['status'] == 'Accepted' || a['status'] == 'Approved')
        .length;
    final rejectedCount = _students
        .where((a) => a['status'] == 'Rejected')
        .length;

    final cards = [
      {
        "label": "Total students",
        "value": totalCount.toString(),
        "sub": "Across all programs",
        "icon": Icons.inbox_rounded,
        "colors": [const Color(0xFF880E4F), const Color(0xFFEC1349)],
      },
      {
        "label": "Pending Review",
        "value": pendingCount.toString(),
        "sub": "Action required",
        "icon": Icons.pending_actions_rounded,
        "colors": [const Color(0xFFB45309), const Color(0xFFF59E0B)],
      },
      {
        "label": "Approved",
        "value": approvedCount.toString(),
        "sub": "Offer letters sent",
        "icon": Icons.check_circle_rounded,
        "colors": [const Color(0xFF065F46), const Color(0xFF10B981)],
      },
      {
        "label": "Rejected",
        "value": rejectedCount.toString(),
        "sub": "Ineligible candidates",
        "icon": Icons.cancel_rounded,
        "colors": [const Color(0xFF7F1D1D), const Color(0xFFEF4444)],
      },
    ];

    if (isMobile) {
      return SizedBox(
        height: 195,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          itemCount: cards.length,
          separatorBuilder: (_, _) => const SizedBox(width: 16),
          itemBuilder: (context, i) {
            final c = cards[i];
            return SizedBox(
              width: width * 0.75,
              child: _kpiCard(
                c['label'] as String,
                c['value'] as String,
                c['sub'] as String,
                c['icon'] as IconData,
                c['colors'] as List<Color>,
                i,
              ),
            );
          },
        ),
      );
    }

    return Row(
      children: List.generate(cards.length, (i) {
        final c = cards[i];
        final colors = c['colors'] as List<Color>;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: i < cards.length - 1 ? 20 : 0),
            child: _kpiCard(
              c['label'] as String,
              c['value'] as String,
              c['sub'] as String,
              c['icon'] as IconData,
              colors,
              i,
            ),
          ),
        );
      }),
    );
  }

  Widget _kpiCard(
    String label,
    String value,
    String sub,
    IconData icon,
    List<Color> colors,
    int index,
  ) {
    return _HoverCard(
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: colors,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: colors.last.withValues(alpha: 0.25),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Stack(
          children: [
            Positioned(
              right: -16,
              bottom: -16,
              child: Icon(
                icon,
                size: 80,
                color: Colors.white.withValues(alpha: 0.07),
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: Colors.white, size: 22),
                ),
                const SizedBox(height: 20),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 34,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    height: 1,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Colors.white.withValues(alpha: 0.85),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  sub,
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.white.withValues(alpha: 0.6),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ).animate(delay: (index * 80).ms).fadeIn().slideY(begin: 0.2);
  }

  // ─────────── PROGRAM ALLOCATION ───────────
  Widget _buildProgramAllocation(double width) {
    final stats = _programStats.values.toList();
    final isVeryWide = width > 1400;
    final isMobile = width < 850;

    return Container(
      padding: const EdgeInsets.all(28),
      decoration: _panelDecor(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "Program-wise Seat Allocation",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              _liveBadge(),
            ],
          ),
          const SizedBox(height: 28),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: stats.length,
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: isMobile ? 1 : (isVeryWide ? 3 : 2),
              crossAxisSpacing: 20,
              mainAxisSpacing: 20,
              mainAxisExtent: 130,
            ),
            itemBuilder: (context, i) {
              final p = stats[i];
              final total = p['total'] as int;
              final filled = p['filled'] as int;
              final fill = total > 0 ? filled / total : 0.0;
              return _programCard(
                p['name'],
                fill,
                total,
                filled,
                p['color'],
                i,
              );
            },
          ),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms).slideX(begin: -0.1);
  }

  Widget _liveBadge() => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: const Color(0xFFF0FDF4),
      borderRadius: BorderRadius.circular(8),
    ),
    child: const Row(
      children: [
        Icon(Icons.circle, color: Colors.green, size: 8),
        SizedBox(width: 6),
        Text(
          "Live",
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: Colors.green,
          ),
        ),
      ],
    ),
  );

  Widget _programCard(
    String name,
    double fill,
    int total,
    int filled,
    Color color,
    int index,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  name,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Text(
                "${(fill * 100).toInt()}%",
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w900,
                  fontSize: 12,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Stack(
            children: [
              Container(
                height: 6,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              FractionallySizedBox(
                alignment: Alignment.centerLeft,
                widthFactor: fill,
                child: Container(
                  height: 6,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [color, color.withValues(alpha: 0.6)],
                    ),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Filled Seats",
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Text(
                "$filled / $total",
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ─────────── FUNNEL ───────────
  Widget _buildAdmissionFunnel() {
    final total = _students.length;
    final pending = _students.where((a) => a['status'] == 'Pending').length;
    final reviewed = total - pending;
    final admitted = _students
        .where((a) => a['status'] == 'Accepted' || a['status'] == 'Approved')
        .length;

    final steps = [
      {"label": "Applied", "value": total, "color": const Color(0xFF6366F1)},
      {
        "label": "Reviewed",
        "value": reviewed,
        "color": const Color(0xFFEC1349),
      },
      {
        "label": "Admitted",
        "value": admitted,
        "color": const Color(0xFF10B981),
      },
    ];
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: _panelDecor(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Admission Pipeline",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          Text(
            "Funnel overview • AY 2023-24",
            style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
          ),
          const SizedBox(height: 28),
          ...List.generate(steps.length, (i) {
            final s = steps[i];
            final pct = total > 0 ? (s['value'] as int) / total : 0.0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        s['label'] as String,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                      Text(
                        (s['value'] as int).toString(),
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 15,
                          color: s['color'] as Color,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  FractionallySizedBox(
                        alignment: Alignment.centerLeft,
                        widthFactor: pct,
                        child: Container(
                          height: 34,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                (s['color'] as Color).withValues(alpha: 0.85),
                                (s['color'] as Color).withValues(alpha: 0.4),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      )
                      .animate(delay: (i * 120).ms)
                      .scaleX(
                        alignment: Alignment.centerLeft,
                        duration: 600.ms,
                        curve: Curves.easeOutCubic,
                      ),
                ],
              ),
            );
          }),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.primaryRed.withValues(alpha: 0.06),
                  AppColors.primaryPink.withValues(alpha: 0.03),
                ],
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: AppColors.primaryRed.withValues(alpha: 0.1),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.trending_up_rounded,
                  color: AppColors.primaryRed,
                  size: 26,
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "Conversion Rate",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    RichText(
                      text: TextSpan(
                        children: [
                          TextSpan(
                            text:
                                "${total > 0 ? ((admitted / total) * 100).toStringAsFixed(1) : 0}%  ",
                            style: TextStyle(
                              color: AppColors.primaryRed,
                              fontWeight: FontWeight.w900,
                              fontSize: 18,
                            ),
                          ),
                          const TextSpan(
                            text: "Applied → Admitted",
                            style: TextStyle(color: Colors.grey, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms).slideX(begin: 0.1);
  }

  // ─────────── student CARDS ───────────
  Widget _buildstudentsCardSection(BuildContext context, double width) {
    bool isMobile = width < 850;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header row
        if (isMobile)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Students",
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              _buildSearchBar(),
              const SizedBox(height: 12),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildFilterTabs(),
                    const SizedBox(width: 12),
                    _buildBranchDropdown(),
                    const SizedBox(width: 12),
                    _buildYearDropdown(),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              _buildMeritButton(),
            ],
          )
        else
          Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Students",
                        style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        "${_filtered.length} records found",
                        style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      _buildFilterTabs(),
                      const SizedBox(width: 16),
                      _buildMeritButton(),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: _buildSearchBar()),
                  const SizedBox(width: 16),
                  _buildBranchDropdown(),
                  const SizedBox(width: 16),
                  _buildYearDropdown(),
                ],
              ),
            ],
          ),

        const SizedBox(height: 24),

        // TABLE VIEW
        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              headingTextStyle: const TextStyle(fontWeight: FontWeight.bold, color: Colors.grey),
              columnSpacing: 24,
              horizontalMargin: 24,
              dataRowMaxHeight: 64,
              dataRowMinHeight: 56,
              columns: const [
                DataColumn(label: Text("Applicant")),
                DataColumn(label: Text("Admission No / Aadhar")),
                DataColumn(label: Text("Course / Branch")),
                DataColumn(label: Text("Status")),
                DataColumn(label: Text("Actions")),
              ],
              rows: _filtered.asMap().entries.map((entry) {
                final int index = entry.key;
                final student = entry.value;
                return _buildStudentDataRow(student, index);
              }).toList(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFilterTabs() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: _filters.map((t) {
          final sel = _activeFilter == t;
          return GestureDetector(
            onTap: () => setState(() => _activeFilter = t),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 9),
              decoration: BoxDecoration(
                color: sel ? AppColors.primaryRed : Colors.transparent,
                borderRadius: BorderRadius.circular(10),
                boxShadow: sel
                    ? [
                        BoxShadow(
                          color: AppColors.primaryRed.withValues(alpha: 0.25),
                          blurRadius: 8,
                        ),
                      ]
                    : [],
              ),
              child: Text(
                t,
                style: TextStyle(
                  fontWeight: sel ? FontWeight.bold : FontWeight.w500,
                  fontSize: 13,
                  color: sel ? Colors.white : Colors.grey.shade600,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      height: 42,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: TextField(
        onChanged: (val) => setState(() => _searchQuery = val),
        decoration: InputDecoration(
          hintText: "Search by name or admission no...",
          hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
          prefixIcon: const Icon(Icons.search, color: Colors.grey, size: 18),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }

  Widget _buildBranchDropdown() {
    return Container(
      height: 42,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedBranchFilter,
          hint: const Text("All Branches", style: TextStyle(fontSize: 13)),
          icon: const Icon(Icons.keyboard_arrow_down, size: 16),
          items: [
            const DropdownMenuItem(value: null, child: Text("All Branches", style: TextStyle(fontSize: 13))),
            ..._branches.map((b) => DropdownMenuItem(value: b['_id'].toString(), child: Text(b['code'] ?? b['name'] ?? '', style: const TextStyle(fontSize: 13)))),
          ],
          onChanged: (val) => setState(() => _selectedBranchFilter = val),
        ),
      ),
    );
  }

  Widget _buildYearDropdown() {
    return Container(
      height: 42,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _selectedYearFilter,
          hint: const Text("All Years", style: TextStyle(fontSize: 13)),
          icon: const Icon(Icons.keyboard_arrow_down, size: 16),
          items: [
            const DropdownMenuItem(value: null, child: Text("All Years", style: TextStyle(fontSize: 13))),
            ..._availableYears.map((y) => DropdownMenuItem(value: y, child: Text(y, style: const TextStyle(fontSize: 13)))),
          ],
          onChanged: (val) => setState(() => _selectedYearFilter = val),
        ),
      ),
    );
  }

  Widget _buildMeritButton() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.primaryRed.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primaryRed.withValues(alpha: 0.2)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.auto_awesome_rounded,
            color: AppColors.primaryRed,
            size: 16,
          ),
          const SizedBox(width: 8),
          Text(
            "Merit List",
            style: TextStyle(
              color: AppColors.primaryRed,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  DataRow _buildStudentDataRow(Map<String, dynamic> student, int index) {
    final status = student['status'] as String? ?? 'Pending';
    final statusColor = status == 'Accepted' || status == 'Approved'
        ? const Color(0xFF10B981)
        : status == 'Rejected'
        ? const Color(0xFFEF4444)
        : const Color(0xFFF59E0B);

    final courseRaw = student['selectedProgram'];
    String courseName = 'Unknown Course';
    if (courseRaw is Map) {
      courseName = courseRaw['name'] ?? 'Unknown Course';
    } else if (courseRaw != null) {
      courseName = _courses.firstWhere((c) => c['_id'] == courseRaw, orElse: () => {})['name'] ?? courseRaw.toString();
    }

    final branchRaw = student['selectedBranch'];
    String branchName = 'Unknown Branch';
    if (branchRaw is Map) {
      branchName = branchRaw['name'] ?? 'Unknown Branch';
    } else if (branchRaw != null) {
      branchName = _branches.firstWhere((b) => b['_id'] == branchRaw, orElse: () => {})['name'] ?? branchRaw.toString();
    }

    final name = "${student['firstName']} ${student['lastName']}";
    final avatar = student['applicantPhoto'] ?? "https://ui-avatars.com/api/?name=$name&background=random";
    final admnNo = student['admissionNumber'] ?? student['studentId'] ?? "#STU${index + 1}";
    final aadhar = student['aadharNumber'] ?? "No Aadhar";

    return DataRow(
      cells: [
        DataCell(
          Row(
            children: [
              CircleAvatar(radius: 18, backgroundImage: NetworkImage(avatar), backgroundColor: Colors.grey.shade100),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  Text(student['email'] ?? '', style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
                ],
              ),
            ],
          ),
        ),
        DataCell(
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(admnNo, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
              Text("Aadhar: $aadhar", style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
            ],
          ),
        ),
        DataCell(
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: courseName,
                      style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: AppColors.primaryRed),
                    ),
                    TextSpan(
                      text: "  (Sem ${student['selectedSemester'] ?? 1})",
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.blue),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 2),
              Text(branchName, style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
            ],
          ),
        ),
        DataCell(
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              status.toUpperCase(),
              style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 10),
            ),
          ),
        ),
        DataCell(
          Row(
            children: [
              IconButton(
                onPressed: () => Navigator.push(context, _slideRoute(StudentDetailScreen(student: student))),
                icon: const Icon(Icons.visibility_outlined, color: Colors.blue, size: 20),
                tooltip: 'View Details',
              ),
              IconButton(
                onPressed: () async {
                  final result = await Navigator.push(context, _slideRoute(CreateStudentScreen(student: student)));
                  if (result == true) _loadData();
                },
                icon: const Icon(Icons.edit_outlined, color: Colors.orange, size: 20),
                tooltip: 'Edit Student',
              ),
              IconButton(
                onPressed: () => _handleDelete(student['_id']),
                icon: const Icon(Icons.delete_outline_rounded, color: Colors.red, size: 20),
                tooltip: 'Delete',
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _miniInfo(IconData icon, String text) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(icon, size: 14, color: const Color(0xFF94A3B8)),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF475569),
              fontWeight: FontWeight.w600,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _actionBtn(
    String label,
    IconData icon,
    Color color,
    VoidCallback onTap,
  ) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w900,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _miniActionBtn(IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, size: 18, color: color),
      ),
    );
  }

  BoxDecoration _panelDecor() => BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(22),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withValues(alpha: 0.04),
        blurRadius: 20,
        offset: const Offset(0, 8),
      ),
    ],
  );

  Route _slideRoute(Widget page) => PageRouteBuilder(
    pageBuilder: (_, a, _) => page,
    transitionsBuilder: (_, a, _, child) => SlideTransition(
      position: a.drive(
        Tween(
          begin: const Offset(1, 0),
          end: Offset.zero,
        ).chain(CurveTween(curve: Curves.easeOutCubic)),
      ),
      child: child,
    ),
  );

  Widget _detailRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: Colors.grey.shade500),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade700,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

// ── Hover lift ──
class _HoverCard extends StatefulWidget {
  final Widget child;
  const _HoverCard({required this.child});

  @override
  State<_HoverCard> createState() => _HoverCardState();
}

class _HoverCardState extends State<_HoverCard> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: AnimatedScale(
        scale: _hovered ? 1.035 : 1.0,
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        child: widget.child,
      ),
    );
  }
}
