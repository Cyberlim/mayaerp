import 'dart:convert';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class LabService {
  static String get _base =>
      dotenv.get('BACKEND_URL', fallback: 'https://mayaerpbackend.onrender.com/api');

  static Future<String?> _token() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('token');
  }

  static Map<String, String> _headers(String token) => {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      };

  // ─────────────────────────────────────────────
  // FACULTY
  // ─────────────────────────────────────────────

  /// Fetch all faculty/staff users for dropdown population
  static Future<List<Map<String, dynamic>>> fetchAllFaculty() async {
    try {
      final token = await _token();
      final headers = <String, String>{};
      if (token != null) headers['Authorization'] = 'Bearer $token';
      final res = await http.get(
        Uri.parse('$_base/faculty/all'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        return data.cast<Map<String, dynamic>>();
      }
      // Return empty list instead of throwing — dropdown will show warning
      return [];
    } catch (_) {
      return []; // Network error — silently return empty
    }
  }

  // ─────────────────────────────────────────────
  // LABS CRUD
  // ─────────────────────────────────────────────

  static Future<List<Map<String, dynamic>>> fetchLabs() async {
    try {
      final token = await _token();
      final headers = <String, String>{};
      if (token != null) headers['Authorization'] = 'Bearer $token';
      final res = await http.get(
        Uri.parse('$_base/labs'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        return data.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<Map<String, dynamic>> createLab({
    required String labName,
    required String roomNumber,
    required int capacity,
    required String labType,
    required String labInchargeId, // Only the ObjectId is sent
    String? description,
  }) async {
    final token = await _token();
    final res = await http.post(
      Uri.parse('$_base/labs'),
      headers: token != null ? _headers(token) : {'Content-Type': 'application/json'},
      body: jsonEncode({
        'labName': labName,
        'roomNumber': roomNumber,
        'capacity': capacity,
        'labType': labType,
        'labIncharge': labInchargeId, // stored as ObjectId ref in DB
        if (description != null && description.isNotEmpty) 'description': description,
      }),
    );
    if (res.statusCode == 201) return jsonDecode(res.body)['lab'];
    throw Exception(jsonDecode(res.body)['message'] ?? 'Failed to create lab');
  }

  static Future<Map<String, dynamic>> updateLab({
    required String labId,
    required Map<String, dynamic> fields,
  }) async {
    final token = await _token();
    final res = await http.put(
      Uri.parse('$_base/labs/$labId'),
      headers: token != null ? _headers(token) : {'Content-Type': 'application/json'},
      body: jsonEncode(fields),
    );
    if (res.statusCode == 200) return jsonDecode(res.body)['lab'];
    throw Exception(jsonDecode(res.body)['message'] ?? 'Failed to update lab');
  }

  static Future<void> deleteLab(String labId) async {
    final token = await _token();
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (token != null) headers['Authorization'] = 'Bearer $token';
    final res = await http.delete(
      Uri.parse('$_base/labs/$labId'),
      headers: headers,
    );
    if (res.statusCode != 200) {
      throw Exception(jsonDecode(res.body)['message'] ?? 'Failed to delete lab');
    }
  }

  // ─────────────────────────────────────────────
  // QUICK STAFF CREATION (from Add Lab inline)
  // ─────────────────────────────────────────────

  /// Create a Staff/Faculty user directly from the Add Lab dialog.
  /// Returns the created user map including _id.
  static Future<Map<String, dynamic>> createStaffUser({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    required String department,
    String role = 'Staff',
  }) async {
    final token = await _token();
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (token != null) headers['Authorization'] = 'Bearer $token';
    final res = await http.post(
      Uri.parse('$_base/users'),
      headers: headers,
      body: jsonEncode({
        'firstName': firstName,
        'lastName': lastName,
        'email': email,
        'password': password,
        'role': role,
        'department': department,
        'status': 'Active',
      }),
    );
    if (res.statusCode == 201) return jsonDecode(res.body);
    final errBody = jsonDecode(res.body);
    throw Exception(errBody['message'] ?? 'Failed to create staff');
  }

  // ─────────────────────────────────────────────
  // INVENTORY
  // ─────────────────────────────────────────────

  static Future<List<Map<String, dynamic>>> fetchInventory({String? labId, String? category, String? status, String? search}) async {
    try {
      final token = await _token();
      final headers = <String, String>{};
      if (token != null) headers['Authorization'] = 'Bearer $token';
      
      var queryParams = <String>[];
      if (labId != null) queryParams.add('lab=$labId');
      if (category != null) queryParams.add('category=$category');
      if (status != null) queryParams.add('condition=$status');
      if (search != null) queryParams.add('search=$search');
      
      String url = '$_base/lab-inventory';
      if (queryParams.isNotEmpty) url += '?${queryParams.join('&')}';
      
      final res = await http.get(
        Uri.parse(url),
        headers: headers,
      ).timeout(const Duration(seconds: 10));
      
      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        return data.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (_) {
      return [];
    }
  }

  static Future<Map<String, dynamic>> createInventoryItem(Map<String, dynamic> data) async {
    final token = await _token();
    final res = await http.post(
      Uri.parse('$_base/lab-inventory'),
      headers: token != null ? _headers(token) : {'Content-Type': 'application/json'},
      body: jsonEncode(data),
    );
    if (res.statusCode == 201) return jsonDecode(res.body)['item'];
    throw Exception(jsonDecode(res.body)['message'] ?? 'Failed to add item');
  }

  static Future<Map<String, dynamic>> updateInventoryItem(String id, Map<String, dynamic> data) async {
    final token = await _token();
    final res = await http.put(
      Uri.parse('$_base/lab-inventory/$id'),
      headers: token != null ? _headers(token) : {'Content-Type': 'application/json'},
      body: jsonEncode(data),
    );
    if (res.statusCode == 200) return jsonDecode(res.body)['item'];
    throw Exception(jsonDecode(res.body)['message'] ?? 'Failed to update item');
  }

  static Future<void> deleteInventoryItem(String id) async {
    final token = await _token();
    final headers = <String, String>{'Content-Type': 'application/json'};
    if (token != null) headers['Authorization'] = 'Bearer $token';
    final res = await http.delete(
      Uri.parse('$_base/lab-inventory/$id'),
      headers: headers,
    );
    if (res.statusCode != 200) {
      throw Exception(jsonDecode(res.body)['message'] ?? 'Failed to delete item');
    }
  }

  // ─────────────────────────────────────────────
  // ISSUES & ACTIVITIES
  // ─────────────────────────────────────────────

  static Future<List<Map<String, dynamic>>> fetchRecentActivities() async {
    try {
      final token = await _token();
      final headers = <String, String>{};
      if (token != null) headers['Authorization'] = 'Bearer $token';
      
      final res = await http.get(
        Uri.parse('$_base/lab-issues'),
        headers: headers,
      ).timeout(const Duration(seconds: 10));
      
      if (res.statusCode == 200) {
        final List data = jsonDecode(res.body);
        return data.cast<Map<String, dynamic>>();
      }
      return [];
    } catch (_) {
      return [];
    }
  }
}
