# QR Code Generator

A modern, responsive QR code generator built with Next.js 15 and React 19. Generate QR codes for text, URLs, phone numbers, and locations with support for Google Maps integration. Features a comprehensive dark and light theme system.

## Live Demo

Visit the deployed application at: https://qr-code-generator-roan-five.vercel.app

## Features

- Generate QR codes for multiple content types:
  - Plain text
  - Website URLs
  - Phone numbers (tel: protocol)
  - Location coordinates with Google Maps link support
- Google Maps integration:
  - Paste shortened Google Maps links directly
  - Automatic coordinate extraction from full Google Maps URLs
  - Universal map links compatible with both iOS and Android devices
- Customizable QR code settings:
  - Error correction levels (Low 7%, Medium 15%, Quartile 25%, High 30%)
  - Multiple size options (128x128, 256x256, 512x512, 1024x1024)
- Download generated QR codes as PNG images
- Dark and light theme with persistent preference
- Fully responsive design for mobile and desktop

## Tech Stack

### Framework

- **Next.js 15.2.4** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type-safe JavaScript

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
│   ├── globals.css      # Global styles and CSS variables
│   ├── layout.tsx       # Root layout with theme provider
│   └── page.tsx         # Home page
├── components/
│   ├── theme-provider.tsx   # Theme context provider
│   ├── theme-toggle.tsx     # Dark/light mode toggle button
│   └── ui/                  # Reusable UI components
├── hooks/
│   ├── use-mobile.tsx   # Mobile detection hook
│   └── use-toast.ts     # Toast notification hook
├── lib/
│   └── utils.ts         # Utility functions
├── public/              # Static assets
├── styles/
│   └── globals.css      # Additional global styles
├── qr-generator.tsx     # Main QR generator component
├── tailwind.config.ts   # Tailwind CSS configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project dependencies
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
4. Click Deploy

### Other Platforms

Build the application:
```bash
npm run build
```

The output will be in the `.next` directory. Follow your platform's deployment guide for Next.js applications.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is private and not licensed for public distribution.

## Author

Developed by Kyellog-silog
