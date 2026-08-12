import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:typed_data';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';
import '../../../core/services/student_service.dart';
import '../../../core/services/application_service.dart';
import '../../../core/services/branch_service.dart';
import '../../../core/services/course_service.dart';
import '../../../core/services/cloudinary_service.dart';

class CreateStudentScreen extends StatefulWidget {
  final Map<String, dynamic>? student;
  const CreateStudentScreen({super.key, this.student});

  @override
  State<CreateStudentScreen> createState() => _CreateStudentScreenState();
}

class _CreateStudentScreenState extends State<CreateStudentScreen> {
  // ── STEPS: 0=Course, 1=Student Details, 2=Fees ──
  int _step = 0;
  bool _isSaving = false;

  // ── COURSE / BRANCH (from DB) ──
  String? _selectedBranch;
  String? _selectedProgram;
  int    _selectedSemester = 1;
  String? _selectedSection;
  List<dynamic> _branches = [];
  List<dynamic> _courses  = [];
  bool _isLoadingDropdowns = false;

  // ── PERSONAL FIELDS ──
  final _firstNameCtrl   = TextEditingController();
  final _midNameCtrl     = TextEditingController();
  final _lastNameCtrl    = TextEditingController();
  final _aadharCtrl      = TextEditingController();
  final _addressCtrl     = TextEditingController();
  final _sessionCtrl     = TextEditingController();
  final _parentMobCtrl   = TextEditingController();
  final _studentMobCtrl  = TextEditingController();
  final _emailCtrl       = TextEditingController();
  final _dobCtrl         = TextEditingController();
  final _passwordCtrl    = TextEditingController();
  final _confirmPwdCtrl  = TextEditingController();
  bool _obscurePwd   = true;
  bool _obscureCPwd  = true;

  // Dropdowns
  String _selectedGender   = 'Male';
  String _selectedCaste    = 'General';
  String _selectedReligion = 'Hindu';
  String _entryType        = 'Direct';

  final _genders    = ['Male', 'Female', 'Other'];
  final _castes     = ['General', 'OBC', 'SC', 'ST', 'EWS', 'PWD'];
  final _religions  = ['Hindu', 'Muslim', 'Christian', 'Sikh', 'Jain', 'Buddhist', 'Other'];
  final _entryTypes = ['Direct', 'Lateral'];

  // ── FEES ──
  final _semFeeCtrl       = TextEditingController();
  final _transportFeeCtrl = TextEditingController();
  final _examFeeCtrl      = TextEditingController();
  final _otherFeeCtrl     = TextEditingController();
  bool _transportOpted    = false;

  // ── APPLICANT PHOTO (only upload in add form) ──
  XFile? _applicantPhoto;
  Uint8List? _applicantPhotoBytes;
  String? _existingPhotoUrl;
  final ImagePicker _picker = ImagePicker();

  // ── ACCEPTED APPLICATIONS autofill ──
  List<dynamic> _acceptedApps = [];
  String? _selectedAppId;

  // ── SUCCESS ──
  String? _generatedId;
  String? _generatedPassword;

  // ── STEP META ──
  final _stepLabels = ['Course Selection', 'Student Details', 'Fees'];
  final _stepIcons  = [Icons.school_rounded, Icons.person_rounded, Icons.receipt_long_rounded];

  @override
  void initState() {
    super.initState();
    _loadBranches();
    _loadApplications();
    if (widget.student != null) _prefill(widget.student!);
  }

  void _prefill(Map<String, dynamic> s) {
    _firstNameCtrl.text  = s['firstName']  ?? '';
    _midNameCtrl.text    = s['middleName'] ?? '';
    _lastNameCtrl.text   = s['lastName']   ?? '';
    _aadharCtrl.text     = s['aadharNumber'] ?? '';
    _addressCtrl.text    = s['address'] ?? '';
    _sessionCtrl.text    = s['sessionYear'] ?? '';
    _parentMobCtrl.text  = s['parentMobile'] ?? s['alternateMobile'] ?? '';
    _studentMobCtrl.text = s['mobile'] ?? '';
    _emailCtrl.text      = s['email'] ?? '';
    _dobCtrl.text        = s['dob'] ?? '';
    _selectedBranch  = s['selectedBranch']  is Map ? s['selectedBranch']['_id']  : s['selectedBranch']?.toString();
    _selectedProgram = s['selectedProgram'] is Map ? s['selectedProgram']['_id'] : s['selectedProgram']?.toString();
    _selectedSemester = s['selectedSemester'] ?? 1;
    _selectedSection  = s['selectedSection']?.toString();
    if (_castes.contains(s['category']))    _selectedCaste    = s['category'];
    if (_genders.contains(s['gender']))     _selectedGender   = s['gender'];
    if (_religions.contains(s['religion'])) _selectedReligion = s['religion'];
    if (_entryTypes.contains(s['entryType'])) _entryType = s['entryType'];
    _semFeeCtrl.text       = s['fees']?['semester']?.toString()  ?? '';
    _transportFeeCtrl.text = s['fees']?['transport']?.toString() ?? '';
    _examFeeCtrl.text      = s['fees']?['exam']?.toString()      ?? '';
    _otherFeeCtrl.text     = s['fees']?['other']?.toString()     ?? '';
    if ((s['fees']?['transport'] ?? 0) > 0) _transportOpted = true;
    _existingPhotoUrl = s['applicantPhoto'];
  }

