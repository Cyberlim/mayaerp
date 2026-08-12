import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';

class StudentService {
  static String get baseUrl => '${dotenv.get('BACKEND_URL', fallback: 'https://mayaerpbackend.onrender.com/api')}/students';

  static Future<List<dynamic>> getAllStudents() async {
    try {
      final response = await http.get(Uri.parse(baseUrl));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to fetch students');
      }
    } catch (e) {
      rethrow;
    }
  }

  static Future<List<dynamic>> getLibraryMembers() async {
    try {
      final response = await http.get(Uri.parse('$baseUrl/library/members'));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  static Future<Map<String, dynamic>> getStudentByRollNo(String studentId) async {
    final response = await http.get(Uri.parse('$baseUrl/roll/$studentId'));
    if (response.statusCode == 200) {
      return json.decode(response.body);
    }
    throw Exception('Student not found with Roll No: $studentId');
  }

  static Future<Map<String, dynamic>> createStudent(Map<String, dynamic> data) async {
    final response = await http.post(
      Uri.parse(baseUrl),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(data),
    );
    if (response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      final errorMsg = json.decode(response.body)['message'] ?? json.decode(response.body)['error'] ?? 'Failed to create student';
      throw Exception(errorMsg);
    }
  }

  static Future<Map<String, dynamic>> updateStudent(String id, Map<String, dynamic> data) async {
    final response = await http.put(
      Uri.parse('$baseUrl/$id'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(data),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      final errorMsg = json.decode(response.body)['message'] ?? json.decode(response.body)['error'] ?? 'Failed to update student';
      throw Exception(errorMsg);
    }
  }

  static Future<void> deleteStudent(String id) async {
    try {
      final response = await http.delete(Uri.parse('$baseUrl/$id'));
      if (response.statusCode != 200) {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to delete student');
      }
    } catch (e) {
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> updateStudentDocuments(
      String id, Map<String, String?> documents) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/$id/documents'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'documents': documents}),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      final errorMsg = json.decode(response.body)['message'] ??
          'Failed to update documents';
      throw Exception(errorMsg);
    }
  }

  /// Batch-update the semester for a whole batch of students.
  /// Pass at least one of [sessionYear], [selectedProgram], [selectedBranch].
  static Future<Map<String, dynamic>> batchUpdateSemester({
    String? sessionYear,
    String? selectedProgram,
    String? selectedBranch,
    required int newSemester,
  }) async {
    final body = <String, dynamic>{'newSemester': newSemester};
    if (sessionYear != null && sessionYear.isNotEmpty) {
      body['sessionYear'] = sessionYear;
    }
    if (selectedProgram != null && selectedProgram.isNotEmpty) {
      body['selectedProgram'] = selectedProgram;
    }
    if (selectedBranch != null && selectedBranch.isNotEmpty) {
      body['selectedBranch'] = selectedBranch;
    }

    final response = await http.patch(
      Uri.parse('$baseUrl/batch/semester'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode(body),
    );
    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      final err = json.decode(response.body);
      throw Exception(err['message'] ?? 'Failed to batch update semester');
    }
  }
}
