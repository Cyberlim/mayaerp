import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/services/library_service.dart';
import 'package:intl/intl.dart';

class TransactionsScreen extends StatefulWidget {
  const TransactionsScreen({super.key});

  @override
  State<TransactionsScreen> createState() => _TransactionsScreenState();
}

class _TransactionsScreenState extends State<TransactionsScreen> {
  List<dynamic> _transactions = [];
  bool _isLoading = true;
  String _filterType = "All";

  // Stats
  int _totalIssues = 0;
  int _totalReturns = 0;
  int _totalOverdue = 0;
  double _totalFinesCollected = 0;

  final PageController _statsPageController = PageController(viewportFraction: 0.85);

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  @override
  void dispose() {
    _statsPageController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    try {
      setState(() => _isLoading = true);
      final data = await LibraryService.getCirculation();
      setState(() {
        _transactions = data;
        _totalIssues = data.where((t) => t['status'] == 'Active' || t['status'] == 'Overdue').length;
        _totalReturns = data.where((t) => t['status'] == 'Returned').length;
        _totalOverdue = data.where((t) => t['status'] == 'Overdue').length;
        _totalFinesCollected = data.fold(0.0, (sum, t) => sum + (t['fine'] ?? 0).toDouble());
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  List<dynamic> get _filteredTransactions {
    if (_filterType == "All") return _transactions;
    return _transactions.where((t) => t['status'] == _filterType).toList();
  }

  String _txnType(dynamic t) {
    if (t['status'] == 'Returned') return 'Return';
    if (t['status'] == 'Overdue') return 'Overdue';
    return 'Issue';
  }

  @override
  Widget build(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 800;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                padding: EdgeInsets.all(isMobile ? 16 : 32),
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildHeader(isMobile),
                    const SizedBox(height: 24),
                    _buildStatsCarousel(isMobile),
                    const SizedBox(height: 24),
                    _buildFilters(),
                    const SizedBox(height: 24),
                    _buildTransactionsList(isMobile),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildHeader(bool isMobile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Transactions Log", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), letterSpacing: -1)),
        const SizedBox(height: 4),
        Text("Complete history of all issues, returns, overdue records and fine payments.", style: TextStyle(fontSize: 14, color: Colors.grey.shade500)),
      ],
    ).animate().fadeIn().slideY(begin: -0.1);
  }

  // --- Stats Carousel ---
  Widget _buildStatsCarousel(bool isMobile) {
    final stats = [
      _StatData("Total Transactions", "${_transactions.length}", Icons.receipt_long_rounded, const [Color(0xFF6366F1), Color(0xFF4F46E5)]),
      _StatData("Active Issues", "$_totalIssues", Icons.call_made_rounded, const [Color(0xFF3B82F6), Color(0xFF2563EB)]),
      _StatData("Returned Books", "$_totalReturns", Icons.call_received_rounded, const [Color(0xFF10B981), Color(0xFF059669)]),
      _StatData("Overdue Books", "$_totalOverdue", Icons.warning_amber_rounded, const [Color(0xFFF59E0B), Color(0xFFD97706)]),
      _StatData("Fines Revenue", "₹ ${_totalFinesCollected.toStringAsFixed(0)}", Icons.payments_rounded, const [Color(0xFFEF4444), Color(0xFFDC2626)]),
    ];

    if (!isMobile) {
      // Desktop: show all in a row
      return Row(
        children: stats.map((s) => Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: _buildStatCard(s),
          ),
        )).toList(),
      ).animate().fadeIn(delay: 100.ms);
    }

    // Mobile: horizontal carousel
    return SizedBox(
      height: 140,
      child: PageView.builder(
        controller: _statsPageController,
        itemCount: stats.length,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.symmetric(horizontal: 6),
            child: _buildStatCard(stats[index]),
          );
        },
      ),
    ).animate().fadeIn(delay: 100.ms);
  }

  Widget _buildStatCard(_StatData s) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: s.colors, begin: Alignment.topLeft, end: Alignment.bottomRight),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: s.colors.last.withValues(alpha: 0.3), blurRadius: 15, offset: const Offset(0, 8))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(10)), child: Icon(s.icon, color: Colors.white, size: 20)),
            Text(s.value, style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.w900)),
          ]),
          const SizedBox(height: 12),
          Text(s.title, style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  // --- Filters ---
  Widget _buildFilters() {
    final filters = ["All", "Active", "Overdue", "Returned"];
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: filters.map((f) {
          final isSelected = _filterType == f;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: ChoiceChip(
              label: Text(f, style: TextStyle(color: isSelected ? Colors.white : Colors.black87, fontWeight: FontWeight.bold, fontSize: 12)),
              selected: isSelected,
              selectedColor: const Color(0xFF4F46E5),
              backgroundColor: Colors.white,
              side: BorderSide(color: isSelected ? Colors.transparent : Colors.grey.shade300),
              onSelected: (_) => setState(() => _filterType = f),
            ),
          );
        }).toList(),
      ),
    );
  }

  // --- Transactions List ---
  Widget _buildTransactionsList(bool isMobile) {
    final filtered = _filteredTransactions;
    if (filtered.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(40),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
        child: const Center(child: Text("No transactions found for this filter.", style: TextStyle(color: Colors.grey))),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (!isMobile)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Row(
              children: [
                Expanded(flex: 2, child: _headerText("DATE")),
                Expanded(flex: 1, child: _headerText("TYPE")),
                Expanded(flex: 3, child: _headerText("DETAILS")),
                Expanded(flex: 1, child: _headerText("FINE")),
                Expanded(flex: 1, child: _headerText("STATUS")),
              ],
            ),
          ),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: filtered.length,
          itemBuilder: (context, index) {
            final t = filtered[index];
            return Container(
              margin: EdgeInsets.only(bottom: isMobile ? 10 : 14),
              padding: EdgeInsets.all(isMobile ? 14 : 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: [BoxShadow(color: const Color(0xFF6366F1).withValues(alpha: 0.04), blurRadius: 20, offset: const Offset(0, 8))],
              ),
              child: isMobile ? _buildMobileRow(t) : _buildDesktopRow(t),
            ).animate().fadeIn(delay: (20 * index).ms).slideX(begin: 0.03);
          },
        ),
      ],
    );
  }

  Text _headerText(String t) => Text(t, style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade500, fontSize: 11, letterSpacing: 0.5));

  Widget _buildDesktopRow(dynamic t) {
    final issueDate = t['issueDate'] != null ? DateFormat('MMM dd, yyyy').format(DateTime.parse(t['issueDate'])) : "N/A";
    final issueTime = t['issueDate'] != null ? DateFormat('hh:mm a').format(DateTime.parse(t['issueDate'])) : "";
    final type = _txnType(t);

    return Row(
      children: [
        Expanded(flex: 2, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(issueDate, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
          Text(issueTime, style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
        ])),
        Expanded(flex: 1, child: _typeBadge(type)),
        Expanded(flex: 3, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(t['book']?['title'] ?? "Unknown Book", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF1E293B))),
          Text("${t['student']?['firstName'] ?? ''} ${t['student']?['lastName'] ?? ''} (${t['student']?['studentId'] ?? 'N/A'})", style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
        ])),
        Expanded(flex: 1, child: Text(
          (t['fine'] ?? 0) > 0 ? "₹ ${t['fine']}" : "—",
          style: TextStyle(color: (t['fine'] ?? 0) > 0 ? Colors.orange : Colors.grey.shade400, fontWeight: FontWeight.w900, fontSize: 14),
        )),
        Expanded(flex: 1, child: Align(alignment: Alignment.centerLeft, child: _statusBadge(t['status']))),
      ],
    );
  }

  Widget _buildMobileRow(dynamic t) {
    final issueDate = t['issueDate'] != null ? DateFormat('MMM dd, yyyy').format(DateTime.parse(t['issueDate'])) : "N/A";
    final type = _txnType(t);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _typeBadge(type),
            _statusBadge(t['status']),
          ],
        ),
        const SizedBox(height: 12),
        Text(t['book']?['title'] ?? "Unknown Book", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF1E293B))),
        const SizedBox(height: 4),
        Text("${t['student']?['firstName'] ?? ''} ${t['student']?['lastName'] ?? ''}", style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(issueDate, style: TextStyle(color: Colors.grey.shade500, fontSize: 12, fontWeight: FontWeight.bold)),
            if ((t['fine'] ?? 0) > 0)
              Text("Fine: ₹ ${t['fine']}", style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.w900, fontSize: 14)),
          ],
        ),
      ],
    );
  }

  Widget _typeBadge(String type) {
    Color bg, fg;
    IconData icon;
    switch (type) {
      case 'Issue':
        bg = Colors.blue.withValues(alpha: 0.1);
        fg = Colors.blue;
        icon = Icons.call_made_rounded;
        break;
      case 'Return':
        bg = Colors.green.withValues(alpha: 0.1);
        fg = Colors.green;
        icon = Icons.call_received_rounded;
        break;
      case 'Overdue':
        bg = Colors.red.withValues(alpha: 0.1);
        fg = Colors.red;
        icon = Icons.warning_rounded;
        break;
      default:
        bg = Colors.orange.withValues(alpha: 0.1);
        fg = Colors.orange;
        icon = Icons.payments_rounded;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: fg),
          const SizedBox(width: 6),
          Text(type, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: fg)),
        ],
      ),
    );
  }

  Widget _statusBadge(String status) {
    Color color;
    switch (status) {
      case 'Active':
        color = Colors.blue;
        break;
      case 'Returned':
        color = Colors.green;
        break;
      case 'Overdue':
        color = Colors.red;
        break;
      default:
        color = Colors.orange;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(100)),
      child: Text(status.toUpperCase(), style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }
}

class _StatData {
  final String title;
  final String value;
  final IconData icon;
  final List<Color> colors;
  const _StatData(this.title, this.value, this.icon, this.colors);
}
