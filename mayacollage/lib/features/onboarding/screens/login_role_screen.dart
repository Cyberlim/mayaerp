import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../admin/screens/admin_shell.dart';
import '../../library/screens/library_shell.dart';
import '../../staff/screens/staff_shell.dart';
import '../../lab/screens/lab_shell.dart';
import '../../office/screens/office_shell.dart';
import '../../../core/services/auth_service.dart';

class LoginRoleScreen extends StatefulWidget {
  final String role;
  const LoginRoleScreen({super.key, required this.role});

  @override
  State<LoginRoleScreen> createState() => _LoginRoleScreenState();
}

class _LoginRoleScreenState extends State<LoginRoleScreen> {
  bool _isLoading = false;
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all fields')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final userData = await AuthService.login(
        _emailController.text.trim(),
        _passwordController.text.trim(),
        widget.role,
      );

      if (!mounted) return;

      if (userData != null) {
        Navigator.pushReplacement(
          context,
          PageRouteBuilder(
            pageBuilder: (context, anim1, anim2) {
              if (widget.role == 'Library') {
                return const LibraryShell();
              } else if (widget.role == 'Staff') {
                return const StaffShell();
              } else if (widget.role == 'Office') {
                 return const OfficeShell();
              } else if (widget.role == 'Lab') {
                 return const LabShell();
              }
              return const AdminShell();
            },
            transitionsBuilder: (context, anim1, anim2, child) =>
                FadeTransition(opacity: anim1, child: child),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width > 900;

    return Scaffold(
      backgroundColor: AppColors.backgroundBlush,
      body: Row(
        children: [
          if (isDesktop)
            Expanded(
              flex: 6,
              child: Container(
                decoration: const BoxDecoration(
                  gradient: AppColors.primaryGradient,
                ),
                child: Stack(
                  children: [
                    const Positioned.fill(child: _PremiumBackgroundWaves()),
                    Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                                padding: const EdgeInsets.all(40),
                                decoration: BoxDecoration(
                                  color: Colors.white.withValues(alpha: 0.1),
                                  shape: BoxShape.circle,
                                  border: Border.all(color: Colors.white.withValues(alpha: 0.15), width: 2),
                                ),
                                child: const Icon(
                                  Icons.security_rounded,
                                  size: 100,
                                  color: Colors.white,
                                ),
                              )
                              .animate()
                              .scale(curve: Curves.easeOutBack)
                              .shimmer(delay: 1.seconds),
                          const SizedBox(height: 32),
                          Text(
                            "Access Portal",
                            style: AppTheme.titleStyle.copyWith(
                              color: Colors.white,
                              fontSize: 42,
                              fontWeight: FontWeight.w900,
                            ),
                          ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.2),
                          Text(
                            "Secure Verification System",
                            style: AppTheme.bodyStyle.copyWith(
                              color: Colors.white70,
                            ),
                          ).animate().fadeIn(delay: 600.ms),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

          Expanded(
            flex: isDesktop ? 4 : 10,
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: isDesktop ? 48 : 24, vertical: 32),
              decoration: isDesktop ? null : BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(32),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 40, offset: const Offset(0, 10))
                ],
              ),
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 40),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back_ios_new_rounded),
                      padding: EdgeInsets.zero,
                    ).animate().fadeIn().slideX(begin: 0.5),

                    const SizedBox(height: 32),

                    // ROLE BADGE
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 8,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.primaryRed.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.shield_rounded,
                            size: 14,
                            color: AppColors.primaryRed,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            widget.role.toUpperCase(),
                            style: const TextStyle(
                              color: AppColors.primaryRed,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.5,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ).animate().fadeIn().slideX(begin: -0.2),

                    const SizedBox(height: 16),

                    Text(
                      "Sign In",
                      style: AppTheme.titleStyle.copyWith(
                        fontSize: isDesktop ? 48 : 32,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -1.5,
                      ),
                    ).animate().fadeIn(delay: 200.ms).slideX(begin: -0.2),

                    const SizedBox(height: 40),

                    // FORM SECTION
                    Column(
                      children: [
                          _buildPremiumTextField(
                            "Email / Username",
                            Icons.alternate_email_rounded,
                            0,
                            controller: _emailController,
                          ),
                          const SizedBox(height: 20),
                          _buildPremiumTextField(
                            "Password",
                            Icons.lock_outline_rounded,
                            1,
                            isObscure: true,
                            controller: _passwordController,
                          ),
                      ],
                    ),

                    const SizedBox(height: 16),

                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Checkbox(
                              value: true,
                              onChanged: (v) {},
                              activeColor: AppColors.primaryRed,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                            Text(
                              "Remember me",
                              style: TextStyle(
                                fontSize: isDesktop ? 13 : 11,
                                color: AppColors.textSecondary,
                              ),
                            ),
                          ],
                        ),
                        TextButton(
                          onPressed: () {},
                          child: Text(
                            "Forgot Password?",
                            style: TextStyle(
                              color: AppColors.primaryRed,
                              fontWeight: FontWeight.bold,
                              fontSize: isDesktop ? 14 : 11,
                            ),
                          ),
                        ),
                      ],
                    ).animate().fadeIn(delay: 600.ms),

                    const SizedBox(height: 40),

                    // LOGIN BUTTON
                    SizedBox(
                          width: double.infinity,
                          height: 60,
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: AppColors.primaryGradient,
                              borderRadius: BorderRadius.circular(20),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.primaryPink.withValues(
                                    alpha: 0.4,
                                  ),
                                  blurRadius: 25,
                                  offset: const Offset(0, 10),
                                ),
                              ],
                            ),
                            child: ElevatedButton(
                              onPressed: _isLoading ? null : _handleLogin,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.transparent,
                                shadowColor: Colors.transparent,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(20),
                                ),
                              ),
                              child: _isLoading
                                  ? const SizedBox(
                                      width: 25,
                                      height: 25,
                                      child: CircularProgressIndicator(
                                        color: Colors.white,
                                        strokeWidth: 2,
                                      ),
                                    )
                                  : Text(
                                      "Authenticate",
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: isDesktop ? 18 : 16,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1.2,
                                      ),
                                    ),
                            ),
                          ),
                        )
                        .animate()
                        .fadeIn(delay: 800.ms)
                        .scale(curve: Curves.easeOutBack),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPremiumTextField(
    String label,
    IconData icon,
    int index, {
    bool isObscure = false,
    TextEditingController? controller,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: TextField(
        controller: controller,
        obscureText: isObscure,
        decoration: InputDecoration(
          labelText: label,
          labelStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
          prefixIcon: Icon(icon, color: AppColors.primaryRed, size: 20),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(20),
            borderSide: BorderSide(color: Colors.grey.shade100, width: 2),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(20),
            borderSide: BorderSide(color: Colors.grey.shade100, width: 2),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(20),
            borderSide: const BorderSide(color: AppColors.primaryRed, width: 2),
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 24,
            vertical: 20,
          ),
        ),
      ),
    ).animate(delay: (400 + (index * 100)).ms).fadeIn().slideY(begin: 0.1);
  }
}

class _PremiumBackgroundWaves extends StatelessWidget {
  const _PremiumBackgroundWaves();
  @override
  Widget build(BuildContext context) {
    return Stack(
      children: List.generate(8, (index) {
        final random = math.Random(index);
        final size = 150.0 + random.nextDouble() * 200;
        return Positioned(
          left: random.nextDouble() * 1000 - 100,
          top: random.nextDouble() * 1000 - 100,
          child: Container(
            width: size,
            height: size,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: RadialGradient(
                colors: [Colors.white.withValues(alpha: 0.12), Colors.white.withValues(alpha: 0)],
              ),
            ),
          ).animate(onPlay: (c) => c.repeat(reverse: true))
           .move(begin: Offset.zero, end: Offset(random.nextDouble() * 40 - 20, random.nextDouble() * 40 - 20), duration: (4 + random.nextInt(4)).seconds)
           .scale(begin: const Offset(1, 1), end: const Offset(1.15, 1.15), duration: (3 + random.nextInt(3)).seconds),
        );
      }),
    );
  }
}
