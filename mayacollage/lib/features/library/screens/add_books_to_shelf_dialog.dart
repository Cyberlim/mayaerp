import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/services/book_service.dart';

class AddBooksToShelfDialog extends StatefulWidget {
  final String shelfName;
  const AddBooksToShelfDialog({super.key, required this.shelfName});

  @override
  State<AddBooksToShelfDialog> createState() => _AddBooksToShelfDialogState();
}

class _AddBooksToShelfDialogState extends State<AddBooksToShelfDialog> {
  String _searchQuery = '';
  final List<String> _selectedBooks = [];
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
      final data = await BookService.getAllBooks();
      setState(() {
        _books = data;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint("Error loading books in dialog: $e");
      setState(() => _isLoading = false);
    }
  }

  Future<void> _allocateBooks() async {
    if (_selectedBooks.isEmpty) return;
    
    setState(() => _isLoading = true);
    try {
      // For each selected book ID, update its shelf
      for (String bookId in _selectedBooks) {
        final book = _books.firstWhere((element) => element['_id'] == bookId);
        final bookData = Map<String, dynamic>.from(book);
        bookData['shelf'] = widget.shelfName;
        await BookService.updateBook(bookId, bookData);
      }
      
      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Books allocated successfully")));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error allocating books: $e")));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 600;
    
    final filteredCards = _books.where((b) {
      if (_searchQuery.isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      return b['title'].toString().toLowerCase().contains(q) || 
             b['author'].toString().toLowerCase().contains(q) || 
             b['isbn'].toString().toLowerCase().contains(q);
    }).toList();

    return Dialog(
      backgroundColor: Colors.transparent,
      elevation: 0,
      insetPadding: EdgeInsets.all(isMobile ? 16 : 32),
      child: Container(
        width: 600,
        height: 700,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.1),
              blurRadius: 40,
              offset: const Offset(0, 20),
            ),
          ],
        ),
        child: Column(
          children: [
            _buildHeader(),
            _buildSearchBar(),
            Expanded(
              child: _isLoading 
                ? const Center(child: CircularProgressIndicator())
                : ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                itemCount: filteredCards.length,
                separatorBuilder: (context, index) => const Divider(height: 1),
                itemBuilder: (context, index) {
                  final book = filteredCards[index];
                  final isSelected = _selectedBooks.contains(book['_id']);
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(vertical: 8),
                    onTap: () {
                      setState(() {
                        if (isSelected) {
                          _selectedBooks.remove(book['_id']);
                        } else {
                          _selectedBooks.add(book['_id']);
                        }
                      });
                    },
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFF4F46E5) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: isSelected ? const Color(0xFF4F46E5) : Colors.grey.shade300),
                      ),
                      child: isSelected 
                        ? const Icon(Icons.check_rounded, color: Colors.white, size: 20)
                        : const Icon(Icons.book_rounded, color: Colors.grey, size: 20),
                    ),
                    title: Text(book['title'], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF1E293B))),
                    subtitle: Text("${book['author']} • ISBN: ${book['isbn']}", style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                  );
                },
              ),
            ),
            _buildFooter(context),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 200.ms).scaleXY(begin: 0.95);
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text("Add Books to '${widget.shelfName}'", style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 20, color: Color(0xFF1E293B))),
                const SizedBox(height: 4),
                Text("Search and select multiple books to allocate them to this shelf.", style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
              ],
            ),
          ),
          IconButton(
            onPressed: () => Navigator.pop(context),
            icon: const Icon(Icons.close_rounded, color: Colors.black87),
            splashRadius: 24,
            style: IconButton.styleFrom(
              backgroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: BorderSide(color: Colors.grey.shade300)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: TextField(
        onChanged: (v) => setState(() => _searchQuery = v),
        decoration: InputDecoration(
          hintText: "Search books by title, author, or ISBN...",
          hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
          prefixIcon: Icon(Icons.search_rounded, color: Colors.grey.shade400),
          filled: true,
          fillColor: const Color(0xFFF1F5F9),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
          contentPadding: const EdgeInsets.symmetric(vertical: 16),
        ),
      ),
    );
  }

  Widget _buildFooter(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(24)),
        border: Border(top: BorderSide(color: Colors.grey.shade200)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text("${_selectedBooks.length} Books Selected", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF4F46E5))),
          Row(
            children: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                style: TextButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16)),
                child: const Text("Cancel", style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 12),
              ElevatedButton.icon(
                onPressed: (_selectedBooks.isNotEmpty && !_isLoading) ? _allocateBooks : null,
                icon: const Icon(Icons.add_rounded, color: Colors.white, size: 18),
                label: Text(_isLoading ? "Processing..." : "Allocate Books", style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4F46E5),
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  disabledBackgroundColor: Colors.grey.shade300,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
