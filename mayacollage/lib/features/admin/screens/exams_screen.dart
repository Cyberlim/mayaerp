import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';
import 'create_exam_screen.dart';
import 'publish_result_screen.dart';

class ExamsScreen extends StatefulWidget {
  const ExamsScreen({super.key});

  @override
  State<ExamsScreen> createState() => _ExamsScreenState();
}

class _ExamsScreenState extends State<ExamsScreen> {
  final List<Map<String, dynamic>> _examSchedule = [
    {"subject": "Data Structures", "date": "12 Mar", "time": "10:00 AM", "venue": "Hall A", "type": "Theory", "color": Colors.indigo},
    {"subject": "Object Oriented Programming", "date": "14 Mar", "time": "02:00 PM", "venue": "Lab 1", "type": "Practical", "color": Colors.orange},
    {"subject": "Computer Architecture", "date": "16 Mar", "time": "10:00 AM", "venue": "Hall B", "type": "Theory", "color": Colors.pink},
    {"subject": "Software Engineering", "date": "18 Mar", "time": "09:00 AM", "venue": "Seminar Room", "type": "Viva", "color": Colors.teal},
  ];

  @override
  Widget build(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 1100;

    return Container(
      color: const Color(0xFFF8F6F6),
      child: Column(
        children: [
          _buildHeader(isMobile),
          Expanded(child: _buildExamsTab(isMobile)),
        ],
      ),
    );
  }

  Widget _buildHeader(bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: isMobile ? 20 : 40, vertical: isMobile ? 16 : 24),
      decoration: const BoxDecoration(color: Colors.white, border: Border(bottom: BorderSide(color: Color(0xFFF1F1F1)))),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("Exams & Results", style: AppTheme.titleStyle.copyWith(fontSize: isMobile ? 20 : 26, fontWeight: FontWeight.w900)),
              if (!isMobile) Text("Manage examination schedules and result publishing", style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
            ],
          ),
          Row(
            children: [
              ElevatedButton.icon(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateExamScreen())),
                icon: const Icon(Icons.add_rounded, size: 18),
                label: const Text("Create Exam"),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.black, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              ),
              const SizedBox(width: 14),
              ElevatedButton.icon(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PublishResultScreen())),
                icon: const Icon(Icons.upload_file_rounded, size: 18),
                label: const Text("Publish Result"),
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryRed, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildExamsTab(bool isMobile) {
    return SingleChildScrollView(
      padding: EdgeInsets.all(isMobile ? 16 : 32),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Upcoming Examinations", style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
          const SizedBox(height: 24),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(crossAxisCount: isMobile ? 1 : 2, mainAxisSpacing: 20, crossAxisSpacing: 20, childAspectRatio: 3),
            itemCount: _examSchedule.length,
            itemBuilder: (context, i) {
              final exam = _examSchedule[i];
              return Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey.shade100)),
                child: Row(
                  children: [
                    Container(width: 6, height: 40, decoration: BoxDecoration(color: exam['color'] as Color, borderRadius: BorderRadius.circular(10))),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(exam['subject'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                          Text("${exam['date']} • ${exam['time']}", style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                        ],
                      ),
                    ),
                    _badge(exam['type'], exam['color'] as Color),
                  ],
                ),
              ).animate(delay: (i * 100).ms).fadeIn().slideX(begin: 0.1);
            },
          ),
        ],
      ),
    );
  }

  Widget _badge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
      child: Text(text, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }
}
