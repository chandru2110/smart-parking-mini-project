# 🚗 Smart Parking Demo

A modern, AI-powered Smart Parking Management System built with React, Node.js, and real-time WebSocket technology.

![Smart Parking System](https://img.shields.io/badge/Smart-Parking-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![React](https://img.shields.io/badge/React-18+-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue.svg)
![SQLite](https://img.shields.io/badge/SQLite-3+-orange.svg)

## 🌟 Features

### 🎯 Core Functionality
- **Real-time Parking Slot Management** - Live status updates via WebSocket
- **Interactive Dashboard** - Comprehensive parking statistics and insights
- **Reservation System** - Book parking slots in advance
- **Zone Management** - Organized parking areas with different zones
- **Activity Logging** - Track all parking operations and changes

### 📊 Analytics & Monitoring
- **Occupancy Statistics** - Real-time occupancy rates and trends
- **Zone Analytics** - Per-zone performance metrics
- **Historical Data** - Activity logs and usage patterns
- **Live Updates** - WebSocket-powered real-time data synchronization

### 🎨 Modern UI/UX
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark/Light Theme** - User preference-based theme switching
- **Component Library** - Built with Radix UI and Tailwind CSS
- **Real-time Notifications** - Toast notifications for user actions

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **TanStack Query** - Powerful data synchronization
- **Wouter** - Lightweight client-side routing

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **TypeScript** - Full-stack type safety
- **WebSocket** - Real-time communication
- **Drizzle ORM** - Type-safe database operations

### Database
- **SQLite** - Local development database
- **PostgreSQL** - Production database support (via Neon)
- **Real-time Sync** - Live data updates across clients

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smart-parking-demo.git
   cd smart-parking-demo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   http://localhost:5000
   ```

## 📁 Project Structure

```
smart-parking-demo/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Application pages/routes
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/          # Utilities and configurations
├── server/                # Node.js backend
│   ├── db.ts             # Database configuration
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Data access layer
│   └── index.ts          # Server entry point
├── shared/               # Shared types and schemas
│   ├── schema.ts         # PostgreSQL schema
│   └── schema-sqlite.ts  # SQLite schema
└── package.json         # Project dependencies
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run check` - TypeScript type checking
- `npm run db:push` - Push database schema changes

## 🌐 API Endpoints

### Zones
- `GET /api/zones` - Get all parking zones
- `POST /api/zones` - Create new zone
- `GET /api/zones/:id` - Get specific zone

### Parking Slots
- `GET /api/slots` - Get all parking slots
- `GET /api/slots/available` - Get available slots
- `PATCH /api/slots/:id` - Update slot status
- `POST /api/slots` - Create new slot

### Reservations
- `GET /api/reservations` - Get all reservations
- `POST /api/reservations` - Create new reservation
- `DELETE /api/reservations/:id` - Cancel reservation

### Analytics
- `GET /api/stats` - Get occupancy statistics
- `GET /api/stats/zones` - Get zone-wise statistics
- `GET /api/activity` - Get activity logs

## 📊 Sample Data

The application initializes with sample data:
- **3 Zones**: Zone A (50 slots), Zone B (30 slots), Zone C (40 slots)
- **120 Parking Slots** total with realistic occupancy distribution
- **Real-time simulation** of parking activities

## 🔄 Real-time Features

- **WebSocket Connection** - Live updates across all connected clients
- **Automatic Slot Updates** - Simulated parking activities every 8-16 seconds
- **Live Statistics** - Real-time occupancy and availability metrics
- **Instant Notifications** - Immediate feedback for user actions

## 🚀 Deployment

### Local Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
```env
DATABASE_URL=your_postgresql_connection_string
PORT=5000
NODE_ENV=production
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Built with modern web technologies
- Inspired by real-world parking management needs
- Designed for scalability and maintainability

---

**Made with ❤️ for smart city solutions**