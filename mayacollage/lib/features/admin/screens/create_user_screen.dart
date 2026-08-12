import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'dart:typed_data';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/services/user_service.dart';
import '../../../core/services/application_service.dart';
import '../../../core/services/cloudinary_service.dart';

class CreateUserScreen extends StatefulWidget {
  final dynamic user;
  const CreateUserScreen({super.key, this.user});

  @override
  State<CreateUserScreen> createState() => _CreateUserScreenState();
}

class _CreateUserScreenState extends State<CreateUserScreen> {
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _dobController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _employeeIdController = TextEditingController();

  String _selectedRole = 'Admin';
  String _selectedDept = 'Academic';
  bool _isActive = true;
  bool _isSaving = false;
  String? _profilePhotoUrl;
  XFile? _selectedImage;
  Uint8List? _selectedImageBytes;

  @override
  void initState() {
    super.initState();
    if (widget.user != null) {
      _firstNameController.text = widget.user['firstName'] ?? '';
      _lastNameController.text = widget.user['lastName'] ?? '';
      _dobController.text = widget.user['dob'] ?? '';
      _phoneController.text = widget.user['phone'] ?? '';
      _addressController.text = widget.user['address'] ?? '';
      _emailController.text = widget.user['email'] ?? '';
      _employeeIdController.text = widget.user['employeeId'] ?? '';
      _selectedRole = widget.user['role'] ?? 'Admin';
      _selectedDept = widget.user['department'] ?? 'Academic';
      _isActive = widget.user['status'] == 'Active';
      _profilePhotoUrl = widget.user['profilePhoto'];
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1024,
      maxHeight: 1024,
      imageQuality: 70,
    );
    if (image != null) {
      final bytes = await CloudinaryService.getImageBytes(image);
      setState(() {
        _selectedImage = image;
        _selectedImageBytes = bytes;
      });
    }
  }

  Future<void> _saveUser() async {
    if (_passwordController.text != _confirmPasswordController.text && widget.user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Passwords do not match')),
      );
      return;
    }

    setState(() => _isSaving = true);

