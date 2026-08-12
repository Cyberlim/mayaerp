import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class StaffTimeTableScreen extends StatelessWidget {
  const StaffTimeTableScreen({super.key});

  @override
  Widget build(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 900;

    final List<Map<String, dynamic>> timeTable = [
      {
        "time": "09:00 AM - 10:00 AM",
        "subject": "Data Structures",
        "class": "B.Tech CS 2nd Year",
        "room": "Room 304",
        "type": "Lecture",
        "color": const Color(0xFF6366F1),
      },
      {
        "time": "10:15 AM - 11:15 AM",
        "subject": "Algorithm Lab",
        "class": "B.Tech CS 2nd Year",
        "room": "CS Lab 2",
        "type": "Practical",
        "color": const Color(0xFF10B981),
      },
      {
        "time": "11:30 AM - 12:30 PM",
        "subject": "Computer Networks",
        "class": "B.Tech CS 3rd Year",
        "room": "Room 401",
        "type": "Lecture",
        "color": const Color(0xFFF59E0B),
      },
      {
        "time": "01:30 PM - 02:30 PM",
        "subject": "Project Meeting",
        "class": "Final Year Students",
        "room": "Faculty Cabin",
        "type": "Meeting",
        "color": const Color(0xFFEC4899),
      },
      {
        "time": "02:45 PM - 03:45 PM",
        "subject": "System Design",
        "class": "M.Tech CS 1st Year",
        "room": "Room 502",
        "type": "Seminar",
        "color": const Color(0xFF8B5CF6),
      },
    ];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(isMobile ? 16 : 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(isMobile),
            const SizedBox(height: 32),
            _buildTodaySchedule(timeTable, isMobile),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(bool isMobile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Today's Time Table",
          style: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.w900,
            color: Color(0xFF1E293B),
            letterSpacing: -1,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          "Personalized schedule for Friday, March 6, 2026",
          style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
        ),
      ],
    ).animate().fadeIn().slideY(begin: -0.1);
  }

  Widget _buildTodaySchedule(List<Map<String, dynamic>> timeTable, bool isMobile) {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: timeTable.length,
      itemBuilder: (context, index) {
        final item = timeTable[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 20,
                offset: const Offset(0, 10),
              ),
            ],
            border: Border.all(color: Colors.white, width: 2),
          ),
          child: IntrinsicHeight(
            child: Row(
              children: [
                // Time Section
                Container(
                  width: isMobile ? 100 : 180,
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: item['color'].withOpacity(0.05),
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(22),
                      bottomLeft: Radius.circular(22),
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.access_time_rounded,
                        size: 20,
                        color: item['color'],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        item['time'].split(' - ')[0],
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: item['color'],
                          fontWeight: FontWeight.w900,
                          fontSize: isMobile ? 12 : 14,
                        ),
                      ),
                      Text(
                        "to",
                        style: TextStyle(
                          color: item['color'].withOpacity(0.5),
                          fontWeight: FontWeight.bold,
                          fontSize: 10,
                        ),
                      ),
                      Text(
                        item['time'].split(' - ')[1],
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: item['color'],
                          fontWeight: FontWeight.w900,
                          fontSize: isMobile ? 12 : 14,
                        ),
                      ),
                    ],
                  ),
                ),

                // Details Section
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: item['color'].withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                item['type'],
                                style: TextStyle(
                                  color: item['color'],
                                  fontWeight: FontWeight.bold,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          item['subject'],
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF1E293B),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          item['class'],
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                        const Spacer(),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Icon(
                              Icons.location_on_rounded,
                              size: 16,
                              color: Colors.grey.shade400,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              item['room'],
                              style: TextStyle(
                                color: Colors.grey.shade500,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                // Action Arrow
                Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: Icon(
                    Icons.chevron_right_rounded,
                    color: Colors.grey.shade300,
                  ),
                ),
              ],
            ),
          ),
        ).animate().fadeIn(delay: (100 * index).ms).slideX(begin: 0.1);
      },
    );
  }
}
