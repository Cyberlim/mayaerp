import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';
import '../../../core/services/transport_service.dart';
import '../../../core/services/student_service.dart';
import '../../../core/services/socket_service.dart';
import 'create_bus_screen.dart';

class TransportManagementScreen extends StatefulWidget {
  const TransportManagementScreen({super.key});

  @override
  State<TransportManagementScreen> createState() =>
      _TransportManagementScreenState();
}

class _TransportManagementScreenState extends State<TransportManagementScreen> {
  List<Map<String, dynamic>> _buses = [];
  bool _isLoading = true;
  String _searchQuery = "";
  Map<String, dynamic>? _selectedBus;

  @override
  void initState() {
    super.initState();
    _fetchBuses();
    _setupSocket();
  }

  void _setupSocket() {
    SocketService.init();
    SocketService.onBusUpdated((_) {
      if (mounted) _fetchBuses();
    });
  }

  Future<void> _fetchBuses() async {
    try {
      final buses = await TransportService.getBuses();
      if (mounted) {
        setState(() {
          _buses = buses;
          if (_selectedBus != null) {
            _selectedBus = buses.cast<Map<String, dynamic>?>().firstWhere(
              (b) => b?['_id'] == _selectedBus!['_id'],
              orElse: () => buses.isNotEmpty ? buses[0] : null,
            );
          } else if (buses.isNotEmpty) {
            _selectedBus = buses[0];
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error fetching fleet: $e")),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        bool isMobile = constraints.maxWidth < 1100;

        return Scaffold(
          backgroundColor: const Color(0xFFF8F6F6),
          body: _isLoading 
            ? const Center(child: CircularProgressIndicator())
            : Row(
            children: [
              Expanded(
                flex: 3,
                child: Column(
                  children: [
                    _buildHeader(isMobile),
                    Expanded(
                      child: SingleChildScrollView(
                        padding: EdgeInsets.all(isMobile ? 20 : 40),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildFleetStats(isMobile),
                            SizedBox(height: isMobile ? 32 : 48),
                            _buildControls(isMobile),
                            const SizedBox(height: 24),
                            _buses.isEmpty 
                              ? _buildEmptyState()
                              : _buildBusGrid(isMobile),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (!isMobile && _selectedBus != null) _buildDetailSidebar(false),
            ],
          ),
          floatingActionButton: isMobile && _selectedBus != null
              ? FloatingActionButton.extended(
                  onPressed: () => _showMobileDetails(context),
                  backgroundColor: Colors.black,
                  label: const Text("View Route Details"),
                  icon: const Icon(Icons.info_outline_rounded),
                )
              : null,
        );
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const SizedBox(height: 100),
          Icon(Icons.directions_bus_filled_outlined, size: 64, color: Colors.grey.shade300),
          const SizedBox(height: 24),
          Text("No buses deployed yet.", style: TextStyle(color: Colors.grey.shade500, fontSize: 16)),
        ],
      ),
    );
  }

  void _showMobileDetails(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
        ),
        child: Column(
          children: [
            Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40, height: 4,
              decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
            ),
            Expanded(child: _buildDetailSidebar(true)),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: isMobile ? 20 : 40, vertical: isMobile ? 16 : 24),
      decoration: const BoxDecoration(
        color: Colors.white, border: Border(bottom: BorderSide(color: Color(0xFFF1F1F1))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Fleet Management", style: AppTheme.titleStyle.copyWith(fontSize: isMobile ? 20 : 26, fontWeight: FontWeight.w900)),
                if (!isMobile) Text("Manage institutional logistics, bus routes, and student occupancy", style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
              ],
            ),
          ),
          ElevatedButton.icon(
            onPressed: () async {
              final result = await Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateBusScreen()));
              if (result == true) _fetchBuses();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryRed, foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              elevation: 0,
            ),
            icon: const Icon(Icons.directions_bus_rounded, size: 20),
            label: const Text("Deploy Bus", style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildFleetStats(bool isMobile) {
    int activeCount = _buses.where((b) => b['status'] == 'Active').length;
    int commutersCount = _buses.fold<int>(0, (sum, b) => sum + (b['filled'] as int));
    int serviceCount = _buses.where((b) => b['status'] == 'Service').length;

    if (isMobile) {
      return GridView.count(
        crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
        mainAxisSpacing: 16, crossAxisSpacing: 16, childAspectRatio: 1.1,
        children: [
          _statCard("TOTAL BUSES", _buses.length.toString(), Icons.directions_bus_filled_rounded, "Fleet size", isMobile: true),
          _statCard("ON ROUTE", activeCount.toString(), Icons.route_rounded, "Active now", isMobile: true),
          _statCard("COMMUTERS", commutersCount.toString(), Icons.people_outline_rounded, "Assigned", isMobile: true),
          _statCard("MAINTENANCE", serviceCount.toString(), Icons.build_circle_rounded, "Service", isMobile: true),
        ],
      ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1);
    }
    return Row(
      children: [
        _statCard("TOTAL BUSES", _buses.length.toString(), Icons.directions_bus_filled_rounded, "Fleet size"),
        const SizedBox(width: 24),
        _statCard("ON ROUTE", activeCount.toString(), Icons.route_rounded, "Currently active"),
        const SizedBox(width: 24),
        _statCard("COMMUTERS", commutersCount.toString(), Icons.people_outline_rounded, "Total assigned"),
        const SizedBox(width: 24),
        _statCard("MAINTENANCE", serviceCount.toString(), Icons.build_circle_rounded, "Under service"),
      ],
    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1);
  }

  Widget _statCard(String label, String value, IconData icon, String sub, {bool isMobile = false}) {
    Widget content = Container(
      padding: EdgeInsets.all(isMobile ? 16 : 24),
      decoration: BoxDecoration(
        color: Colors.white, borderRadius: BorderRadius.circular(isMobile ? 20 : 24),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: AppColors.primaryRed.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, color: AppColors.primaryRed, size: isMobile ? 18 : 20),
          ),
          SizedBox(height: isMobile ? 12 : 20),
          Text(value, style: TextStyle(fontSize: isMobile ? 24 : 28, fontWeight: FontWeight.w900)),
          const SizedBox(height: 4),
          Text(label, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 0.5)),
        ],
      ),
    );
    return isMobile ? content : Expanded(child: content);
  }

  Widget _buildControls(bool isMobile) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: TextField(
        onChanged: (v) => setState(() => _searchQuery = v),
        decoration: const InputDecoration(
          hintText: "Search Bus No, Driver or Route...",
          hintStyle: TextStyle(fontSize: 14, color: Colors.grey),
          border: InputBorder.none,
          icon: Icon(Icons.search_rounded, color: Colors.grey),
        ),
      ),
    );
  }

  Widget _buildBusGrid(bool isMobile) {
    final filtered = _buses.where((b) =>
      b['busNo'].toLowerCase().contains(_searchQuery.toLowerCase()) ||
      b['driverName'].toLowerCase().contains(_searchQuery.toLowerCase()) ||
      b['routeName'].toLowerCase().contains(_searchQuery.toLowerCase()),
    ).toList();

    return GridView.builder(
      shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: isMobile ? 1 : 2, mainAxisSpacing: 24, crossAxisSpacing: 24, childAspectRatio: isMobile ? 1.4 : 1.6,
      ),
      itemCount: filtered.length,
      itemBuilder: (context, index) => _busCard(filtered[index], isMobile),
    );
  }