    try {
      String? photoUrl = _profilePhotoUrl;
      if (_selectedImage != null) {
        photoUrl = await ApplicationService.uploadToCloudinary(_selectedImage);
      }

      final userData = {
        'firstName': _firstNameController.text,
        'lastName': _lastNameController.text,
        'dob': _dobController.text,
        'phone': _phoneController.text,
        'address': _addressController.text,
        'email': _emailController.text,
        'role': _selectedRole,
        'department': _selectedDept,
        'employeeId': _employeeIdController.text,
        'status': _isActive ? 'Active' : 'Inactive',
        'profilePhoto': photoUrl,
      };

      if (_passwordController.text.isNotEmpty) {
        userData['password'] = _passwordController.text;
      }

      if (widget.user != null) {
        await UserService.updateUser(widget.user['_id'], userData);
      } else {
        if (_passwordController.text.isEmpty) {
          throw Exception('Password is required for new users');
        }
        await UserService.createUser(userData);
      }

      if (mounted) {
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving user: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSaving = false);
      }
    }
  }

  final _roles = [
    'Admin',
    'Staff',
    'Faculty',
    'Accountant',
    'Librarian',
    'HOD',
    'Principal',
  ];
  final _depts = [
    'Academic',
    'Administration',
    'Finance',
    'Library',
    'HR',
    'IT Support',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F6F6),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isMobile = constraints.maxWidth < 900;
          return Row(
            children: [
              // ──── LEFT GRADIENT PANEL (Hidden on mobile) ────
              if (!isMobile)
                Expanded(
                  flex: 4,
                  child: Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Color(0xFF880E4F),
                          Color(0xFFEC1349),
                          Color(0xFFFF4081),
                        ],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: Stack(
                      children: [
                        // Decorative circles
                        Positioned(
                          top: -80,
                          right: -80,
                          child: Container(
                            width: 300,
                            height: 300,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withValues(alpha: 0.05),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: -100,
                          left: -60,
                          child: Container(
                            width: 350,
                            height: 350,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: Colors.white.withValues(alpha: 0.05),
                            ),
                          ),
                        ),

                        // Content
                        Padding(
                          padding: const EdgeInsets.all(48),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Back Button
                              InkWell(
                                onTap: () => Navigator.pop(context),
                                borderRadius: BorderRadius.circular(12),
                                child: Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withValues(alpha: 0.15),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(
                                    Icons.arrow_back_ios_new_rounded,
                                    color: Colors.white,
                                    size: 18,
                                  ),
                                ),
                              ).animate().fadeIn().slideX(begin: -0.2),

                              const Spacer(),

                              // Avatar upload area
                              Center(
                                child: Column(
                                  children: [
                                      InkWell(
                                        onTap: _pickImage,
                                        borderRadius: BorderRadius.circular(60),
                                        child: Stack(
                                          children: [
                                            Container(
                                              width: 120,
                                              height: 120,
                                              decoration: BoxDecoration(
                                                shape: BoxShape.circle,
                                                color: Colors.white.withValues(
                                                  alpha: 0.15,
                                                ),
                                                image: _selectedImageBytes != null
                                                    ? DecorationImage(
                                                        image: MemoryImage(_selectedImageBytes!),
                                                        fit: BoxFit.cover,
                                                      )
                                                    : _profilePhotoUrl != null
                                                        ? DecorationImage(
                                                            image: NetworkImage(_profilePhotoUrl!),
                                                            fit: BoxFit.cover,
                                                          )
                                                        : null,
                                                border: Border.all(
                                                  color: Colors.white.withValues(
                                                    alpha: 0.4,
                                                  ),
                                                  width: 3,
                                                ),
                                              ),
                                              child: _selectedImageBytes == null && _profilePhotoUrl == null
                                                  ? const Icon(
                                                      Icons.person,
                                                      color: Colors.white,
                                                      size: 60,
                                                    )
                                                  : null,
                                            ),
                                            Positioned(
                                              bottom: 0,
                                              right: 0,
                                              child: Container(
                                                padding: const EdgeInsets.all(8),
                                                decoration: const BoxDecoration(
                                                  color: Colors.white,
                                                  shape: BoxShape.circle,
                                                ),
                                                child: Icon(
                                                  Icons.camera_alt,
                                                  color: AppColors.primaryRed,
                                                  size: 18,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ).animate().scale(
                                            curve: Curves.easeOutBack,
                                            duration: 600.ms,
                                          ),
                                    const SizedBox(height: 16),
                                    const Text(
                                      "Upload Profile Photo",
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      "PNG, JPG up to 5MB",
                                      style: TextStyle(
                                        color:
                                            Colors.white.withValues(alpha: 0.7),
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                              ).animate().fadeIn(delay: 200.ms),

                              const Spacer(),

                              // Info cards
                              ...[
                                _infoTile(
                                  Icons.verified_user_rounded,
                                  "Secure Account Creation",
                                ),
                                const SizedBox(height: 16),
                                _infoTile(
                                  Icons.lock_reset_rounded,
                                  "Auto-generated password link",
                                ),
                                const SizedBox(height: 16),
                                _infoTile(
                                  Icons.mail_lock_rounded,
                                  "Credentials sent to email",
                                ),
                              ]
                                  .animate(interval: 100.ms)
                                  .fadeIn()
                                  .slideX(begin: 0.2),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

              // ──── RIGHT FORM PANEL ────
              Expanded(
                flex: 6,
                child: SingleChildScrollView(
                  padding: EdgeInsets.symmetric(
                    horizontal: isMobile ? 24 : 64,
                    vertical: isMobile ? 32 : 48,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header
                      if (isMobile)
                        Padding(
                          padding: const EdgeInsets.only(bottom: 24),
                          child: InkWell(
                            onTap: () => Navigator.pop(context),
                            child: const Row(
                              children: [
                                Icon(Icons.arrow_back_rounded, size: 20),
                                SizedBox(width: 8),
                                Text(
                                  "Back to Users",
                                  style: TextStyle(fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                        ),
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 14,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primaryRed.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(100),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  Icons.person_add_rounded,
                                  color: AppColors.primaryRed,
                                  size: 14,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  "NEW USER",
                                  style: TextStyle(
                                    color: AppColors.primaryRed,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 11,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ).animate().fadeIn().slideX(begin: -0.2),

                      const SizedBox(height: 16),

                      Text(
                        "Create Account",
                        style: AppTheme.titleStyle.copyWith(
                          fontSize: isMobile ? 32 : 40,
                          letterSpacing: -1.5,
                        ),
                      ).animate().fadeIn(delay: 100.ms).slideX(begin: -0.2),

                      Text(
                        "Fill in the details to set up a new portal account.",
                        style:
                            TextStyle(color: Colors.grey.shade500, fontSize: 16),
                      ).animate().fadeIn(delay: 200.ms),

                      const SizedBox(height: 48),

                      // ── SECTION: Personal Info ──
                      _sectionTitle("Personal Information"),
                      const SizedBox(height: 20),
                      _responsiveRow(isMobile, [
                        _field(
                          "First Name",
                          Icons.person_outline_rounded,
                          controller: _firstNameController,
                          delay: 0,
                        ),
                        _field(
                          "Last Name",
                          Icons.person_outline_rounded,
                          controller: _lastNameController,
                          delay: 50,
                        ),
                      ]),
                      const SizedBox(height: 20),
                      _responsiveRow(isMobile, [
                        _field(
                          "Date of Birth",
                          Icons.cake_rounded,
                          controller: _dobController,
                          delay: 100,
                          hint: "DD / MM / YYYY",
                        ),
                        _field(
                          "Phone Number",
                          Icons.phone_android_rounded,
                          controller: _phoneController,
                          delay: 150,
                          hint: "+91 9999 999 999",
                        ),
                      ]),
                      const SizedBox(height: 20),
                      _field(
                        "Full Address",
                        Icons.location_on_rounded,
                        controller: _addressController,
                        delay: 200,
                        hint: "Street, City, State, PIN",
                      ),

                      const SizedBox(height: 40),

                      // ── SECTION: Account Credentials ──
                      _sectionTitle("Account Credentials"),
                      const SizedBox(height: 20),
                      _field(
                        "Email Address",
                        Icons.alternate_email_rounded,
                        controller: _emailController,
                        delay: 250,
                        hint: "user@mayainstitute.edu",
                      ),
                      const SizedBox(height: 20),
                      _responsiveRow(isMobile, [
                        _field(
                          "Password",
                          Icons.lock_outline_rounded,
                          controller: _passwordController,
                          delay: 300,
                          isObscure: true,
                        ),
                        _field(
                          "Confirm Password",
                          Icons.lock_outline_rounded,
                          controller: _confirmPasswordController,
                          delay: 350,
                          isObscure: true,
                        ),
                      ]),

                      const SizedBox(height: 40),

                      // ── SECTION: Role & Access ──
                      _sectionTitle("Role & Access"),
                      const SizedBox(height: 20),
                      _responsiveRow(isMobile, [
                        _dropdownField(
                          "Role",
                          Icons.shield_rounded,
                          _roles,
                          _selectedRole,
                          (v) => setState(() => _selectedRole = v!),
                          delay: 400,
                        ),
                        _dropdownField(
                          "Department",
                          Icons.corporate_fare_rounded,
                          _depts,
                          _selectedDept,
                          (v) => setState(() => _selectedDept = v!),
                          delay: 450,
                        ),
                      ]),
                      const SizedBox(height: 20),
                      _field(
                        "Employee ID / Staff Code",
                        Icons.badge_rounded,
                        controller: _employeeIdController,
                        delay: 500,
                        hint: "EMP-001",
                      ),

                      const SizedBox(height: 32),

                      // Status Toggle
                      _buildStatusToggle().animate().fadeIn(delay: 550.ms),

                      const SizedBox(height: 48),

                      // ── ACTION BUTTONS ──
                      _responsiveRow(isMobile, [
                        OutlinedButton(
                          onPressed: () => Navigator.pop(context),
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(
                              color: Colors.grey.shade300,
                              width: 2,
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 20),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                          ),
                          child: const Text(
                            "Cancel",
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                              color: Colors.black54,
                            ),
                          ),
                        ),
                        Container(
                          height: 64,
                          decoration: BoxDecoration(
                            gradient: AppColors.primaryGradient,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primaryRed.withValues(
                                  alpha: 0.4,
                                ),
                                blurRadius: 25,
                                offset: const Offset(0, 10),
                              ),
                            ],
                          ),
                          child: ElevatedButton.icon(
                            onPressed: _isSaving ? null : _saveUser,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.transparent,
                              shadowColor: Colors.transparent,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            icon: _isSaving
                                ? const SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: CircularProgressIndicator(
                                      color: Colors.white,
                                      strokeWidth: 2,
                                    ),
                                  )
                                : Icon(
                                    widget.user != null ? Icons.save_rounded : Icons.person_add_rounded,
                                    color: Colors.white,
                                  ),
                            label: Text(
                              _isSaving
                                  ? (widget.user != null ? "Updating..." : "Creating Account...")
                                  : (widget.user != null ? "Update Details" : "Create Account"),
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ),
                        ),
                      ], flex: [1, 2]),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _responsiveRow(bool isMobile, List<Widget> children,
      {List<int>? flex}) {
    if (isMobile) {
      return Column(
        children: children
            .map((c) => Padding(
                  padding: const EdgeInsets.only(bottom: 20),
                  child: c,
                ))
            .toList(),
      );
    }
    return Row(
      children: List.generate(children.length, (i) {
        return Expanded(
          flex: flex != null ? flex[i] : 1,
          child: Padding(
            padding: EdgeInsets.only(right: i < children.length - 1 ? 20 : 0),
            child: children[i],
          ),
        );
      }),
    );
  }

  Widget _infoTile(IconData icon, String text) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.15),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: Colors.white, size: 18),
        ),
        const SizedBox(width: 14),
        Text(
          text,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _sectionTitle(String title) {
    return Row(
      children: [
        Container(
          width: 4,
          height: 20,
          decoration: BoxDecoration(
            gradient: AppColors.primaryGradient,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w900,
            letterSpacing: 0.5,
          ),
        ),
      ],
    );
  }

  Widget _field(
    String label,
    IconData icon, {
    TextEditingController? controller,
    int delay = 0,
    String? hint,
    bool isObscure = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Colors.black54,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: TextField(
            controller: controller,
            obscureText: isObscure,
            decoration: InputDecoration(
              hintText: hint ?? "Enter $label",
              hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
              prefixIcon: Icon(icon, color: AppColors.primaryRed, size: 20),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: Colors.grey.shade100, width: 1.5),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: Colors.grey.shade100, width: 1.5),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide(color: AppColors.primaryRed, width: 2),
              ),
              contentPadding: const EdgeInsets.symmetric(
                horizontal: 20,
                vertical: 18,
              ),
            ),
          ),
        ),
      ],
    ).animate(delay: delay.ms).fadeIn().slideY(begin: 0.1);
  }

  Widget _dropdownField(
    String label,
    IconData icon,
    List<String> items,
    String value,
    Function(String?) onChange, {
    int delay = 0,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: Colors.black54,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
            border: Border.all(color: Colors.grey.shade100, width: 1.5),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Icon(icon, color: AppColors.primaryRed, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: value,
                    isExpanded: true,
                    style: const TextStyle(color: Colors.black87, fontSize: 14),
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
    ).animate(delay: delay.ms).fadeIn().slideY(begin: 0.1);
  }

  Widget _buildStatusToggle() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _isActive
              ? AppColors.primaryRed.withValues(alpha: 0.2)
              : Colors.grey.shade200,
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (_isActive ? Colors.green : Colors.red).withValues(
                    alpha: 0.1,
                  ),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  _isActive ? Icons.verified_rounded : Icons.cancel_rounded,
                  color: _isActive ? Colors.green : Colors.red,
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Account Status",
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  Text(
                    _isActive
                        ? "Active — user can login immediately"
                        : "Inactive — access disabled",
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                  ),
                ],
              ),
            ],
          ),
          Switch(
            value: _isActive,
            onChanged: (v) => setState(() => _isActive = v),
            activeThumbColor: AppColors.primaryRed,
          ),
        ],
      ),
    );
  }
}
