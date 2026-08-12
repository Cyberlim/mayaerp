import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:typed_data';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';
import '../../../core/services/application_service.dart';
import '../../../core/services/branch_service.dart';
import '../../../core/services/course_service.dart';
import '../../../core/services/cloudinary_service.dart';

class CreateApplicationScreen extends StatefulWidget {
  final Map<String, dynamic>? application;
  const CreateApplicationScreen({super.key, this.application});

  @override
  State<CreateApplicationScreen> createState() =>
      _CreateApplicationScreenState();
}

class _CreateApplicationScreenState extends State<CreateApplicationScreen> {
  int _step = 0;
  bool _isSaving = false;
  String? _selectedBranch;
  String? _selectedProgram; // Now refers to a course name or ID
  String _selectedSession = '2024-25';
  String _selectedCategory = 'General';
  String _selectedGender = 'Male';
  String _selectedQualification = 'XII / HSC';

  List<dynamic> _branches = [];
  List<dynamic> _courses = [];
  bool _isLoadingDropdowns = false;
  final _sessions = List.generate(6, (i) {
    int year = DateTime.now().year - i;
    return "$year-${(year + 1).toString().substring(2)}";
  });
  final _categories = ['General', 'OBC', 'SC', 'ST', 'EWS', 'PWD'];
  final _genders = ['Male', 'Female', 'Other'];
  final _qualifications = [
    'XII / HSC',
    'Diploma',
    'BSc',
    'BCom',
    'BA',
    'BE/BTech',
    'Other',
  ];
  final _stepLabels = [
    'Personal Details',
    'Academic Info',
    'Program Selection',
    'Documents',
  ];

  // --- FORM CONTROLLERS ---
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _dobCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _mobileCtrl = TextEditingController();
  final _altMobileCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _stateCtrl = TextEditingController();
  final _pinCodeCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();

  final _institutionCtrl = TextEditingController();
  final _boardCtrl = TextEditingController();
  final _scoreCtrl = TextEditingController();
  final _yearCtrl = TextEditingController();
  final _sub1Ctrl = TextEditingController();
  final _sub2Ctrl = TextEditingController();
  final _sub3Ctrl = TextEditingController();
  final _entranceCtrl = TextEditingController();
  final _sopCtrl = TextEditingController();

  // --- IMAGE & DOCUMENT FILES ---
  XFile? _profileImage;
  Uint8List? _profileImageBytes;
  final Map<String, XFile?> _documentFiles = {};

  final ImagePicker _picker = ImagePicker();

  Future<void> _pickDocument(String docKey) async {
    final XFile? file = await _picker.pickImage(source: ImageSource.gallery);
    if (file != null) {
      setState(() {
        _documentFiles[docKey] = file;
      });
    }
  }

  Future<void> _pickProfileImage() async {
    final XFile? file = await _picker.pickImage(source: ImageSource.gallery, imageQuality: 80, maxWidth: 1024);
    if (file != null) {
      final bytes = await CloudinaryService.getImageBytes(file);
      setState(() {
        _profileImage = file;
        _profileImageBytes = bytes;
      });
    }
  }

