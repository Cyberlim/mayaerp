import 'package:flutter/material.dart';
import '../../../core/app_constants.dart';
import '../../../core/services/transport_service.dart';

class CreateBusScreen extends StatefulWidget {
  const CreateBusScreen({super.key});

  @override
  State<CreateBusScreen> createState() => _CreateBusScreenState();
}

class _CreateBusScreenState extends State<CreateBusScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isSaving = false;

  final TextEditingController _busNoController = TextEditingController();
  final TextEditingController _driverNameController = TextEditingController();
  final TextEditingController _conductorNameController =
      TextEditingController();
  final TextEditingController _capacityController = TextEditingController();
  final TextEditingController _routeController = TextEditingController();

  final List<TextEditingController> _stopControllers = [
    TextEditingController(),
  ];
  final List<TextEditingController> _priceControllers = [
    TextEditingController(),
  ];

  Future<void> _saveBus() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    try {
      List<Map<String, dynamic>> stopsData = [];
      for (int i = 0; i < _stopControllers.length; i++) {
        if (_stopControllers[i].text.isNotEmpty) {
          stopsData.add({
            "stationName": _stopControllers[i].text,
            "price": double.tryParse(_priceControllers[i].text) ?? 0.0,
          });
        }
      }

      final busData = {
        "busNo": _busNoController.text,
        "driverName": _driverNameController.text,
        "conductorName": _conductorNameController.text,
        "capacity": int.parse(_capacityController.text),
        "routeName": _routeController.text,
        "stops": stopsData,
      };

      await TransportService.createBus(busData);
      
      if (mounted) {
        Navigator.pop(context, true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text("Bus registered successfully with pricing!")),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Error: $e")),
        );
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

        return Scaffold(
          backgroundColor: const Color(0xFFF8F6F6),
          appBar: isMobile
              ? AppBar(
                  elevation: 0,
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                  title: const Text("Fleet Expansion", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                  leading: IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                )
              : null,
          body: Row(
            children: [
              if (!isMobile)
                Container(
                  width: 350,
                  color: Colors.black,
                  padding: const EdgeInsets.all(40),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      IconButton(
                        onPressed: () => Navigator.pop(context),
                        icon: const Icon(
                          Icons.arrow_back_ios_new_rounded,
                          color: Colors.white,
                          size: 20,
                        ),
                      ),
                      const SizedBox(height: 40),
                      const Icon(
                        Icons.directions_bus_filled_rounded,
                        color: Colors.white,
                        size: 48,
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        "Fleet Expansion",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 32,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        "Define your routes and set institutional pricing for each stop to manage your fleet's economy.",
                        style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.6),
                          height: 1.5,
                        ),
                      ),
                      const Spacer(),
                      _guideStep("1", "Logistics", "Assign hardware and crew"),
                      _guideStep("2", "Stations", "Define route waypoints"),
                      _guideStep("3", "Pricing", "Set ticket rates per stop"),
                    ],
                  ),
                ),

              Expanded(
                child: SingleChildScrollView(
                  padding: EdgeInsets.all(isMobile ? 24 : 60),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _sectionHeader("Vehicle Information"),
                        const SizedBox(height: 32),
                        _responsiveRow(isMobile, [
                          _textField(
                            "BUS NUMBER",
                            "e.g. DL-01-AB-1234",
                            _busNoController,
                          ),
                          _textField(
                            "CAPACITY",
                            "Seats (e.g. 50)",
                            _capacityController,
                            isNumber: true,
                          ),
                        ]),
                        const SizedBox(height: 48),

                        _sectionHeader("Management Crew"),
                        const SizedBox(height: 32),
                        _responsiveRow(isMobile, [
                          _textField(
                            "DRIVER NAME",
                            "Certified ID Name",
                            _driverNameController,
                          ),
                          _textField(
                            "CONDUCTOR NAME",
                            "Certified ID Name",
                            _conductorNameController,
                          ),
                        ]),
                        const SizedBox(height: 48),

                        _sectionHeader("Route & Dynamic Pricing"),
                        const SizedBox(height: 32),
                        _textField(
                          "PRIMARY ROUTE NAME",
                          "e.g. Campus Express",
                          _routeController,
                        ),
                        const SizedBox(height: 32),
                        const Text(
                          "STATIONS & STATION FARE",
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: Colors.grey,
                            letterSpacing: 1.5,
                          ),
                        ),
                        const SizedBox(height: 16),
                        ..._stopControllers.asMap().entries.map((entry) {
                          int idx = entry.key;
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  flex: 2,
                                  child: _textField(
                                    "STATION ${idx + 1}",
                                    "Stop name",
                                    _stopControllers[idx],
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: _textField(
                                    "FARE (₹)",
                                    "0.00",
                                    _priceControllers[idx],
                                    isNumber: true,
                                  ),
                                ),
                                if (_stopControllers.length > 1)
                                  Padding(
                                    padding: const EdgeInsets.only(top: 24),
                                    child: IconButton(
                                      onPressed: () => setState(() {
                                        _stopControllers.removeAt(idx);
                                        _priceControllers.removeAt(idx);
                                      }),
                                      icon: const Icon(Icons.delete_sweep_rounded, color: Colors.red),
                                    ),
                                  ),
                              ],
                            ),
                          );
                        }),
                        TextButton.icon(
                          onPressed: () => setState(() {
                            _stopControllers.add(TextEditingController());
                            _priceControllers.add(TextEditingController());
                          }),
                          icon: const Icon(Icons.add_circle_outline_rounded),
                          label: const Text("Append Station waypoint"),
                          style: TextButton.styleFrom(foregroundColor: AppColors.primaryRed),
                        ),

                        const SizedBox(height: 60),
                        _buildActionButtons(isMobile),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildActionButtons(bool isMobile) {
    Widget saveBtn = ElevatedButton(
      onPressed: _isSaving ? null : _saveBus,
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 60, vertical: 20),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: _isSaving 
        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)) 
        : const Text("Verify & Deploy Fleet"),
    );

    Widget cancelBtn = OutlinedButton(
      onPressed: () => Navigator.pop(context),
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 20),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ).copyWith(
        side: WidgetStateProperty.all(const BorderSide(color: Colors.black, width: 1)),
      ),
      child: const Text("Abandone Creation", style: TextStyle(color: Colors.black)),
    );

    if (isMobile) {
      return Column(
        children: [
          SizedBox(width: double.infinity, child: saveBtn),
          const SizedBox(height: 12),
          SizedBox(width: double.infinity, child: cancelBtn),
        ],
      );
    }
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        cancelBtn,
        const SizedBox(width: 16),
        saveBtn,
      ],
    );
  }

  Widget _responsiveRow(bool isMobile, List<Widget> children) {
    if (isMobile) {
      return Column(
        children: children.map((c) => Padding(padding: const EdgeInsets.only(bottom: 24), child: c)).toList(),
      );
    }
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: children.map((c) => Expanded(child: Padding(padding: const EdgeInsets.only(right: 24), child: c))).toList(),
    );
  }

  Widget _sectionHeader(String title) {
    return Row(
      children: [
        Container(
          width: 4, height: 24,
          decoration: BoxDecoration(color: AppColors.primaryRed, borderRadius: BorderRadius.circular(2)),
        ),
        const SizedBox(width: 12),
        Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
      ],
    );
  }

  Widget _guideStep(String num, String title, String sub) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Row(
        children: [
          Container(
            width: 32, height: 32,
            decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.1), shape: BoxShape.circle),
            child: Center(child: Text(num, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold))),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
              Text(sub, style: TextStyle(color: Colors.white.withValues(alpha: 0.4), fontSize: 11)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _textField(String label, String hint, TextEditingController controller, {bool isNumber = false}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, color: Colors.grey, letterSpacing: 1.5)),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.white, borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: TextFormField(
            controller: controller,
            keyboardType: isNumber ? TextInputType.number : TextInputType.text,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
            decoration: InputDecoration(
              hintText: hint, hintStyle: const TextStyle(color: Colors.grey, fontSize: 13),
              border: InputBorder.none,
            ),
            validator: (v) => v!.isEmpty ? "Required" : null,
          ),
        ),
      ],
    );
  }
}
