import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class StaffClassesScreen extends StatefulWidget {
  const StaffClassesScreen({super.key});

  @override
  State<StaffClassesScreen> createState() => _StaffClassesScreenState();
}

class _StaffClassesScreenState extends State<StaffClassesScreen> {
  final List<Map<String, dynamic>> _classes = [
    {"subject": "Data Structures", "class": "B.Tech CS 2nd Yr", "students": 120, "color": Colors.blue},
    {"subject": "Computer Networks", "class": "B.Tech CS 3rd Yr", "students": 115, "color": Colors.orange},
    {"subject": "Algorithms Lab", "class": "B.Tech CS 2nd Yr", "students": 60, "color": Colors.green},
    {"subject": "Project Mentoring", "class": "Final Year", "students": 25, "color": Colors.purple},
  ];

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
            _buildClassesGrid(isMobile),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(bool isMobile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Classes & Subjects", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), letterSpacing: -1)),
        const SizedBox(height: 4),
        Text("Your assigned classes and teaching subjects.", style: TextStyle(fontSize: 14, color: Colors.grey.shade500)),
      ],
    ).animate().fadeIn().slideY(begin: -0.1);
  }

  Widget _buildClassesGrid(bool isMobile) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: isMobile ? 1 : 2,
        childAspectRatio: isMobile ? 1.6 : 2.0,
        mainAxisSpacing: 24,
        crossAxisSpacing: 24,
      ),
      itemCount: _classes.length,
      itemBuilder: (context, index) {
        final c = _classes[index];
        final Color color = c['color'];
        return Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade200), boxShadow: [BoxShadow(color: color.withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, 10))]),
          padding: const EdgeInsets.all(32),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(16)), child: Icon(Icons.class_rounded, color: color, size: 28)),
                  Container(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8), decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade100)), child: Row(children: [Icon(Icons.people_alt_rounded, size: 16, color: Colors.grey.shade500), const SizedBox(width: 8), Text("${c['students']} Students", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13))])),
                ],
              ),
              const Spacer(),
              Text(c['subject'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 22, color: Color(0xFF1E293B), letterSpacing: -0.5)),
              const SizedBox(height: 4),
              Text(c['class'], style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.bold, fontSize: 14)),
              const Spacer(),
              const Divider(),
              const Spacer(),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _actionBtn("Students", Icons.people_alt_rounded, color),
                  _actionBtn("Attendance", Icons.how_to_reg_rounded, color),
                  _actionBtn("Assignments", Icons.assignment_turned_in_rounded, color),
                ],
              ),
            ],
          ),
        ).animate().fadeIn(delay: (100 * index).ms).slideY(begin: 0.1);
      },
    );
  }

  Widget _actionBtn(String label, IconData icon, Color color) {
    return InkWell(
      onTap: () {},
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Column(
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey.shade600)),
          ],
        ),
      ),
    );
  }
}
