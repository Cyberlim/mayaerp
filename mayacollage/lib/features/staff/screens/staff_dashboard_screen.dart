import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../admin/widgets/premium_stats_card.dart';
import '../../../widgets/bubble_animation.dart';

// --- Reusable Hover Widget ---
class HoverScaleCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final double scale;
  final EdgeInsetsGeometry? padding;

  const HoverScaleCard({super.key, required this.child, this.onTap, this.scale = 1.03, this.padding});
  @override
  State<HoverScaleCard> createState() => _HoverScaleCardState();
}

class _HoverScaleCardState extends State<HoverScaleCard> {
  bool _isHovered = false;
  @override
  Widget build(BuildContext context) => MouseRegion(
        onEnter: (_) => setState(() => _isHovered = true),
        onExit: (_) => setState(() => _isHovered = false),
        cursor: widget.onTap != null ? SystemMouseCursors.click : SystemMouseCursors.basic,
        child: GestureDetector(
          onTap: widget.onTap,
          child: AnimatedScale(
            scale: _isHovered ? widget.scale : 1.0,
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeOutCubic,
            child: Padding(padding: widget.padding ?? EdgeInsets.zero, child: widget.child),
          ),
        ),
      );
}

class StaffDashboardScreen extends StatefulWidget {
  const StaffDashboardScreen({super.key});

  @override
  State<StaffDashboardScreen> createState() => _StaffDashboardScreenState();
}

class _StaffDashboardScreenState extends State<StaffDashboardScreen> {
  bool _showAllActions = false;

  final List<Map<String, dynamic>> _quickActions = [
    {"icon": Icons.people_alt_rounded, "label": "Students", "color": Color(0xFF10B981)},
    {"icon": Icons.how_to_reg_rounded, "label": "Attendance", "color": Color(0xFF3B82F6)},
    {"icon": Icons.assignment_rounded, "label": "Exams", "color": Color(0xFFF43F5E)},
    {"icon": Icons.schedule_rounded, "label": "Time Table", "color": Color(0xFF8B5CF6)},
    {"icon": Icons.campaign_rounded, "label": "Notices", "color": Color(0xFFF59E0B)},
    {"icon": Icons.event_busy_rounded, "label": "Leave", "color": Color(0xFF06B6D4)},
    {"icon": Icons.bar_chart_rounded, "label": "Reports", "color": Color(0xFFEC4899)},
    {"icon": Icons.person_rounded, "label": "Profile", "color": Color(0xFF64748B)},
  ];

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        double width = constraints.maxWidth;
        bool isMobile = width < 850;
        
