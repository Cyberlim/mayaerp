import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';

/// Centralized Cloudinary image upload service.
/// Reads cloud name and upload preset from .env file.
/// Works correctly on Flutter Web (using bytes, not file path).
class CloudinaryService {
  static String get _cloudName =>
      dotenv.get('CLOUDINARY_CLOUD_NAME', fallback: 'dtaruu90e');
  static String get _uploadPreset =>
      dotenv.get('CLOUDINARY_UPLOAD_PRESET', fallback: 'Portfolio');

  static String get _uploadUrl =>
      'https://api.cloudinary.com/v1_1/$_cloudName/image/upload';

  /// Uploads an [XFile] to Cloudinary and returns the secure URL.
  /// Returns null if upload fails.
  static Future<String?> uploadImage(XFile? file) async {
    if (file == null) return null;
    try {
      final bytes = await file.readAsBytes();
      final request = http.MultipartRequest('POST', Uri.parse(_uploadUrl))
        ..fields['upload_preset'] = _uploadPreset
        ..files.add(
          http.MultipartFile.fromBytes(
            'file',
            bytes,
            filename: file.name,
            contentType: MediaType('image', _getContentType(file.name)),
          ),
        );

      final response = await request.send();
      final body = await response.stream.bytesToString();

      if (response.statusCode == 200) {
        final json = jsonDecode(body);
        return json['secure_url'] as String?;
      } else {
        final json = jsonDecode(body);
        throw Exception(json['error']?['message'] ?? 'Cloudinary upload failed (${response.statusCode})');
      }
    } catch (e) {
      throw Exception('Cloudinary upload error: $e');
    }
  }

  /// Reads bytes from an [XFile] for local preview on Flutter Web.
  static Future<Uint8List> getImageBytes(XFile file) async {
    return await file.readAsBytes();
  }

  static String _getContentType(String filename) {
    final ext = filename.split('.').last.toLowerCase();
    switch (ext) {
      case 'png': return 'png';
      case 'gif': return 'gif';
      case 'webp': return 'webp';
      default: return 'jpeg';
    }
  }
}
