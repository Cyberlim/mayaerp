import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class FacultyService {
  static String get baseUrl => '${dotenv.get('BACKEND_URL', fallback: 'https://mayaerpbackend.onrender.com/api')}/faculty';

  static Future<List<dynamic>> getCourseFaculty(String courseId) async {
    final response = await http.get(Uri.parse('$baseUrl/$courseId'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load faculty');
    }
  }

  static Future<Map<String, dynamic>> addFaculty(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse(baseUrl),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(data),
    );
    if (response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to add faculty');
    }
  }

  static Future<void> deleteFaculty(String id) async {
    final response = await http.delete(Uri.parse('$baseUrl/$id'));
    if (response.statusCode != 200) throw Exception('Failed to remove faculty');
  }
}
