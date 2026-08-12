import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../admin/widgets/premium_stats_card.dart';
import '../../../widgets/bubble_animation.dart';
import '../../../core/services/library_service.dart';
import 'package:intl/intl.dart';

import 'inventory_screen.dart';
import 'fines_screen.dart';
import 'members_screen.dart';
import 'transactions_screen.dart';
import 'library_settings_screen.dart';
import 'add_book_screen.dart';
import 'issue_book_screen.dart';

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

class LibraryDashboardScreen extends StatefulWidget {
  const LibraryDashboardScreen({super.key});

  @override
  State<LibraryDashboardScreen> createState() => _LibraryDashboardScreenState();
}

class _LibraryDashboardScreenState extends State<LibraryDashboardScreen> {
  bool _showAllActions = false;
  bool _isLoading = true;
  Map<String, dynamic> _stats = {
    'totalUniqueBooks': 0,
    'totalStock': 0,
    'activeIssues': 0,
    'overdue': 0,
    'uniqueActiveConsumers': 0,
    'totalFineDues': 0,
  };
  List<dynamic> _recentCirculation = [];
  List<dynamic> _overdueBooks = [];

  // Individual timelines for each card
  String _tlInventory = "All";
  String _tlIssues = "1W";
  String _tlStudents = "1M";
  String _tlFines = "All";

  final List<Map<String, dynamic>> _quickActions = [
    {"icon": Icons.add_box_rounded, "label": "Add Books", "color": Color(0xFF4F46E5), "screen": const AddBookScreen()},
    {"icon": Icons.outbox_rounded, "label": "Issue Book", "color": Color(0xFF10B981), "screen": const IssueBookScreen()},
    {"icon": Icons.inbox_rounded, "label": "Return Book", "color": Color(0xFFF59E0B), "screen": const IssueBookScreen()},
    {"icon": Icons.people_alt_rounded, "label": "Members", "color": Color(0xFF8B5CF6), "screen": const MembersScreen()},
    {"icon": Icons.monetization_on_rounded, "label": "Fines", "color": Color(0xFFF43F5E), "screen": const FinesScreen()},
    {"icon": Icons.receipt_long_rounded, "label": "Transactions", "color": Color(0xFF06B6D4), "screen": const TransactionsScreen()},
    {"icon": Icons.inventory_2_rounded, "label": "Inventory", "color": Color(0xFF64748B), "screen": const InventoryScreen()},
    {"icon": Icons.settings_rounded, "label": "Settings", "color": Color(0xFFEC4899), "screen": const LibrarySettingsScreen()},
  ];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      setState(() => _isLoading = true);
      final statsData = await LibraryService.getLibraryStats();
      final circData = await LibraryService.getCirculation();
      
