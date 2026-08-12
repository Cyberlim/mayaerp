import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/services/shelf_service.dart';
import 'create_shelf_screen.dart';
import 'add_books_to_shelf_dialog.dart';
import 'shelf_books_screen.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  List<dynamic> _shelves = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadShelves();
  }

  Future<void> _loadShelves() async {
    try {
      setState(() => _isLoading = true);
      final data = await ShelfService.getAllShelves();
      setState(() {
        _shelves = data;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint("Error loading shelves: $e");
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 800;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(isMobile ? 16 : 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(isMobile),
            const SizedBox(height: 32),
            _isLoading 
              ? const Center(child: Padding(padding: EdgeInsets.all(50), child: CircularProgressIndicator()))
              : _buildShelvesList(isMobile),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(bool isMobile) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Book Shelves",
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1E293B),
                  letterSpacing: -1,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                "Manage library physical inventory, add new shelves, and categorize space.",
                style: TextStyle(fontSize: 14, color: Colors.grey.shade500),
              ),
            ],
          ),
        ),
        if (!isMobile)
          Container(
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF4F46E5)], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(14),
              boxShadow: [BoxShadow(color: const Color(0xFF4F46E5).withValues(alpha: 0.3), blurRadius: 15, offset: const Offset(0, 8))],
            ),
            child: ElevatedButton.icon(
              onPressed: () async {
                final res = await Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateShelfScreen()));
                if (res == true) _loadShelves();
              },
              icon: const Icon(Icons.add_rounded, color: Colors.white, size: 20),
              label: const Text("Create New Shelf", style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ).animate(onPlay: (controller) => controller.repeat(reverse: true)).shimmer(duration: 2.seconds, color: Colors.white24),
      ],
    ).animate().fadeIn().slideY(begin: -0.1);
  }

  Widget _buildShelvesList(bool isMobile) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (isMobile)
          Padding(
            padding: const EdgeInsets.only(bottom: 24),
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF6366F1), Color(0xFF4F46E5)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                borderRadius: BorderRadius.circular(14),
                boxShadow: [BoxShadow(color: const Color(0xFF4F46E5).withValues(alpha: 0.3), blurRadius: 15, offset: const Offset(0, 8))],
              ),
              child: ElevatedButton.icon(
                onPressed: () async {
                  final res = await Navigator.push(context, MaterialPageRoute(builder: (_) => const CreateShelfScreen()));
                  if (res == true) _loadShelves();
                },
                icon: const Icon(Icons.add_rounded, color: Colors.white, size: 20),
                label: const Text("Create New Shelf", style: TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ).animate(onPlay: (controller) => controller.repeat(reverse: true)).shimmer(duration: 2.seconds, color: Colors.white24),
          ),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: isMobile ? 1 : 3,
            crossAxisSpacing: 24,
            mainAxisSpacing: 24,
            childAspectRatio: isMobile ? 2.2 : 1.4,
          ),
          itemCount: _shelves.length,
          itemBuilder: (context, index) {
            final s = _shelves[index];
            double capacityNum = double.tryParse(s['capacity'].toString()) ?? 100;
            double currentNum = double.tryParse(s['current'].toString()) ?? 0;
            double fillRatio = currentNum / capacityNum;
            Color fillCol = fillRatio > 0.9 ? Colors.red : (fillRatio > 0.7 ? Colors.orange : Colors.green);

            return Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white, width: 2),
                boxShadow: [
                  BoxShadow(color: const Color(0xFF6366F1).withValues(alpha: 0.04), blurRadius: 24, offset: const Offset(0, 12)),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(12)),
                            child: const Icon(Icons.storage_rounded, color: Color(0xFF4F46E5), size: 20),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(s['name'], style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                              Text("Aisle ${s['aisle']}", style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                            ],
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          TextButton.icon(
                            onPressed: () async {
                              final res = await showDialog<bool>(
                                context: context,
                                builder: (_) => AddBooksToShelfDialog(shelfName: s['name']),
                              );
                              if (res == true) _loadShelves();
                            },
                            icon: const Icon(Icons.add_rounded, size: 16),
                            label: const Text("Add Books", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                            style: TextButton.styleFrom(
                              foregroundColor: const Color(0xFF4F46E5),
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                              backgroundColor: const Color(0xFF4F46E5).withValues(alpha: 0.1),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                          ),
                          const SizedBox(width: 4),
                          IconButton(
                            onPressed: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => ShelfBooksScreen(shelfName: s['name'])),
                              );
                            }, 
                            icon: const Icon(Icons.visibility_outlined, color: Color(0xFF4F46E5), size: 20), 
                            tooltip: "View Books", 
                            splashRadius: 20, 
                            constraints: const BoxConstraints(), 
                            padding: const EdgeInsets.all(8)
                          ),
                        ],
                      ),
                    ],
                  ),
                  const Spacer(),
                  Text(s['category'], style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade600, fontSize: 13)),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("Capacity: ${s['current']} / ${s['capacity']}", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      Text("${(fillRatio * 100).toInt()}%", style: TextStyle(fontWeight: FontWeight.w900, color: fillCol, fontSize: 13)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: LinearProgressIndicator(
                      value: fillRatio,
                      backgroundColor: Colors.grey.shade100,
                      color: fillCol,
                      minHeight: 8,
                    ),
                  ),
                ],
              ),
            ).animate().fadeIn(delay: (50 * index).ms).slideY(begin: 0.1);
          },
        ),
      ],
    );
  }
}
