import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:url_launcher/url_launcher.dart';

class StudentDetailScreen extends StatelessWidget {
  final dynamic student;

  const StudentDetailScreen({super.key, required this.student});

  Future<void> _makeCall(String number) async {
    final Uri launchUri = Uri(scheme: 'tel', path: number);
    if (await canLaunchUrl(launchUri)) {
      await launchUrl(launchUri);
    }
  }

  Future<void> _sendEmail(String email) async {
    final Uri launchUri = Uri(scheme: 'mailto', path: email);
    if (await canLaunchUrl(launchUri)) {
      await launchUrl(launchUri);
    }
  }

  @override
  Widget build(BuildContext context) {
    bool isMobile = MediaQuery.of(context).size.width < 800;
    final String fullName = "${student['firstName']} ${student['lastName']}";
    
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text("Student Details", style: TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF1E293B)),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(isMobile ? 16 : 32),
        child: Column(
          children: [
            _buildProfileHeader(isMobile, fullName),
            const SizedBox(height: 32),
            if (isMobile) ...[
              _buildInfoSection("Personal Details", _personalInfo()),
              const SizedBox(height: 24),
              _buildInfoSection("Academic Background", _academicInfo()),
              const SizedBox(height: 24),
              _buildInfoSection("Program Details", _programInfo()),
            ] else 
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    flex: 1,
                    child: Column(
                      children: [
                        _buildInfoSection("Personal Details", _personalInfo()),
                        const SizedBox(height: 24),
                        _buildInfoSection("Program Details", _programInfo()),
                      ],
                    ),
                  ),
                  const SizedBox(width: 32),
                  Expanded(
                    flex: 1,
                    child: Column(
                      children: [
                        _buildInfoSection("Academic Background", _academicInfo()),
                        const SizedBox(height: 24),
                        _buildDocumentsSection(),
                      ],
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader(bool isMobile, String name) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(32),
        boxShadow: [BoxShadow(color: const Color(0xFF10B981).withValues(alpha: 0.05), blurRadius: 30, offset: const Offset(0, 15))],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: isMobile ? 40 : 60,
            backgroundColor: const Color(0xFF10B981).withValues(alpha: 0.1),
            backgroundImage: student['applicantPhoto'] != null ? NetworkImage(student['applicantPhoto']) : null,
            child: student['applicantPhoto'] == null ? Icon(Icons.person_rounded, size: isMobile ? 40 : 60, color: const Color(0xFF10B981)) : null,
          ),
          const SizedBox(width: 24),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(name, style: TextStyle(fontSize: isMobile ? 24 : 32, fontWeight: FontWeight.w900, color: const Color(0xFF1E293B), letterSpacing: -1)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(color: const Color(0xFF10B981).withValues(alpha: 0.1), borderRadius: BorderRadius.circular(100)),
                      child: Text(student['studentStatus'] ?? "Active", style: const TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 12)),
                    ),
                    const SizedBox(width: 12),
                    Text("ID: ${student['studentId'] ?? student['rollNumber'] ?? 'N/A'}", style: TextStyle(color: Colors.grey.shade500, fontWeight: FontWeight.w600)),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    _actionBtn(Icons.phone_rounded, "Call", Colors.green, () => _makeCall(student['mobile'] ?? '')),
                    const SizedBox(width: 12),
                    _actionBtn(Icons.email_rounded, "Email", Colors.blue, () => _sendEmail(student['email'] ?? '')),
                  ],
                ),
              ],
            ),
          ),
        ],
      ).animate().fadeIn().slideY(begin: 0.1),
    );
  }

  Widget _actionBtn(IconData icon, String label, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
        child: Row(
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: 8),
            Text(label, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 13)),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoSection(String title, List<Widget> children) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade100)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
          const SizedBox(height: 20),
          ...children,
        ],
      ),
    ).animate().fadeIn(delay: 200.ms);
  }

  List<Widget> _personalInfo() {
    return [
      _infoRow("Email Address", student['email'] ?? 'N/A'),
      _infoRow("Mobile Number", student['mobile'] ?? 'N/A'),
      _infoRow("Date of Birth", student['dob'] ?? 'N/A'),
      _infoRow("Gender", student['gender'] ?? 'N/A'),
      _infoRow("Category", student['category'] ?? 'N/A'),
      _infoRow("Address", "${student['address'] ?? ''}, ${student['city'] ?? ''}, ${student['state'] ?? ''} - ${student['pinCode'] ?? ''}"),
    ];
  }

  List<Widget> _academicInfo() {
    return [
      _infoRow("Qualification", student['highestQualification'] ?? 'N/A'),
      _infoRow("Institution", student['institutionName'] ?? 'N/A'),
      _infoRow("Board/Univ", student['boardUniversity'] ?? 'N/A'),
      _infoRow("Percentage/CGPA", "${student['percentageCGPA'] ?? 'N/A'} %"),
      _infoRow("Year of Passing", student['yearOfPassing'] ?? 'N/A'),
      if (student['entranceScore'] != null)
        _infoRow("Entrance Score", student['entranceScore']),
    ];
  }

  List<Widget> _programInfo() {
    return [
      _infoRow("Program", student['selectedProgram'] ?? 'N/A'),
      _infoRow("Branch", student['selectedBranch'] ?? 'General'),
      _infoRow("Session", student['sessionYear'] ?? 'N/A'),
      _infoRow("Registration Date", student['createdAt'] != null ? student['createdAt'].toString().split('T')[0] : 'N/A'),
    ];
  }

  Widget _buildDocumentsSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade100)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("Submitted Documents", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          _docItem("10th Marksheet", student['documents']?['marksheet10'] != null),
          _docItem("12th Marksheet", student['documents']?['marksheet12'] != null),
          _docItem("Aadhar Card", student['documents']?['aadharCard'] != null),
          _docItem("Transfer Certificate", student['documents']?['transferCertificate'] != null),
        ],
      ),
    );
  }

  Widget _docItem(String title, bool isUploaded) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(isUploaded ? Icons.verified_rounded : Icons.pending_rounded, color: isUploaded ? Colors.green : Colors.amber, size: 20),
          const SizedBox(width: 12),
          Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
          const Spacer(),
          if (isUploaded)
             const Icon(Icons.visibility_rounded, color: Colors.grey, size: 18),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: TextStyle(color: Colors.grey.shade500, fontSize: 12, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(value, style: const TextStyle(color: Color(0xFF1E293B), fontSize: 14, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
