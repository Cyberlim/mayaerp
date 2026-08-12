import 'package:flutter/material.dart';
import '../../../core/app_constants.dart';
import '../../../core/app_theme.dart';
import 'package:flutter_animate/flutter_animate.dart';

class RolePermissionScreen extends StatefulWidget {
  const RolePermissionScreen({super.key});

  @override
  State<RolePermissionScreen> createState() => _RolePermissionScreenState();
}

class _RolePermissionScreenState extends State<RolePermissionScreen> {
  String _activeRole = 'Admin';

  final List<String> _roles = [
    'Admin',
    'Professor',
    'Library Staff',
    'Accountant',
    'Data Entry',
  ];
  final List<String> _modules = [
    'Dashboard',
    'Student Module',
    'Finance',
    'Library',
    'Reports',
    'Settings',
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundBlush,
      appBar: AppBar(
        title: const Text(
          "Access Control System",
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // SIDE ROLE LIST
          Expanded(
            flex: 3,
            child: Container(
              margin: const EdgeInsets.all(40),
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(32),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 40,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    "System Roles",
                    style: AppTheme.titleStyle.copyWith(fontSize: 20),
                  ),
                  const SizedBox(height: 32),
                  ..._roles.map((role) {
                    final isActive = _activeRole == role;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: InkWell(
                        onTap: () => setState(() => _activeRole = role),
                        borderRadius: BorderRadius.circular(16),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 16,
                          ),
                          decoration: BoxDecoration(
                            color: isActive
                                ? AppColors.primaryRed
                                : AppColors.backgroundBlush,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                role,
                                style: TextStyle(
                                  color: isActive
                                      ? Colors.white
                                      : AppColors.textMain,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              if (isActive)
                                const Icon(
                                  Icons.arrow_forward_ios_rounded,
                                  color: Colors.white,
                                  size: 14,
                                ),
                            ],
                          ),
                        ),
                      ),
                    );
                  }),
                  const Spacer(),
                  _buildCustomRoleButton(),
                ],
              ),
            ),
          ),

          // PERMISSION MATRIX
          Expanded(
            flex: 7,
            child: SingleChildScrollView(
              padding: const EdgeInsets.fromLTRB(0, 40, 40, 40),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [_buildPermissionCard()],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomRoleButton() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.primaryRed.withValues(alpha: 0.2)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.add_rounded, color: AppColors.primaryRed),
          SizedBox(width: 12),
          Text(
            "Add Custom Role",
            style: TextStyle(
              color: AppColors.primaryRed,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 500.ms).slideY(begin: 0.2);
  }

  Widget _buildPermissionCard() {
    return Container(
      padding: const EdgeInsets.all(48),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 40,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _badge("Permissions Matrix"),
                  const SizedBox(height: 12),
                  Text(
                    "Managing: $_activeRole",
                    style: AppTheme.titleStyle.copyWith(fontSize: 24),
                  ),
                ],
              ),
              ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryRed,
                  foregroundColor: Colors.white,
                ),
                child: const Text("Apply Changes"),
              ),
            ],
          ),
          const SizedBox(height: 48),
          const Divider(),
          ..._modules.map((module) => _buildModuleRow(module)),
        ],
      ),
    ).animate().fadeIn().slideX(begin: 0.1);
  }

  Widget _buildModuleRow(String module) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 20),
      child: Row(
        children: [
          Expanded(
            flex: 4,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  module,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const Text(
                  "Define CRUD operations for this module.",
                  style: TextStyle(fontSize: 11, color: Colors.black26),
                ),
              ],
            ),
          ),
          _permissionToggle("Read"),
          _permissionToggle("Write"),
          _permissionToggle("Delete"),
          _permissionToggle("Export"),
        ],
      ),
    );
  }

  Widget _permissionToggle(String label) {
    return Expanded(
      flex: 2,
      child: Column(
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 8),
          Switch(
            value: true,
            onChanged: (v) {},
            activeTrackColor: AppColors.primaryPink.withValues(alpha: 0.2),
            activeThumbColor: AppColors.primaryRed,
          ),
        ],
      ),
    );
  }

  Widget _badge(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.primaryRed.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        text.toUpperCase(),
        style: const TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w800,
          color: AppColors.primaryRed,
          letterSpacing: 1,
        ),
      ),
    );
  }
}