        return Scaffold(
          backgroundColor: isMobile ? Colors.transparent : const Color(0xFFF8FAFC),
          body: SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: isMobile ? 16 : 32, vertical: isMobile ? 8 : 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildPremiumStats(width),
                const SizedBox(height: 32),
                
                if (isMobile) ...[
                  _buildMobileQuickActions(width),
                  const SizedBox(height: 32),
                  _buildPersonalAttendance(),
                  const SizedBox(height: 24),
                  _buildClassWorkload(),
                  const SizedBox(height: 32),
                  _buildSchedulePanel(),
                  const SizedBox(height: 32),
                  _buildRecentActivity(),
                ] else ...[
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(child: _buildPersonalAttendance()),
                      const SizedBox(width: 32),
                      Expanded(child: _buildClassWorkload()),
                    ],
                  ),
                  const SizedBox(height: 32),
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        flex: 2,
                        child: Column(
                          children: [
                            _buildSchedulePanel(),
                            const SizedBox(height: 32),
                            _buildQuickActionsDesktop(),
                          ],
                        ),
                      ),
                      const SizedBox(width: 32),
                      Expanded(flex: 1, child: _buildRecentActivity()),
                    ],
                  ),
                ],
                const SizedBox(height: 32),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildPremiumStats(double width) {
    bool isMobile = width < 850;
    final kpiCards = [
      PremiumStatsCard(
        title: "Today's Presence",
        subValue: "Staff Attendance",
        value: "On-Time",
        percentage: "94%",
        icon: Icons.how_to_reg_rounded,
        gradientColors: const [Color(0xFF10B981), Color(0xFF059669)],
        chartColor: const Color(0xFF10B981),
        chartPoints: const [Offset(0, 0.5), Offset(1, 0.7), Offset(2, 0.6), Offset(3, 0.8), Offset(4, 0.9), Offset(5, 1.0)],
        selectedTimeline: "All",
        onTimelineChanged: (_) {},
      ),
      PremiumStatsCard(
        title: "Class Load",
        subValue: "Lectures Scheduled",
        value: "4 Classes",
        percentage: "Stable",
        icon: Icons.class_rounded,
        gradientColors: const [Color(0xFF3B82F6), Color(0xFF2563EB)],
        chartColor: const Color(0xFF3B82F6),
        chartPoints: const [Offset(0, 0.2), Offset(1, 0.4), Offset(2, 0.3), Offset(3, 0.5), Offset(4, 0.4), Offset(5, 0.8)],
        selectedTimeline: "All",
        onTimelineChanged: (_) {},
      ),
      PremiumStatsCard(
        title: "Students Performance",
        subValue: "Class Average",
        value: "78%",
        percentage: "+2.4%",
        icon: Icons.auto_graph_rounded,
        gradientColors: const [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
        chartColor: const Color(0xFF8B5CF6),
        chartPoints: const [Offset(0, 0.4), Offset(1, 0.5), Offset(2, 0.3), Offset(3, 0.6), Offset(4, 0.5), Offset(5, 0.9)],
        selectedTimeline: "All",
        onTimelineChanged: (_) {},
      ),
    ];

    double carouselHeight = isMobile ? 260 : 310;
    double cardWidth = isMobile ? width * 0.85 : 360;

    return SizedBox(
      height: carouselHeight,
      child: ListView.separated(
        clipBehavior: Clip.none,
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
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
         .moveY(begin: 0, end: -8, duration: 2000.ms, curve: Curves.easeInOut),
      ),
    );
  }

  Widget _buildMobileQuickActions(double width) {
    final actionsToShow = _showAllActions ? _quickActions : _quickActions.take(7).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Quick Actions", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 0.85,
          ),
          itemCount: actionsToShow.length + 1,
          itemBuilder: (context, index) {
            if (index == actionsToShow.length) {
              return _buildActionButton(
                _showAllActions ? Icons.expand_less_rounded : Icons.grid_view_rounded,
                _showAllActions ? "Less" : "More",
                Colors.grey.shade400,
                onTap: () => setState(() => _showAllActions = !_showAllActions),
              );
            }
            final action = actionsToShow[index];
            return _buildActionButton(action['icon'], action['label'], action['color']);
          },
        ),
      ],
    );
  }

  Widget _buildActionButton(IconData icon, String label, Color color, {VoidCallback? onTap}) {
    return HoverScaleCard(
      onTap: onTap ?? () {},
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [color, color.withValues(alpha: 0.8)], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [BoxShadow(color: color.withValues(alpha: 0.2), blurRadius: 10, offset: const Offset(0, 4))],
            ),
            child: BubbleAnimation(
              bubbleCount: 2,
              bubbleColor: Colors.white12,
              child: Icon(icon, color: Colors.white, size: 24),
            ),
          ),
          const SizedBox(height: 8),
          Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFF475569)), textAlign: TextAlign.center),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms).scale(begin: const Offset(0.95, 0.95));
  }

  Widget _buildQuickActionsDesktop() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Management Hub", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 4,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 2.2,
          ),
          itemCount: _quickActions.length,
          itemBuilder: (context, index) {
            final action = _quickActions[index];
            return _actionBtnDesktop(action['label'], action['icon'], action['color']);
          },
        ),
      ],
    );
  }

  Widget _actionBtnDesktop(String title, IconData icon, Color color) {
    return HoverScaleCard(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade100),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10)],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(width: 12),
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF1E293B))),
          ],
        ),
      ),
    );
  }

  Widget _buildPersonalAttendance() {
    final attendanceData = [
      {"title": "Personal Presence", "value": "94%", "steps": ["Check-in", "Lectures", "Meetings", "Exit"], "activeStep": 1, "color": const Color(0xFF10B981)},
      {"title": "Leave Balance", "value": "12 Days", "steps": ["Earned", "Sick", "Casual", "Used"], "activeStep": 2, "color": const Color(0xFFF59E0B)},
    ];

    bool isMobile = MediaQuery.of(context).size.width < 850;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Administrative Health", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
        const SizedBox(height: 20),
        if (isMobile) 
          SizedBox(
            height: 280,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemCount: attendanceData.length,
              separatorBuilder: (context, index) => const SizedBox(width: 16),
              itemBuilder: (context, index) {
                final data = attendanceData[index];
                return SizedBox(
                  width: MediaQuery.of(context).size.width * 0.85,
                  child: _buildPremiumTrackCard(
                    title: data['title'] as String,
                    subTitle: "Current Status",
                    value: data['value'] as String,
                    steps: data['steps'] as List<String>,
                    activeStep: data['activeStep'] as int,
                    color: data['color'] as Color,
                    tip: "Tip: Maintain 90%+ for rewards.",
                  ),
                );
              },
            ),
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 20,
              crossAxisSpacing: 20,
              childAspectRatio: 1.15,
            ),
            itemCount: attendanceData.length,
            itemBuilder: (context, index) {
              final data = attendanceData[index];
              return _buildPremiumTrackCard(
                title: data['title'] as String,
                subTitle: "Current Status",
                value: data['value'] as String,
                steps: data['steps'] as List<String>,
                activeStep: data['activeStep'] as int,
                color: data['color'] as Color,
                tip: "Tip: Monitoring enabled.",
              );
            },
          ),
      ],
    );
  }

  Widget _buildClassWorkload() {
    final workloadData = [
      {"dept": "B.Tech CSE", "score": "Ongoing", "steps": ["L1", "L2", "L3", "L4"], "activeStep": 1, "color": const Color(0xFF3B82F6)},
      {"dept": "B.Tech ECE", "score": "Pending", "steps": ["Unit 1", "Unit 2", "Mid", "Final"], "activeStep": 0, "color": const Color(0xFFEC4899)},
    ];

    bool isMobile = MediaQuery.of(context).size.width < 850;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Class Management", style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
        const SizedBox(height: 20),
        if (isMobile)
          SizedBox(
            height: 280,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemCount: workloadData.length,
              separatorBuilder: (context, index) => const SizedBox(width: 16),
              itemBuilder: (context, index) {
                final data = workloadData[index];
                return SizedBox(
                  width: MediaQuery.of(context).size.width * 0.85,
                  child: _buildPremiumTrackCard(
                    title: data['dept'] as String,
                    subTitle: "Session Status",
                    value: data['score'] as String,
                    steps: data['steps'] as List<String>,
                    activeStep: data['activeStep'] as int,
                    color: data['color'] as Color,
                    tip: "Pro Tip: Syllabus tracking active.",
                  ),
                );
              },
            ),
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 20,
              crossAxisSpacing: 20,
              childAspectRatio: 1.15,
            ),
            itemCount: workloadData.length,
            itemBuilder: (context, index) {
              final data = workloadData[index];
              return _buildPremiumTrackCard(
                title: data['dept'] as String,
                subTitle: "Session Status",
                value: data['score'] as String,
                steps: data['steps'] as List<String>,
                activeStep: data['activeStep'] as int,
                color: data['color'] as Color,
                tip: "Pro Tip: Consistent syllabus progress.",
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
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF0F172A), letterSpacing: -0.5)),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10)]),
            child: Row(
              children: [
                Container(padding: const EdgeInsets.all(6), decoration: BoxDecoration(color: color.withValues(alpha: 0.1), shape: BoxShape.circle), child: Icon(Icons.check_circle_rounded, color: color, size: 18)),
                const SizedBox(width: 8),
                Text(subTitle, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF64748B))),
                const Spacer(),
                Text(value, style: TextStyle(fontWeight: FontWeight.w900, color: color, fontSize: 13)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Stack(
            children: [
              Container(height: 35, decoration: BoxDecoration(borderRadius: BorderRadius.circular(20), color: const Color(0xFFF1F5F9))),
              LayoutBuilder(builder: (context, constraints) {
                double progress = ((activeStep + 1) / steps.length).clamp(0.0, 1.0);
                return Container(height: 35, width: constraints.maxWidth * progress, decoration: BoxDecoration(borderRadius: BorderRadius.circular(20), gradient: LinearGradient(colors: [color.withValues(alpha: 0.9), color.withValues(alpha: 0.5)])));
              }),
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 0),
                child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: List.generate(steps.length, (i) {
                  bool isActive = i <= activeStep;
                  return Expanded(child: Column(children: [
                    Container(height: 35, alignment: Alignment.center, child: Container(width: 20, height: 20, decoration: BoxDecoration(color: isActive ? Colors.white : Colors.white.withValues(alpha: 0.3), shape: BoxShape.circle), child: Icon(isActive ? Icons.check_rounded : (i == activeStep + 1 ? Icons.add_rounded : null), size: 12, color: isActive ? color : Colors.white70))),
                    const SizedBox(height: 4),
                    Text(steps[i], style: TextStyle(fontSize: 8, fontWeight: FontWeight.bold, color: isActive ? color : const Color(0xFF94A3B8)), textAlign: TextAlign.center),
                  ]));
                })),
              ),
            ],
          ),
          const Spacer(),
          Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), decoration: BoxDecoration(color: color.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(10)), child: Row(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.add_rounded, size: 12, color: color), const SizedBox(width: 6), Text(tip, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: color))])),
        ],
      ),
    ).animate().fadeIn(duration: 600.ms).scale(begin: const Offset(0.95, 0.95), curve: Curves.easeOut).slideY(begin: 0.05, curve: Curves.easeOut);
  }

  Widget _buildSchedulePanel() {
    final schedule = [
      {"subject": "Data Structures", "class": "B.Tech CS 2nd Yr", "time": "09:00 AM - 10:30 AM", "room": "Room 304", "status": "Completed"},
      {"subject": "Algorithms Lab", "class": "B.Tech CS 2nd Yr", "time": "11:00 AM - 01:00 PM", "room": "Lab 2", "status": "Ongoing"},
      {"subject": "Computer Networks", "class": "B.Tech CS 3rd Yr", "time": "02:00 PM - 03:00 PM", "room": "Room 401", "status": "Upcoming"},
      {"subject": "Project Mentoring", "class": "Final Year", "time": "03:30 PM - 04:30 PM", "room": "Faculty Cabin", "status": "Upcoming"},
    ];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 20, offset: const Offset(0, 5))],
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("Today's Schedule", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
              TextButton(onPressed: (){}, child: const Text("View All", style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold))),
            ],
          ),
          const SizedBox(height: 16),
          ...schedule.map((s) => _scheduleItem(s)),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1);
  }

  Widget _scheduleItem(Map<String, String> s) {
    Color statusColor;
    if (s['status'] == 'Completed') {
      statusColor = Colors.green;
    } else if (s['status'] == 'Ongoing') statusColor = Colors.orange;
    else statusColor = Colors.blue;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade100),
      ),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 50,
            decoration: BoxDecoration(color: statusColor, borderRadius: BorderRadius.circular(10)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s['subject']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1E293B))),
                const SizedBox(height: 4),
                Text("${s['class']} • ${s['room']}", style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(s['time']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                child: Text(s['status']!, style: TextStyle(color: statusColor, fontWeight: FontWeight.bold, fontSize: 10)),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRecentActivity() {
    final activities = [
      {"icon": Icons.how_to_reg_rounded, "title": "Attendance marked", "desc": "B.Tech CS 2nd Yr", "time": "2 hours ago", "color": Colors.blue},
      {"icon": Icons.upload_file_rounded, "title": "Results uploaded", "desc": "Mid-term Exam - CN", "time": "4 hours ago", "color": Colors.orange},
      {"icon": Icons.campaign_rounded, "title": "Notice posted", "desc": "Holiday announcement", "time": "Yesterday", "color": Colors.green},
      {"icon": Icons.assignment_turned_in_rounded, "title": "Assignment Graded", "desc": "Data Structures", "time": "Yesterday", "color": Colors.purple},
    ];

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 20, offset: const Offset(0, 5))],
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Recent Activity", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
          const SizedBox(height: 24),
          ...activities.map((a) => Padding(
            padding: const EdgeInsets.only(bottom: 24),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: (a['color'] as Color).withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(a['icon'] as IconData, color: a['color'] as Color, size: 20),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(a['title'] as String, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87)),
                      const SizedBox(height: 4),
                      Text(a['desc'] as String, style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
                    ],
                  ),
                ),
                Text(a['time'] as String, style: TextStyle(color: Colors.grey.shade400, fontSize: 12, fontWeight: FontWeight.bold)),
              ],
            ),
          )),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () {},
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                side: BorderSide(color: Colors.grey.shade300),
              ),
              child: const Text("View All Activity", style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1);
  }
}