  @override
  void initState() {
    super.initState();
    if (widget.application != null) {
      final app = widget.application!;
      _firstNameCtrl.text = app['firstName'] ?? '';
      _lastNameCtrl.text = app['lastName'] ?? '';
      _dobCtrl.text = app['dob'] ?? '';
      _emailCtrl.text = app['email'] ?? '';
      _mobileCtrl.text = app['mobile'] ?? '';
      _altMobileCtrl.text = app['alternateMobile'] ?? '';
      _addressCtrl.text = app['address'] ?? '';
      _cityCtrl.text = app['city'] ?? '';
      _stateCtrl.text = app['state'] ?? '';
      _pinCodeCtrl.text = app['pinCode'] ?? '';

      _institutionCtrl.text = app['institutionName'] ?? '';
      _boardCtrl.text = app['boardUniversity'] ?? '';
      _scoreCtrl.text = app['percentageCGPA']?.toString() ?? '';
      _yearCtrl.text = app['yearOfPassing']?.toString() ?? '';
      
      final subjectMarks = app['subjectMarks'] as Map<String, dynamic>? ?? {};
      _sub1Ctrl.text = subjectMarks['subject1'] ?? '';
      _sub2Ctrl.text = subjectMarks['subject2'] ?? '';
      _sub3Ctrl.text = subjectMarks['subject3'] ?? '';
      
      _entranceCtrl.text = app['entranceScore'] ?? '';
      _sopCtrl.text = app['statementOfPurpose'] ?? '';

      _selectedBranch = app['selectedBranch'];
      _selectedProgram = app['selectedProgram'];
      _selectedSession = app['sessionYear'] ?? _sessions.first;
      _selectedCategory = app['category'] ?? _categories.first;
      _selectedGender = app['gender'] ?? _genders.first;
      _selectedQualification = app['highestQualification'] ?? _qualifications.first;

      // Keep existing document and photo URLs
      _existingProfileUrl = app['applicantPhoto'];
      _existingDocumentUrls = Map<String, String>.from(app['documents'] ?? {});
    }
    
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    setState(() => _isLoadingDropdowns = true);
    try {
      final branchesResult = await BranchService.getAllBranches();
      if (mounted) {
        setState(() {
          _branches = branchesResult;
          if (_selectedBranch == null && _branches.isNotEmpty) {
            // Do not select auto if you prefer empty, but let's select first
            // _selectedBranch = _branches.first['_id'];
          }
        });
        if (_selectedBranch != null) {
          await _loadCoursesForBranch(_selectedBranch!);
        } else if (_branches.isNotEmpty) {
          // await _loadCoursesForBranch(_branches.first['_id']);
        }
      }
    } catch (e) {
      debugPrint("Error loading branches: $e");
    } finally {
      if (mounted) setState(() => _isLoadingDropdowns = false);
    }
  }

  Future<void> _loadCoursesForBranch(String branchId) async {
    setState(() => _isLoadingDropdowns = true);
    try {
      final coursesResult = await CourseService.getAllCourses(branchId: branchId);
      if (mounted) {
        setState(() {
          _courses = coursesResult;
          if (!_courses.any((c) => c['_id'] == _selectedProgram)) {
            _selectedProgram = _courses.isNotEmpty ? _courses.first['_id'] : null;
          }
        });
      }
    } catch (e) {
      debugPrint("Error loading courses: $e");
    } finally {
      if (mounted) setState(() => _isLoadingDropdowns = false);
    }
  }

