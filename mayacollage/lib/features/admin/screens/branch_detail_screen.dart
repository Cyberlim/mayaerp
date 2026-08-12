import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/app_constants.dart';
import 'create_course_screen.dart';
import 'course_detail_screen.dart';
import '../../../core/services/course_service.dart';
import '../../../core/services/student_service.dart';

class BranchDetailScreen extends StatefulWidget {
  final Map<String, dynamic> branch;
  final VoidCallback onBack;

  const BranchDetailScreen({
    super.key,
    required this.branch,
    required this.onBack,
  });

  @override
  State<BranchDetailScreen> createState() => _BranchDetailScreenState();
}

class _BranchDetailScreenState extends State<BranchDetailScreen> {
  Map<String, dynamic>? _selectedCourse;
  List<dynamic> _courses = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCourses();
  }

  Future<void> _loadCourses() async {
    try {
      setState(() => _isLoading = true);
      final courses = await CourseService.getAllCourses(branchId: widget.branch['_id']);
      final students = await StudentService.getAllStudents();
      
      for (var c in courses) {
        c['realStudentCount'] = students.where((s) {
          final progRaw = s['selectedProgram'];
          final branchRaw = s['selectedBranch'];
          String? sProgId = progRaw is Map ? progRaw['_id']?.toString() : progRaw?.toString();
          String? sBranchId = branchRaw is Map ? branchRaw['_id']?.toString() : branchRaw?.toString();
          return sProgId == c['_id']?.toString() && sBranchId == widget.branch['_id']?.toString();
        }).length;
      }
      
      if (mounted) {
        setState(() {
          _courses = courses;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading courses: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_selectedCourse != null) {
      return CourseDetailScreen(
        course: _selectedCourse!,
        branch: widget.branch,
        onBack: () => setState(() => _selectedCourse = null),
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final isMobile = width < 700;
        final isTablet = width >= 700 && width < 1050;
        final isDesktop = width >= 1050;

        int crossAxisCount = 1;
        if (isTablet) crossAxisCount = 2;
        if (isDesktop) crossAxisCount = 3;

        double childAspectRatio = 0.8;
        if (isTablet) childAspectRatio = 0.95;
        if (isDesktop) childAspectRatio = 1.05;
        if (width > 1400) childAspectRatio = 1.2;

        double sidePadding = width < 1100 ? 20 : 40;

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
                      _buildBranchBanner(width < 1100),
                      SizedBox(height: width < 1100 ? 32 : 60),
                      if (width < 1100)
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              "Registered Courses",
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.5,
                              ),
                            ),
                            const SizedBox(height: 16),
                            _searchBar(true),
                          ],
                        )
                      else
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              "Registered Courses",
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.5,
                              ),
                            ),
                            _searchBar(false),
                          ],
                        ),
                      const SizedBox(height: 32),
                      _isLoading 
                          ? const Center(child: Padding(padding: EdgeInsets.all(40.0), child: CircularProgressIndicator()))
                          : _courses.isEmpty
                              ? const Center(child: Padding(padding: EdgeInsets.all(40.0), child: Text("No courses registered yet.")))
                              : _buildCourseGrid(width, crossAxisCount, childAspectRatio),
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
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(bottom: BorderSide(color: Color(0xFFF1F1F1))),
        ),
        child: Column(
          children: [
            Row(
              children: [
                IconButton(
                  onPressed: widget.onBack,
                  icon: const Icon(Icons.arrow_back_ios_rounded),
                  color: Colors.black,
                  iconSize: 18,
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    widget.branch['name'],
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.5,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () async {
                  final result = await Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => CreateCourseScreen(branch: widget.branch),
                    ),
                  );
                  if (result == true) {
                    _loadCourses();
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: const Icon(Icons.library_add_rounded, size: 20),
                label: const Text(
                  "Deploy New Course",
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
        children: [
          IconButton(
            onPressed: widget.onBack,
            icon: const Icon(Icons.arrow_back_ios_rounded),
            color: Colors.black,
            iconSize: 20,
          ),
          const SizedBox(width: 24),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.branch['name'],
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                "Managing courses and academic schedules for ${widget.branch['code']}",
                style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
              ),
            ],
          ),
          const Spacer(),
          ElevatedButton.icon(
            onPressed: () async {
              final result = await Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => CreateCourseScreen(branch: widget.branch),
                ),
              );
              if (result == true) {
                _loadCourses();
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            icon: const Icon(Icons.library_add_rounded, size: 20),
            label: const Text(
              "Deploy New Course",
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBranchBanner(bool isMobile) {
    if (isMobile) {
      return Container(
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              widget.branch['color'] ?? Colors.blue,
              widget.branch['color']?.withOpacity(0.7) ??
                  Colors.blue.withValues(alpha: 0.7),
            ],
          ),
          borderRadius: BorderRadius.circular(24),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.branch['code'] ?? "CODE",
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.8),
                fontWeight: FontWeight.w900,
                letterSpacing: 2,
                fontSize: 10,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              widget.branch['name'] ?? "Branch Name",
              style: const TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.w900,
                letterSpacing: -1,
                height: 1.1,
              ),
            ),
            const SizedBox(height: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _bannerRow(Icons.person_pin_rounded, "Dean: ${widget.branch['dean'] ?? 'N/A'}"),
                const SizedBox(height: 8),
                _bannerRow(Icons.email_outlined, "${widget.branch['contactEmail'] ?? 'N/A'}"),
                const SizedBox(height: 8),
                _bannerRow(Icons.location_on_rounded, "${widget.branch['location'] ?? 'N/A'} - Est: ${widget.branch['establishedYear'] ?? 'N/A'}"),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _bannerStat(
                  "${widget.branch['studentsCount'] ?? 0}",
                  "Students",
                  isMobile: true,
                ),
                _bannerStat(
                  "${widget.branch['coursesCount'] ?? 0}",
                  "Courses",
                  isMobile: true,
                ),
                _bannerStat(
                  "${widget.branch['occupancy']}%",
                  "Occupancy",
                  isMobile: true,
                ),
              ],
            ),
          ],
        ),
      );
    }
    return Container(
      width: double.infinity,
      height: 240,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            widget.branch['color'] ?? Colors.blue,
            widget.branch['color']?.withOpacity(0.7) ??
                Colors.blue.withValues(alpha: 0.7),
          ],
        ),
        borderRadius: BorderRadius.circular(40),
        boxShadow: [
          BoxShadow(
            color: (widget.branch['color'] ?? Colors.blue).withOpacity(0.3),
            blurRadius: 30,
            offset: const Offset(0, 15),
          ),
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            right: -20,
            bottom: -20,
            child: Icon(
              widget.branch['icon'] ?? Icons.school,
              size: 240,
              color: Colors.white.withValues(alpha: 0.1),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(40),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        widget.branch['code'] ?? "CODE",
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.8),
                          fontWeight: FontWeight.w900,
                          letterSpacing: 2,
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        widget.branch['name'] ?? "Branch Name",
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -1,
                          height: 1.1,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          const Icon(
                            Icons.person_pin_rounded,
                            color: Colors.white70,
                            size: 16,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            "Dean: ${widget.branch['dean'] ?? 'N/A'}",
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 16),
                          const Icon(
                            Icons.email_outlined,
                            color: Colors.white70,
                            size: 16,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            "${widget.branch['contactEmail'] ?? 'N/A'}",
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(
                            Icons.location_on_rounded,
                            color: Colors.white70,
                            size: 16,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            "${widget.branch['location'] ?? 'N/A'}",
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(width: 16),
                          const Icon(
                            Icons.calendar_month_rounded,
                            color: Colors.white70,
                            size: 16,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            "Established: ${widget.branch['establishedYear'] ?? 'N/A'}",
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 40),
                Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _bannerStat(
                      "${widget.branch['studentsCount'] ?? 0}",
                      "Active Students",
                    ),
                    const SizedBox(height: 20),
                    _bannerStat(
                      "${widget.branch['coursesCount'] ?? 0}",
                      "Primary Courses",
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn().scale(begin: const Offset(0.98, 0.98));
  }

  Widget _bannerRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, color: Colors.white70, size: 14),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
    );
  }

  Widget _bannerStat(String val, String label, {bool isMobile = false}) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          val,
          style: TextStyle(
            color: Colors.white,
            fontSize: isMobile ? 20 : 28,
            fontWeight: FontWeight.w900,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            color: Colors.white70,
            fontSize: isMobile ? 10 : 12,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _searchBar(bool isMobile) {
    return Container(
      width: isMobile ? double.infinity : 320,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
      ),
      child: const TextField(
        decoration: InputDecoration(
          hintText: "Search courses...",
          border: InputBorder.none,
          icon: Icon(Icons.search_rounded, color: Colors.grey, size: 20),
        ),
      ),
    );
  }

  Widget _buildCourseGrid(
    double width,
    int crossAxisCount,
    double childAspectRatio,
  ) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        mainAxisSpacing: width < 1100 ? 20 : 32,
        crossAxisSpacing: width < 1100 ? 20 : 32,
        childAspectRatio: childAspectRatio,
      ),
      itemCount: _courses.length,
      itemBuilder: (context, i) => _courseCard(_courses[i], i, width),
    );
  }

  Widget _courseCard(Map<String, dynamic> course, int i, double width) {
    final isDesktop = width >= 1050;
    final isMobile = width < 700;

    return InkWell(
      onTap: null,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: EdgeInsets.all(isDesktop ? 28 : 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Colors.black.withValues(alpha: 0.04)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 30,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Stack(
          children: [
            Positioned(
              top: 0,
              right: 0,
              child: Row(
                children: [
                  IconButton(
                    onPressed: () async {
                      final result = await Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => CreateCourseScreen(
                            branch: widget.branch,
                            course: course,
                          ),
                        ),
                      );
                      if (result == true) {
                        _loadCourses();
                      }
                    },
                    icon: const Icon(Icons.edit_note_rounded, color: Colors.grey, size: 22),
                    tooltip: "Edit Course Details",
                    style: IconButton.styleFrom(
                      backgroundColor: const Color(0xFFF8F6F6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: () async {
                      final confirm = await showDialog<bool>(
                        context: context,
                        builder: (ctx) => AlertDialog(
                          title: const Text("Delete Course"),
                          content: const Text("Are you sure you want to delete this course? This action cannot be undone."),
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
                          await CourseService.deleteCourse(course['_id']);
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Course deleted successfully'), backgroundColor: Colors.green),
                            );
                            _loadCourses();
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
                    icon: const Icon(Icons.delete_outline_rounded, color: Colors.red, size: 22),
                    tooltip: "Delete Course",
                    style: IconButton.styleFrom(
                      backgroundColor: const Color(0xFFF8F6F6),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: isDesktop ? 64 : 56,
                      height: isDesktop ? 64 : 56,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8F6F6),
                        borderRadius: BorderRadius.circular(16),
                        image: DecorationImage(
                          image: NetworkImage(course['image'] ?? "https://api.dicebear.com/7.x/shapes/svg?seed=${course['code']}"),
                          fit: BoxFit.cover,
                        ),
                      ),
                    ),
                    SizedBox(width: isDesktop ? 20 : 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppColors.primaryRed.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              course['code'] ?? "",
                              style: TextStyle(
                                color: AppColors.primaryRed,
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Padding(
                            padding: const EdgeInsets.only(right: 48),
                            child: Text(
                              course['name'] ?? "",
                              style: TextStyle(
                                fontWeight: FontWeight.w900,
                                fontSize: isDesktop ? 18 : 16,
                                height: 1.2,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    _infoRow(Icons.timer_outlined, "${course['duration'] ?? 4} Years"),
                    const SizedBox(width: 12),
                    _infoRow(Icons.person_outline_rounded, course['coordinator'] ?? "No Coordinator"),
                    const Spacer(),
                    _statusBadge(course['status'] ?? "Active"),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _infoRow(Icons.payments_outlined, "₹${course['tuitionFee'] ?? 0} Total Fee"),
                    if (course['labIndex'] != null) ...[
                      const SizedBox(width: 12),
                      _infoRow(Icons.biotech_outlined, "Lab: ${course['labIndex']}"),
                    ],
                  ],
                ),
                const SizedBox(height: 20),
                const Divider(height: 1, color: Color(0xFFF1F1F1)),
                const SizedBox(height: 20),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _miniDetail(
                      Icons.groups_rounded,
                      "Students",
                      "${course['realStudentCount'] ?? 0}",
                    ),
                    _miniDetail(
                      Icons.stars_rounded,
                      "Intake",
                      "${course['intakeCapacity'] ?? 60}",
                    ),
                    _miniDetail(
                      Icons.school_rounded,
                      "Fee/Sem",
                      "₹${(course['semesterFees'] != null && (course['semesterFees'] as List).isNotEmpty) ? (course['semesterFees'] as List)[0]['fee'] : (course['tuitionFee'] ?? 0)}",
                    ),
                  ],
                ),
                const Spacer(),
                SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: () => setState(() => _selectedCourse = course),
                    style: TextButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      backgroundColor: const Color(0xFFF8F6F6),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      "View Details",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                        color: Colors.black,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: (i * 50).ms).scale(begin: const Offset(0.98, 0.98));
  }

  Widget _miniDetail(IconData icon, String label, String val) {
    return Column(
      children: [
        Text(
          val,
          style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: TextStyle(
            color: Colors.grey.shade400,
            fontSize: 10,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _statusBadge(String status) {
    bool active = status == "Active";
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: (active ? Colors.green : Colors.orange).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: active ? Colors.green : Colors.orange,
          fontSize: 8,
          fontWeight: FontWeight.w900,
        ),
      ),
    );
  }

  Widget _infoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: Colors.grey.shade400),
        const SizedBox(width: 6),
        Text(
          text,
          style: TextStyle(
            color: Colors.grey.shade600,
            fontSize: 11,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
