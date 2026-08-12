import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/services/book_service.dart';
import 'add_book_screen.dart';

class BookManagementScreen extends StatefulWidget {
  const BookManagementScreen({super.key});

  @override
  State<BookManagementScreen> createState() => _BookManagementScreenState();
}

class _BookManagementScreenState extends State<BookManagementScreen> {
  String _searchQuery = "";
  String? _selectedCategory;
  String? _selectedAvailability;
  List<dynamic> _books = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBooks();
  }

  Future<void> _loadBooks() async {
    try {
      setState(() => _isLoading = true);
      final books = await BookService.getAllBooks();
      setState(() {
        _books = books;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading books: $e')),
        );
      }
    }
  }

  String _calculateStatus(dynamic book) {
    int available = int.tryParse(book['available'].toString()) ?? 0;
    return available > 0 ? "Available" : "Out of Stock";
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        bool isMobile = constraints.maxWidth < 850;
        bool isTablet = constraints.maxWidth >= 850 && constraints.maxWidth < 1100;

        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          body: SingleChildScrollView(
            padding: EdgeInsets.all(isMobile ? 16 : 32),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(isMobile),
                const SizedBox(height: 32),
                _buildFiltersAndActions(isMobile, isTablet),
                const SizedBox(height: 24),
                _isLoading 
                  ? const Center(child: Padding(padding: EdgeInsets.all(50), child: CircularProgressIndicator()))
                  : _buildBooksTable(isMobile, isTablet),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildHeader(bool isMobile) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Books Management",
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFF1E293B),
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                "Manage library book catalog, view details, edit, and track stock.",
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade500,
                ),
              ),
            ],
          ),
        ),
        if (!isMobile)
          Row(
            children: [
              _headerBtn("Export Books", Icons.download_rounded, Colors.white, Colors.black87, () {}),
              const SizedBox(width: 12),
              _headerBtn("Import (CSV)", Icons.upload_file_rounded, Colors.white, Colors.black87, () {}),
              const SizedBox(width: 12),
              _headerBtn("Add New Book", Icons.add_rounded, const Color(0xFF4F46E5), Colors.white, () async {
                final res = await Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const AddBookScreen()),
                );
                if (res == true) _loadBooks();
              }),
            ],
          ),
      ],
    ).animate().fadeIn().slideY(begin: -0.1);
  }

  Widget _headerBtn(String label, IconData icon, Color bg, Color fg, VoidCallback onTap) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: bg == Colors.white ? Colors.grey.shade300 : Colors.transparent),
        boxShadow: bg != Colors.white
            ? [BoxShadow(color: bg.withValues(alpha: 0.3), blurRadius: 10, offset: const Offset(0, 4))]
            : [],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Row(
            children: [
              Icon(icon, color: fg, size: 18),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(color: fg, fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFiltersAndActions(bool isMobile, bool isTablet) {
    if (isMobile) {
      return Column(
        children: [
          _searchBar(),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _filterDropdown("Category", _books.map((b) => b['category'].toString()).toSet().toList(), _selectedCategory, (v) => setState(() => _selectedCategory = v))),
              const SizedBox(width: 12),
              Expanded(child: _filterDropdown("Availability", ["Available", "Out of Stock"], _selectedAvailability, (v) => setState(() => _selectedAvailability = v))),
            ],
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: _headerBtn("Add New Book", Icons.add_rounded, const Color(0xFF4F46E5), Colors.white, () async {
              final res = await Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const AddBookScreen()),
              );
              if (res == true) _loadBooks();
            }),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(child: _headerBtn("Export", Icons.download_rounded, Colors.white, Colors.black87, () {})),
              const SizedBox(width: 12),
              Expanded(child: _headerBtn("Import", Icons.upload_file_rounded, Colors.white, Colors.black87, () {})),
            ],
          ),
        ],
      ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1);
    }
    return Row(
      children: [
        Expanded(flex: 3, child: _searchBar()),
        const SizedBox(width: 16),
        Expanded(flex: 2, child: _filterDropdown("Category", _books.map((b) => b['category'].toString()).toSet().toList(), _selectedCategory, (v) => setState(() => _selectedCategory = v))),
        const SizedBox(width: 16),
        Expanded(flex: 2, child: _filterDropdown("Availability", ["Available", "Out of Stock"], _selectedAvailability, (v) => setState(() => _selectedAvailability = v))),
      ],
    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1);
  }

  Widget _searchBar() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: TextField(
        onChanged: (v) => setState(() => _searchQuery = v),
        decoration: InputDecoration(
          hintText: "Search by title, author, isbn...",
          hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
          prefixIcon: Icon(Icons.search_rounded, color: Colors.grey.shade400, size: 20),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 14),
        ),
      ),
    );
  }

  Widget _filterDropdown(String hint, List<String> items, String? val, Function(String?) onCh) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: val,
          isExpanded: true,
          hint: Text(hint, style: TextStyle(color: Colors.grey.shade600, fontSize: 13, fontWeight: FontWeight.w600)),
          icon: Icon(Icons.keyboard_arrow_down_rounded, color: Colors.grey.shade400),
          items: [
            DropdownMenuItem(value: null, child: Text("All $hint", style: const TextStyle(fontSize: 13))),
            ...items.map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 13)))),
          ],
          onChanged: onCh,
        ),
      ),
    );
  }

  Widget _buildBooksTable(bool isMobile, bool isTablet) {
    final filtered = _books.where((b) {
      final q = _searchQuery.toLowerCase();
      final status = _calculateStatus(b);
      
      bool matchesSearch = b['title'].toLowerCase().contains(q) ||
          b['author'].toLowerCase().contains(q) ||
          b['isbn'].toLowerCase().contains(q);
          
      bool matchesCategory = _selectedCategory == null || b['category'] == _selectedCategory;
      bool matchesAvailability = _selectedAvailability == null || status == _selectedAvailability;
      
      return matchesSearch && matchesCategory && matchesAvailability;
    }).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (!isMobile)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            child: Row(
              children: [
                Expanded(flex: 3, child: Text("BOOK", style: _headerStyle())),
                Expanded(flex: 2, child: Text("CATEGORY", style: _headerStyle())),
                Expanded(flex: 2, child: Text("COPIES (TOTAL/AVAIL)", style: _headerStyle())),
                Expanded(flex: 2, child: Text("SHELF", style: _headerStyle())),
                Expanded(flex: 2, child: Text("STATUS", style: _headerStyle())),
                SizedBox(width: 120, child: Text("ACTIONS", style: _headerStyle(), textAlign: TextAlign.center)),
              ],
            ),
          ),
        ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: filtered.length,
          itemBuilder: (context, index) {
            final book = filtered[index];
            final status = _calculateStatus(book);
            return Container(
              margin: EdgeInsets.only(bottom: isMobile ? 12 : 16),
              padding: EdgeInsets.all(isMobile ? 16 : 20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.white, width: 2),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF6366F1).withValues(alpha: 0.05),
                    blurRadius: 20,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: isMobile
                  ? _buildMobileBookCard(book, status)
                  : _buildDesktopBookRow(book, status),
            ).animate().fadeIn(delay: (50 * index).ms).slideX(begin: 0.05, curve: Curves.easeOutQuad);
          },
        ),
      ],
    );
  }

  TextStyle _headerStyle() => TextStyle(fontWeight: FontWeight.bold, color: Colors.grey.shade500, fontSize: 12, letterSpacing: 0.5);

  Widget _buildDesktopBookRow(dynamic book, String status) {
    return Row(
      children: [
        Expanded(
          flex: 3,
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  book['cover'],
                  width: 48,
                  height: 64,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    width: 48,
                    height: 64,
                    color: Colors.grey.shade100,
                    child: const Icon(Icons.book_rounded, color: Colors.grey),
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      book['title'],
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF1E293B)),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      book['author'],
                      style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      "ISBN: ${book['isbn']}",
                      style: TextStyle(color: Colors.grey.shade400, fontSize: 11),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        Expanded(
          flex: 2,
          child: Align(
            alignment: Alignment.centerLeft,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.transparent),
              ),
              child: Text(
                book['category'],
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade700),
              ),
            ),
          ),
        ),
        Expanded(
          flex: 2,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Text(
                    "${book['available']}",
                    style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 18,
                      color: book['available'] > 0 ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                    ),
                  ),
                  Text(" available", style: TextStyle(color: Colors.grey.shade500, fontSize: 13, fontWeight: FontWeight.w500)),
                ],
              ),
              const SizedBox(height: 2),
              Text(
                "of ${book['total']} total",
                style: TextStyle(color: Colors.grey.shade400, fontSize: 12, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ),
        Expanded(
          flex: 2,
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.library_books_rounded, size: 16, color: Color(0xFF4F46E5)),
              ),
              const SizedBox(width: 12),
              Text(book['shelf'] ?? 'N/A', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            ],
          ),
        ),
        Expanded(flex: 2, child: Align(alignment: Alignment.centerLeft, child: _buildStatusBadge(status))),
        SizedBox(
          width: 120,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                decoration: BoxDecoration(color: Colors.blue.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                child: IconButton(onPressed: () {}, icon: const Icon(Icons.visibility_rounded, color: Colors.blue, size: 18), tooltip: "View Details", splashRadius: 20, constraints: const BoxConstraints(), padding: const EdgeInsets.all(8)),
              ),
              const SizedBox(width: 8),
              Container(
                decoration: BoxDecoration(color: Colors.orange.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                child: IconButton(
                  onPressed: () async {
                    final res = await Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => AddBookScreen(book: book)),
                    );
                    if (res == true) _loadBooks();
                  }, 
                  icon: const Icon(Icons.edit_rounded, color: Colors.orange, size: 18), 
                  tooltip: "Edit Book", 
                  splashRadius: 20, 
                  constraints: const BoxConstraints(), 
                  padding: const EdgeInsets.all(8)
                ),
              ),
              const SizedBox(width: 8),
              Container(
                decoration: BoxDecoration(color: Colors.red.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                child: IconButton(
                  onPressed: () => _confirmDelete(book), 
                  icon: const Icon(Icons.delete_outline_rounded, color: Colors.red, size: 18), 
                  tooltip: "Delete Book", 
                  splashRadius: 20, 
                  constraints: const BoxConstraints(), 
                  padding: const EdgeInsets.all(8)
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _confirmDelete(dynamic book) async {
    final res = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Delete Book"),
        content: Text("Are you sure you want to delete '${book['title']}'? This action cannot be undone."),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text("Cancel")),
          TextButton(
            onPressed: () => Navigator.pop(context, true), 
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text("Delete"),
          ),
        ],
      ),
    );

    if (res == true) {
      try {
        await BookService.deleteBook(book['_id']);
        _loadBooks();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Book deleted successfully")));
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error deleting book: $e")));
        }
      }
    }
  }

  Widget _buildMobileBookCard(dynamic book, String status) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Image.network(
                book['cover'],
                width: 60,
                height: 80,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  width: 60,
                  height: 80,
                  color: Colors.grey.shade100,
                  child: const Icon(Icons.book_rounded, color: Colors.grey),
                ),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          book['title'],
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF1E293B)),
                        ),
                      ),
                      _buildStatusBadge(status),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    book['author'],
                    style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    "ISBN: ${book['isbn']} • Shelf: ${book['shelf']}",
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    book['category'],
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey.shade700),
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  "${book['available']} / ${book['total']} Available",
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: book['available'] > 0 ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                  ),
                ),
              ],
            ),
            Row(
              children: [
                Container(
                  decoration: BoxDecoration(color: Colors.blue.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                  child: IconButton(onPressed: () {}, icon: const Icon(Icons.visibility_rounded, color: Colors.blue, size: 16), splashRadius: 20, constraints: const BoxConstraints(), padding: const EdgeInsets.all(6)),
                ),
                const SizedBox(width: 8),
                Container(
                  decoration: BoxDecoration(color: Colors.orange.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                  child: IconButton(
                    onPressed: () async {
                      final res = await Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => AddBookScreen(book: book)),
                      );
                      if (res == true) _loadBooks();
                    }, 
                    icon: const Icon(Icons.edit_rounded, color: Colors.orange, size: 16), 
                    splashRadius: 20, 
                    constraints: const BoxConstraints(), 
                    padding: const EdgeInsets.all(6)
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  decoration: BoxDecoration(color: Colors.red.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                  child: IconButton(
                    onPressed: () => _confirmDelete(book), 
                    icon: const Icon(Icons.delete_outline_rounded, color: Colors.red, size: 16), 
                    splashRadius: 20, 
                    constraints: const BoxConstraints(), 
                    padding: const EdgeInsets.all(6)
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatusBadge(String status) {
    final isAvailable = status == 'Available';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: (isAvailable ? const Color(0xFF10B981) : const Color(0xFFEF4444)).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(100),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: isAvailable ? const Color(0xFF10B981) : const Color(0xFFEF4444),
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
