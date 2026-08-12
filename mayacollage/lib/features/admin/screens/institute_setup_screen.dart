import 'package:flutter/material.dart';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';
import 'package:flutter_animate/flutter_animate.dart';

class InstituteSetupScreen extends StatefulWidget {
  const InstituteSetupScreen({super.key});

  @override
  State<InstituteSetupScreen> createState() => _InstituteSetupScreenState();
}

class _InstituteSetupScreenState extends State<InstituteSetupScreen> {
  int _currentStep = 0;

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.backgroundBlush,
      child: Column(
        children: [
          // HEADER
          _buildHeader(),

          Expanded(
            child: Row(
              children: [
                // LEFT PANEL: Progress Stepper
                Expanded(
                  flex: 3,
                  child: Container(
                    margin: const EdgeInsets.all(40),
                    child: _buildStepper(),
                  ),
                ),

                // RIGHT PANEL: Form Container
                Expanded(
                  flex: 7,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(40),
                    child: _buildContentArea(),
                  ),
                ),
              ],
            ),
          ),
          _buildBottomActions(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 24),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFF1F1F1))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            "Institute Onboarding",
            style: AppTheme.titleStyle.copyWith(fontSize: 24),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: AppColors.primaryRed.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(100),
            ),
            child: const Text(
              "Setup Wizard",
              style: TextStyle(
                color: AppColors.primaryRed,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStepper() {
    final List<String> steps = [
      "Institute Profile",
      "Branding & Logo",
      "Academic Calendar",
      "Branch & Departments",
      "Course Framework",
    ];

    return Column(
      children: List.generate(steps.length, (index) {
        final isActive = _currentStep == index;
        final isCompleted = _currentStep > index;

        return Padding(
          padding: const EdgeInsets.only(bottom: 24),
          child: Row(
            children: [
              AnimatedContainer(
                duration: const Duration(milliseconds: 300),
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: isCompleted
                      ? Colors.green
                      : (isActive ? AppColors.primaryRed : Colors.white),
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    if (isActive)
                      BoxShadow(
                        color: AppColors.primaryRed.withValues(alpha: 0.2),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                  ],
                ),
                child: Center(
                  child: isCompleted
                      ? const Icon(Icons.check, color: Colors.white)
                      : Text(
                          (index + 1).toString(),
                          style: TextStyle(
                            color: isActive ? Colors.white : AppColors.textMain,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 24),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "Step ${index + 1}",
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: Colors.grey.shade400,
                      letterSpacing: 1,
                    ),
                  ),
                  Text(
                    steps[index],
                    style: AppTheme.bodyStyle.copyWith(
                      fontWeight: isActive ? FontWeight.w800 : FontWeight.w500,
                      color: isActive
                          ? AppColors.textMain
                          : Colors.grey.shade400,
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      }),
    ).animate().fadeIn(delay: 300.ms).slideX(begin: -0.1);
  }

  Widget _buildContentArea() {
    return Container(
      padding: const EdgeInsets.all(48),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 40,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: IndexedStack(
        index: _currentStep,
        children: [
          _buildStep1(),
          _buildStep2(),
          _buildStep3(),
          const Center(
            child: Text("Branch & Departments Configuration coming soon..."),
          ),
          const Center(
            child: Text("Course Framework Configuration coming soon..."),
          ),
        ],
      ),
    ).animate(key: ValueKey(_currentStep)).fadeIn().slideX(begin: 0.1);
  }

  Widget _buildStep1() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Profile Setup",
          style: AppTheme.titleStyle.copyWith(fontSize: 24),
        ),
        const SizedBox(height: 12),
        Text(
          "Define the basic identification details for your institute.",
          style: AppTheme.bodyStyle,
        ),
        const SizedBox(height: 48),
        _buildTextField(
          "Institute Full Name",
          "e.g. Maya Institute of Technology",
          Icons.school_rounded,
        ),
        const SizedBox(height: 24),
        _buildTextField(
          "Contact Email",
          "admin@mayainstitute.edu",
          Icons.email_rounded,
        ),
        const SizedBox(height: 24),
        _buildTextField(
          "Full Address",
          "123, Academic Blvd, Campus City",
          Icons.location_on_rounded,
        ),
      ],
    );
  }

  Widget _buildStep2() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Visual Branding",
          style: AppTheme.titleStyle.copyWith(fontSize: 24),
        ),
        const SizedBox(height: 12),
        Text(
          "Customize the look and feel of your ERP instance.",
          style: AppTheme.bodyStyle,
        ),
        const SizedBox(height: 48),
        Container(
          width: double.infinity,
          height: 200,
          decoration: BoxDecoration(
            color: AppColors.backgroundBlush,
            borderRadius: BorderRadius.circular(24),
            border: Border.all(
              color: AppColors.primaryRed.withValues(alpha: 0.2),
              style: BorderStyle.solid,
            ),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.cloud_upload_rounded,
                color: AppColors.primaryRed,
                size: 48,
              ),
              const SizedBox(height: 16),
              const Text(
                "Drag and drop your logo here",
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: AppColors.primaryRed,
                ),
              ),
              Text(
                "Supported formats: PNG, JPG (Max 2MB)",
                style: TextStyle(fontSize: 12, color: Colors.grey.shade400),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStep3() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "Academic Calendar",
          style: AppTheme.titleStyle.copyWith(fontSize: 24),
        ),
        const SizedBox(height: 12),
        Text(
          "Set the timelines for the upcoming session.",
          style: AppTheme.bodyStyle,
        ),
        const SizedBox(height: 48),
        Row(
          children: [
            Expanded(
              child: _buildTextField(
                "Start Date",
                "01 July 2024",
                Icons.calendar_today_rounded,
              ),
            ),
            const SizedBox(width: 24),
            Expanded(
              child: _buildTextField(
                "End Date",
                "30 June 2025",
                Icons.event_rounded,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTextField(String label, String hint, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: AppColors.textMain,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: AppColors.backgroundBlush,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade100, width: 2),
          ),
          child: TextField(
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(color: Colors.grey.shade400),
              prefixIcon: Icon(icon, color: AppColors.primaryRed, size: 20),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 20,
                vertical: 16,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBottomActions() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey.shade100)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          if (_currentStep > 0)
            ElevatedButton(
              onPressed: () => setState(() => _currentStep--),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: AppColors.textMain,
                elevation: 0,
                padding: const EdgeInsets.all(22),
              ),
              child: const Row(
                children: [
                  Icon(Icons.arrow_back_ios_new_rounded, size: 16),
                  SizedBox(width: 12),
                  Text("Previous Page"),
                ],
              ),
            ),
          const SizedBox(width: 24),
          DecoratedBox(
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(16),
            ),
            child: ElevatedButton(
              onPressed: () {
                if (_currentStep < 4) {
                  setState(() => _currentStep++);
                } else {
                  // Final step logic
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                padding: const EdgeInsets.all(22),
              ),
              child: Row(
                children: [
                  Text(
                    _currentStep == 4 ? "Complete Setup" : "Save & Continue",
                  ),
                  const SizedBox(width: 12),
                  const Icon(Icons.arrow_forward_ios_rounded, size: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
