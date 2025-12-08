# QR Code Generator

A modern, responsive QR code generator built with Next.js 16 and React 19. Generate QR codes for text, URLs, phone numbers, and locations with support for Google Maps integration. Features a comprehensive dark and light theme system, **plus a permanent URL redirect system** with an admin dashboard.

## Live Demo

Visit the deployed application at: https://qr-code-generator-roan-five.vercel.app

## Features

### QR Code Generation
- Generate QR codes for multiple content types:
  - Plain text
  - Website URLs (with validation)
  - Phone numbers (tel: protocol with validation)
  - Location (addresses, coordinates, or Google Maps links)
- Google Maps integration:
  - Paste shortened Google Maps links directly
  - Automatic coordinate extraction from full Google Maps URLs
  - Plain text address support (works with Google Maps and Apple Maps)
  - Universal map links compatible with both iOS and Android devices
- Customizable QR code settings:
  - Error correction levels (Low 7%, Medium 15%, Quartile 25%, High 30%)
  - Multiple size options (128x128, 256x256, 512x512, 1024x1024)
  - **QR code color customization** (6 foreground + 6 background presets)
- Download generated QR codes as PNG images
- **Copy QR code image to clipboard**
- **QR code history** (saves on download/copy, persists in localStorage)
- Dark and light theme with persistent preference
- Fully responsive design for mobile and desktop

### URL Redirect System (Link Manager)
- **Permanent short URLs** that never change (e.g., `/r/abc123`)
- **Changeable destinations** - update where a link points to anytime
- Click tracking for each link
- Admin dashboard at `/admin` for managing links
- Built with Vercel KV (Redis) for fast, serverless storage

## Tech Stack

### Framework

- **Next.js 16.0.7** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type-safe JavaScript

### Storage

- **Vercel KV** - Redis-compatible serverless key-value store for link redirects

### Styling

- **Tailwind CSS 3.4** - Utility-first CSS framework
- **tailwindcss-animate** - Animation utilities for Tailwind
- **tailwind-merge** - Utility for merging Tailwind classes
- **class-variance-authority** - For creating variant-based component styles
- **clsx** - Utility for constructing className strings

### UI Components

- **Radix UI** - Unstyled, accessible component primitives
  - Accordion, Alert Dialog, Aspect Ratio, Avatar
  - Checkbox, Collapsible, Context Menu, Dialog
  - Dropdown Menu, Hover Card, Label, Menubar
  - Navigation Menu, Popover, Progress, Radio Group
  - Scroll Area, Select, Separator, Slider
  - Slot, Switch, Tabs, Toast, Toggle, Tooltip
- **Lucide React** - Icon library
- **cmdk** - Command menu component
- **Vaul** - Drawer component
- **Sonner** - Toast notifications

### QR Code Generation

- **qrcode** - QR code generation library with canvas support

### Theming

- **next-themes** - Theme management for Next.js with system preference detection

### Forms and Validation

- **React Hook Form** - Performant form handling
- **@hookform/resolvers** - Validation resolvers for React Hook Form
- **Zod** - TypeScript-first schema validation

### Additional Libraries

- **date-fns** - Date utility library
- **react-day-picker** - Date picker component
- **embla-carousel-react** - Carousel/slider component
- **react-resizable-panels** - Resizable panel layouts
- **recharts** - Charting library
- **input-otp** - One-time password input component

## Project Structure

```
qr-generator/
├── app/
│   ├── admin/
│   │   └── page.tsx         # Link Manager admin dashboard
│   ├── api/
│   │   └── links/
│   │       └── route.ts     # API for managing redirects (CRUD)
│   ├── r/
│   │   └── [slug]/
│   │       └── route.ts     # Dynamic redirect handler
│   ├── globals.css          # Global styles and CSS variables
│   ├── layout.tsx           # Root layout with theme provider
│   └── page.tsx             # Home page
├── components/
│   ├── theme-provider.tsx   # Theme context provider
│   ├── theme-toggle.tsx     # Dark/light mode toggle button
│   └── ui/                  # Reusable UI components
├── hooks/
│   ├── use-mobile.tsx       # Mobile detection hook
│   └── use-toast.ts         # Toast notification hook
├── lib/
│   └── utils.ts             # Utility functions
├── public/                  # Static assets
├── styles/
│   └── globals.css          # Additional global styles
├── qr-generator.tsx         # Main QR generator component
├── .env.example             # Environment variables template
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies
```

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, or pnpm

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Kyellog-silog/qr-code-generator.git
   cd qr-code-generator
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Theme System

The application includes a comprehensive theming system:

- **Dark Mode (Default)**: Dark background with light text, optimized for low-light environments
- **Light Mode**: Light background with dark text, suitable for bright environments

Theme preference is persisted in localStorage and applied on page load to prevent flash of unstyled content.

### CSS Variables

The theme system uses CSS custom properties defined in `globals.css`:

- `--background` / `--foreground` - Main background and text colors
- `--card` / `--card-foreground` - Card component colors
- `--primary` / `--primary-foreground` - Primary action colors
- `--secondary` / `--secondary-foreground` - Secondary colors
- `--muted` / `--muted-foreground` - Muted/subtle colors
- `--accent` / `--accent-foreground` - Accent colors
- `--destructive` / `--destructive-foreground` - Error/danger colors
- `--border` / `--input` / `--ring` - Border and input colors

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and configure the build
4. **Set up Vercel KV** (for Link Manager):
   - Go to your project settings in Vercel
   - Navigate to **Storage** → **Create Database** → **KV**
   - Connect it to your project
   - The environment variables will be automatically added
5. (Optional) Add `ADMIN_API_KEY` environment variable for API protection
6. Click Deploy

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `KV_URL` | Yes (for Link Manager) | Vercel KV connection URL |
| `KV_REST_API_URL` | Yes (for Link Manager) | Vercel KV REST API URL |
| `KV_REST_API_TOKEN` | Yes (for Link Manager) | Vercel KV REST API token |
| `KV_REST_API_READ_ONLY_TOKEN` | Yes (for Link Manager) | Vercel KV read-only token |
| `ADMIN_API_KEY` | No | API key for protecting the links API |

### URL Redirect System

The Link Manager creates permanent short URLs:

- **Short URL format**: `https://your-domain.com/r/{slug}`
- **Admin dashboard**: `https://your-domain.com/admin`
- **API endpoint**: `https://your-domain.com/api/links`

Example:
- Create a link with slug `promo2024` pointing to `https://example.com/holiday-sale`
- Share `https://your-domain.com/r/promo2024`
- Later, update the destination to `https://example.com/new-year-sale` without changing the QR code!

### Other Platforms

Build the application:
```bash
npm run build
```

The output will be in the `.next` directory. Follow your platform's deployment guide for Next.js applications.

**Note**: The Link Manager feature requires Vercel KV and will only work on Vercel deployment.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is private and not licensed for public distribution.

## Author

Developed by Kyellog-silog
