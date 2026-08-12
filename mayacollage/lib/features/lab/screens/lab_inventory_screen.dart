import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/services/lab_service.dart';

class LabInventoryScreen extends StatefulWidget {
  const LabInventoryScreen({super.key});

  @override
  State<LabInventoryScreen> createState() => _LabInventoryScreenState();
}

class _LabInventoryScreenState extends State<LabInventoryScreen> {
  List<Map<String, dynamic>> _inventory = [];
  List<Map<String, dynamic>> _labs = [];
  bool _isLoading = true;
  String? _error;

  String? _selectedLabId;
  String? _selectedStatus;
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    setState(() => _isLoading = true);
    try {
      final results = await Future.wait([
        LabService.fetchInventory(
          labId: _selectedLabId,
          status: _selectedStatus,
          search: _searchCtrl.text.isEmpty ? null : _searchCtrl.text,
        ),
        LabService.fetchLabs(),
      ]);
      if (mounted) {
        setState(() {
          _inventory = results[0];
          _labs = results[1];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  void _showAddEditItemDialog([Map<String, dynamic>? item]) {
    final isEditing = item != null;
    
    final nameCtrl = TextEditingController(text: item?['itemName'] ?? '');
    final codeCtrl = TextEditingController(text: item?['itemCode'] ?? '');
    final qtyCtrl  = TextEditingController(text: item?['quantity']?.toString() ?? '');
    final descCtrl = TextEditingController(text: item?['description'] ?? '');
    
    String selectedCat = item?['category'] ?? 'Equipment';
    String? selectedLabId = item?['lab'] is Map ? item!['lab']['_id'] : item?['lab'];
    String selectedCond = item?['condition'] ?? 'Good';
    
    bool isSaving = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSt) => AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: Text(isEditing ? "Edit Inventory Item" : "Add Inventory Item", style: const TextStyle(fontWeight: FontWeight.w900)),
          content: SizedBox(
            width: 500,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _buildPopField("Item Name", nameCtrl),
                  const SizedBox(height: 16),
                  _buildPopField("Item Code (Optional)", codeCtrl),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(child: _buildPopField("Quantity", qtyCtrl, isNum: true)),
                      const SizedBox(width: 16),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: selectedCat,
                          decoration: _popDecor("Category"),
                          items: ["Equipment", "Electronics", "Microcontroller", "Chemical", "Computer", "Consumable", "Furniture", "Other"]
                              .map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(fontSize: 14))))
                              .toList(),
                          onChanged: (val) => setSt(() => selectedCat = val!),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: _labs.any((l) => l['_id'] == selectedLabId) ? selectedLabId : null,
                    decoration: _popDecor("Assign to Laboratory"),
                    hint: const Text("Select Lab"),
                    items: _labs.map((l) => DropdownMenuItem(
                      value: l['_id'].toString(),
                      child: Text(l['labName'] ?? 'Unnamed Lab', style: const TextStyle(fontSize: 14)),
                    )).toList(),
                    onChanged: (val) => setSt(() => selectedLabId = val),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    initialValue: selectedCond,
                    decoration: _popDecor("Condition / Status"),
                    items: ["Good", "Needs Repair", "Damaged", "Lost", "Disposed"]
                        .map((s) => DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(fontSize: 14))))
                        .toList(),
                    onChanged: (val) => setSt(() => selectedCond = val!),
                  ),
                  const SizedBox(height: 16),
                  _buildPopField("Description", descCtrl, maxLines: 3),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text("Cancel")),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.deepPurple,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: isSaving ? null : () async {
                if (nameCtrl.text.isEmpty || qtyCtrl.text.isEmpty || selectedLabId == null) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Please fill required fields")));
                  return;
                }
                setSt(() => isSaving = true);
                try {
                  final data = {
                    "itemName": nameCtrl.text.trim(),
                    if (codeCtrl.text.trim().isNotEmpty) "itemCode": codeCtrl.text.trim(),
                    "category": selectedCat,
                    "quantity": int.parse(qtyCtrl.text.trim()),
                    "lab": selectedLabId,
                    "condition": selectedCond,
                    "description": descCtrl.text.trim(),
                  };

                  if (isEditing) {
                    await LabService.updateInventoryItem(item['_id'], data);
                  } else {
                    await LabService.createInventoryItem(data);
                  }
                  
                  if (mounted) {
                    Navigator.pop(ctx);
                    _loadAll();
                  }
                } catch (e) {
                  setSt(() => isSaving = false);
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
                }
              },
              child: isSaving 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Text(isEditing ? "Save Changes" : "Add to Inventory", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  InputDecoration _popDecor(String label) => InputDecoration(
    labelText: label,
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
  );

  Widget _buildPopField(String label, TextEditingController ctrl, {bool isNum = false, int maxLines = 1}) {
    return TextFormField(
      controller: ctrl,
      keyboardType: isNum ? TextInputType.number : TextInputType.text,
      maxLines: maxLines,
      decoration: _popDecor(label),
    );
  }





  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Padding(
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
                    const Text("Inventory Management", style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
                    const SizedBox(height: 4),
                    Text("Track, update, and manage lab equipment & consumables.", style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
                  ],
                ),
                ElevatedButton.icon(
                  onPressed: () => _showAddEditItemDialog(),
                  icon: const Icon(Icons.add_rounded, color: Colors.white),
                  label: const Text("Add Item", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.deepPurple,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ],
            ).animate().fadeIn().slideY(begin: -0.1),
            const SizedBox(height: 32),

            // Top Filters Bar
            Row(
              children: [
                Expanded(
                  flex: 2,
                  child: TextField(
                    controller: _searchCtrl,
                    onChanged: (v) => _loadAll(),
                    decoration: InputDecoration(
                      hintText: "Search item name...",
                      prefixIcon: const Icon(Icons.search_rounded),
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                      contentPadding: const EdgeInsets.symmetric(vertical: 0),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _selectedLabId,
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                      hintText: "Filter Lab",
                    ),
                    items: [
                      const DropdownMenuItem(value: null, child: Text("All Labs")),
                      ..._labs.map((l) => DropdownMenuItem(value: l['_id'].toString(), child: Text(l['labName'] ?? 'Lab'))),
                    ],
                    onChanged: (val) {
                      setState(() => _selectedLabId = val);
                      _loadAll();
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _selectedStatus,
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide.none),
                      hintText: "Filter Status",
                    ),
                    items: [
                      const DropdownMenuItem(value: null, child: Text("All Status")),
                      ...["Good", "Needs Repair", "Damaged", "Lost", "Disposed"]
                        .map((s) => DropdownMenuItem(value: s, child: Text(s))),
                    ],
                    onChanged: (val) {
                      setState(() => _selectedStatus = val);
                      _loadAll();
                    },
                  ),
                ),
              ],
            ).animate().fadeIn(delay: 100.ms),
            const SizedBox(height: 24),

            Expanded(
              child: _isLoading 
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                  ? Center(child: Text("Error: $_error"))
                  : _inventory.isEmpty
                    ? const Center(child: Text("No inventory items found."))
                    : Container(
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: Colors.grey.shade200),
                          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 20, offset: const Offset(0, 10))],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(24),
                          child: SingleChildScrollView(
                            child: DataTable(
                              headingRowColor: WidgetStateProperty.all(Colors.deepPurple.shade50),
                              dataRowMinHeight: 70,
                              dataRowMaxHeight: 70,
                              columns: const [
                                DataColumn(label: Text("CODE", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.deepPurple))),
                                DataColumn(label: Text("NAME", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.deepPurple))),
                                DataColumn(label: Text("CATEGORY", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.deepPurple))),
                                DataColumn(label: Text("LABORATORY", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.deepPurple))),
                                DataColumn(label: Text("AVAIL / TOTAL", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.deepPurple))),
                                DataColumn(label: Text("STATUS", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.deepPurple))),
                                DataColumn(label: Text("ACTIONS", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.deepPurple))),
                              ],
                              rows: _inventory.map((item) {
                                final labName = item['lab'] is Map ? (item['lab']['labName'] ?? 'N/A') : 'N/A';
                                return DataRow(cells: [
                                  DataCell(Text(item["itemCode"] ?? "---", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade600))),
                                  DataCell(Text(item["itemName"] ?? "---", style: const TextStyle(fontWeight: FontWeight.bold))),
                                  DataCell(Text(item["category"] ?? "---")),
                                  DataCell(Text(labName, style: TextStyle(fontWeight: FontWeight.w600, color: Colors.grey.shade700))),
                                  DataCell(Text("${item['availableQuantity'] ?? 0} / ${item['quantity'] ?? 0}", style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16))),
                                  DataCell(_buildStatusBadge(item["condition"] ?? "Good")),
                                  DataCell(
                                    Row(
                                      children: [
                                        IconButton(
                                          icon: const Icon(Icons.edit_rounded, color: Colors.blue),
                                          onPressed: () => _showAddEditItemDialog(item),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.delete_rounded, color: Colors.red),
                                          onPressed: () => _deleteItem(item['_id']),
                                        ),
                                      ],
                                    )
                                  ),
                                ]);
                              }).toList(),
                            ),
                          ),
                        ),
                      ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _deleteItem(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text("Confirm Delete"),
        content: const Text("Are you sure you want to remove this item?"),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text("Cancel")),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text("Delete", style: TextStyle(color: Colors.red))),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await LabService.deleteInventoryItem(id);
        _loadAll();
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.toString())));
      }
    }
  }


  Widget _buildStatusBadge(String status) {
    Color bg = Colors.green.shade50;
    Color fg = Colors.green.shade700;
    if (status == "Low Stock") {
      bg = Colors.orange.shade50; fg = Colors.orange.shade800;
    } else if (status == "Needs Repair" || status == "Damaged") {
      bg = Colors.red.shade50; fg = Colors.red.shade700;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(status, style: TextStyle(color: fg, fontWeight: FontWeight.bold, fontSize: 12)),
    );
  }
}
