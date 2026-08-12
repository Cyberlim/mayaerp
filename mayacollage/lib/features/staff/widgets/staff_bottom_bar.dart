import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class StaffBottomBar extends StatelessWidget {
  final int selectedIndex;
  final Function(int) onItemSelected;

  const StaffBottomBar({
    super.key,
    required this.selectedIndex,
    required this.onItemSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      // Outer padding to make it float
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
      color: Colors.transparent,
      child: Container(
        height: 75,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.95),
          borderRadius: BorderRadius.circular(40),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 30,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(40),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _bottomNavItem(0, Icons.dashboard_outlined, Icons.dashboard_rounded, "Dashboard", selectedIndex == 0),
                _bottomNavItem(1, Icons.people_outline_rounded, Icons.people_alt_rounded, "Students", selectedIndex == 1),
                
                // Placeholder for center button space
                const SizedBox(width: 60),

                _bottomNavItem(2, Icons.how_to_reg_outlined, Icons.how_to_reg_rounded, "Attendance", selectedIndex == 2),
                _bottomNavItem(3, Icons.assignment_outlined, Icons.assignment_rounded, "Exams", selectedIndex == 3),
              ],
            ),
          ),
        ),
      ),
    ).animate().slideY(begin: 1, duration: 600.ms, curve: Curves.easeOutQuart);
  }

  // Floating Center Button as a stack element above the bar
  static Widget floatingCenterButton(BuildContext context, VoidCallback onTap) {
    return Positioned(
      bottom: 45, // Elevated above the bar
      left: 0,
      right: 0,
      child: Center(
        child: GestureDetector(
          onTap: onTap,
          child: Container(
            height: 60,
            width: 60,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [Color(0xFF6366F1), Color(0xFF4F46E5), Color(0xFF3730A3)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF4F46E5).withValues(alpha: 0.4),
                  blurRadius: 20,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: const Icon(
              Icons.add_rounded,
              color: Colors.white,
              size: 32,
            ),
          ),
        ).animate(onPlay: (c) => c.repeat(reverse: true))
         .scale(begin: const Offset(1, 1), end: const Offset(1.05, 1.05), duration: 1000.ms, curve: Curves.easeInOut)
         .shimmer(duration: 2.seconds, color: Colors.white24),
      ),
    );
  }

  Widget _bottomNavItem(int index, IconData icon, IconData activeIcon, String label, bool isSelected) {
    return GestureDetector(
      onTap: () => onItemSelected(index),
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            isSelected ? activeIcon : icon,
            color: isSelected ? Colors.black87 : Colors.grey.shade400,
            size: 26,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
              color: isSelected ? Colors.black87 : Colors.grey.shade500,
            ),
          ),
        ],
      ),
    );
  }
}
