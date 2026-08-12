import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/services/leave_service.dart';

class StaffLeaveScreen extends StatefulWidget {
  const StaffLeaveScreen({super.key});

  @override
  State<StaffLeaveScreen> createState() => _StaffLeaveScreenState();
}

class _StaffLeaveScreenState extends State<StaffLeaveScreen> {
  String? _leaveType;
  DateTime _startDate = DateTime.now();
  DateTime _endDate = DateTime.now().add(const Duration(days: 1));
  final _reasonController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  final List<String> _leaveTypes = ["Casual Leave", "Sick Leave", "Earned Leave", "Maternity Leave"];

  List<dynamic> _leaveHistory = [];
  bool _isLoading = true;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _fetchLeaveHistory();
  }

  Future<void> _fetchLeaveHistory() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getString('user_id');
      if (userId != null) {
        final history = await LeaveService.getUserLeaves(userId);
        setState(() {
          _leaveHistory = history;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    }
  }

  Future<void> _submitLeave() async {
    if (!_formKey.currentState!.validate() || _leaveType == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all details')));
      return;
    }

    try {
      setState(() => _isSubmitting = true);
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getString('user_id');

      if (userId != null) {
        await LeaveService.applyLeave({
          "userId": userId,
          "leaveType": _leaveType,
          "startDate": _startDate.toIso8601String(),
          "endDate": _endDate.toIso8601String(),
          "reason": _reasonController.text,
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Leave request submitted successfully')));
          _reasonController.clear();
          setState(() {
            _leaveType = null;
            _startDate = DateTime.now();
            _endDate = DateTime.now().add(const Duration(days: 1));
          });
          _fetchLeaveHistory();
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 900;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: EdgeInsets.all(isMobile ? 16 : 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildHeader(isMobile),
                  const SizedBox(height: 32),
                  isMobile
                      ? Column(children: [_buildForm(), const SizedBox(height: 32), _buildLeaveHistory()])
                      : Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(flex: 3, child: _buildForm()),
                            const SizedBox(width: 32),
                            Expanded(flex: 2, child: _buildLeaveHistory()),
                          ],
                        ),
                ],
              ),
            ),
    );
  }

  Widget _buildHeader(bool isMobile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Leave Management", style: TextStyle(fontSize: 32, fontWeight: FontWeight.w900, color: Color(0xFF1E293B), letterSpacing: -1)),
        const SizedBox(height: 4),
        Text("Apply for leaves and track your leave request statuses.", style: TextStyle(fontSize: 14, color: Colors.grey.shade500)),
      ],
    ).animate().fadeIn().slideY(begin: -0.1);
  }

  Widget _buildForm() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade200), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 20, offset: const Offset(0, 5))]),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text("Apply for Leave", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: Color(0xFF1E293B))),
            const SizedBox(height: 24),
            _dropdown("Leave Type", _leaveTypes, _leaveType, (v) => setState(() => _leaveType = v)),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(child: _datePickerField("Start Date", _startDate, (picked) => setState(() => _startDate = picked))),
                const SizedBox(width: 16),
                Expanded(child: _datePickerField("End Date", _endDate, (picked) => setState(() => _endDate = picked))),
              ],
            ),
            const SizedBox(height: 20),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text("Reason", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _reasonController,
                  maxLines: 4,
                  validator: (v) => (v == null || v.isEmpty) ? "Please enter a reason" : null,
                  decoration: InputDecoration(
                    hintText: "Enter reason for leave...",
                    hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
                    filled: true,
                    fillColor: const Color(0xFFF8FAFC),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFF10B981))),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isSubmitting ? null : _submitLeave,
                icon: _isSubmitting
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Icon(Icons.send_rounded, color: Colors.white, size: 18),
                label: Text(_isSubmitting ? "Submitting..." : "Submit Leave Request", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF10B981), padding: const EdgeInsets.symmetric(vertical: 20), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 200.ms).slideY();
  }

  Widget _dropdown(String label, List<String> items, String? val, Function(String?) onCh) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: val,
              isExpanded: true,
              hint: Text("Select $label", style: TextStyle(color: Colors.grey.shade400, fontSize: 14)),
              icon: Icon(Icons.keyboard_arrow_down_rounded, color: Colors.grey.shade400),
              items: items.map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 14)))).toList(),
              onChanged: onCh,
            ),
          ),
        ),
      ],
    );
  }

  Widget _datePickerField(String label, DateTime date, Function(DateTime) onPicked) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87)),
        const SizedBox(height: 8),
        InkWell(
          onTap: () async {
            DateTime? picked = await showDatePicker(context: context, initialDate: date, firstDate: DateTime.now(), lastDate: DateTime(2101));
            if (picked != null) onPicked(picked);
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.grey.shade200)),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text("${date.day}/${date.month}/${date.year}", style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                Icon(Icons.calendar_today_rounded, size: 16, color: Colors.grey.shade500),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildLeaveHistory() {
    int pendingCount = _leaveHistory.where((l) => l['status'] == 'Pending').length;

    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade200), boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 20, offset: const Offset(0, 5))]),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("Leave History", style: TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: Color(0xFF1E293B))),
              if (pendingCount > 0)
                Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: Colors.orange.shade50, borderRadius: BorderRadius.circular(8)), child: Text("$pendingCount Pending", style: TextStyle(color: Colors.orange.shade700, fontWeight: FontWeight.bold, fontSize: 12))),
            ],
          ),
          const SizedBox(height: 24),
          _leaveHistory.isEmpty
              ? Center(child: Padding(padding: const EdgeInsets.all(32), child: Text("No leave history found", style: TextStyle(color: Colors.grey.shade400))))
              : ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: _leaveHistory.length,
                  separatorBuilder: (context, index) => const Divider(height: 32),
                  itemBuilder: (context, index) {
                    final h = _leaveHistory[index];
                    final String status = h['status'];
                    final Color color = status == 'Approved' ? Colors.green : (status == 'Rejected' ? Colors.red : Colors.orange);
                    final start = DateTime.parse(h['startDate']);
                    final end = DateTime.parse(h['endDate']);
                    final dateRange = "${start.day}/${start.month} - ${end.day}/${end.month} ${end.year}";

                    return Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(12)), child: Icon(Icons.beach_access_rounded, color: Colors.grey.shade600, size: 24)),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(h['leaveType'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1E293B))),
                              const SizedBox(height: 4),
                              Text(dateRange, style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
                              const SizedBox(height: 8),
                              Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)), child: Text(status, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 11))),
                            ],
                          ),
                        ),
                      ],
                    );
                  },
                ),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms).slideX(begin: 0.1);
  }
}
