import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class AttendanceService {
  static String get _baseUrl => '${dotenv.get('BACKEND_URL', fallback: 'https://mayaerpbackend.onrender.com/api')}/attendance';

  static Future<List<dynamic>> getAttendanceHistory(String date, String dept, String course, String subject, String subjectCode) async {
    final uri = Uri.parse(_baseUrl).replace(queryParameters: {
      'date': date,
      'department': dept,
      'course': course,
      'subject': subject,
      'subjectCode': subjectCode,
    });
    
    final response = await http.get(uri);
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load attendance');
  }

  static Future<void> submitAttendanceBulk({
    required String date,
    required List<Map<String, dynamic>> attendanceList,
    required String department,
    required String course,
    required String section,
    required String subject,
    required String subjectCode,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/bulk'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'date': date,
        'attendanceList': attendanceList,
        'department': department,
        'course': course,
        'section': section,
        'subject': subject,
        'subjectCode': subjectCode,
      }),
    );
    
    if (response.statusCode != 200) {
      final error = json.decode(response.body);
      throw Exception(error['message'] ?? 'Failed to submit attendance');
    }
  }

  static Future<List<dynamic>> getStudentsForAttendance({
    required String branchId,
    required String courseId,
    String? semester,
    required String section,
  }) async {
    final uri = Uri.parse('$_baseUrl/students').replace(queryParameters: {
      'branchId': branchId,
      'courseId': courseId,
      'semester': ?semester,
      'section': section,
    });
    
    final response = await http.get(uri);
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load students');
  }

  static Future<Map<String, dynamic>> getAttendanceStats() async {
    final response = await http.get(Uri.parse('$_baseUrl/stats'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Failed to load stats');
  }
}
