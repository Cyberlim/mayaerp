import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/app_constants.dart';

class PublishResultScreen extends StatefulWidget {
  const PublishResultScreen({super.key});

  @override
  State<PublishResultScreen> createState() => _PublishResultScreenState();
}

class _PublishResultScreenState extends State<PublishResultScreen> {
  String? _selectedDept;
  String? _selectedBranch;
  String? _selectedSemester;
  String? _selectedExam;

  final List<Map<String, dynamic>> _addedResults = [];
  final TextEditingController _studentSearchController =
      TextEditingController();

  // Dummy Data for Selects
  final List<String> _depts = ['Engineering', 'Management', 'Science', 'Arts'];
  final List<String> _branches = [
    'CSE',
    'ECE',
    'ME',
    'Finance',
    'HR',
    'Physics',
  ];
  final List<String> _semesters = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'];
  final List<String> _exams = ['Mid-Term', 'Final Exam', 'Internal Assessment'];

  final List<Map<String, String>> _availableStudents = [
    {"name": "Rahul Sharma", "id": "BT2034"},
    {"name": "Sanjana Gupta", "id": "BT2035"},
    {"name": "Amit Kumar", "id": "BT2036"},
    {"name": "Priya Patel", "id": "BT2037"},
    {"name": "Karan Singh", "id": "BT2038"},
  ];

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isMobile = constraints.maxWidth < 1100;

