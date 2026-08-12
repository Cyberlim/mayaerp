import 'package:flutter/material.dart';
import '../../../core/app_theme.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/fee_service.dart';
import '../../../core/services/course_service.dart';
import '../../../core/services/student_service.dart';
import '../../../core/services/socket_service.dart';
import 'package:intl/intl.dart';
import 'create_payout_screen.dart';

class FinanceFeesScreen extends StatefulWidget {
  const FinanceFeesScreen({super.key});

  @override
  State<FinanceFeesScreen> createState() => _FinanceFeesScreenState();
}

class _FinanceFeesScreenState extends State<FinanceFeesScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<dynamic> _transactions = [];
  List<dynamic> _courses = [];
  List<dynamic> _students = [];
  bool _isLoading = true;
  double _totalCollected = 0;
  double _totalReceivable = 0;
  int _activeStudentCount = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadInitialData();
    _setupSocketListener();
  }

  void _setupSocketListener() {
    SocketService.onNewFeePayment((data) {
      if (mounted) {
        _loadInitialData(); // Refresh all data on new payment
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text("Institutional Alert: New Payment of ₹${data['amount']} received from ${data['studentName']}"),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          )
        );
      }
    });
  }

  Future<void> _loadInitialData() async {
    try {
      setState(() => _isLoading = true);
      
      final txnsData = await FeeService.getAllTransactions();
      final coursesData = await CourseService.getAllCourses();
      final studentsData = await StudentService.getAllStudents();

      double collected = 0;
      for (var t in txnsData) {
        collected += (t['amount'] as num).toDouble();
      }

      // Calculate total receivable based on student enrollments
      double receivable = 0;
      for (var s in studentsData) {
        final programId = s['selectedProgram'] is Map ? s['selectedProgram']['_id'] : s['selectedProgram'];
        final course = coursesData.firstWhere((c) => c['_id'] == programId, orElse: () => null);
        if (course != null) {
          receivable += (course['tuitionFee'] as num).toDouble();
        }
      }

      if (mounted) {
        setState(() {
          _transactions = txnsData;
          _courses = coursesData;
          _students = studentsData;
          _totalCollected = collected;
          _totalReceivable = receivable;
          _activeStudentCount = studentsData.length;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint("Finance load error: $e");
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final isMobile = width < 900;
        final isNarrow = width < 600;

        return Scaffold(
          backgroundColor: const Color(0xFFF8F6F6),
          body: Column(
            children: [
              _buildTopBar(isMobile),
              _buildSubHeader(isMobile),
              Expanded(
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildFeesTab(isMobile, isNarrow),
                    _buildPayoutsTab(isMobile, isNarrow)
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildTopBar(bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 20 : 40,
        vertical: isMobile ? 20 : 24,
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
                  "Financial Control",
                  style: AppTheme.titleStyle.copyWith(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: _actionButton(
                        Icons.add_card_rounded,
                        "Collection",
                        Colors.blue,
                        Colors.white,
                        () {},
                        isMobile: true,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _actionButton(
                        Icons.payments_rounded,
                        "Payout",
                        Colors.black,
                        Colors.white,
                        () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const CreatePayoutScreen(),
                            ),
                          );
                        },
                        isMobile: true,
                      ),
                    ),
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
                      "Institutional Ledger",
                      style: AppTheme.titleStyle.copyWith(
                        fontSize: 26,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "Monitoring revenue discovery across $_activeStudentCount active enrollments.",
                      style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
                    ),
                  ],
                ),
                Row(
                  children: [
                    _actionButton(
                      Icons.account_balance_wallet_rounded,
                      "Collection Entry",
                      Colors.blue,
                      Colors.white,
                      () {},
                    ),
                    const SizedBox(width: 14),
                    _actionButton(
                      Icons.payments_rounded,
                      "Initiate Payout",
                      Colors.black,
                      Colors.white,
                      () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const CreatePayoutScreen(),
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ],
            ),
    );
  }

  Widget _buildSubHeader(bool isMobile) {
    return Container(
      color: Colors.white,
      padding: EdgeInsets.symmetric(horizontal: isMobile ? 20 : 40),
      child: Row(
        children: [
          _tabItem("Revenue & Fees", 0),
          _tabItem("Payouts & Payroll", 1),
        ],
      ),
    );
  }

  Widget _tabItem(String title, int index) {
    bool isSelected = _tabController.index == index;
    return InkWell(
      onTap: () => setState(() => _tabController.animateTo(index)),
      child: AnimatedContainer(
        duration: 300.ms,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          border: Border(
            bottom: BorderSide(
              color: isSelected ? Colors.black : Colors.transparent,
              width: 3,
            ),
          ),
        ),
        child: Text(
          title,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            color: isSelected ? Colors.black : Colors.grey.shade500,
          ),
        ),
      ),
    );
  }

  Widget _buildFeesTab(bool isMobile, bool isNarrow) {
    if (_isLoading) return const Center(child: CircularProgressIndicator());

    return SingleChildScrollView(
      padding: EdgeInsets.all(isMobile ? 16 : 32),
      child: Column(
        children: [
          _buildFinanceOverview(isMobile, isNarrow),
          const SizedBox(height: 32),
          _buildRecentTransactions("Live Transaction Discovery", isMobile),
          const SizedBox(height: 32),
          _buildFeeStructureGrid(isMobile, isNarrow),
          const SizedBox(height: 60),
        ],
      ),
    );
  }

  Widget _buildPayoutsTab(bool isMobile, bool isNarrow) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(isMobile ? 16 : 32),
      child: Column(
        children: [
          _buildPayoutOverview(isMobile, isNarrow),
          const SizedBox(height: 24),
          _buildRecentTransactions("Recent Salary & Ledger Payouts", isMobile),
        ],
      ),
    );
  }

  Widget _buildFinanceOverview(bool isMobile, bool isNarrow) {
    final outstanding = _totalReceivable - _totalCollected;
    final collectionRate = _totalReceivable > 0 ? (_totalCollected / _totalReceivable * 100).toStringAsFixed(1) : "0.0";

    if (isNarrow) {
      return Column(
        children: [
          _financeCard(
            "Overall Liability",
            "₹${(_totalReceivable/100000).toStringAsFixed(1)}L",
            "Institutional Total",
            Icons.account_balance_rounded,
            [const Color(0xFF1E293B), const Color(0xFF334155)],
            isMobile: true,
          ),
          const SizedBox(height: 16),
          _financeCard(
            "Revenue Collected",
            "₹${(_totalCollected/100000).toStringAsFixed(1)}L",
            "$collectionRate% Realization Rate",
            Icons.check_circle_rounded,
            [const Color(0xFF10B981), const Color(0xFF059669)],
            isMobile: true,
          ),
          const SizedBox(height: 16),
          _financeCard(
            "Net Outstanding",
            "₹${(outstanding/100000).toStringAsFixed(1)}L",
            "Pending across $_activeStudentCount profiles",
            Icons.warning_rounded,
            [const Color(0xFFE11D48), const Color(0xFFBE123C)],
            isMobile: true,
          ),
        ],
      ).animate().fadeIn().slideY(begin: 0.1);
    }
    return Row(
      children: [
        Expanded(
          child: _financeCard(
            "Overall Liability",
            "₹${(_totalReceivable/100000).toStringAsFixed(1)}L",
            "Total Program Receivables",
            Icons.account_balance_rounded,
            [const Color(0xFF1E293B), const Color(0xFF334155)],
            isMobile: isMobile,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _financeCard(
            "Revenue Collected",
            "₹${(_totalCollected/100000).toStringAsFixed(1)}L",
            "$collectionRate% Enrollment Discovery",
            Icons.check_circle_rounded,
            [const Color(0xFF10B981), const Color(0xFF059669)],
            isMobile: isMobile,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _financeCard(
            "Net Outstanding",
            "₹${(outstanding/100000).toStringAsFixed(1)}L",
            "$_activeStudentCount Active Ledger Entries",
            Icons.warning_rounded,
            [const Color(0xFFE11D48), const Color(0xFFBE123C)],
            isMobile: isMobile,
          ),
        ),
      ],
    ).animate().fadeIn().slideY(begin: 0.1);
  }

  Widget _buildPayoutOverview(bool isMobile, bool isNarrow) {
    if (isNarrow) {
      return Column(
        children: [
          _financeCard(
            "Academic Payroll",
            "₹48.5L",
            "Faculty & Staff Nodes",
            Icons.person_pin_rounded,
            [const Color(0xFF4F46E5), const Color(0xFF4338CA)],
            isMobile: true,
          ),
          const SizedBox(height: 16),
          _financeCard(
            "Logistics Payouts",
            "₹12.2L",
            "Vendor Maintenance",
            Icons.shopping_bag_rounded,
            [const Color(0xFF2563EB), const Color(0xFF1D4ED8)],
            isMobile: true,
          ),
          const SizedBox(height: 16),
          _financeCard(
            "Operational Cost",
            "₹1.4L",
            "Utility & Overhead",
            Icons.bolt_rounded,
            [const Color(0xFF7C3AED), const Color(0xFF6D28D9)],
            isMobile: true,
          ),
        ],
      ).animate().fadeIn().slideY(begin: 0.1);
    }
    return Row(
      children: [
        Expanded(
          child: _financeCard(
            "Academic Payroll",
            "₹48.5L",
            "Faculty & Staff Deployment",
            Icons.person_pin_rounded,
            [const Color(0xFF4F46E5), const Color(0xFF4338CA)],
            isMobile: isMobile,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _financeCard(
            "Logistics Payouts",
            "₹12.2L",
            "Maintenance Ledger",
            Icons.shopping_bag_rounded,
            [const Color(0xFF2563EB), const Color(0xFF1D4ED8)],
            isMobile: isMobile,
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _financeCard(
            "Operational Cost",
            "₹1.4L",
            "Utility Consumption",
            Icons.bolt_rounded,
            [const Color(0xFF7C3AED), const Color(0xFF6D28D9)],
            isMobile: isMobile,
          ),
        ),
      ],
    ).animate().fadeIn().slideY(begin: 0.1);
  }

  Widget _financeCard(
    String title,
    String value,
    String sub,
    IconData icon,
    List<Color> colors, {
    bool isMobile = false,
  }) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 24 : 32),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: colors.last.withValues(alpha: 0.3),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, color: Colors.white, size: 24),
              ),
              if (!isMobile)
                const Icon(Icons.arrow_outward_rounded, color: Colors.white38, size: 20),
            ],
          ),
          const SizedBox(height: 32),
          Text(
            value,
            style: TextStyle(
              color: Colors.white,
              fontSize: isMobile ? 28 : 36,
              fontWeight: FontWeight.w900,
              letterSpacing: -1,
              height: 1,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 14,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            sub,
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.5),
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentTransactions(String title, bool isMobile) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 24 : 40),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
        border: Border.all(color: const Color(0xFFF1F1F1)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 40, offset: const Offset(0, 10))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
              Text(
                "${_transactions.length} Total Logs",
                style: const TextStyle(color: Colors.grey, fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 32),
          if (_transactions.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 40),
              child: Center(
                child: Column(
                  children: [
                    Icon(Icons.receipt_long_outlined, color: Colors.grey.shade300, size: 48),
                    const SizedBox(height: 16),
                    const Text("No financial sessions discovered.", style: TextStyle(color: Colors.grey)),
                  ],
                ),
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _transactions.length > 8 ? 8 : _transactions.length,
              separatorBuilder: (context, index) => const Divider(height: 1, color: Color(0xFFF1F1F1)),
              itemBuilder: (context, i) => _txnListRow(_transactions[i], isMobile),
            ),
        ],
      ),
    );
  }

  Widget _txnListRow(dynamic t, bool isMobile) {
    Color statusColor = t['status'] == 'Completed' ? Colors.green : (t['status'] == 'Pending' ? Colors.orange : Colors.red);
    String studentName = "Anonymous Student";
    String studentCode = "NODE-ID";
    if (t['studentId'] != null) {
      studentName = "${t['studentId']['firstName'] ?? ''} ${t['studentId']['lastName'] ?? ''}";
      studentCode = t['studentId']['studentId'] ?? "N/A";
    }
    
    DateTime paymentDate = DateTime.tryParse(t['paymentDate']?.toString() ?? '') ?? DateTime.now();
    String formattedDate = DateFormat('dd MMM, hh:mm a').format(paymentDate);

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(Icons.account_balance_wallet_rounded, color: statusColor, size: 24),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  studentName,
                  style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: Colors.black87),
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(4)),
                      child: Text(studentCode, style: const TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold)),
                    ),
                    const SizedBox(width: 8),
                    Text("Sem ${t['semester']} Entry", style: TextStyle(color: Colors.grey.shade500, fontSize: 11, fontWeight: FontWeight.w600)),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                "₹ ${t['amount']}",
                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Colors.black, height: 1),
              ),
              const SizedBox(height: 6),
              Text(formattedDate, style: TextStyle(color: Colors.grey.shade400, fontSize: 11, fontWeight: FontWeight.bold)),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(delay: 50.ms).slideX(begin: 0.05);
  }

  Widget _buildFeeStructureGrid(bool isMobile, bool isNarrow) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              "Active Fee Structures",
              style: AppTheme.titleStyle.copyWith(
                fontSize: 22,
                fontWeight: FontWeight.w900,
              ),
            ),
            Text("${_courses.length} Programs", style: const TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 24),
        if (_courses.isEmpty)
          const Text("No curricular fee frameworks defined.")
        else
          GridView.builder(
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: isNarrow ? 1 : (isMobile ? 2 : 3),
              mainAxisSpacing: 20,
              crossAxisSpacing: 20,
              childAspectRatio: isNarrow ? 3 : (isMobile ? 1.5 : 2),
            ),
            itemCount: _courses.length,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemBuilder: (context, index) => _frameworkCard(_courses[index]),
          ),
      ],
    );
  }

  Widget _frameworkCard(dynamic course) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F1F1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.blue.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.school_rounded, color: Colors.blue, size: 20),
              ),
              const Spacer(),
              Text(
                "ID: ${course['code']}",
                style: const TextStyle(color: Colors.grey, fontSize: 10, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Text(
            course['name'] ?? "Course",
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, height: 1.2),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Text("Annual Node:", style: TextStyle(color: Colors.grey, fontSize: 11, fontWeight: FontWeight.bold)),
              const SizedBox(width: 8),
              Text(
                "₹ ${course['tuitionFee']}",
                style: const TextStyle(color: Colors.green, fontWeight: FontWeight.w900, fontSize: 14),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            "${course['totalSemesters'] ?? (course['duration'] ?? 4) * 2} Billing Cycles",
            style: TextStyle(color: Colors.grey.shade400, fontSize: 10, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _actionButton(
    IconData icon,
    String label,
    Color bg,
    Color fg,
    VoidCallback onTap, {
    bool isMobile = false,
  }) {
    return ElevatedButton(
      onPressed: onTap,
      style: ElevatedButton.styleFrom(
        backgroundColor: bg,
        foregroundColor: fg,
        padding: EdgeInsets.symmetric(vertical: isMobile ? 18 : 22),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        elevation: 0,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 18),
          const SizedBox(width: 10),
          Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, letterSpacing: 0.5),
          ),
        ],
      ),
    );
  }
}
