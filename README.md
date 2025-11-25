# JobDance Web - AI Interview Practice App

A mobile-friendly web application for practicing interview skills with AI. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🔐 User Authentication (Register & Sign In)
- 📝 Comprehensive Onboarding Process
  - Work Experience
  - Education
  - Skills
  - Languages
  - Availability
  - Expected Salary
- 🤖 AI Interview Practice
- 📱 Mobile-First Responsive Design (Android/iOS/Huawei compatible)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
├── app/
│   ├── auth/
│   │   ├── login/          # Login page
│   │   └── register/       # Registration page
│   ├── onboarding/         # Onboarding flow
│   ├── dashboard/          # User dashboard
│   ├── interview/          # AI interview practice
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home/redirect page
│   └── globals.css         # Global styles
├── lib/
│   └── auth.ts             # Authentication utilities
└── public/                 # Static assets
```

## Mobile Optimization

- Responsive design using Tailwind CSS
- Touch-friendly UI elements
- Prevents zoom on input focus (iOS)
- Viewport meta tags configured
- Mobile-first approach

## Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: React Icons
- **Storage**: LocalStorage (can be upgraded to backend)

## Future Enhancements

- Backend API integration
- Real AI interview API (OpenAI, etc.)
- User profile editing
- Interview history and analytics
- Voice input for answers
- Multiple interview types/categories

## License

MIT




