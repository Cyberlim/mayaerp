import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:image_picker/image_picker.dart';
import 'cloudinary_service.dart';

class ApplicationService {
  static String get baseUrl => '${dotenv.get('BACKEND_URL', fallback: 'https://mayaerpbackend.onrender.com/api')}/applications';

  /// Delegates image upload to the centralized CloudinaryService.
  static Future<String?> uploadToCloudinary(XFile? file) async {
    return CloudinaryService.uploadImage(file);
  }

  static Future<List<dynamic>> getAllApplications() async {
    try {
      final response = await http.get(Uri.parse(baseUrl));
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('Failed to fetch applications');
      }
    } catch (e) {
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> submitApplication(Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse(baseUrl),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(data),
      );

      if (response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to submit application');
      }
    } catch (e) {
      rethrow;
    }
  }

  static Future<Map<String, dynamic>> updateApplication(String id, Map<String, dynamic> data) async {
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/$id'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(data),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to update application');
      }
    } catch (e) {
      rethrow;
    }
  }

  static Future<void> deleteApplication(String id) async {
    try {
      final response = await http.delete(Uri.parse('$baseUrl/$id'));
      if (response.statusCode != 200) {
        final error = jsonDecode(response.body);
        throw Exception(error['message'] ?? 'Failed to delete application');
      }
    } catch (e) {
      rethrow;
    }
  }
}