        return Scaffold(
          backgroundColor: const Color(0xFFF8F6F6),
          body: isMobile
              ? Column(
                  children: [
                    _buildMobileHeader(),
                    Expanded(
                      child: _addedResults.isEmpty
                          ? _buildEmptyState()
                          : ListView.builder(
                              padding: const EdgeInsets.all(20),
                              itemCount: _addedResults.length,
                              itemBuilder: (context, index) =>
                                  _resultCard(_addedResults[index], index),
                            ),
                    ),
                    _buildFooterActions(isMobile),
                  ],
                )
              : Row(
                  children: [
                    // ── LEFT: Filters ──
                    _buildLeftPanel(isMobile),

                    // ── RIGHT: Results Entry ──
                    Expanded(
                      child: Column(
                        children: [
                          _buildHeader(isMobile),
                          Expanded(
                            child: _addedResults.isEmpty
                                ? _buildEmptyState()
                                : _buildResultsTable(),
                          ),
                          _buildFooterActions(isMobile),
                        ],
                      ),
                    ),
                  ],
                ),
        );
      },
    );
  }

  Widget _buildMobileHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 50, 20, 24),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1E1E2C), Color(0xFF2D2D44)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(32),
          bottomRight: Radius.circular(32),
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              _backButton(),
              const Spacer(),
              const Text(
                "Publish Results",
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const Spacer(),
              const SizedBox(width: 40),
            ],
          ),
          const SizedBox(height: 24),
          _addStudentSearchBox(true),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: _customDropdown(
                  _depts,
                  _selectedDept,
                  (v) => setState(() => _selectedDept = v),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _customDropdown(
                  _branches,
                  _selectedBranch,
                  (v) => setState(() => _selectedBranch = v),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _resultCard(Map<String, dynamic> res, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 10),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    res['name'],
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  Text(
                    "ID: ${res['id']}",
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                onPressed: () => setState(() => _addedResults.removeAt(index)),
              ),
            ],
          ),
          const Divider(height: 32),
          Row(
            children: [
              _mobileMarkInput("Maths"),
              _mobileMarkInput("Physics"),
              _mobileMarkInput("Chem"),
              const Spacer(),
              _gradeBadge("B+"),
            ],
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.1);
  }

  Widget _mobileMarkInput(String label) {
    return Padding(
      padding: const EdgeInsets.only(right: 12),
      child: Column(
        children: [
          Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
          const SizedBox(height: 6),
          _marksInput(),
        ],
      ),
    );
  }

  Widget _buildLeftPanel(bool isMobile) {
    return Container(
      width: 350,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF1E1E2C), Color(0xFF2D2D44)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            top: -50,
            left: -50,
            child: _blurBlob(200, Colors.blue.withValues(alpha: 0.05)),
          ),
          Positioned(
            bottom: -100,
            right: -50,
            child: _blurBlob(300, AppColors.primaryRed.withValues(alpha: 0.05)),
          ),
          Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _backButton(),
                const SizedBox(height: 48),
                const Text(
                  "Publish Results",
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w900,
                    fontSize: 32,
                    letterSpacing: -1,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  "Select academic criteria to start publishing student performance reports.",
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.6),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 48),

                _formLabel("Department"),
                _customDropdown(
                  _depts,
                  _selectedDept,
                  (v) => setState(() => _selectedDept = v),
                ),
                const SizedBox(height: 24),

                _formLabel("Branch / Course"),
                _customDropdown(
                  _branches,
                  _selectedBranch,
                  (v) => setState(() => _selectedBranch = v),
                ),
                const SizedBox(height: 24),

                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _formLabel("Semester"),
                          _customDropdown(
                            _semesters,
                            _selectedSemester,
                            (v) => setState(() => _selectedSemester = v),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _formLabel("Exam Cycle"),
                          _customDropdown(
                            _exams,
                            _selectedExam,
                            (v) => setState(() => _selectedExam = v),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),

                const Spacer(),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.05),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                  ),
                  child: const Row(
                    children: [
                      Icon(
                        Icons.info_outline_rounded,
                        color: Colors.blueAccent,
                        size: 20,
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          "Ensure all internal marks are verified before final publication.",
                          style: TextStyle(color: Colors.white70, fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(bool isMobile) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 32),
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _addStudentSearchBox(isMobile),
          if (!isMobile)
            Row(
              children: [
                _actionIconBtn(Icons.file_download_outlined, "Import CSV"),
                const SizedBox(width: 12),
                _actionIconBtn(Icons.print_outlined, "Print Preview"),
              ],
            ),
        ],
      ),
    );
  }

  Widget _addStudentSearchBox(bool isMobile) {
    return Container(
      width: isMobile ? double.infinity : 450,
      decoration: BoxDecoration(
        color: const Color(0xFFF8F6F6),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          const SizedBox(width: 20),
          const Icon(Icons.person_search_rounded, color: Colors.grey, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: TextField(
              controller: _studentSearchController,
              decoration: const InputDecoration(
                hintText: "Search student by name or ID to add...",
                hintStyle: TextStyle(fontSize: 13, color: Colors.grey),
                border: InputBorder.none,
              ),
              onSubmitted: (val) => _showStudentSelector(),
            ),
          ),
          InkWell(
            onTap: _showStudentSelector,
            child: Container(
              margin: const EdgeInsets.all(6),
              padding: EdgeInsets.symmetric(
                horizontal: isMobile ? 12 : 20,
                vertical: 12,
              ),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                isMobile ? "Add" : "Add Student",
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showStudentSelector() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: const Text(
          "Select Student",
          style: TextStyle(fontWeight: FontWeight.w900),
        ),
        content: SizedBox(
          width: 400,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: _availableStudents.length,
            itemBuilder: (context, i) {
              final s = _availableStudents[i];
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: AppColors.primaryRed.withValues(alpha: 0.1),
                  child: Text(
                    s['name']![0],
                    style: TextStyle(
                      color: AppColors.primaryRed,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                title: Text(
                  s['name']!,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                subtitle: Text("ID: ${s['id']}"),
                onTap: () {
                  setState(() {
                    _addedResults.add({
                      "name": s['name'],
                      "id": s['id'],
                      "marks": {"Maths": "", "Physics": "", "Chemistry": ""},
                      "grade": "N/A",
                    });
                  });
                  Navigator.pop(context);
                },
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.library_books_rounded,
            size: 80,
            color: Colors.grey.shade300,
          ),
          const SizedBox(height: 24),
          Text(
            "No results added for compilation",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Colors.grey.shade500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            "Search and add students using the bar above to start marking.",
            style: TextStyle(fontSize: 13, color: Colors.grey.shade400),
          ),
        ],
      ).animate().fadeIn().scale(begin: const Offset(0.9, 0.9)),
    );
  }

  Widget _buildResultsTable() {
    return Container(
      margin: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 30),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: SingleChildScrollView(
          child: DataTable(
            headingRowColor: WidgetStateProperty.all(const Color(0xFFFBFBFC)),
            columns: const [
              DataColumn(
                label: Text(
                  "STUDENT NAME",
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
              ),
              DataColumn(
                label: Text(
                  "MATHEMATICS",
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
              ),
              DataColumn(
                label: Text(
                  "PHYSICS",
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
              ),
              DataColumn(
                label: Text(
                  "CHEMISTRY",
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
              ),
              DataColumn(
                label: Text(
                  "GRADE",
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
              ),
              DataColumn(
                label: Text(
                  "ACTION",
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 12,
                    color: Colors.grey,
                  ),
                ),
              ),
            ],
            rows: _addedResults.asMap().entries.map((entry) {
              final i = entry.key;
              final res = entry.value;
              return DataRow(
                cells: [
                  DataCell(
                    Text(
                      res['name'],
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                  DataCell(_marksInput()),
                  DataCell(_marksInput()),
                  DataCell(_marksInput()),
                  DataCell(_gradeBadge("B+")),
                  DataCell(
                    IconButton(
                      icon: const Icon(
                        Icons.remove_circle_outline_rounded,
                        color: Colors.redAccent,
                        size: 20,
                      ),
                      onPressed: () =>
                          setState(() => _addedResults.removeAt(i)),
                    ),
                  ),
                ],
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  Widget _marksInput() {
    return Container(
      width: 60,
      height: 35,
      decoration: BoxDecoration(
        color: const Color(0xFFF8F6F6),
        borderRadius: BorderRadius.circular(8),
      ),
      child: const TextField(
        textAlign: TextAlign.center,
        decoration: InputDecoration(
          border: InputBorder.none,
          hintText: "00",
          hintStyle: TextStyle(fontSize: 12),
        ),
        keyboardType: TextInputType.number,
      ),
    );
  }

  Widget _gradeBadge(String grade) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.green.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        grade,
        style: const TextStyle(
          color: Colors.green,
          fontWeight: FontWeight.bold,
          fontSize: 11,
        ),
      ),
    );
  }

  Widget _buildFooterActions(bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 20 : 40,
        vertical: isMobile ? 16 : 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFF1F1F1))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          if (!isMobile)
            Row(
              children: [
                const Icon(
                  Icons.check_circle_outline_rounded,
                  color: Colors.green,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Text(
                  "Total Students Linked: ${_addedResults.length}",
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          Expanded(
            child: Row(
              mainAxisAlignment:
                  isMobile ? MainAxisAlignment.center : MainAxisAlignment.end,
              children: [
                if (isMobile)
                  Expanded(child: _secondaryBtn("Save"))
                else
                  _secondaryBtn("Save Progress"),
                const SizedBox(width: 16),
                if (isMobile)
                  Expanded(child: _mainActionBtn("Publish"))
                else
                  _mainActionBtn("Publish Results Now"),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── HELPER WIDGETS ──
  Widget _blurBlob(double size, Color color) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      color: color,
      boxShadow: [BoxShadow(color: color, blurRadius: 100, spreadRadius: 50)],
    ),
  );

  Widget _backButton() => InkWell(
    onTap: () => Navigator.pop(context),
    child: Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Icon(
        Icons.arrow_back_ios_new_rounded,
        color: Colors.white,
        size: 16,
      ),
    ),
  );

  Widget _formLabel(String label) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(
      label,
      style: TextStyle(
        color: Colors.white.withValues(alpha: 0.5),
        fontSize: 11,
        fontWeight: FontWeight.bold,
        letterSpacing: 1,
      ),
    ),
  );

  Widget _customDropdown(
    List<String> items,
    String? value,
    Function(String?) onChanged,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          dropdownColor: const Color(0xFF2D2D44),
          icon: const Icon(
            Icons.keyboard_arrow_down_rounded,
            color: Colors.white54,
          ),
          isExpanded: true,
          hint: Text(
            "Select Option",
            style: TextStyle(
              color: Colors.white.withValues(alpha: 0.3),
              fontSize: 13,
            ),
          ),
          items: items
              .map(
                (e) => DropdownMenuItem(
                  value: e,
                  child: Text(
                    e,
                    style: const TextStyle(color: Colors.white, fontSize: 13),
                  ),
                ),
              )
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _actionIconBtn(IconData icon, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.grey.shade600),
          const SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              color: Colors.grey.shade700,
              fontSize: 13,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _secondaryBtn(String label) => ElevatedButton(
    onPressed: () {},
    style: ElevatedButton.styleFrom(
      backgroundColor: const Color(0xFFF1F1F1),
      shadowColor: Colors.transparent,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
    child: Text(
      label,
      style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
    ),
  );

  Widget _mainActionBtn(String label) => Container(
    decoration: BoxDecoration(
      gradient: AppColors.primaryGradient,
      borderRadius: BorderRadius.circular(12),
      boxShadow: [
        BoxShadow(
          color: AppColors.primaryRed.withValues(alpha: 0.3),
          blurRadius: 15,
          offset: const Offset(0, 5),
        ),
      ],
    ),
    child: ElevatedButton(
      onPressed: () {},
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.transparent,
        shadowColor: Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 20),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
        ),
      ),
    ),
  );
}
