import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

class LibraryBottomBar extends StatelessWidget {
  final int selectedIndex;
  final Function(int) onItemSelected;

  const LibraryBottomBar({
    super.key,
    required this.selectedIndex,
    required this.onItemSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 20),
      child: Container(
        height: 75,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(40),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 30,
              offset: const Offset(0, 10),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _bottomNavItem(0, Icons.dashboard_outlined, Icons.dashboard_rounded, "Inbox", selectedIndex == 0),
            _bottomNavItem(1, Icons.library_books_outlined, Icons.library_books_rounded, "Books", selectedIndex == 1),
            const SizedBox(width: 60), 
            _bottomNavItem(2, Icons.outbox_outlined, Icons.outbox_rounded, "Issue", selectedIndex == 2),
            _bottomNavItem(3, Icons.inventory_2_outlined, Icons.inventory_2_rounded, "Inventory", selectedIndex == 3),
          ],
        ),
      ),
    ).animate().slideY(begin: 0.5, curve: Curves.easeOut);
  }

  static Widget floatingCenterButton(BuildContext context, VoidCallback onTap) {
    return Positioned(
      bottom: 45,
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
            child: const Icon(Icons.add_rounded, color: Colors.white, size: 32),
          ),
        ).animate(onPlay: (c) => c.repeat(reverse: true))
         .scale(begin: const Offset(1, 1), end: const Offset(1.05, 1.05), duration: 1000.ms)
         .shimmer(duration: 2.seconds),
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
