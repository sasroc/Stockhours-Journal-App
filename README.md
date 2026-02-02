# TradeLens

A comprehensive day trading journal application designed to track, analyze, and visualize trading performance. Built specifically for options traders, the app provides detailed trade analytics, performance metrics, and organizational tools to help traders improve their strategies and learn from their trading history.

## Overview

TradeLens is a React-based web application that allows traders to import their trade data from Excel/CSV files, automatically process and calculate profit/loss metrics, and visualize performance through interactive dashboards and reports. The app features a modern dark-themed UI optimized for both desktop and mobile devices.

## Key Features

### 📊 **Trade Data Management**
- **Import Trades**: Upload trade history from Excel (.xlsx, .xls) or CSV files
- **Automatic Processing**: Intelligently processes transactions to match OPEN/CLOSE pairs and calculate accurate P&L
- **Multi-File Support**: Manage multiple import files and track which trades came from which files
- **Data Persistence**: All trade data is automatically saved to Firebase (for authenticated users) or localStorage (for guests)

### 📈 **Performance Analytics**

#### Dashboard
- **Overview Statistics**: Total trades, win rate, profit factor, gross P&L, and more
- **Interactive Calendar**: Visual calendar heatmap showing daily P&L performance
- **Performance Charts**: 
  - Cumulative P&L line chart
  - Win/Loss distribution charts
  - Daily/weekly/monthly performance breakdowns
- **Quick Metrics**: Win rate, average win/loss, largest win/loss, and streak tracking

#### Daily Stats Screen
- **Day-by-Day Breakdown**: View all trades organized by trading date
- **Cumulative P&L Charts**: Line graphs showing intraday P&L progression
- **Daily Metrics**: Total trades, winners, losers, gross P&L, volume, and profit factor per day
- **Expandable Trade Details**: Click to view detailed trade information for each day
- **Share Functionality**: Generate and download shareable images of daily performance

#### All Trades Screen
- **Complete Trade List**: View all processed trades in a sortable, paginated table
- **Trade Details View**: Click any trade to see comprehensive details including:
  - Entry/exit prices and quantities
  - Net P&L and ROI calculations
  - Trade timing and duration
  - Option contract details (strike, expiration, type)
- **TradingView Integration**: View price charts for each trade's underlying symbol
- **Pagination**: Navigate through large trade lists efficiently (50 trades per page)

#### Reports Screen
- **Advanced Analytics**: Multiple report types including:
  - Overview reports with key performance indicators
  - Tag-based analysis (filter by setups and mistakes)
  - Time-based analysis (hourly, daily, weekly patterns)
  - Performance by symbol, strike, expiration, and option type
- **Interactive Charts**: Bar charts and visualizations for various metrics
- **Filterable Data**: Expandable categories to drill down into specific trade attributes

### 🏷️ **Trade Organization & Tagging**

#### Tag System
- **Setup Tags**: Categorize trades by trading setups (e.g., "Breakout", "Reversal", "Support Bounce")
- **Mistake Tags**: Tag trades with mistakes made (e.g., "Overtrading", "FOMO", "Poor Entry")
- **Custom Tags**: Create and manage your own custom tag lists
- **Tag Management**: Add, remove, and edit tags directly from the trade views
- **Tag-Based Filtering**: Filter and analyze trades by specific tags in the Reports screen

#### Trade Ratings
- **Star Rating System**: Rate trades from 1-5 stars (supports half-star ratings)
- **Visual Feedback**: Gold stars indicate trade quality
- **Persistent Storage**: Ratings are saved per trade and persist across sessions

### 📝 **Notes & Documentation**

#### Daily Notes
- **Rich Text Editor**: Add formatted notes for each trading day using a WYSIWYG editor
- **Date-Specific Notes**: Link notes to specific dates for easy reference
- **Persistent Storage**: Notes are saved to Firebase or localStorage
- **Quick Access**: Add or view notes directly from the Daily Stats screen

### 📅 **Date Range Filtering**

- **Year-to-Date Default**: App defaults to showing current year's data (prevents mixing data from different years)
- **Flexible Date Selection**: 
  - Custom date range picker with calendar interface
  - Quick select options: Today, This Week, This Month, Last 30 Days, Last Month, This Quarter, Year to Date
  - All-time view available by clearing the date filter
- **Real-Time Filtering**: All screens update instantly when date range changes

### 👥 **User Management**

#### Authentication
- **Firebase Authentication**: Secure user authentication system
- **Protected Routes**: All app features require authentication
- **User Profiles**: Individual user accounts with isolated data

#### Admin Features
- **Invitation System**: Admin users can generate invitation codes for new users
- **User Management**: Track and manage invitation code usage

### 🎨 **User Interface**

