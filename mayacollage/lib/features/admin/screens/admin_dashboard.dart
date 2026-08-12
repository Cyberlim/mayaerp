import 'package:flutter/material.dart';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../admin/widgets/premium_stats_card.dart';
import '../../../widgets/bubble_animation.dart';
import '../../../core/services/dashboard_service.dart';

// --- Reusable Hover Widget for Interactive Elements ---
class HoverScaleCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double scale;
  final EdgeInsetsGeometry? padding;

  const HoverScaleCard({
    super.key,
    required this.child,
    this.onTap,
    this.scale = 1.03,
    this.padding,
  });

  @override
  State<HoverScaleCard> createState() => _HoverScaleCardState();
}

class _HoverScaleCardState extends State<HoverScaleCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      cursor: widget.onTap != null
          ? SystemMouseCursors.click
          : SystemMouseCursors.basic,
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedScale(
          scale: _isHovered ? widget.scale : 1.0,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOutCubic,
          child: Padding(
            padding: widget.padding ?? EdgeInsets.zero,
            child: widget.child,
          ),
        ),
      ),
    );
  }
}

// --- Main Dashboard Screen ---
class AdminDashboard extends StatefulWidget {
  const AdminDashboard({super.key});

  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard> {
  bool _showAllActions = false;
  Map<String, dynamic> _dashboardStats = {};
  bool _isLoadingStats = true;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    try {
      final stats = await DashboardService.getStats();
      if (mounted) {
        setState(() {
          _dashboardStats = stats['kpis'] ?? {};
          _isLoadingStats = false;
        });
      }
    } catch (e) {
      debugPrint("Error fetching dashboard stats: $e");
      if (mounted) {
        setState(() {
          _isLoadingStats = false;
        });
      }
    }
  }

  final List<Map<String, dynamic>> _quickActions = [
    {"icon": Icons.person_add_rounded, "label": "Admission", "color": Color(0xFF6366F1)},
    {"icon": Icons.school_rounded, "label": "Students", "color": Color(0xFF10B981)},
    {"icon": Icons.account_balance_wallet_rounded, "label": "Finance", "color": Color(0xFFF43F5E)},
    {"icon": Icons.calendar_today_rounded, "label": "Exams", "color": Color(0xFF8B5CF6)},
    {"icon": Icons.local_library_rounded, "label": "Library", "color": Color(0xFFF59E0B)},
    {"icon": Icons.record_voice_over_rounded, "label": "Inquiries", "color": Color(0xFF06B6D4)},
    {"icon": Icons.directions_bus_rounded, "label": "Transport", "color": Color(0xFFEC4899)},
    {"icon": Icons.manage_accounts_rounded, "label": "Users", "color": Color(0xFF64748B)},
    {"icon": Icons.bar_chart_rounded, "label": "Reports", "index": 8, "color": Color(0xFF22C55E)},
    {"icon": Icons.settings_rounded, "label": "Settings", "index": 11, "color": Color(0xFF94A3B8)},
  ];

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        double width = constraints.maxWidth;
        bool isMobile = width < 700;
        bool isTablet = width >= 700 && width < 1100;
        bool isDesktop = width >= 1100;
        double sidePadding = isMobile ? 16 : (isTablet ? 24 : 32);

