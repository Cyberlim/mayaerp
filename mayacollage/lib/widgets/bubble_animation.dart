import 'dart:math' as math;
import 'package:flutter/material.dart';

class BubbleAnimation extends StatefulWidget {
  final Widget child;
  final Color bubbleColor;
  final int bubbleCount;

  const BubbleAnimation({
    super.key,
    required this.child,
    this.bubbleColor = Colors.white,
    this.bubbleCount = 5,
  });

  @override
  State<BubbleAnimation> createState() => _BubbleAnimationState();
}

class _BubbleAnimationState extends State<BubbleAnimation> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  final List<_BubbleModel> _bubbles = [];
  final math.Random _random = math.Random();

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();

    for (int i = 0; i < widget.bubbleCount; i++) {
        _bubbles.add(_BubbleModel(
          position: Offset(_random.nextDouble(), _random.nextDouble()),
          size: _random.nextDouble() * 60 + 20,
          speed: _random.nextDouble() * 0.002 + 0.001,
          opacity: _random.nextDouble() * 0.1 + 0.05,
        ));
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Stack(
          children: [
            ..._bubbles.map((bubble) {
                // Update position
                bubble.currentY -= bubble.speed;
                if (bubble.currentY < -0.2) bubble.currentY = 1.2;

                return Positioned(
                  left: bubble.position.dx * MediaQuery.of(context).size.width,
                  top: bubble.currentY * 200, // Relative to container height
                  child: Container(
                    width: bubble.size,
                    height: bubble.size,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: widget.bubbleColor.withValues(alpha: bubble.opacity),
                    ),
                  ),
                );
            }),
            widget.child,
          ],
        );
      },
    );
  }
}

class _BubbleModel {
  Offset position;
  double currentY;
  double size;
  double speed;
  double opacity;

  _BubbleModel({
    required this.position,
    required this.size,
    required this.speed,
    required this.opacity,
  }) : currentY = position.dy;
}
