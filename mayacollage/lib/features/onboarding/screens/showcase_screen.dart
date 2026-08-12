import 'package:flutter/material.dart';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'role_selection_screen.dart';
import 'dart:math' as math;

class ShowcaseScreen extends StatelessWidget {
  const ShowcaseScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isDesktop = size.width > 900;

    return Scaffold(
      body: Container(
        height: size.height,
        width: size.width,
        decoration: BoxDecoration(
          color: Colors.white,
          image: DecorationImage(
            image: const AssetImage('assets/images/logo.png'),
            opacity: 0.02,
            repeat: ImageRepeat.repeat,
            scale: 5,
          ),
        ),
        child: Row(
          children: [
            // LEFT PANEL: ANIMATED BRAND HUB
            if (isDesktop)
              Expanded(
                flex: 6,
                child: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.primaryRed, AppColors.primaryPink],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
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
                                border: Border.all(color: Colors.white.withValues(alpha: 0.2), width: 2),
                              ),
                              child: const Icon(Icons.school_rounded, size: 100, color: Colors.white),
                            ).animate().scale(duration: 1200.ms, curve: Curves.elasticOut).shimmer(delay: 2.seconds, duration: 2.seconds),
                            const SizedBox(height: 32),
                            Text(
                              "MAYA INSTITUTE",
                              style: AppTheme.titleStyle.copyWith(color: Colors.white, fontSize: 56, letterSpacing: 8, fontWeight: FontWeight.w900),
                            ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.3, curve: Curves.easeOutBack),
                            const SizedBox(height: 12),
                            Container(
                              height: 4,
                              width: 80,
                              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(10)),
                            ).animate().scaleX(delay: 800.ms),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),

