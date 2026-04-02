# UoE Marketplace

A campus student marketplace built for University of Eldoret students to buy and sell household items at the end of their academic journey.

## Overview

**UOE Marketplace** is a peer-to-peer marketplace platform designed specifically for campus students who need to sell their household items before leaving at the end of their 4-year stay. Similar to Facebook Marketplace and Jiji.co.ke, it provides a dedicated, trustworthy platform where students can list items, browse available products, and connect with other students in their community.

## 🎯 Key Features

- **User Authentication** - Secure login and signup for students
- **Browse Listings** - Explore available items from other students
- **List Items for Sale** - Easy-to-use item listing creation and management
- **Item Details** - Detailed product pages with descriptions, images, and pricing
- **Messaging** - Direct messaging between buyers and sellers
- **User Profiles** - Customizable student profiles with selling history
- **Admin Dashboard** - Moderation and platform management tools
- **Responsive Design** - Seamless experience across all devices

## 🎓 Target Audience

- University of Eldoret students preparing to leave campus
- Students looking for affordable household items
- International students joining the university

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ with TypeScript
- **Styling**: Tailwind CSS
- **Backend/Database**: Firebase (Firestore, Authentication, Storage)
- **Linting**: ESLint

## 📁 Project Structure

```
app/
├── (auth)/          # Authentication pages (login, signup)
├── admin/           # Admin dashboard
├── browse/          # Browse listings
├── items/           # Item details page
├── messages/        # Messaging system
├── profile/         # User profiles
├── sell/            # Create and manage listings
└── ...

components/         # Reusable React components
context/           # React Context providers (Auth, Theme)
lib/               # Utility functions and Firebase setup
public/            # Static assets
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- Firebase project setup

### Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd uoe_marketplace
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp env.example.md .env.local
   # Fill in your Firebase credentials
   ```

4. Run the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) to see the app

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔐 Security

- Firestore security rules for data protection
- Firebase Authentication for user management
- Admin controls for content moderation

## 📄 License

