import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/app_constants.dart';
import '../../../core/services/branch_service.dart';

class CreateBranchScreen extends StatefulWidget {
  final Map<String, dynamic>? branch;
  const CreateBranchScreen({super.key, this.branch});

  @override
  State<CreateBranchScreen> createState() => _CreateBranchScreenState();
}

class _CreateBranchScreenState extends State<CreateBranchScreen> {
  final _formKey = GlobalKey<FormState>();
  
  final _codeCtrl = TextEditingController();
  final _nameCtrl = TextEditingController();
  final _deanCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _extCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _yearCtrl = TextEditingController();
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    if (widget.branch != null) {
      _codeCtrl.text = widget.branch!['code'] ?? '';
      _nameCtrl.text = widget.branch!['name'] ?? '';
      _deanCtrl.text = widget.branch!['deanName'] ?? '';
      _emailCtrl.text = widget.branch!['contactEmail'] ?? '';
      _extCtrl.text = widget.branch!['contactExt'] ?? '';
      _locationCtrl.text = widget.branch!['location'] ?? '';
      _yearCtrl.text = widget.branch!['establishedYear']?.toString() ?? '';
    }
  }

  @override
  void dispose() {
    _codeCtrl.dispose();
    _nameCtrl.dispose();
    _deanCtrl.dispose();
    _emailCtrl.dispose();
    _extCtrl.dispose();
    _locationCtrl.dispose();
    _yearCtrl.dispose();
    super.dispose();
  }

  Future<void> _saveBranch() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isSaving = true);
    try {
      final data = {
        'code': _codeCtrl.text,
        'name': _nameCtrl.text,
        'deanName': _deanCtrl.text,
        'contactEmail': _emailCtrl.text,
        'contactExt': _extCtrl.text,
        'location': _locationCtrl.text,
        'establishedYear': _yearCtrl.text,
      };

      if (widget.branch != null) {
        await BranchService.updateBranch(widget.branch!['_id'], data);
      } else {
        await BranchService.createBranch(data);
      }

      if (mounted) {
        setState(() => _isSaving = false);
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(widget.branch != null ? 'Branch updated successfully' : 'Branch created successfully'), backgroundColor: Colors.green),
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
                    gradient: LinearGradient(
                      colors: [const Color(0xFFF8F6F6), Colors.white],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    border: const Border(right: BorderSide(color: Color(0xFFF1F1F1))),
                  ),
                  padding: const EdgeInsets.all(60),
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
                          color: AppColors.primaryRed.withValues(alpha: 0.1),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.business_center_rounded,
                          color: AppColors.primaryRed,
                          size: 40,
                        ),
                      ),
                      const SizedBox(height: 40),
                      Text(
                        widget.branch != null ? "UPDATE\nBRANCH" : "ESTABLISH NEW\nBRANCH",
                        style: const TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -1,
                          height: 1.1,
                        ),
                      ),
                      const SizedBox(height: 24),
                      Text(
                        widget.branch != null
                            ? "Update structural details of the institutional branch."
                            : "Provide structural details to create a new institutional branch. This will serve as the parent node for upcoming departments and courses.",
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 15,
                          height: 1.6,
                        ),
                      ),
                      const SizedBox(height: 60),
                      _guideStep(
                        "01",
                        "Branch Identity",
                        "Define the unique code and official name.",
                      ),
                      _guideStep(
                        "02",
                        "Dean Allocation",
                        "Assign a primary administrator for this branch.",
                      ),
                      _guideStep(
                        "03",
                        "Operational Capacity",
                        "Specify initial course and student limits.",
                      ),
                    ],
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
                            widget.branch != null ? "Edit Branch" : "New Branch",
                            style: const TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                          const SizedBox(height: 32),
                        ],
                        const Text(
                          "Section 1: Identity & Parameters",
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            color: Colors.grey,
                            letterSpacing: 1,
                          ),
                        ).animate().fadeIn(delay: 200.ms),
                        const SizedBox(height: 32),
                        _row(isMobile, [
                          _textField("Branch Code (e.g., SOE)", Icons.qr_code_rounded, _codeCtrl),
                          _textField("Official Branch Name", Icons.business_rounded, _nameCtrl),
                        ]).animate(delay: 300.ms).fadeIn().slideY(begin: 0.1),
                        SizedBox(height: isMobile ? 32 : 60),
                        const Text(
                          "Section 2: Leadership & Coordination",
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            color: Colors.grey,
                            letterSpacing: 1,
                          ),
                        ).animate().fadeIn(delay: 400.ms),
                        const SizedBox(height: 32),
                        _textField("Primary Dean / HOD Name", Icons.person_pin_rounded, _deanCtrl)
                            .animate(delay: 500.ms)
                            .fadeIn(),
                        const SizedBox(height: 32),
                        _row(isMobile, [
                          _textField("Contact Email", Icons.email_outlined, _emailCtrl),
                          _textField("Contact Ext.", Icons.phone_rounded, _extCtrl),
                        ]).animate(delay: 600.ms).fadeIn().slideY(begin: 0.1),
                        SizedBox(height: isMobile ? 32 : 60),

                        const Text(
                          "Section 3: Establishment Details",
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                            color: Colors.grey,
                            letterSpacing: 1,
                          ),
                        ).animate().fadeIn(delay: 700.ms),
                        const SizedBox(height: 32),
                        _row(isMobile, [
                          _textField("Campus Location", Icons.location_on_rounded, _locationCtrl),
                          _textField("Established Year", Icons.calendar_today_rounded, _yearCtrl, isNumber: true),
                        ]).animate(delay: 800.ms).fadeIn().slideY(begin: 0.1),
                        
                        SizedBox(height: isMobile ? 60 : 100),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _isSaving ? null : _saveBranch,
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
                                    widget.branch != null ? "UPDATE BRANCH" : "PROVISION BRANCH",
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
              color: AppColors.primaryRed.withValues(alpha: 0.3),
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

  Widget _textField(String hint, IconData icon, TextEditingController controller, {bool isNumber = false}) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFF8F6F6),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.black.withValues(alpha: 0.01)),
      ),
      child: TextFormField(
        controller: controller,
        keyboardType: isNumber ? TextInputType.number : TextInputType.text,
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