            // RIGHT PANEL: AUTH & INFO
            Expanded(
              flex: isDesktop ? 4 : 10,
              child: Container(
                padding: EdgeInsets.symmetric(horizontal: isDesktop ? 60 : 24),
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: isDesktop
                        ? CrossAxisAlignment.start
                        : CrossAxisAlignment.center,
                    children: [
                      if (!isDesktop) ...[
                        const SizedBox(height: 60),
                        Center(
                          child: Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: AppColors.primaryRed.withValues(alpha: 0.1),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.school_rounded,
                              size: 60,
                              color: AppColors.primaryRed,
                            ),
                          ).animate().scale(curve: Curves.easeOutBack),
                        ),
                        const SizedBox(height: 32),
                      ],
                      
                      // LOGO BOX
                      Center(
                        child: Container(
                          padding: EdgeInsets.symmetric(
                            horizontal: isDesktop ? 24 : 16,
                            vertical: 12,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(100),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primaryRed.withValues(alpha: 0.05),
                                blurRadius: 40,
                                offset: const Offset(0, 20),
                              ),
                            ],
                            border: Border.all(
                              color: AppColors.backgroundBlush,
                              width: 1.5,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Image.asset(
                                'assets/images/logo.png',
                                height: 24,
                                fit: BoxFit.contain,
                              ),
                              const SizedBox(width: 8),
                              const Text(
                                "MAYA ERP",
                                style: TextStyle(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 14,
                                  letterSpacing: 1.5,
                                  color: Color(0xFF1E293B),
                                ),
                              ),
                            ],
                          ),
                        ).animate().fadeIn().scale(curve: Curves.easeOutBack),
                      ),

                      const SizedBox(height: 40),

                      Text(
                        "Welcome to\nthe Future of Academia",
                        style: AppTheme.titleStyle.copyWith(
                          fontSize: isDesktop ? 38 : 28,
                          height: 1.1,
                          letterSpacing: -1,
                        ),
                        textAlign: isDesktop
                            ? TextAlign.start
                            : TextAlign.center,
                      ).animate().fadeIn(delay: 200.ms).slideX(begin: -0.2),

                      const SizedBox(height: 16),

                      Text(
                        "Experience the most advanced, secure, and unified ERP platform designed for Maya Institutes.",
                        style: AppTheme.bodyStyle.copyWith(
                          fontSize: isDesktop ? 18 : 14,
                        ),
                        textAlign: isDesktop
                            ? TextAlign.start
                            : TextAlign.center,
                      ).animate().fadeIn(delay: 400.ms).slideX(begin: -0.1),

                      const SizedBox(height: 32),

                      // Feature Cards
                      _buildFeatureHighlights(isDesktop),

                      const SizedBox(height: 40),

                      // PRIMARY CTA
                      SizedBox(
                            width: double.infinity,
                            height: 60,
                            child: Container(
                              decoration: BoxDecoration(
                                gradient: AppColors.primaryGradient,
                                borderRadius: BorderRadius.circular(16),
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
                                onPressed: () {
                                  Navigator.push(
                                    context,
                                    PageRouteBuilder(
                                      pageBuilder:
                                          (
                                            context,
                                            animation,
                                            secondaryAnimation,
                                          ) => const RoleSelectionScreen(),
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
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Text(
                                      "Get Started",
                                      style: TextStyle(
                                        color: Colors.white,
                                        fontSize: isDesktop ? 20 : 16,
                                        fontWeight: FontWeight.bold,
                                        letterSpacing: 1.5,
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    const Icon(
                                      Icons.arrow_forward_rounded,
                                      color: Colors.white,
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          )
                          .animate()
                          .fadeIn(delay: 800.ms)
                          .scale(delay: 800.ms)
                          .shimmer(
                            delay: 3.seconds,
                            duration: 2.seconds,
                            color: Colors.white24,
                          ),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFeatureHighlights(bool isDesktop) {
    if (!isDesktop) {
      return Column(
        children: [
          _miniFeature(Icons.security_rounded, "Secure SSO"),
          const SizedBox(height: 12),
          _miniFeature(Icons.auto_graph_rounded, "Live Insights"),
          const SizedBox(height: 12),
          _miniFeature(Icons.bolt_rounded, "Fast Execution"),
          const SizedBox(height: 12),
          _miniFeature(Icons.workspace_premium_rounded, "Best UX"),
        ],
      ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.2);
    }
    return Column(
      children: [
        Row(
          children: [
            Expanded(child: _miniFeature(Icons.security_rounded, "Secure SSO")),
            const SizedBox(width: 20),
            Expanded(
              child: _miniFeature(Icons.auto_graph_rounded, "Live Insights"),
            ),
          ],
        ),
        const SizedBox(height: 20),
        Row(
          children: [
            Expanded(child: _miniFeature(Icons.bolt_rounded, "Fast Execution")),
            const SizedBox(width: 20),
            Expanded(
              child: _miniFeature(Icons.workspace_premium_rounded, "Best UX"),
            ),
          ],
        ),
      ],
    ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.2);
  }

  Widget _miniFeature(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.primaryRed.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.primaryRed, size: 18),
          ),
          const SizedBox(width: 16),
          Text(
            label,
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 14,
              color: Color(0xFF1E293B),
            ),
          ),
        ],
      ),
    );
  }
}

class _PremiumBackgroundWaves extends StatelessWidget {
  const _PremiumBackgroundWaves();

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: List.generate(10, (index) {
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
                colors: [
                  Colors.white.withValues(alpha: 0.15),
                  Colors.white.withValues(alpha: 0),
                ],
              ),
            ),
          ).animate(onPlay: (c) => c.repeat(reverse: true))
           .move(
             begin: Offset.zero,
             end: Offset(random.nextDouble() * 50 - 25, random.nextDouble() * 50 - 25),
             duration: (4 + random.nextInt(4)).seconds,
           )
           .scale(
             begin: const Offset(1, 1),
             end: const Offset(1.2, 1.2),
             duration: (3 + random.nextInt(3)).seconds,
           ),
        );
      }),
    );
  }
}
