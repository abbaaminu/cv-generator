# ABSON CV Genius

A professional AI-powered CV generator built with Next.js 16, TypeScript, and Google Generative AI.

## Features

✨ **AI-Powered Content Generation**
- Generate professional CV content using Google Gemini AI
- Multiple CV templates (Modern, Executive, Creative)
- Real-time content preview

📥 **Multiple Download Formats**
- Download as PDF
- Export to Word (.docx)
- Export to Excel (.xlsx)

💳 **Payment Integration**
- Secure payment processing with Paystack
- Premium features access
- One-time payment model

📧 **Contact & Support**
- Built-in contact form
- Direct email support: tukurmuhammed902@gmail.com
- Professional footer with links

🔒 **Authentication**
- Supabase Auth integration
- Secure user sessions
- Privacy-focused

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript 5
- **Styling**: Tailwind CSS 4, PostCSS
- **AI**: Google Generative AI (Gemini 1.5 Flash)
- **Authentication**: Supabase
- **Payment**: Paystack
- **File Export**: html2pdf, docx, xlsx
- **Code Quality**: ESLint, Prettier

## Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/abbaaminu/abson-cv-generator.git
   cd abson-cv-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env.local` file:
   ```bash
   cp .env.local.example .env.local
   ```

   Fill in the required variables:
   - `NEXT_PUBLIC_GOOGLE_API_KEY` - Get from [Google AI Studio](https://aistudio.google.com)
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
   - `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` - Paystack public key
   - `PAYSTACK_SECRET_KEY` - Paystack secret key (server-side only)

4. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
├── app/
│   ├── api/                    # API routes
│   │   ├── contact/           # Contact form endpoint
│   │   └── paystack/          # Payment verification
│   ├── contact/               # Contact page
│   ├── layout.tsx             # Root layout
│   ├── page.tsx               # Home page
│   └── globals.css            # Global styles
├── components/
│   ├── ErrorBoundary.tsx      # Error handling
│   ├── Footer.tsx             # Footer with copyright
│   ├── DownloadButtons.tsx    # Export functionality
│   └── PaymentModal.tsx       # Payment UI
├── lib/
│   ├── gemini.ts              # Google Generative AI service
│   ├── paystack.ts            # Payment integration
│   └── download.ts            # File export utilities
├── public/                    # Static assets
└── package.json               # Dependencies
```

## API Endpoints

### `/api/contact` (POST)
Submit contact form
```json
{
  "name": "string",
  "email": "string",
  "subject": "string",
  "message": "string"
}
```

### `/api/paystack/verify` (POST)
Verify payment transaction
```json
{
  "reference": "string"
}
```

## Usage

### Generate CV Content
```typescript
import { generateCVContent } from '@/lib/gemini';

const content = await generateCVContent(
  "Generate a professional summary for a Software Engineer with 5 years experience"
);
```

### Download CV
```typescript
import { downloadPDF, downloadWord, downloadExcel } from '@/lib/download';

// PDF
await downloadPDF('cv-container', 'MyCV.pdf');

// Word
await downloadWord(cvText, 'MyCV.docx');

// Excel
downloadExcel([{ skill: 'JavaScript', level: 'Expert' }], 'MyCV.xlsx');
```

### Process Payment
```typescript
import { initiatePayment } from '@/lib/paystack';

initiatePayment({
  email: 'user@example.com',
  amount: 5000,
  reference: 'UNIQUE_REF',
  onSuccess: (reference) => console.log('Payment successful'),
  onClose: () => console.log('Payment cancelled'),
});
```

## Code Quality Standards

### ESLint
```bash
npm run lint
```

Enforces:
- TypeScript strict mode
- Unused variable detection
- React hooks rules
- Proper error handling

### TypeScript
- Strict mode enabled
- Path aliases configured (@/*)
- Full type safety

### Best Practices
- Error boundaries for crash prevention
- Loading states for async operations
- Input validation on all forms
- CORS and security headers
- Responsive design for all devices
- Accessibility (WCAG 2.1)

## Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Docker
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Environment Variables Reference

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `NEXT_PUBLIC_GOOGLE_API_KEY` | Public | ✓ | Google AI API key |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | ✓ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | ✓ | Supabase anonymous key |
| `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` | Public | ✓ | Paystack public key |
| `PAYSTACK_SECRET_KEY` | Secret | ✓ | Paystack secret key |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Public | - | Support email address |

## Common Issues

### Google API Error 404
**Solution**: Ensure your API key is valid and has access to Gemini models:
1. Visit [Google AI Studio](https://aistudio.google.com)
2. Generate a new API key
3. Update `.env.local`

### Paystack Payment Not Working
**Solution**: 
1. Check that both public and secret keys are correct
2. Ensure you're using test keys for development
3. Verify webhook configuration in Paystack dashboard

### PDF Download Issues
**Solution**:
1. Ensure element ID exists: `<div id="cv-container">...</div>`
2. Check browser console for specific errors
3. Try alternative format (Word/Excel)

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is open source and available under the MIT License.

## Support

**Email**: [tukurmuhammed902@gmail.com](mailto:tukurmuhammed902@gmail.com)

**Website**: [https://abson-cv-generator.vercel.app](https://abson-cv-generator.vercel.app)

**GitHub Issues**: [Report a bug](https://github.com/abbaaminu/abson-cv-generator/issues)

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced template editor
- [ ] CV template marketplace
- [ ] Team collaboration features
- [ ] LinkedIn profile import
- [ ] Multi-language support
- [ ] Email notifications
- [ ] Analytics dashboard

## Changelog

### v0.2.0 (Current)
- ✨ Added Paystack payment integration
- 📥 Added PDF, Word, Excel export options
- 📧 Added contact form and page
- 🔒 Added error boundary
- 🎨 Added footer with copyright
- 📝 Enhanced API error handling

### v0.1.0
- Initial release with CV generation

---

**Made with ❤️ by ABSON**

© 2026 ABSON CV Genius. All rights reserved.
