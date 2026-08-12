import 'package:flutter/material.dart';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';

class CreateExamScreen extends StatefulWidget {
  const CreateExamScreen({super.key});

  @override
  State<CreateExamScreen> createState() => _CreateExamScreenState();
}

class _CreateExamScreenState extends State<CreateExamScreen> {
  int _step = 0;
  String _selectedExamType = 'Mid-Semester';
  String _selectedDept = 'B.Tech';
  final String _selectedCourse = 'CSE';
  final List<String> _examTypes = [
    'Mid-Semester',
    'End-Semester',
    'Unit Test',
    'Practical Exam',
    'Project Submission',
  ];
  final List<String> _depts = ['B.Tech', 'MBA', 'B.Sc', 'B.Com'];
  final List<String> _subjects = [
    'Data Structures',
    'Algorithms',
    'Computer Networks',
    'OS',
    'Digital Electronics',
  ];

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
                    Expanded(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(20),
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 300),
                          child: _buildStepContent(key: ValueKey(_step), isMobile: isMobile),
                        ),
                      ),
                    ),
                    _buildNavBar(isMobile),
                  ],
                )
              : Row(
                  children: [
                    // ── LEFT: Info Panel ──
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
                            Positioned(top: -50, right: -40, child: _blob(200, 0.08)),
                            Positioned(bottom: -60, left: -20, child: _blob(240, 0.05)),
                            Padding(
                              padding: const EdgeInsets.all(32),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _backButton(context),
                                  const SizedBox(height: 48),
                                  const Text(
                                    "Plan Exam\nSchedule",
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 32,
                                      letterSpacing: -1,
                                      height: 1.1,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  Text(
                                    "Create and organize upcoming examinations for departments and courses.",
                                    style: TextStyle(
                                      color: Colors.white.withValues(alpha: 0.7),
                                      fontSize: 13,
                                    ),
                                  ),
                                  const SizedBox(height: 48),
                                  _buildStepper(),
                                  const Spacer(),
                                  _infoRow(
                                    Icons.check_circle_rounded,
                                    "Automated Conflict Checking",
                                  ),
                                  const SizedBox(height: 16),
                                  _infoRow(
                                    Icons.notifications_active_rounded,
                                    "Notify Students Instantly",
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),

                    // ── RIGHT: Form Panel ──
                    Expanded(
                      child: Column(
                        children: [
                          _formHeader(isMobile),
                          Expanded(
                            child: SingleChildScrollView(
                              padding: const EdgeInsets.all(48),
                              child: AnimatedSwitcher(
                                duration: const Duration(milliseconds: 300),
                                child: _buildStepContent(key: ValueKey(_step), isMobile: isMobile),
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

  Widget _buildMobileHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 50, 20, 24),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF6B0F3A), Color(0xFFEC1349)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(32),
          bottomRight: Radius.circular(32),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              _backButton(context),
              const Spacer(),
              Text(
                "Step ${_step + 1} of 3",
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Text(
            "Plan Exam Schedule",
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w900,
              fontSize: 24,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 16),
          _buildMobileStepper(),
        ],
      ),
    );
  }

  Widget _buildMobileStepper() {
    return Row(
      children: List.generate(3, (i) {
        final isActive = _step >= i;
        return Expanded(
          child: Container(
            margin: EdgeInsets.only(right: i < 2 ? 8 : 0),
            height: 4,
            decoration: BoxDecoration(
              color: isActive ? Colors.white : Colors.white24,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        );
      }),
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
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.arrow_back_ios_new_rounded,
              color: Colors.white,
              size: 14,
            ),
            SizedBox(width: 8),
            Text(
              "Back",
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepper() {
    final steps = ['Exam Basis', 'Subject & Date', 'Venu & Faculty'];
    return Column(
      children: List.generate(steps.length, (i) {
        final isActive = _step >= i;
        return Padding(
          padding: const EdgeInsets.only(bottom: 24),
          child: Row(
            children: [
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: isActive
                      ? Colors.white
                      : Colors.white.withValues(alpha: 0.2),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    "${i + 1}",
                    style: TextStyle(
                      color: isActive ? AppColors.primaryRed : Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Text(
                steps[i],
                style: TextStyle(
                  color: isActive
                      ? Colors.white
                      : Colors.white.withValues(alpha: 0.5),
                  fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
                ),
              ),
            ],
          ),
        );
      }),
    );
  }

  Widget _infoRow(IconData icon, String text) => Row(
    children: [
      Icon(icon, color: Colors.white, size: 18),
      const SizedBox(width: 12),
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

  Widget _formHeader(bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 20 : 48,
        vertical: isMobile ? 16 : 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFF1F1F1))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              if (!isMobile) ...[
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.primaryRed.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    Icons.add_task_rounded,
                    color: AppColors.primaryRed,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 16),
              ],
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Create New Exam Plan",
                    style: AppTheme.titleStyle.copyWith(fontSize: isMobile ? 18 : 22),
                  ),
                  Text(
                    "Complete all 3 steps to publish",
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                  ),
                ],
              ),
            ],
          ),
          if (!isMobile)
            SizedBox(
              width: 180,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(10),
                child: LinearProgressIndicator(
                  value: (_step + 1) / 3,
                  minHeight: 8,
                  color: AppColors.primaryRed,
                  backgroundColor: AppColors.primaryRed.withValues(alpha: 0.1),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStepContent({required Key key, required bool isMobile}) {
    switch (_step) {
      case 0:
        return _stepBasic(key: key, isMobile: isMobile);
      case 1:
        return _stepSubject(key: key, isMobile: isMobile);
      case 2:
        return _stepVenue(key: key, isMobile: isMobile);
      default:
        return _stepBasic(key: key, isMobile: isMobile);
    }
  }

  Widget _stepBasic({required Key key, required bool isMobile}) {
    return Column(
      key: key,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Examination Basis",
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 32),
        _fieldLabel("EXAM TYPE"),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: _examTypes
              .map(
                (t) => _choiceChip(
                  t,
                  _selectedExamType == t,
                  (v) => setState(() => _selectedExamType = t),
                ),
              )
              .toList(),
        ),
        const SizedBox(height: 32),
        if (isMobile) ...[
          _field("Academic Year", Icons.calendar_today_rounded, hint: "2024-25"),
          const SizedBox(height: 20),
          _field("Exam Cycle", Icons.cyclone_rounded, hint: "Spring 2024"),
          const SizedBox(height: 20),
          _dropdown(
            "Select Department",
            _depts,
            _selectedDept,
            (v) => setState(() => _selectedDept = v!),
          ),
          const SizedBox(height: 20),
          _dropdown("Target Course", ['CSE', 'ME', 'ECE'], 'CSE', (v) => {}),
        ] else ...[
          Row(
            children: [
              Expanded(
                child: _field(
                  "Academic Year",
                  Icons.calendar_today_rounded,
                  hint: "2024-25",
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: _field(
                  "Exam Cycle",
                  Icons.cyclone_rounded,
                  hint: "Spring 2024",
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: _dropdown(
                  "Select Department",
                  _depts,
                  _selectedDept,
                  (v) => setState(() => _selectedDept = v!),
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: _dropdown(
                  "Target Course",
                  ['CSE', 'ME', 'ECE'],
                  'CSE',
                  (v) => {},
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }

  Widget _stepSubject({required Key key, required bool isMobile}) {
    return Column(
      key: key,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Subject & Schedule Details",
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 32),
        _dropdown("Select Subject", _subjects, 'Data Structures', (v) => {}),
        const SizedBox(height: 24),
        if (isMobile) ...[
          _field("Exam Date", Icons.event_rounded, hint: "DD/MM/YYYY"),
          const SizedBox(height: 20),
          _field("Start Time", Icons.schedule_rounded, hint: "10:00 AM"),
          const SizedBox(height: 20),
          _field("Duration", Icons.timer_rounded, hint: "3 Hours"),
        ] else
          Row(
            children: [
              Expanded(
                child: _field(
                  "Exam Date",
                  Icons.event_rounded,
                  hint: "DD/MM/YYYY",
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: _field(
                  "Start Time",
                  Icons.schedule_rounded,
                  hint: "10:00 AM",
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                child: _field("Duration", Icons.timer_rounded, hint: "3 Hours"),
              ),
            ],
          ),
        const SizedBox(height: 24),
        _field("Total Marks", Icons.numbers_rounded, hint: "100"),
        const SizedBox(height: 24),
        _field("Passing Marks", Icons.check_rounded, hint: "35"),
      ],
    );
  }

  Widget _stepVenue({required Key key, required bool isMobile}) {
    return Column(
      key: key,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Venue & Supervision",
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 32),
        _field(
          "Examination Venue / Hall",
          Icons.location_on_rounded,
          hint: "Exhibition Hall 1",
        ),
        const SizedBox(height: 24),
        _field(
          "Main Supervisor / Examiner",
          Icons.person_search_rounded,
          hint: "Dr. Robert Wilson",
        ),
        const SizedBox(height: 24),
        _field(
          "Invigilator Name",
          Icons.person_outline_rounded,
          hint: "Asst. Prof. Sarah Kay",
        ),
        const SizedBox(height: 24),
        _field(
          "Special Instructions",
          Icons.info_outline_rounded,
          hint: "Calculation allowed, Log tables provided.",
        ),
      ],
    );
  }

  Widget _buildNavBar(bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 20 : 48,
        vertical: isMobile ? 16 : 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFF1F1F1))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (_step > 0)
            Expanded(
              flex: isMobile ? 1 : 0,
              child: _secondaryLargeBtn(isMobile ? "Back" : "Previous Step", () => setState(() => _step--), isMobile),
            ),
          if (_step > 0) const SizedBox(width: 12),
          if (!isMobile) const Spacer(),
          Expanded(
            flex: isMobile ? 2 : 0,
            child: _step < 2
                ? _primaryLargeBtn(
                    isMobile ? "Continue" : "Save & Continue",
                    () => setState(() => _step++),
                    Icons.arrow_forward_ios_rounded,
                    isMobile,
                  )
                : _primaryLargeBtn(
                    isMobile ? "Publish Plan" : "Publish Exam Plan",
                    () => Navigator.pop(context),
                    Icons.publish_rounded,
                    isMobile,
                  ),
          ),
        ],
      ),
    );
  }

  // ── HELPERS ──
  Widget _fieldLabel(String label) => Text(
    label,
    style: const TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w900,
      color: Colors.grey,
      letterSpacing: 1,
    ),
  );

  Widget _choiceChip(String label, bool isSelected, Function(bool) onSelected) {
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: onSelected,
      selectedColor: AppColors.primaryRed,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : Colors.black87,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
        fontSize: 13,
      ),
      backgroundColor: Colors.white,
      side: BorderSide(
        color: isSelected ? AppColors.primaryRed : Colors.grey.shade200,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    );
  }

  Widget _field(String label, IconData icon, {String? hint}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _fieldLabel(label.toUpperCase()),
        const SizedBox(height: 10),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: TextField(
            decoration: InputDecoration(
              hintText: hint ?? label,
              prefixIcon: Icon(icon, color: AppColors.primaryRed, size: 18),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: Colors.grey.shade200),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide(color: Colors.grey.shade200),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: const BorderSide(
                  color: AppColors.primaryRed,
                  width: 2,
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _dropdown(
    String label,
    List<String> items,
    String value,
    Function(String?) onChange,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _fieldLabel(label.toUpperCase()),
        const SizedBox(height: 10),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.grey.shade200),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              style: const TextStyle(
                color: Colors.black,
                fontWeight: FontWeight.bold,
              ),
              onChanged: onChange,
              items: items
                  .map((e) => DropdownMenuItem(value: e, child: Text(e)))
                  .toList(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _primaryLargeBtn(String label, VoidCallback onTap, IconData icon, bool isMobile) {
    return Container(
      decoration: BoxDecoration(
        gradient: AppColors.primaryGradient,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryRed.withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ElevatedButton.icon(
        onPressed: onTap,
        icon: Icon(icon, color: Colors.white, size: isMobile ? 16 : 18),
        label: Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          padding: EdgeInsets.symmetric(
            horizontal: isMobile ? 16 : 32,
            vertical: isMobile ? 18 : 22,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),
      ),
    );
  }

  Widget _secondaryLargeBtn(String label, VoidCallback onTap, bool isMobile) {
    return OutlinedButton(
      onPressed: onTap,
      style: OutlinedButton.styleFrom(
        padding: EdgeInsets.symmetric(
          horizontal: isMobile ? 16 : 32,
          vertical: isMobile ? 18 : 22,
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        side: BorderSide(color: Colors.grey.shade300, width: 2),
      ),
      child: Text(
        label,
        style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold),
      ),
    );
  }
}
