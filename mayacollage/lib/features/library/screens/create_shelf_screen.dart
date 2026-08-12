import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../../core/services/shelf_service.dart';

class CreateShelfScreen extends StatefulWidget {
  const CreateShelfScreen({super.key});

  @override
  State<CreateShelfScreen> createState() => _CreateShelfScreenState();
}

class _CreateShelfScreenState extends State<CreateShelfScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _aisleController = TextEditingController();
  final _capacityController = TextEditingController();
  final _descController = TextEditingController();

  bool _isSaving = false;

  String? _selectedCategory;
  final List<String> _categories = [
    "Computer Science",
    "Mathematics",
    "Literature",
    "History",
    "Physics",
    "General",
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _aisleController.dispose();
    _capacityController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _createShelf() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedCategory == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Please select category")));
      return;
    }

    setState(() => _isSaving = true);
    try {
      await ShelfService.createShelf({
        'name': _nameController.text,
        'aisle': _aisleController.text,
        'capacity': int.tryParse(_capacityController.text) ?? 100,
        'category': _selectedCategory,
        'description': _descController.text,
      });
      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text("Shelf created successfully")));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text("Error: $e")));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        bool isMobile = constraints.maxWidth < 600;

        return Scaffold(
          backgroundColor: const Color(0xFFF8FAFC),
          appBar: AppBar(
            backgroundColor: Colors.white,
            elevation: 0,
            iconTheme: const IconThemeData(color: Colors.black87),
            title: const Text(
              "Create New Shelf",
              style: TextStyle(
                color: Colors.black87,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            actions: [
              if (!isMobile)
                Padding(
                  padding: const EdgeInsets.only(right: 24.0, top: 10, bottom: 10),
                  child: _primaryActionBtn(_isSaving ? "Creating..." : "Create Shelf", Icons.check_circle_outline, _isSaving ? () {} : _createShelf),
                )
            ],
          ),
          body: SingleChildScrollView(
            padding: EdgeInsets.all(isMobile ? 16 : 32),
            child: Align(
              alignment: Alignment.topCenter,
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 800),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildFormFields(isMobile),
                      if (isMobile) ...[
                        const SizedBox(height: 32),
                        SizedBox(
                          width: double.infinity,
                          child: _primaryActionBtn(_isSaving ? "Creating..." : "Create Shelf", Icons.check_circle_outline, _isSaving ? () {} : _createShelf, isMobile: true),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildFormFields(bool isMobile) {
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
            "Shelf Details",
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(child: _textField("Shelf Name", "e.g. CS-A1", Icons.storage_rounded, controller: _nameController)),
              const SizedBox(width: 20),
              Expanded(child: _textField("Aisle", "e.g. A", Icons.map_rounded, controller: _aisleController)),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(child: _textField("Capacity (Books)", "e.g. 200", Icons.inventory_2_rounded, isNumber: true, controller: _capacityController)),
              const SizedBox(width: 20),
              Expanded(child: _dropdown("Category / Subject", _categories, _selectedCategory, (v) => setState(() => _selectedCategory = v))),
            ],
          ),
          const SizedBox(height: 20),
          _textField("Location Description", "e.g. First floor, North wing near the windows...", Icons.location_on_rounded, maxLines: 2, controller: _descController),
        ],
      ),
    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1);
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
          validator: (v) => v == null || v.isEmpty ? 'Field required' : null,
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
