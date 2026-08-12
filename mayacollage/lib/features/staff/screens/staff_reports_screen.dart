import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class StaffReportsScreen extends StatelessWidget {
  const StaffReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 900;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(isMobile ? 16 : 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(isMobile),
            const SizedBox(height: 32),
            _buildReportsGrid(isMobile),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(bool isMobile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Reports & Analytics", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), letterSpacing: -1)),
        const SizedBox(height: 4),
        Text("Generate and download detailed reports for analysis.", style: TextStyle(fontSize: 14, color: Colors.grey.shade500)),
      ],
    ).animate().fadeIn().slideY(begin: -0.1);
  }

  Widget _buildReportsGrid(bool isMobile) {
    final reports = [
      {"icon": Icons.how_to_reg_rounded, "title": "Attendance Report", "desc": "Monthly attendance summary", "color": Colors.blue},
      {"icon": Icons.assignment_rounded, "title": "Exam Performance", "desc": "Class-wise results & analytics", "color": Colors.orange},
      {"icon": Icons.stacked_bar_chart_rounded, "title": "Class Report", "desc": "Overall class progress", "color": Colors.green},
      {"icon": Icons.person_search_rounded, "title": "Student Analysis", "desc": "Individual detailed progress", "color": Colors.purple},
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: isMobile ? 1 : 2,
        childAspectRatio: isMobile ? 1.8 : 2.5,
        mainAxisSpacing: 24,
        crossAxisSpacing: 24,
      ),
      itemCount: reports.length,
      itemBuilder: (context, index) {
        final r = reports[index];
        final color = r['color'] as Color;
        return Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade200), boxShadow: [BoxShadow(color: color.withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, 10))]),
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)), child: Icon(r['icon'] as IconData, size: 32, color: color)),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(r['title'] as String, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF1E293B), letterSpacing: -0.5)),
                        const SizedBox(height: 4),
                        Text(r['desc'] as String, style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.bold, fontSize: 13)),
                      ],
                    ),
                  ),
                ],
              ),
              const Spacer(),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.picture_as_pdf_rounded, color: Colors.black87, size: 18),
                      label: const Text("Export PDF", style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
                      style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), side: BorderSide(color: Colors.grey.shade300)),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.table_chart_rounded, color: Colors.white, size: 18),
                      label: const Text("Export Excel", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), padding: const EdgeInsets.symmetric(vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ).animate().fadeIn(delay: (100 * index).ms).slideY(begin: 0.1);
      },
    );
  }
}
