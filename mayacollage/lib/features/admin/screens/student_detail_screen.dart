import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';
import '../../../core/services/student_service.dart';
import '../../../core/services/cloudinary_service.dart';
import '../../../core/services/socket_service.dart';

class StudentDetailScreen extends StatefulWidget {
  final Map<String, dynamic> student;
  const StudentDetailScreen({super.key, required this.student});

  @override
  State<StudentDetailScreen> createState() => _StudentDetailScreenState();
}

class _StudentDetailScreenState extends State<StudentDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
    
    // Listen for real-time document updates
    SocketService.onStudentDocumentsUpdated((data) {
      if (mounted && data['studentId'] == widget.student['_id']) {
        setState(() {
          widget.student['documents'] = data['documents'];
        });
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  String _getBranchName() {
    final branch = widget.student['selectedBranch'];
    if (branch is Map) return branch['name'] ?? "N/A";
    return branch?.toString() ?? "N/A";
  }

  String _getProgramName() {
    final prog = widget.student['selectedProgram'];
    if (prog is Map) return prog['name'] ?? "N/A";
    return prog?.toString() ?? "N/A";
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
                    _buildMobileHeader(),
                    _buildTabBar(isMobile),
                    Expanded(
                      child: TabBarView(
                        controller: _tabController,
                        children: [
                          _buildPersonalInfoTab(isMobile),
                          _buildAcademicTab(isMobile),
                          _buildFeesTab(isMobile),
                          _buildDocumentsTab(isMobile),
                          _buildPerformanceTab(isMobile),
                        ],
                      ),
                    ),
                  ],
                )
              : Row(
                  children: [
                    _buildProfileSidebar(),
                    Expanded(
                      child: Column(
                        children: [
                          _buildHeader(),
                          _buildTabBar(isMobile),
                          Expanded(
                            child: TabBarView(
                              controller: _tabController,
                              children: [
                                _buildPersonalInfoTab(isMobile),
                                _buildAcademicTab(isMobile),
                                _buildFeesTab(isMobile),
                                _buildDocumentsTab(isMobile),
                                _buildPerformanceTab(isMobile),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
        );
      },
    );
  }

  Widget _buildProfileSidebar() {
    return Container(
      width: 320,
      decoration: const BoxDecoration(
        color: Color(0xFF1E1E2D),
        boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 20)],
      ),
      child: Column(
        children: [
          const SizedBox(height: 60),
          _backButton(),
          const SizedBox(height: 40),
          Hero(
            tag: 'student_avatar_${widget.student['_id']}',
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white24, width: 4),
                image: DecorationImage(
                  image: NetworkImage(
                    widget.student['applicantPhoto'] ?? "https://ui-avatars.com/api/?name=${widget.student['firstName']}+${widget.student['lastName']}&background=random&size=200",
                  ),
                  fit: BoxFit.cover,
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Text(
            "${widget.student['firstName'] ?? ''} ${widget.student['lastName'] ?? ''}",
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white10,
              borderRadius: BorderRadius.circular(100),
            ),
            child: Text(
              widget.student['admissionNumber'] ?? widget.student['studentId'] ?? 'NO ID',
              style: const TextStyle(
                color: Colors.white54,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(height: 40),
          _sidebarStat("Current CGPA", widget.student['cgpa']?.toString() ?? "N/A", Colors.greenAccent),
          _sidebarStat("Attendance", widget.student['attendance']?.toString() ?? "N/A", Colors.blueAccent),
          _sidebarStat("Section", widget.student['selectedSection'] ?? "Section A", Colors.orangeAccent),
          const Spacer(),
          _actionBtn(Icons.edit_rounded, "Edit Profile"),
          const SizedBox(height: 12),
          _actionBtn(Icons.print_rounded, "Print ID Card"),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _sidebarStat(String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(color: Colors.white54, fontSize: 13),
          ),
          Text(
            value,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w900,
              fontSize: 15,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMobileHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 50, 20, 24),
      decoration: const BoxDecoration(
        color: Color(0xFF1E1E2D),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(32),
          bottomRight: Radius.circular(32),
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              _backButton(),
              const SizedBox(width: 20),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "${widget.student['firstName'] ?? ''} ${widget.student['lastName'] ?? ''}",
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w900,
                    ),
                  ),
                  Text(
                    widget.student['admissionNumber'] ?? widget.student['studentId'] ?? 'NO ID',
                    style: const TextStyle(color: Colors.white54, fontSize: 13),
                  ),
                ],
              ),
              const Spacer(),
              _statusBadge(widget.student['studentStatus'] ?? 'Active'),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _mobileHeaderStat("GPA", widget.student['cgpa']?.toString() ?? "N/A", Colors.greenAccent),
              _mobileHeaderStat("Attend", widget.student['attendance']?.toString() ?? "N/A", Colors.blueAccent),
              _mobileHeaderStat("Dues", "₹0.00", Colors.orangeAccent),
            ],
          ),
        ],
      ),
    );
  }

  Widget _mobileHeaderStat(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            color: color,
            fontWeight: FontWeight.w900,
            fontSize: 16,
          ),
        ),
        Text(
          label,
          style: const TextStyle(color: Colors.white54, fontSize: 11),
        ),
      ],
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(32),
      color: Colors.white,
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Student Portfolio",
                style: AppTheme.titleStyle.copyWith(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                "Complete academic and financial history for ${widget.student['firstName'] ?? ''}",
                style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
              ),
            ],
          ),
          const Spacer(),
          _statusBadge(widget.student['studentStatus'] ?? 'Active'),
        ],
      ),
    );
  }

  Widget _buildTabBar(bool isMobile) {
    return Container(
      color: Colors.white,
      padding: EdgeInsets.symmetric(horizontal: isMobile ? 20 : 32),
      alignment: Alignment.centerLeft,
      child: TabBar(
        controller: _tabController,
        isScrollable: true,
        labelColor: AppColors.primaryRed,
        unselectedLabelColor: Colors.grey,
        indicatorColor: AppColors.primaryRed,
        indicatorWeight: 3,
        dividerColor: Colors.transparent,
        tabs: const [
          Tab(text: "Personal"),
          Tab(text: "Academics"),
          Tab(text: "Fees"),
          Tab(text: "Documents"),
          Tab(text: "Performance"),
        ],
      ),
    );
  }

  Widget _buildPersonalInfoTab(bool isMobile) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(isMobile ? 20 : 40),
      child: Column(
        children: [
          _infoGrid([
            {"label": "FULL NAME", "value": "${widget.student['firstName'] ?? ''} ${widget.student['lastName'] ?? ''}"},
            {"label": "DATE OF BIRTH", "value": widget.student['dob'] ?? "N/A"},
            {"label": "GENDER", "value": widget.student['gender'] ?? "N/A"},
            {"label": "CATEGORY", "value": widget.student['category'] ?? "General"},
            {"label": "ADMISSION NO", "value": widget.student['admissionNumber'] ?? "N/A"},
            {"label": "STUDENT ID", "value": widget.student['studentId'] ?? "N/A"},
          ], isMobile),
          SizedBox(height: isMobile ? 24 : 32),
          _infoGrid([
            {"label": "EMAIL ADDRESS", "value": widget.student['email'] ?? "N/A"},
            {"label": "PHONE NUMBER", "value": widget.student['mobile'] ?? "N/A"},
            {"label": "ALT NUMBER", "value": widget.student['alternateMobile'] ?? "N/A"},
            {"label": "CITY", "value": widget.student['city'] ?? "N/A"},
            {"label": "STATE", "value": widget.student['state'] ?? "N/A"},
            {"label": "PIN CODE", "value": widget.student['pinCode'] ?? "N/A"},
          ], isMobile),
          SizedBox(height: isMobile ? 24 : 32),
          _infoGrid([
             {"label": "FULL ADDRESS", "value": widget.student['address'] ?? "N/A"},
          ], isMobile),
        ],
      ).animate().fadeIn().slideY(begin: 0.05),
    );
  }

  Widget _buildAcademicTab(bool isMobile) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(isMobile ? 20 : 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _academicDetailCard("Current Program Details", [
            {"label": "BRANCH", "value": _getBranchName()},
            {"label": "COURSE", "value": _getProgramName()},
            {"label": "SESSION", "value": widget.student['sessionYear'] ?? "N/A"},
            {"label": "SEMESTER", "value": (widget.student['selectedSemester'] ?? 1).toString()},
            {"label": "SECTION", "value": widget.student['selectedSection'] ?? "Section A"},
          ], isMobile),
          const SizedBox(height: 32),
          _academicDetailCard("Previous Qualifications", [
            {"label": "HIGHEST LEVEL", "value": widget.student['highestQualification'] ?? "N/A"},
            {"label": "BOARD/UNIVERSITY", "value": widget.student['boardUniversity'] ?? "N/A"},
            {"label": "INSTITUTION", "value": widget.student['institutionName'] ?? "N/A"},
            {"label": "PERCENTAGE/CGPA", "value": widget.student['percentageCGPA']?.toString() ?? "N/A"},
            {"label": "YEAR OF PASSING", "value": widget.student['yearOfPassing']?.toString() ?? "N/A"},
          ], isMobile),
          const SizedBox(height: 32),
          _academicDetailCard("Subject Entrance Scores", [
             {"label": "SUBJECT 1", "value": widget.student['subjectMarks']?['subject1'] ?? "N/A"},
             {"label": "SUBJECT 2", "value": widget.student['subjectMarks']?['subject2'] ?? "N/A"},
             {"label": "SUBJECT 3", "value": widget.student['subjectMarks']?['subject3'] ?? "N/A"},
             {"label": "ENTRANCE SCORE", "value": widget.student['entranceScore'] ?? "N/A"},
          ], isMobile),
          const SizedBox(height: 32),
          _academicDetailCard("Statement of Purpose", [
             {"label": "SOP SUMMARY", "value": widget.student['statementOfPurpose'] ?? "No statement provided."},
          ], isMobile),
        ],
      ),
    );
  }

  Widget _buildFeesTab(bool isMobile) {
    final fees = widget.student['fees'] as Map<String, dynamic>? ?? {};
    final semester  = (fees['semester']  ?? 0);
    final transport = (fees['transport'] ?? 0);
    final exam      = (fees['exam']      ?? 0);
    final other     = (fees['other']     ?? 0);
    final total     = semester + transport + exam + other;

    return ListView(
      padding: EdgeInsets.all(isMobile ? 20 : 40),
      children: [
        _feeCard("Semester / Year Fee", "₹$semester", "Recorded", Colors.blue, isMobile),
        if (transport > 0)
          _feeCard("Transport Fee", "₹$transport", "Opted", Colors.teal, isMobile),
        _feeCard("Exam Fee", "₹$exam", "Recorded", Colors.purple, isMobile),
        if (other > 0)
          _feeCard("Other Charges", "₹$other", "Recorded", Colors.orange, isMobile),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF6B0F3A), AppColors.primaryRed],
              begin: Alignment.topLeft, end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(children: [
            const Icon(Icons.calculate_rounded, color: Colors.white, size: 28),
            const SizedBox(width: 14),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Total Fees', style: TextStyle(color: Colors.white70, fontSize: 12)),
              Text('₹ $total', style: const TextStyle(
                  color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900, letterSpacing: 1)),
            ]),
          ]),
        ),
      ],
    );
  }

  // ── DOCUMENTS TAB ──
  Widget _buildDocumentsTab(bool isMobile) {
    final docs        = widget.student['documents'] as Map<String, dynamic>? ?? {};
    final lastUpdated = widget.student['documentsLastUpdated']?.toString();

    final docDefs = [
      {'key': 'studentPhoto',         'label': 'Student Photo',         'icon': Icons.face_rounded,           'color': const Color(0xFF4F46E5)},
      {'key': 'marksheet10',          'label': '10th Marksheet',        'icon': Icons.description_rounded,    'color': const Color(0xFF0891B2)},
      {'key': 'marksheet12',          'label': '12th Marksheet',        'icon': Icons.description_rounded,    'color': const Color(0xFF7C3AED)},
      {'key': 'aadharCard',           'label': 'Aadhar Card',           'icon': Icons.badge_rounded,          'color': AppColors.primaryRed},
      {'key': 'transferCertificate',  'label': 'Transfer Certificate',  'icon': Icons.folder_rounded,         'color': const Color(0xFFD97706)},
      {'key': 'casteCertificate',     'label': 'Caste Certificate',     'icon': Icons.assignment_rounded,     'color': const Color(0xFF059669)},
      {'key': 'migrationCertificate', 'label': 'Migration Certificate', 'icon': Icons.swap_horiz_rounded,     'color': const Color(0xFF9333EA)},
      {'key': 'entranceScoreCard',    'label': 'Entrance Score Card',   'icon': Icons.stars_rounded,          'color': const Color(0xFFEA580C)},
      {'key': 'otherDocument',        'label': 'Other Document',        'icon': Icons.attach_file_rounded,    'color': Colors.grey},
    ];

    final uploaded = docDefs.where((d) {
      final url = docs[d['key']] as String?;
      return url != null && url.isNotEmpty;
    }).length;
    final total = docDefs.length;

    return SingleChildScrollView(
      padding: EdgeInsets.all(isMobile ? 20 : 40),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Summary header
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF1B3E5F), Color(0xFF2E6B9E)],
              begin: Alignment.topLeft, end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
          ),
          child: Row(children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.folder_open_rounded, color: Colors.white, size: 26),
            ),
            const SizedBox(width: 16),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Document Status',
                  style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text('$uploaded of $total documents uploaded',
                  style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w800)),
              if (lastUpdated != null) ...[
                const SizedBox(height: 4),
                Text('Last updated: $lastUpdated',
                    style: TextStyle(color: Colors.white.withValues(alpha: 0.65), fontSize: 11)),
              ],
            ])),
            SizedBox(
              width: 48, height: 48,
              child: CircularProgressIndicator(
                value: total > 0 ? uploaded / total : 0,
                color: Colors.greenAccent,
                backgroundColor: Colors.white.withValues(alpha: 0.2),
                strokeWidth: 5,
              ),
            ),
          ]),
        ).animate().fadeIn(),
        const SizedBox(height: 16),

        // Info note
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.blue.shade50,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.blue.shade100),
          ),
          child: Row(children: [
            Icon(Icons.info_outline_rounded, color: Colors.blue.shade600, size: 18),
            const SizedBox(width: 10),
            Expanded(child: Text(
              'Students upload documents from their Student Panel → "Update Documents". Documents appear here once submitted.',
              style: TextStyle(fontSize: 12, color: Colors.blue.shade800),
            )),
          ]),
        ).animate().fadeIn(delay: 100.ms),
        const SizedBox(height: 20),

        // Document grid
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: isMobile ? 2 : 3,
            childAspectRatio: 1.3,
            crossAxisSpacing: 14,
            mainAxisSpacing: 14,
          ),
          itemCount: docDefs.length,
          itemBuilder: (ctx, i) {
            final def   = docDefs[i];
            final key   = def['key']   as String;
            final label = def['label'] as String;
            final icon  = def['icon']  as IconData;
            final color = def['color'] as Color;
            final url   = docs[key] as String?;
            final has   = url != null && url.isNotEmpty;

            return GestureDetector(
              onTap: has ? () => _viewDoc(ctx, url, label, key) : null,
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: has ? Colors.green : color.withValues(alpha: 0.2),
                    width: has ? 2 : 1.5,
                  ),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10)],
                ),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: has ? Colors.green.withValues(alpha: 0.1) : color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(has ? Icons.check_circle_rounded : icon,
                        color: has ? Colors.green : color, size: 22),
                  ),
                  const SizedBox(height: 8),
                  Flexible(child: Text(label,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
                      textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis)),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: has ? Colors.green.withValues(alpha: 0.08) : color.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      has ? 'Tap to View ↗' : 'Not Uploaded',
                      style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold,
                          color: has ? Colors.green : color),
                    ),
                  ),
                ]),
              ),
            );
          },
        ).animate().fadeIn(delay: 150.ms),
      ]),
    );
  }

  bool _isUpdatingDoc = false;

  Future<void> _deleteDocument(String docKey) async {
    bool confirm = await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Document'),
        content: const Text('Are you sure you want to delete this document?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    ) ?? false;

    if (!confirm) return;

    setState(() => _isUpdatingDoc = true);
    try {
      final updatedDocs = await StudentService.updateStudentDocuments(
          widget.student['_id'], {docKey: null});
      if (mounted) {
        setState(() {
          widget.student['documents'] = updatedDocs;
          _isUpdatingDoc = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Document deleted successfully'), backgroundColor: Colors.green));
        Navigator.pop(context); // Close the view dialog
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isUpdatingDoc = false);
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to delete: $e'), backgroundColor: Colors.red));
      }
    }
  }

  Future<void> _updateDocument(String docKey) async {
    final ImagePicker picker = ImagePicker();
    final XFile? file = await picker.pickImage(source: ImageSource.gallery);
    if (file == null) return;

    setState(() => _isUpdatingDoc = true);
    
    // Show a loading indicator dialog
    showDialog(
      context: context, 
      barrierDismissible: false,
      builder: (_) => const Center(child: CircularProgressIndicator())
    );

    try {
      final url = await CloudinaryService.uploadImage(file);
      if (url == null) throw Exception('Upload returned null');

      final updatedDocs = await StudentService.updateStudentDocuments(
          widget.student['_id'], {docKey: url});
      
      if (mounted) {
        Navigator.pop(context); // Close loading dialog
        setState(() {
          widget.student['documents'] = updatedDocs;
          _isUpdatingDoc = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Document updated successfully'), backgroundColor: Colors.green));
        Navigator.pop(context); // Close the view dialog
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // Close loading dialog
        setState(() => _isUpdatingDoc = false);
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to update: $e'), backgroundColor: Colors.red));
      }
    }
  }

  void _viewDoc(BuildContext ctx, String url, String label, String docKey) {
    showDialog(
      context: ctx,
      builder: (_) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Row(children: [
              Expanded(child: Text(label,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16))),
              IconButton(onPressed: () => Navigator.pop(ctx),
                  icon: const Icon(Icons.close_rounded)),
            ]),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(url,
                fit: BoxFit.contain, height: 340,
                errorBuilder: (_, e, s) => Column(children: [
                  const Icon(Icons.broken_image_rounded, size: 48, color: Colors.grey),
                  const SizedBox(height: 8),
                  SelectableText(url, style: const TextStyle(fontSize: 11, color: Colors.blue)),
                ]),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                OutlinedButton.icon(
                  onPressed: _isUpdatingDoc ? null : () => _updateDocument(docKey),
                  icon: const Icon(Icons.upload_file_rounded, size: 18),
                  label: const Text('Update'),
                  style: OutlinedButton.styleFrom(foregroundColor: Colors.blue),
                ),
                OutlinedButton.icon(
                  onPressed: _isUpdatingDoc ? null : () => _deleteDocument(docKey),
                  icon: const Icon(Icons.delete_outline_rounded, size: 18),
                  label: const Text('Delete'),
                  style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
                ),
              ],
            )
          ]),
        ),
      ),
    );
  }

  Widget _buildPerformanceTab(bool isMobile) {
    // Determine if performance data exists
    final performance = widget.student['performance'] as List<dynamic>? ?? [];

    if (performance.isEmpty) {
      return Padding(
        padding: EdgeInsets.all(isMobile ? 20 : 40),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.hourglass_empty_rounded, size: 64, color: Colors.grey.shade300),
              const SizedBox(height: 16),
              const Text(
                "No Performance Records Found",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey),
              ),
              const SizedBox(height: 8),
              const Text(
                "Academic results have not been uploaded for this student yet.",
                style: TextStyle(color: Colors.grey),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: EdgeInsets.all(isMobile ? 20 : 40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Semester Wise SGPA",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: performance.map((p) => Padding(
                padding: const EdgeInsets.only(right: 16),
                child: _sgpaCard(p['semester'] ?? "N/A", p['sgpa']?.toString() ?? "N/A"),
              )).toList(),
            ),
          ),
          const SizedBox(height: 48),
          const Text(
            "Attendance Analysis",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          Container(
            height: 200,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: Colors.black12),
            ),
            child: const Center(
              child: Text(
                "Attendance Graph View",
                style: TextStyle(color: Colors.grey),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── HELPERS ──
  Widget _infoGrid(List<Map<String, String>> items, bool isMobile) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 24 : 32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
      ),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: isMobile ? 1 : 3,
          childAspectRatio: isMobile ? 4 : 3,
          crossAxisSpacing: 24,
          mainAxisSpacing: 24,
        ),
        itemCount: items.length,
        itemBuilder: (context, index) =>
            _infoBlock(items[index]['label']!, items[index]['value']!),
      ),
    );
  }

  Widget _infoBlock(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: Colors.grey,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          value,
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }

  Widget _academicDetailCard(String title, List<Map<String, String>> items, bool isMobile) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 24 : 32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          if (isMobile)
            Column(
              children: items.map((e) => Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: _infoBlock(e['label']!, e['value']!),
              )).toList(),
            )
          else
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: items
                  .map((e) => _infoBlock(e['label']!, e['value']!))
                  .toList(),
            ),
        ],
      ),
    );
  }

  Widget _feeCard(String title, String amount, String status, Color color, bool isMobile) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: EdgeInsets.all(isMobile ? 20 : 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const SizedBox(height: 4),
                Text(
                  amount,
                  style: TextStyle(
                    fontSize: isMobile ? 16 : 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              status.toUpperCase(),
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.bold,
                fontSize: 10,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sgpaCard(String sem, String sgpa) {
    return Container(
      width: 120,
      padding: const EdgeInsets.symmetric(vertical: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.black12),
      ),
      child: Column(
        children: [
          Text(
            sem,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            sgpa,
            style: const TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.w900,
              color: AppColors.primaryRed,
            ),
          ),
        ],
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

  Widget _statusBadge(String status) {
    final isActive = status == 'Active';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isActive
            ? Colors.green.withValues(alpha: 0.1)
            : Colors.red.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: isActive ? Colors.green : Colors.red,
        ),
      ),
    );
  }

  Widget _actionBtn(IconData icon, String label) {
    return Container(
      width: 200,
      padding: const EdgeInsets.symmetric(vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white12),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: Colors.white54, size: 18),
          const SizedBox(width: 12),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white70,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}
