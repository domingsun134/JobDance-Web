import React from 'react';
import { UserProfile } from '@/lib/auth';

interface ResumePreviewProps {
    profile: UserProfile | null;
}

export default function ResumePreview({ profile }: ResumePreviewProps) {
    if (!profile) {
        return (
            <div className="h-full flex items-center justify-center text-gray-400">
                <p>Loading resume preview...</p>
            </div>
        );
    }

    return (
        <div className="bg-white text-gray-900 p-8 shadow-lg min-h-full w-full max-w-[210mm] mx-auto overflow-y-auto" id="resume-preview">
            {/* Header */}
            <div className="border-b-2 border-gray-800 pb-4 mb-6">
                <h1 className="text-3xl font-bold uppercase tracking-wide mb-2">
                    {profile.personalInfo?.fullName || 'Your Name'}
                </h1>
                <div className="text-sm text-gray-600 flex flex-wrap gap-4">
                    <span>{profile.personalInfo?.email || 'email@example.com'}</span>
                    {profile.personalInfo?.phone && (
                        <>
                            <span>•</span>
                            <span>{profile.personalInfo.phone}</span>
                        </>
                    )}
                    {profile.personalInfo?.location && (
                        <>
                            <span>•</span>
                            <span>{profile.personalInfo.location}</span>
                        </>
                    )}
                    {profile.personalInfo?.linkedin && (
                        <>
                            <span>•</span>
                            <a href={profile.personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">LinkedIn</a>
                        </>
                    )}
                    {profile.personalInfo?.portfolio && (
                        <>
                            <span>•</span>
                            <a href={profile.personalInfo.portfolio} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Portfolio</a>
                        </>
                    )}
                </div>
            </div>

            {/* Summary - Not in UserProfile yet, maybe add later */}

            {/* Experience */}
            {profile.workExperience && profile.workExperience.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-bold uppercase border-b border-gray-300 mb-3 pb-1">Experience</h2>
                    <div className="space-y-4">
                        {profile.workExperience.map((exp, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-md">{exp.position}</h3>
                                    <span className="text-sm text-gray-600">
                                        {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                                    </span>
                                </div>
                                <div className="text-sm font-semibold text-gray-700 mb-1">{exp.company}</div>
                                <p className="text-sm text-gray-600 whitespace-pre-line">{exp.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-bold uppercase border-b border-gray-300 mb-3 pb-1">Education</h2>
                    <div className="space-y-3">
                        {profile.education.map((edu, index) => (
                            <div key={index}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-md">{edu.institution}</h3>
                                    <span className="text-sm text-gray-600">
                                        {edu.startDate} – {edu.current ? 'Present' : edu.endDate}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-700">
                                    {edu.degree} in {edu.field}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-bold uppercase border-b border-gray-300 mb-3 pb-1">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                            <span key={index} className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-700">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-bold uppercase border-b border-gray-300 mb-3 pb-1">Languages</h2>
                    <div className="grid grid-cols-2 gap-2">
                        {profile.languages.map((lang, index) => (
                            <div key={index} className="text-sm">
                                <span className="font-semibold">{lang.name}</span>: <span className="text-gray-600 capitalize">{lang.proficiency}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
