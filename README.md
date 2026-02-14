# 🏡 Household Expenses Tracker

A modern, collaborative expense tracking application designed for families and roommates to manage shared household expenses efficiently. Built with Next.js, Firebase, and TypeScript.

![Next.js](https://img.shields.io/badge/Next.js-15.2.4-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-Latest-orange?style=flat-square&logo=firebase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38b2ac?style=flat-square&logo=tailwind-css)

## ✨ Features

### 📊 Expense Management
- **Add Expenses**: Quickly record expenses with amount, notes, and optional receipt uploads
- **Receipt Storage**: Upload and view receipts for all transactions
- **Transaction History**: Complete transaction feed with timestamps and details
- **Edit & Delete**: Admins can edit or delete transactions as needed

### 👥 Household Collaboration
- **Multi-User Support**: Create or join households with a unique 6-character code
- **Member Management**: Admins can invite and manage household members
- **Role-Based Access**: Admin and member roles with appropriate permissions
- **Real-Time Updates**: All changes sync instantly across all household members

### 📈 Analytics & Insights
- **Monthly Spending Breakdown**: Visual pie chart showing spending distribution by member
- **Standings Calculator**: Automatic calculation of fair share and settlements
- **Statistics Dashboard**: 
  - Total expenses tracking
  - Personal spending vs. fair share
  - Monthly averages
  - Weekly spending summaries
- **Historical Data**: View standings and expenses for the past 6 months

### 🎨 User Experience
- **Responsive Design**: Fully responsive interface for desktop, tablet, and mobile
- **Modern UI**: Built with Radix UI and Tailwind CSS for a premium look and feel
- **Real-Time Sync**: Firebase real-time database ensures instant updates
- **Secure Authentication**: Firebase Authentication for secure user management

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm (or npm/yarn)
- Firebase project with:
  - Authentication enabled
  - Firestore database
  - Storage bucket for receipts

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Astronil/household_expenses.git
   cd household_expenses
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Set up Firebase**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Create a Storage bucket
   - Copy your Firebase configuration

4. **Configure environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

5. **Set up Firestore Security Rules**
   
   Copy the rules from `firestore.rules` to your Firebase Console under Firestore Database > Rules.

6. **Set up Storage Rules**
   
   Copy the rules from `storage.rules` to your Firebase Console under Storage > Rules.

7. **Run the development server**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

8. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
household_expenses/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # Reusable UI components (Radix UI)
│   ├── dashboard.tsx     # Main dashboard
│   ├── auth-screen.tsx   # Authentication UI
│   ├── household-setup.tsx # Household creation/joining
│   └── ...               # Other feature components
├── lib/                  # Utility libraries
│   ├── firebase.ts       # Firebase configuration
│   └── hooks/            # Custom React hooks
├── types/                # TypeScript type definitions
├── public/               # Static assets
└── firestore.rules       # Firestore security rules
```

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) - React framework with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- **UI Components**: [Radix UI](https://www.radix-ui.com/) - Accessible component primitives
- **Charts**: [Recharts](https://recharts.org/) - Composable charting library
- **Backend**: [Firebase](https://firebase.google.com/) - Backend as a Service
  - Authentication
  - Firestore (NoSQL database)
  - Storage (for receipts)
- **Icons**: [Lucide React](https://lucide.dev/) - Beautiful icon library
- **Forms**: [React Hook Form](https://react-hook-form.com/) - Performant forms

## 📱 Usage

### Creating a Household

1. Sign up or log in to your account
2. Click "Create Household"
3. Enter a household name
4. Share the generated 6-character code with your family/roommates

### Joining a Household

1. Get the household code from the admin
2. Click "Join Household"
3. Enter the 6-character code
4. Start tracking expenses!

### Adding Expenses

1. Click "Add Expense" button
2. Enter the amount
3. Add an optional note (e.g., "Weekly groceries")
4. Optionally upload a receipt
5. Submit to record the expense

### Viewing Standings

1. Click "Standings" button
2. Select a month from the dropdown
3. View spending breakdown and settlements
4. See who owes what and who should receive money

## 🔒 Security

- Firebase Authentication for secure user management
- Firestore security rules to protect data
- Storage rules to secure receipt uploads
- Role-based access control (Admin/Member)
- User data isolation per household

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Anil Poudel (Astronil)**

- Portfolio: [poudelanil.com](https://poudelanil.com)
- GitHub: [@Astronil](https://github.com/Astronil)

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/)
- Charts powered by [Recharts](https://recharts.org/)

## 📧 Support

If you have any questions or need help, please open an issue on GitHub or contact the maintainer.

---

Made with ❤️ by [Astronil](https://poudelanil.com)
