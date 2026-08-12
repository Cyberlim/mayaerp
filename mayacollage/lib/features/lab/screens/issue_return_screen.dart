import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class IssueReturnScreen extends StatefulWidget {
  const IssueReturnScreen({super.key});

  @override
  State<IssueReturnScreen> createState() => _IssueReturnScreenState();
}

class _IssueReturnScreenState extends State<IssueReturnScreen> {
  final List<Map<String, dynamic>> _transactions = [
    {"id": "TRX-001", "item": "Compound Microscope", "student": "Rahul Sharma", "id_no": "IT20-045", "date": "12 Oct 2023", "status": "Issued"},
    {"id": "TRX-002", "item": "Arduino Uno R3", "student": "Neha Gupta", "id_no": "CS21-012", "date": "10 Oct 2023", "status": "Returned"},
    {"id": "TRX-003", "item": "Digital Oscilloscope", "student": "Priya Singh", "id_no": "EC19-088", "date": "05 Oct 2023", "status": "Overdue"},
    {"id": "TRX-004", "item": "Beaker 500ml", "student": "Amit Kumar", "id_no": "CH22-005", "date": "15 Oct 2023", "status": "Issued"},
  ];

  void _showIssueDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: const Text("Issue Lab Equipment", style: TextStyle(fontWeight: FontWeight.w900)),
          content: SizedBox(
            width: 450,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    decoration: InputDecoration(
                      labelText: "Student/Faculty ID",
                      prefixIcon: const Icon(Icons.badge_rounded),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                      filled: true,
                      fillColor: Colors.grey.shade50,
                    ),
                  ),
                  const SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    decoration: InputDecoration(
                      labelText: "Select Equipment",
                      prefixIcon: const Icon(Icons.inventory_2_rounded),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                      filled: true,
                      fillColor: Colors.grey.shade50,
                    ),
                    items: ["Compound Microscope", "Digital Oscilloscope", "Arduino Uno R3", "Beaker 500ml"]
                        .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                        .toList(),
                    onChanged: (val) {},
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          decoration: InputDecoration(
                            labelText: "Issue Date",
                            prefixIcon: const Icon(Icons.calendar_today_rounded),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: TextFormField(
                          decoration: InputDecoration(
                            labelText: "Expected Return",
                            prefixIcon: const Icon(Icons.event_busy_rounded),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                        ),
                      ),
                    ],
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
              child: const Text("Issue Item", style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
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
                    const Text("Issue & Return Tracking", style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: Color(0xFF1E293B))),
                    const SizedBox(height: 4),
                    Text("Manage equipment checkouts, track overdue items, and process returns.", style: TextStyle(fontSize: 14, color: Colors.grey.shade600)),
                  ],
                ),
                ElevatedButton.icon(
                  onPressed: _showIssueDialog,
                  icon: const Icon(Icons.outbox_rounded, color: Colors.white),
                  label: const Text("Issue Item", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.deepPurple,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ],
            ).animate().fadeIn().slideY(begin: -0.1),
            const SizedBox(height: 32),

            Expanded(
              child: Container(
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
                        DataColumn(label: Text("TRX ID", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.deepPurple))),
                        DataColumn(label: Text("ITEM", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.deepPurple))),
                        DataColumn(label: Text("ISSUED TO", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.deepPurple))),
                        DataColumn(label: Text("DATE", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.deepPurple))),
                        DataColumn(label: Text("STATUS", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.deepPurple))),
                        DataColumn(label: Text("ACTIONS", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.deepPurple))),
                      ],
                      rows: _transactions.map((trx) {
                        return DataRow(cells: [
                          DataCell(Text(trx["id"], style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade600))),
                          DataCell(
                            Row(
                              children: [
                                const Icon(Icons.inventory_2_rounded, size: 16, color: Colors.deepPurple),
                                const SizedBox(width: 8),
                                Text(trx["item"], style: const TextStyle(fontWeight: FontWeight.bold)),
                              ],
                            )
                          ),
                          DataCell(
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(trx["student"], style: const TextStyle(fontWeight: FontWeight.w700)),
                                Text(trx["id_no"], style: TextStyle(fontSize: 11, color: Colors.grey.shade500)),
                              ],
                            )
                          ),
                          DataCell(Text(trx["date"], style: const TextStyle(fontWeight: FontWeight.w600))),
                          DataCell(_buildStatusBadge(trx["status"])),
                          DataCell(
                            trx["status"] == "Returned"
                              ? const Icon(Icons.check_circle_rounded, color: Colors.green)
                              : ElevatedButton(
                                  onPressed: () {},
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: trx["status"] == "Overdue" ? Colors.orange : Colors.green,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8)
                                  ),
                                  child: const Text("Process Return", style: TextStyle(color: Colors.white, fontSize: 12)),
                                ),
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

  Widget _buildStatusBadge(String status) {
    Color bg = Colors.blue.shade50;
    Color fg = Colors.blue.shade700;
    if (status == "Returned") {
      bg = Colors.green.shade50; fg = Colors.green.shade700;
    } else if (status == "Overdue") {
      bg = Colors.red.shade50; fg = Colors.red.shade700;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
      child: Text(status, style: TextStyle(color: fg, fontWeight: FontWeight.bold, fontSize: 12)),
    );
  }
}