- **Dark Theme**: Modern dark-themed interface optimized for extended viewing
- **Responsive Design**: Fully responsive layout that works on desktop, tablet, and mobile devices
- **Intuitive Navigation**: Sidebar navigation with tooltips for easy access to all features
- **Visual Feedback**: Color-coded P&L (green for profits, red for losses) throughout the app
- **Interactive Elements**: Hover effects, tooltips, and smooth transitions

### 📤 **Sharing & Export**

- **Shareable Images**: Generate branded images of daily trading performance
- **Download Functionality**: Download share images as PNG files
- **Branded Design**: Images include TradeLens branding and logo

## Technology Stack

- **Frontend Framework**: React 19.0.0
- **Routing**: React Router DOM 7.3.0
- **Charts**: Chart.js 4.4.8 with react-chartjs-2
- **Date Handling**: date-fns 2.30.0
- **File Processing**: xlsx 0.18.5 (Excel/CSV parsing)
- **Backend**: Firebase (Authentication & Firestore)
- **Rich Text Editor**: React Quill
- **Date Picker**: react-date-range
- **Styling**: Styled Components 6.1.15
- **Icons**: React Icons 5.5.0

## Core Functionality

### Trade Processing Logic

The app uses sophisticated algorithms to process raw transaction data:

1. **Transaction Grouping**: Groups transactions by symbol, strike, and expiration
2. **OPEN/CLOSE Matching**: Matches OPEN (buy) transactions with CLOSE (sell) transactions
3. **FIFO Processing**: Uses First-In-First-Out logic to match transactions correctly
4. **P&L Calculation**: Calculates accurate profit/loss using contract multipliers (100 for options)
5. **ROI Calculation**: Computes net ROI percentage for each completed trade
6. **Date Standardization**: Handles various date formats and standardizes them for consistent processing

### Data Flow

1. **Import**: User uploads Excel/CSV file containing trade history
2. **Parsing**: App parses the file and extracts transaction data
3. **Transformation**: Raw data is transformed into structured transaction objects
4. **Processing**: Transactions are grouped and matched to create completed trades
5. **Storage**: Processed trades are saved to Firebase (authenticated) or localStorage (guest)
6. **Filtering**: Date range filters are applied to show relevant trades
7. **Display**: Filtered trades are displayed across various screens with analytics

### Data Persistence

- **Authenticated Users**: All data (trades, tags, ratings, notes) is stored in Firebase Firestore
- **Guest Users**: Data is stored in browser localStorage
- **Automatic Sync**: Changes are automatically saved in real-time
- **Data Isolation**: Each user's data is completely isolated

## File Format Support

The app supports trade data exported from broker platforms in Excel or CSV format. Expected columns include:
- Exec Time
- Trade Date
- Side (BUY/SELL)
- Quantity
- Symbol
- Expiration
- Strike
- Price
- Order Type
- Pos Effect (OPEN/CLOSE)
- Type (CALL/PUT)

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase project with Firestore enabled

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Stockhours-Journal-App/stockhours
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase configuration:
   - Create a `.env` file in the `stockhours` directory
   - Add your Firebase configuration:
   ```
   REACT_APP_FIREBASE_API_KEY=your_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_app_id
   ```

4. Start the development server:
```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
```

## Usage

1. **Sign Up/Login**: Create an account or log in with existing credentials
2. **Import Trades**: Click the "+" button in the sidebar to upload your trade history file
3. **View Dashboard**: Navigate to Dashboard to see overview statistics and calendar
4. **Analyze Daily Stats**: Go to Daily Stats to see day-by-day breakdowns
5. **Review All Trades**: Visit All Trades to see a complete list of all your trades
6. **Generate Reports**: Use the Reports screen for detailed analytics
7. **Tag Trades**: Click the tag icon on any trade to add setup/mistake tags
8. **Add Notes**: Click "Add Note" on any day to add trading notes
9. **Filter by Date**: Use the date range picker to filter trades by specific time periods

## Features by Screen

### Dashboard
- Performance overview with key metrics
- Interactive calendar heatmap
- Cumulative P&L visualization
- Win/loss statistics
- Quick navigation to detailed views

### Daily Stats
- Daily trade summaries
- Intraday P&L charts
- Expandable trade details
- Tag management per trade
- Daily notes
- Share functionality

### All Trades
- Complete trade list with pagination
- Detailed trade view with TradingView charts
- Trade ratings
- Tag management
- Sortable columns

### Reports
- Multiple report types
- Tag-based filtering
- Time-based analysis
- Performance by various attributes
- Interactive charts and visualizations

### Imports
- View uploaded files
- Delete files
- Track file sources

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

See LICENSE file for details.

## Contributing

This is a private project. For questions or issues, please contact the project maintainers.
