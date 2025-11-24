"use client";

import Link from "next/link";
import Logo from "@/components/Logo";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4">
            <Logo />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-gray-400 text-sm">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 sm:p-8 space-y-6 text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Introduction</h2>
            <p className="leading-relaxed">
              ClanMe Pte Ltd ("we," "our," or "us") operates JobDance.ai and is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI interview practice platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            
            <h3 className="text-lg font-medium text-white mt-4 mb-2">2.1 Information You Provide</h3>
            <p className="leading-relaxed mb-2">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Account registration information (email address, password)</li>
              <li>Profile information (work experience, education, skills, languages, availability, expected salary)</li>
              <li>Interview responses and recordings</li>
              <li>Feedback and communications with us</li>
            </ul>

            <h3 className="text-lg font-medium text-white mt-4 mb-2">2.2 Automatically Collected Information</h3>
            <p className="leading-relaxed mb-2">When you use our Service, we may automatically collect:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Device information (device type, operating system, browser type)</li>
              <li>Usage data (pages visited, features used, time spent)</li>
              <li>IP address and location data</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <p className="leading-relaxed mb-2">We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Provide, maintain, and improve our Service</li>
              <li>Personalize your interview practice experience</li>
              <li>Generate AI-powered interview questions and feedback</li>
              <li>Process your account registration and manage your account</li>
              <li>Send you service-related communications</li>
              <li>Monitor and analyze usage patterns and trends</li>
              <li>Detect, prevent, and address technical issues</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. AI and Third-Party Services</h2>
            <p className="leading-relaxed">
              Our Service uses artificial intelligence and third-party services (such as cloud storage and AI processing services) to provide interview practice functionality. When you use these features, your data may be processed by these third-party services in accordance with their privacy policies. We take steps to ensure that these services handle your data securely and in compliance with applicable privacy laws.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Data Storage and Security</h2>
            <p className="leading-relaxed">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Data Retention</h2>
            <p className="leading-relaxed">
              We retain your personal information for as long as necessary to provide you with our Service and fulfill the purposes described in this Privacy Policy. We may retain certain information for longer periods as required by law or for legitimate business purposes, such as maintaining account records or resolving disputes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Sharing Your Information</h2>
            <p className="leading-relaxed mb-2">We do not sell your personal information. We may share your information in the following circumstances:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>With service providers who assist us in operating our Service (under strict confidentiality agreements)</li>
              <li>When required by law or to respond to legal process</li>
              <li>To protect our rights, property, or safety, or that of our users</li>
              <li>In connection with a business transfer (merger, acquisition, etc.)</li>
              <li>With your consent or at your direction</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Your Rights and Choices</h2>
            <p className="leading-relaxed mb-2">Depending on your location, you may have certain rights regarding your personal information, including:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>The right to access your personal information</li>
              <li>The right to correct inaccurate information</li>
              <li>The right to delete your personal information</li>
              <li>The right to restrict or object to certain processing</li>
              <li>The right to data portability</li>
              <li>The right to withdraw consent</li>
            </ul>
            <p className="leading-relaxed mt-3">
              To exercise these rights, please contact us through the Service or using the contact information provided below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Cookies and Tracking Technologies</h2>
            <p className="leading-relaxed">
              We use cookies and similar tracking technologies to track activity on our Service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Children's Privacy</h2>
            <p className="leading-relaxed">
              Our Service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can delete such information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. International Data Transfers</h2>
            <p className="leading-relaxed">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. By using our Service, you consent to the transfer of your information to these countries.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Changes to This Privacy Policy</h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us through the Service or via the contact information provided in our Terms of Service.
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

