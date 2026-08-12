import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class TimetableService {
  static String get baseUrl => '${dotenv.get('BACKEND_URL', fallback: 'https://mayaerpbackend.onrender.com/api')}/timetables';

  static Future<Map<String, dynamic>> getTimetable(String courseId, String branchId, int semester, String section) async {
    final response = await http.get(Uri.parse('$baseUrl/?courseId=$courseId&branchId=$branchId&semester=$semester&section=$section'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load timetable');
    }
  }

  static Future<Map<String, dynamic>> saveTimetable(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse(baseUrl),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(data),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to save timetable');
    }
  }
}
