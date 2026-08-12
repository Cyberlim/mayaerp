import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import '../../../core/services/student_service.dart';

class MembersScreen extends StatefulWidget {
  const MembersScreen({super.key});

  @override
  State<MembersScreen> createState() => _MembersScreenState();
}

class _MembersScreenState extends State<MembersScreen> {
  List<dynamic> _members = [];
  List<dynamic> _filteredMembers = [];
  bool _isLoading = true;
  String _searchQuery = "";
  String _selectedBranch = "All Branches";
  String _selectedYear = "All Years";

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      setState(() => _isLoading = true);
      final data = await StudentService.getLibraryMembers();
      setState(() {
        _members = data;
        _filteredMembers = data;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredMembers = _members.where((m) {
        final name = "${m['firstName']} ${m['lastName']}".toLowerCase();
        final matchesSearch = name.contains(_searchQuery.toLowerCase()) || m['studentId'].toString().contains(_searchQuery);
        final matchesBranch = _selectedBranch == "All Branches" || m['branch'] == _selectedBranch;
        final matchesYear = _selectedYear == "All Years" || m['sessionYear'] == _selectedYear;
        return matchesSearch && matchesBranch && matchesYear;
      }).toList();
    });
  }

  Future<void> _deleteMember(String id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Delete Member?"),
        content: const Text("Are you sure you want to remove this student from library records?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
          ElevatedButton(onPressed: () => Navigator.pop(context, true), style: ElevatedButton.styleFrom(backgroundColor: Colors.red), child: const Text("Delete", style: TextStyle(color: Colors.white))),
        ],
      ),
    );

    if (confirm == true) {
      try {
        await StudentService.deleteStudent(id);
        _loadData();
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Member deleted successfully")));
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
      }
    }
  }

  String _getPhotoUrl(String? path) {
    if (path == null || path.isEmpty) return "https://i.pravatar.cc/150?img=1";
    if (path.startsWith('http')) return path;
    final baseUrl = dotenv.get('BACKEND_URL', fallback: 'https://mayaerpbackend.onrender.com/api').replaceAll('/api', '');
    final cleanPath = path.trim();
    return "$baseUrl/$cleanPath";
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        bool isMobile = constraints.maxWidth < 800;
        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          body: _isLoading 
            ? const Center(child: CircularProgressIndicator())
            : RefreshIndicator(
                onRefresh: _loadData,
                child: SingleChildScrollView(
                  padding: EdgeInsets.all(isMobile ? 16 : 32),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildHeader(isMobile),
                      const SizedBox(height: 32),
                      _buildSearchAndFilter(isMobile),
                      const SizedBox(height: 24),
                      _buildMembersList(isMobile),
                    ],
                  ),
                ),
              ),
        );
      },
    );
  }

  Widget _buildHeader(bool isMobile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text("Library Members", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), letterSpacing: -1)),
            Text("${_filteredMembers.length} Members total", style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 4),
        Text("Detailed overview of all registered library students.", style: TextStyle(fontSize: 14, color: Colors.grey.shade500)),
      ],
    ).animate().fadeIn().slideY(begin: -0.1);
  }

  Widget _buildSearchAndFilter(bool isMobile) {
    final branches = ["All Branches", ..._members.map((e) => e['branch']?.toString() ?? "N/A").toSet()];
    final years = ["All Years", ..._members.map((e) => e['sessionYear']?.toString() ?? "N/A").toSet()];

    return isMobile
        ? Column(
            children: [
              _searchField(),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(child: _filterDropdown("Branch", branches, _selectedBranch, (v) { _selectedBranch = v!; _applyFilters(); })),
                  const SizedBox(width: 12),
                  Expanded(child: _filterDropdown("Year", years, _selectedYear, (v) { _selectedYear = v!; _applyFilters(); })),
                ],
              ),
            ],
          ).animate().fadeIn(delay: 100.ms)
        : Row(
            children: [
              Expanded(flex: 2, child: _searchField()),
              const SizedBox(width: 24),
              Expanded(flex: 1, child: _filterDropdown("Branch", branches, _selectedBranch, (v) { _selectedBranch = v!; _applyFilters(); })),
              const SizedBox(width: 24),
              Expanded(flex: 1, child: _filterDropdown("Session Year", years, _selectedYear, (v) { _selectedYear = v!; _applyFilters(); })),
            ],
          ).animate().fadeIn(delay: 100.ms);
  }

  Widget _searchField() {
    return Container(
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
      child: TextField(
        onChanged: (v) { _searchQuery = v; _applyFilters(); },
        decoration: InputDecoration(hintText: "Search students...", hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14), prefixIcon: const Icon(Icons.search, color: Colors.grey), border: InputBorder.none, contentPadding: const EdgeInsets.symmetric(vertical: 16)),
      ),
    );
  }

  Widget _filterDropdown(String hint, List<String> items, String value, Function(String?) onChanged) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          icon: Icon(Icons.keyboard_arrow_down_rounded, color: Colors.grey.shade400),
          items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 14)))).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildMembersList(bool isMobile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (!isMobile)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Row(
              children: [
                Expanded(flex: 3, child: Text("STUDENT", style: _headerStyle())),
                Expanded(flex: 2, child: Text("BRANCH / YEAR", style: _headerStyle())),
                Expanded(flex: 1, child: Text("ISSUES", style: _headerStyle())),
                Expanded(flex: 2, child: Text("ACCOUNT STATUS", style: _headerStyle())),
                SizedBox(width: 100, child: Text("ACTIONS", style: _headerStyle(), textAlign: TextAlign.center)),
              ],
            ),
          ),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: _filteredMembers.length,
          itemBuilder: (context, index) {
            final m = _filteredMembers[index];
            return Container(
              margin: EdgeInsets.only(bottom: isMobile ? 12 : 16),
              padding: EdgeInsets.all(isMobile ? 16 : 20),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), boxShadow: [BoxShadow(color: const Color(0xFF6366F1).withValues(alpha: 0.05), blurRadius: 20, offset: const Offset(0, 8))]),
              child: isMobile ? _buildMobileMemberRow(m) : _buildDesktopMemberRow(m),
            ).animate().fadeIn(delay: (20 * index).ms);
          },
        ),
      ],
    );
  }

  TextStyle _headerStyle() => TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade500, fontSize: 12, letterSpacing: 0.5);

  Widget _buildMobileMemberRow(dynamic m) {
    final status = m['issues'] > 0 ? "Active" : "Inactive";
    return Column(
      children: [
        Row(
          children: [
            CircleAvatar(radius: 20, backgroundImage: NetworkImage(_getPhotoUrl(m['applicantPhoto']))),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text("${m['firstName']} ${m['lastName']}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              Text(m['studentId'] ?? m['admissionNumber'], style: const TextStyle(color: Colors.grey, fontSize: 12)),
            ])),
            _statusBadge(status),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
             Text("${m['issues']} Bound Books", style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
             IconButton(onPressed: () => _deleteMember(m['_id']), icon: const Icon(Icons.delete_outline, color: Colors.red, size: 20)),
          ],
        )
      ],
    );
  }

  Widget _buildDesktopMemberRow(dynamic m) {
    final status = m['issues'] > 0 ? "Active" : "Inactive";
    return Row(
      children: [
        Expanded(flex: 3, child: Row(children: [
          CircleAvatar(radius: 24, backgroundImage: NetworkImage(_getPhotoUrl(m['applicantPhoto']))),
          const SizedBox(width: 16),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text("${m['firstName']} ${m['lastName']}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            Text(m['studentId'] ?? m['admissionNumber'], style: const TextStyle(color: Colors.grey, fontSize: 12)),
          ]),
        ])),
        Expanded(flex: 2, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(m['branch'] ?? "N/A", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          Text(m['sessionYear'] ?? "N/A", style: const TextStyle(color: Colors.grey, fontSize: 12)),
        ])),
        Expanded(flex: 1, child: Row(children: [
          const Icon(Icons.menu_book_rounded, size: 16, color: Color(0xFF4F46E5)),
          const SizedBox(width: 8),
          Text("${m['issues']}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
        ])),
        Expanded(flex: 2, child: _statusBadge(status)),
        SizedBox(width: 100, child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            IconButton(onPressed: () => _deleteMember(m['_id']), icon: const Icon(Icons.delete_outline_rounded, color: Colors.grey, size: 20), tooltip: "Delete Member"),
            IconButton(onPressed: () {}, icon: const Icon(Icons.visibility_outlined, color: Colors.blue, size: 20), tooltip: "View History"),
          ],
        )),
      ],
    );
  }

  Widget _statusBadge(String status) {
    Color color = status == "Active" ? Colors.green : Colors.grey;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(100)),
      child: Text(status.toUpperCase(), style: TextStyle(color: color, fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
    );
  }
}
