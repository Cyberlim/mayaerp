import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/services/library_service.dart';
import '../../../../core/services/student_service.dart';
import '../../../../core/services/book_service.dart';
import 'package:intl/intl.dart';

class IssueBookScreen extends StatefulWidget {
  const IssueBookScreen({super.key});

  @override
  State<IssueBookScreen> createState() => _IssueBookScreenState();
}

class _IssueBookScreenState extends State<IssueBookScreen> {
  bool _showIssueForm = false;
  String? _selectedStudentId; // Internal Mongo ID
  Map<String, dynamic>? _selectedStudentData;
  String _searchQuery = "";
  final TextEditingController _bookSearchController = TextEditingController();
  final TextEditingController _remarksController = TextEditingController();
  
  List<dynamic> _circulations = [];
  List<dynamic> _books = [];
  dynamic _selectedBook;
  bool _isLoading = true;
  bool _isSearchingStudent = false;
  Timer? _searchDebounce;

  DateTime _issueDate = DateTime.now();
  DateTime _dueDate = DateTime.now().add(const Duration(days: 14));

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _searchDebounce?.cancel();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      setState(() => _isLoading = true);
      final circ = await LibraryService.getCirculation();
      final bk = await BookService.getAllBooks();
      setState(() {
        _circulations = circ;
        _books = bk;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        debugPrint("Error loading circulation: $e");
      }
    }
  }

  Future<void> _searchStudent(String query) async {
    if (query.length < 3) return;
    setState(() => _isSearchingStudent = true);
    try {
      // We'll use the getAllStudents and filter locally for now to allow "Search All" 
      // or we can add a specific search API. Let's filter locally for immediate "Search All" feel
      // since the database is likely manageable for an admin panel.
      final allStudents = await StudentService.getAllStudents();
      final matches = allStudents.where((s) {
        final name = "${s['firstName']} ${s['lastName']}".toLowerCase();
        final id = s['studentId'].toString().toLowerCase();
        final roll = s['admissionNumber'].toString().toLowerCase();
        return name.contains(query.toLowerCase()) || id.contains(query.toLowerCase()) || roll.contains(query.toLowerCase());
      }).toList();

      if (matches.isNotEmpty) {
        setState(() {
          _selectedStudentData = matches.first;
          _selectedStudentId = matches.first['_id'];
          _isSearchingStudent = false;
        });
      } else {
        throw Exception("Not found");
      }
    } catch (e) {
      setState(() {
        _selectedStudentData = null;
        _selectedStudentId = null;
        _isSearchingStudent = false;
      });
    }
  }

  Future<void> _issueBook() async {
    if (_selectedStudentId == null || _selectedBook == null) return;
    
    try {
      setState(() => _isLoading = true);
      String due = DateFormat('yyyy-MM-dd').format(_dueDate);
      
      final result = await LibraryService.issueBook(
        studentId: _selectedStudentId!,
        bookId: _selectedBook['_id'],
        dueDate: due,
      );
      
      final String issueId = result['issueId'];
      final String serverOtp = result['otp']; // Mocking: in real app student sees this on portal

      setState(() => _isLoading = false);

      if (mounted) {
        _showOtpVerificationDialog(issueId, serverOtp);
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
      }
    }
  }

  void _showOtpVerificationDialog(String issueId, String serverOtp) {
    final TextEditingController otpController = TextEditingController();
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            bool verifying = false;
            return AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: const Column(
                children: [
                   Icon(Icons.security_rounded, size: 48, color: Color(0xFF4F46E5)),
                   SizedBox(height: 16),
                   Text("Student OTP Verification", textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w900)),
                ],
              ),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text("Please enter the 6-digit OTP shown on the student's portal.", textAlign: TextAlign.center, style: TextStyle(fontSize: 13, color: Colors.grey)),
                  const SizedBox(height: 16),
                  TextField(
                    controller: otpController,
                    keyboardType: TextInputType.number,
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 8),
                    textAlign: TextAlign.center,
                    maxLength: 6,
                    decoration: InputDecoration(
                      counterText: "",
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      hintText: "000000",
                      hintStyle: TextStyle(color: Colors.grey.shade300, letterSpacing: 8),
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(context), child: const Text("Cancel")),
                ElevatedButton(
                  onPressed: verifying ? null : () async {
                    if (otpController.text.length != 6) return;
                    setDialogState(() => verifying = true);
                    try {
                      await LibraryService.verifyIssue(issueId, otpController.text);
                      Navigator.pop(context); // Close dialog
                      _loadData(); // Reload circulation list
                      setState(() {
                         _showIssueForm = false;
                         _selectedBook = null;
                         _selectedStudentId = null;
                         _selectedStudentData = null;
                      });
                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Verification successful! Book issued.")));
                    } catch (e) {
                      setDialogState(() => verifying = false);
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF4F46E5)),
                  child: Text(verifying ? "Verifying..." : "Verify OTP", style: const TextStyle(color: Colors.white)),
                ),
              ],
            );
          }
        );
      },
    );
  }

  Future<void> _returnBook(String id) async {
    try {
      await LibraryService.returnBook(id);
      _loadData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Book returned successfully")));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
      }
    }
  }

  Future<void> _payFine(dynamic c) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Confirm Fine Payment", style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Student: ${c['student']?['firstName']} ${c['student']?['lastName']}"),
            Text("Book: ${c['book']?['title']}"),
            const SizedBox(height: 16),
            Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(12)), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [const Text("Collect Penalty", style: TextStyle(fontWeight: FontWeight.bold)), Text("₹ ${c['fine']}", style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.green, fontSize: 18))]))
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
          ElevatedButton(onPressed: () => Navigator.pop(context, true), style: ElevatedButton.styleFrom(backgroundColor: Colors.green), child: const Text("Mark as Paid", style: TextStyle(color: Colors.white))),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        setState(() => _isLoading = true);
        await LibraryService.payFine(c['_id']);
        _loadData();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Fine collected and book loan renewed!")));
      } catch (e) {
        if (mounted) {
           setState(() => _isLoading = false);
           ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        bool isMobile = constraints.maxWidth < 1100;

        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          body: _isLoading 
              ? const Center(child: CircularProgressIndicator())
              : _showIssueForm
                ? _buildIssueFormFull(isMobile)
                : _buildIssuesList(isMobile),
        );
      },
    );
  }

  // --- VIEW: ISSUES LIST ---
  Widget _buildIssuesList(bool isMobile) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(isMobile ? 16 : 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "Book Circulations",
                      style: TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF1E293B),
                        letterSpacing: -1,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Manage current and past book lending transactions.",
                      style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
                    ),
                  ],
                ),
              ),
              if (!isMobile)
                Container(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF4F46E5).withValues(alpha: 0.3),
                        blurRadius: 15,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: ElevatedButton.icon(
                    onPressed: () => setState(() => _showIssueForm = true),
                    icon: const Icon(Icons.add_rounded, color: Colors.white, size: 20),
                    label: const Text("Issue New Book", style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
                      backgroundColor: Colors.transparent,
                      shadowColor: Colors.transparent,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                  ),
                ).animate(onPlay: (controller) => controller.repeat(reverse: true)).shimmer(duration: 2.seconds, color: Colors.white24),
            ],
          ).animate().fadeIn().slideY(begin: -0.1),
          if (isMobile) ...[
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: Container(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(14),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF4F46E5).withValues(alpha: 0.3),
                      blurRadius: 15,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: ElevatedButton.icon(
                  onPressed: () => setState(() => _showIssueForm = true),
                  icon: const Icon(Icons.add_rounded, color: Colors.white, size: 20),
                  label: const Text("Issue New Book", style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                ),
              ).animate(onPlay: (controller) => controller.repeat(reverse: true)).shimmer(duration: 2.seconds, color: Colors.white24),
            ),
          ],
          const SizedBox(height: 32),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (!isMobile)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  child: Row(
                    children: [
                      Expanded(flex: 3, child: Text("BOOK", style: _headerStyle())),
                      Expanded(flex: 2, child: Text("STUDENT", style: _headerStyle())),
                      Expanded(flex: 2, child: Text("ISSUE / DUE", style: _headerStyle())),
                      Expanded(flex: 1, child: Text("FINE", style: _headerStyle())),
                      Expanded(flex: 1, child: Text("STATUS", style: _headerStyle())),
                      Expanded(flex: 2, child: Text("ACTIONS", style: _headerStyle(), textAlign: TextAlign.center)),
                    ],
                  ),
                ),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _circulations.length,
                itemBuilder: (context, index) {
                  final c = _circulations[index];
                  return Container(
                    margin: EdgeInsets.only(bottom: isMobile ? 12 : 16),
                    padding: EdgeInsets.all(isMobile ? 16 : 20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: Colors.white, width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF6366F1).withValues(alpha: 0.05),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: isMobile
                        ? _buildMobileCirculationRow(c)
                        : _buildDesktopCirculationRow(c),
                  ).animate().fadeIn(delay: (50 * index).ms).slideX(begin: 0.05, curve: Curves.easeOutQuad);
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  TextStyle _headerStyle() => TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade500, fontSize: 12, letterSpacing: 0.5);

  Widget _buildMobileCirculationRow(Map<String, dynamic> c) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                c['book']?['title'] ?? "Unknown Title",
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1E293B)),
              ),
            ),
            _statusBadge(c['status']),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            const Icon(Icons.person_rounded, size: 14, color: Colors.grey),
            const SizedBox(width: 6),
            Text("${c['student']?['firstName']} ${c['student']?['lastName']} (${c['student']?['studentId']})", style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Issue: ${c['issueDate'] != null ? DateFormat('MMM dd, yyyy').format(DateTime.parse(c['issueDate'])) : ''}", style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
                const SizedBox(height: 2),
                Text("Due: ${c['dueDate'] != null ? DateFormat('MMM dd, yyyy').format(DateTime.parse(c['dueDate'])) : ''}", style: TextStyle(color: c['status'] == 'Overdue' ? Colors.red : Colors.black87, fontSize: 12, fontWeight: FontWeight.bold)),
              ],
            ),
            Row(
              children: [
                if (c['fine'] != 0)
                  IconButton(
                    onPressed: () => _payFine(c),
                    icon: const Icon(Icons.payment_rounded, color: Colors.green, size: 20),
                    tooltip: "Pay Fine",
                  ),
                const SizedBox(width: 8),
                Container(
                  decoration: BoxDecoration(color: Colors.blue.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                  child: IconButton(onPressed: () {}, icon: const Icon(Icons.edit_rounded, color: Colors.blue, size: 18), padding: const EdgeInsets.all(6), constraints: const BoxConstraints()),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDesktopCirculationRow(Map<String, dynamic> c) {
    return Row(
      children: [
        Expanded(
          flex: 3,
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.book_rounded, color: Color(0xFF4F46E5), size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Text(
                  c['book']?['title'] ?? "Unknown Book",
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF1E293B)),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
        Expanded(
          flex: 2,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text("${c['student']?['firstName']} ${c['student']?['lastName']}", style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: Colors.black87)),
              Text("${c['student']?['studentId']}", style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
            ],
          ),
        ),
        Expanded(
          flex: 2,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(DateFormat('MMM dd, yyyy').format(DateTime.parse(c['issueDate'])), style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
              Text(DateFormat('MMM dd, yyyy').format(DateTime.parse(c['dueDate'])), style: TextStyle(color: c['status'] == 'Overdue' ? Colors.red : Colors.black87, fontWeight: FontWeight.bold, fontSize: 12)),
            ],
          ),
        ),
        Expanded(
          flex: 1,
          child: Text("₹ ${c['fine']}", style: TextStyle(color: c['fine'] == 0 ? Colors.grey : Colors.orange, fontWeight: FontWeight.w900, fontSize: 14)),
        ),
        Expanded(
          flex: 1,
          child: Align(alignment: Alignment.centerLeft, child: _statusBadge(c['status'])),
        ),
        Expanded(
          flex: 2,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (c['fine'] > 0)
                 TextButton(
                    onPressed: () => _payFine(c),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      backgroundColor: Colors.green.withValues(alpha: 0.1),
                    ),
                    child: const Text("Pay Fine", style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 12)),
                  ),
              if (c['fine'] > 0) const SizedBox(width: 8),
              if (c['status'] == 'Active' || c['status'] == 'Overdue')
                TextButton(
                  onPressed: () => _returnBook(c['_id']),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    backgroundColor: const Color(0xFF10B981).withValues(alpha: 0.1),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text("Return", style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                ),
              if (c['status'] == 'Active' || c['status'] == 'Overdue') const SizedBox(width: 8),
              Container(
                decoration: BoxDecoration(color: Colors.blue.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                child: IconButton(onPressed: () {}, icon: const Icon(Icons.edit_rounded, color: Colors.blue, size: 18), splashRadius: 20, constraints: const BoxConstraints(), padding: const EdgeInsets.all(8)),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // --- VIEW: ISSUE FORM ---
  Widget _buildIssueFormFull(bool isMobile) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(isMobile ? 16 : 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded),
                onPressed: () => setState(() => _showIssueForm = false),
              ),
              const SizedBox(width: 8),
              const Text(
                "Issue New Book",
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1E293B),
                ),
              ),
            ],
          ).animate().fadeIn().slideX(begin: -0.1),
          const SizedBox(height: 32),
          if (isMobile) ...[
            _buildStudentSearchSection(),
            const SizedBox(height: 32),
            if (_selectedStudentId != null) ...[
              _buildStudentProfileCard(),
              const SizedBox(height: 32),
              _buildIssueForm(),
            ],
          ] else ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  flex: 4,
                  child: Column(
                    children: [
                      _buildStudentSearchSection(),
                      const SizedBox(height: 24),
                      if (_selectedStudentId != null) _buildStudentProfileCard(),
                    ],
                  ),
                ),
                if (_selectedStudentId != null) ...[
                  const SizedBox(width: 32),
                  Expanded(
                    flex: 5,
                    child: _buildIssueForm(),
                  ),
                ] else ...[
                  const SizedBox(width: 32),
                  Expanded(
                    flex: 5,
                    child: Container(
                      height: 400,
                      decoration: BoxDecoration(
                        color: Colors.transparent,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.grey.shade300, style: BorderStyle.none),
                      ),
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.person_search_rounded, size: 80, color: Colors.grey.shade300),
                            const SizedBox(height: 16),
                            Text("Search and select a student\nto issue books.", textAlign: TextAlign.center, style: TextStyle(color: Colors.grey.shade500, fontSize: 16)),
                          ],
                        ),
                      ),
                    ),
                  ),
                ]
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStudentSearchSection() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "1. Select Student",
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 16),
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: TextField(
              onChanged: (val) {
                _searchDebounce?.cancel();
                if (val.trim().length >= 3) {
                    _searchDebounce = Timer(const Duration(milliseconds: 500), () {
                        _searchStudent(val.trim());
                    });
                } else {
                  setState(() {
                    _searchQuery = val.trim();
                    _selectedStudentId = null;
                    _selectedStudentData = null;
                  });
                }
              },
              decoration: InputDecoration(
                hintText: "Enter Student Roll No. (e.g. 2024CSAI)",
                hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                prefixIcon: const Icon(Icons.badge_outlined, color: Colors.grey),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 16),
              ),
            ),
          ),
          if (_isSearchingStudent)
             const Padding(padding: EdgeInsets.only(top: 12), child: LinearProgressIndicator()),
          if (_searchQuery.isNotEmpty && _selectedStudentId == null && !_isSearchingStudent)
            Padding(
              padding: const EdgeInsets.only(top: 12),
              child: Text(
                "No student found with Roll No '$_searchQuery'.",
                style: const TextStyle(color: Colors.red, fontSize: 13, fontWeight: FontWeight.bold),
              ),
            ),
        ],
      ),
    ).animate().fadeIn(delay: 100.ms);
  }

  Widget _buildStudentProfileCard() {
    final student = _selectedStudentData!;

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFF4F46E5).withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF4F46E5).withValues(alpha: 0.05),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundImage: student['applicantPhoto'] != null 
                    ? NetworkImage(student['applicantPhoto'])
                    : null,
                  child: student['applicantPhoto'] == null ? const Icon(Icons.person) : null,
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        "${student['firstName']} ${student['lastName']}",
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "${student['studentId']} • Semester ${student['semester']}",
                        style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.green.shade100,
                    borderRadius: BorderRadius.circular(100),
                  ),
                  child: const Text("Clear Status", style: TextStyle(color: Colors.green, fontSize: 12, fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _statBadge("Active Issues", "N/A", Icons.menu_book_rounded),
                    _statBadge("Limit", "5 Books", Icons.check_circle_outline),
                    _statBadge("Pending Fine", "₹ 0", Icons.currency_rupee_rounded, color: Colors.green),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.1);
  }

  Widget _statBadge(String label, String value, IconData icon, {Color color = const Color(0xFF4F46E5)}) {
    return Column(
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 4),
            Text(label, style: const TextStyle(color: Colors.grey, fontSize: 11)),
          ],
        ),
        const SizedBox(height: 4),
        Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: color)),
      ],
    );
  }

  Widget _buildIssueForm() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 20,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "2. Issue Book Parameters",
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          const SizedBox(height: 24),
          _buildBookPicker(),
          const SizedBox(height: 12),
          Align(
            alignment: Alignment.centerRight,
            child: TextButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.qr_code_scanner_rounded, size: 18),
              label: const Text("Scan Barcode"),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _datePickerField(
                "Issue Date", 
                _issueDate, 
                onChanged: (d) => setState(() {
                  _issueDate = d;
                  if (_dueDate.isBefore(_issueDate)) {
                    _dueDate = _issueDate.add(const Duration(days: 14));
                  }
                })
              )),
              const SizedBox(width: 20),
              Expanded(child: _datePickerField(
                "Return Due Date", 
                _dueDate,
                onChanged: (d) => setState(() => _dueDate = d)
              )),
            ],
          ),
          const SizedBox(height: 24),
          _textField("Remarks (Optional)", "Add any notes about book condition...", Icons.edit_note_rounded, controller: _remarksController),
          const SizedBox(height: 32),
          const Divider(),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            height: 54,
            child: ElevatedButton.icon(
              onPressed: (_selectedStudentId != null && _selectedBook != null && !_isLoading) ? _issueBook : null,
              icon: const Icon(Icons.check_circle_outline, color: Colors.white),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4F46E5),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              label: Text(_isLoading ? "Processing..." : "Confirm Issue", style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white)),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms).slideX(begin: 0.05);
  }

  Widget _buildBookPicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Select Book", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
        const SizedBox(height: 8),
        InkWell(
          onTap: () => _showBookSearchDialog(),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Row(
              children: [
                Icon(Icons.search_rounded, color: Colors.grey.shade400, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _selectedBook != null ? _selectedBook['title'] : "Click to Search Books...",
                    style: TextStyle(
                      color: _selectedBook != null ? Colors.black87 : Colors.grey.shade500,
                      fontSize: 14,
                      fontWeight: _selectedBook != null ? FontWeight.bold : FontWeight.normal
                    ),
                  ),
                ),
                Icon(Icons.keyboard_arrow_down_rounded, color: Colors.grey.shade400),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showBookSearchDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            final q = _bookSearchController.text.toLowerCase();
            final filtered = _books.where((b) {
              if (q.isEmpty) return true;
              return b['title'].toString().toLowerCase().contains(q) || 
                     b['isbn'].toString().toLowerCase().contains(q);
            }).toList();

            return Dialog(
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              child: Container(
                width: 600,
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text("Select Library Book", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                        IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _bookSearchController,
                      autofocus: true,
                      onChanged: (v) => setDialogState(() {}),
                      decoration: InputDecoration(
                        hintText: "Search by title, author, or ISBN...",
                        prefixIcon: const Icon(Icons.search),
                        filled: true,
                        fillColor: const Color(0xFFF1F5F9),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                      ),
                    ),
                    const SizedBox(height: 24),
                    ConstrainedBox(
                      constraints: const BoxConstraints(maxHeight: 400),
                      child: filtered.isEmpty 
                        ? Center(child: Text("No books found matching \"$q\"", style: TextStyle(color: Colors.grey.shade400)))
                        : ListView.builder(
                            shrinkWrap: true,
                            itemCount: filtered.length,
                            itemBuilder: (context, index) {
                              final b = filtered[index];
                              bool isAvailable = (b['available'] ?? 0) > 0;
                              return Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: Colors.grey.shade100),
                                ),
                                child: ListTile(
                                  leading: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(color: (isAvailable ? Colors.blue : Colors.red).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                                    child: Icon(Icons.book_rounded, color: isAvailable ? Colors.blue : Colors.red, size: 20),
                                  ),
                                  title: Text(b['title'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                  subtitle: Text("ISBN: ${b['isbn']} • Available: ${b['available']}/${b['total']}"),
                                  trailing: isAvailable 
                                    ? const Icon(Icons.chevron_right_rounded, color: Colors.grey)
                                    : const Text("Out of Stock", style: TextStyle(color: Colors.red, fontSize: 10, fontWeight: FontWeight.bold)),
                                  enabled: isAvailable,
                                  onTap: () {
                                    setState(() {
                                      _selectedBook = b;
                                      _bookSearchController.clear();
                                    });
                                    Navigator.pop(context);
                                  },
                                ),
                              );
                            },
                          ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _textField(String label, String hint, IconData icon, {TextEditingController? controller}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller ?? (icon == Icons.search ? _bookSearchController : null),
          decoration: InputDecoration(
             hintText: hint,
            hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
            prefixIcon: Icon(icon, color: Colors.grey.shade400, size: 20),
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey.shade200),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey.shade200),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF4F46E5)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _datePickerField(String label, DateTime date, {required Function(DateTime) onChanged}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
        const SizedBox(height: 8),
        InkWell(
          onTap: () async {
            final picked = await showDatePicker(
              context: context,
              initialDate: date,
              firstDate: label.contains("Issue") ? DateTime.now().subtract(const Duration(days: 365)) : _issueDate,
              lastDate: DateTime.now().add(const Duration(days: 365)),
              builder: (context, child) {
                return Theme(
                  data: Theme.of(context).copyWith(
                    colorScheme: const ColorScheme.light(
                      primary: Color(0xFF4F46E5),
                      onPrimary: Colors.white,
                      onSurface: Color(0xFF1E293B),
                    ),
                  ),
                  child: child!,
                );
              },
            );
            if (picked != null) onChanged(picked);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
            child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text(DateFormat('MMM dd, yyyy').format(date), style: const TextStyle(fontSize: 14)),
              const Icon(Icons.calendar_today_rounded, size: 18, color: Colors.grey),
            ]),
          ),
        ),
      ],
    );
  }

  Widget _statusBadge(String status) {
    Color bg = Colors.blue.shade50;
    Color fg = Colors.blue;
    if (status == 'Returned') { bg = Colors.green.shade50; fg = Colors.green; }
    if (status == 'Overdue') { bg = Colors.red.shade50; fg = Colors.red; }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(status, style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }
}
