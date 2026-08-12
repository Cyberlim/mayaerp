import 'package:flutter/material.dart';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'login_role_screen.dart';

class RoleSelectionScreen extends StatefulWidget {
  const RoleSelectionScreen({super.key});

  @override
  State<RoleSelectionScreen> createState() => _RoleSelectionScreenState();
}

class _RoleSelectionScreenState extends State<RoleSelectionScreen> {
  String? _selectedRole;

  final List<Map<String, dynamic>> _roles = [
    {
      "title": "Admin",
      "icon": Icons.admin_panel_settings_rounded,
      "color": Colors.indigo,
    },
    {
      "title": "Office",
      "icon": Icons.business_center_rounded,
      "color": Colors.blue,
    },
    {"title": "Staff", "icon": Icons.people_alt_rounded, "color": Colors.teal},
    {
      "title": "Library",
      "icon": Icons.local_library_rounded,
      "color": Colors.amber,
    },
    {
      "title": "Lab",
      "icon": Icons.biotech_rounded,
      "color": Colors.deepPurple,
    },
  ];

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width > 900;

    return Scaffold(
      body: Container(
        height: size.height,
        width: size.width,
        decoration: BoxDecoration(
          color: AppColors.backgroundBlush,
          image: DecorationImage(
            image: const AssetImage('assets/images/logo.png'),
            opacity: 0.015,
            repeat: ImageRepeat.repeat,
            scale: 8,
          ),
        ),
        child: Row(
          children: [
            // LEFT BRAND PANEL
            if (isDesktop)
              Expanded(
                flex: 5,
                child: Container(
                  decoration: const BoxDecoration(
                    gradient: AppColors.primaryGradient,
                  ),
                  child: Stack(
                    children: [
                      Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(32),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.1),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.verified_user_rounded,
                                size: 140,
                                color: Colors.white,
                              ),
                            ).animate().scale(
                              duration: 800.ms,
                              curve: Curves.easeOutBack,
                            ),
                            const SizedBox(height: 32),
                            Text(
                                  "Identity Gateway",
                                  style: AppTheme.titleStyle.copyWith(
                                    color: Colors.white,
                                    fontSize: 42,
                                    fontWeight: FontWeight.w900,
                                  ),
                                )
                                .animate()
                                .fadeIn(delay: 400.ms)
                                .slideY(begin: 0.2),
                            const SizedBox(height: 12),
                            Text(
                              "Secure Role-Based Access Control",
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

            // RIGHT CONTENT PANEL
            Expanded(
              flex: isDesktop ? 6 : 10,
              child: Container(
                padding: EdgeInsets.symmetric(
                  horizontal: isDesktop ? 80 : 24,
                  vertical: isDesktop ? 40 : 20,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (!isDesktop) const SizedBox(height: 20),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.arrow_back_ios_new_rounded),
                      padding: EdgeInsets.zero,
                    ).animate().fadeIn().slideX(begin: 0.5),

                    const SizedBox(height: 20),

                    Text(
                      "Who are you?",
                      style: AppTheme.titleStyle.copyWith(
                        fontSize: isDesktop ? 42 : 32,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -1.5,
                      ),
                    ).animate().fadeIn(delay: 200.ms).slideX(begin: -0.2),

                    const SizedBox(height: 8),

                    Text(
                      "Select your designated department to proceed.",
                      style: AppTheme.bodyStyle.copyWith(
                        fontSize: isDesktop ? 16 : 14,
                      ),
                    ).animate().fadeIn(delay: 300.ms),

                    const SizedBox(height: 32),

                    // ROLE GRID - Custom built to be scrollable on mobile
                    Expanded(
                      child: GridView.builder(
                        physics: const BouncingScrollPhysics(),
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: isDesktop ? 4 : 2,
                          childAspectRatio: isDesktop ? 1.0 : 1.25,
                          mainAxisSpacing: 12,
                          crossAxisSpacing: 12,
                        ),
                        itemCount: _roles.length,
                        itemBuilder: (context, index) {
                          final role = _roles[index];
                          final isSelected = _selectedRole == role['title'];
                          return _buildPremiumRoleCard(role, isSelected, index);
                        },
                      ),
                    ),

                    const SizedBox(height: 24),

                    // ACTION BUTTON
                    AnimatedSize(
                      duration: 300.ms,
                      child: _selectedRole == null
                          ? SizedBox(
                              height: isDesktop ? 80 : 60,
                              width: double.infinity,
                            )
                          : Container(
                              height: isDesktop ? 80 : 60,
                              width: double.infinity,
                              decoration: BoxDecoration(
                                gradient: AppColors.primaryGradient,
                                borderRadius: BorderRadius.circular(20),
                                boxShadow: [
                                  BoxShadow(
                                    color: AppColors.primaryPink.withValues(
                                      alpha: 0.4,
                                    ),
                                    blurRadius: 30,
                                    offset: const Offset(0, 15),
                                  ),
                                ],
                              ),
                              child: ElevatedButton(
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    PageRouteBuilder(
                                      pageBuilder:
                                          (
                                            context,
                                            animation,
                                            secondaryAnimation,
                                          ) => LoginRoleScreen(
                                            role: _selectedRole!,
                                          ),
                                      transitionsBuilder:
                                          (
                                            context,
                                            animation,
                                            secondaryAnimation,
                                            child,
                                          ) {
                                            return FadeTransition(
                                              opacity: animation,
                                              child: child,
                                            );
                                          },
                                    ),
                                  );
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.transparent,
                                  shadowColor: Colors.transparent,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(20),
                                  ),
                                ),
                                child: Text(
                                  "Enter as $_selectedRole",
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: isDesktop ? 18 : 16,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ).animate().fadeIn().scale(
                              curve: Curves.easeOutBack,
                            ),
                    ),
                    if (!isDesktop) const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPremiumRoleCard(
    Map<String, dynamic> role,
    bool isSelected,
    int index,
  ) {
    return GestureDetector(
      onTap: () => setState(() => _selectedRole = role['title']),
      child: AnimatedContainer(
        duration: 300.ms,
        curve: Curves.easeInOut,
        decoration: BoxDecoration(
          color: isSelected
              ? Colors.white
              : Colors.white.withValues(alpha: 0.6),
          borderRadius: BorderRadius.circular(28),
          border: Border.all(
            color: isSelected ? AppColors.primaryRed : Colors.transparent,
            width: 2.5,
          ),
          boxShadow: [
            if (isSelected)
              BoxShadow(
                color: AppColors.primaryRed.withValues(alpha: 0.15),
                blurRadius: 30,
                offset: const Offset(0, 15),
              )
            else
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 15,
                offset: const Offset(0, 8),
              ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: (role['color'] as Color).withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    role['icon'],
                    color: isSelected ? AppColors.primaryRed : role['color'],
                    size: 32,
                  ),
                )
                .animate(target: isSelected ? 1 : 0)
                .scale(duration: 400.ms, curve: Curves.elasticOut),
            const SizedBox(height: 12),
            Text(
              role['title'],
              style: TextStyle(
                fontSize: 15,
                fontWeight: isSelected ? FontWeight.w900 : FontWeight.bold,
                color: isSelected ? AppColors.primaryRed : AppColors.textMain,
                letterSpacing: -0.2,
              ),
            ),
          ],
        ),
      ).animate(delay: (400 + (index * 50)).ms).fadeIn().slideY(begin: 0.1),
    );
  }
}
