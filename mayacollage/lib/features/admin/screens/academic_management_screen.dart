import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';
import 'branch_detail_screen.dart';
import 'create_branch_screen.dart';
import '../../../core/services/branch_service.dart';
import '../../../core/services/course_service.dart';
import '../../../core/services/student_service.dart';
import '../../../core/services/user_service.dart';

class AcademicManagementScreen extends StatefulWidget {
  const AcademicManagementScreen({super.key});

  @override
  State<AcademicManagementScreen> createState() =>
      _AcademicManagementScreenState();
}

class _AcademicManagementScreenState extends State<AcademicManagementScreen> {
  Map<String, dynamic>? _selectedBranch;
  List<dynamic> _branches = [];
  bool _isLoading = true;
  
  int _totalCourses = 0;
  int _totalDepartments = 0;
  int _totalFaculty = 0;

  @override
  void initState() {
    super.initState();
    _loadBranches();
  }

  Future<void> _loadBranches() async {
    try {
      setState(() => _isLoading = true);
      final branches = await BranchService.getAllBranches();
      final courses = await CourseService.getAllCourses();
      final students = await StudentService.getAllStudents();
      final users = await UserService.getAllUsers();
      
      int totalDepts = 0;
      
      for (var b in branches) {
        b['coursesCount'] = courses.where((c) {
          final bId = c['branchId'] is Map ? c['branchId']['_id'] : c['branchId'];
          return bId == b['_id'];
        }).length;
        b['studentsCount'] = students.where((s) {
          final branchRaw = s['selectedBranch'];
          final sBranchId = branchRaw is Map ? branchRaw['_id']?.toString() : branchRaw?.toString();
          return sBranchId == b['_id']?.toString();
        }).length;
        
        totalDepts += (b['departments'] as num?)?.toInt() ?? 1;
      }
      
      final facultyCount = users.where((u) => u['role'] == 'Faculty').length;

      if (mounted) {
        setState(() {
          _branches = branches;
          _totalCourses = courses.length;
          _totalDepartments = totalDepts;
          _totalFaculty = facultyCount;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading branches: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  IconData _getIcon(String? name) {
    switch (name) {
      case 'architecture_rounded': return Icons.architecture_rounded;
      case 'biotech_rounded': return Icons.biotech_rounded;
      case 'business_center_rounded': return Icons.business_center_rounded;
      case 'computer_rounded': return Icons.computer_rounded;
      case 'gavel_rounded': return Icons.gavel_rounded;
      case 'medical_services_rounded': return Icons.medical_services_rounded;
      case 'palette_rounded': return Icons.palette_rounded;
      case 'science_rounded': return Icons.science_rounded;
      case 'settings_rounded': return Icons.settings_rounded;
      default: return Icons.business_center_rounded;
    }
  }

  Color _getColor(String? hex) {
    if (hex == null || hex.isEmpty) return Colors.blue;
    try {
      final hexCode = hex.replaceAll('#', '');
      return Color(int.parse('FF$hexCode', radix: 16));
    } catch (e) {
      return Colors.blue;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_selectedBranch != null) {
      return BranchDetailScreen(
        branch: {
          ..._selectedBranch!,
          'color': _getColor(_selectedBranch!['colorHex']),
          'icon': _getIcon(_selectedBranch!['iconName']),
          'dean': _selectedBranch!['deanName'],
          'coursesCount': _selectedBranch!['coursesCount'] ?? 0,
          'studentsCount': _selectedBranch!['studentsCount'] ?? 0,
          'departments': _selectedBranch!['departments'] ?? 1,
          'occupancy': _selectedBranch!['occupancy'] ?? 0,
        },
        onBack: () {
          setState(() => _selectedBranch = null);
          _loadBranches(); // Refresh in case courses were added
        },
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final isMobile = width < 750;
        final isTablet = width >= 750 && width < 1100;
        final isDesktop = width >= 1100;

        int crossAxisCount = 1;
        if (isTablet) crossAxisCount = 2;
        if (isDesktop) crossAxisCount = 3;

        double childAspectRatio = 0.85;
        if (isTablet) childAspectRatio = 1.05;
        if (isDesktop) childAspectRatio = 1.2;
        if (width > 1500) childAspectRatio = 1.35;

        double sidePadding = isMobile ? 20 : 40;

        return Scaffold(
          backgroundColor: const Color(0xFFF8F6F6),
          body: Column(
            children: [
              _buildHeader(width < 1100),
              Expanded(
                child: SingleChildScrollView(
                  padding: EdgeInsets.all(sidePadding),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildAcademicOverview(width < 1100),
                      SizedBox(height: isMobile ? 32 : 48),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "Institutional Branches",
                            style: TextStyle(
                              fontSize: isMobile ? 18 : 22,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.5,
                            ),
                          ),
                          TextButton.icon(
                            onPressed: () {},
                            icon: const Icon(
                              Icons.filter_list_rounded,
                              size: 18,
                            ),
                            label: Text(
                              isMobile ? "Filter" : "Filter Branches",
                              style: const TextStyle(fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: isMobile ? 16 : 32),
                      _isLoading 
                          ? const Center(child: Padding(padding: EdgeInsets.all(40.0), child: CircularProgressIndicator()))
                          : _branches.isEmpty 
                              ? const Center(child: Padding(padding: EdgeInsets.all(40.0), child: Text("No branches configured yet.")))
                              : _buildBranchGrid(width, crossAxisCount, childAspectRatio),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildHeader(bool isMobile) {
    if (isMobile) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(bottom: BorderSide(color: Color(0xFFF1F1F1))),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Academic Structure",
              style: AppTheme.titleStyle.copyWith(
                fontSize: 22,
                fontWeight: FontWeight.w900,
                letterSpacing: -0.5,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () async {
                  final result = await Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const CreateBranchScreen()),
                  );
                  if (result == true) {
                    _loadBranches();
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryRed,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: const Icon(Icons.add_business_rounded, size: 20),
                label: const Text(
                  "Add New Branch",
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ],
        ),
      );
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 24),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFF1F1F1))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Academic Structure",
                style: AppTheme.titleStyle.copyWith(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                "Configure branches, departments, and course curricula",
                style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
              ),
            ],
          ),
          ElevatedButton.icon(
            onPressed: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const CreateBranchScreen()),
              );
              if (result == true) {
                _loadBranches();
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryRed,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            icon: const Icon(Icons.add_business_rounded, size: 20),
            label: const Text(
              "Add New Branch",
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAcademicOverview(bool isMobile) {
    final items = [
      _overviewCard(
        "Total Branches",
        _branches.length.toString().padLeft(2, '0'),
        Icons.account_tree_rounded,
        Colors.blue,
        isMobile: isMobile,
      ),
      _overviewCard(
        "Active Courses",
        _totalCourses.toString(),
        Icons.menu_book_rounded,
        Colors.purple,
        isMobile: isMobile,
      ),
      _overviewCard(
        "Departments",
        _totalDepartments.toString(),
        Icons.hub_rounded,
        Colors.orange,
        isMobile: isMobile,
      ),
      _overviewCard(
        "Faculty Count",
        _totalFaculty.toString(),
        Icons.people_alt_rounded,
        Colors.green,
        isMobile: isMobile,
      ),
    ];

    if (isMobile) {
      return SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        child: Row(
          children: items
              .map(
                (card) => Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: SizedBox(width: 240, child: card),
                ),
              )
              .toList(),
        ),
      );
    }

    return Row(
      children: items
          .map(
            (card) => Expanded(
              child: Padding(
                padding: const EdgeInsets.only(right: 24),
                child: card,
              ),
            ),
          )
          .toList(),
    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1);
  }

  Widget _overviewCard(
    String label,
    String val,
    IconData icon,
    Color color, {
    bool isMobile = false,
  }) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 16 : 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.black.withValues(alpha: 0.03)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  val,
                  style: TextStyle(
                    fontSize: isMobile ? 18 : 24,
                    fontWeight: FontWeight.w900,
                  ),
                ),
                Text(
                  label,
                  style: TextStyle(fontSize: 10, color: Colors.grey.shade500),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBranchGrid(
    double width,
    int crossAxisCount,
    double childAspectRatio,
  ) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        mainAxisSpacing: width < 1100 ? 24 : 32,
        crossAxisSpacing: width < 1100 ? 24 : 32,
        childAspectRatio: childAspectRatio,
      ),
      itemCount: _branches.length,
      itemBuilder: (context, i) => _branchCard(_branches[i], i, width),
    );
  }

  Widget _branchCard(Map<String, dynamic> branch, int i, double width) {
    final isXSmall = width < 500;
    final isMobile = width < 750;
    final isDesktop = width >= 1100;

    final branchColor = _getColor(branch['colorHex']);
    final customIcon = _getIcon(branch['iconName']);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.black.withValues(alpha: 0.03)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 40,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => setState(() => _selectedBranch = branch),
          borderRadius: BorderRadius.circular(24),
          child: Padding(
            padding: EdgeInsets.all(isDesktop ? 32 : (isXSmall ? 16 : 24)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: isDesktop ? 80 : 64,
                      height: isDesktop ? 80 : 64,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [branchColor, branchColor.withValues(alpha: 0.7)],
                        ),
                        borderRadius: BorderRadius.circular(isDesktop ? 24 : 20),
                        boxShadow: [
                          BoxShadow(
                            color: branchColor.withValues(alpha: 0.3),
                            blurRadius: 20,
                            offset: const Offset(0, 8),
                          ),
                        ],
                      ),
                      child: Icon(
                        customIcon,
                        color: Colors.white,
                        size: isDesktop ? 32 : 28,
                      ),
                    ),
                    SizedBox(width: isDesktop ? 20 : 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: branchColor.withValues(alpha: 0.1),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  branch['code'] ?? "",
                                  style: TextStyle(
                                    color: branchColor,
                                    fontSize: 10,
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ),
                              Row(
                                children: [
                                  IconButton(
                                    onPressed: () async {
                                      final result = await Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => CreateBranchScreen(branch: branch),
                                        ),
                                      );
                                      if (result == true) {
                                        _loadBranches();
                                      }
                                    },
                                    icon: const Icon(Icons.edit_note_rounded, color: Colors.grey, size: 20),
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                  ),
                                  const SizedBox(width: 8),
                                  IconButton(
                                    onPressed: () async {
                                      final confirm = await showDialog<bool>(
                                        context: context,
                                        builder: (ctx) => AlertDialog(
                                          title: const Text("Delete Branch"),
                                          content: const Text("Are you sure you want to delete this institutional branch?"),
                                          actions: [
                                            TextButton(
                                              onPressed: () => Navigator.pop(ctx, false),
                                              child: const Text("Cancel"),
                                            ),
                                            TextButton(
                                              onPressed: () => Navigator.pop(ctx, true),
                                              style: TextButton.styleFrom(foregroundColor: Colors.red),
                                              child: const Text("Delete"),
                                            ),
                                          ],
                                        ),
                                      );
                                      if (confirm == true) {
                                        try {
                                          await BranchService.deleteBranch(branch['_id']);
                                          if (mounted) {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              const SnackBar(content: Text('Branch deleted successfully'), backgroundColor: Colors.green),
                                            );
                                            _loadBranches();
                                          }
                                        } catch (e) {
                                          if (mounted) {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
                                            );
                                          }
                                        }
                                      }
                                    },
                                    icon: const Icon(Icons.delete_outline_rounded, color: Colors.red, size: 20),
                                    padding: EdgeInsets.zero,
                                    constraints: const BoxConstraints(),
                                  ),
                                  const SizedBox(width: 12),
                                  const Icon(
                                    Icons.arrow_forward_ios_rounded,
                                    color: Colors.grey,
                                    size: 14,
                                  ),
                                ],
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Text(
                            branch['name'] ?? "",
                            style: TextStyle(
                              fontSize: isDesktop ? 20 : 18,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.5,
                              height: 1.1,
                            ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(
                                Icons.person_outline_rounded,
                                size: 12,
                                color: Colors.grey,
                              ),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  branch['deanName'] ?? 'N/A',
                                  style: TextStyle(
                                    color: Colors.grey.shade500,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(
                                Icons.email_outlined,
                                size: 12,
                                color: Colors.grey,
                              ),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  branch['contactEmail'] ?? 'N/A',
                                  style: TextStyle(
                                    color: Colors.grey.shade500,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Row(
                            children: [
                              const Icon(
                                Icons.location_on_outlined,
                                size: 12,
                                color: Colors.grey,
                              ),
                              const SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  "${branch['location'] ?? 'N/A'} (Est. ${branch['establishedYear'] ?? 'N/A'})",
                                  style: TextStyle(
                                    color: Colors.grey.shade500,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                const Divider(height: 1, color: Color(0xFFF1F1F1)),
                const SizedBox(height: 16),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  child: Row(
                    children: [
                      _iconStat(
                        Icons.library_books_rounded,
                        "${branch['coursesCount'] ?? 0} Units",
                      ),
                      const SizedBox(width: 16),
                      _iconStat(
                        Icons.groups_rounded,
                        "${branch['studentsCount'] ?? 0} Students",
                      ),
                      const SizedBox(width: 16),
                      _iconStat(
                        Icons.hub_rounded,
                        "${branch['departments'] ?? 1} Depts",
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                ClipRRect(
                  borderRadius: BorderRadius.circular(100),
                  child: LinearProgressIndicator(
                    value: (branch['occupancy'] ?? 0) / 100.0,
                    backgroundColor: const Color(0xFFF1F1F1),
                    valueColor: AlwaysStoppedAnimation(branchColor),
                    minHeight: 4,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "Occupancy",
                      style: TextStyle(
                        fontSize: 10,
                        color: Colors.grey.shade500,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      "${branch['occupancy'] ?? 0}% Capacity",
                      style: TextStyle(
                        fontSize: 10,
                        color: branchColor,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    )
        .animate()
        .fadeIn(delay: (i * 50).ms)
        .scale(begin: const Offset(0.98, 0.98));
  }

  Widget _iconStat(IconData icon, String label) {
    return Column(
      children: [
        Icon(icon, size: 18, color: Colors.grey.shade400),
        const SizedBox(height: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w900,
            color: Colors.grey.shade600,
            letterSpacing: 0.5,
          ),
        ),
      ],
    );
  }
}