      setState(() {
        _stats = statsData;
        _recentCirculation = circData;
        _overdueBooks = circData.where((c) => c['status'] == 'Overdue').toList();
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        debugPrint("Error loading dashboard data: $e");
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        double width = constraints.maxWidth;
        bool isMobile = width < 850;
        
        return Scaffold(
          backgroundColor: isMobile ? Colors.transparent : const Color(0xFFF8FAFC),
          body: _isLoading 
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _loadData,
                child: SingleChildScrollView(
                  padding: EdgeInsets.symmetric(horizontal: isMobile ? 16 : 32, vertical: isMobile ? 8 : 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildPremiumStats(width),
                      const SizedBox(height: 32),
                      
                      if (isMobile) ...[
                        _buildMobileQuickActions(width),
                        const SizedBox(height: 32),
                        _buildChartCard(),
                        const SizedBox(height: 32),
                        _buildRecentTransactions(),
                        const SizedBox(height: 32),
                        _buildOverduePanel(),
                      ] else ...[
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              flex: 2,
                              child: Column(
                                children: [
                                  _buildChartCard(),
                                  const SizedBox(height: 32),
                                  _buildQuickActionsDesktop(),
                                ],
                              ),
                            ),
                            const SizedBox(width: 32),
                            Expanded(
                              flex: 1, 
                              child: Column(
                                children: [
                                  _buildOverduePanel(),
                                  const SizedBox(height: 32),
                                  _buildRecentTransactionsSide(),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 32),
                    ],
                  ),
                ),
              ),
        );
      },
    );
  }

  Widget _buildPremiumStats(double width) {
    bool isMobile = width < 850;

    // Helper to filter data by time
    int getFilteredCount(String timeline) {
       DateTime now = DateTime.now();
       if (timeline == "All") return _recentCirculation.length;
       
       Duration duration;
       if (timeline == "1H") {
         duration = const Duration(hours: 1);
       } else if (timeline == "1W") duration = const Duration(days: 7);
       else if (timeline == "1M") duration = const Duration(days: 30);
       else if (timeline == "1Y") duration = const Duration(days: 365);
       else duration = const Duration(days: 3650);

       return _recentCirculation.where((c) {
         if (c['issueDate'] == null) return false;
         return DateTime.parse(c['issueDate']).isAfter(now.subtract(duration));
       }).length;
    }

    final kpiCards = [
      PremiumStatsCard(
        title: "Total Inventory",
        subValue: "Total Book Volume",
        value: NumberFormat.decimalPattern().format(_stats['totalStock'] ?? 0),
        percentage: "Unique Title: ${_stats['totalUniqueBooks'] ?? 0}",
        icon: Icons.inventory_2_rounded,
        gradientColors: const [Color(0xFF6366F1), Color(0xFF4F46E5)],
        chartColor: const Color(0xFF6366F1),
        chartPoints: const [Offset(0, 0.5), Offset(1, 0.7), Offset(2, 0.6), Offset(3, 0.8), Offset(4, 0.9), Offset(5, 1.0)],
        selectedTimeline: _tlInventory,
        onTimelineChanged: (val) => setState(() => _tlInventory = val),
        bottomLabel1: "Added",
        bottomValue1: "${getFilteredCount(_tlInventory)}",
        bottomLabel2: "Growth",
        bottomValue2: "+2.4%",
        bottomLabel3: "Stock",
        bottomValue3: "${_stats['totalStock'] ?? 0}",
      ),
      PremiumStatsCard(
        title: "Issued Books",
        subValue: "Current Circulation",
        value: "${_stats['activeIssues'] ?? 0} Books",
        percentage: "Overdue: ${_stats['overdue'] ?? 0}",
        icon: Icons.outbox_rounded,
        gradientColors: const [Color(0xFF10B981), Color(0xFF059669)],
        chartColor: const Color(0xFF10B981),
        chartPoints: const [Offset(0, 0.2), Offset(1, 0.4), Offset(2, 0.3), Offset(3, 0.5), Offset(4, 0.4), Offset(5, 0.8)],
        selectedTimeline: _tlIssues,
        onTimelineChanged: (val) => setState(() => _tlIssues = val),
        bottomLabel1: "Timeline Total",
        bottomValue1: "${getFilteredCount(_tlIssues)}",
        bottomLabel2: "Active Now",
        bottomValue2: "${getFilteredCount('1H')}",
        bottomLabel3: "Weekly Avg",
        bottomValue3: (getFilteredCount('1W') / 7).toStringAsFixed(1),
      ),
      PremiumStatsCard(
        title: "Active Students",
        subValue: "Unique Consumers",
        value: "${_stats['uniqueActiveConsumers'] ?? 0} Students",
        percentage: "Currently Active",
        icon: Icons.people_alt_rounded,
        gradientColors: const [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
        chartColor: const Color(0xFF8B5CF6),
        chartPoints: const [Offset(0, 0.4), Offset(1, 0.5), Offset(2, 0.3), Offset(3, 0.6), Offset(4, 0.5), Offset(5, 0.7)],
        selectedTimeline: _tlStudents,
        onTimelineChanged: (val) => setState(() => _tlStudents = val),
        bottomLabel1: "Reached",
        bottomValue1: "${getFilteredCount(_tlStudents)}",
        bottomLabel2: "New Today",
        bottomValue2: "${getFilteredCount('1H')}",
        bottomLabel3: "Retention",
        bottomValue3: "92%",
      ),
      PremiumStatsCard(
        title: "Fine Statistics",
        subValue: "Total Pending Dues",
        value: "₹ ${NumberFormat.decimalPattern().format(_stats['totalFineDues'] ?? 0)}",
        percentage: "Action Required",
        icon: Icons.monetization_on_rounded,
        gradientColors: const [Color(0xFFF43F5E), Color(0xFFE11D48)],
        chartColor: const Color(0xFFF43F5E),
        chartPoints: const [Offset(0, 0.4), Offset(1, 0.5), Offset(2, 0.3), Offset(3, 0.6), Offset(4, 0.5), Offset(5, 0.9)],
        selectedTimeline: _tlFines,
        onTimelineChanged: (val) => setState(() => _tlFines = val),
        bottomLabel1: "Collected",
        bottomValue1: "₹ 0",
        bottomLabel2: "Dues Now",
        bottomValue2: "₹ ${_stats['totalFineDues'] ?? 0}",
        bottomLabel3: "Recovery",
        bottomValue3: "85%",
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
            return _buildActionButton(
              action['icon'], 
              action['label'], 
              action['color'],
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => action['screen'])),
            );
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
            return _actionBtnDesktop(
              action['label'], 
              action['icon'], 
              action['color'],
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => action['screen'])),
            );
          },
        ),
      ],
    );
  }

  Widget _actionBtnDesktop(String title, IconData icon, Color color, {VoidCallback? onTap}) {
    return HoverScaleCard(
      onTap: onTap,
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

  Widget _buildRecentTransactionsSide() {
    final recent = _recentCirculation.take(5).toList();
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("Activity Log", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              TextButton(onPressed: () {}, child: const Text("All")),
            ],
          ),
          const SizedBox(height: 16),
          if (recent.isEmpty)
             const Padding(padding: EdgeInsets.all(20), child: Center(child: Text("No recent activity", style: TextStyle(color: Colors.grey)))),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: recent.length,
            separatorBuilder: (context, index) => const Divider(height: 24),
            itemBuilder: (context, index) {
              final c = recent[index];
              bool isReturn = c['status'] == 'Returned';
              return Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: (isReturn ? const Color(0xFF10B981) : const Color(0xFF4F46E5)).withValues(alpha: 0.1), 
                      borderRadius: BorderRadius.circular(10)
                    ),
                    child: Icon(
                      isReturn ? Icons.check_circle_rounded : Icons.outbox_rounded, 
                      color: isReturn ? const Color(0xFF10B981) : const Color(0xFF4F46E5), 
                      size: 16
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(c['book']?['title'] ?? "Unknown Book", style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                        Text("${isReturn ? 'Returned' : 'Issued'} by ${c['student']?['firstName'] ?? ''}", style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildChartCard() {
    return Container(
      height: 400,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text("Book Issue Trends", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  Text("Last 7 Days Activity", style: TextStyle(fontSize: 13, color: Colors.grey.shade500)),
                ],
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFF4F46E5).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  "Real Data",
                  style: TextStyle(color: Color(0xFF4F46E5), fontSize: 12, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          const SizedBox(height: 32),
          Expanded(
            child: Builder(
              builder: (context) {
                // Calculate dynamic MaxY
                double maxVal = 10;
                for (int i = 0; i < 7; i++) {
                  final dayDate = DateTime.now().subtract(Duration(days: 6 - i));
                  final issues = _recentCirculation.where((c) {
                    if (c['issueDate'] == null) return false;
                    final issueDate = DateTime.parse(c['issueDate']);
                    return issueDate.year == dayDate.year && issueDate.month == dayDate.month && issueDate.day == dayDate.day;
                  }).length;
                  final returns = _recentCirculation.where((c) {
                    if (c['returnDate'] == null) return false;
                    final returnDate = DateTime.parse(c['returnDate']);
                    return returnDate.year == dayDate.year && returnDate.month == dayDate.month && returnDate.day == dayDate.day;
                  }).length;
                  if (issues > maxVal) maxVal = issues.toDouble();
                  if (returns > maxVal) maxVal = returns.toDouble();
                }
                
                return BarChart(
                  BarChartData(
                    alignment: BarChartAlignment.spaceAround,
                    maxY: maxVal + 5,
                    barTouchData: BarTouchData(enabled: false),
                titlesData: FlTitlesData(
                  show: true,
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        final now = DateTime.now();
                        final days = List.generate(7, (i) => DateFormat('E').format(now.subtract(Duration(days: 6 - i))));
                        if (value >= 0 && value < days.length) {
                          return Padding(
                            padding: const EdgeInsets.only(top: 8.0),
                            child: Text(
                              days[value.toInt()],
                              style: TextStyle(color: Colors.grey.shade600, fontSize: 10, fontWeight: FontWeight.bold),
                            ),
                          );
                        }
                        return const SizedBox();
                      },
                    ),
                  ),
                  leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 5,
                  getDrawingHorizontalLine: (value) => FlLine(color: Colors.grey.shade100, strokeWidth: 1),
                ),
                borderData: FlBorderData(show: false),
                barGroups: List.generate(7, (index) {
                  final dayOffset = 6 - index;
                  final dayDate = DateTime.now().subtract(Duration(days: dayOffset));
                  
                  // Count issues on this day
                  final issues = _recentCirculation.where((c) {
                    if (c['issueDate'] == null) return false;
                    final issueDate = DateTime.parse(c['issueDate']);
                    return issueDate.year == dayDate.year && 
                           issueDate.month == dayDate.month && 
                           issueDate.day == dayDate.day;
                  }).length;

                  // Count returns on this day
                  final returns = _recentCirculation.where((c) {
                    if (c['returnDate'] == null) return false;
                    final returnDate = DateTime.parse(c['returnDate']);
                    return returnDate.year == dayDate.year && 
                           returnDate.month == dayDate.month && 
                           returnDate.day == dayDate.day;
                  }).length;

                  return _makeBar(index, issues.toDouble(), returns.toDouble());
                }),
              ),
            );
          },
        ),
      ),
    ],
  ),
).animate().fadeIn(delay: 200.ms).slideX(begin: -0.1);
}

  BarChartGroupData _makeBar(int x, double y1, double y2) {
    return BarChartGroupData(
      x: x,
      barRods: [
        BarChartRodData(
          toY: y1,
          color: const Color(0xFF4F46E5),
          width: 12,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
        ),
        BarChartRodData(
          toY: y2,
          color: const Color(0xFF10B981),
          width: 12,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
        ),
      ],
    );
  }

  Widget _buildOverduePanel() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.red.withValues(alpha: 0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.red.withValues(alpha: 0.05),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.red.shade50,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              border: Border(bottom: BorderSide(color: Colors.red.shade100)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        "Overdue Books",
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Colors.red),
                      ),
                      const SizedBox(height: 4),
                      Text("Requires immediate action", style: TextStyle(fontSize: 13, color: Colors.red.shade400)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(20)),
                  child: Text("${_overdueBooks.length} Pending", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                ),
              ],
            ),
          ),
          if (_overdueBooks.isEmpty)
             const Padding(padding: EdgeInsets.all(40), child: Center(child: Text("No overdue books! Excellent.", style: TextStyle(color: Colors.grey)))),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            itemCount: _overdueBooks.take(4).length,
            separatorBuilder: (context, index) => const Divider(),
            itemBuilder: (context, index) {
              final c = _overdueBooks[index];
              return ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                leading: Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(8)),
                  child: const Icon(Icons.book_rounded, color: Colors.grey),
                ),
                title: Text(c['book']?['title'] ?? "Unknown Book", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                subtitle: Text("Student: ${c['student']?['firstName']} • ₹${c['fine']} fine", style: TextStyle(color: Colors.red.shade400, fontSize: 12)),
                trailing: IconButton(
                  onPressed: () {},
                  icon: const Icon(Icons.notification_important_rounded),
                  color: Colors.amber,
                  tooltip: "Send Reminder",
                ),
              );
            },
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: SizedBox(
              width: double.infinity,
              child: OutlinedButton(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TransactionsScreen())),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red,
                  side: const BorderSide(color: Colors.red),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text("View All Overdue Books"),
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms).slideX(begin: 0.1);
  }

  Widget _buildRecentTransactions() {
    final recent = _recentCirculation.take(5).toList();
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade100),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("Recent Transactions", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              TextButton(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const TransactionsScreen())), 
                child: const Text("View All")
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (recent.isEmpty)
             const Padding(padding: EdgeInsets.all(40), child: Center(child: Text("No transactions found", style: TextStyle(color: Colors.grey)))),
          if (recent.isNotEmpty)
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: DataTable(
                headingTextStyle: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade600, fontSize: 12),
                columns: const [
                  DataColumn(label: Text('BOOK TITLE')),
                  DataColumn(label: Text('STUDENT')),
                  DataColumn(label: Text('DATE')),
                  DataColumn(label: Text('TYPE')),
                  DataColumn(label: Text('STATUS')),
                ],
                rows: recent.map((c) {
                  bool isReturn = c['status'] == 'Returned';
                  final dateStr = c['issueDate'] != null 
                     ? DateFormat('MMM dd').format(DateTime.parse(c['issueDate'])) 
                     : "N/A";
                  return DataRow(
                    cells: [
                      DataCell(Row(
                        children: [
                          const Icon(Icons.menu_book_rounded, size: 16, color: Colors.grey),
                          const SizedBox(width: 8),
                          Text(c['book']?['title'] ?? 'N/A', style: const TextStyle(fontWeight: FontWeight.w600)),
                        ],
                      )),
                      DataCell(Text(c['student']?['firstName'] ?? 'N/A')),
                      DataCell(Text(dateStr)),
                      DataCell(
                         Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: !isReturn ? Colors.blue.withValues(alpha: 0.1) : Colors.green.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            !isReturn ? "ISSUE" : "RETURN",
                            style: TextStyle(
                              color: !isReturn ? Colors.blue : Colors.green,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        )
                      ),
                      DataCell(Text(c['status'], style: TextStyle(color: c['status'] == 'Overdue' ? Colors.red : Colors.green, fontWeight: FontWeight.w600))),
                    ],
                  );
                }).toList(),
              ),
            ),
        ],
      ),
    ).animate().fadeIn(delay: 400.ms).slideY(begin: 0.1);
  }
}