  Future<void> _loadBranches() async {
    setState(() => _isLoadingDropdowns = true);
    try {
      final res = await BranchService.getAllBranches();
      if (mounted) {
        setState(() => _branches = res);
        if (_selectedBranch != null) await _loadCourses(_selectedBranch!);
      }
    } catch (e) {
      debugPrint('Branch load error: $e');
    } finally {
      if (mounted) setState(() => _isLoadingDropdowns = false);
    }
  }

  Future<void> _loadCourses(String branchId) async {
    setState(() => _isLoadingDropdowns = true);
    try {
      final res = await CourseService.getAllCourses(branchId: branchId);
      if (mounted) {
        setState(() {
          _courses = res;
          if (!_courses.any((c) => c['_id'] == _selectedProgram)) {
            _selectedProgram = _courses.isNotEmpty ? _courses.first['_id'] : null;
          }
        });
      }
    } catch (e) {
      debugPrint('Course load error: $e');
    } finally {
      if (mounted) setState(() => _isLoadingDropdowns = false);
    }
  }

  Future<void> _loadApplications() async {
    try {
      final apps = await ApplicationService.getAllApplications();
      if (mounted) {
        setState(() => _acceptedApps = apps.where((a) => a['status'] == 'Accepted').toList());
      }
    } catch (_) {}
  }

  void _autofill(Map<String, dynamic> app) {
    setState(() {
      _selectedAppId       = app['_id'];
      _firstNameCtrl.text  = app['firstName'] ?? '';
      _lastNameCtrl.text   = app['lastName']  ?? '';
      _dobCtrl.text        = app['dob'] ?? '';
      _emailCtrl.text      = app['email'] ?? '';
      _studentMobCtrl.text = app['mobile'] ?? '';
      _parentMobCtrl.text  = app['alternateMobile'] ?? '';
      _addressCtrl.text    = app['address'] ?? '';
      _aadharCtrl.text     = app['aadharNumber'] ?? '';
      _selectedBranch   = app['selectedBranch'];
      _selectedProgram  = app['selectedProgram'];
      _selectedSemester = app['selectedSemester'] ?? 1;
      _selectedSection  = app['selectedSection'];
      _sessionCtrl.text = app['sessionYear'] ?? '';
      if (_castes.contains(app['category']))  _selectedCaste  = app['category'];
      if (_genders.contains(app['gender']))   _selectedGender = app['gender'];
      _existingPhotoUrl = app['applicantPhoto'];
      if (_selectedBranch != null) _loadCourses(_selectedBranch!);
    });
  }

  @override
  void dispose() {
    for (final c in [
      _firstNameCtrl, _midNameCtrl, _lastNameCtrl, _aadharCtrl,
      _addressCtrl, _sessionCtrl, _parentMobCtrl, _studentMobCtrl,
      _emailCtrl, _dobCtrl, _passwordCtrl, _confirmPwdCtrl,
      _semFeeCtrl, _transportFeeCtrl, _examFeeCtrl, _otherFeeCtrl,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    final f = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 80, maxWidth: 1024);
    if (f != null) {
      final bytes = await CloudinaryService.getImageBytes(f);
      setState(() {
        _applicantPhoto = f;
        _applicantPhotoBytes = bytes;
      });
    }
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2005),
      firstDate: DateTime(1960),
      lastDate: DateTime.now(),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.light(
            primary: AppColors.primaryRed,
            onPrimary: Colors.white,
            onSurface: Colors.black,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      final s = '${picked.day.toString().padLeft(2,'0')}/${picked.month.toString().padLeft(2,'0')}/${picked.year}';
      setState(() {
        _dobCtrl.text = s;
        if (_passwordCtrl.text.isEmpty) {
          _passwordCtrl.text   = s;
          _confirmPwdCtrl.text = s;
        }
      });
    }
  }

  bool _validateStep() {
    switch (_step) {
      case 0:
        if (_selectedBranch == null || _selectedProgram == null) {
          _snack('Please select Branch and Course.', Colors.orange); return false;
        }
        if (_sessionCtrl.text.trim().isEmpty) {
          _snack('Please enter Session Year (e.g. 2024-25) to generate Student ID.', Colors.orange); return false;
        }
        return true;
      case 1:
        if (_firstNameCtrl.text.trim().isEmpty)  { _snack('First Name required.', Colors.red); return false; }
        if (_lastNameCtrl.text.trim().isEmpty)   { _snack('Last Name required.', Colors.red);  return false; }
        if (_dobCtrl.text.trim().isEmpty)        { _snack('Date of Birth required.', Colors.red); return false; }
        if (_studentMobCtrl.text.trim().isEmpty) { _snack('Student Mobile required.', Colors.red); return false; }
        if (_passwordCtrl.text.isNotEmpty && _passwordCtrl.text != _confirmPwdCtrl.text) {
          _snack('Passwords do not match.', Colors.red); return false;
        }
        return true;
      default:
        return true;
    }
  }

