import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'core/app_theme.dart';
import 'features/onboarding/screens/showcase_screen.dart';
import 'core/services/auth_service.dart';
import 'features/admin/screens/admin_shell.dart';
import 'features/library/screens/library_shell.dart';
import 'features/staff/screens/staff_shell.dart';

import 'features/lab/screens/lab_shell.dart';
import 'features/office/screens/office_shell.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: "assets/.env");

  final String? rawRole = await AuthService.getUserRole();
  final String role = (rawRole ?? '').trim().toUpperCase();
  Widget initialHome;

  if (rawRole == null) {
    initialHome = const ShowcaseScreen();
  } else {
    switch (role) {
      case 'ADMIN':
        initialHome = const AdminShell();
        break;
      case 'STAFF':
      case 'FACULTY':
      case 'HOD':
      case 'PRINCIPAL':
        initialHome = const StaffShell();
        break;
      case 'LIBRARIAN':
      case 'LIBRARY':
        initialHome = const LibraryShell();
        break;
      case 'LAB':
        initialHome = const LabShell();
        break;
      case 'OFFICE':
      case 'ACCOUNTANT':
        initialHome = const OfficeShell();
        break;
      default:
        initialHome = const ShowcaseScreen();
    }
  }

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );
  runApp(MayaAdminApp(home: initialHome));
}

class MayaAdminApp extends StatelessWidget {
  final Widget home;
  const MayaAdminApp({super.key, required this.home});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Maya Admin ERP',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: home,
    );
  }
}
