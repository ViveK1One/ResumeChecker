# Resume Checker - AI-Powered Resume Analysis Tool

A modern, full-stack web application that provides instant AI-powered resume analysis and feedback for students and job seekers.

## 🚀 Features

- **Dual AI-Powered Analysis**: Comprehensive resume evaluation using Google Gemini Pro (primary) and OpenAI GPT (fallback)
- **Instant Scoring**: Get a score out of 100 with detailed breakdown
- **ATS Optimization**: Check how well your resume performs with Applicant Tracking Systems
- **Detailed Feedback**: Specific suggestions for improvement with examples
- **Keyword Analysis**: Identify found and missing keywords for your target position
- **Industry-Specific Insights**: Tailored recommendations based on detected industry
- **PDF Reports**: Download detailed analysis reports in PDF format
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Drag & Drop Upload**: Easy file upload with support for PDF and DOCX
- **No Login Required**: Start analyzing immediately without account creation

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **File Processing**: pdf-parse, mammoth
- **AI Analysis**: OpenAI GPT-3.5-turbo + Google Gemini Pro
- **PDF Generation**: jsPDF
- **File Upload**: react-dropzone
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (optional - Gemini API will be used as primary)
- Google Gemini API key (recommended)
- MongoDB database (local or cloud)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd resume-checker
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Environment Setup

Copy the example environment file and add your OpenAI API key:

```bash
cp env.example .env.local
```

Edit `.env.local` and add your API keys and MongoDB URI:

```env
# Primary AI service (recommended)
GEMINI_API_KEY=your_gemini_api_key_here

# Fallback AI service (optional)
OPENAI_API_KEY=your_openai_api_key_here

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
```

**API Key Setup:**
1. **Gemini API Key**: Get your free API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. **OpenAI API Key**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys) (optional fallback)

**Dual AI System:**
The application uses a smart dual AI system for optimal analysis:
- **Primary**: Google Gemini Pro - Provides fast, accurate analysis with industry-specific insights
- **Fallback**: OpenAI GPT-3.5-turbo - Ensures reliability if Gemini is unavailable
- **Automatic Switching**: The system automatically tries Gemini first, then falls back to OpenAI if needed
- **API Source Display**: Users can see which AI service was used for their analysis

### 4. Run the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
resume-checker/
├── app/
│   ├── api/
│   │   ├── analyze-resume/
│   │   │   └── route.ts          # Resume analysis API
│   │   ├── generate-pdf/
│   │   │   └── route.ts          # PDF generation API
│   │   └── analytics/
│   │       └── route.ts          # Analytics API
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── lib/
│   └── mongodb.ts                # MongoDB connection utility
├── models/
│   └── Resume.ts                 # Resume data model
├── components/
│   ├── Header.tsx                # Navigation header
│   ├── ResumeUploader.tsx        # File upload component
│   ├── ResumeResults.tsx         # Analysis results display
│   └── TopTips.tsx               # Resume tips sidebar
├── uploads/                      # Uploaded files (auto-created)
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🔧 Configuration

### OpenAI API Setup

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account or sign in
3. Generate a new API key
4. Add the key to your `.env.local` file

### MongoDB Setup

1. **Local MongoDB**: Install MongoDB locally or use Docker
2. **Cloud MongoDB**: Use MongoDB Atlas (recommended)
   - Visit [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Create a free cluster
   - Get your connection string
   - Add it to your `.env.local` file as `MONGODB_URI`

### Customization

You can customize the application by modifying:

- **Colors**: Edit `tailwind.config.js` for custom color schemes
- **Scoring Criteria**: Modify the AI prompt in `app/api/analyze-resume/route.ts`
- **File Size Limits**: Adjust the 5MB limit in the upload validation
- **Supported Formats**: Add more file types in the validation logic

## 📊 Analysis Criteria

The resume analysis evaluates:

- **Formatting (20%)**: Clean layout, proper sections, readable font
- **Grammar (20%)**: Spelling, punctuation, sentence structure
- **Keywords (20%)**: Relevant industry terms and skills
- **Clarity (20%)**: Clear, concise descriptions
- **ATS Friendliness (20%)**: Standard formatting, keyword optimization

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- **Netlify**: Use the Next.js build command
- **Railway**: Direct deployment from GitHub
- **DigitalOcean App Platform**: Container deployment
- **AWS/GCP**: Docker container deployment

### Environment Variables for Production

Make sure to set these in your production environment:

```env
OPENAI_API_KEY=your_production_openai_key
NODE_ENV=production
```

## 🔒 Security Considerations

- File uploads are validated for type and size
- Files are stored with unique UUIDs
- No sensitive data is logged
- API keys are kept secure in environment variables

## 📈 Analytics & Storage

The application automatically saves:

- Uploaded resume files (with unique IDs)
- Analysis results as JSON files
- Timestamps and metadata for each analysis

Files are stored locally in the `uploads/` directory. For production, consider:

- Using cloud storage (AWS S3, Google Cloud Storage)
- Adding a database for better analytics
- Implementing user accounts for progress tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the browser console for errors
2. Verify your OpenAI API key is correct
3. Ensure you have sufficient OpenAI credits
4. Check that uploaded files are PDF or DOCX format

## 🎯 Roadmap

- [ ] User accounts and progress tracking
- [ ] Industry-specific keyword suggestions
- [ ] Resume templates and examples
- [ ] Integration with job boards
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app version

## 🙏 Acknowledgments

- OpenAI for providing the AI analysis capabilities
- Next.js team for the excellent framework
- Tailwind CSS for the beautiful styling system
- All contributors and users of this tool

---

**Made with ❤️ for students and job seekers everywhere**