  // --- EXISTING DATA (For Editing) ---
  String? _existingProfileUrl;
  Map<String, String> _existingDocumentUrls = {};

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _dobCtrl.dispose();
    _emailCtrl.dispose();
    _mobileCtrl.dispose();
    _altMobileCtrl.dispose();
    _addressCtrl.dispose();
    _cityCtrl.dispose();
    _stateCtrl.dispose();
    _pinCodeCtrl.dispose();
    _institutionCtrl.dispose();
    _boardCtrl.dispose();
    _scoreCtrl.dispose();
    _yearCtrl.dispose();
    _sub1Ctrl.dispose();
    _sub2Ctrl.dispose();
    _sub3Ctrl.dispose();
    _entranceCtrl.dispose();
    _sopCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    super.dispose();
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2005),
      firstDate: DateTime(1980),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primaryRed,
              onPrimary: Colors.white,
              onSurface: Colors.black,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null) {
      setState(() {
        final dateStr = "${picked.day.toString().padLeft(2, '0')}/${picked.month.toString().padLeft(2, '0')}/${picked.year}";
        _dobCtrl.text = dateStr;
        if (_passwordCtrl.text.isEmpty) {
          _passwordCtrl.text = dateStr;
          _confirmPasswordCtrl.text = dateStr;
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final isMobile = width < 900;

        return Scaffold(
          backgroundColor: const Color(0xFFF8F6F6),
          body: Row(
            children: [
              // ── LEFT GRADIENT PANEL (Desktop only) ──
              if (!isMobile)
                SizedBox(
                  width: 320,
                  child: Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Color(0xFF6B0F3A),
                          Color(0xFFEC1349),
                          Color(0xFFFF6B6B),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Stack(
                      children: [
                        Positioned(top: -60, right: -60, child: _blob(220, 0.06)),
                        Positioned(bottom: -80, left: -40, child: _blob(260, 0.05)),
                        Column(
                          children: [
                            Padding(
                              padding: const EdgeInsets.fromLTRB(28, 48, 28, 0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _backButton(context),
                                  const SizedBox(height: 32),
                                  _photoUpload(),
                                  const SizedBox(height: 32),
                                  _buildStepper(),
                                ],
                              ),
                            ),
                            const Spacer(),
                            Padding(
                              padding: const EdgeInsets.fromLTRB(28, 0, 28, 32),
                              child: Column(
                                children: [
                                  _infoTile(Icons.shield_rounded, "Secure Data"),
                                  const SizedBox(height: 12),
                                  _infoTile(Icons.notifications_active_rounded, "Auto Alerts"),
                                  const SizedBox(height: 12),
                                  _infoTile(Icons.track_changes_rounded, "Real-time Tracking"),
                                ],
                              ).animate().fadeIn(delay: 400.ms).slideX(begin: 0.2),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

              // ── RIGHT FORM PANEL ──
              Expanded(
                child: Column(
                  children: [
                    _formTopBar(isMobile),
                    Expanded(
                      child: SingleChildScrollView(
                        padding: EdgeInsets.symmetric(
                          horizontal: isMobile ? 20 : 48,
                          vertical: isMobile ? 24 : 36,
                        ),
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 320),
                          transitionBuilder: (child, anim) => FadeTransition(
                            opacity: anim,
                            child: SlideTransition(
                              position: Tween(
                                begin: const Offset(0.04, 0),
                                end: Offset.zero,
                              ).animate(anim),
                              child: child,
                            ),
                          ),
                          child: _buildStepContent(width: width, key: ValueKey(_step)),
                        ),
                      ),
                    ),
                    _buildNavBar(isMobile),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _blob(double size, double opacity) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      color: Colors.white.withValues(alpha: opacity),
    ),
  );

  Widget _backButton(BuildContext context) {
    return InkWell(
      onTap: () => Navigator.pop(context),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.arrow_back_ios_new_rounded,
              color: Colors.white,
              size: 15,
            ),
            SizedBox(width: 8),
            Text(
              "Back",
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn().slideX(begin: -0.2);
  }

  Widget _photoUpload() {
    return Center(
      child: Column(
        children: [
          GestureDetector(
            onTap: _pickProfileImage,
            child: Stack(
              children: [
                Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.5),
                      width: 3,
                    ),
                    color: Colors.white.withValues(alpha: 0.12),
                    image: _profileImageBytes != null
                        ? DecorationImage(
                            image: MemoryImage(_profileImageBytes!),
                            fit: BoxFit.cover,
                          )
                        : (_existingProfileUrl != null
                            ? DecorationImage(
                                image: NetworkImage(_existingProfileUrl!),
                                fit: BoxFit.cover,
                              )
                            : null),
                  ),
                  child: (_profileImageBytes == null && _existingProfileUrl == null)
                      ? const Icon(Icons.person, color: Colors.white, size: 44)
                      : null,
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.all(7),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.camera_alt_rounded,
                      color: AppColors.primaryRed,
                      size: 14,
                    ),
                  ),
                ),
              ],
            ),
          ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack),
          const SizedBox(height: 10),
          const Text(
            "Applicant Photo",
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 3),
          Text(
            "Tap to upload • Max 5MB",
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.65),
              fontSize: 11,
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms);
  }

  Widget _buildStepper() {
    return Column(
      children: List.generate(_stepLabels.length, (i) {
        final isDone = _step > i;
        final isActive = _step == i;
        return Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Column(
              children: [
                AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: isDone
                        ? Colors.greenAccent
                        : (isActive
                              ? Colors.white
                              : Colors.white.withValues(alpha: 0.2)),
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: Colors.white.withValues(alpha: isActive ? 1 : 0.3),
                      width: 2,
                    ),
                  ),
                  child: Center(
                    child: isDone
                        ? const Icon(
                            Icons.check_rounded,
                            color: Colors.black,
                            size: 16,
                          )
                        : Text(
                            "${i + 1}",
                            style: TextStyle(
                              color: isActive
                                  ? AppColors.primaryRed
                                  : Colors.white.withValues(alpha: 0.7),
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                  ),
                ),
                if (i < _stepLabels.length - 1)
                  Container(
                    width: 2,
                    height: 28,
                    color: Colors.white.withValues(alpha: 0.2),
                  ),
              ],
            ),
            const SizedBox(width: 14),
            Padding(
              padding: const EdgeInsets.only(top: 5),
              child: Text(
                _stepLabels[i],
                style: TextStyle(
                  color: isActive
                      ? Colors.white
                      : Colors.white.withValues(alpha: 0.55),
                  fontWeight: isActive ? FontWeight.bold : FontWeight.w400,
                  fontSize: 13,
                ),
              ),
            ),
          ],
        );
      }),
    ).animate().fadeIn(delay: 300.ms);
  }

  Widget _infoTile(IconData icon, String text) => Row(
    children: [
      Container(
        padding: const EdgeInsets.all(7),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(9),
        ),
        child: Icon(icon, color: Colors.white, size: 16),
      ),
      const SizedBox(width: 10),
      Expanded(
        child: Text(
          text,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    ],
  );

  // ── TOP BAR ──
  Widget _formTopBar(bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 20 : 40,
        vertical: isMobile ? 14 : 18,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFF1F1F1))),
      ),
      child: Row(
        children: [
          if (isMobile)
            IconButton(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
            ),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "New Application",
                  style: AppTheme.titleStyle.copyWith(fontSize: isMobile ? 18 : 22),
                ),
                Text(
                  "Step ${_step + 1}: ${_stepLabels[_step]}",
                  style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
                ),
              ],
            ),
          ),
          if (!isMobile) ...[
            const Spacer(),
            SizedBox(
              width: 160,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    "${((_step + 1) / _stepLabels.length * 100).toInt()}% Complete",
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryRed,
                    ),
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: (_step + 1) / _stepLabels.length,
                      color: AppColors.primaryRed,
                      backgroundColor: AppColors.primaryRed.withValues(
                        alpha: 0.1,
                      ),
                      minHeight: 5,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStepContent({required double width, required Key key}) {
    bool isMobile = width < 900;
    switch (_step) {
      case 0:
        return _stepPersonal(width: width, key: key);
      case 1:
        return _stepAcademic(width: width, key: key);
      case 2:
        return _stepProgram(width: width, key: key);
      case 3:
        return _stepDocuments(width: width, key: key);
      default:
        return _stepPersonal(width: width, key: key);
    }
  }

  Widget _stepPersonal({required double width, required Key key}) {
    bool isMobile = width < 700;
    return Column(
      key: key,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _stepHeader(
          "Personal Details",
          "Enter the applicant's personal information",
          Icons.person_rounded,
        ),
        const SizedBox(height: 30),
        _row(isMobile, [
          _field("First Name", Icons.person_outline_rounded, controller: _firstNameCtrl),
          _field("Last Name", Icons.person_outline_rounded, controller: _lastNameCtrl),
        ]),
        _row(isMobile, [
          _field(
            "Date of Birth", 
            Icons.cake_rounded, 
            hint: "DD/MM/YYYY", 
            controller: _dobCtrl,
            readOnly: true,
            onTap: () => _selectDate(context),
          ),
          _dropdown(
            "Gender",
            Icons.wc_rounded,
            _genders,
            _selectedGender,
            (v) => setState(() => _selectedGender = v!),
          ),
        ]),
        const SizedBox(height: 18),
        _field(
          "Email Address",
          Icons.alternate_email_rounded,
          hint: "applicant@example.com",
          controller: _emailCtrl,
        ),
        const SizedBox(height: 18),
        _row(isMobile, [
          _field("Password", Icons.lock_outline_rounded, controller: _passwordCtrl, isPassword: true, hint: "Default is DOB"),
          _field("Confirm Password", Icons.lock_reset_rounded, controller: _confirmPasswordCtrl, isPassword: true, hint: "Same as password"),
        ]),
        const SizedBox(height: 18),
        _row(isMobile, [
          _field(
            "Mobile Number",
            Icons.phone_android_rounded,
            hint: "+91 9999 999 999",
            controller: _mobileCtrl,
          ),
          _field("Alternate Mobile", Icons.phone_outlined, hint: "Optional", controller: _altMobileCtrl),
        ]),
        const SizedBox(height: 18),
        _field(
          "Full Address",
          Icons.location_on_rounded,
          hint: "Street, City, State, PIN Code",
          controller: _addressCtrl,
        ),
        const SizedBox(height: 18),
        _row(isMobile, [
          _field("City", Icons.location_city_rounded, controller: _cityCtrl),
          _field("State", Icons.map_rounded, controller: _stateCtrl),
          _field("PIN Code", Icons.pin_drop_rounded, hint: "6-digit", controller: _pinCodeCtrl),
        ]),
      ],
    );
  }

  Widget _stepAcademic({required double width, required Key key}) {
    bool isMobile = width < 700;
    return Column(
      key: key,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _stepHeader(
          "Academic Information",
          "Previous education & qualification scores",
          Icons.menu_book_rounded,
        ),
        const SizedBox(height: 30),
        _dropdown(
          "Highest Qualification",
          Icons.school_rounded,
          _qualifications,
          _selectedQualification,
          (v) => setState(() => _selectedQualification = v!),
        ),
        const SizedBox(height: 18),
        _row(isMobile, [
          _field(
            "Institution Name",
            Icons.account_balance_rounded,
            hint: "Previous school/college",
            controller: _institutionCtrl,
          ),
          _field("Board / University", Icons.corporate_fare_rounded, controller: _boardCtrl),
        ]),
        const SizedBox(height: 18),
        _row(isMobile, [
          _field(
            "Percentage / CGPA",
            Icons.percent_rounded,
            hint: "e.g. 92.4 or 8.5",
            controller: _scoreCtrl,
          ),
          _field(
            "Year of Passing",
            Icons.calendar_today_rounded,
            hint: "e.g. 2023",
            controller: _yearCtrl,
          ),
        ]),
        const SizedBox(height: 18),
        _row(isMobile, [
          _field("Subject 1 Marks", Icons.book_rounded, controller: _sub1Ctrl),
          _field("Subject 2 Marks", Icons.book_rounded, controller: _sub2Ctrl),
          _field("Subject 3 Marks", Icons.book_rounded, controller: _sub3Ctrl),
        ]),
        const SizedBox(height: 18),
        _field(
          "Entrance Exam Score (if any)",
          Icons.assignment_rounded,
          hint: "e.g. JEE Main 85 percentile",
          controller: _entranceCtrl,
        ),
      ],
    );
  }

  Widget _stepProgram({required double width, required Key key}) {
    bool isMobile = width < 700;
    return Column(
      key: key,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _stepHeader(
          "Program Selection",
          "Choose the course and intake session",
          Icons.library_books_rounded,
        ),
        const SizedBox(height: 30),
        if (_isLoadingDropdowns)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 24),
            child: Center(child: CircularProgressIndicator()),
          )
        else
          _row(isMobile, [
            _dynamicDropdown(
              "Select Branch",
              Icons.business_center_rounded,
              _branches,
              _selectedBranch,
              (val) {
                if (val != null) {
                  setState(() {
                    _selectedBranch = val;
                    _selectedProgram = null; 
                  });
                  _loadCoursesForBranch(val);
                }
              },
            ),
            _dynamicDropdown(
              "Select Course",
              Icons.school_rounded,
              _courses,
              _selectedProgram,
              _courses.isEmpty ? null : (val) {
                setState(() => _selectedProgram = val!);
              },
            ),
          ]),
        const SizedBox(height: 22),
        _row(isMobile, [
          _dropdown(
            "Session Year",
            Icons.event_rounded,
            _sessions,
            _selectedSession,
            (v) => setState(() => _selectedSession = v!),
          ),
          _dropdown(
            "Category",
            Icons.category_rounded,
            _categories,
            _selectedCategory,
            (v) => setState(() => _selectedCategory = v!),
          ),
        ]),
        const SizedBox(height: 18),
        _buildIdPreview(),
        const SizedBox(height: 18),
        _field(
          "Statement of Purpose (Why this program?)",
          Icons.edit_note_rounded,
          hint: "Brief statement...",
          controller: _sopCtrl,
        ),
      ],
    );
  }

  Widget _stepDocuments({required double width, required Key key}) {
    final docs = [
      {
        "name": "10th Marksheet",
        "icon": Icons.description_rounded,
        "color": const Color(0xFF4F46E5),
        "key": "marksheet10",
      },
      {
        "name": "12th Marksheet",
        "icon": Icons.description_rounded,
        "color": const Color(0xFF0891B2),
        "key": "marksheet12",
      },
      {
        "name": "Transfer Certificate",
        "icon": Icons.folder_rounded,
        "color": const Color(0xFF7C3AED),
        "key": "transferCertificate",
      },
      {
        "name": "Aadhar Card",
        "icon": Icons.badge_rounded,
        "color": AppColors.primaryRed,
        "key": "aadharCard",
      },
      {
        "name": "Entrance Score Card",
        "icon": Icons.assignment_rounded,
        "color": const Color(0xFFD97706),
        "key": "entranceScoreCard",
      },
    ];
    return Column(
      key: key,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _stepHeader(
          "Document Upload",
          "Attach all required scanned documents (PDF/JPG)",
          Icons.upload_file_rounded,
        ),
        const SizedBox(height: 30),
        GridView.count(
          crossAxisCount: width < 600 ? 1 : (width < 900 ? 2 : 3),
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: width < 600 ? 1.8 : 1.5,
          crossAxisSpacing: 14,
          mainAxisSpacing: 14,
          children: docs.map((d) {
            final color = d['color'] as Color;
            final docKey = d['key'] as String;
            final isPicked = _documentFiles.containsKey(docKey) && _documentFiles[docKey] != null;
            final isExisting = _existingDocumentUrls.containsKey(docKey) && _existingDocumentUrls[docKey]!.isNotEmpty;
            final hasDoc = isPicked || isExisting;
            
            return GestureDetector(
              onTap: () => _pickDocument(docKey),
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: hasDoc ? Colors.green : color.withValues(alpha: 0.2),
                    width: hasDoc ? 2 : 1.5,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04),
                      blurRadius: 10,
                    ),
                  ],
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: hasDoc ? Colors.green.withValues(alpha: 0.1) : color.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(hasDoc ? Icons.check_circle_rounded : d['icon'] as IconData, 
                            color: hasDoc ? Colors.green : color, size: 22),
                    ),
                    const SizedBox(height: 10),
                    Flexible(
                      child: Text(
                        d['name'] as String,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: hasDoc ? Colors.green.withValues(alpha: 0.08) : color.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        hasDoc ? "Uploaded" : "Tap to Upload",
                        style: TextStyle(
                          fontSize: 10,
                          color: hasDoc ? Colors.green : color,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 22),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.amber.withValues(alpha: 0.06),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              const Icon(
                Icons.info_outline_rounded,
                color: Colors.amber,
                size: 20,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  "All documents must be clearly scanned. Files should be below 2MB each in PDF or JPG format.",
                  style: TextStyle(fontSize: 12, color: Colors.amber.shade900),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
  // ── NAV BAR ──
  Widget _buildNavBar(bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 20 : 48,
        vertical: isMobile ? 14 : 20,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFF1F1F1))),
      ),
      child: Row(
        children: [
          if (_step > 0)
            OutlinedButton(
              onPressed: () => setState(() => _step--),
              style: OutlinedButton.styleFrom(
                side: BorderSide(color: Colors.grey.shade300, width: 2),
                padding: EdgeInsets.symmetric(
                  horizontal: isMobile ? 16 : 24,
                  vertical: isMobile ? 12 : 16,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(13),
                ),
              ),
              child: const Text("Previous", style: TextStyle(color: Colors.black)),
            ),
          const Spacer(),
          ElevatedButton(
            onPressed: () {
              if (_step < _stepLabels.length - 1) {
                setState(() => _step++);
              } else {
                _saveApplication();
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryRed,
              padding: EdgeInsets.symmetric(
                horizontal: isMobile ? 32 : 48,
                vertical: isMobile ? 12 : 16,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(13),
              ),
            ),
            child: Text(
              _step < _stepLabels.length - 1 ? "Next Step" : "Submit",
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _gradientBtn(IconData icon, String label, VoidCallback onTap) {
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
        onPressed: _isSaving ? null : onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(13),
          ),
        ),
        icon: _isSaving
            ? const SizedBox(
                width: 18,
                height: 18,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            : Icon(icon, color: Colors.white, size: 17),
        label: Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  // ── HELPERS ──
  Widget _stepHeader(String title, String sub, IconData icon) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(icon, color: Colors.white, size: 24),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: AppTheme.titleStyle.copyWith(fontSize: 24)),
              Text(
                sub,
                style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
              ),
            ],
          ),
        ),
      ],
    ).animate().fadeIn().slideX(begin: -0.1);
  }

  Widget _row(bool isMobile, List<Widget> children) {
    if (isMobile) {
      return Column(
        children: children
            .map((c) => Padding(
                  padding: const EdgeInsets.only(bottom: 18),
                  child: c,
                ))
            .toList(),
      );
    }
    return Row(
      children: children
          .map((c) => Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(right: 18),
                  child: c,
                ),
              ))
          .toList(),
    );
  }

  Widget _field(String label, IconData icon, {String? hint, TextEditingController? controller, bool isPassword = false, bool readOnly = false, VoidCallback? onTap}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.bold,
            color: Color(0xFF1B3E5F),
          ),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: isPassword,
          readOnly: readOnly,
          onTap: onTap,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, size: 18, color: AppColors.primaryRed),
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: Colors.grey.shade200),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(color: Colors.grey.shade200),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: const BorderSide(color: AppColors.primaryRed, width: 1.5),
            ),
          ),
        ),
      ],
    );
  }

  Widget _dropdown(
    String label,
    IconData icon,
    List<String> items,
    String value,
    Function(String?) onChange,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: Colors.black54,
          ),
        ),
        const SizedBox(height: 7),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(13),
            border: Border.all(color: Colors.grey.shade100),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Icon(icon, color: AppColors.primaryRed, size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: value,
                    isExpanded: true,
                    style: const TextStyle(color: Colors.black87, fontSize: 13),
                    onChanged: onChange,
                    items: items
                        .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                        .toList(),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _dynamicDropdown(
    String label,
    IconData icon,
    List<dynamic> items,
    String? value,
    Function(String?)? onChange,
  ) {
    // Determine effective background color
    Color bgColor = items.isEmpty ? Colors.grey.shade100 : Colors.white;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: Colors.black54,
          ),
        ),
        const SizedBox(height: 7),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(13),
            border: Border.all(color: Colors.grey.shade100),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Row(
            children: [
              Icon(icon, color: AppColors.primaryRed, size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: items.any((e) => e['_id'] == value) ? value : null,
                    hint: Text(items.isEmpty ? 'Not Available' : 'Select $label', style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
                    isExpanded: true,
                    style: const TextStyle(color: Colors.black87, fontSize: 13),
                    onChanged: onChange,
                    items: items
                        .map((e) => DropdownMenuItem<String>(value: e['_id'], child: Text(e['name'] ?? '')))
                        .toList(),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildIdPreview() {
    final branchId = _selectedBranch;
    final branch = _branches.firstWhere((b) => b['_id'] == branchId, orElse: () => null);
    if (branch == null) return const SizedBox();
    
    // Extract only alphabets from branch name/code
    String rawCode = branch['branchCode'] ?? (branch['name'] as String);
    String branchCode = rawCode.replaceAll(RegExp(r'[^A-Z]'), '').toUpperCase();
    if (branchCode.isEmpty) branchCode = "STU"; // Fallback

    final yearPrefix = _selectedSession.split('-')[0];
    final dobParts = _dobCtrl.text.split('/');
    final dayPart = dobParts.isNotEmpty && dobParts[0].isNotEmpty ? dobParts[0].padLeft(2, '0') : "DD";
    final previewId = "$yearPrefix$branchCode$dayPart";

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: BoxDecoration(
        color: AppColors.primaryRed.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(15),
        border: Border.all(color: AppColors.primaryRed.withValues(alpha: 0.15)),
      ),
      child: Row(
        children: [
          Icon(Icons.badge_rounded, color: AppColors.primaryRed, size: 24),
          const SizedBox(width: 15),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Projected Student ID",
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                previewId,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1B3E5F),
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
          const Spacer(),
          Container(
             padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
             decoration: BoxDecoration(
               color: AppColors.primaryRed,
               borderRadius: BorderRadius.circular(8),
             ),
             child: const Text(
               "AUTO-GENERATED",
               style: TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
             ),
          ),
        ],
      ),
    );
  }

  Future<void> _saveApplication() async {
    setState(() => _isSaving = true);

    try {
      // 1. Upload Profile Photo
      String? profileUrl = _existingProfileUrl;
      if (_profileImage != null) {
        profileUrl = await ApplicationService.uploadToCloudinary(_profileImage);
      }

      // 2. Upload Documents
      final Map<String, String> documentUrls = Map<String, String>.from(_existingDocumentUrls);
      for (var entry in _documentFiles.entries) {
        if (entry.value != null) {
          final url = await ApplicationService.uploadToCloudinary(entry.value);
          if (url != null) {
            documentUrls[entry.key] = url;
          }
        }
      }

      // 3. Prepare Final Data
      final applicationData = {
        "applicantPhoto": profileUrl,
        "firstName": _firstNameCtrl.text,
        "lastName": _lastNameCtrl.text,
        "dob": _dobCtrl.text,
        "gender": _selectedGender,
        "email": _emailCtrl.text,
        "mobile": _mobileCtrl.text,
        "alternateMobile": _altMobileCtrl.text,
        "address": _addressCtrl.text,
        "city": _cityCtrl.text,
        "state": _stateCtrl.text,
        "pinCode": _pinCodeCtrl.text,

        "highestQualification": _selectedQualification,
        "institutionName": _institutionCtrl.text,
        "boardUniversity": _boardCtrl.text,
        "percentageCGPA": _scoreCtrl.text,
        "yearOfPassing": _yearCtrl.text,
        "subjectMarks": {
          "subject1": _sub1Ctrl.text,
          "subject2": _sub2Ctrl.text,
          "subject3": _sub3Ctrl.text,
        },
        "entranceScore": _entranceCtrl.text,

        "selectedBranch": _selectedBranch,
        "selectedProgram": _selectedProgram,
        "sessionYear": _selectedSession,
        "category": _selectedCategory,
        "statementOfPurpose": _sopCtrl.text,
        "password": _passwordCtrl.text,

        "documents": documentUrls,
      };

      if (_passwordCtrl.text != _confirmPasswordCtrl.text) {
        throw Exception("Passwords do not match!");
      }

      // 4. Submit to Backend
      if (widget.application != null) {
        await ApplicationService.updateApplication(widget.application!['_id'], applicationData);
      } else {
        await ApplicationService.submitApplication(applicationData);
      }

      if (mounted) {
        setState(() => _isSaving = false);
        Navigator.pop(context, true); // Return true to indicate refresh needed
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.application != null ? "Application updated successfully!" : "Application submitted successfully!"),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Submission failed: $e"),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
