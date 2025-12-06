import React from 'react';
import { UserProfile } from '@/lib/auth';

export type TemplateType = 'modern' | 'professional' | 'creative';

interface ResumePreviewProps {
    profile: UserProfile | null;
    template?: TemplateType;
}

// Helper to format dates
const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // If YYYY-MM format
    if (dateString.match(/^\d{4}-\d{2}$/)) {
        const [year, month] = dateString.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    return dateString;
};

// Helper to render bullet points
const renderDescription = (description: string) => {
    return description.split('\n').map((line, i) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return null;
        const content = trimmedLine.replace(/^[-•*]\s*/, '');
        return (
            <div key={i} className="flex items-start mb-1">
                <span className="mr-2">•</span>
                <span>{content}</span>
            </div>
        );
    });
};

const ModernTemplate = ({ profile }: { profile: UserProfile }) => (
    <div className="p-8 md:p-12 print:pt-8 print:pb-0 font-sans text-gray-800">
        {/* Header */}
        <div className="pb-6 mb-8 break-inside-avoid">
            <h1 className="text-4xl font-bold uppercase tracking-tight mb-3 text-gray-900 resume-block">
                {profile.personalInfo?.fullName || 'Your Name'}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 font-medium">
                {profile.personalInfo?.email && <span>{profile.personalInfo.email}</span>}
                {profile.personalInfo?.phone && (
                    <>
                        <span className="text-gray-300">|</span>
                        <span>{profile.personalInfo.phone}</span>
                    </>
                )}
                {profile.personalInfo?.location && (
                    <>
                        <span className="text-gray-300">|</span>
                        <span>{profile.personalInfo.location}</span>
                    </>
                )}
                {profile.personalInfo?.linkedin && (
                    <>
                        <span className="text-gray-300">|</span>
                        <a href={profile.personalInfo.linkedin} className="text-blue-600 hover:underline">LinkedIn</a>
                    </>
                )}
                {profile.personalInfo?.portfolio && (
                    <>
                        <span className="text-gray-300">|</span>
                        <a href={profile.personalInfo.portfolio} className="text-blue-600 hover:underline">Portfolio</a>
                    </>
                )}
            </div>
        </div>

        {/* Experience */}
        {profile.workExperience && profile.workExperience.length > 0 && (
            <div className="mb-8 resume-block">
                <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900 mb-4">Experience</h2>
                <div className="space-y-6">
                    {[...profile.workExperience]
                        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                        .map((exp, index) => (
                            <div key={index} className="break-inside-avoid">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-lg text-gray-900">{exp.position}</h3>
                                    <span className="text-sm font-medium text-gray-500 whitespace-nowrap ml-4">
                                        {formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}
                                    </span>
                                </div>
                                <div className="text-base font-semibold text-gray-700 mb-2">{exp.company}</div>
                                <div className="text-sm text-gray-600 leading-relaxed">
                                    {renderDescription(exp.description)}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        )}

        {/* Education */}
        {profile.education && profile.education.length > 0 && (
            <div className="mb-8 resume-block break-inside-avoid">
                <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900 mb-4">Education</h2>
                <div className="space-y-4">
                    {[...profile.education]
                        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                        .map((edu, index) => (
                            <div key={index} className="break-inside-avoid">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-lg text-gray-900">{edu.institution}</h3>
                                    <span className="text-sm font-medium text-gray-500 whitespace-nowrap ml-4">
                                        {formatDate(edu.startDate)} – {edu.current ? 'Present' : formatDate(edu.endDate)}
                                    </span>
                                </div>
                                <div className="text-base text-gray-700">
                                    {edu.degree} in {edu.field}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        )}

        {/* Skills & Languages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 break-inside-avoid">
            {profile.skills && profile.skills.length > 0 && (
                <div className="resume-block break-inside-avoid">
                    <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900 mb-4">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                            <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-md text-sm font-medium">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {profile.languages && profile.languages.length > 0 && (
                <div className="resume-block break-inside-avoid">
                    <h2 className="text-lg font-bold uppercase tracking-wider text-gray-900 mb-4">Languages</h2>
                    <div className="space-y-2">
                        {profile.languages.map((lang, index) => (
                            <div key={index} className="flex justify-between text-sm">
                                <span className="font-medium text-gray-900">{lang.name}</span>
                                <span className="text-gray-500 capitalize">{lang.proficiency}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
);

const ProfessionalTemplate = ({ profile }: { profile: UserProfile }) => (
    <div className="p-8 md:p-12 print:pt-8 print:pb-0 font-serif text-gray-900">
        {/* Header */}
        <div className="text-center pb-6 mb-8 break-inside-avoid">
            <h1 className="text-3xl font-bold uppercase tracking-widest mb-4 text-gray-900 resume-block">
                {profile.personalInfo?.fullName || 'Your Name'}
            </h1>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
                {profile.personalInfo?.email && <span>{profile.personalInfo.email}</span>}
                {profile.personalInfo?.phone && <span>{profile.personalInfo.phone}</span>}
                {profile.personalInfo?.location && <span>{profile.personalInfo.location}</span>}
                {profile.personalInfo?.linkedin && (
                    <a href={profile.personalInfo.linkedin} className="text-gray-800 hover:underline">LinkedIn</a>
                )}
                {profile.personalInfo?.portfolio && (
                    <a href={profile.personalInfo.portfolio} className="text-gray-800 hover:underline">Portfolio</a>
                )}
            </div>
        </div>

        {/* Experience */}
        {profile.workExperience && profile.workExperience.length > 0 && (
            <div className="mb-8 resume-block">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 pb-1">Professional Experience</h2>
                <div className="space-y-6">
                    {[...profile.workExperience]
                        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                        .map((exp, index) => (
                            <div key={index} className="break-inside-avoid">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-lg">{exp.company}</h3>
                                    <span className="text-sm italic text-gray-600">
                                        {formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}
                                    </span>
                                </div>
                                <div className="text-base font-semibold text-gray-800 mb-2 italic">{exp.position}</div>
                                <div className="text-sm text-gray-700 leading-relaxed">
                                    {renderDescription(exp.description)}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        )}

        {/* Education */}
        {profile.education && profile.education.length > 0 && (
            <div className="mb-8 resume-block break-inside-avoid">
                <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 pb-1">Education</h2>
                <div className="space-y-4">
                    {[...profile.education]
                        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                        .map((edu, index) => (
                            <div key={index} className="break-inside-avoid">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-lg">{edu.institution}</h3>
                                    <span className="text-sm italic text-gray-600">
                                        {formatDate(edu.startDate)} – {edu.current ? 'Present' : formatDate(edu.endDate)}
                                    </span>
                                </div>
                                <div className="text-base text-gray-800 italic">
                                    {edu.degree} in {edu.field}
                                </div>
                            </div>
                        ))}
                </div>
            </div>
        )}

        {/* Skills & Languages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 break-inside-avoid">
            {profile.skills && profile.skills.length > 0 && (
                <div className="resume-block break-inside-avoid">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 pb-1">Core Competencies</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-2">
                        {profile.skills.map((skill, index) => (
                            <span key={index} className="text-sm text-gray-800">
                                • {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {profile.languages && profile.languages.length > 0 && (
                <div className="resume-block break-inside-avoid">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-4 pb-1">Languages</h2>
                    <div className="space-y-1">
                        {profile.languages.map((lang, index) => (
                            <div key={index} className="text-sm text-gray-800">
                                <span className="font-semibold">{lang.name}</span> <span className="italic text-gray-600">({lang.proficiency})</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
);

const CreativeTemplate = ({ profile }: { profile: UserProfile }) => (
    <div className="flex min-h-full font-sans print:pt-0 print:pb-4">
        {/* Sidebar */}
        <div className="w-1/3 bg-gray-900 text-white p-8 pt-12 print:pt-8 print:pb-4">
            <div className="mb-10 break-inside-avoid">
                <h1 className="text-3xl font-bold leading-tight mb-4 text-cyan-400 resume-block">
                    {profile.personalInfo?.fullName?.split(' ')[0]}<br />
                    <span className="text-white">{profile.personalInfo?.fullName?.split(' ').slice(1).join(' ')}</span>
                </h1>
                <div className="space-y-3 text-sm text-gray-300">
                    {profile.personalInfo?.email && (
                        <div className="break-words">{profile.personalInfo.email}</div>
                    )}
                    {profile.personalInfo?.phone && (
                        <div>{profile.personalInfo.phone}</div>
                    )}
                    {profile.personalInfo?.location && (
                        <div>{profile.personalInfo.location}</div>
                    )}
                    {profile.personalInfo?.linkedin && (
                        <div>
                            <a href={profile.personalInfo.linkedin} className="text-cyan-400 hover:text-cyan-300">LinkedIn</a>
                        </div>
                    )}
                    {profile.personalInfo?.portfolio && (
                        <div>
                            <a href={profile.personalInfo.portfolio} className="text-cyan-400 hover:text-cyan-300">Portfolio</a>
                        </div>
                    )}
                </div>
            </div>

            {profile.skills && profile.skills.length > 0 && (
                <div className="mb-10 resume-block break-inside-avoid">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Skills</h2>
                    <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                            <span key={index} className="bg-gray-800 px-2 py-1 rounded text-xs text-gray-300">
                                {skill}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {profile.languages && profile.languages.length > 0 && (
                <div className="resume-block break-inside-avoid">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Languages</h2>
                    <div className="space-y-2">
                        {profile.languages.map((lang, index) => (
                            <div key={index} className="text-sm">
                                <span className="block text-gray-200">{lang.name}</span>
                                <span className="text-xs text-gray-500 capitalize">{lang.proficiency}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        {/* Main Content */}
        <div className="w-2/3 p-8 pt-12 bg-white text-gray-800 print:pt-8 print:pb-4">
            {profile.workExperience && profile.workExperience.length > 0 && (
                <div className="mb-10 resume-block">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <span className="w-8 h-1 bg-cyan-500 block"></span>
                        Experience
                    </h2>
                    <div className="space-y-8">
                        {[...profile.workExperience]
                            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                            .map((exp, index) => (
                                <div key={index} className="relative pl-4 border-l-2 border-gray-100 resume-block break-inside-avoid">
                                    <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-cyan-500"></div>
                                    <h3 className="font-bold text-lg text-gray-900">{exp.position}</h3>
                                    <div className="text-sm font-semibold text-cyan-600 mb-1">{exp.company}</div>
                                    <div className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                                        {formatDate(exp.startDate)} – {exp.current ? 'Present' : formatDate(exp.endDate)}
                                    </div>
                                    <div className="text-sm text-gray-600 leading-relaxed">
                                        {renderDescription(exp.description)}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {profile.education && profile.education.length > 0 && (
                <div className="resume-block">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                        <span className="w-8 h-1 bg-cyan-500 block"></span>
                        Education
                    </h2>
                    <div className="space-y-6">
                        {[...profile.education]
                            .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
                            .map((edu, index) => (
                                <div key={index} className="resume-block break-inside-avoid">
                                    <h3 className="font-bold text-lg text-gray-900">{edu.institution}</h3>
                                    <div className="text-sm text-gray-600 mb-1">
                                        {edu.degree} in {edu.field}
                                    </div>
                                    <div className="text-xs text-gray-400 uppercase tracking-wide">
                                        {formatDate(edu.startDate)} – {edu.current ? 'Present' : formatDate(edu.endDate)}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    </div>
);

export default function ResumePreview({ profile, template = 'modern' }: ResumePreviewProps) {
    if (!profile) {
        return (
            <div className="h-full flex items-center justify-center text-gray-400">
                <p>Loading resume preview...</p>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-lg print:shadow-none min-h-full w-full max-w-[210mm] mx-auto overflow-hidden" id="resume-preview">
            {template === 'modern' && <ModernTemplate profile={profile} />}
            {template === 'professional' && <ProfessionalTemplate profile={profile} />}
            {template === 'creative' && <CreativeTemplate profile={profile} />}
        </div>
    );
}
