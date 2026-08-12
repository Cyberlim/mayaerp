import 'package:flutter/material.dart';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';
import 'package:flutter_animate/flutter_animate.dart';

class ReportsSettingsScreen extends StatefulWidget {
  const ReportsSettingsScreen({super.key});

  @override
  State<ReportsSettingsScreen> createState() => _ReportsSettingsScreenState();
}

class _ReportsSettingsScreenState extends State<ReportsSettingsScreen> {
  String _selectedCategory = "Academic";

  final List<Map<String, dynamic>> _recentLogs = [
    {
      "user": "Admin (Rohit)",
      "action": "Issued 12 Books",
      "time": "12:40 PM",
      "type": "Library",
    },
    {
      "user": "Staff (Anita)",
      "action": "Updated Fee Structure",
      "time": "11:20 AM",
      "type": "Finance",
    },
    {
      "user": "System",
      "action": "Auto-Backup successful",
      "time": "09:00 AM",
      "type": "Security",
    },
    {
      "user": "Admin (Rohit)",
      "action": "Created New Bus Route",
      "time": "Yesterday",
      "type": "Transport",
    },
    {
      "user": "Staff (Vikas)",
      "action": "Published Exam Result",
      "time": "Yesterday",
      "type": "Academic",
    },
  ];

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        bool isMobile = constraints.maxWidth < 1100;

