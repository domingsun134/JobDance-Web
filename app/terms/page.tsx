"use client";

import Link from "next/link";
import Logo from "@/components/Logo";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4">
            <Logo />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-gray-400 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 sm:p-8 space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing and using JobDance.ai ("the Service"), a product of ClanMe Pte Ltd ("we," "us," or "our"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p className="leading-relaxed">
              JobDance.ai is an AI-powered interview practice platform operated by ClanMe Pte Ltd that helps users improve their interview skills through simulated interviews. The Service uses artificial intelligence to conduct practice interviews and provide feedback.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts</h2>
            <p className="leading-relaxed mb-2">
              To use certain features of the Service, you must register for an account. You agree to:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and update your account information to keep it accurate</li>
              <li>Maintain the security of your password and identification</li>
              <li>Accept all responsibility for activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Acceptable Use</h2>
            <p className="leading-relaxed mb-2">You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Violate or infringe upon the rights of others</li>
              <li>Transmit any harmful, offensive, or inappropriate content</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Interfere with or disrupt the Service or servers connected to the Service</li>
              <li>Use automated systems to access the Service without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. AI-Generated Content</h2>
            <p className="leading-relaxed">
              The Service uses artificial intelligence to generate interview questions and feedback. While we strive for accuracy, AI-generated content may contain errors or inaccuracies. The Service is provided for practice purposes only and should not be considered as professional career advice.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Intellectual Property</h2>
            <p className="leading-relaxed">
              The Service and its original content, features, and functionality are owned by ClanMe Pte Ltd and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. User Content</h2>
            <p className="leading-relaxed">
              You retain ownership of any content you submit, post, or display on or through the Service. By submitting content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and distribute such content solely for the purpose of providing and improving the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Privacy</h2>
            <p className="leading-relaxed">
              Your use of the Service is also governed by our Privacy Policy. Please review our Privacy Policy to understand our practices regarding the collection and use of your information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Service Availability</h2>
            <p className="leading-relaxed">
              We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuation of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Limitation of Liability</h2>
            <p className="leading-relaxed">
              To the maximum extent permitted by law, ClanMe Pte Ltd shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Termination</h2>
            <p className="leading-relaxed">
              We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach the Terms. Upon termination, your right to use the Service will cease immediately.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Changes to Terms</h2>
            <p className="leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes by updating the "Last updated" date. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Contact Information</h2>
            <p className="leading-relaxed">
              If you have any questions about these Terms of Service, please contact us through the Service or via the contact information provided in our Privacy Policy.
            </p>
          </section>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link
            href="/auth/login"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 underline"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