  Widget _busCard(Map<String, dynamic> data, bool isMobile) {
    bool isSelected = _selectedBus?['_id'] == data['_id'];
    double occupancy = (data['filled'] as int) / (data['capacity'] as int);

    return InkWell(
      onTap: () => setState(() => _selectedBus = data),
      borderRadius: BorderRadius.circular(24),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white, borderRadius: BorderRadius.circular(24),
          border: Border.all(color: isSelected ? AppColors.primaryRed : Colors.transparent, width: 2),
        ),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: Colors.black.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(14)),
                  child: const Icon(Icons.directions_bus_rounded, size: 24),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(data['busNo'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 18)),
                      Text(data['routeName'], style: const TextStyle(color: Colors.grey, fontSize: 12), overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
                _statusChip(data['status']),
              ],
            ),
            const Spacer(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _personInfo("Driver", data['driverName']),
                _personInfo("Conductor", data['conductorName']),
              ],
            ),
            const SizedBox(height: 16),
            _buildOccupancyBar(occupancy, data['filled'], data['capacity']),
          ],
        ),
      ),
    ).animate().fadeIn(delay: (100 * _buses.indexOf(data)).ms).scale(begin: const Offset(0.95, 0.95));
  }

  Widget _buildOccupancyBar(double value, int filled, int capacity) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text("Occupancy", style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
            Text("$filled/$capacity seats", style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(10),
          child: LinearProgressIndicator(
            value: value, backgroundColor: Colors.grey.shade100,
            color: value > 0.9 ? Colors.red : AppColors.primaryRed, minHeight: 6,
          ),
        ),
      ],
    );
  }

  Widget _statusChip(String status) {
    Color c = status == "Full" ? Colors.orange : Colors.green;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: c.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
      child: Text(status.toUpperCase(), style: TextStyle(color: c, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
    );
  }

  Widget _personInfo(String label, String name) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildDetailSidebar(bool isMobile) {
    final bus = _selectedBus!;
    final List students = bus['students'] as List;

    return Container(
      width: isMobile ? double.infinity : 400,
      decoration: BoxDecoration(
        color: Colors.white, border: isMobile ? null : const Border(left: BorderSide(color: Color(0xFFF1F1F1))),
      ),
      child: Column(
        children: [
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text("Bus Logistics", style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                      if (!isMobile) IconButton(onPressed: () => setState(() => _selectedBus = null), icon: const Icon(Icons.close_rounded)),
                    ],
                  ),
                  const SizedBox(height: 32),
                  const Text("ROUTE SCHEDULE", style: TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                  const SizedBox(height: 20),
                  ...List.generate(
                    (bus['stops'] as List).length,
                    (i) => _stopItem(bus['stops'][i], i == (bus['stops'] as List).length - 1),
                  ),
                  const SizedBox(height: 48),
                  Text("STUDENT ROSTER (${students.length})", style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1)),
                  const SizedBox(height: 20),
                  if (students.isEmpty)
                    Text("No students assigned.", style: TextStyle(color: Colors.grey.shade400, fontSize: 13))
                  else
                    ...List.generate(students.length, (i) => _studentCard(students[i], i)),
                ],
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(32),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () => _showAddStudentsModal(context, bus),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black, foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 20),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: const Text("Assign Students"),
                  ),
                ),
                const SizedBox(width: 12),
                IconButton(
                  onPressed: () => _confirmDeleteBus(bus),
                  style: IconButton.styleFrom(backgroundColor: Colors.red.withValues(alpha: 0.1), foregroundColor: Colors.red, padding: const EdgeInsets.all(16)),
                  icon: const Icon(Icons.delete_outline_rounded),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().slideX(begin: isMobile ? 0.0 : 1.0, end: 0.0, duration: 400.ms, curve: Curves.easeOutQuint);
  }

  Future<void> _confirmDeleteBus(Map<String, dynamic> bus) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Remove Bus?", style: TextStyle(fontWeight: FontWeight.bold)),
        content: Text("Are you sure you want to remove ${bus['busNo']} from the fleet?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text("Cancel")),
          TextButton(onPressed: () => Navigator.pop(context, true), style: TextButton.styleFrom(foregroundColor: Colors.red), child: const Text("Remove")),
        ],
      ),
    );
    if (result == true) {
      try {
        await TransportService.deleteBus(bus['_id']);
        if (!mounted) return;
        _fetchBuses();
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
      }
    }
  }

  Widget _stopItem(dynamic stop, bool isLast) {
    String name = "Unknown Station";
    String price = "";
    if (stop is String) {
      name = stop;
    } else if (stop is Map) {
      name = (stop['stationName']?.toString()) ?? "Unnamed Station";
      if (stop.containsKey('price') && stop['price'] != null) price = "₹${stop['price']}";
    }
    return Row(
      children: [
        Column(
          children: [
            Container(
              width: 12, height: 12,
              decoration: BoxDecoration(color: AppColors.primaryRed, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2), boxShadow: [BoxShadow(color: AppColors.primaryRed.withValues(alpha: 0.3), blurRadius: 4)]),
            ),
            if (!isLast) Container(width: 2, height: 30, color: AppColors.primaryRed.withValues(alpha: 0.2)),
          ],
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  if (price.isNotEmpty) Text(price, style: TextStyle(color: AppColors.primaryRed, fontWeight: FontWeight.w900, fontSize: 12)),
                ],
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ],
    );
  }

  Widget _studentCard(dynamic item, int index) {
    final student = item['student'];
    if (student == null) return const SizedBox();
    final name = "${student['firstName']} ${student['lastName']}";
    final branch = student['selectedBranch'] is Map ? student['selectedBranch']['name'] : "General";
    final stop = item['stopName'] ?? "N/A";
    final fare = item['fare'] ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFFF8F6F6), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.black.withValues(alpha: 0.03))),
      child: Row(
        children: [
          CircleAvatar(backgroundColor: Colors.white, foregroundColor: Colors.black, child: Text(student['firstName'][0])),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                Text("$branch • $stop", style: TextStyle(color: Colors.grey.shade500, fontSize: 11)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: (item['paymentStatus'] == 'Paid' ? Colors.green : Colors.orange).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  item['paymentStatus']?.toUpperCase() ?? 'PENDING',
                  style: TextStyle(
                    color: item['paymentStatus'] == 'Paid' ? Colors.green : Colors.orange,
                    fontSize: 8,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text("₹$fare", style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: AppColors.primaryRed)),
              IconButton(
                onPressed: () => _unassignStudent(_selectedBus!['_id'], student['_id']),
                icon: const Icon(Icons.remove_circle_outline, color: Colors.grey, size: 20),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _unassignStudent(String busId, String studentId) async {
    try {
      await TransportService.unassignStudent(busId, studentId);
      if (!mounted) return;
      _fetchBuses();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
    }
  }

  void _showAddStudentsModal(BuildContext context, Map<String, dynamic> bus) {
    showModalBottomSheet(
      context: context, isScrollControlled: true, backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
      builder: (context) => _AddStudentsDialog(
        bus: bus,
        onAssigned: () {
          Navigator.pop(context);
          _fetchBuses();
        },
      ),
    );
  }
}

class _AddStudentsDialog extends StatefulWidget {
  final Map<String, dynamic> bus;
  final VoidCallback onAssigned;
  const _AddStudentsDialog({required this.bus, required this.onAssigned});
  @override
  State<_AddStudentsDialog> createState() => _AddStudentsDialogState();
}

class _AddStudentsDialogState extends State<_AddStudentsDialog> {
  List<dynamic> _students = [];
  bool _isLoading = true;
  String _query = "";

  @override
  void initState() {
    super.initState();
    _fetchStudents();
  }

  Future<void> _fetchStudents() async {
    try {
      final students = await StudentService.getAllStudents();
      if (mounted) setState(() { _students = students; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _students.where((s) {
      final name = "${s['firstName']} ${s['lastName']}".toLowerCase();
      return name.contains(_query.toLowerCase());
    }).toList();

    return Container(
      padding: const EdgeInsets.all(32),
      height: MediaQuery.of(context).size.height * 0.8,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Assign Students", style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900)),
          const SizedBox(height: 24),
          TextField(
            onChanged: (v) => setState(() => _query = v),
            decoration: InputDecoration(hintText: "Search students...", prefixIcon: const Icon(Icons.search), border: OutlineInputBorder(borderRadius: BorderRadius.circular(16))),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: _isLoading 
              ? const Center(child: CircularProgressIndicator())
              : filtered.isEmpty 
                ? const Center(child: Text("No students found"))
                : ListView.builder(
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final s = filtered[index];
                      final bool isAlreadyInThisBus = (widget.bus['students'] as List).any((st) => st['student']['_id'] == s['_id']);
                      String branchName = s['selectedBranch'] is Map ? s['selectedBranch']['name'] : (s['selectedBranch'] ?? "No Branch");
                      
                      return ListTile(
                        leading: CircleAvatar(child: Text(s['firstName'][0])),
                        title: Text("${s['firstName']} ${s['lastName']}"),
                        subtitle: Text(branchName),
                        trailing: isAlreadyInThisBus 
                          ? const Icon(Icons.check_circle, color: Colors.green)
                          : ElevatedButton(onPressed: () => _selectStopAndAssign(s), child: const Text("Assign")),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  void _selectStopAndAssign(dynamic student) {
    final List stops = widget.bus['stops'] as List;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Select Boarding Station", style: TextStyle(fontWeight: FontWeight.bold)),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: stops.length,
            itemBuilder: (context, i) {
              final stop = stops[i];
              String name = stop is String ? stop : stop['stationName'];
              String price = stop is Map ? "₹${stop['price']}" : "";
              
              return ListTile(
                title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
                trailing: Text(price, style: const TextStyle(color: AppColors.primaryRed, fontWeight: FontWeight.w900)),
                onTap: () {
                  Navigator.pop(context);
                  _assign(student['_id'], name);
                },
              );
            },
          ),
        ),
      ),
    );
  }

  Future<void> _assign(String studentId, String stopName) async {
    try {
      await TransportService.assignStudent(widget.bus['_id'], studentId, stopName);
      if (!mounted) return;
      widget.onAssigned();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
    }
  }
}