        return Scaffold(
          backgroundColor: const Color(0xFFF8F6F6),
          body: Column(
            children: [
              _buildHeader(isMobile),
              Expanded(
                child: isMobile
                    ? SingleChildScrollView(
                        child: Column(
                          children: [
                            Padding(
                              padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildIntelligenceSummary(true),
                                  const SizedBox(height: 32),
                                  _buildReportCategoryTabs(true),
                                  const SizedBox(height: 24),
                                  _buildDownloadableReportsGrid(true),
                                  const SizedBox(height: 32),
                                  _buildSystemIntegrityBanner(true),
                                ],
                              ),
                            ),
                            Container(
                              width: double.infinity,
                              color: Colors.white,
                              padding: const EdgeInsets.symmetric(
                                horizontal: 20,
                                vertical: 40,
                              ),
                              child: _buildAuditSidebar(true),
                            ),
                          ],
                        ),
                      )
                    : Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            flex: 3,
                            child: SingleChildScrollView(
                              padding: const EdgeInsets.all(40),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _buildIntelligenceSummary(false),
                                  const SizedBox(height: 48),
                                  _buildReportCategoryTabs(false),
                                  const SizedBox(height: 32),
                                  _buildDownloadableReportsGrid(false),
                                  const SizedBox(height: 60),
                                  _buildSystemIntegrityBanner(false),
                                ],
                              ),
                            ),
                          ),
                          _buildAuditSidebar(false),
                        ],
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildHeader(bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 20 : 40,
        vertical: isMobile ? 16 : 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFF1F1F1))),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      "MIS Intelligence",
                      style: AppTheme.titleStyle.copyWith(
                        fontSize: isMobile ? 20 : 26,
                        fontWeight: FontWeight.w900,
                        letterSpacing: -0.5,
                      ),
                    ),
                    if (!isMobile) ...[
                      const SizedBox(height: 4),
                      Text(
                        "Central surveillance hub for institutional data",
                        style: TextStyle(
                          color: Colors.grey.shade500,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              if (!isMobile)
                Row(
                  children: [
                    _headerActionBtn(
                      Icons.cloud_download_rounded,
                      "Global Backup",
                      Colors.black,
                      Colors.white,
                    ),
                    const SizedBox(width: 16),
                    _headerActionBtn(
                      Icons.print_rounded,
                      "Print Summary",
                      Colors.white,
                      Colors.black,
                    ),
                  ],
                ),
            ],
          ),
          if (isMobile) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _headerActionBtn(
                    Icons.cloud_download_rounded,
                    "Backup",
                    Colors.black,
                    Colors.white,
                    isMobile: true,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _headerActionBtn(
                    Icons.print_rounded,
                    "Summary",
                    Colors.white,
                    Colors.black,
                    isMobile: true,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _headerActionBtn(
    IconData icon,
    String label,
    Color bg,
    Color fg, {
    bool isMobile = false,
  }) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 12 : 20,
        vertical: isMobile ? 12 : 14,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(isMobile ? 10 : 12),
        border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: fg, size: isMobile ? 16 : 18),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              color: fg,
              fontWeight: FontWeight.bold,
              fontSize: isMobile ? 12 : 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildIntelligenceSummary(bool isMobile) {
    if (isMobile) {
      return Column(
        children: [
          _statBox(
            "Active Insight",
            "98.2%",
            "System Integrity",
            Colors.green,
            isMobile: true,
          ),
          const SizedBox(height: 16),
          _statBox(
            "Audit Vol.",
            "1.24M",
            "Log Actions",
            Colors.blue,
            isMobile: true,
          ),
          const SizedBox(height: 16),
          _statBox(
            "Reports",
            "420",
            "Generated",
            Colors.orange,
            isMobile: true,
          ),
        ],
      ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1);
    }
    return Row(
      children: [
        _statBox("Active Insight", "98.2%", "System Integrity", Colors.green),
        const SizedBox(width: 24),
        _statBox("Audit Vol.", "1.24M", "Total Logged Actions", Colors.blue),
        const SizedBox(width: 24),
        _statBox("Reports", "420", "Generated this month", Colors.orange),
      ],
    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1);
  }

  Widget _statBox(
    String label,
    String val,
    String sub,
    Color color, {
    bool isMobile = false,
  }) {
    Widget content = Container(
      padding: EdgeInsets.all(isMobile ? 20 : 32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(isMobile ? 16 : 24),
        border: Border.all(color: Colors.black.withValues(alpha: 0.03)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 9,
                fontWeight: FontWeight.w900,
                letterSpacing: 1,
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            val,
            style: TextStyle(
              fontSize: isMobile ? 24 : 32,
              fontWeight: FontWeight.w900,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            sub,
            style: TextStyle(fontSize: 11, color: Colors.grey.shade400),
          ),
        ],
      ),
    );

    return isMobile ? content : Expanded(child: content);
  }

  Widget _buildReportCategoryTabs(bool isMobile) {
    final categories = [
      "Academic",
      "Finance",
      "Transport",
      "Staff",
      "Security",
    ];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: categories.map((cat) {
          bool active = _selectedCategory == cat;
          return Padding(
            padding: const EdgeInsets.only(right: 12),
            child: InkWell(
              onTap: () => setState(() => _selectedCategory = cat),
              borderRadius: BorderRadius.circular(12),
              child: Container(
                padding: EdgeInsets.symmetric(
                  horizontal: isMobile ? 20 : 24,
                  vertical: isMobile ? 12 : 14,
                ),
                decoration: BoxDecoration(
                  color: active ? AppColors.primaryRed : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  cat,
                  style: TextStyle(
                    color: active ? Colors.white : Colors.black,
                    fontWeight: FontWeight.bold,
                    fontSize: isMobile ? 13 : 14,
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildDownloadableReportsGrid(bool isMobile) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: isMobile ? 1 : 2,
        mainAxisSpacing: isMobile ? 12 : 24,
        crossAxisSpacing: isMobile ? 12 : 24,
        childAspectRatio: isMobile ? 3.0 : 2.5,
      ),
      itemCount: 4,
      itemBuilder: (context, i) => _reportDownloadCard(i, isMobile),
    );
  }

  Widget _reportDownloadCard(int i, bool isMobile) {
    final titles = [
      "Perf. Index",
      "Fee Collection",
      "Staff Audit",
      "Utilization",
    ];
    final fullTitles = [
      "Semester Performance Index",
      "Fee Collection Ledger",
      "Staff Payroll Audit",
      "Resource Utilization",
    ];
    return Container(
          padding: EdgeInsets.all(isMobile ? 16 : 24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(isMobile ? 20 : 24),
          ),
          child: Row(
            children: [
              Container(
                padding: EdgeInsets.all(isMobile ? 12 : 16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F6F6),
                  borderRadius: BorderRadius.circular(isMobile ? 12 : 16),
                ),
                child: Icon(
                  Icons.description_rounded,
                  color: Colors.black,
                  size: isMobile ? 20 : 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      isMobile ? titles[i] : fullTitles[i],
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: isMobile ? 14 : 15,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      "2h ago • PDF",
                      style: TextStyle(
                        color: Colors.grey.shade400,
                        fontSize: isMobile ? 10 : 11,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
                onPressed: () {},
                icon: const Icon(
                  Icons.file_download_rounded,
                  color: AppColors.primaryRed,
                  size: 20,
                ),
              ),
            ],
          ),
        )
        .animate()
        .fadeIn(delay: (i * 100).ms)
        .scale(begin: const Offset(0.95, 0.95));
  }

  Widget _buildAuditSidebar(bool isMobile) {
    if (isMobile) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "REAL-TIME LOGS",
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w900,
              color: Colors.grey,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 24),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _recentLogs.length,
            itemBuilder: (context, i) => _auditLogRow(_recentLogs[i], isMobile),
          ),
          const SizedBox(height: 32),
          _protectedBox(true),
        ],
      );
    }
    return Container(
      width: 400,
      color: Colors.white,
      padding: const EdgeInsets.all(40),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "REAL-TIME LOGS",
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w900,
              color: Colors.grey,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 32),
          Expanded(
            child: ListView.builder(
              itemCount: _recentLogs.length,
              itemBuilder: (context, i) => _auditLogRow(_recentLogs[i], false),
            ),
          ),
          const SizedBox(height: 32),
          _protectedBox(false),
        ],
      ),
    );
  }

  Widget _protectedBox(bool isMobile) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(isMobile ? 20 : 24),
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(isMobile ? 16 : 20),
      ),
      child: Column(
        children: [
          const Icon(Icons.vpn_lock_rounded, color: Colors.greenAccent),
          const SizedBox(height: 16),
          const Text(
            "Protected Instance",
            style: TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "AES-256 Encrypted Traffic",
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.5),
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }

  Widget _auditLogRow(Map<String, dynamic> log, bool isMobile) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 8,
            height: 8,
            margin: const EdgeInsets.only(top: 6),
            decoration: const BoxDecoration(
              color: AppColors.primaryRed,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  log['user'],
                  style: const TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  log['action'],
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.textMain,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(
                      log['time'],
                      style: TextStyle(
                        color: Colors.grey.shade400,
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      width: 4,
                      height: 4,
                      decoration: const BoxDecoration(
                        color: Colors.grey,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      log['type'],
                      style: const TextStyle(
                        color: Colors.blue,
                        fontWeight: FontWeight.bold,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSystemIntegrityBanner(bool isMobile) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.all(isMobile ? 24 : 40),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: [Colors.black, Colors.grey.shade900]),
        borderRadius: BorderRadius.circular(isMobile ? 24 : 32),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(
                Icons.analytics_rounded,
                color: Colors.white,
                size: isMobile ? 32 : 48,
              ),
              SizedBox(width: isMobile ? 20 : 32),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isMobile
                          ? "Audit Integrity: High"
                          : "Data Integrity Score: Excellent",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: isMobile ? 18 : 20,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    if (!isMobile) ...[
                      const SizedBox(height: 8),
                      Text(
                        "All institutional data metrics are synchronized.",
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.6),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: isMobile ? double.infinity : null,
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.black,
                padding: EdgeInsets.symmetric(
                  horizontal: isMobile ? 20 : 32,
                  vertical: isMobile ? 16 : 20,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text("Run Global Diagnostic"),
            ),
          ),
        ],
      ),
    );
  }
}
