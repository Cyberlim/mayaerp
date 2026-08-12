import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class CourseService {
  static String get baseUrl => '${dotenv.env['BACKEND_URL'] ?? 'https://mayaerpbackend.onrender.com/api'}/courses';

  static Future<List<dynamic>> getAllCourses({String? branchId}) async {
    final url = branchId != null ? '$baseUrl?branchId=$branchId' : baseUrl;
    final response = await http.get(Uri.parse(url));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load courses');
    }
  }

  static Future<Map<String, dynamic>> getCourseById(String id) async {
    final response = await http.get(Uri.parse('$baseUrl/$id'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to load course');
    }
  }

  static Future<Map<String, dynamic>> createCourse(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse(baseUrl),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(data),
    );
    if (response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to create course');
    }
  }

  static Future<Map<String, dynamic>> updateCourse(String id, Map<String, dynamic> data) async {
    final response = await http.put(
      Uri.parse('$baseUrl/$id'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(data),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to update course');
    }
  }

  static Future<void> deleteCourse(String id) async {
    final response = await http.delete(Uri.parse('$baseUrl/$id'));
    if (response.statusCode != 200) {
      throw Exception('Failed to delete course');
    }
  }
}