        return Container(
          color: isMobile ? Colors.transparent : const Color(0xFFF8F6F6), // Transparent on mobile for back gradient
          child: Column(
            children: [
              // 1. TOPBAR (Hidden on mobile)
              if (!isMobile) _buildTopbar(),

              // 2. SCROLLABLE CONTENT
              Expanded(
                child: SingleChildScrollView(
                  padding: EdgeInsets.symmetric(
                    horizontal: sidePadding,
                    vertical: isMobile ? 4 : 32, // Even less padding for mobile to tuck under navbar
                  ),
                  child: Center(
                    child: Container(
                      constraints: const BoxConstraints(maxWidth: 1600),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (!isMobile) _buildHeroBanner(width),
                          if (!isMobile) const SizedBox(height: 32),
                          _buildKPIRow(width),
                          const SizedBox(height: 16), // Divider before quick actions

                          // MAIN DASHBOARD GRID (Conditional for Mobile/Tablet)
                          // MAIN DASHBOARD GRID (Dynamic Columns)
                          if (width < 850) ...[
                            // MOBILE VIEW: Single Column Stack
                            _buildMobileQuickActions(width),
                            const SizedBox(height: 32),
                            _buildAttendance(),
                            const SizedBox(height: 24),
                            _buildPerformance(),
                            const SizedBox(height: 24),
                            _buildFinance(),
                            const SizedBox(height: 24),
                            _buildCriticalAlerts(),
                            const SizedBox(height: 24),
                            _buildInstantReports(),
                            const SizedBox(height: 24),
                            _buildRecentActivity(),
                            const SizedBox(height: 24),
                            _buildSystemHealth(),
                          ] else ...[
                            // TABLET/DESKTOP VIEW: 2 Sections Per Row
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(child: _buildAttendance()),
                                const SizedBox(width: 32),
                                Expanded(child: _buildPerformance()),
                              ],
                            ),
                            const SizedBox(height: 32),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(child: _buildFinance()),
                                const SizedBox(width: 32),
                                Expanded(child: _buildQuickActions()),
                              ],
                            ),
                            const SizedBox(height: 32),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(child: _buildCriticalAlerts()),
                                const SizedBox(width: 32),
                                Expanded(child: _buildInstantReports()),
                              ],
                            ),
                            const SizedBox(height: 32),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(child: _buildRecentActivity()),
                                const SizedBox(width: 32),
                                Expanded(child: _buildSystemHealth()),
                              ],
                            ),
                          ],

                          const SizedBox(height: 40),
                          _buildDepartmentsGrid(width),
                          const SizedBox(height: 32),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // --- TOPBAR ---
  Widget _buildTopbar() {
    return Container(
      height: 80,
      padding: const EdgeInsets.symmetric(horizontal: 32),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.8),
        border: Border(
          bottom: BorderSide(color: AppColors.primaryRed.withValues(alpha: 0.1)),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Search
          Expanded(
            child: Container(
              height: 44,
              constraints: const BoxConstraints(maxWidth: 450),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9), // slate-100
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  const SizedBox(width: 12),
                  Icon(Icons.search, color: Colors.grey.shade500),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: TextField(
                      decoration: InputDecoration(
                        border: InputBorder.none,
                        hintText: "Search student records, faculty or fees...",
                        hintStyle: TextStyle(fontSize: 14),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Right Controls
          Row(
            children: [
              // Academic Year
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 8,
                ),
                child: Row(
                  children: [
                    const Icon(Icons.verified, color: Colors.amber, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      "AY 2023-24",
                      style: AppTheme.bodyStyle.copyWith(
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),

              // Notifications
              _topbarIcon(Icons.notifications_outlined, hasBadge: true),
              const SizedBox(width: 12),

              // Settings
              _topbarIcon(Icons.settings_outlined),
              const SizedBox(width: 16),

              // Divider
              Container(width: 1, height: 40, color: Colors.grey.shade300),
              const SizedBox(width: 16),

              // Profile Action
              Row(
                children: [
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        "Admin User",
                        style: AppTheme.bodyStyle.copyWith(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      Text(
                        "Super Administrator",
                        style: TextStyle(
                          fontSize: 10,
                          color: Colors.grey.shade500,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(width: 12),
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.primaryRed.withValues(alpha: 0.2),
                        width: 2,
                      ),
                      image: const DecorationImage(
                        image: NetworkImage("https://i.pravatar.cc/150?img=11"),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _topbarIcon(IconData icon, {bool hasBadge = false}) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Stack(
        alignment: Alignment.center,
        children: [
          Icon(icon, color: Colors.grey.shade700, size: 20),
          if (hasBadge)
            Positioned(
              top: 8,
              right: 8,
              child: Container(
                width: 8,
                height: 8,
                decoration: BoxDecoration(
                  color: AppColors.primaryRed,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 1.5),
                ),
              ),
            ),
        ],
      ),
    );
  }

  // --- HERO BANNER ---
  Widget _buildHeroBanner(double width) {
    bool isMobile = width < 700;
    if (isMobile) return const SizedBox.shrink(); // Hide greeting on mobile
    return HoverScaleCard(
      scale: 1.01,
      child: Container(
        padding: EdgeInsets.all(isMobile ? 24 : 32),
        constraints: BoxConstraints(minHeight: isMobile ? 180 : 220),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(32),
          gradient: const LinearGradient(
            colors: [Color(0xFF880E4F), Color(0xFFEC1349), Color(0xFFFF4081)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFEC1349).withValues(alpha: 0.4),
              blurRadius: 30,
              offset: const Offset(0, 15),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(32),
          child: BubbleAnimation(
            bubbleCount: 8,
            bubbleColor: Colors.white,
            child: Stack(
              children: [
                Positioned(
                  right: -20,
                  bottom: -40,
                  child: Icon(
                    Icons.auto_awesome_rounded,
                    size: width < 700 ? 120 : 200,
                    color: Colors.white.withValues(alpha: 0.15),
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(100),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.verified_user_rounded, color: Colors.amberAccent, size: 14),
                              SizedBox(width: 8),
                              Text(
                                "Super Admin Access",
                                style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ).animate(onPlay: (controller) => controller.repeat())
                         .shimmer(duration: 2500.ms, color: Colors.white30),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(
                      isMobile ? "Welcome back,\nMaster" : "Welcome back, System Master",
                      style: TextStyle(
                        fontSize: isMobile ? 24 : 36,
                        fontWeight: FontWeight.w900,
                        color: Colors.white,
                        letterSpacing: -1,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      "Manage Maya Institute Operations with complete control.",
                      style: TextStyle(
                        fontSize: isMobile ? 13 : 18,
                        fontWeight: FontWeight.w500,
                        color: Colors.white.withValues(alpha: 0.85),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.access_time_filled_rounded, color: Colors.white, size: 16),
                          const SizedBox(width: 12),
                          Text(
                            "System Online: 100%",
                            style: TextStyle(color: Colors.white.withValues(alpha: 0.9), fontSize: 11, fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ],
                ).animate().fadeIn(duration: 800.ms),
              ],
            ),
          ),
        ),
      ),
    ).animate().fadeIn(duration: 500.ms).slideY(begin: -0.1)
     .animate(onPlay: (controller) => controller.repeat(reverse: true))
     .scale(begin: const Offset(1, 1), end: const Offset(1.01, 1.01), duration: 3000.ms, curve: Curves.easeInOut);
  }

  // --- KPI STATS (Carousel across all sizes) ---
  Widget _buildKPIRow(double width) {
    bool isMobile = width < 700;

    final admissions = _dashboardStats['admissions']?.toString() ?? "0";
    final faculty = _dashboardStats['faculty']?.toString() ?? "0";
    final revenue = _dashboardStats['revenue'] != null ? "\$${_dashboardStats['revenue']}" : "\$0";
    final inventory = _dashboardStats['inventory']?.toString() ?? "0";

    final kpiCards = [
      PremiumStatsCard(
        title: "Admissions",
        subValue: "Total Enrolled",
        value: _isLoadingStats ? "..." : admissions,
        percentage: "+12.5%",
        icon: Icons.person_add_rounded,
        gradientColors: const [Color(0xFF6366F1), Color(0xFF4F46E5)],
        chartColor: const Color(0xFF6366F1),
        chartPoints: const [
          Offset(0, 0.4), Offset(1, 0.5), Offset(2, 0.3), Offset(3, 0.6), Offset(4, 0.5), Offset(5, 0.9),
        ],
        selectedTimeline: "All",
        onTimelineChanged: (_) {},
      ),
      PremiumStatsCard(
        title: "Faculty",
        subValue: "Active Members",
        value: _isLoadingStats ? "..." : faculty,
        percentage: "+2.1%",
        icon: Icons.groups_rounded,
        gradientColors: const [Color(0xFF10B981), Color(0xFF059669)],
        chartColor: const Color(0xFF10B981),
        chartPoints: const [
          Offset(0, 0.3), Offset(1, 0.4), Offset(2, 0.45), Offset(3, 0.42), Offset(4, 0.5), Offset(5, 0.55),
        ],
        selectedTimeline: "All",
        onTimelineChanged: (_) {},
      ),
      PremiumStatsCard(
        title: "Revenue",
        subValue: "Fee Collections",
        value: _isLoadingStats ? "..." : revenue,
        percentage: "+8.4%",
        icon: Icons.account_balance_wallet_rounded,
        gradientColors: const [Color(0xFFF43F5E), Color(0xFFE11D48)],
        chartColor: const Color(0xFFF43F5E),
        chartPoints: const [
          Offset(0, 0.2), Offset(1, 0.4), Offset(2, 0.3), Offset(3, 0.5), Offset(4, 0.4), Offset(5, 0.8),
        ],
        selectedTimeline: "All",
        onTimelineChanged: (_) {},
      ),
      PremiumStatsCard(
        title: "Inventory",
        subValue: "Library & Assets",
        value: _isLoadingStats ? "..." : inventory,
        percentage: "Stable",
        icon: Icons.inventory_2_rounded,
        gradientColors: const [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
        chartColor: const Color(0xFF8B5CF6),
        chartPoints: const [
          Offset(0, 0.5), Offset(1, 0.5), Offset(2, 0.55), Offset(3, 0.5), Offset(4, 0.52), Offset(5, 0.5),
        ],
        selectedTimeline: "All",
        onTimelineChanged: (_) {},
      ),
    ];

    double carouselHeight = isMobile ? 260 : 310; // Reduced height for mobile
    double cardWidth = isMobile ? width * 0.88 : 360; // Reduced width for mobile

    return SizedBox(
      height: carouselHeight,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        padding: EdgeInsets.symmetric(horizontal: isMobile ? 0 : 4),
        itemCount: kpiCards.length,
        separatorBuilder: (context, index) => const SizedBox(width: 16),
        itemBuilder: (context, index) => SizedBox(
          width: cardWidth,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(32),
            child: BubbleAnimation(
              bubbleCount: 4,
              bubbleColor: Colors.white70,
              child: kpiCards[index],
            ),
          ),
        ).animate(onPlay: (controller) => controller.repeat(reverse: true))
         .moveY(begin: 0, end: -8, duration: (2000 + (index * 200)).ms, curve: Curves.easeInOut),
      ),
    );
  }

  Widget _buildKPICard(
    String title,
    String value,
    String badge,
    List<Color> gradientColors,
    String imageUrl, {
    bool isStable = false,
    required double width,
  }) {
    bool isMobile = width < 700;
    return HoverScaleCard(
      child: Container(
        height: isMobile ? 160 : (width < 1400 ? 170 : 190),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          gradient: LinearGradient(
            colors: gradientColors,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: gradientColors.last.withValues(alpha: 0.3),
              blurRadius: 15,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Stack(
          children: [
            // Content
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.8),
                      fontSize: (width < 1400 && !isMobile) ? 12 : 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        value,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: (width < 1400 && !isMobile) ? 28 : 36,
                          fontWeight: FontWeight.w900,
                          height: 1.1,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: isStable
                              ? Colors.white.withValues(alpha: 0.2)
                              : Colors.greenAccent.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(100),
                        ),
                        child: Text(
                          badge,
                          style: TextStyle(
                            color: isStable ? Colors.white : Colors.greenAccent,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- ATTENDANCE OVERVIEW ---
  Widget _buildAttendance() {
    final attendanceData = [
      {"title": "Students", "value": "85%", "steps": ["Check-in", "Lectures", "Labs", "Library"], "activeStep": 2, "color": const Color(0xFF6366F1)},
      {"title": "Faculty", "value": "94%", "steps": ["Presence", "Classes", "Feedback", "Exit"], "activeStep": 3, "color": const Color(0xFF10B981)},
      {"title": "Staff", "value": "91%", "steps": ["Shift A", "Shift B", "Operations", "Logs"], "activeStep": 3, "color": const Color(0xFFF59E0B)},
      {"title": "Research", "value": "88%", "steps": ["Project", "Analysis", "Review", "Pub"], "activeStep": 1, "color": const Color(0xFFEC4899)},
    ];

    bool isMobile = MediaQuery.of(context).size.width < 850;

    if (isMobile) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Attendance Overview",
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF1E293B)),
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 320, // Increased height to prevent bottom overflow
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemCount: 3,
              separatorBuilder: (context, index) => const SizedBox(width: 16),
              itemBuilder: (context, index) {
                final data = attendanceData[index];
                return SizedBox(
                  width: MediaQuery.of(context).size.width * 0.85,
                  child: _buildPremiumTrackCard(
                    title: data['title'] as String,
                    subTitle: "Attendance Status",
                    value: data['value'] as String,
                    steps: data['steps'] as List<String>,
                    activeStep: data['activeStep'] as int,
                    color: data['color'] as Color,
                    tip: "Tip: Monitoring enabled for ${data['title']}.",
                  ),
                );
              },
            ),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Attendance Management",
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF1E293B)),
        ),
        const SizedBox(height: 20),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 20,
            crossAxisSpacing: 20,
            childAspectRatio: 0.84, // Fine-tuned to resolve overflow precisely
          ),
          itemCount: attendanceData.length,
          itemBuilder: (context, index) {
            final data = attendanceData[index];
            return _buildPremiumTrackCard(
              title: data['title'] as String,
              subTitle: "Attendance Status",
              value: data['value'] as String,
              steps: data['steps'] as List<String>,
              activeStep: data['activeStep'] as int,
              color: data['color'] as Color,
              tip: "Tip: Real-time monitoring enabled for ${data['title']}.",
            );
          },
        ),
      ],
    );
  }

  Widget _buildPremiumTrackCard({
    required String title,
    required String subTitle,
    required String value,
    required List<String> steps,
    required int activeStep,
    required Color color,
    required String tip,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF0F172A), letterSpacing: -0.5),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 16),
          // Sub-box like image
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10)],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(color: color.withValues(alpha: 0.1), shape: BoxShape.circle),
                  child: Icon(Icons.check_circle_rounded, color: color, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    subTitle,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF64748B)),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 12),
                Text(value, style: TextStyle(fontWeight: FontWeight.w900, color: color, fontSize: 13)),
                const SizedBox(width: 8),
                const Icon(Icons.auto_awesome_motion_rounded, size: 16, color: Color(0xFF94A3B8)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // Gradient Stepper Track
          Stack(
            children: [
              Container(
                height: 40,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  color: const Color(0xFFF1F5F9),
                ),
              ),
              LayoutBuilder(
                builder: (context, constraints) {
                  double progress = ((activeStep + 1) / steps.length).clamp(0.0, 1.0);
                  return Container(
                    height: 40,
                    width: constraints.maxWidth * progress,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(20),
                      gradient: LinearGradient(
                        colors: [color.withValues(alpha: 0.9), color.withValues(alpha: 0.5)],
                      ),
                    ),
                  );
                },
              ),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: List.generate(steps.length, (i) {
                    bool isActive = i <= activeStep;
                    return Expanded(
                      child: Column(
                        children: [
                          Container(
                            height: 40,
                            alignment: Alignment.center,
                            child: Container(
                              width: 24, height: 24,
                              decoration: BoxDecoration(
                                color: isActive ? Colors.white : Colors.white.withValues(alpha: 0.3),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                isActive ? Icons.check_rounded : (i == activeStep + 1 ? Icons.add_rounded : null),
                                size: 14,
                                color: isActive ? color : Colors.white70,
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            steps[i],
                            style: TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              color: isActive ? color : const Color(0xFF94A3B8),
                            ),
                            textAlign: TextAlign.center,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    );
                  }),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Tip section like image
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.05),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.add_rounded, size: 14, color: color),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    tip,
                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: color),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 600.ms).scale(begin: const Offset(0.95, 0.95), curve: Curves.easeOut).slideY(begin: 0.05, curve: Curves.easeOut);
  }

  Widget _attendanceMiniStat(String label, String value, Color bgColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label.toUpperCase(), style: const TextStyle(color: Colors.white70, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 1)),
          Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14)),
        ],
      ),
    );
  }

  // --- PERFORMANCE TREND ---
  Widget _buildPerformance() {
    final performanceData = [
      {"dept": "B.Tech CSE", "score": "78%", "steps": ["Unit 1", "Unit 2", "Midterm", "Finals"], "activeStep": 2, "color": const Color(0xFF8B5CF6)},
      {"dept": "B.Tech ECE", "score": "82%", "steps": ["Unit 1", "Unit 2", "Midterm", "Finals"], "activeStep": 3, "color": const Color(0xFFEC4899)},
      {"dept": "Mechanical", "score": "71%", "steps": ["Unit 1", "Unit 2", "Midterm", "Finals"], "activeStep": 1, "color": const Color(0xFF3B82F6)},
      {"dept": "Civil Eng", "score": "65%", "steps": ["Unit 1", "Unit 2", "Midterm", "Finals"], "activeStep": 0, "color": const Color(0xFF06B6D4)},
    ];

    bool isMobile = MediaQuery.of(context).size.width < 850;

    if (isMobile) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Performance Trends",
            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF1E293B)),
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 320, // Increased height to prevent bottom overflow
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemCount: 3,
              separatorBuilder: (context, index) => const SizedBox(width: 16),
              itemBuilder: (context, index) {
                final data = performanceData[index];
                return SizedBox(
                  width: MediaQuery.of(context).size.width * 0.85,
                  child: _buildPremiumTrackCard(
                    title: data['dept'] as String,
                    subTitle: "Score Improvement",
                    value: data['score'] as String,
                    steps: data['steps'] as List<String>,
                    activeStep: data['activeStep'] as int,
                    color: data['color'] as Color,
                    tip: "Pro Tip: Consistent scores in ${data['dept']}.",
                  ),
                );
              },
            ),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Performance Metrics",
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF1E293B)),
        ),
        const SizedBox(height: 20),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 20,
            crossAxisSpacing: 20,
            childAspectRatio: 0.84, // Fine-tuned to resolve overflow precisely
          ),
          itemCount: performanceData.length,
          itemBuilder: (context, index) {
            final data = performanceData[index];
            return _buildPremiumTrackCard(
              title: data['dept'] as String,
              subTitle: "Score Improvement",
              value: data['score'] as String,
              steps: data['steps'] as List<String>,
              activeStep: data['activeStep'] as int,
              color: data['color'] as Color,
              tip: "Pro Tip: Consistent scores in ${data['dept']} this month.",
            );
          },
        ),
      ],
    );
  }

  // --- FINANCE & FEES ---
    Widget _buildFinance() {
    return _buildPanelBase(
      title: "Fee Collection Strategy",
      actionWidget: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 12,
              height: 12,
              decoration: const BoxDecoration(
                color: Color(0xFF10B981),
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              "COLLECTED",
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
            const SizedBox(width: 16),
            Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              "PENDING",
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
          ],
        ),
      child: Column(
        children: [
          const SizedBox(height: 24),
          _feeProgressBar("Tuition Fees", 0.82, const Color(0xFF10B981)),
          const SizedBox(height: 16),
          _feeProgressBar("Hostel & Mess", 0.65, const Color(0xFF6366F1)),
          const SizedBox(height: 16),
          _feeProgressBar("Transport", 0.94, const Color(0xFFF59E0B)),
          const SizedBox(height: 32),

          // Alert Banner
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [const Color(0xFF10B981).withValues(alpha: 0.2), const Color(0xFF10B981).withValues(alpha: 0.1)],
              ),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF10B981).withValues(alpha: 0.2)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [BoxShadow(color: const Color(0xFF10B981).withValues(alpha: 0.3), blurRadius: 10)],
                  ),
                  child: const Icon(Icons.payments_rounded, color: Colors.white, size: 24),
                ).animate(onPlay: (controller) => controller.repeat())
                 .shimmer(duration: 2000.ms, color: Colors.white30),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text("Collection Alert", style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF065F46))),
                      Text("42 students have pending balances", style: TextStyle(color: const Color(0xFF065F46).withValues(alpha: 0.7), fontSize: 12)),
                    ],
                  ),
                ),
                const Icon(Icons.arrow_forward_ios_rounded, size: 16, color: Color(0xFF10B981)),
              ],
            ),
          ).animate(onPlay: (controller) => controller.repeat(reverse: true))
           .scale(begin: const Offset(1, 1), end: const Offset(1.02, 1.02), duration: 2000.ms),
        ],
      ),
    );
  }

  Widget _feeProgressBar(String label, double progress, Color color) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              label.toUpperCase(),
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
            Text(
              "${(progress * 100).toInt()}%",
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(100),
          child: LinearProgressIndicator(
            value: progress,
            backgroundColor: color.withValues(alpha: 0.1),
            color: color,
            minHeight: 8,
          ),
        ),
      ],
    );
  }

  // --- QUICK ACTIONS ---
  Widget _buildQuickActions() {
    return HoverScaleCard(
      scale: 1.01,
      child: _buildPanelBase(
        title: "Quick Actions",
        child: Column(
          children: [
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _actionButton(
                    "Add Student",
                    Icons.person_add,
                    const Color(0xFF4F46E5),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _actionButton(
                    "Add Staff",
                    Icons.badge,
                    const Color(0xFF059669),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _actionButton(
                    "Create Course",
                    Icons.library_add,
                    const Color(0xFF7C3AED),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _actionButton(
                    "Fees Config",
                    Icons.settings_suggest,
                    const Color(0xFFD97706),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            HoverScaleCard(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 20),
                decoration: BoxDecoration(
                  color: AppColors.primaryRed.withValues(alpha: 0.2),
                  border: Border.all(
                    color: AppColors.primaryRed.withValues(alpha: 0.2),
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.campaign, color: AppColors.primaryRed, size: 24),
                    const SizedBox(width: 12),
                    Text(
                      "Publish Semester Results",
                      style: TextStyle(
                        color: AppColors.primaryRed,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _actionButton(String title, IconData icon, Color color) {
    return HoverScaleCard(
      scale: 1.05,
      child: Container(
        height: 100,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.2),
          border: Border.all(color: color.withValues(alpha: 0.2)),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 12),
            Text(
              title,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w500,
                fontSize: 12,
                decorationThickness: 2,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- CRITICAL ALERTS ---
    Widget _buildCriticalAlerts() {
    return _buildPanelBase(
      title: "Critical Alerts",
      actionIcon: Icons.warning_amber_rounded,
      child: Column(
        children: [
          const SizedBox(height: 24),
          _alertItem(
            Icons.warning_amber_rounded,
            "Attendance Shortage",
            "12 students in Semester 3 are below threshold.",
            Colors.amber,
          ).animate(onPlay: (controller) => controller.repeat(reverse: true))
           .moveX(begin: 0, end: 4, duration: 2000.ms),
          const SizedBox(height: 16),
          _alertItem(
            Icons.error_outline_rounded,
            "Fee Overdue",
            "Hostel fee deadline passed for Block B students.",
            Colors.red,
          ).animate(onPlay: (controller) => controller.repeat(reverse: true))
           .moveX(begin: 0, end: -4, duration: 2500.ms),
        ],
      ),
    );
  }

    Widget _alertItem(IconData icon, String title, String subtitle, MaterialColor color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.shade50.withValues(alpha: 0.5),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.shade200),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: BubbleAnimation(
          bubbleCount: 2,
          bubbleColor: Colors.white54,
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: LinearGradient(
                    colors: [color.shade500, color.shade700],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Icon(icon, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: TextStyle(color: color.shade900, fontWeight: FontWeight.w900, fontSize: 13)),
                    Text(subtitle, style: TextStyle(color: color.shade700, fontSize: 11)),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- INSTANT REPORTS ---
    Widget _buildInstantReports() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.3), blurRadius: 20)],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: BubbleAnimation(
          bubbleCount: 5,
          bubbleColor: Colors.white10,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("Instant Reports", style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900)),
              const SizedBox(height: 24),
              _reportItem(Icons.analytics_rounded, "MIS Executive Summary", Colors.blueAccent),
              const SizedBox(height: 12),
              _reportItem(Icons.payments_rounded, "Finance Audit FY24", Colors.greenAccent),
              const SizedBox(height: 12),
              _reportItem(Icons.assignment_ind_rounded, "Staff Performance Rollup", Colors.orangeAccent),
            ],
          ),
        ),
      ),
    ).animate(onPlay: (controller) => controller.repeat(reverse: true))
     .moveY(begin: 0, end: -8, duration: 3000.ms);
  }

  Widget _reportItem(IconData icon, String title, Color color) {
    return HoverScaleCard(
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(
                  colors: [color.withValues(alpha: 0.8), color],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Icon(icon, color: Colors.white, size: 18),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const Icon(Icons.download, color: Colors.white70, size: 16),
          ],
        ),
      ),
    );
  }

  // --- DEPARTMENTS GRID ---
  Widget _buildDepartmentsGrid(double width) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Institute Departments",
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 24),
        GridView.count(
          crossAxisCount: width < 600
              ? 2
              : (width < 900 ? 3 : (width < 1400 ? 4 : 6)),
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 1.5,
          mainAxisSpacing: 16,
          crossAxisSpacing: 16,
          children: [
            _deptItem(
              Icons.meeting_room,
              "Admissions",
              const Color(0xFFE0F2FE),
              const Color(0xFF7DD3FC),
              const Color(0xFF0284C7),
              const Color(0xFF0C4A6E),
            ),
            _deptItem(
              Icons.fingerprint,
              "Attendance",
              const Color(0xFFCCFBF1),
              const Color(0xFF5EEAD4),
              const Color(0xFF0D9488),
              const Color(0xFF134E4A),
            ),
            _deptItem(
              Icons.history_edu,
              "Exams",
              const Color(0xFFEDE9FE),
              const Color(0xFFC4B5FD),
              const Color(0xFF7C3AED),
              const Color(0xFF2E1065),
            ),
            _deptItem(
              Icons.local_library,
              "Library",
              const Color(0xFFFFF7ED),
              const Color(0xFFFDBA74),
              const Color(0xFFEA580C),
              const Color(0xFF431407),
            ),
            _deptItem(
              Icons.engineering,
              "HR Portal",
              const Color(0xFFFCE7F3),
              const Color(0xFFF9A8D4),
              const Color(0xFFDB2777),
              const Color(0xFF500724),
            ),
            _deptItem(
              Icons.calculate,
              "Accounts",
              const Color(0xFFE0E7FF),
              const Color(0xFFA5B4FC),
              const Color(0xFF4338CA),
              const Color(0xFF1E1B4B),
            ),
          ],
        ),
      ],
    );
  }

  Widget _deptItem(
    IconData icon,
    String title,
    Color bg,
    Color borderColor,
    Color iconColor,
    Color textColor,
  ) {
    return HoverScaleCard(
      scale: 1.06,
      child: Container(
        decoration: BoxDecoration(
          color: bg,
          border: Border.all(color: borderColor),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: iconColor, size: 36),
            const SizedBox(height: 12),
            Text(
              title,
              style: TextStyle(
                color: textColor,
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- RECENT ACTIVITY & SYSTEM OVERVIEW ---
  Widget _buildRecentActivity() {
    return HoverScaleCard(
      scale: 1.01,
      child: _buildPanelBase(
        title: "Recent Activity",
        child: Column(
          children: [
            const SizedBox(height: 24),
            _activityItem(
              iconUrl: "https://i.pravatar.cc/150?img=12",
              text: "Rahul Sharma enrolled in B.Tech CSE",
              time: "10 Minutes Ago",
            ),
            _activityItem(
              iconUrl: "https://i.pravatar.cc/150?img=41",
              text: "Prof. Sarah Jenkins published Applied Physics Marks",
              time: "1 Hour Ago",
            ),
            _activityItem(
              icon: Icons.payments,
              iconBg: Colors.greenAccent.shade100,
              iconColor: Colors.green.shade700,
              text: "Fee Payment received for INV-9022 (\$1,450)",
              time: "3 Hours Ago",
            ),
          ],
        ),
      ),
    );
  }

  Widget _activityItem({String? iconUrl, IconData? icon, Color? iconBg, Color? iconColor, required String text, required String time}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(colors: [iconBg ?? Colors.blue, (iconBg ?? Colors.blue).withValues(alpha: 0.7)]),
              boxShadow: [BoxShadow(color: (iconBg ?? Colors.blue).withValues(alpha: 0.3), blurRadius: 8, offset: const Offset(0, 4))],
            ),
            child: Center(
              child: iconUrl != null 
                ? ClipOval(child: Image.network(iconUrl, fit: BoxFit.cover)) 
                : Icon(icon, color: Colors.white, size: 20),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(text, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1E293B))),
                Text(time, style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSystemHealth() {
    return _buildPanelBase(
      title: "System Health & Uptime",
      child: Column(
        children: [
          const SizedBox(height: 24),
          Row(
            children: [
              _statusBox("Active Users", "412", "Live", Colors.green),
              const SizedBox(width: 16),
              _statusBox("Server Uptime", "99.9%", "Stable", Colors.blue),
            ],
          ),
          const SizedBox(height: 24),
          _storageMeter(),
        ],
      ),
    );
  }

  Widget _statusBox(String label, String value, String status, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withValues(alpha: 0.1)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(label.toUpperCase(), style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.grey)),
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                ).animate(onPlay: (controller) => controller.repeat())
                 .shimmer(duration: 1500.ms, color: Colors.white70),
              ],
            ),
            const SizedBox(height: 12),
            Text(value, style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, height: 1)),
            Text(status, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
          ],
        ),
      ),
    );
  }

  Widget _storageMeter() {
    return Column(
      children: [
        const Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text("STORAGE UTILIZATION", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
            Text("4.2 TB / 10 TB", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
          ],
        ),
        const SizedBox(height: 12),
        ClipRRect(
          borderRadius: BorderRadius.circular(100),
          child: LinearProgressIndicator(
            value: 0.42,
            minHeight: 10,
            backgroundColor: Colors.grey.shade100,
            valueColor: AlwaysStoppedAnimation<Color>(AppColors.primaryRed),
          ),
        ),
      ],
    );
  }

  // --- MOBILE QUICK ACTIONS ---
  Widget _buildMobileQuickActions(double width) {
    int maxDisplayCount = _showAllActions ? _quickActions.length : 8;
    List<Map<String, dynamic>> displayedActions = _quickActions.take(maxDisplayCount).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              "Quick Commands",
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1E293B)),
            ),
            if (!_showAllActions)
              TextButton.icon(
                onPressed: () => setState(() => _showAllActions = true),
                icon: const Icon(Icons.add_rounded, size: 16),
                label: const Text("See More", style: TextStyle(fontWeight: FontWeight.bold)),
              )
            else
              TextButton.icon(
                onPressed: () => setState(() => _showAllActions = false),
                icon: const Icon(Icons.remove_rounded, size: 16),
                label: const Text("Show Less", style: TextStyle(fontWeight: FontWeight.bold)),
              ),
          ],
        ),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 0.85,
          ),
          itemCount: displayedActions.length,
          itemBuilder: (context, index) {
            final action = displayedActions[index];
            return Container(
              child: Column(
                children: [
                  GestureDetector(
                    onTap: () {},
                    child: Container(
                      height: 55,
                      width: 55,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [action['color'], (action['color'] as Color).withValues(alpha: 0.8)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: (action['color'] as Color).withValues(alpha: 0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 5),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(20),
                        child: BubbleAnimation(
                          bubbleCount: 2,
                          bubbleColor: Colors.white54,
                          child: Center(
                            child: Icon(action['icon'], color: Colors.white, size: 24),
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Flexible(
                    child: Text(
                      action['label'],
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFF64748B)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn(delay: (index * 50).ms).slideY(begin: 0.2)
               .animate(onPlay: (controller) => controller.repeat(reverse: true))
               .moveY(begin: 0, end: -4, duration: (1500 + (index * 100)).ms, curve: Curves.easeInOut);
          },
        ),
      ],
    );
  }

  // --- HELPER WRAPPER ---
  Widget _buildPanelBase({
    required String title,
    Widget? actionWidget,
    IconData? actionIcon,
    required Widget child,
  }) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.primaryRed.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              if (actionWidget != null)
                actionWidget
              else if (actionIcon != null)
                Icon(actionIcon, color: Colors.grey.shade400),
            ],
          ),
          child,
        ],
      ),
    );
  }
}
