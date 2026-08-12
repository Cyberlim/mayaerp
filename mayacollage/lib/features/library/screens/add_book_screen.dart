import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:typed_data';
import '../../../../core/services/book_service.dart';
import '../../../../core/services/application_service.dart';
import '../../../../core/services/shelf_service.dart';
import '../../../../core/services/cloudinary_service.dart';

class AddBookScreen extends StatefulWidget {
  final dynamic book;
  const AddBookScreen({super.key, this.book});

  @override
  State<AddBookScreen> createState() => _AddBookScreenState();
}

class _AddBookScreenState extends State<AddBookScreen> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _titleController;
  late TextEditingController _authorController;
  late TextEditingController _isbnController;
  late TextEditingController _publisherController;
  late TextEditingController _totalController;
  late TextEditingController _priceController;
  late TextEditingController _remarksController;

  String? _selectedCategory;
  String? _selectedShelf;
  XFile? _selectedImage;
  Uint8List? _selectedImageBytes;
  bool _isSaving = false;
  List<String> _shelves = [];

  @override
  void initState() {
    super.initState();
    _titleController = TextEditingController(text: widget.book?['title'] ?? '');
    _authorController = TextEditingController(text: widget.book?['author'] ?? '');
    _isbnController = TextEditingController(text: widget.book?['isbn'] ?? '');
    _publisherController = TextEditingController(text: widget.book?['publisher'] ?? '');
    _totalController = TextEditingController(text: widget.book?['total']?.toString() ?? '');
    _priceController = TextEditingController(text: widget.book?['price']?.toString() ?? '');
    _remarksController = TextEditingController(text: widget.book?['remarks'] ?? '');
    
    _loadShelves();

    if (widget.book != null) {
      _selectedCategory = widget.book['category'];
      _selectedShelf = widget.book['shelf'];
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _authorController.dispose();
    _isbnController.dispose();
    _publisherController.dispose();
    _totalController.dispose();
    _priceController.dispose();
    _remarksController.dispose();
    super.dispose();
  }

  final List<String> _categories = [
    "Computer Science",
    "Mathematics",
    "Literature",
    "History",
    "Physics",
  ];

  Future<void> _loadShelves() async {
    try {
      final data = await ShelfService.getAllShelves();
      setState(() {
        _shelves = data.map((e) => e['name'].toString()).toList();
      });
    } catch (e) {
      debugPrint("Error loading shelves: $e");
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70, maxWidth: 1024);
    if (image != null) {
      final bytes = await CloudinaryService.getImageBytes(image);
      setState(() {
        _selectedImage = image;
        _selectedImageBytes = bytes;
      });
    }
  }

  Future<void> _saveBook() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategory == null) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select category')));
        return;
    }

    setState(() => _isSaving = true);

    try {
      String? coverUrl = widget.book?['cover'];
      if (_selectedImage != null) {
        coverUrl = await ApplicationService.uploadToCloudinary(_selectedImage);
      }

      final bookData = {
        'title': _titleController.text,
        'author': _authorController.text,
        'isbn': _isbnController.text,
        'publisher': _publisherController.text,
        'category': _selectedCategory,
        'shelf': _selectedShelf,
        'total': int.tryParse(_totalController.text) ?? 1,
        'available': widget.book != null 
            ? (widget.book['available'] + ((int.tryParse(_totalController.text) ?? 1) - (widget.book['total'] ?? 1)))
            : (int.tryParse(_totalController.text) ?? 1),
        'price': double.tryParse(_priceController.text) ?? 0.0,
        'remarks': _remarksController.text,
        'cover': coverUrl ?? "https://via.placeholder.com/400x600?text=No+Cover",
      };

      if (widget.book != null) {
        await BookService.updateBook(widget.book['_id'], bookData);
      } else {
        await BookService.createBook(bookData);
      }

      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(widget.book != null ? 'Book updated successfully' : 'Book added successfully')));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error saving book: $e')));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        bool isMobile = constraints.maxWidth < 850;
        bool isTablet = constraints.maxWidth >= 850 && constraints.maxWidth < 1100;

        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0,
            iconTheme: const IconThemeData(color: Colors.black87),
            title: Text(
              widget.book != null ? "Edit Book" : "Add New Book",
              style: const TextStyle(
                color: Colors.black87,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            actions: [
              if (!isMobile)
                Padding(
                  padding: const EdgeInsets.only(right: 24.0, top: 10, bottom: 10),
                  child: _primaryActionBtn(_isSaving ? "Saving..." : "Save Book", Icons.check_circle_outline, _isSaving ? () {} : _saveBook),
                )
            ],
          ),
          body: SingleChildScrollView(
            padding: EdgeInsets.all(isMobile ? 16 : 32),
            child: Form(
              key: _formKey,
              child: isMobile
                  ? Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildImageUploader(),
                        const SizedBox(height: 24),
                        _buildFormFields(),
                        const SizedBox(height: 32),
                        SizedBox(
                          width: double.infinity,
                          child: _primaryActionBtn(_isSaving ? "Saving..." : "Save Book", Icons.check_circle_outline, _isSaving ? () {} : _saveBook, isMobile: true),
                        ),
                      ],
                    )
                  : Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          flex: 1,
                          child: _buildImageUploader(),
                        ),
                        const SizedBox(width: 32),
                        Expanded(
                          flex: 2,
                          child: _buildFormFields(),
                        ),
                      ],
                    ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildImageUploader() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 20,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          const Text(
            "Book Cover",
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          const SizedBox(height: 8),
          Text(
            "Upload a high quality image of the book cover. Recommended size 400x600.",
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
          ),
          const SizedBox(height: 24),
          AspectRatio(
            aspectRatio: 2 / 3,
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.grey.shade300, style: BorderStyle.none),
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: _pickImage,
                  borderRadius: BorderRadius.circular(16),
                  child: (_selectedImage != null || widget.book?['cover'] != null)
                      ? Stack(
                          fit: StackFit.expand,
                          children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(16),
                              child: _selectedImageBytes != null
                                ? Image.memory(_selectedImageBytes!, fit: BoxFit.cover)
                                : Image.network(widget.book['cover'], fit: BoxFit.cover),
                            ),
                            Positioned(
                              top: 8,
                              right: 8,
                              child: CircleAvatar(
                                backgroundColor: Colors.white,
                                radius: 14,
                                child: IconButton(
                                  onPressed: () {
                                    if (_selectedImage != null) {
                                      setState(() => _selectedImage = null);
                                    } else {
                                      // Clear network image (will revert to placeholder)
                                      setState(() => widget.book['cover'] = null);
                                    }
                                  },
                                  icon: const Icon(Icons.close, size: 14, color: Colors.red),
                                  padding: EdgeInsets.zero,
                                ),
                              ),
                            ),
                          ],
                        )
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withValues(alpha: 0.05),
                                    blurRadius: 10,
                                  ),
                                ],
                              ),
                              child: const Icon(Icons.cloud_upload_outlined, color: Color(0xFF4F46E5), size: 32),
                            ),
                            const SizedBox(height: 16),
                            const Text(
                              "Click to upload",
                              style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF4F46E5)),
                            ),
                            if (widget.book?['cover'] != null) ...[
                               const SizedBox(height: 8),
                               const Text("(Current cover will be kept if not changed)", style: TextStyle(fontSize: 10, color: Colors.grey)),
                            ],
                            const SizedBox(height: 4),
                            Text("PNG, JPG up to 5MB", style: TextStyle(color: Colors.grey.shade500, fontSize: 12)),
                          ],
                        ),
                ),
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1);
  }

  Widget _buildFormFields() {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.02),
            blurRadius: 20,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Book Information",
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          const SizedBox(height: 24),
          _textField("Book Title", "Enter the title of the book", Icons.book_rounded, controller: _titleController),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(child: _textField("Author", "Author's name", Icons.person_rounded, controller: _authorController)),
              const SizedBox(width: 20),
              Expanded(child: _textField("ISBN Number", "e.g. 978-0132350884", Icons.numbers_rounded, controller: _isbnController)),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(child: _dropdown("Category", _categories, _selectedCategory, (v) => setState(() => _selectedCategory = v))),
              const SizedBox(width: 20),
              Expanded(child: _textField("Publisher", "Publisher name", Icons.business_rounded, controller: _publisherController)),
            ],
          ),
          const SizedBox(height: 32),
          const Divider(),
          const SizedBox(height: 32),
          const Text(
            "Inventory Details",
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(child: _textField("Total Copies", "0", Icons.inventory_2_rounded, controller: _totalController, isNumber: true)),
              const SizedBox(width: 20),
              Expanded(child: _dropdown("Shelf Location", _shelves, _selectedShelf, (v) => setState(() => _selectedShelf = v))),
            ],
          ),
          const SizedBox(height: 20),
          _textField("Price (Optional)", "₹ 0.00", Icons.currency_rupee_rounded, controller: _priceController, isNumber: true),
          const SizedBox(height: 20),
          _textField("Description / Remarks", "Any additional notes about the book...", Icons.notes_rounded, controller: _remarksController, maxLines: 3),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1);
  }

  Widget _textField(String label, String hint, IconData icon, {TextEditingController? controller, bool isNumber = false, int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          keyboardType: isNumber ? TextInputType.number : TextInputType.text,
          validator: (v) => v == null || v.isEmpty ? 'This field is required' : null,
          maxLines: maxLines,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 14),
            prefixIcon: maxLines == 1 ? Icon(icon, color: Colors.grey.shade400, size: 20) : null,
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey.shade200),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: Colors.grey.shade200),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Color(0xFF4F46E5)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _dropdown(String label, List<String> items, String? val, Function(String?) onCh) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.black87),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: val,
              isExpanded: true,
              hint: Text(
                "Select $label",
                style: TextStyle(color: Colors.grey.shade400, fontSize: 14),
              ),
              icon: Icon(Icons.keyboard_arrow_down_rounded, color: Colors.grey.shade400),
              items: items
                  .map((e) => DropdownMenuItem(value: e, child: Text(e, style: const TextStyle(fontSize: 14))))
                  .toList(),
              onChanged: onCh,
            ),
          ),
        ),
      ],
    );
  }

  Widget _primaryActionBtn(String label, IconData icon, VoidCallback onTap, {bool isMobile = false}) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF4F46E5),
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF4F46E5).withValues(alpha: 0.3),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: EdgeInsets.symmetric(
              horizontal: 20,
              vertical: isMobile ? 16 : 12,
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(icon, color: Colors.white, size: 18),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
