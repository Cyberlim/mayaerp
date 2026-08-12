import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/services/book_service.dart';

class ShelfBooksScreen extends StatefulWidget {
  final String shelfName;
  const ShelfBooksScreen({super.key, required this.shelfName});

  @override
  State<ShelfBooksScreen> createState() => _ShelfBooksScreenState();
}

class _ShelfBooksScreenState extends State<ShelfBooksScreen> {
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
      final books = await BookService.getBooksByShelf(widget.shelfName);
      setState(() {
        _books = books;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black87),
        title: Text(
          "Books on ${widget.shelfName}",
          style: const TextStyle(color: Colors.black87, fontWeight: FontWeight.bold, fontSize: 18),
        ),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _books.isEmpty 
          ? _buildEmptyState()
          : ListView.builder(
              padding: EdgeInsets.all(isMobile ? 16 : 24),
              itemCount: _books.length,
              itemBuilder: (context, index) {
                final book = _books[index];
                return _buildBookCard(book, index);
              },
            ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.library_books_rounded, size: 64, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          Text("No books found on this shelf", style: TextStyle(color: Colors.grey.shade500, fontSize: 16)),
        ],
      ),
    );
  }

  Widget _buildBookCard(dynamic book, int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 75,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(8),
              image: book['cover'] != null 
                ? DecorationImage(image: NetworkImage(book['cover']), fit: BoxFit.cover)
                : null,
            ),
            child: book['cover'] == null ? const Icon(Icons.book_rounded, color: Colors.grey) : null,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(book['title'] ?? "Untilted", style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 4),
                Text(book['author'] ?? "Unknown Author", style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _tag(book['category'] ?? "General", const Color(0xFF4F46E5)),
                    const SizedBox(width: 8),
                    _tag("ISBN: ${book['isbn'] ?? 'N/A'}", Colors.blueGrey),
                  ],
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text("${book['available']} / ${book['total']}", style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: Color(0xFF4F46E5))),
              const Text("Available", style: TextStyle(fontSize: 10, color: Colors.grey)),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(delay: (100 * index).ms).slideX(begin: 0.1);
  }

  Widget _tag(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
      child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }
}