  void _snack(String msg, Color c) =>
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: c));

  void _next() {
    if (!_validateStep()) return;
    if (_step < _stepLabels.length - 1) {
      setState(() => _step++);
    } else {
      _save();
    }
  }

  void _prev() { if (_step > 0) setState(() => _step--); }

  // ─────────── BUILD ───────────
  @override
  Widget build(BuildContext context) {
    if (_generatedId != null) return _successScreen();
    return LayoutBuilder(builder: (ctx, constraints) {
      final isMobile = constraints.maxWidth < 900;
      return Scaffold(
        backgroundColor: const Color(0xFFF5F6FA),
        body: Row(children: [
          if (!isMobile) _leftPanel(constraints),
          Expanded(child: Column(children: [
            _topBar(isMobile),
            Expanded(child: SingleChildScrollView(
              padding: EdgeInsets.symmetric(
                horizontal: isMobile ? 18 : 44,
                vertical:   isMobile ? 20 : 32,
              ),
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                transitionBuilder: (child, anim) => FadeTransition(
                  opacity: anim,
                  child: SlideTransition(
                    position: Tween(begin: const Offset(0.05, 0), end: Offset.zero).animate(anim),
                    child: child,
                  ),
                ),
                child: _stepContent(constraints.maxWidth, key: ValueKey(_step)),
              ),
            )),
            _navBar(isMobile),
          ])),
        ]),
      );
    });
  }

  // ─── LEFT PANEL ───
  Widget _leftPanel(BoxConstraints constraints) {
    return SizedBox(
      width: 280,
      child: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF6B0F3A), Color(0xFFEC1349), Color(0xFFFF6B6B)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: Stack(children: [
          Positioned(top: -50, right: -50, child: _blob(200, 0.06)),
          Positioned(bottom: -60, left: -30, child: _blob(240, 0.05)),
          Column(children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(22, 44, 22, 0),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _backBtn(),
                const SizedBox(height: 28),
                // Applicant photo
                _photoWidget(),
                const SizedBox(height: 24),
                // Course info
                if (_selectedProgram != null) _courseChip(),
                const SizedBox(height: 20),
                _stepper(),
              ]),
            ),
            const Spacer(),
            Padding(
              padding: const EdgeInsets.fromLTRB(22, 0, 22, 32),
              child: Column(children: [
                _infoTile(Icons.shield_rounded, 'Secure Data'),
                const SizedBox(height: 10),
                _infoTile(Icons.badge_rounded, 'Auto ID Generation'),
                const SizedBox(height: 10),
                _infoTile(Icons.upload_file_rounded, 'Documents via Student Panel'),
              ]).animate().fadeIn(delay: 400.ms),
            ),
          ]),
        ]),
      ),
    );
  }

  Widget _blob(double s, double o) => Container(
    width: s, height: s,
    decoration: BoxDecoration(shape: BoxShape.circle, color: Colors.white.withValues(alpha: o)),
  );

  Widget _backBtn() => InkWell(
    onTap: () => Navigator.pop(context),
    borderRadius: BorderRadius.circular(12),
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
      ),
      child: const Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 13),
        SizedBox(width: 8),
        Text('Back', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
      ]),
    ),
  ).animate().fadeIn();

  Widget _photoWidget() {
    final hasPhoto = _applicantPhoto != null || _existingPhotoUrl != null;
    return Center(
      child: GestureDetector(
        onTap: _pickPhoto,
        child: Stack(children: [
          CircleAvatar(
            radius: 44,
            backgroundColor: Colors.white.withValues(alpha: 0.2),
            backgroundImage: _applicantPhotoBytes != null
                ? MemoryImage(_applicantPhotoBytes!)
                : (_existingPhotoUrl != null ? NetworkImage(_existingPhotoUrl!) as ImageProvider : null),
            child: (!hasPhoto) ? const Icon(Icons.person, color: Colors.white, size: 40) : null,
          ),
          Positioned(
            bottom: 0, right: 0,
            child: Container(
              padding: const EdgeInsets.all(7),
              decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
              child: Icon(Icons.camera_alt_rounded, color: AppColors.primaryRed, size: 14),
            ),
          ),
        ]),
      ).animate().scale(duration: 500.ms, curve: Curves.easeOutBack),
    );
  }

  Widget _courseChip() {
    final course = _courses.firstWhere((c) => c['_id'] == _selectedProgram, orElse: () => null);
    final branch = _branches.firstWhere((b) => b['_id'] == _selectedBranch, orElse: () => null);
    if (course == null) return const SizedBox();
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Selected', style: TextStyle(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(course['name'] ?? '', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13)),
        if (branch != null) Text(branch['name'] ?? '', style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontSize: 11)),
        const SizedBox(height: 6),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(6)),
          child: Text('Sem $_selectedSemester', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
        ),
      ]),
    ).animate().fadeIn(delay: 200.ms);
  }

  Widget _stepper() {
    return Column(
      children: List.generate(_stepLabels.length, (i) {
        final done   = _step > i;
        final active = _step == i;
        return Padding(
          padding: const EdgeInsets.only(bottom: 4),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Column(children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: 28, height: 28,
                decoration: BoxDecoration(
                  color: done ? Colors.greenAccent : (active ? Colors.white : Colors.white.withValues(alpha: 0.2)),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white.withValues(alpha: active ? 1 : 0.3), width: 2),
                ),
                child: Center(
                  child: done
                      ? const Icon(Icons.check_rounded, color: Colors.black, size: 14)
                      : Icon(_stepIcons[i],
                          color: active ? AppColors.primaryRed : Colors.white.withValues(alpha: 0.7),
                          size: 12),
                ),
              ),
              if (i < _stepLabels.length - 1)
                Container(width: 2, height: 24, color: Colors.white.withValues(alpha: 0.2)),
            ]),
            const SizedBox(width: 12),
            Padding(
              padding: const EdgeInsets.only(top: 5),
              child: Text(_stepLabels[i],
                style: TextStyle(
                  color: active ? Colors.white : Colors.white.withValues(alpha: 0.55),
                  fontWeight: active ? FontWeight.bold : FontWeight.w400,
                  fontSize: 12,
                )),
            ),
          ]),
        );
      }),
    ).animate().fadeIn(delay: 300.ms);
  }

  Widget _infoTile(IconData icon, String text) => Row(children: [
    Container(
      padding: const EdgeInsets.all(7),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(icon, color: Colors.white, size: 14),
    ),
    const SizedBox(width: 10),
    Expanded(child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w500))),
  ]);

  // ─── TOP BAR ───
  Widget _topBar(bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: isMobile ? 18 : 40, vertical: 18),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFF1F1F1))),
      ),
      child: Row(children: [
        if (isMobile)
          IconButton(onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18)),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(widget.student != null ? 'Edit Student' : 'Add New Student',
              style: AppTheme.titleStyle.copyWith(fontSize: isMobile ? 18 : 22)),
          Text('Step ${_step + 1} / ${_stepLabels.length}: ${_stepLabels[_step]}',
              style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
        ])),
        const Spacer(),
        SizedBox(width: 140, child: Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('${((_step + 1) / _stepLabels.length * 100).toInt()}% Complete',
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryRed)),
          const SizedBox(height: 5),
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: LinearProgressIndicator(
              value: (_step + 1) / _stepLabels.length,
              color: AppColors.primaryRed,
              backgroundColor: AppColors.primaryRed.withValues(alpha: 0.1),
              minHeight: 5,
            ),
          ),
        ])),
      ]),
    );
  }

  // ─── STEP CONTENT ───
  Widget _stepContent(double width, {required Key key}) {
    switch (_step) {
      case 0: return _step0Course(width, key: key);
      case 1: return _step1Details(width, key: key);
      case 2: return _step2Fees(width, key: key);
      default: return _step0Course(width, key: key);
    }
  }

  // ══════════════════════════════════════════════
  // STEP 0 — COURSE SELECTION
  // ══════════════════════════════════════════════
  Widget _step0Course(double width, {required Key key}) {
    final isMobile = width < 700;
    return Column(key: key, crossAxisAlignment: CrossAxisAlignment.start, children: [
      _header('Course Selection', 'Select branch, course, and semester first', Icons.school_rounded),
      const SizedBox(height: 24),

      // Entry Type
      _card('Entry Type', Icons.swap_horiz_rounded,
        child: Row(children: _entryTypes.map((t) {
          final sel = _entryType == t;
          return Expanded(child: GestureDetector(
            onTap: () => setState(() => _entryType = t),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              margin: const EdgeInsets.symmetric(horizontal: 6),
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                color: sel ? AppColors.primaryRed : Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: sel ? AppColors.primaryRed : Colors.grey.shade200, width: sel ? 2 : 1),
                boxShadow: sel ? [BoxShadow(color: AppColors.primaryRed.withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0,4))] : [],
              ),
              child: Text(t, textAlign: TextAlign.center,
                style: TextStyle(color: sel ? Colors.white : Colors.black87, fontWeight: FontWeight.bold, fontSize: 14)),
            ),
          ));
        }).toList()),
      ),
      const SizedBox(height: 20),

      // Autofill from Application
      if (_acceptedApps.isNotEmpty && widget.student == null) ...[
        _card('Import from Application (Optional)', Icons.assignment_turned_in_rounded,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey.shade200)),
            child: DropdownButtonHideUnderline(child: DropdownButton<String>(
              isExpanded: true,
              hint: const Text('Select accepted application to autofill...'),
              value: _selectedAppId,
              items: [
                const DropdownMenuItem<String>(value: null, child: Text('Manual Entry')),
                ..._acceptedApps.map((a) => DropdownMenuItem<String>(
                  value: a['_id'],
                  child: Text('${a['firstName']} ${a['lastName']} - ${a['selectedProgram']}'),
                )),
              ],
              onChanged: (id) {
                if (id != null) {
                  _autofill(_acceptedApps.firstWhere((a) => a['_id'] == id));
                } else {
                  setState(() { _selectedAppId = null; _existingPhotoUrl = null; });
                }
              },
            )),
          ),
        ),
        const SizedBox(height: 20),
      ],

      // Branch & Course from DB
      _card('Branch & Course', Icons.account_balance_rounded,
        child: _isLoadingDropdowns
            ? const Center(child: CircularProgressIndicator())
            : Column(children: [
                _dynDropdown('Select Branch', Icons.business_center_rounded,
                    _branches, _selectedBranch, (v) {
                  setState(() { _selectedBranch = v; _selectedProgram = null; });
                  _loadCourses(v!);
                }),
                const SizedBox(height: 16),
                _dynDropdown('Select Course', Icons.menu_book_rounded,
                    _courses, _selectedProgram,
                    _courses.isEmpty ? null : (v) => setState(() => _selectedProgram = v!)),
              ]),
      ),
      const SizedBox(height: 20),

      // Semester & Section from DB
      if (_selectedProgram != null) ...[
        _card('Semester & Section', Icons.calendar_month_rounded,
          child: _row(isMobile, [
            _staticDropdown('Current Semester', Icons.layers_rounded,
                List.generate(8, (i) => (i + 1).toString()),
                _selectedSemester.toString(),
                (v) => setState(() { _selectedSemester = int.parse(v!); _selectedSection = null; })),
            _dynDropdown('Section', Icons.grid_view_rounded,
                _getAvailableSections(), _selectedSection,
                (v) => setState(() => _selectedSection = v!)),
          ]),
        ),
        const SizedBox(height: 20),

        // ── Session Year (moved here so ID preview works immediately) ──
        _card('Session / Batch Year', Icons.event_rounded,
          child: _field('Session Year *', Icons.calendar_today_rounded,
              ctrl: _sessionCtrl, hint: 'e.g. 2024-25'),
        ),
        const SizedBox(height: 20),
        _idPreview(),
      ],
    ]).animate().fadeIn();
  }

  // ══════════════════════════════════════════════
  // STEP 1 — STUDENT DETAILS
  // ══════════════════════════════════════════════
  Widget _step1Details(double width, {required Key key}) {
    final isMobile = width < 700;
    return Column(key: key, crossAxisAlignment: CrossAxisAlignment.start, children: [
      _header('Student Details', 'Fill all required student information', Icons.person_rounded),
      const SizedBox(height: 24),

      // Student ID shown at top of this step
      _idPreview(),
      const SizedBox(height: 20),

      // ── Full Name ──
      _card('Full Name', Icons.badge_rounded, child: Column(children: [
        _row(isMobile, [
          _field('First Name *', Icons.person_outline_rounded, ctrl: _firstNameCtrl),
          _field('Middle Name', Icons.person_outline_rounded, ctrl: _midNameCtrl, hint: 'Optional'),
        ]),
        const SizedBox(height: 16),
        _field('Last Name *', Icons.person_outline_rounded, ctrl: _lastNameCtrl),
      ])),
      const SizedBox(height: 20),

      // ── Aadhar + Gender ──
      _card('Identification', Icons.fingerprint_rounded,
        child: _row(isMobile, [
          _field('Aadhar Number', Icons.credit_card_rounded, ctrl: _aadharCtrl, hint: '12-digit'),
          _staticDropdown('Gender', Icons.wc_rounded, _genders, _selectedGender,
              (v) => setState(() => _selectedGender = v!)),
        ]),
      ),
      const SizedBox(height: 20),

      // ── DOB + Email ──
      _card('Date of Birth & Contact', Icons.cake_rounded,
        child: Column(children: [
          _row(isMobile, [
            _field('Date of Birth *', Icons.cake_rounded, ctrl: _dobCtrl,
                hint: 'DD/MM/YYYY', readOnly: true, onTap: _selectDate),
            _field('Email Address', Icons.alternate_email_rounded,
                ctrl: _emailCtrl, hint: 'student@example.com'),
          ]),
          const SizedBox(height: 16),
          _row(isMobile, [
            _field('Parent Mobile *', Icons.phone_in_talk_rounded,
                ctrl: _parentMobCtrl, hint: 'Parent / Guardian'),
            _field('Student Mobile *', Icons.phone_android_rounded,
                ctrl: _studentMobCtrl, hint: 'Own number'),
          ]),
        ]),
      ),
      const SizedBox(height: 20),

      // ── Address ──
      _card('Address', Icons.location_on_rounded,
        child: _field('Full Address', Icons.home_rounded, ctrl: _addressCtrl,
            hint: 'Village/City, District, State, PIN'),
      ),
      const SizedBox(height: 20),

      // ── Session Year REMOVED (moved to Step 0) ──

      // ── Caste & Religion ──
      _card('Caste / Religion', Icons.diversity_3_rounded,
        child: _row(isMobile, [
          _staticDropdown('Caste / Category', Icons.people_alt_rounded, _castes,
              _selectedCaste, (v) => setState(() => _selectedCaste = v!)),
          _staticDropdown('Religion', Icons.church_rounded, _religions,
              _selectedReligion, (v) => setState(() => _selectedReligion = v!)),
        ]),
      ),
      const SizedBox(height: 20),

      // ── Password ──
      _card('Login Password', Icons.lock_rounded, child: Column(children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.blue.shade50,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Colors.blue.shade100),
          ),
          child: Row(children: [
            Icon(Icons.info_outline_rounded, color: Colors.blue.shade700, size: 18),
            const SizedBox(width: 10),
            Expanded(child: Text(
              'Default password = DOB (DD/MM/YYYY). Student ID auto-generated on save.',
              style: TextStyle(fontSize: 12, color: Colors.blue.shade800),
            )),
          ]),
        ),
        const SizedBox(height: 14),
        _row(isMobile, [
          _field('Password', Icons.lock_outline_rounded, ctrl: _passwordCtrl,
              hint: 'Default = DOB', isPassword: _obscurePwd,
              suffix: IconButton(
                padding: EdgeInsets.zero,
                icon: Icon(_obscurePwd ? Icons.visibility_off : Icons.visibility, color: Colors.grey, size: 18),
                onPressed: () => setState(() => _obscurePwd = !_obscurePwd),
              )),
          _field('Confirm Password', Icons.lock_reset_rounded, ctrl: _confirmPwdCtrl,
              hint: 'Repeat password', isPassword: _obscureCPwd,
              suffix: IconButton(
                padding: EdgeInsets.zero,
                icon: Icon(_obscureCPwd ? Icons.visibility_off : Icons.visibility, color: Colors.grey, size: 18),
                onPressed: () => setState(() => _obscureCPwd = !_obscureCPwd),
              )),
        ]),
      ])),
    ]).animate().fadeIn();
  }

  // ══════════════════════════════════════════════
  // STEP 2 — FEES
  // ══════════════════════════════════════════════
  Widget _step2Fees(double width, {required Key key}) {
    final isMobile = width < 700;
    final total = (_parseNum(_semFeeCtrl.text) +
            (_transportOpted ? _parseNum(_transportFeeCtrl.text) : 0) +
            _parseNum(_examFeeCtrl.text) +
            _parseNum(_otherFeeCtrl.text))
        .toStringAsFixed(0);

    return Column(key: key, crossAxisAlignment: CrossAxisAlignment.start, children: [
      _header('Fees Structure', 'Enter fee details for this admission', Icons.receipt_long_rounded),
      const SizedBox(height: 24),

      _card('Semester / Year Fee', Icons.payments_rounded,
        child: _field('Semester / Year Fee (₹)', Icons.currency_rupee_rounded,
            ctrl: _semFeeCtrl, hint: 'e.g. 45000'),
      ),
      const SizedBox(height: 20),

      _card('Transport Fee (Optional)', Icons.directions_bus_rounded,
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Switch(
              value: _transportOpted,
              activeThumbColor: AppColors.primaryRed,
              activeTrackColor: AppColors.primaryRed.withValues(alpha: 0.3),
              onChanged: (v) => setState(() => _transportOpted = v),
            ),
            const SizedBox(width: 8),
            Expanded(child: Text(
              _transportOpted ? 'Transport opted — enter fee' : 'Not opted (toggle to add)',
              style: TextStyle(fontSize: 13,
                color: _transportOpted ? AppColors.primaryRed : Colors.grey,
                fontWeight: FontWeight.w500),
            )),
          ]),
          if (_transportOpted) ...[
            const SizedBox(height: 12),
            _field('Transport Fee (₹)', Icons.directions_bus_rounded,
                ctrl: _transportFeeCtrl, hint: 'e.g. 5000'),
          ],
        ]),
      ),
      const SizedBox(height: 20),

      _card('Other Charges', Icons.add_circle_outline_rounded,
        child: _row(isMobile, [
          _field('Exam Fee (₹)', Icons.assignment_turned_in_rounded,
              ctrl: _examFeeCtrl, hint: 'e.g. 1500'),
          _field('Other Charges (₹)', Icons.more_horiz_rounded,
              ctrl: _otherFeeCtrl, hint: 'Library, misc…'),
        ]),
      ),
      const SizedBox(height: 20),

      // Total summary
      Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF6B0F3A), AppColors.primaryRed],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(18),
          boxShadow: [BoxShadow(color: AppColors.primaryRed.withValues(alpha: 0.3), blurRadius: 16, offset: const Offset(0,6))],
        ),
        child: Row(children: [
          const Icon(Icons.calculate_rounded, color: Colors.white, size: 32),
          const SizedBox(width: 18),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Total Fees', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text('₹ $total', style: const TextStyle(color: Colors.white, fontSize: 30, fontWeight: FontWeight.w900, letterSpacing: 1)),
          ])),
        ]),
      ).animate().fadeIn(delay: 150.ms).scale(begin: const Offset(0.95, 0.95)),

      const SizedBox(height: 24),
      // Documents note
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.blue.shade50,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.blue.shade100),
        ),
        child: Row(children: [
          Icon(Icons.info_outline_rounded, color: Colors.blue.shade600, size: 20),
          const SizedBox(width: 12),
          Expanded(child: Text(
            'Documents (Aadhar, Marksheets, Transfer Certificate, etc.) can be uploaded by the student from their own Student Panel → "Update Documents" section after registration.',
            style: TextStyle(fontSize: 12, color: Colors.blue.shade800),
          )),
        ]),
      ).animate().fadeIn(delay: 200.ms),
    ]).animate().fadeIn();
  }

  // ══════════════════════════════════════════════
  // SUCCESS SCREEN
  // ══════════════════════════════════════════════
  Widget _successScreen() {
    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Container(
              width: 100, height: 100,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF11998E), Color(0xFF38EF7D)]),
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: Colors.green.withValues(alpha: 0.4), blurRadius: 20, offset: const Offset(0, 8))],
              ),
              child: const Icon(Icons.check_rounded, color: Colors.white, size: 54),
            ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack),
            const SizedBox(height: 28),
            Text('Student Registered Successfully!',
                style: AppTheme.titleStyle.copyWith(fontSize: 24), textAlign: TextAlign.center)
                .animate().fadeIn(delay: 200.ms),
            const SizedBox(height: 8),
            Text('Share the credentials below with the student.',
                style: TextStyle(color: Colors.grey.shade600, fontSize: 14), textAlign: TextAlign.center)
                .animate().fadeIn(delay: 300.ms),
            const SizedBox(height: 36),

            // ID card
            Container(
              width: 380,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6B0F3A), AppColors.primaryRed, Color(0xFFFF6B6B)],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: AppColors.primaryRed.withValues(alpha: 0.35), blurRadius: 24, offset: const Offset(0, 10))],
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  const Icon(Icons.badge_rounded, color: Colors.white70, size: 18),
                  const SizedBox(width: 8),
                  const Text('Student ID', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8)),
                    child: const Text('AUTO-GENERATED', style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
                  ),
                ]),
                const SizedBox(height: 8),
                Text(_generatedId ?? '—',
                    style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900, letterSpacing: 2)),
                const SizedBox(height: 18),
                Container(height: 1, color: Colors.white.withValues(alpha: 0.2)),
                const SizedBox(height: 14),
                const Row(children: [
                  Icon(Icons.lock_rounded, color: Colors.white70, size: 16),
                  SizedBox(width: 8),
                  Text('Default Password', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                ]),
                const SizedBox(height: 6),
                Text(_generatedPassword ?? '—',
                    style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                const SizedBox(height: 14),
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Row(children: [
                    Icon(Icons.info_outline_rounded, color: Colors.white70, size: 16),
                    SizedBox(width: 8),
                    Expanded(child: Text(
                      'Student can upload documents from their Student Panel → Update Documents.',
                      style: TextStyle(color: Colors.white70, fontSize: 11),
                    )),
                  ]),
                ),
              ]),
            ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1),
            const SizedBox(height: 32),

            ElevatedButton.icon(
              onPressed: () => Navigator.pop(context, true),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryRed,
                padding: const EdgeInsets.symmetric(horizontal: 36, vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              icon: const Icon(Icons.arrow_back_rounded, color: Colors.white),
              label: const Text('Back to Students',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
            ).animate().fadeIn(delay: 600.ms),
          ]),
        ),
      ),
    );
  }

  // ─── NAV BAR ───
  Widget _navBar(bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: isMobile ? 18 : 44, vertical: 18),
      decoration: const BoxDecoration(color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFF1F1F1)))),
      child: Row(children: [
        if (_step > 0)
          OutlinedButton.icon(
            onPressed: _prev,
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: Colors.grey.shade300, width: 2),
              padding: EdgeInsets.symmetric(horizontal: isMobile ? 16 : 22, vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
            ),
            icon: const Icon(Icons.arrow_back_rounded, size: 16, color: Colors.black54),
            label: const Text('Previous', style: TextStyle(color: Colors.black54)),
          ),
        const Spacer(),
        ElevatedButton.icon(
          onPressed: _isSaving ? null : _next,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primaryRed,
            padding: EdgeInsets.symmetric(horizontal: isMobile ? 28 : 44, vertical: 14),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
          ),
          icon: _isSaving
              ? const SizedBox(width: 16, height: 16,
                  child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
              : Icon(_step < _stepLabels.length - 1 ? Icons.arrow_forward_rounded : Icons.check_rounded,
                  color: Colors.white, size: 16),
          label: Text(
            _step < _stepLabels.length - 1 ? 'Next Step' : 'Register Student',
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
        ),
      ]),
    );
  }

  // ─── ID PREVIEW ───
  Widget _idPreview() {
    final branch = _branches.firstWhere((b) => b['_id'] == _selectedBranch, orElse: () => null);
    final course = _courses.firstWhere((c) => c['_id'] == _selectedProgram, orElse: () => null);
    if (branch == null || course == null) return const SizedBox();

    final sessionText = _sessionCtrl.text.trim();
    final yearPart = sessionText.split('-').first.trim();
    final hasYear = yearPart.isNotEmpty && yearPart.length == 4;

    final c0 = (course['name'] as String? ?? 'S').trim().isNotEmpty
        ? (course['name'] as String).trim()[0].toUpperCase() : 'S';
    final b0 = (branch['name'] as String? ?? 'B').trim().isNotEmpty
        ? (branch['name'] as String).trim()[0].toUpperCase() : 'B';

    final previewId = hasYear ? '$yearPart$c0${b0}001' : 'Enter session year above ↑';
    final isPlaceholder = !hasYear;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: isPlaceholder
            ? Colors.orange.withValues(alpha: 0.07)
            : AppColors.primaryRed.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: isPlaceholder
              ? Colors.orange.withValues(alpha: 0.3)
              : AppColors.primaryRed.withValues(alpha: 0.15),
        ),
      ),
      child: Row(children: [
        Icon(
          isPlaceholder ? Icons.edit_calendar_rounded : Icons.badge_rounded,
          color: isPlaceholder ? Colors.orange : AppColors.primaryRed,
          size: 22,
        ),
        const SizedBox(width: 14),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(
            isPlaceholder
                ? 'Enter session year to preview Student ID'
                : 'Student ID (Auto-generated on save)',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: isPlaceholder ? Colors.orange.shade700 : Colors.grey.shade600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            previewId,
            style: TextStyle(
              fontSize: isPlaceholder ? 13 : 18,
              fontWeight: FontWeight.w900,
              color: isPlaceholder ? Colors.orange.shade600 : const Color(0xFF1B3E5F),
              letterSpacing: isPlaceholder ? 0 : 1.5,
              fontStyle: isPlaceholder ? FontStyle.italic : FontStyle.normal,
            ),
          ),
        ])),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: isPlaceholder ? Colors.orange : AppColors.primaryRed,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            isPlaceholder ? 'PENDING' : 'PREVIEW',
            style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
          ),
        ),
      ]),
    ).animate().fadeIn(delay: 150.ms);
  }

  // ─── SAVE ───
  Future<void> _save() async {
    setState(() => _isSaving = true);
    try {
      String? photoUrl = _existingPhotoUrl;
      if (_applicantPhoto != null) {
        photoUrl = await ApplicationService.uploadToCloudinary(_applicantPhoto!);
      }

      final data = {
        if (_selectedAppId != null) 'applicationId': _selectedAppId,
        'applicantPhoto': photoUrl,
        'firstName':   _firstNameCtrl.text.trim(),
        'middleName':  _midNameCtrl.text.trim(),
        'lastName':    _lastNameCtrl.text.trim(),
        'aadharNumber': _aadharCtrl.text.trim(),
        'address':     _addressCtrl.text.trim(),
        'sessionYear': _sessionCtrl.text.trim(),
        'parentMobile':  _parentMobCtrl.text.trim(),
        'mobile':        _studentMobCtrl.text.trim(),
        'alternateMobile': _parentMobCtrl.text.trim(),
        'email':       _emailCtrl.text.trim(),
        'dob':         _dobCtrl.text.trim(),
        'gender':      _selectedGender,
        'category':    _selectedCaste,
        'religion':    _selectedReligion,
        'entryType':   _entryType,
        'selectedBranch':   _selectedBranch,
        'selectedProgram':  _selectedProgram,
        'selectedSemester': _selectedSemester,
        'selectedSection':  _selectedSection,
        'fees': {
          'semester':  _parseNum(_semFeeCtrl.text),
          'transport': _transportOpted ? _parseNum(_transportFeeCtrl.text) : 0,
          'exam':      _parseNum(_examFeeCtrl.text),
          'other':     _parseNum(_otherFeeCtrl.text),
        },
        'highestQualification': '',
        'institutionName': '',
        'boardUniversity': '',
        'percentageCGPA': '',
        'yearOfPassing': '',
      };

      // Password logic:
      // - New student with no password entered → use DOB as default
      // - Admin explicitly typed a new password → use it
      // - Editing existing student with empty password field → don't send → backend keeps existing hash
      if (_passwordCtrl.text.isNotEmpty) {
        data['password'] = _passwordCtrl.text;
      } else if (widget.student == null) {
        data['password'] = _dobCtrl.text; // Default for new students
      }

      Map<String, dynamic> result;
      if (widget.student != null) {
        result = await StudentService.updateStudent(widget.student!['_id'], data);
      } else {
        result = await StudentService.createStudent(data);
      }

      if (mounted) {
        setState(() {
          _isSaving = false;
          _generatedId       = result['admissionNumber'] ?? result['studentId'] ?? result['_id'];
          _generatedPassword = result['password'] ?? data['password'] as String?;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        _snack('Error: $e', Colors.red);
      }
    }
  }

  // ─── HELPERS ───
  double _parseNum(String v) => double.tryParse(v.replaceAll(',', '')) ?? 0;

  Widget _header(String title, String sub, IconData icon) {
    return Row(children: [
      Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(gradient: AppColors.primaryGradient, borderRadius: BorderRadius.circular(14)),
        child: Icon(icon, color: Colors.white, size: 22),
      ),
      const SizedBox(width: 16),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(title, style: AppTheme.titleStyle.copyWith(fontSize: 22)),
        Text(sub, style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
      ])),
    ]).animate().fadeIn().slideX(begin: -0.1);
  }

  Widget _card(String title, IconData icon, {required Widget child}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 12, offset: const Offset(0,4))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(18, 16, 18, 0),
          child: Row(children: [
            Icon(icon, color: AppColors.primaryRed, size: 16),
            const SizedBox(width: 8),
            Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primaryRed)),
          ]),
        ),
        const Padding(padding: EdgeInsets.symmetric(horizontal: 18, vertical: 8), child: Divider(height: 1)),
        Padding(padding: const EdgeInsets.fromLTRB(18, 4, 18, 18), child: child),
      ]),
    ).animate().fadeIn(delay: 80.ms).slideY(begin: 0.05);
  }

  Widget _row(bool isMobile, List<Widget> children) {
    if (isMobile) {
      return Column(children: children
          .map((c) => Padding(padding: const EdgeInsets.only(bottom: 16), child: c))
          .toList());
    }
    return Row(crossAxisAlignment: CrossAxisAlignment.start,
        children: children.map((c) => Expanded(
            child: Padding(padding: const EdgeInsets.only(right: 14), child: c))).toList());
  }

  Widget _field(String label, IconData icon, {
    required TextEditingController ctrl,
    String? hint,
    bool isPassword = false,
    bool readOnly = false,
    VoidCallback? onTap,
    Widget? suffix,
  }) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1B3E5F))),
      const SizedBox(height: 7),
      TextFormField(
        controller: ctrl,
        obscureText: isPassword,
        readOnly: readOnly,
        onTap: onTap,
        decoration: InputDecoration(
          hintText: hint,
          prefixIcon: Icon(icon, size: 17, color: AppColors.primaryRed),
          suffixIcon: suffix,
          filled: true, fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade200)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: Colors.grey.shade200)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.primaryRed, width: 1.5)),
        ),
      ),
    ]);
  }

  Widget _staticDropdown(String label, IconData icon, List<String> items, String value, Function(String?) onChange) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1B3E5F))),
      const SizedBox(height: 7),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Row(children: [
          Icon(icon, color: AppColors.primaryRed, size: 17),
          const SizedBox(width: 8),
          Expanded(child: DropdownButtonHideUnderline(child: DropdownButton<String>(
            value: value, isExpanded: true,
            style: const TextStyle(color: Colors.black87, fontSize: 13),
            onChanged: onChange,
            items: items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
          ))),
        ]),
      ),
    ]);
  }

  Widget _dynDropdown(String label, IconData icon, List<dynamic> items, String? value, Function(String?)? onChange) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF1B3E5F))),
      const SizedBox(height: 7),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: items.isEmpty ? Colors.grey.shade100 : Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.grey.shade200),
        ),
        child: Row(children: [
          Icon(icon, color: AppColors.primaryRed, size: 17),
          const SizedBox(width: 8),
          Expanded(child: DropdownButtonHideUnderline(child: DropdownButton<String>(
            value: items.any((e) => e['_id'] == value) ? value : null,
            hint: Text(items.isEmpty ? 'Not Available' : 'Select $label',
                style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
            isExpanded: true,
            style: const TextStyle(color: Colors.black87, fontSize: 13),
            onChanged: onChange,
            items: items.map((e) => DropdownMenuItem<String>(value: e['_id'], child: Text(e['name'] ?? ''))).toList(),
          ))),
        ]),
      ),
    ]);
  }

  List<dynamic> _getAvailableSections() {
    if (_selectedProgram == null) return [];
    final course = _courses.firstWhere((c) => c['_id'] == _selectedProgram, orElse: () => null);
    if (course == null) return [];
    final curriculum = (course['curriculum'] as List? ?? []);
    final semData = curriculum.firstWhere((s) => s['semester'] == _selectedSemester, orElse: () => null);
    if (semData == null) return [];
    return (semData['sections'] as List? ?? [])
        .map((s) => {'_id': s['name'], 'name': s['name']})
        .toList();
  }
}
