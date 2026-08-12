import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';

class CreatePayoutScreen extends StatefulWidget {
  const CreatePayoutScreen({super.key});

  @override
  State<CreatePayoutScreen> createState() => _CreatePayoutScreenState();
}

class _CreatePayoutScreenState extends State<CreatePayoutScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedStaff;
  String? _payoutType = 'Monthly Salary';
  String? _paymentMode = 'Direct Bank Transfer';
  final TextEditingController _amountController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();

  final List<String> _payoutTypes = [
    'Monthly Salary',
    'Bonus / Incentive',
    'Overtime Pay',
    'Reimbursement',
    'Vendor Payment',
    'Utility Bill',
  ];

  final List<String> _staffList = [
    'Dr. Arpit Mishra (Dean)',
    'Prof. Sunita Rao (HOD CSE)',
    'Ramesh Kumar (Admin Staff)',
    'Suresh Raina (Security)',
    'Anjali Sharma (Librarian)',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F6F6),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isMobile = constraints.maxWidth < 900;
          
          return Row(
            children: [
              // ── LEFT: Payout Summary Panel (Hidden on mobile) ──
              if (!isMobile) _buildSummaryPanel(),

              // ── RIGHT: Creation Form ──
              Expanded(
                child: Column(
                  children: [
                    _buildHeader(isMobile),
                    Expanded(
                      child: SingleChildScrollView(
                        padding: EdgeInsets.all(isMobile ? 24 : 60),
                        child: _buildPayoutForm(isMobile),
                      ),
                    ),
                    _buildFooterActions(isMobile),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildSummaryPanel() {
    return Container(
      width: 380,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
      ),
      child: Stack(
        children: [
          Positioned(
            top: -100,
            left: -100,
            child: _blurBlob(300, Colors.blue.withValues(alpha: 0.1)),
          ),
          Positioned(
            bottom: -150,
            right: -50,
            child: _blurBlob(400, Colors.indigo.withValues(alpha: 0.08)),
          ),
          SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(48),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _backButton(),
                  const SizedBox(height: 60),
                  const Text(
                    "New Financial Payout",
                    style: TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w900,
                      fontSize: 34,
                      letterSpacing: -1.2,
                      height: 1.1,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Text(
                    "Initiate a secure fund transfer to staff members or vendors. Please verify account details before final submission.",
                    style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.6),
                      fontSize: 14,
                      height: 1.5,
                    ),
                  ),
                  const SizedBox(height: 60),

                  _payoutInfoCard(
                    "Verification Required",
                    "Payouts above ₹50,000 require secondary admin approval.",
                    Icons.verified_user_rounded,
                    Colors.blueAccent,
                  ),
                  const SizedBox(height: 24),
                  _payoutInfoCard(
                    "Instant Transfer",
                    "IMPS/UPI payouts are processed immediately 24/7.",
                    Icons.speed_rounded,
                    Colors.greenAccent,
                  ),

                  const SizedBox(height: 48),
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.05),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              "Available Balance",
                              style: TextStyle(
                                color: Colors.white60,
                                fontSize: 13,
                              ),
                            ),
                            Text(
                              "₹42,80,500",
                              style: TextStyle(
                                color: Colors.white.withValues(alpha: 0.9),
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        const Divider(color: Colors.white10),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              "Monthly Outflow",
                              style: TextStyle(
                                color: Colors.white60,
                                fontSize: 13,
                              ),
                            ),
                            const Text(
                              "₹18,40,000",
                              style: TextStyle(
                                color: Colors.redAccent,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 20 : 40,
        vertical: 24,
      ),
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              if (isMobile) ...[
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.arrow_back_rounded, size: 20),
                ),
                const SizedBox(width: 8),
              ],
              const Icon(
                Icons.account_balance_rounded,
                color: Colors.blueAccent,
                size: 20,
              ),
              const SizedBox(width: 12),
              if (!isMobile) ...[
                Text(
                  "Vault",
                  style: AppTheme.titleStyle.copyWith(
                    fontSize: 13,
                    color: Colors.grey.shade500,
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: Colors.grey,
                  size: 16,
                ),
              ],
              Text(
                "Payout Initiation",
                style: AppTheme.titleStyle.copyWith(
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          if (!isMobile)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(100),
              ),
              child: const Row(
                children: [
                  CircleAvatar(radius: 4, backgroundColor: Colors.green),
                  SizedBox(width: 10),
                  Text(
                    "Gateway Active",
                    style: TextStyle(
                      color: Colors.green,
                      fontWeight: FontWeight.bold,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPayoutForm(bool isMobile) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "Finalize Transfer",
            style: TextStyle(
              fontSize: isMobile ? 22 : 24,
              fontWeight: FontWeight.w900,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            "Verify all participant details before authorization.",
            style: TextStyle(color: Colors.grey.shade500, fontSize: 13),
          ),
          const SizedBox(height: 32),

          _row(isMobile, [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _fieldLabel("SELECT STAFF / VENDOR"),
                _dropdownSelect(
                  _staffList,
                  _selectedStaff,
                  (v) => setState(() => _selectedStaff = v),
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _fieldLabel("PAYOUT CATEGORY"),
                _dropdownSelect(
                  _payoutTypes,
                  _payoutType,
                  (v) => setState(() => _payoutType = v),
                ),
              ],
            ),
          ]),
          const SizedBox(height: 24),

          _row(isMobile, [
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _fieldLabel("TRANSACTION AMOUNT (₹)"),
                _textInput(
                  "Enter Amount",
                  controller: _amountController,
                  icon: Icons.currency_rupee_rounded,
                ),
              ],
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _fieldLabel("PAYMENT MODE"),
                _dropdownSelect(
                  [
                    'Direct Bank Transfer',
                    'UPI Payout',
                    'Cheque / Draft',
                    'Wallet',
                  ],
                  _paymentMode,
                  (v) => setState(() => _paymentMode = v),
                ),
              ],
            ),
          ]),
          const SizedBox(height: 24),

          _fieldLabel("REMARKS / DESCRIPTION"),
          _textInput(
            "Detailed description...",
            controller: _descriptionController,
            maxLines: 4,
          ),

          const SizedBox(height: 32),
          _verificationToggle(),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.05);
  }

  Widget _row(bool isMobile, List<Widget> children) {
    if (isMobile) {
      return Column(
        children: children
            .map((c) => Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: c,
                ))
            .toList(),
      );
    }
    return Row(
      children: children
          .map((c) => Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(right: 32),
                  child: c,
                ),
              ))
          .toList(),
    );
  }

  Widget _buildFooterActions(bool isMobile) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: isMobile ? 24 : 40,
        vertical: 32,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFF1F1F1))),
      ),
      child: isMobile
          ? Column(
              children: [
                SizedBox(
                  width: double.infinity,
                  child: _mainActionBtn("Authorize & Payout"),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: _secondaryBtn("Save Draft"),
                ),
              ],
            )
          : Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Final Step: Review and authorize transaction.",
                  style: TextStyle(
                    color: Colors.grey.shade400,
                    fontStyle: FontStyle.italic,
                    fontSize: 13,
                  ),
                ),
                Row(
                  children: [
                    _secondaryBtn("Save Draft"),
                    const SizedBox(width: 16),
                    _mainActionBtn("Authorize & Payout"),
                  ],
                ),
              ],
            ),
    );
  }

  // ── HELPER WIDGETS ──
  Widget _fieldLabel(String label) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Text(
      label,
      style: const TextStyle(
        fontWeight: FontWeight.w900,
        fontSize: 10,
        color: Colors.grey,
        letterSpacing: 1,
      ),
    ),
  );

  Widget _textInput(
    String hint, {
    TextEditingController? controller,
    IconData? icon,
    int maxLines = 1,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: TextStyle(fontSize: 13, color: Colors.grey.shade400),
          prefixIcon: icon != null
              ? Icon(icon, size: 18, color: Colors.blueAccent)
              : null,
          contentPadding: const EdgeInsets.all(16),
          border: InputBorder.none,
        ),
      ),
    );
  }

  Widget _dropdownSelect(
    List<String> items,
    String? value,
    Function(String?) onChanged,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          items: items
              .map(
                (e) => DropdownMenuItem(
                  value: e,
                  child: Text(
                    e,
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              )
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _payoutInfoCard(String title, String sub, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  sub,
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.5),
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _verificationToggle() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.withValues(alpha: 0.05),
        border: Border.all(color: Colors.blue.withValues(alpha: 0.1)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const Icon(Icons.shield_rounded, color: Colors.blueAccent, size: 20),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Compliance Check",
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                Text(
                  "I confirm that the above payout matches the verified invoice.",
                  style: TextStyle(color: Colors.grey, fontSize: 11),
                ),
              ],
            ),
          ),
          Switch(
            value: true,
            onChanged: (v) {},
            activeThumbColor: Colors.blueAccent,
          ),
        ],
      ),
    );
  }

  Widget _blurBlob(double size, Color color) => Container(
    width: size,
    height: size,
    decoration: BoxDecoration(
      shape: BoxShape.circle,
      color: color,
      boxShadow: [BoxShadow(color: color, blurRadius: 100, spreadRadius: 50)],
    ),
  );

  Widget _backButton() => InkWell(
    onTap: () => Navigator.pop(context),
    child: Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Icon(
        Icons.arrow_back_ios_new_rounded,
        color: Colors.white,
        size: 14,
      ),
    ),
  );

  Widget _secondaryBtn(String label) => OutlinedButton(
    onPressed: () {},
    style: OutlinedButton.styleFrom(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 18),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      side: BorderSide(color: Colors.grey.shade300),
    ),
    child: Text(
      label,
      style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 13),
    ),
  );

  Widget _mainActionBtn(String label) => Container(
    decoration: BoxDecoration(
      gradient: AppColors.primaryGradient,
      borderRadius: BorderRadius.circular(12),
      boxShadow: [
        BoxShadow(
          color: AppColors.primaryRed.withValues(alpha: 0.2),
          blurRadius: 12,
          offset: const Offset(0, 6),
        ),
      ],
    ),
    child: ElevatedButton(
      onPressed: () {},
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.transparent,
        shadowColor: Colors.transparent,
        padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 18),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
          fontSize: 13,
        ),
      ),
    ),
  );
}
