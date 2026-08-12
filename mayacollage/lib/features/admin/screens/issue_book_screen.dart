import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/app_constants.dart';
import '../../../core/services/branch_service.dart';
import '../../../core/services/course_service.dart';
import '../../../core/services/student_service.dart';
import '../../../core/services/book_service.dart';
import '../../../core/services/library_service.dart';
import 'package:intl/intl.dart';

class IssueBookScreen extends StatefulWidget {
  const IssueBookScreen({super.key});

  @override
  State<IssueBookScreen> createState() => _IssueBookScreenState();
}

class _IssueBookScreenState extends State<IssueBookScreen> {
  final _formKey = GlobalKey<FormState>();
  List<dynamic> _filteredStudents = [];
  List<dynamic> _branches = [];
  List<dynamic> _courses = [];
  List<dynamic> _availableBooks = [];

  String? _selectedDeptId; 
  String? _selectedCourseId;
  String? _selectedStudentId;
  String? _selectedBookId;
  final DateTime _dueDate = DateTime.now().add(const Duration(days: 15));
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
      final bks = await BookService.getAllBooks();
      
      setState(() {
        _branches = br;
        _courses = cr;
        // Filter only books with available copies
        _availableBooks = bks.where((b) => b['availableCopies'] > 0).toList();
        
        if (_branches.isNotEmpty) _selectedDeptId = _branches[0]['_id'];
        if (_courses.isNotEmpty) _selectedCourseId = _courses[0]['_id'];
        _isLoading = false;
      });
      _loadStudents();
    } catch (e) {
      debugPrint("Error loading metadata: $e");
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadStudents() async {
    if (_selectedDeptId == null || _selectedCourseId == null) return;
    setState(() => _isLoading = true);
    try {
      final all = await StudentService.getAllStudents();
      setState(() {
        _filteredStudents = all.where((s) {
          final sBranch = s['selectedBranch'] is Map ? s['selectedBranch']['_id'] : s['selectedBranch'];
          final sCourse = s['selectedProgram'] is Map ? s['selectedProgram']['_id'] : s['selectedProgram'];
          return sBranch == _selectedDeptId && sCourse == _selectedCourseId;
        }).toList();
        
        // Reset selection if the current student is no longer in the filtered list
        if (_selectedStudentId != null && !_filteredStudents.any((s) => s['_id'] == _selectedStudentId)) {
          _selectedStudentId = null;
        }
        
        _isLoading = false;
      });
    } catch (e) {
      debugPrint("Error: $e");
      setState(() => _isLoading = false);
    }
  }

  Future<void> _issueBook() async {
    debugPrint("Attempting to issue book: Student=$_selectedStudentId, Book=$_selectedBookId");
    if (_selectedStudentId == null || _selectedBookId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Please select student and book")),
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final dateStr = _dueDate.toIso8601String().split('T')[0];
      await LibraryService.issueBook(
        studentId: _selectedStudentId!,
        bookId: _selectedBookId!,
        dueDate: dateStr,
      );
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Book issued successfully!")),
        );
        Navigator.pop(context, true);
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
    return LayoutBuilder(
      builder: (context, constraints) {
        final isMobile = constraints.maxWidth < 1100;

        return Scaffold(
          backgroundColor: const Color(0xFFF8F6F6),
          body: isMobile
              ? Column(
                  children: [
                    _buildPolicySidebar(isMobile),
                    if (_isLoading) const LinearProgressIndicator(),
                    Expanded(
                      child: Column(
                        children: [
                          _buildHeader(isMobile),
                          Expanded(
                            child: SingleChildScrollView(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 24,
                                vertical: 40,
                              ),
                              child: _buildIssueForm(isMobile),
                            ),
                          ),
                          _buildFooterActions(isMobile),
                        ],
                      ),
                    ),
                  ],
                )
              : Row(
                  children: [
                    // ── LEFT: Library Policy Sidebar ──
                    _buildPolicySidebar(isMobile),

                    // ── RIGHT: Issue Form ──
                    Expanded(
                      child: Column(
                        children: [
                          if (_isLoading) const LinearProgressIndicator(),
                          _buildHeader(isMobile),
                          Expanded(
                            child: SingleChildScrollView(
                              padding: const EdgeInsets.all(60),
                              child: _buildIssueForm(isMobile),
                            ),
                          ),
                          _buildFooterActions(isMobile),
                        ],
                      ),
                    ),
                  ],
                ),
        );
      },
    );
  }

  Widget _buildPolicySidebar(bool isMobile) {
    return Container(
      width: isMobile ? double.infinity : 380,
      padding: EdgeInsets.only(top: isMobile ? 40 : 0),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1E1B4B), Color(0xFF312E81)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            top: -50,
            right: -50,
            child: Icon(
              Icons.library_books_rounded,
              size: isMobile ? 150 : 200,
              color: Colors.white.withValues(alpha: 0.03),
            ),
          ),
          Padding(
            padding: EdgeInsets.all(isMobile ? 24 : 48),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                _backButton(),
                SizedBox(height: isMobile ? 32 : 60),
                Text(
                  "Issue Book Vault",
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: isMobile ? 26 : 34,
                    letterSpacing: -1.2,
                    height: 1.1,
                  ),
                ),
                const SizedBox(height: 20),
                if (!isMobile)
                  Text(
                    "Lending transactions must comply with institute library policies. Ensure valid student ID verification before submission.",
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.6),
                      fontSize: 14,
                      height: 1.5,
                    ),
                  ),
                if (!isMobile) const SizedBox(height: 60),

                if (!isMobile) ...[
                  _policyItem(
                    "Standard Loan Period",
                    "Students: 15 Days | Faculty: 45 Days",
                    Icons.calendar_today_rounded,
                  ),
                  const SizedBox(height: 24),
                  _policyItem(
                    "Late Return Fine",
                    "₹10 per delay day after due date",
                    Icons.gavel_rounded,
                  ),
                  const SizedBox(height: 24),
                  _policyItem(
                    "Maximum Limit",
                    "Up to 5 books at a time per student",
                    Icons.warning_amber_rounded,
                  ),
                ],

                if (!isMobile) const Spacer(),
                if (!isMobile) _libStatsSmall(),
                if (isMobile) ...[
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _miniStat("Total Stock", "22.4K"),
                      _miniStat("Issued", "1.8K"),
                      _miniStat("Available", "20.6K"),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _policyItem(String title, String sub, IconData icon) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white10,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: Colors.blueAccent, size: 20),
        ),
        const SizedBox(width: 20),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              Text(
                sub,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.5),
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _libStatsSmall() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _miniStat("Total Stock", "22.4K"),
          _miniStat("Issued", "1.8K"),
          _miniStat("Available", "20.6K"),
        ],
      ),
    );
  }

  static Widget _miniStat(String l, String v) => Column(
    children: [
      Text(l, style: const TextStyle(color: Colors.white38, fontSize: 10)),
      const SizedBox(height: 4),
      Text(
        v,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
          fontSize: 14,
        ),
      ),
    ],
  );

  Widget _buildHeader(bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 24 : 40,
        vertical: 24,
      ),
      color: Colors.white,
      child: Row(
        children: [
          const Icon(Icons.auto_stories_rounded, color: AppColors.primaryRed),
          const SizedBox(width: 16),
          if (!isMobile)
            Text(
              "Library Circulation",
              style: TextStyle(color: Colors.grey.shade500, fontSize: 14),
            ),
          if (!isMobile)
            const Icon(Icons.chevron_right_rounded, color: Colors.grey, size: 20),
          Text(
            isMobile ? "Issue New Book" : "New Lending Transaction",
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
          ),
          if (!isMobile) const Spacer(),
          if (!isMobile) _availabilityBadge("Stock Synchronized"),
        ],
      ),
    );
  }

  Widget _availabilityBadge(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.green.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Row(
        children: [
          const CircleAvatar(radius: 3, backgroundColor: Colors.green),
          const SizedBox(width: 8),
          Text(
            text,
            style: const TextStyle(
              color: Colors.green,
              fontWeight: FontWeight.bold,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIssueForm(bool isMobile) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Lending Details",
            style: TextStyle(
              fontSize: isMobile ? 22 : 28,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "Select the student and book details below to process the issue request.",
            style: TextStyle(color: Colors.grey.shade500, fontSize: isMobile ? 12 : 14),
          ),
          SizedBox(height: isMobile ? 32 : 48),

          _sectionTitle("1. Student Selection"),
          const SizedBox(height: 20),
          if (isMobile) ...[
            _dropdownField(
              "BRANCH",
              _branches.map((b) => b['name'].toString()).toList(),
              _branches.firstWhere((b) => b['_id'] == _selectedDeptId, orElse: () => {'name': ''})['name'],
              (v) {
                final id = _branches.firstWhere((b) => b['name'] == v)['_id'];
                setState(() => _selectedDeptId = id);
                _loadStudents();
              },
            ),
            const SizedBox(height: 20),
            _dropdownField(
              "COURSE",
              _courses.map((c) => c['name'].toString()).toList(),
              _courses.firstWhere((c) => c['_id'] == _selectedCourseId, orElse: () => {'name': ''})['name'],
              (v) {
                final id = _courses.firstWhere((c) => c['name'] == v)['_id'];
                setState(() => _selectedCourseId = id);
                _loadStudents();
              },
            ),
          ] else
            Row(
              children: [
                Expanded(
                  child: _dropdownField(
                    "BRANCH",
                    _branches.map((b) => b['name'].toString()).toList(),
                    _branches.firstWhere((b) => b['_id'] == _selectedDeptId, orElse: () => {'name': ''})['name'],
                    (v) {
                      final id = _branches.firstWhere((b) => b['name'] == v)['_id'];
                      setState(() => _selectedDeptId = id);
                      _loadStudents();
                    },
                  ),
                ),
                const SizedBox(width: 24),
                Expanded(
                  child: _dropdownField(
                    "COURSE",
                    _courses.map((c) => c['name'].toString()).toList(),
                    _courses.firstWhere((c) => c['_id'] == _selectedCourseId, orElse: () => {'name': ''})['name'],
                    (v) {
                      final id = _courses.firstWhere((c) => c['name'] == v)['_id'];
                      setState(() => _selectedCourseId = id);
                      _loadStudents();
                    },
                  ),
                ),
              ],
            ),
          const SizedBox(height: 24),
          _searchableDropdownField(
            "SELECT STUDENT",
            "Search student by name or ID...",
            _filteredStudents.map((s) => "${s['firstName']} ${s['lastName']} (${s['studentId']})").toList(),
            (() {
              if (_selectedStudentId == null || _filteredStudents.isEmpty) return "";
              final student = _filteredStudents.firstWhere(
                (s) => s['_id'] == _selectedStudentId,
                orElse: () => null,
              );
              return student != null ? "${student['firstName']} ${student['lastName']} (${student['studentId']})" : "";
            })(),
            (v) {
               final s = _filteredStudents.firstWhere((s) => "${s['firstName']} ${s['lastName']} (${s['studentId']})" == v, orElse: () => null);
               if (s != null) {
                 setState(() => _selectedStudentId = s['_id']);
               }
            },
          ),

          SizedBox(height: isMobile ? 32 : 48),
          _sectionTitle("2. Book Details"),
          const SizedBox(height: 20),
          _plainTextInputField(
            "BOOK TITLE / AUTHOR",
            "Enter full book name or author...",
            (v) {
               // Silently try to find the ID when they type the full name
               final b = _availableBooks.firstWhere(
                 (b) => "${b['title']} - ${b['author']}".toLowerCase() == v.trim().toLowerCase() ||
                        b['title'].toString().toLowerCase() == v.trim().toLowerCase(),
                 orElse: () => null
               );
               if (b != null) {
                 setState(() => _selectedBookId = b['_id']);
               } else {
                 setState(() => _selectedBookId = null);
               }
            },
          ),
          const SizedBox(height: 24),
          if (isMobile) ...[
            _datePickerField("ISSUE DATE", DateFormat('MMM dd, yyyy').format(DateTime.now())),
            const SizedBox(height: 20),
            _datePickerField("RETURN DEADLINE", DateFormat('MMM dd, yyyy').format(_dueDate)),
          ] else
            Row(
              children: [
                Expanded(child: _datePickerField("ISSUE DATE", DateFormat('MMM dd, yyyy').format(DateTime.now()))),
                const SizedBox(width: 24),
                Expanded(
                  child: _datePickerField("RETURN DEADLINE", DateFormat('MMM dd, yyyy').format(_dueDate)),
                ),
              ],
            ),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.05);
  }

  Widget _sectionTitle(String t) => Text(
    t,
    style: const TextStyle(
      fontWeight: FontWeight.bold,
      fontSize: 14,
      color: Colors.blueAccent,
    ),
  );



  Widget _searchableDropdownField(
    String label,
    String hint,
    List<String> options,
    String initialValue,
    Function(String) onSelected,
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
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 10),
        Autocomplete<String>(
          initialValue: TextEditingValue(text: initialValue),
          optionsBuilder: (TextEditingValue textEditingValue) {
            // If the user hasn't typed anything, show all options
            if (textEditingValue.text.isEmpty) {
              return options;
            }
            return options.where((String option) {
              return option.toLowerCase().contains(textEditingValue.text.toLowerCase());
            });
          },
          onSelected: onSelected,
          fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: focusNode.hasFocus ? [
                  BoxShadow(color: Colors.blue.withValues(alpha: 0.1), blurRadius: 4, spreadRadius: 1)
                ] : null,
              ),
              child: TextField(
                controller: controller,
                focusNode: focusNode,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                decoration: InputDecoration(
                  hintText: hint,
                  border: InputBorder.none,
                  hintStyle: const TextStyle(fontSize: 13, color: Colors.black26),
                  suffixIcon: Icon(
                    focusNode.hasFocus ? Icons.arrow_drop_up_rounded : Icons.arrow_drop_down_rounded,
                    color: Colors.grey,
                  ),
                ),
                onTap: () {
                   // Ensure options show up when clicking the field
                   if (controller.text.isEmpty) {
                     controller.text = " "; // Small trick to trigger options
                     controller.text = "";
                   }
                },
                onChanged: (v) {
                  if (options.contains(v)) {
                    onSelected(v);
                  }
                },
                onSubmitted: (v) => onFieldSubmitted(),
              ),
            );
          },
          optionsViewBuilder: (context, onSelected, options) {
            return Align(
              alignment: Alignment.topLeft,
              child: Material(
                elevation: 4.0,
                borderRadius: BorderRadius.circular(12),
                child: SizedBox(
                  width: 300,
                  height: 250,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(8.0),
                    itemCount: options.length,
                    itemBuilder: (BuildContext context, int index) {
                      final String option = options.elementAt(index);
                      return ListTile(
                        title: Text(option, style: const TextStyle(fontSize: 13)),
                        onTap: () => onSelected(option),
                      );
                    },
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _plainTextInputField(String label, String hint, Function(String) onCh) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: Colors.grey,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: TextField(
            onChanged: onCh,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
            decoration: InputDecoration(
              hintText: hint,
              border: InputBorder.none,
              hintStyle: const TextStyle(fontSize: 13, color: Colors.black26),
            ),
          ),
        ),
      ],
    );
  }

  Widget _dropdownField(
    String label,
    List<String> items,
    String? val,
    Function(String?) onCh,
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
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: val,
              isExpanded: true,
              hint: Text(
                "Select $label",
                style: const TextStyle(fontSize: 13, color: Colors.black26),
              ),
              items: items
                  .map(
                    (e) => DropdownMenuItem(
                      value: e,
                      child: Text(
                        e,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  )
                  .toList(),
              onChanged: onCh,
            ),
          ),
        ),
      ],
    );
  }

  Widget _datePickerField(String label, String date) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: Colors.grey,
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                date,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              const Icon(
                Icons.calendar_month_rounded,
                size: 18,
                color: Colors.blueAccent,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFooterActions(bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 24 : 40,
        vertical: isMobile ? 24 : 32,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFF1F1F1))),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isMobile)
            const Padding(
              padding: EdgeInsets.only(bottom: 20),
              child: Row(
                children: [
                  Icon(Icons.info_outline_rounded, color: Colors.grey, size: 16),
                  SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      "E-Receipt will be shared with the student automatically.",
                      style: TextStyle(color: Colors.grey, fontSize: 11),
                    ),
                  ),
                ],
              ),
            ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              if (!isMobile)
                const Row(
                  children: [
                    Icon(Icons.info_outline_rounded, color: Colors.grey, size: 16),
                    SizedBox(width: 12),
                    Text(
                      "E-Receipt will be shared with the student automatically.",
                      style: TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                ),
              if (isMobile)
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {},
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: const Text(
                      "Reset",
                      style: TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ),
                )
              else
                OutlinedButton(
                  onPressed: () {},
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 32,
                      vertical: 20,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: const Text(
                    "Reset",
                    style: TextStyle(
                      color: Colors.black,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              const SizedBox(width: 16),
              if (isMobile)
                Expanded(child: _mainBtn("Confirm Issue", isMobile, _issueBook))
              else
                _mainBtn("Confirm Issue", isMobile, _issueBook),
            ],
          ),
        ],
      ),
    );
  }

  Widget _mainBtn(String l, bool isMobile, VoidCallback onTp) {
    return Container(
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryRed.withValues(alpha: 0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: onTp,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          padding: EdgeInsets.symmetric(
            horizontal: isMobile ? 0 : 40,
            vertical: isMobile ? 18 : 20,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
        child: Text(
          l,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: Colors.white,
            fontSize: isMobile ? 13 : 14,
          ),
        ),
      ),
    );
  }

  Widget _backButton() => InkWell(
    onTap: () => Navigator.pop(context),
    child: Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white10,
        borderRadius: BorderRadius.circular(14),
      ),
      child: const Icon(
        Icons.arrow_back_ios_new_rounded,
        color: Colors.white,
        size: 16,
      ),
    ),
  );
}
