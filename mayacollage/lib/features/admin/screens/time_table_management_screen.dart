import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../../core/app_constants.dart';
import '../../../core/services/course_service.dart';
import '../../../core/services/branch_service.dart';
import '../../../core/services/user_service.dart';
import '../../../core/services/timetable_service.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

class TimeTableManagementScreen extends StatefulWidget {
  const TimeTableManagementScreen({super.key});

  @override
  State<TimeTableManagementScreen> createState() => _TimeTableManagementScreenState();
}

class _TimeTableManagementScreenState extends State<TimeTableManagementScreen> {
  List<dynamic> _branches = [];
  List<dynamic> _courses = [];
  List<dynamic> _sections = [];
  List<dynamic> _faculties = [];
  
  String? _selectedBranchId;
  String? _selectedCourseId;
  int? _selectedSemester;
  String? _selectedSection;
  
  Map<String, dynamic>? _timetable;
  bool _isLoading = false;
  
  final List<String> _days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  final List<String> _slots = ['09:00 - 10:00', '10:00 - 11:00', '11:00 - 12:00', '12:00 - 01:00', '01:00 - 02:00 (BREAK)', '02:00 - 03:00', '03:00 - 04:00', '04:00 - 05:00'];

  late IO.Socket _socket;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
    _initSocket();
  }

  void _initSocket() {
    final serverUrl = dotenv.get('BACKEND_URL', fallback: 'https://mayaerpbackend.onrender.com/api').replaceAll('/api', '');
    _socket = IO.io(serverUrl, <String, dynamic>{'transports': ['websocket'], 'autoConnect': true});
    _socket.connect();
  }

  @override
  void dispose() {
    _socket.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        BranchService.getAllBranches(),
        UserService.getAllUsers(),
      ]);
      
      final allUsers = results[1];
      
      setState(() {
        _branches = results[0];
        _faculties = allUsers.where((u) => u['role'] == 'Faculty' || u['role'] == 'Staff').toList();
        _isLoading = false;
      });
    } catch (e) {
      _showError(e.toString());
      setState(() => _isLoading = false);
    }
  }

  Future<void> _onBranchSelected(String? id) async {
    if (id == null) return;
    setState(() {
      _selectedBranchId = id;
      _selectedCourseId = null;
      _selectedSemester = null;
      _selectedSection = null;
      _courses = [];
      _sections = [];
      _timetable = null;
    });
    try {
      final courses = await CourseService.getAllCourses();
      setState(() {
        _courses = courses.where((c) => c['branchId'] != null && c['branchId']['_id'] == id).toList();
      });
    } catch (e) {
      _showError(e.toString());
    }
  }

  void _onCourseSelected(String? id) {
    if (id == null) return;
    setState(() {
      _selectedCourseId = id;
      _selectedSemester = null;
      _selectedSection = null;
      _sections = [];
      _timetable = null;
    });
  }

  Future<void> _onSemesterSelected(int? sem) async {
    if (sem == null) return;
    
    setState(() {
      _selectedSemester = sem;
      _selectedSection = "All"; // Default to All sections
      _timetable = null;
      _isLoading = true;
    });
    
    await _loadTimetable();
  }

  Future<void> _loadTimetable() async {
    try {
      final data = await TimetableService.getTimetable(_selectedCourseId!, _selectedBranchId!, _selectedSemester!, _selectedSection!);
      setState(() {
        _timetable = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      _showError(e.toString());
    }
  }

  Future<void> _saveTimetable() async {
    if (_timetable == null) return;
    setState(() => _isLoading = true);
    try {
      await TimetableService.saveTimetable({
        'courseId': _selectedCourseId,
        'branchId': _selectedBranchId,
        'semester': _selectedSemester,
        'section': _selectedSection,
        'schedule': _timetable!['schedule'] ?? [],
      });
      _showSuccess("Timetable saved and broadcasted successfully");
      setState(() => _isLoading = false);
    } catch (e) {
      setState(() => _isLoading = false);
      _showError(e.toString());
    }
  }

  void _showError(String msg) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.red));
  void _showSuccess(String msg) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: Colors.green));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeader(),
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(32),
              child: Column(
                children: [
                   _buildSelectionGrid(),
                   const SizedBox(height: 32),
                   if (_isLoading) 
                     const Padding(padding: EdgeInsets.all(32), child: Center(child: CircularProgressIndicator()))
                   else if (_selectedSection != null) 
                     _buildTimetableEditor(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
      decoration: const BoxDecoration(color: Colors.white, border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9)))),
      child: Row(
        children: [
          const Icon(Icons.schedule_rounded, color: AppColors.primaryRed, size: 28),
          const SizedBox(width: 16),
          const Text("Time Table Management", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
          const Spacer(),
          if (_selectedSection != null)
             Row(
               children: [
                 OutlinedButton.icon(
                   onPressed: _exportToPdf,
                   icon: const Icon(Icons.picture_as_pdf_rounded, size: 18),
                   label: const Text("Export PDF"),
                   style: OutlinedButton.styleFrom(
                     foregroundColor: Colors.black87,
                     padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                     shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                     side: BorderSide(color: Colors.black.withValues(alpha: 0.1)),
                   ),
                 ),
                 const SizedBox(width: 12),
                 ElevatedButton.icon(
                   onPressed: _saveTimetable,
                   icon: const Icon(Icons.save_rounded, size: 18),
                   label: const Text("Save & Publish"),
                   style: ElevatedButton.styleFrom(
                     backgroundColor: const Color(0xFF10B981),
                     foregroundColor: Colors.white,
                     padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                     shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                   ),
                 ),
               ],
             ),
        ],
      ),
    );
  }

  Widget _buildSelectionGrid() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade200)),
      child: Row(
        children: [
          Expanded(child: _dropdown("Branch", _branches.map((b) => DropdownMenuItem(value: b['_id'].toString(), child: Text(b['name']))).toList(), _selectedBranchId, (v) => _onBranchSelected(v))),
          const SizedBox(width: 16),
          Expanded(child: _dropdown("Course", _courses.map((c) => DropdownMenuItem(value: c['_id'].toString(), child: Text(c['name']))).toList(), _selectedCourseId, (v) => _onCourseSelected(v))),
          const SizedBox(width: 16),
          if (_selectedCourseId != null) ...[
            Expanded(child: _dropdown("Semester", List.generate(8, (i) => DropdownMenuItem(value: i + 1, child: Text("Semester ${i + 1}"))), _selectedSemester, (v) => _onSemesterSelected(v))),
          ],
        ],
      ),
    );
  }

  Widget _dropdown(String label, List<DropdownMenuItem<dynamic>> items, dynamic val, void Function(dynamic)? onCh) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Colors.grey)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<dynamic>(
              value: val,
              isExpanded: true,
              hint: Text("Select $label", style: const TextStyle(fontSize: 14)),
              items: items,
              onChanged: onCh,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTimetableEditor() {
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade200)),
      child: Column(
        children: [
          _buildDayHeader(),
          ..._days.map((day) => _buildDayRow(day)),
        ],
      ),
    );
  }

  Widget _buildDayHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: const BorderRadius.only(topLeft: Radius.circular(24), topRight: Radius.circular(24)), border: Border(bottom: BorderSide(color: Colors.grey.shade200))),
      child: Row(
        children: [
          const SizedBox(width: 100, child: Text("TIME", style: TextStyle(fontWeight: FontWeight.w900, color: Colors.grey))),
          ..._slots.map((slot) => Expanded(child: Center(child: Text(slot, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey))))),
        ],
      ),
    );
  }

  Widget _buildDayRow(String day) {
    return Container(
      decoration: BoxDecoration(border: Border(bottom: BorderSide(color: Colors.grey.shade100))),
      child: Row(
        children: [
          Container(
            width: 100,
            padding: const EdgeInsets.all(16),
            color: const Color(0xFFF8FAFC),
            child: Text(day.toUpperCase(), style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
          ),
          ..._slots.map((slot) => Expanded(child: _buildSlotCell(day, slot))),
        ],
      ),
    );
  }

  Widget _buildSlotCell(String day, String slot) {
    if (slot.contains("BREAK")) return Container(color: Colors.amber.withValues(alpha: 0.05), child: const Center(child: Text("BREAK", style: TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.amber))));

    final sched = _getScheduleForSlot(day, slot);
    
    return InkWell(
      onTap: () => _editSlot(day, slot),
      child: Container(
        height: 80,
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(border: Border.all(color: Colors.transparent)),
        child: sched != null
            ? Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.blue.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8), border: Border.all(color: Colors.blue.withValues(alpha: 0.2))),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(sched['subject']?.toUpperCase() ?? "", style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 0.2, color: Color(0xFF1E293B)), textAlign: TextAlign.center, maxLines: 2),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(4), border: Border.all(color: Colors.blue.withValues(alpha: 0.2))),
                      child: Text(_getFacultyName(sched), style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: Colors.blue.shade700, fontStyle: FontStyle.italic), textAlign: TextAlign.center, maxLines: 1),
                    ),
                  ],
                ),
              )
            : Center(child: Icon(Icons.add_rounded, color: Colors.grey.shade300, size: 20)),
      ),
    );
  }

  Map<String, dynamic>? _getScheduleForSlot(String day, String slot) {
    if (_timetable == null || _timetable!['schedule'] == null) return null;
    final List<dynamic> schedule = _timetable!['schedule'];
    final dayData = schedule.firstWhere((s) => s['day'] == day, orElse: () => null);
    if (dayData == null) return null;
    final List<dynamic> slots = dayData['slots'];
    return slots.firstWhere((s) => s['startTime'] == slot, orElse: () => null);
  }

  void _editSlot(String day, String slot) {
    final subController = TextEditingController();
    final searchController = TextEditingController();
    
    final existing = _getScheduleForSlot(day, slot);
    if (existing != null) {
      subController.text = existing['subject'] ?? "";
    }

    String? selectedFacultyName = existing != null ? existing['facultyName'] : null;
    String? selectedFacultyId = existing != null ? existing['facultyUserId'] : null;

    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: '',
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (ctx, anim1, anim2) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          final query = searchController.text.toLowerCase();
          final filtered = _faculties.where((f) {
            final name = "${f['firstName']} ${f['lastName']}".toLowerCase();
            return name.contains(query);
          }).toList();

          return Center(
            child: Material(
              color: Colors.transparent,
              child: Container(
                width: 450,
                padding: const EdgeInsets.all(32),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(32),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 40, offset: const Offset(0, 20))],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(color: AppColors.primaryRed.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(14)),
                          child: const Icon(Icons.edit_calendar_rounded, color: AppColors.primaryRed, size: 20),
                        ),
                        const SizedBox(width: 16),
                        Text("${day.toUpperCase()} • $slot", style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
                      ],
                    ),
                    const SizedBox(height: 32),
                    const Text("Subject Name", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey)),
                    const SizedBox(height: 12),
                    TextField(
                      controller: subController,
                      decoration: InputDecoration(
                        hintText: "Mathematics, Physics, etc.",
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text("Faculty Assignment", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey)),
                    const SizedBox(height: 12),
                    TextField(
                      controller: searchController,
                      onChanged: (v) => setDialogState(() {}),
                      decoration: InputDecoration(
                        hintText: "Search Instructor Name...",
                        prefixIcon: const Icon(Icons.search_rounded, size: 20),
                        filled: true,
                        fillColor: const Color(0xFFF8FAFC),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      height: 200,
                      decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(16)),
                      child: ListView.builder(
                        padding: const EdgeInsets.all(8),
                        itemCount: filtered.length,
                        itemBuilder: (ctx, i) {
                          final f = filtered[i];
                          final name = "${f['firstName']} ${f['lastName']}";
                          final isSelected = selectedFacultyId == f['_id'];
                          return ListTile(
                            onTap: () => setDialogState(() {
                              selectedFacultyId = f['_id'];
                              selectedFacultyName = name;
                            }),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            tileColor: isSelected ? Colors.blue.withValues(alpha: 0.1) : null,
                            leading: CircleAvatar(
                              backgroundColor: isSelected ? Colors.blue : Colors.grey.shade200,
                              radius: 14,
                              child: Text(name[0], style: TextStyle(color: isSelected ? Colors.white : Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
                            ),
                            title: Text(name, style: TextStyle(fontWeight: isSelected ? FontWeight.w900 : FontWeight.bold, fontSize: 13, color: isSelected ? Colors.blue : Colors.black)),
                            subtitle: Text(f['designation'] ?? f['role'], style: const TextStyle(fontSize: 10)),
                            trailing: isSelected ? const Icon(Icons.check_circle_rounded, color: Colors.blue, size: 18) : null,
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 32),
                    Row(
                      children: [
                        Expanded(child: TextButton(onPressed: () => Navigator.pop(ctx), child: Text("Cancel", style: TextStyle(color: Colors.grey.shade400, fontWeight: FontWeight.bold)))),
                        const SizedBox(width: 16),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () {
                              if (subController.text.isNotEmpty && selectedFacultyName != null) {
                                _updateSlotData(day, slot, subController.text, selectedFacultyName!, selectedFacultyId!);
                                Navigator.pop(ctx);
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.black,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 20),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            ),
                            child: const Text("Apply Session", style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ).animate().fadeIn().scale(begin: const Offset(0.95, 0.95));
        },
      ),
    );
  }

  void _updateSlotData(String day, String slot, String subject, String faculty, String facultyUserId) {
    setState(() {
      _timetable ??= {'schedule': []};
      List<dynamic> schedule = List.from(_timetable!['schedule'] ?? []);
      int dayIdx = schedule.indexWhere((s) => s['day'] == day);
      
      if (dayIdx == -1) {
        schedule.add({'day': day, 'slots': []});
        dayIdx = schedule.length - 1;
      }
      
      List<dynamic> slots = List.from(schedule[dayIdx]['slots'] ?? []);
      int slotIdx = slots.indexWhere((s) => s['startTime'] == slot);
      
      final slotData = {
        'subject': subject,
        'facultyName': faculty,
        'facultyUserId': facultyUserId,
        'startTime': slot,
        'endTime': slot, // Simplified
      };

      if (slotIdx == -1) {
        slots.add(slotData);
      } else {
        slots[slotIdx] = slotData;
      }
      
      schedule[dayIdx]['slots'] = slots;
      _timetable!['schedule'] = schedule;
    });
  }

  Future<void> _exportToPdf() async {
    if (_timetable == null) return;
    final pdf = pw.Document();
    
    final branchName = _branches.firstWhere((b) => b['_id'] == _selectedBranchId)['name'];
    final courseName = _courses.firstWhere((c) => c['_id'] == _selectedCourseId)['name'];

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4.landscape,
        margin: const pw.EdgeInsets.all(32),
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text("MAYA INSTITUTE", style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold, color: PdfColors.red)),
                      pw.Text("Academic Department: $branchName", style: const pw.TextStyle(fontSize: 12, color: PdfColors.grey700)),
                    ],
                  ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text("TIME TABLE: $courseName".toUpperCase(), style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold, color: PdfColors.blue800)),
                      pw.Text("Semester $_selectedSemester • Section: $_selectedSection", style: pw.TextStyle(fontSize: 11, color: PdfColors.grey700, fontWeight: pw.FontWeight.bold)),
                    ],
                  ),
                ],
              ),
              pw.SizedBox(height: 24),
              pw.Table(
                border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
                children: [
                  pw.TableRow(
                    decoration: const pw.BoxDecoration(color: PdfColors.grey100),
                    children: [
                      _pdfHeaderCell("DAYS"),
                      ..._slots.map((s) => _pdfHeaderCell(s)),
                    ],
                  ),
                  ..._days.map((day) {
                    return pw.TableRow(
                      children: [
                        _pdfHeaderCell(day.toUpperCase()),
                        ..._slots.map((slot) {
                           if (slot.contains("BREAK")) return _pdfHeaderCell("BREAK");
                           final sched = _getScheduleForSlot(day, slot);
                           return pw.Container(
                             height: 65,
                             padding: const pw.EdgeInsets.all(6),
                             decoration: sched != null ? pw.BoxDecoration(
                               color: PdfColors.blue50,
                               border: pw.Border.all(color: PdfColors.blue100, width: 1),
                               borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
                             ) : null,
                             child: sched != null
                                ? pw.Column(
                                    mainAxisAlignment: pw.MainAxisAlignment.center,
                                    children: [
                                      pw.Text(sched['subject'] ?? "", style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10, color: PdfColors.blue900), textAlign: pw.TextAlign.center),
                                      pw.SizedBox(height: 4),
                                      pw.Text(_getFacultyName(sched), style: pw.TextStyle(fontSize: 8, color: PdfColors.grey800, fontWeight: pw.FontWeight.bold), textAlign: pw.TextAlign.center, maxLines: 1),
                                    ],
                                  )
                                : pw.SizedBox(),
                           );
                        }),
                      ],
                    );
                  }),
                ],
              ),
              pw.SizedBox(height: 40),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text("Generated on: ${DateTime.now().toIso8601String().split('T')[0]}", style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey)),
                  pw.Text("Administrative Seal", style: pw.TextStyle(fontSize: 10, fontWeight: pw.FontWeight.bold)),
                ],
              ),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(onLayout: (PdfPageFormat format) async => pdf.save(), name: "TimeTable_$_selectedSection.pdf");
  }

  pw.Widget _pdfHeaderCell(String text) {
    return pw.Container(
      padding: const pw.EdgeInsets.all(8),
      alignment: pw.Alignment.center,
      child: pw.Text(text, style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 8)),
    );
  }

  String _getFacultyName(Map<String, dynamic> sched) {
    if (sched['facultyUserId'] is Map) {
      final user = sched['facultyUserId'];
      return "${user['firstName']} ${user['lastName']}";
    }
    return sched['facultyName'] ?? "GENERAL";
  }
}
