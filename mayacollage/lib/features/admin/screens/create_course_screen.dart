import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/course_service.dart';

class CreateCourseScreen extends StatefulWidget {
  final Map<String, dynamic> branch;
  final Map<String, dynamic>? course;

  const CreateCourseScreen({super.key, required this.branch, this.course});

  @override
  State<CreateCourseScreen> createState() => _CreateCourseScreenState();
}

class _CreateCourseScreenState extends State<CreateCourseScreen> {
  final _formKey = GlobalKey<FormState>();
  
  late final TextEditingController _codeCtrl;
  late final TextEditingController _nameCtrl;
  late final TextEditingController _durationCtrl;
  late final TextEditingController _intakeCtrl;
  late final TextEditingController _coordinatorCtrl;
  late final TextEditingController _tuitionCtrl;
  late final TextEditingController _labCtrl;
  late final TextEditingController _semesterCountCtrl;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _codeCtrl = TextEditingController(text: widget.course?['code'] ?? '');
    _nameCtrl = TextEditingController(text: widget.course?['name'] ?? '');
    _durationCtrl = TextEditingController(text: widget.course?['duration']?.toString() ?? '');
    _intakeCtrl = TextEditingController(text: widget.course?['intakeCapacity']?.toString() ?? '');
    _coordinatorCtrl = TextEditingController(text: widget.course?['coordinator'] ?? '');
    _tuitionCtrl = TextEditingController(text: widget.course?['tuitionFee']?.toString() ?? '');
    _labCtrl = TextEditingController(text: widget.course?['labIndex']?.toString() ?? '');
    _semesterCountCtrl = TextEditingController(text: widget.course?['totalSemesters']?.toString() ?? '8');
  }

  @override
  void dispose() {
    _codeCtrl.dispose();
    _nameCtrl.dispose();
    _durationCtrl.dispose();
    _intakeCtrl.dispose();
    _coordinatorCtrl.dispose();
    _tuitionCtrl.dispose();
    _labCtrl.dispose();
    _semesterCountCtrl.dispose();
    super.dispose();
  }

  Future<void> _saveCourse() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isSaving = true);
    try {
      final totalTuition = double.tryParse(_tuitionCtrl.text) ?? 0.0;
      final totalSems = int.tryParse(_semesterCountCtrl.text) ?? 8;
      final feePerSem = totalTuition / (totalSems > 0 ? totalSems : 1);

      final semesterFees = <Map<String, dynamic>>[];
      for (int i = 0; i < totalSems; i++) {
        semesterFees.add({
          'semester': i + 1,
          'fee': feePerSem,
        });
      }

      final data = {
        'branchId': widget.branch['_id'],
        'code': _codeCtrl.text,
        'name': _nameCtrl.text,
        'duration': int.tryParse(_durationCtrl.text) ?? 4,
        'intakeCapacity': int.tryParse(_intakeCtrl.text) ?? 60,
        'coordinator': _coordinatorCtrl.text,
        'tuitionFee': totalTuition.toInt(),
        'labIndex': _labCtrl.text,
        'totalSemesters': totalSems,
        'semesterFees': semesterFees,
      };

      if (widget.course != null) {
        await CourseService.updateCourse(widget.course!['_id'], data);
      } else {
        await CourseService.createCourse(data);
      }

      if (mounted) {
        setState(() => _isSaving = false);
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.course != null ? 'Audit Successful: Course Curricular Updated' : 'Deployment Complete: Course Node Active'), 
            backgroundColor: Colors.green
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: LayoutBuilder(
        builder: (context, constraints) {
          final width = constraints.maxWidth;
          final isMobile = width < 900;
          
          return Row(
            children: [
              // Left Sidebar (Guide) - Hidden on mobile
              if (!isMobile)
                Container(
                  width: 450,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFFF8F6F6), Colors.white],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    border: const Border(right: BorderSide(color: Color(0xFFF1F1F1))),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 60, vertical: 40),
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        IconButton(
                          onPressed: () => Navigator.pop(context),
                          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
                        ),
                        const SizedBox(height: 60),
                        Container(
                          padding: const EdgeInsets.all(20),
                          decoration: BoxDecoration(
                            color: (widget.branch['color'] as Color).withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            widget.branch['icon'] as IconData,
                            color: widget.branch['color'] as Color,
                            size: 40,
                          ),
                        ),
                        const SizedBox(height: 40),
                        Text(
                          widget.course != null ? "RESTRICT\nAUDIT" : "DEPLOY NEW\nCOURSE SCHEME",
                          style: const TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -1,
                            height: 1.1,
                          ),
                        ),
                        const SizedBox(height: 24),
                        Text(
                          widget.course != null 
                            ? "Audit and refine curricular and financial coordinates for ${widget.course!['name']}."
                            : "Initialize a new course under ${widget.branch['name']}. This will enable student discovery and automated billing.",
                          style: const TextStyle(
                            color: Colors.grey,
                            fontSize: 15,
                            height: 1.6,
                          ),
                        ),
                        const SizedBox(height: 60),
                        _guideStep(
                          "01",
                          "Academic ID",
                          "Provision unique identification parameters.",
                        ),
                        _guideStep(
                          "02",
                          "Billing Cycle",
                          "Determine total semesters for installment splitting.",
                        ),
                        _guideStep(
                          "03",
                          "Nodes & Coordination",
                          "Assign institutional faculty waypoints.",
                        ),
                      ],
                    ),
                  ),
                ),

              // Main Form
              Expanded(
                child: SingleChildScrollView(
                  padding: EdgeInsets.symmetric(
                    horizontal: isMobile ? 24 : 100,
                    vertical: isMobile ? 40 : 80,
                  ),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (isMobile) ...[
                          IconButton(
                            onPressed: () => Navigator.pop(context),
                            icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
                          ),
                          const SizedBox(height: 24),
                          Text(
                            widget.course != null ? "Edit Course: ${widget.course!['code']}" : "New Course: ${widget.branch['name']}",
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 32),
                        ],
                        const Text(
                          "Section 1: General Curricular Parameters",
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            color: Colors.grey,
                            letterSpacing: 1,
                          ),
                        ).animate().fadeIn(delay: 200.ms),
                        const SizedBox(height: 32),
                        _row(isMobile, [
                          _textField("Course Code (e.g., CS-101)", Icons.qr_code_rounded, _codeCtrl),
                          _textField("Full Course Nomenclature", Icons.school_rounded, _nameCtrl),
                        ]).animate(delay: 300.ms).fadeIn().slideY(begin: 0.1),
                        SizedBox(height: isMobile ? 24 : 32),
                        _row(isMobile, [
                          _textField("Duration (Years)", Icons.timer_outlined, _durationCtrl),
                          _textField("Intake Capacity", Icons.groups_rounded, _intakeCtrl),
                        ]).animate(delay: 400.ms).fadeIn().slideY(begin: 0.1),
                        
                        SizedBox(height: isMobile ? 48 : 60),
                        
                        const Text(
                          "Section 2: Automated Billing Lifecycle",
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            color: Colors.grey,
                            letterSpacing: 1,
                          ),
                        ).animate().fadeIn(delay: 450.ms),
                        const SizedBox(height: 32),
                        _row(isMobile, [
                          _textField("Total Semesters (Installments)", Icons.numbers_rounded, _semesterCountCtrl),
                          _textField("Total Program Fee (Total Tuition)", Icons.payments_rounded, _tuitionCtrl),
                        ]).animate(delay: 500.ms).fadeIn().slideY(begin: 0.1),
                        const SizedBox(height: 12),
                        const Text(
                          "* Fees will be equally distributed among the total number of semesters.",
                          style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold),
                        ).animate(delay: 600.ms).fadeIn(),

                        SizedBox(height: isMobile ? 48 : 60),

                        const Text(
                          "Section 3: Accreditation & Node Coordination",
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            color: Colors.grey,
                            letterSpacing: 1,
                          ),
                        ).animate().fadeIn(delay: 650.ms),
                        const SizedBox(height: 32),
                        _textField("Primary Course Coordinator", Icons.person_pin_rounded, _coordinatorCtrl)
                            .animate(delay: 700.ms)
                            .fadeIn(),
                        const SizedBox(height: 32),
                        _textField("Lab Allocation Index", Icons.biotech_rounded, _labCtrl)
                            .animate(delay: 750.ms)
                            .fadeIn(),
                        
                        SizedBox(height: isMobile ? 60 : 100),
                        
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _isSaving ? null : _saveCourse,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.black,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 24),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: _isSaving
                                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : Text(
                                    widget.course != null ? "UPDATE CURRICULUM" : "ACTIVATE COURSE",
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 2,
                                    ),
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _row(bool isMobile, List<Widget> children) {
    if (isMobile) {
      return Column(
        children: children
            .map((c) => Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: c,
                ))
            .toList(),
      );
    }
    return Row(
      children: children
          .map((c) => Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(right: 32),
                  child: c,
                ),
              ))
          .toList(),
    );
  }

  Widget _guideStep(String num, String title, String sub) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 40),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            num,
            style: TextStyle(
              color: (widget.branch['color'] as Color).withValues(alpha: 0.3),
              fontWeight: FontWeight.w900,
              fontSize: 18,
            ),
          ),
          const SizedBox(width: 24),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                  ),
                ),
                Text(
                  sub,
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _textField(String hint, IconData icon, TextEditingController controller) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8F6F6),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.black.withValues(alpha: 0.01)),
      ),
      child: TextFormField(
        controller: controller,
        validator: (v) => v!.isEmpty ? 'Required' : null,
        decoration: InputDecoration(
          hintText: hint,
          prefixIcon: Icon(icon, color: Colors.grey, size: 20),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.all(24),
        ),
      ),
    );
  }
}
