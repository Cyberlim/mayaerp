import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import '../../../core/services/notice_service.dart';
import '../../../core/services/course_service.dart';
import '../../../core/services/branch_service.dart';
import '../../../core/services/student_service.dart';

class StaffNoticesScreen extends StatefulWidget {
  const StaffNoticesScreen({super.key});

  @override
  State<StaffNoticesScreen> createState() => _StaffNoticesScreenState();
}

class _StaffNoticesScreenState extends State<StaffNoticesScreen> {
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _studentSearchController = TextEditingController();
  String? _targetClass;
  String? _selectedCourseId;
  String? _selectedBranchId;
  String? _selectedStudentId;
  
  final _formKey = GlobalKey<FormState>();

  final List<String> _baseTargets = ["All Classes", "Specific Course", "Specific Branch", "Individual Student", "Staff Only"];

  List<dynamic> _notices = [];
  List<dynamic> _courses = [];
  List<dynamic> _branches = [];
  List<dynamic> _students = [];
  List<dynamic> _filteredStudents = [];
  
  bool _isLoading = true;
  bool _isPublishing = false;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final futures = await Future.wait([
        NoticeService.getAllNotices(),
        CourseService.getAllCourses(),
        BranchService.getAllBranches(),
        StudentService.getAllStudents(),
      ]);

