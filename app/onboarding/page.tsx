"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { updateUserProfile, getUserProfile, getCurrentUser, type UserProfile, type WorkExperience, type Education, type Language } from "@/lib/auth";
import BottomNav from "@/components/BottomNav";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
  const [educations, setEducations] = useState<Education[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState("");
  const [languages, setLanguages] = useState<Language[]>([]);
  const [availability, setAvailability] = useState({ startDate: "", duration: "" });
  const [expectedSalary, setExpectedSalary] = useState<{ amount: string; currency: string; period: "hourly" | "daily" | "weekly" | "monthly" | "yearly" }>({ amount: "", currency: "USD", period: "monthly" });

  // Load existing profile data
  useEffect(() => {
    async function loadProfileData() {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }

        const existingProfile = await getUserProfile();
        if (existingProfile) {
          // Convert dates from YYYY-MM-DD to YYYY-MM for month inputs
          const formatDateForInput = (dateStr: string) => {
            if (!dateStr) return "";
            // If in YYYY-MM-DD format, convert to YYYY-MM
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
              return dateStr.substring(0, 7); // Get YYYY-MM
            }
            return dateStr;
          };

          // Load work experiences
          if (existingProfile.workExperience.length > 0) {
            setWorkExperiences(
              existingProfile.workExperience.map(exp => ({
                ...exp,
                startDate: formatDateForInput(exp.startDate),
                endDate: formatDateForInput(exp.endDate),
              }))
            );
          }

          // Load education
          if (existingProfile.education.length > 0) {
            setEducations(
              existingProfile.education.map(edu => ({
                ...edu,
                startDate: formatDateForInput(edu.startDate),
                endDate: formatDateForInput(edu.endDate),
              }))
            );
          }

          // Load skills
          if (existingProfile.skills.length > 0) {
            setSkills(existingProfile.skills);
          }

          // Load languages
          if (existingProfile.languages.length > 0) {
            setLanguages(existingProfile.languages);
          }

          // Load availability
          if (existingProfile.availability.startDate || existingProfile.availability.duration) {
            setAvailability({
              startDate: existingProfile.availability.startDate || "",
              duration: existingProfile.availability.duration || "",
            });
          }

          // Load expected salary
          if (existingProfile.expectedSalary.amount > 0) {
            setExpectedSalary({
              amount: existingProfile.expectedSalary.amount.toString(),
              currency: existingProfile.expectedSalary.currency,
              period: existingProfile.expectedSalary.period,
            });
          }
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setLoadingData(false);
      }
    }
    loadProfileData();
  }, [router]);

  if (loadingData) {
    return (
      <div className="min-h-screen px-4 py-8 pb-20 bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalSteps = 6;

  const handleComplete = async () => {
    setLoading(true);
    try {
      const profile: UserProfile = {
        personalInfo: {
          fullName: "",
          email: "",
          phone: "",
          location: "",
          linkedin: "",
          portfolio: "",
        },
        workExperience: workExperiences,
        education: educations,
        skills,
        languages,
        availability: {
          startDate: availability.startDate,
          duration: availability.duration,
        },
        expectedSalary: {
          amount: parseFloat(expectedSalary.amount) || 0,
          currency: expectedSalary.currency,
          period: expectedSalary.period,
        },
      };

      await updateUserProfile(profile);
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      alert(error.message || "Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const addWorkExperience = () => {
    setWorkExperiences([
      ...workExperiences,
      {
        id: Date.now().toString(),
        company: "",
        position: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
      },
    ]);
  };

  const updateWorkExperience = (id: string, field: keyof WorkExperience, value: any) => {
    setWorkExperiences(
      workExperiences.map((exp) => {
        if (exp.id === id) {
          const updated = { ...exp, [field]: value };
          // If setting current to true, clear endDate
          if (field === 'current' && value === true) {
            updated.endDate = '';
          }
          return updated;
        }
        return exp;
      })
    );
  };

  const removeWorkExperience = (id: string) => {
    setWorkExperiences(workExperiences.filter((exp) => exp.id !== id));
  };

  const addEducation = () => {
    setEducations([
      ...educations,
      {
        id: Date.now().toString(),
        institution: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        current: false,
      },
    ]);
  };

  const updateEducation = (id: string, field: keyof Education, value: any) => {
    setEducations(
      educations.map((edu) => {
        if (edu.id === id) {
          const updated = { ...edu, [field]: value };
          // If setting current to true, clear endDate
          if (field === 'current' && value === true) {
            updated.endDate = '';
          }
          return updated;
        }
        return edu;
      })
    );
  };

  const removeEducation = (id: string) => {
    setEducations(educations.filter((edu) => edu.id !== id));
  };

  const addSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill("");
    }
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const addLanguage = () => {
    setLanguages([...languages, { name: "", proficiency: "intermediate" }]);
  };

  const updateLanguage = (index: number, field: keyof Language, value: any) => {
    const updated = [...languages];
    updated[index] = { ...updated[index], [field]: value };
    setLanguages(updated);
  };

  const removeLanguage = (index: number) => {
    setLanguages(languages.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen px-4 py-8 pb-20 bg-gray-900">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-white">
              Step {step} of {totalSteps}
            </h2>
            <span className="text-sm text-gray-400">{Math.round((step / totalSteps) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          {/* Step 1: Work Experience */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Work Experience</h1>
                <p className="text-gray-600">Tell us about your professional experience</p>
              </div>

              {workExperiences.map((exp) => (
                <div key={exp.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Experience {workExperiences.indexOf(exp) + 1}</h3>
                    <button
                      onClick={() => removeWorkExperience(exp.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => updateWorkExperience(exp.id, "company", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base text-gray-900 placeholder-gray-400"
                        placeholder="Company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => updateWorkExperience(exp.id, "position", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base text-gray-900 placeholder-gray-400"
                        placeholder="Job title"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="month"
                        value={exp.startDate}
                        onChange={(e) => updateWorkExperience(exp.id, "startDate", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base text-gray-900"
                      />
                    </div>
                    <div>
                      {!exp.current && (
                        <div className="mb-2 animate-fade-in">
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                          <input
                            type="month"
                            value={exp.endDate}
                            onChange={(e) => updateWorkExperience(exp.id, "endDate", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base text-gray-900"
                          />
                        </div>
                      )}
                      <label className="flex items-center cursor-pointer mt-2">
                        <input
                          type="checkbox"
                          checked={exp.current === true}
                          onChange={(e) => {
                            const newValue = e.target.checked;
                            updateWorkExperience(exp.id, "current", newValue);
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Current position</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={exp.description}
                      onChange={(e) => updateWorkExperience(exp.id, "description", e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base text-gray-900 placeholder-gray-400"
                      placeholder="Describe your responsibilities and achievements"
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={addWorkExperience}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors text-base"
              >
                + Add Work Experience
              </button>
            </div>
          )}

          {/* Step 2: Education */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Education</h1>
                <p className="text-gray-600">Share your educational background</p>
              </div>

              {educations.map((edu) => (
                <div key={edu.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Education {educations.indexOf(edu) + 1}</h3>
                    <button
                      onClick={() => removeEducation(edu.id)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Institution</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => updateEducation(edu.id, "institution", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base text-gray-900 placeholder-gray-400"
                      placeholder="School or university name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Degree</label>
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => updateEducation(edu.id, "degree", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base text-gray-900 placeholder-gray-400"
                        placeholder="e.g., Bachelor's, Master's"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Field of Study</label>
                      <input
                        type="text"
                        value={edu.field}
                        onChange={(e) => updateEducation(edu.id, "field", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base text-gray-900 placeholder-gray-400"
                        placeholder="e.g., Computer Science"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="month"
                        value={edu.startDate}
                        onChange={(e) => updateEducation(edu.id, "startDate", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base text-gray-900"
                      />
                    </div>
                    <div>
                      {!edu.current && (
                        <div className="mb-2 animate-fade-in">
                          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                          <input
                            type="month"
                            value={edu.endDate}
                            onChange={(e) => updateEducation(edu.id, "endDate", e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base text-gray-900"
                          />
                        </div>
                      )}
                      <label className="flex items-center cursor-pointer mt-2">
                        <input
                          type="checkbox"
                          checked={edu.current === true}
                          onChange={(e) => {
                            const newValue = e.target.checked;
                            updateEducation(edu.id, "current", newValue);
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Currently studying</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addEducation}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors text-base"
              >
                + Add Education
              </button>
            </div>
          )}

          {/* Step 3: Skills */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Skills</h1>
                <p className="text-gray-600">List your professional skills</p>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base text-gray-900 placeholder-gray-400"
                  placeholder="Enter a skill"
                />
                <button
                  onClick={addSkill}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-base"
                >
                  Add
                </button>
              </div>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-800 rounded-full text-sm"
                    >
                      {skill}
                      <button
                        onClick={() => removeSkill(skill)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Languages */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Languages</h1>
                <p className="text-gray-600">What languages do you speak?</p>
              </div>

              {languages.map((lang, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-gray-800">Language {index + 1}</h3>
                    <button
                      onClick={() => removeLanguage(index)}
                      className="text-red-600 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                      <input
                        type="text"
                        value={lang.name}
                        onChange={(e) => updateLanguage(index, "name", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base text-gray-900 placeholder-gray-400"
                        placeholder="e.g., English, Spanish"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency</label>
                      <select
                        value={lang.proficiency}
                        onChange={(e) => updateLanguage(index, "proficiency", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base text-gray-900"
                      >
                        <option value="basic">Basic</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                        <option value="native">Native</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={addLanguage}
                className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 transition-colors text-base"
              >
                + Add Language
              </button>
            </div>
          )}

          {/* Step 5: Availability */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Availability</h1>
                <p className="text-gray-600">When are you available to start?</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={availability.startDate}
                  onChange={(e) => setAvailability({ ...availability, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base text-gray-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                <select
                  value={availability.duration}
                  onChange={(e) => setAvailability({ ...availability, duration: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base text-gray-900"
                >
                  <option value="">Select duration</option>
                  <option value="1 week">1 week</option>
                  <option value="2 weeks">2 weeks</option>
                  <option value="1 month">1 month</option>
                  <option value="2 months">2 months</option>
                  <option value="3 months">3 months</option>
                  <option value="6 months">6 months</option>
                  <option value="1 year">1 year</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 6: Expected Salary */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Expected Salary</h1>
                <p className="text-gray-600">What are your salary expectations?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                  <input
                    type="number"
                    value={expectedSalary.amount}
                    onChange={(e) => setExpectedSalary({ ...expectedSalary, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base text-gray-900 placeholder-gray-500"
                    placeholder="0"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={expectedSalary.currency}
                    onChange={(e) => setExpectedSalary({ ...expectedSalary, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base text-gray-900"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                    <option value="CNY">CNY</option>
                    <option value="JPY">JPY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <select
                    value={expectedSalary.period}
                    onChange={(e) => setExpectedSalary({ ...expectedSalary, period: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-base text-gray-900"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between gap-4">
            <button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
            >
              Previous
            </button>
            {step < totalSteps ? (
              <button
                onClick={() => setStep(Math.min(totalSteps, step + 1))}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-base"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={loading}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {loading ? "Saving..." : "Complete"}
              </button>
            )}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

