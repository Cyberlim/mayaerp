import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class StaffExamsScreen extends StatefulWidget {
  const StaffExamsScreen({super.key});

  @override
  State<StaffExamsScreen> createState() => _StaffExamsScreenState();
}

class _StaffExamsScreenState extends State<StaffExamsScreen> {
  String _selectedView = 'schedule'; // schedule, marks, analytics

  final List<Map<String, dynamic>> _schedules = [
    {"subject": "Data Structures", "date": "10 Apr 2026", "time": "10:00 AM - 01:00 PM", "type": "Mid-Term", "class": "B.Tech CS 2nd Yr"},
    {"subject": "Computer Networks", "date": "12 Apr 2026", "time": "02:00 PM - 05:00 PM", "type": "Mid-Term", "class": "B.Tech CS 3rd Yr"},
  ];

  final List<Map<String, dynamic>> _students = [
    {"id": "CS-001", "name": "Alice Smith", "marks": 85, "grade": "A"},
    {"id": "CS-002", "name": "Bob Jones", "marks": 92, "grade": "A+"},
    {"id": "CS-015", "name": "Charlie Brown", "marks": 76, "grade": "B"},
    {"id": "CS-042", "name": "Eve Davis", "marks": null, "grade": null},
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
            _buildTabs(),
            const SizedBox(height: 32),
            if (_selectedView == 'schedule') _buildScheduleView(isMobile),
            if (_selectedView == 'marks') _buildMarksView(isMobile),
            if (_selectedView == 'analytics') _buildAnalyticsView(isMobile),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(bool isMobile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Exams & Results", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), letterSpacing: -1)),
        const SizedBox(height: 4),
        Text("Manage exam schedules, upload marks, and view analytics.", style: TextStyle(fontSize: 14, color: Colors.grey.shade500)),
      ],
    ).animate().fadeIn().slideY(begin: -0.1);
  }

  Widget _buildTabs() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      clipBehavior: Clip.none, // Allow shadows/borders to be seen
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20), // Softer corners
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
          mainAxisSize: MainAxisSize.min,
          children: [
            _tab("Exam Schedule", 'schedule'),
            const SizedBox(width: 4),
            _tab("Upload Marks", 'marks'),
            const SizedBox(width: 4),
            _tab("Result Analytics", 'analytics'),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1);
  }

  Widget _tab(String label, String value) {
    bool isSelected = _selectedView == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedView = value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
        decoration: BoxDecoration(color: isSelected ? const Color(0xFF10B981) : Colors.transparent, borderRadius: BorderRadius.circular(12)),
        child: Text(label, style: TextStyle(color: isSelected ? Colors.white : Colors.grey.shade600, fontWeight: isSelected ? FontWeight.bold : FontWeight.w600, fontSize: 14)),
      ),
    );
  }

  Widget _buildScheduleView(bool isMobile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text("Upcoming Exams", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
            ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.add_rounded, color: Colors.white, size: 18),
              label: const Text("Create Exam", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            ),
          ],
        ),
        const SizedBox(height: 24),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _schedules.length,
          itemBuilder: (context, index) {
            final s = _schedules[index];
            return Container(
              margin: EdgeInsets.only(bottom: isMobile ? 12 : 16),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey.shade100), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 20, offset: const Offset(0, 5))]),
              child: isMobile ? _mobileScheduleRow(s) : _desktopScheduleRow(s),
            ).animate().fadeIn(delay: (50 * index).ms).slideX(begin: 0.05);
          },
        ),
      ],
    ).animate().fadeIn(delay: 200.ms);
  }

  Widget _desktopScheduleRow(Map<String, dynamic> s) {
    return Row(
      children: [
        Expanded(
          flex: 2,
          child: Row(
            children: [
              Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: const Color(0xFF10B981).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.assignment_rounded, color: Color(0xFF10B981))),
              const SizedBox(width: 16),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(s['subject'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1E293B))), Text(s['class'], style: TextStyle(color: Colors.grey.shade500, fontSize: 13))]),
            ],
          ),
        ),
        Expanded(flex: 1, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(s['date'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87)), Text(s['time'], style: TextStyle(color: Colors.grey.shade500, fontSize: 13))])),
        Expanded(
          flex: 1,
          child: Align(
            alignment: Alignment.centerLeft,
            child: Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), decoration: BoxDecoration(color: Colors.blue.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)), child: Text(s['type'], style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold, fontSize: 12))),
          ),
        ),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(onPressed: () {}, icon: const Icon(Icons.edit_rounded, color: Colors.orange, size: 20)),
            IconButton(onPressed: () {}, icon: const Icon(Icons.delete_rounded, color: Colors.red, size: 20)),
          ],
        ),
      ],
    );
  }

  Widget _mobileScheduleRow(Map<String, dynamic> s) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: const Color(0xFF10B981).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.assignment_rounded, color: Color(0xFF10B981))),
                const SizedBox(width: 16),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(s['subject'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1E293B))), Text(s['class'], style: TextStyle(color: Colors.grey.shade500, fontSize: 13))]),
              ],
            ),
            IconButton(onPressed: () {}, icon: const Icon(Icons.more_vert_rounded, color: Colors.grey)),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(s['date'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Colors.black87)), Text(s['time'], style: TextStyle(color: Colors.grey.shade500, fontSize: 13))]),
            Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6), decoration: BoxDecoration(color: Colors.blue.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)), child: Text(s['type'], style: const TextStyle(color: Colors.blue, fontWeight: FontWeight.bold, fontSize: 12))),
          ],
        ),
      ],
    );
  }

  Widget _buildMarksView(bool isMobile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey.shade200)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("Select Exam to Upload Marks", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18, color: Color(0xFF1E293B))),
              const SizedBox(height: 16),
              Wrap(
                spacing: 16,
                runSpacing: 16,
                children: [
                  _dropdown("Subject", ["Data Structures", "Computer Networks"]),
                  _dropdown("Exam Type", ["Mid-Term", "Finals", "Unit Test"]),
                  ElevatedButton(onPressed: () {}, style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20), backgroundColor: const Color(0xFF10B981), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))), child: const Text("Load Students", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),
        Container(
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey.shade200)),
          child: Column(
            children: [
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _students.length,
                separatorBuilder: (context, index) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final s = _students[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                    child: Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [Text(s['name'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)), Text(s['id'], style: TextStyle(color: Colors.grey.shade500, fontSize: 13))],
                          ),
                        ),
                        Expanded(
                          flex: 1,
                          child: TextFormField(
                            initialValue: s['marks']?.toString() ?? '',
                            keyboardType: TextInputType.number,
                            decoration: InputDecoration(hintText: "Marks", filled: true, fillColor: const Color(0xFFF8FAFC), border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none), contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12)),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          flex: 1,
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                            decoration: BoxDecoration(color: s['grade'] != null ? Colors.green.withValues(alpha: 0.1) : Colors.grey.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                            child: Text(s['grade'] ?? "-", textAlign: TextAlign.center, style: TextStyle(color: s['grade'] != null ? Colors.green : Colors.grey, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20))),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    OutlinedButton(onPressed: () {}, style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16)), child: const Text("Cancel")),
                    const SizedBox(width: 16),
                    ElevatedButton.icon(onPressed: () {}, icon: const Icon(Icons.save_rounded, color: Colors.white, size: 18), label: const Text("Save & Publish", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)), style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)))),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    ).animate().fadeIn(delay: 200.ms);
  }

  Widget _buildAnalyticsView(bool isMobile) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade200)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Performance Overview", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
          const SizedBox(height: 32),
          _progressRow("Class Average (Data Structures)", 0.76, Colors.blue),
          const SizedBox(height: 24),
          _progressRow("Pass Percentage", 0.92, Colors.green),
          const SizedBox(height: 24),
          _progressRow("Top Performers Score", 0.98, Colors.purple),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms);
  }

  Widget _progressRow(String label, double value, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            Text("${(value * 100).toInt()}%", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: color)),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: LinearProgressIndicator(value: value, color: color, backgroundColor: color.withValues(alpha: 0.1), minHeight: 8),
        ),
      ],
    );
  }

  Widget _dropdown(String hint, List<String> items) {
    return Container(
      width: 180,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          hint: Text(hint, style: TextStyle(color: Colors.grey.shade500, fontSize: 14)),
          isExpanded: true,
          icon: Icon(Icons.keyboard_arrow_down_rounded, color: Colors.grey.shade400),
          items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 14)))).toList(),
          onChanged: (v) {},
        ),
      ),
    );
  }
}
