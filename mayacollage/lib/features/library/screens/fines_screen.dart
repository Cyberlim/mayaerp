import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/services/library_service.dart';
import 'package:intl/intl.dart';

class FinesScreen extends StatefulWidget {
  const FinesScreen({super.key});

  @override
  State<FinesScreen> createState() => _FinesScreenState();
}

class _FinesScreenState extends State<FinesScreen> {
  List<dynamic> _allCirculations = [];
  List<dynamic> _overdueFines = [];
  bool _isLoading = true;
  double _totalDues = 0;
  int _overdueCount = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      setState(() => _isLoading = true);
      final data = await LibraryService.getCirculation();
      setState(() {
        _allCirculations = data;
        _overdueFines = data.where((i) => (i['fine'] ?? 0) > 0).toList();
        _totalDues = _overdueFines.fold(0.0, (sum, item) => sum + (item['fine'] ?? 0).toDouble());
        _overdueCount = _overdueFines.length;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _payFine(dynamic fineRecord) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Confirm Payment", style: TextStyle(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("Student: ${fineRecord['student']['firstName']} ${fineRecord['student']['lastName']}"),
            Text("Book: ${fineRecord['book']['title']}"),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(12)),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text("Amount to Collect", style: TextStyle(fontWeight: FontWeight.bold)),
                  Text("₹ ${fineRecord['fine']}", style: const TextStyle(fontWeight: FontWeight.w900, color: Colors.green, fontSize: 18))
                ],
              ),
            )
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            child: const Text("Confirm Paid", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        setState(() => _isLoading = true);
        await LibraryService.payFine(fineRecord['_id']);
        _loadData(); // Refresh list
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Payment successful! Loan renewed.")));
      } catch (e) {
        if (mounted) {
           setState(() => _isLoading = false);
           ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
        }
      }
    }
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
                  const SizedBox(height: 32),
                  _buildStatsRow(isMobile),
                  const SizedBox(height: 32),
                  _buildFinesList(isMobile),
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
        const Text("Fines & Penalties", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), letterSpacing: -1)),
        const SizedBox(height: 4),
        Text("Detailed tracking of all outstanding student dues and late return penalties.", style: TextStyle(fontSize: 14, color: Colors.grey.shade500)),
      ],
    ).animate().fadeIn().slideY(begin: -0.1);
  }

  Widget _buildStatsRow(bool isMobile) {
    return Wrap(
      spacing: 16,
      runSpacing: 16,
      children: [
        _statCard("Total Dues", "₹ $_totalDues", Icons.money_off_rounded, Colors.orange, isMobile),
        _statCard("Overdue Books", "$_overdueCount", Icons.book_rounded, Colors.red, isMobile),
        _statCard("Verified Issues", "${_allCirculations.length}", Icons.check_circle_outline, Colors.blue, isMobile),
      ],
    ).animate().fadeIn(delay: 100.ms);
  }

  Widget _statCard(String title, String value, IconData icon, Color color, bool isMobile) {
    return Container(
      width: isMobile ? double.infinity : 240,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withValues(alpha: 0.2)), boxShadow: [BoxShadow(color: color.withValues(alpha: 0.05), blurRadius: 15, offset: const Offset(0, 8))]),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)), child: Icon(icon, color: color, size: 20)), const SizedBox(width: 12), Text(title, style: TextStyle(color: Colors.grey.shade600, fontWeight: FontWeight.bold, fontSize: 13))]),
          const SizedBox(height: 16),
          Text(value, style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: color)),
        ],
      ),
    );
  }

  Widget _buildFinesList(bool isMobile) {
    if (_overdueFines.isEmpty) {
      return Container(padding: const EdgeInsets.all(40), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)), child: const Center(child: Text("No pending fines found. All students are up to date!", style: TextStyle(color: Colors.grey))));
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (!isMobile)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Row(
              children: [
                Expanded(flex: 2, child: _headerText("STUDENT")),
                Expanded(flex: 2, child: _headerText("BOOK")),
                Expanded(flex: 1, child: _headerText("DUE DATE")),
                Expanded(flex: 1, child: _headerText("FINE AMOUNT")),
                SizedBox(width: 100, child: _headerText("ACTIONS", align: TextAlign.center)),
              ],
            ),
          ),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _overdueFines.length,
          itemBuilder: (context, index) {
            final f = _overdueFines[index];
            return Container(
              margin: EdgeInsets.only(bottom: isMobile ? 12 : 16),
              padding: EdgeInsets.all(isMobile ? 16 : 20),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: const Color(0xFF6366F1).withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, 8))]),
              child: isMobile ? _buildMobileFineRow(f) : _buildDesktopFineRow(f),
            ).animate().fadeIn(delay: (20 * index).ms).slideX(begin: 0.05);
          },
        ),
      ],
    );
  }

  Text _headerText(String t, {TextAlign? align}) => Text(t, style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade500, fontSize: 12, letterSpacing: 0.5), textAlign: align);

  Widget _buildDesktopFineRow(dynamic f) {
    final student = f['student'] ?? {};
    final book = f['book'] ?? {};
    final dueDateStr = f['dueDate'] != null ? DateFormat('MMM dd, yyyy').format(DateTime.parse(f['dueDate'])) : "N/A";

    return Row(
      children: [
        Expanded(flex: 2, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text("${student['firstName']} ${student['lastName']}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          Text(student['studentId'] ?? "N/A", style: TextStyle(color: Colors.grey.shade500, fontSize: 12))
        ])),
        Expanded(flex: 2, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(book['title'] ?? "Unknown", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
          Text(book['author'] ?? "Unknown", style: TextStyle(color: Colors.grey.shade500, fontSize: 12))
        ])),
        Expanded(flex: 1, child: Text(dueDateStr, style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold))),
        Expanded(flex: 1, child: Text("₹ ${f['fine']}", style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.w900, fontSize: 18))),
        SizedBox(
          width: 100,
          child: Center(
            child: ElevatedButton(
              onPressed: () => _payFine(f),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
              child: const Text("Pay", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildMobileFineRow(dynamic f) {
    final student = f['student'] ?? {};
    final book = f['book'] ?? {};
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text("${student['firstName']} ${student['lastName']}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          _statusBadge("Unpaid"),
        ]),
        const SizedBox(height: 12),
        Text(book['title'] ?? "Unknown", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
        const SizedBox(height: 12),
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
           Text("Fine: ₹ ${f['fine']}", style: const TextStyle(color: Colors.orange, fontWeight: FontWeight.w900, fontSize: 20)),
           ElevatedButton(
              onPressed: () => _payFine(f),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8))),
              child: const Text("Pay", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
        ]),
      ],
    );
  }

  Widget _statusBadge(String status) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: Colors.red.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(100)),
      child: Text(status.toUpperCase(), style: const TextStyle(color: Colors.red, fontSize: 9, fontWeight: FontWeight.bold)),
    );
  }
}