      setState(() {
        _notices = futures[0];
        _courses = futures[1];
        _branches = futures[2];
        _students = futures[3];
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading data: $e')));
      }
    }
  }

  Future<void> _publishNotice() async {
    if (!_formKey.currentState!.validate() || _targetClass == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all details')));
      return;
    }

    try {
      setState(() => _isPublishing = true);
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getString('user_id');

      if (userId != null) {
        await NoticeService.createNotice({
          "title": _titleController.text,
          "description": _descController.text,
          "targetClass": _targetClass,
          "author": userId,
          "courseId": _selectedCourseId,
          "branchId": _selectedBranchId,
          "studentId": _selectedStudentId,
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Notice published successfully')));
          _resetForm();
          _loadData();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error publishing notice: $e')));
      }
    } finally {
      if (mounted) setState(() => _isPublishing = false);
    }
  }

  void _resetForm() {
    _titleController.clear();
    _descController.clear();
    _studentSearchController.clear();
    setState(() {
      _targetClass = null;
      _selectedCourseId = null;
      _selectedBranchId = null;
      _selectedStudentId = null;
    });
  }

  Future<void> _deleteNotice(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Delete Notice"),
        content: const Text("Are you sure you want to delete this notice?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
          TextButton(onPressed: () => Navigator.pop(context, true), style: TextButton.styleFrom(foregroundColor: Colors.red), child: const Text("Delete")),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await NoticeService.deleteNotice(id);
        _loadData();
      } catch (e) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error deleting notice: $e')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 900;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: EdgeInsets.all(isMobile ? 16 : 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeader(isMobile),
                  const SizedBox(height: 32),
                  isMobile
                      ? Column(children: [_buildForm(), const SizedBox(height: 32), _buildNoticesList()])
                      : Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(flex: 3, child: _buildForm()),
                            const SizedBox(width: 32),
                            Expanded(flex: 2, child: _buildNoticesList()),
                          ],
                        ),
                ],
              ),
            ),
    );
  }

  Widget _buildHeader(bool isMobile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Notices & Communication", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), letterSpacing: -1)),
        const SizedBox(height: 4),
        Text("Publish announcements with granular targeting control.", style: TextStyle(fontSize: 14, color: Colors.grey.shade500)),
      ],
    ).animate().fadeIn().slideY(begin: -0.1);
  }

  Widget _buildForm() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade200), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 20, offset: const Offset(0, 5))]),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Create Notice", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: Color(0xFF1E293B))),
            const SizedBox(height: 24),
            _textField("Title", "Enter notice title...", _titleController),
            const SizedBox(height: 20),
            _textField("Description", "Enter detailed notice content...", _descController, maxLines: 4),
            const SizedBox(height: 20),
            _dropdown("Primary Target", _baseTargets, _targetClass, (v) {
              setState(() {
                _targetClass = v;
                _selectedCourseId = null;
                _selectedBranchId = null;
                _selectedStudentId = null;
              });
            }),
            
            if (_targetClass == "Specific Course") ...[
              const SizedBox(height: 20),
              _idDropdown("Select Course", _courses, _selectedCourseId, (v) => setState(() => _selectedCourseId = v)),
            ],
            
            if (_targetClass == "Specific Branch") ...[
              const SizedBox(height: 20),
              _idDropdown("Select Branch", _branches, _selectedBranchId, (v) => setState(() => _selectedBranchId = v)),
            ],

            if (_targetClass == "Individual Student") ...[
              const SizedBox(height: 20),
              _studentSearchField(),
            ],

            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isPublishing ? null : _publishNotice,
                icon: _isPublishing
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.send_rounded, color: Colors.white, size: 18),
                label: Text(_isPublishing ? "Publishing..." : "Publish Notice", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), padding: const EdgeInsets.symmetric(vertical: 20), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 200.ms).slideY();
  }

  Widget _textField(String label, String hint, TextEditingController controller, {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          validator: (v) => (v == null || v.isEmpty) ? "Field cannot be empty" : null,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF10B981))),
          ),
        ),
      ],
    );
  }

  Widget _dropdown(String label, List<String> items, String? val, Function(String?) onCh) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: val,
              isExpanded: true,
              hint: Text("Select $label", style: TextStyle(color: Colors.grey.shade400, fontSize: 14)),
              icon: Icon(Icons.keyboard_arrow_down_rounded, color: Colors.grey.shade400),
              items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 14)))).toList(),
              onChanged: onCh,
            ),
          ),
        ),
      ],
    );
  }

  Widget _idDropdown(String label, List<dynamic> items, String? val, Function(String?) onCh) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: val,
              isExpanded: true,
              hint: Text(label, style: TextStyle(color: Colors.grey.shade400, fontSize: 14)),
              icon: Icon(Icons.keyboard_arrow_down_rounded, color: Colors.grey.shade400),
              items: items.map((e) => DropdownMenuItem(value: e['_id'].toString(), child: Text(e['name'] ?? 'Unknown', style: const TextStyle(fontSize: 14)))).toList(),
              onChanged: onCh,
            ),
          ),
        ),
      ],
    );
  }

  Widget _studentSearchField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Select Student", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
        const SizedBox(height: 8),
        TextField(
          controller: _studentSearchController,
          onChanged: (v) {
             setState(() {
               if (v.isEmpty) {
                 _filteredStudents = [];
               } else {
                 _filteredStudents = _students.where((s) {
                   final n = "${s['firstName']} ${s['lastName']}".toLowerCase();
                   final id = (s['studentId'] ?? '').toString().toLowerCase();
                   return n.contains(v.toLowerCase()) || id.contains(v.toLowerCase());
                 }).take(5).toList();
               }
             });
          },
          decoration: InputDecoration(
            hintText: "Search student by name or ID...",
            prefixIcon: const Icon(Icons.search_rounded),
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
          ),
        ),
        if (_filteredStudents.isNotEmpty) ...[
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
            child: Column(
              children: _filteredStudents.map((s) => ListTile(
                title: Text("${s['firstName']} ${s['lastName']}"),
                subtitle: Text("ID: ${s['studentId'] ?? 'N/A'}"),
                onTap: () {
                  setState(() {
                    _selectedStudentId = s['_id'];
                    _studentSearchController.text = "${s['firstName']} ${s['lastName']}";
                    _filteredStudents = [];
                  });
                },
              )).toList(),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildNoticesList() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade200), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 20, offset: const Offset(0, 5))]),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Recent Notices", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: Color(0xFF1E293B))),
          const SizedBox(height: 24),
          _notices.isEmpty
              ? Center(child: Padding(padding: const EdgeInsets.all(32), child: Text("No notices found", style: TextStyle(color: Colors.grey.shade400))))
              : ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _notices.length,
                  separatorBuilder: (context, index) => const Divider(height: 32),
                  itemBuilder: (context, index) {
                    final n = _notices[index];
                    final date = DateTime.parse(n['createdAt']);
                    final formattedDate = DateFormat('dd MMM yyyy').format(date);
                    
                    // Specific target label
                    String targetLabel = n['targetClass'] ?? "Notification";
                    if (n['courseId'] != null) targetLabel = "Course: ${n['courseId']['name']}";
                    if (n['branchId'] != null) targetLabel = "Branch: ${n['branchId']['name']}";
                    if (n['studentId'] != null) targetLabel = "Student: ${n['studentId']['firstName']} ${n['studentId']['lastName']}";

                    final Color color = n['studentId'] != null ? Colors.purple : (n['courseId'] != null || n['branchId'] != null ? Colors.blue : Colors.orange);

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)), child: Text(targetLabel, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 11))),
                            Text(formattedDate, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey.shade500)),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(n['title'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFF1E293B))),
                        const SizedBox(height: 8),
                        Text(n['description'], style: TextStyle(color: Colors.grey.shade600, fontSize: 14, height: 1.5)),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Icon(Icons.visibility_rounded, size: 16, color: Colors.grey.shade400),
                            const SizedBox(width: 4),
                            Text("${n['views']} views", style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade500)),
                            const Spacer(),
                            IconButton(onPressed: () => _deleteNotice(n['_id']), icon: const Icon(Icons.delete_rounded, color: Colors.red, size: 18), padding: EdgeInsets.zero, constraints: const BoxConstraints(), splashRadius: 20),
                          ],
                        ),
                      ],
                    );
                  },
                ),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms).slideX(begin: 0.1);
  }
}
