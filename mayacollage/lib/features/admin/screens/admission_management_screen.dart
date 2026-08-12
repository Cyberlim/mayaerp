import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';
import 'create_application_screen.dart';
import 'application_detail_screen.dart';
import '../../../core/services/application_service.dart';
import '../../../core/services/course_service.dart';
import '../../../core/services/branch_service.dart';
import 'package:intl/intl.dart';

class AdmissionManagementScreen extends StatefulWidget {
  const AdmissionManagementScreen({super.key});

  @override
  State<AdmissionManagementScreen> createState() =>
      _AdmissionManagementScreenState();
}

class _AdmissionManagementScreenState extends State<AdmissionManagementScreen> {
  String _activeFilter = 'All';
  final List<String> _filters = ['All', 'Pending', 'Approved', 'Rejected'];
  List<dynamic> _applications = [];
  List<dynamic> _courses = [];
  List<dynamic> _branches = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      setState(() => _isLoading = true);
      final apps = await ApplicationService.getAllApplications();
      final courses = await CourseService.getAllCourses();
      final branches = await BranchService.getAllBranches();
      if (mounted) {
        setState(() {
          _applications = apps;
          _courses = courses;
          _branches = branches;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading data: $e')),
        );
      }
    }
  }

  Future<void> _handleDelete(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Delete'),
        content: const Text('Are you sure you want to delete this application?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await ApplicationService.deleteApplication(id);
        _loadData();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Application deleted successfully')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Error deleting application: $e')),
          );
        }
      }
    }
  }

  Future<void> _handleUpdateStatus(String id, String status) async {
    try {
      await ApplicationService.updateApplication(id, {'status': status});
      _loadData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Application marked as $status')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error updating application: $e')),
        );
      }
    }
  }

  Map<String, Map<String, dynamic>> get _programStats {
    final Map<String, Color> colors = {
      '0': const Color(0xFF4F46E5),
      '1': const Color(0xFFEA580C),
      '2': const Color(0xFF7C3AED),
      '3': const Color(0xFF0D9488),
      '4': const Color(0xFFDB2777),
      '5': const Color(0xFF2563EB),
      '6': const Color(0xFF059669),
      '7': const Color(0xFF9333EA),
      '8': const Color(0xFFDC2626),
    };

    final stats = <String, Map<String, dynamic>>{};
    
    // Initialize stats from database courses
    int colorIndex = 0;
    for (var c in _courses) {
      final id = c['_id'] as String;
      final name = c['name'] ?? 'Unknown Course';
      final cap = c['intakeCapacity'] ?? 100;

      stats[id] = {
        'name': name,
        'total': cap,
        'filled': 0,
        'color': colors[(colorIndex % colors.length).toString()] ?? Colors.grey,
      };
      colorIndex++;
    }

    // Count applications (only Approved/Accepted count as filled seats)
    for (var app in _applications) {
      final progVal = app['selectedProgram'] as String?;
      final status = app['status'] as String?;
      if (progVal == null) continue;

      String? matchedId = progVal;
      if (!stats.containsKey(progVal)) {
        // Fallback if the legacy application stored the name instead of course ID
        final match = _courses.where((c) => c['name'] == progVal).firstOrNull;
        if (match != null) {
          matchedId = match['_id'] as String?;
        }
      }

      if (matchedId != null && stats.containsKey(matchedId)) {
        if (status == 'Accepted' || status == 'Approved') {
          stats[matchedId]!['filled'] = (stats[matchedId]!['filled'] as int) + 1;
        }
      }
    }

    return stats;
  }

  List<dynamic> get _filtered => _activeFilter == 'All'
      ? _applications
      : _applications.where((a) {
        final status = a['status'] as String? ?? 'Pending';
        if (_activeFilter == 'Approved') {
          return status == 'Approved' || status == 'Accepted';
        }
        return status == _activeFilter;
      }).toList();

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final isMobile = width < 850;
        final isNarrow = width < 1200;

        return Container(
          color: const Color(0xFFF8F6F6),
          child: Column(
            children: [
              _buildHeader(context, width),
              Expanded(
                child: _isLoading
                    ? const Center(child: CircularProgressIndicator())
                    : SingleChildScrollView(
                        padding: EdgeInsets.all(isMobile ? 16 : 32),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildKPICards(width),
                            SizedBox(height: isMobile ? 24 : 36),
                            if (isNarrow) ...[
                              _buildProgramAllocation(width),
                              const SizedBox(height: 24),
                              _buildAdmissionFunnel(),
                            ] else
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(flex: 5, child: _buildProgramAllocation(width)),
                                  const SizedBox(width: 28),
                                  Expanded(flex: 2, child: _buildAdmissionFunnel()),
                                ],
                              ),
                            SizedBox(height: isMobile ? 24 : 36),
                            _buildApplicationsCardSection(context, width),
                          ],
                        ),
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  // ─────────── HEADER ───────────
  Widget _buildHeader(BuildContext context, double width) {
    bool isMobile = width < 700;
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 16 : 40,
        vertical: isMobile ? 16 : 22,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFF1F1F1))),
      ),
      child: isMobile
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Admissions",
                  style: AppTheme.titleStyle.copyWith(fontSize: 22),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _gradientBtn(
                        context,
                        Icons.post_add_rounded,
                        "New App",
                      ),
                    ),
                    const SizedBox(width: 10),
                    _headerBtn(Icons.file_download_rounded, "", const Color(0xFF4F46E5)),
                  ],
                ),
              ],
            )
          : Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "Enrollment & Admissions",
                      style: AppTheme.titleStyle.copyWith(fontSize: 26),
                    ),
                    Text(
                      "Academic Year 2023–24 • Intake open",
                      style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                    ),
                  ],
                ),
                Row(
                  children: [
                    _headerBtn(
                      Icons.file_download_rounded,
                      "Export Report",
                      const Color(0xFF4F46E5),
                    ),
                    const SizedBox(width: 14),
                    _gradientBtn(context, Icons.post_add_rounded, "New Application"),
                  ],
                ),
              ],
            ),
    );
  }

  Widget _headerBtn(IconData icon, String label, Color color) {
    return ElevatedButton.icon(
      onPressed: () {},
      style: ElevatedButton.styleFrom(
        backgroundColor: color.withValues(alpha: 0.08),
        shadowColor: Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
      ),
      icon: Icon(icon, color: color, size: 18),
      label: Text(
        label,
        style: TextStyle(
          color: color,
          fontWeight: FontWeight.bold,
          fontSize: 13,
        ),
      ),
    );
  }

  Widget _gradientBtn(BuildContext context, IconData icon, String label) {
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
        onPressed: () => Navigator.push(
          context,
          _slideRoute(const CreateApplicationScreen()),
        ),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(13),
          ),
        ),
        icon: Icon(icon, color: Colors.white, size: 18),
        label: Text(
          label,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  // ─────────── KPI CARDS ───────────
  Widget _buildKPICards(double width) {
    bool isMobile = width < 850;
    
    final totalCount = _applications.length;
    final pendingCount = _applications.where((a) => a['status'] == 'Pending').length;
    final approvedCount = _applications.where((a) => a['status'] == 'Accepted' || a['status'] == 'Approved').length;
    final rejectedCount = _applications.where((a) => a['status'] == 'Rejected').length;

    final cards = [
      {
        "label": "Total Applications",
        "value": totalCount.toString(),
        "sub": "Across all programs",
        "icon": Icons.inbox_rounded,
        "colors": [const Color(0xFF880E4F), const Color(0xFFEC1349)],
      },
      {
        "label": "Pending Review",
        "value": pendingCount.toString(),
        "sub": "Action required",
        "icon": Icons.pending_actions_rounded,
        "colors": [const Color(0xFFB45309), const Color(0xFFF59E0B)],
      },
      {
        "label": "Approved",
        "value": approvedCount.toString(),
        "sub": "Offer letters sent",
        "icon": Icons.check_circle_rounded,
        "colors": [const Color(0xFF065F46), const Color(0xFF10B981)],
      },
      {
        "label": "Rejected",
        "value": rejectedCount.toString(),
        "sub": "Ineligible candidates",
        "icon": Icons.cancel_rounded,
        "colors": [const Color(0xFF7F1D1D), const Color(0xFFEF4444)],
      },
    ];

    if (isMobile) {
      return SizedBox(
        height: 195,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          itemCount: cards.length,
          separatorBuilder: (_, _) => const SizedBox(width: 16),
          itemBuilder: (context, i) {
            final c = cards[i];
            return SizedBox(
              width: width * 0.75,
              child: _kpiCard(
                c['label'] as String,
                c['value'] as String,
                c['sub'] as String,
                c['icon'] as IconData,
                c['colors'] as List<Color>,
                i,
              ),
            );
          },
        ),
      );
    }

    return Row(
      children: List.generate(cards.length, (i) {
        final c = cards[i];
        final colors = c['colors'] as List<Color>;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(right: i < cards.length - 1 ? 20 : 0),
            child: _kpiCard(
              c['label'] as String,
              c['value'] as String,
              c['sub'] as String,
              c['icon'] as IconData,
              colors,
              i,
            ),
          ),
        );
      }),
    );
  }

  Widget _kpiCard(
    String label,
    String value,
    String sub,
    IconData icon,
    List<Color> colors,
    int index,
  ) {
    return _HoverCard(
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: colors,
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(22),
          boxShadow: [
            BoxShadow(
              color: colors.last.withValues(alpha: 0.25),
              blurRadius: 20,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Stack(
          children: [
            Positioned(
              right: -16,
              bottom: -16,
              child: Icon(
                icon,
                size: 80,
                color: Colors.white.withValues(alpha: 0.07),
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: Colors.white, size: 22),
                ),
                const SizedBox(height: 20),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 34,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    height: 1,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Colors.white.withValues(alpha: 0.85),
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  sub,
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.white.withValues(alpha: 0.6),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ).animate(delay: (index * 80).ms).fadeIn().slideY(begin: 0.2);
  }

  // ─────────── PROGRAM ALLOCATION ───────────
  Widget _buildProgramAllocation(double width) {
    final stats = _programStats.values.toList();
    final isVeryWide = width > 1400;
    final isMobile = width < 850;
    
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: _panelDecor(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "Program-wise Seat Allocation",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              _liveBadge(),
            ],
          ),
          const SizedBox(height: 28),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: stats.length,
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: isMobile ? 1 : (isVeryWide ? 3 : 2),
              crossAxisSpacing: 20,
              mainAxisSpacing: 20,
              mainAxisExtent: 130,
            ),
            itemBuilder: (context, i) {
              final p = stats[i];
              final total = p['total'] as int;
              final filled = p['filled'] as int;
              final fill = total > 0 ? filled / total : 0.0;
              return _programCard(
                p['name'],
                fill,
                total,
                filled,
                p['color'],
                i,
              );
            },
          ),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms).slideX(begin: -0.1);
  }

  Widget _liveBadge() => Container(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(
      color: const Color(0xFFF0FDF4),
      borderRadius: BorderRadius.circular(8),
    ),
    child: const Row(
      children: [
        Icon(Icons.circle, color: Colors.green, size: 8),
        SizedBox(width: 6),
        Text(
          "Live",
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.bold,
            color: Colors.green,
          ),
        ),
      ],
    ),
  );

  Widget _programCard(
    String name,
    double fill,
    int total,
    int filled,
    Color color,
    int index,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  name,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Text(
                "${(fill * 100).toInt()}%",
                style: TextStyle(color: color, fontWeight: FontWeight.w900, fontSize: 12),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Stack(
            children: [
              Container(
                height: 6,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
              ),
              FractionallySizedBox(
                alignment: Alignment.centerLeft,
                widthFactor: fill,
                child: Container(
                  height: 6,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [color, color.withValues(alpha: 0.6)]),
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Filled Seats",
                style: TextStyle(color: Colors.grey.shade600, fontSize: 11, fontWeight: FontWeight.w500),
              ),
              Text(
                "$filled / $total",
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ─────────── FUNNEL ───────────
  Widget _buildAdmissionFunnel() {
    final total = _applications.length;
    final pending = _applications.where((a) => a['status'] == 'Pending').length;
    final reviewed = total - pending;
    final admitted = _applications.where((a) => a['status'] == 'Accepted' || a['status'] == 'Approved').length;

    final steps = [
      {"label": "Applied", "value": total, "color": const Color(0xFF6366F1)},
      {"label": "Reviewed", "value": reviewed, "color": const Color(0xFFEC1349)},
      {"label": "Admitted", "value": admitted, "color": const Color(0xFF10B981)},
    ];
    return Container(
      padding: const EdgeInsets.all(28),
      decoration: _panelDecor(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Admission Pipeline",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          Text(
            "Funnel overview • AY 2023-24",
            style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
          ),
          const SizedBox(height: 28),
          ...List.generate(steps.length, (i) {
            final s = steps[i];
            final pct = total > 0 ? (s['value'] as int) / total : 0.0;
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        s['label'] as String,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                      Text(
                        (s['value'] as int).toString(),
                        style: TextStyle(
                          fontWeight: FontWeight.w900,
                          fontSize: 15,
                          color: s['color'] as Color,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  FractionallySizedBox(
                        alignment: Alignment.centerLeft,
                        widthFactor: pct,
                        child: Container(
                          height: 34,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                (s['color'] as Color).withValues(alpha: 0.85),
                                (s['color'] as Color).withValues(alpha: 0.4),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                      )
                      .animate(delay: (i * 120).ms)
                      .scaleX(
                        alignment: Alignment.centerLeft,
                        duration: 600.ms,
                        curve: Curves.easeOutCubic,
                      ),
                ],
              ),
            );
          }),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.primaryRed.withValues(alpha: 0.06),
                  AppColors.primaryPink.withValues(alpha: 0.03),
                ],
              ),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: AppColors.primaryRed.withValues(alpha: 0.1),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.trending_up_rounded,
                  color: AppColors.primaryRed,
                  size: 26,
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "Conversion Rate",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    RichText(
                      text: TextSpan(
                        children: [
                          TextSpan(
                            text: "${total > 0 ? ((admitted / total) * 100).toStringAsFixed(1) : 0}%  ",
                            style: TextStyle(
                              color: AppColors.primaryRed,
                              fontWeight: FontWeight.w900,
                              fontSize: 18,
                            ),
                          ),
                          const TextSpan(
                            text: "Applied → Admitted",
                            style: TextStyle(color: Colors.grey, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms).slideX(begin: 0.1);
  }

  // ─────────── APPLICATION CARDS ───────────
  Widget _buildApplicationsCardSection(BuildContext context, double width) {
    bool isMobile = width < 850;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header row
        if (isMobile)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Applications",
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: _buildFilterTabs(),
              ),
              const SizedBox(height: 12),
              _buildMeritButton(),
            ],
          )
        else
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    "Applications",
                    style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                  ),
                  Text(
                    "${_filtered.length} applicants found",
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                  ),
                ],
              ),
              Row(
                children: [
                  _buildFilterTabs(),
                  const SizedBox(width: 16),
                  _buildMeritButton(),
                ],
              ),
            ],
          ),

        const SizedBox(height: 24),

        // CARD GRID
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: width < 600 ? 1 : (width < 900 ? 2 : (width < 1400 ? 3 : 4)),
            mainAxisExtent: 580,
            crossAxisSpacing: 20,
            mainAxisSpacing: 20,
          ),
          itemCount: _filtered.length,
          itemBuilder: (_, i) => _applicationCard(_filtered[i], i),
        ),
      ],
    );
  }

  Widget _buildFilterTabs() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: _filters.map((t) {
          final sel = _activeFilter == t;
          return GestureDetector(
            onTap: () => setState(() => _activeFilter = t),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(
                horizontal: 18,
                vertical: 9,
              ),
              decoration: BoxDecoration(
                color: sel ? AppColors.primaryRed : Colors.transparent,
                borderRadius: BorderRadius.circular(10),
                boxShadow: sel
                    ? [
                        BoxShadow(
                          color: AppColors.primaryRed.withValues(alpha: 0.25),
                          blurRadius: 8,
                        ),
                      ]
                    : [],
              ),
              child: Text(
                t,
                style: TextStyle(
                  fontWeight: sel ? FontWeight.bold : FontWeight.w500,
                  fontSize: 13,
                  color: sel ? Colors.white : Colors.grey.shade600,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildMeritButton() {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 10,
      ),
      decoration: BoxDecoration(
        color: AppColors.primaryRed.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: AppColors.primaryRed.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.auto_awesome_rounded,
            color: AppColors.primaryRed,
            size: 16,
          ),
          const SizedBox(width: 8),
          Text(
            "Merit List",
            style: TextStyle(
              color: AppColors.primaryRed,
              fontWeight: FontWeight.bold,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _applicationCard(Map<String, dynamic> app, int index) {
    final status = app['status'] as String? ?? 'Pending';
    final statusColor = status == 'Accepted' || status == 'Approved'
        ? const Color(0xFF10B981)
        : status == 'Rejected'
            ? const Color(0xFFEF4444)
            : const Color(0xFFF59E0B);
    
    final statusGrad = status == 'Accepted' || status == 'Approved'
        ? [const Color(0xFF065F46), const Color(0xFF10B981)]
        : status == 'Rejected'
            ? [const Color(0xFF7F1D1D), const Color(0xFFEF4444)]
            : [const Color(0xFF78350F), const Color(0xFFF59E0B)];

    final courseId = app['selectedProgram'];
    final courseName = _courses.where((c) => c['_id'] == courseId).firstOrNull?['name'] ?? courseId ?? 'Unknown Course';
    
    final branchId = app['selectedBranch'];
    final branchName = _branches.where((b) => b['_id'] == branchId).firstOrNull?['name'] ?? branchId ?? 'Unknown Branch';

    final name = "${app['firstName']} ${app['lastName']}";
    final city = app['city'] ?? "N/A";
    final category = app['category'] ?? "N/A";
    final score = "${app['percentageCGPA']}%";
    final date = app['createdAt'] != null 
        ? DateFormat('MMM dd').format(DateTime.parse(app['createdAt']))
        : "N/A";
    final avatar = app['applicantPhoto'] ?? "https://ui-avatars.com/api/?name=$name&background=random";

    final email = app['email'] ?? "N/A";
    final phone = app['mobile'] ?? "N/A";
    final gender = app['gender'] ?? "N/A";
    final session = app['sessionYear'] ?? "N/A";

    return _HoverCard(
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.grey.shade100, width: 1.5),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Column(
            children: [
                // Top Banner Section
                Container(
                  height: 90,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: statusGrad.map((c) => c.withValues(alpha: 0.85)).toList(),
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(100),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
                        ),
                        child: Text(
                          status.toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 9,
                            letterSpacing: 1.1,
                          ),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                        ),
                        child: Text(
                          "#APP-${(index + 1).toString().padLeft(3, '0')}",
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontFamily: 'monospace',
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              
              const SizedBox(height: 44), // Space for the avatar
              
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        fontSize: 18,
                        color: Color(0xFF1E293B),
                        height: 1.2,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      courseName,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: AppColors.primaryRed,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 3),
                    Text(
                      branchName,
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: Colors.grey.shade500,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    
                    // Detail Grid
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: _miniInfo(Icons.location_on_rounded, city),
                          ),
                          Container(width: 1, height: 20, color: Colors.grey.shade200),
                          Expanded(
                            child: _miniInfo(Icons.category_rounded, category),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // Merit Score with Progress
                    Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              "Merit Score",
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Color(0xFF64748B),
                              ),
                            ),
                            Text(
                              score,
                              style: TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w900,
                                color: statusColor,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Stack(
                          children: [
                            Container(
                              height: 6,
                              decoration: BoxDecoration(
                                color: statusColor.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(10),
                              ),
                            ),
                            FractionallySizedBox(
                              alignment: Alignment.centerLeft,
                              widthFactor: (double.tryParse(app['percentageCGPA']?.toString().replaceAll('%', '') ?? '0') ?? 0) / 100,
                              child: Container(
                                height: 6,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [statusColor, statusColor.withValues(alpha: 0.6)],
                                  ),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),

                    const SizedBox(height: 16),
                    Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade100, width: 1.2),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.02),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          children: [
                            _detailRow(Icons.email_outlined, email),
                            const SizedBox(height: 10),
                            _detailRow(Icons.phone_outlined, phone),
                            const SizedBox(height: 10),
                            _detailRow(Icons.school_outlined, "Qual: ${app['highestQualification'] ?? 'N/A'}"),
                            const SizedBox(height: 10),
                            _detailRow(Icons.business_outlined, "Inst: ${app['institutionName'] ?? 'N/A'}"),
                            const SizedBox(height: 10),
                            _detailRow(Icons.event_outlined, "Session: $session | $gender"),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
              
              const Spacer(),
              
              // Bottom Actions
              Container(
                padding: const EdgeInsets.all(12),
                decoration: const BoxDecoration(
                  border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
                  color: Color(0xFFFAFAFA),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: _actionBtn(
                        "Details",
                        Icons.visibility_outlined,
                        const Color(0xFF4F46E5),
                        () => Navigator.push(
                              context,
                              _slideRoute(ApplicationDetailScreen(application: app)),
                            ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    _miniActionBtn(
                      Icons.edit_outlined,
                      Colors.blue,
                      () async {
                        final result = await Navigator.push(
                          context,
                          _slideRoute(CreateApplicationScreen(application: app)),
                        );
                        if (result == true) {
                          _loadData();
                        }
                      },
                    ),
                    const SizedBox(width: 8),
                    if (status == 'Pending') ...[
                      _miniActionBtn(Icons.check_rounded, Colors.green, () => _handleUpdateStatus(app['_id'], 'Accepted')),
                      const SizedBox(width: 8),
                      _miniActionBtn(Icons.close_rounded, Colors.red, () => _handleUpdateStatus(app['_id'], 'Rejected')),
                      const SizedBox(width: 8),
                    ],
                    _miniActionBtn(Icons.delete_outline_rounded, Colors.red.shade700, () => _handleDelete(app['_id'])),
                  ],
                ),
              ),
            ],
          ),
          
          // Overlapping Avatar
          Positioned(
            top: 42,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 4),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: CircleAvatar(
                  radius: 38,
                  backgroundColor: Colors.grey.shade100,
                  backgroundImage: NetworkImage(avatar),
                ),
              ),
            ),
          ),
        ],
      ),
    ),
  );
}

  Widget _miniInfo(IconData icon, String text) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(icon, size: 14, color: const Color(0xFF94A3B8)),
        const SizedBox(width: 6),
        Flexible(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 12,
              color: Color(0xFF475569),
              fontWeight: FontWeight.w600,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _actionBtn(String label, IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w900,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _miniActionBtn(IconData icon, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, size: 18, color: color),
      ),
    );
  }



  BoxDecoration _panelDecor() => BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(22),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withValues(alpha: 0.04),
        blurRadius: 20,
        offset: const Offset(0, 8),
      ),
    ],
  );

  Route _slideRoute(Widget page) => PageRouteBuilder(
    pageBuilder: (_, a, _) => page,
    transitionsBuilder: (_, a, _, child) => SlideTransition(
      position: a.drive(
        Tween(
          begin: const Offset(1, 0),
          end: Offset.zero,
        ).chain(CurveTween(curve: Curves.easeOutCubic)),
      ),
      child: child,
    ),
  );

  Widget _detailRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: Colors.grey.shade500),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Colors.grey.shade700,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }
}

// ── Hover lift ──
class _HoverCard extends StatefulWidget {
  final Widget child;
  const _HoverCard({required this.child});

  @override
  State<_HoverCard> createState() => _HoverCardState();
}

class _HoverCardState extends State<_HoverCard> {
  bool _hovered = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _hovered = true),
      onExit: (_) => setState(() => _hovered = false),
      child: AnimatedScale(
        scale: _hovered ? 1.035 : 1.0,
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOutCubic,
        child: widget.child,
      ),
    );
  }
}
