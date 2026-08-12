import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../../core/services/lab_service.dart';

class LabDashboardScreen extends StatefulWidget {
  const LabDashboardScreen({super.key});

  @override
  State<LabDashboardScreen> createState() => _LabDashboardScreenState();
}

class _LabDashboardScreenState extends State<LabDashboardScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _labs = [];
  List<Map<String, dynamic>> _inventory = [];
  List<Map<String, dynamic>> _activities = [];

  int _totalLabs = 0;
  int _totalItems = 0;
  int _lowStockCount = 0;
  int _damagedCount = 0;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        LabService.fetchLabs(),
        LabService.fetchInventory(),
        LabService.fetchRecentActivities(),
      ]);

      if (mounted) {
        setState(() {
          _labs = results[0];
          _inventory = results[1];
          _activities = results[2];

          _totalLabs = _labs.length;
          _totalItems = _inventory.fold(
            0,
            (sum, item) => sum + ((item['quantity'] ?? 0) as num).toInt(),
          );
          _lowStockCount = _inventory
              .where(
                (item) =>
                    ((item['availableQuantity'] ?? 0) as num).toInt() <=
                    ((item['lowStockThreshold'] ?? 5) as num).toInt(),
              )
              .length;
          _damagedCount = _inventory
              .where((item) => item['condition'] == 'Damaged')
              .length;

          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 900;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadAll,
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 32,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Welcome Header
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              "Lab Overview",
                              style: TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.w900,
                                color: Color(0xFF1E293B),
                                letterSpacing: -0.5,
                              ),
                            ).animate().fadeIn().slideX(begin: -0.2),
                            const SizedBox(height: 4),
                            Text(
                              "Manage inventory, equipment, and lab instances.",
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.grey.shade600,
                              ),
                            ).animate().fadeIn(delay: 200.ms),
                          ],
                        ),
                        if (!isMobile)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 12,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: Colors.grey.shade200),
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
                                const Icon(
                                  Icons.calendar_today_rounded,
                                  size: 16,
                                  color: Colors.deepPurple,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  "Today, ${DateFormat('MMMM dd').format(DateTime.now())}",
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: Colors.grey.shade700,
                                    fontSize: 13,
                                  ),
                                ),
                              ],
                            ),
                          ).animate().fadeIn().slideX(begin: 0.2),
                      ],
                    ),
                    const SizedBox(height: 40),

                    // Metrics Cards
                    GridView.count(
                      crossAxisCount: isMobile ? 2 : 4,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      childAspectRatio: isMobile ? 1.0 : 1.3,
                      crossAxisSpacing: 20,
                      mainAxisSpacing: 20,
                      children: [
                        _buildStatCard(
                          "Total Labs",
                          _totalLabs.toString(),
                          Icons.science_rounded,
                          Colors.blue,
                          "Active laboratory facilities",
                          0,
                        ),
                        _buildStatCard(
                          "Total Items",
                          _totalItems.toString(),
                          Icons.inventory_2_rounded,
                          Colors.deepPurple,
                          "Total equipment in stock",
                          1,
                        ),
                        _buildStatCard(
                          "Low Stock Alerts",
                          _lowStockCount.toString(),
                          Icons.warning_rounded,
                          Colors.orange,
                          "Needs immediate restock",
                          2,
                        ),
                        _buildStatCard(
                          "Damaged Items",
                          _damagedCount.toString(),
                          Icons.broken_image_rounded,
                          Colors.red,
                          "Scheduled for repair/disposal",
                          3,
                        ),
                      ],
                    ),

                    const SizedBox(height: 40),

                    // 1. Full Width Bar Chart
                    _buildInventoryChart(),
                    const SizedBox(height: 40),

                    // 2. Side-by-Side Pie Chart & Activities
                    if (isMobile)
                      Column(
                        children: [
                          _buildCategoryChart(),
                          const SizedBox(height: 24),
                          _buildRecentActivities(),
                        ],
                      )
                    else
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(child: _buildCategoryChart()),
                          const SizedBox(width: 24),
                          Expanded(child: _buildRecentActivities()),
                        ],
                      ),
                      
                    const SizedBox(height: 40),

                    // 3. Full Width Lab Status Table
                    _buildLabStatusTable(),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
    String subtitle,
    int index,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade100, width: 2),
        boxShadow: [
          BoxShadow(
            color: color.withValues(alpha: 0.04),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              Icon(
                Icons.arrow_outward_rounded,
                color: Colors.grey.shade300,
                size: 20,
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: const TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                title,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 11,
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ],
      ),
    ).animate(delay: (200 + (index * 100)).ms).fadeIn().slideY(begin: 0.1);
  }

  Widget _buildInventoryChart() {
    final labStats = _getItemsPerLab();
    final sortedKeys = labStats.keys.toList()
      ..sort((a, b) => labStats[b]!.compareTo(labStats[a]!));
    final displayLabs = sortedKeys.take(8).toList();

    return Container(
      height: 350,
      padding: const EdgeInsets.fromLTRB(24, 32, 24, 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade100, width: 2),
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
          const Text(
            "Laboratory Equipment Distribution",
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: Color(0xFF1E293B),
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            "Comparative analysis of inventory levels across facilities",
            style: TextStyle(fontSize: 13, color: Colors.grey.shade500, fontWeight: FontWeight.w500),
          ),
          const SizedBox(height: 40),
          Expanded(
            child: displayLabs.isEmpty
                ? const Center(child: Text("No data available"))
                : BarChart(
                    BarChartData(
                      alignment: BarChartAlignment.spaceAround,
                      maxY: (labStats.values.isNotEmpty
                              ? labStats.values.reduce((a, b) => a > b ? a : b)
                              : 10) * 1.8,
                      barTouchData: BarTouchData(
                        enabled: true,
                        touchTooltipData: BarTouchTooltipData(
                          getTooltipColor: (group) => Colors.deepPurple,
                          getTooltipItem: (group, groupIndex, rod, rodIndex) {
                            return BarTooltipItem(
                              '${rod.toY.round()} units',
                              const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                            );
                          },
                        ),
                      ),
                      titlesData: FlTitlesData(
                        show: true,
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 60,
                            getTitlesWidget: (value, meta) {
                              if (value.toInt() < 0 || value.toInt() >= displayLabs.length) return const SizedBox();
                              final name = displayLabs[value.toInt()];
                              final shortName = name.length > 15 ? "${name.substring(0, 12)}.." : name;
                              return SideTitleWidget(
                                meta: meta,
                                space: 16,
                                child: Transform.rotate(
                                  angle: -0.4,
                                  child: Text(
                                    shortName,
                                    style: TextStyle(
                                      fontWeight: FontWeight.w700, 
                                      fontSize: 10, 
                                      color: Colors.grey.shade600,
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                        leftTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 40,
                            getTitlesWidget: (value, meta) {
                              return Text(
                                value.toInt().toString(),
                                style: TextStyle(color: Colors.grey.shade400, fontSize: 10, fontWeight: FontWeight.bold),
                              );
                            },
                          ),
                        ),
                        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                      ),
                      gridData: FlGridData(
                        show: true,
                        drawVerticalLine: false,
                        horizontalInterval: labStats.values.isNotEmpty && labStats.values.reduce((a, b) => a > b ? a : b) > 0 
                            ? (labStats.values.reduce((a, b) => a > b ? a : b) / 4).clamp(1, 1000).toDouble()
                            : 5,
                        getDrawingHorizontalLine: (value) => FlLine(color: Colors.grey.shade100, strokeWidth: 1),
                      ),
                      borderData: FlBorderData(show: false),
                      barGroups: List.generate(displayLabs.length, (i) {
                        final maxVal = labStats.values.isNotEmpty 
                            ? labStats.values.reduce((a, b) => a > b ? a : b).toDouble() 
                            : 10.0;
                        return _makeGroupData(i, labStats[displayLabs[i]]!.toDouble(), maxVal);
                      }),
                    ),
                  ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.1);
  }




  Map<String, int> _getItemsPerLab() {
    Map<String, int> map = {
      for (var l in _labs) l['labName'] ?? 'Unnamed Lab': 0
    };
    for (var item in _inventory) {
      final labName = item['lab'] is Map
          ? (item['lab']['labName'] ?? 'N/A')
          : 'N/A';
      if (map.containsKey(labName)) {
        map[labName] = map[labName]! + ((item['quantity'] ?? 0) as num).toInt();
      }
    }
    return map;
  }

  BarChartGroupData _makeGroupData(int x, double y, double maxVal) {
    return BarChartGroupData(
      x: x,
      barRods: [
        BarChartRodData(
          toY: y,
          color: Colors.deepPurple,
          width: 18,
          borderRadius: BorderRadius.circular(6),
          backDrawRodData: BackgroundBarChartRodData(
            show: true,
            toY: maxVal * 1.6,
            color: Colors.grey.shade100,
          ),
        ),
      ],
    );
  }

  Widget _buildCategoryChart() {
    final stats = _getCategoryStats();
    final categories = stats.keys.toList();
    final colors = [Colors.deepPurple, Colors.blue, Colors.orange, Colors.red, Colors.green, Colors.amber];

    return Container(
      height: 420,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade100, width: 2),
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
          const Text("By Category", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          const SizedBox(height: 32),
          Expanded(
            child: stats.isEmpty 
              ? const Center(child: Text("No data"))
              : PieChart(
                  PieChartData(
                    sectionsSpace: 4,
                    centerSpaceRadius: 40,
                    sections: List.generate(categories.length, (i) {
                      final cat = categories[i];
                      final val = stats[cat]!;
                      return PieChartSectionData(
                        color: colors[i % colors.length],
                        value: val.toDouble(),
                        title: '${((val / (_totalItems > 0 ? _totalItems : 1)) * 100).toStringAsFixed(0)}%',
                        radius: 50,
                        titleStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white),
                      );
                    }),
                  ),
                ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 12,
            runSpacing: 8,
            children: List.generate(categories.length, (i) {
              return Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(width: 10, height: 10, decoration: BoxDecoration(color: colors[i % colors.length], shape: BoxShape.circle)),
                  const SizedBox(width: 4),
                  Text(categories[i], style: TextStyle(fontSize: 11, color: Colors.grey.shade600, fontWeight: FontWeight.w600)),
                ],
              );
            }),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 700.ms);
  }

  Map<String, int> _getCategoryStats() {
    Map<String, int> map = {};
    for (var item in _inventory) {
      final cat = item['category'] ?? 'Other';
      map[cat] = (map[cat] ?? 0) + ((item['quantity'] ?? 0) as num).toInt();
    }
    return map;
  }

  Widget _buildLabStatusTable() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade100, width: 2),
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
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: const Text("Laboratory Status", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
          ),
          const SizedBox(height: 24),
          LayoutBuilder(
            builder: (context, constraints) {
              return SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: ConstrainedBox(
                  constraints: BoxConstraints(minWidth: constraints.maxWidth),
                  child: DataTable(
                    horizontalMargin: 24,
                    columnSpacing: (constraints.maxWidth - 500) / 5 > 24 ? (constraints.maxWidth - 500) / 5 : 24,
                    columns: const [
                      DataColumn(label: Text("LAB NAME", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey))),
                      DataColumn(label: Text("TYPE", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey))),
                      DataColumn(label: Text("ROOM", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey))),
                      DataColumn(label: Text("CAPACITY", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey))),
                      DataColumn(label: Text("STATUS", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey))),
                    ],
                    rows: _labs.map((lab) {
                      return DataRow(cells: [
                        DataCell(Text(lab['labName'] ?? 'N/A', style: const TextStyle(fontWeight: FontWeight.w600))),
                        DataCell(Text(lab['labType'] ?? 'N/A')),
                        DataCell(Text(lab['roomNumber'] ?? 'N/A')),
                        DataCell(Text(lab['capacity']?.toString() ?? '0')),
                        DataCell(
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(8)),
                            child: Text("Active", style: TextStyle(color: Colors.green.shade700, fontSize: 10, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ]);
                    }).toList(),
                  ),
                ),
              );
            },
          ),
        ],
      ),
    ).animate().fadeIn(delay: 900.ms);
  }


  Widget _buildRecentActivities() {
    return Container(
      height: 420,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade100, width: 2),
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
              const Text(
                "Recent Actions",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: Color(0xFF1E293B),
                ),
              ),
              InkWell(
                onTap: () {},
                child: const Text(
                  "View All",
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w700,
                    color: Colors.deepPurple,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Expanded(
            child: _activities.isEmpty
                ? const Center(child: Text("No recent actions recorded."))
                : ListView.builder(
                    physics: const BouncingScrollPhysics(),
                    itemCount: _activities.length > 10
                        ? 10
                        : _activities.length,
                    itemBuilder: (context, index) {
                      final act = _activities[index];
                      final itemName = act['item'] is Map
                          ? (act['item']['itemName'] ?? 'Item')
                          : 'Item';
                      final status = act['status'] ?? 'Issued';
                      final time = act['createdAt'] != null
                          ? _timeAgo(DateTime.parse(act['createdAt']))
                          : '---';

                      IconData icon = Icons.science_rounded;
                      Color color = Colors.blue;
                      if (status == 'Returned') {
                        icon = Icons.keyboard_return_rounded;
                        color = Colors.green;
                      }
                      if (status == 'Overdue') {
                        icon = Icons.warning_rounded;
                        color = Colors.orange;
                      }
                      if (status == 'Damaged' || status == 'Lost') {
                        icon = Icons.broken_image_rounded;
                        color = Colors.red;
                      }

                      return _buildActivityItem(
                        itemName,
                        "$status by ${act['issuedToName'] ?? 'Unknown'}",
                        time,
                        icon,
                        color,
                      );
                    },
                  ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 800.ms).slideX(begin: 0.1);
  }

  Widget _buildActivityItem(
    String title,
    String subtitle,
    String time,
    IconData icon,
    Color color,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: color, size: 18),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  subtitle,
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          Text(
            time,
            style: TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade400,
            ),
          ),
        ],
      ),
    );
  }

  String _timeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inDays > 0) return '${diff.inDays}d ago';
    if (diff.inHours > 0) return '${diff.inHours}h ago';
    if (diff.inMinutes > 0) return '${diff.inMinutes}m ago';
    return 'Just now';
  }
}
