import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/lab_service.dart';

class SubjectLabMappingScreen extends StatefulWidget {
  const SubjectLabMappingScreen({super.key});

  @override
  State<SubjectLabMappingScreen> createState() => _SubjectLabMappingScreenState();
}

class _SubjectLabMappingScreenState extends State<SubjectLabMappingScreen> {
  List<Map<String, dynamic>> _facultyList = [];
  bool _isLoadingFaculty = true;

  @override
  void initState() {
    super.initState();
    _loadFaculty();
  }

  Future<void> _loadFaculty() async {
    try {
      final list = await LabService.fetchAllFaculty();
      if (mounted) {
        setState(() {
          _facultyList = list;
          _isLoadingFaculty = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingFaculty = false);
    }
  }

  final List<Map<String, dynamic>> _mappings = [
    {"subject": "Data Structures Lab", "course": "B.Tech", "branch": "CSE", "semester": "3rd", "lab": "Computer Science Lab 1", "faculty": "Dr. Alan Turing"},
    {"subject": "Organic Chemistry Lab", "course": "B.Sc", "branch": "Chemistry", "semester": "1st", "lab": "Chemistry Lab Main", "faculty": "Prof. Marie Curie"},
    {"subject": "Analog Electronics Lab", "course": "B.Tech", "branch": "ECE", "semester": "5th", "lab": "Physics Electronics Lab", "faculty": "Dr. Nikola Tesla"},
  ];

  void _showMappingDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Text("New Subject Mapping", style: TextStyle(fontWeight: FontWeight.w900)),
          content: SizedBox(
            width: 500,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildDropdown("Course", ["B.Tech", "M.Tech", "B.Sc", "BCA"]),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(child: _buildDropdown("Branch", ["CSE", "ECE", "Mech", "Chemistry"])),
                      const SizedBox(width: 16),
                      Expanded(child: _buildDropdown("Semester", ["1st", "2nd", "3rd", "4th", "5th"])),
                    ],
                  ),
                  const SizedBox(height: 16),
                  _buildDropdown("Subject / Practical", ["Data Structures Lab", "Organic Chemistry Lab", "Analog Electronics Lab", "AI Practicals"]),
                  const SizedBox(height: 16),
                  _buildDropdown("Assign Laboratory", ["Computer Science Lab 1", "Chemistry Lab Main", "Physics Electronics Lab", "Robotics Space"]),
                  const SizedBox(height: 16),
                  _isLoadingFaculty
                      ? const CircularProgressIndicator()
                      : _buildDropdown(
                          "Assign Faculty",
                          _facultyList.isEmpty
                              ? ["No Faculty Found in DB"]
                              : _facultyList
                                  .map((f) => "${f['firstName'] ?? ''} ${f['lastName'] ?? ''}".trim())
                                  .toList(),
                        ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text("Cancel")),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.deepPurple,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () => Navigator.pop(context),
              child: const Text("Save Mapping", style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }

  Widget _buildDropdown(String label, List<String> items) {
    return DropdownButtonFormField<String>(
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
        filled: true,
        fillColor: Colors.grey.shade50,
      ),
      items: items.map((e) => DropdownMenuItem(value: e, child: Text(e))).toList(),
      onChanged: (val) {},
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text("Subject - Lab Mapping", style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
                    const SizedBox(height: 4),
                    Text("Map practical subjects to physical labs and assign faculty.", style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
                  ],
                ),
                ElevatedButton.icon(
                  onPressed: _showMappingDialog,
                  icon: const Icon(Icons.account_tree_rounded, color: Colors.white),
                  label: const Text("New Mapping", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.deepPurple,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ],
            ).animate().fadeIn().slideY(begin: -0.1),
            const SizedBox(height: 32),

            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _mappings.length,
              separatorBuilder: (_, _) => const SizedBox(height: 16),
              itemBuilder: (context, index) {
                final map = _mappings[index];
                return Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(24),
                    border: Border.all(color: Colors.grey.shade200),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 15, offset: const Offset(0, 8))],
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(color: Colors.deepPurple.shade50, borderRadius: BorderRadius.circular(16)),
                        child: const Icon(Icons.menu_book_rounded, color: Colors.deepPurple, size: 32),
                      ),
                      const SizedBox(width: 24),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(map["subject"], style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                _buildBadge("${map["course"]} - ${map["branch"]}"),
                                const SizedBox(width: 8),
                                _buildBadge("Sem: ${map["semester"]}", color: Colors.amber.shade700, bgColor: Colors.amber.shade50),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text("Assigned Lab", style: TextStyle(fontSize: 12, color: Colors.grey.shade500, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.science_rounded, size: 16, color: Colors.deepPurple),
                                const SizedBox(width: 8),
                                Text(map["lab"], style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                              ],
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text("Faculty Assigned", style: TextStyle(fontSize: 12, color: Colors.grey.shade500, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const CircleAvatar(radius: 10, backgroundImage: NetworkImage("https://i.pravatar.cc/100")),
                                const SizedBox(width: 8),
                                Text(map["faculty"], style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                              ],
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        onPressed: () {},
                        icon: const Icon(Icons.more_vert_rounded, color: Colors.grey),
                      ),
                    ],
                  ),
                ).animate(delay: (100 * index).ms).fadeIn().slideX(begin: 0.1);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBadge(String text, {Color color = Colors.deepPurple, Color bgColor = const Color(0xFFEDE9FE)}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(20)),
      child: Text(text, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }
}
