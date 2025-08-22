# 🚀 GhostOps Website Automation Package

A modern, cyberpunk-styled website automation system built with Node.js, Express, and Playwright. Features a sleek, matrix-inspired interface with real-time automation control.

## ✨ Features

### 🎨 **Modern GhostOps UI**

-   **Cyberpunk Design**: Dark theme with neon accents and matrix rain effects
-   **Responsive Layout**: Sidebar navigation with glass-morphism effects
-   **Theme Engine**: 5 built-in themes with auto-rotation
-   **Real-time Updates**: Live console, progress ring, and status monitoring

### 🤖 **Automation Capabilities**

-   **Multi-URL Support**: Automate multiple websites simultaneously
-   **Browser Profiles**: Multiple browser instances per website
-   **Cycle Management**: Configurable automation cycles
-   **Real-time Logging**: Live profile status and console output
-   **Smart Timing**: Configurable session durations and timeouts

### 🛠️ **Technical Features**

-   **Playwright Integration**: Chromium, Firefox, and WebKit support
-   **Server-Sent Events**: Real-time communication
-   **Browser Fingerprinting**: Anti-detection capabilities
-   **Human Behavior Simulation**: Realistic user interactions

## 🚀 Quick Start

### Prerequisites

-   Node.js 18+
-   npm or yarn

### Installation

```bash
git clone <repository-url>
cd adsterra_automation
npm install
npm start
```

### Access the UI

Open your browser and navigate to: `http://localhost:3000`

## 🎯 UI Overview

### **Dashboard Panel**

-   **Live Console**: Real-time automation logs
-   **Automation Status**: Current progress and cycle information
-   **System Info**: Node.js and Playwright versions, latency

### **Automation Panel**

-   **Configuration**: Timeout, session duration, and other settings
-   **Summary**: Total websites, profiles, and sessions overview

### **Logs Panel**

-   **Profile Logs**: Individual profile status and logs
-   **Real-time Updates**: Live status changes and progress

### **Settings Panel**

-   **Server Configuration**: Connection settings and preferences
-   **Theme Selection**: Choose from 5 built-in themes

## 🎨 Theme System

The UI includes 5 pre-built themes:

1. **Aqua Neon** - Classic cyberpunk with cyan accents
2. **Cyber Magenta** - Vibrant pink and purple
3. **Lime Matrix** - Green terminal aesthetic
4. **Violet Storm** - Deep purple and blue
5. **Amber Pulse** - Warm orange and amber

Themes auto-rotate every 12 seconds, or manually select using the theme dots in the sidebar.

## 🔧 Configuration

### **Basic Settings**

-   **Target URLs**: Add multiple websites to automate
-   **Browser**: Choose between Chromium, Firefox, or WebKit
-   **Profiles per Website**: Number of concurrent browser instances
-   **Cycles**: Total automation cycles to run

### **Advanced Settings**

-   **Loading Timeout**: Maximum time to wait for page load (30-300s)
-   **Session Duration**: Min/max time profiles stay on websites (30-230s)
-   **Smart Logic**: Max duration automatically adjusts based on min duration

## 📊 Automation Workflow

1. **Configure URLs**: Add target websites in the toolbar
2. **Set Parameters**: Choose browser, profiles, and cycles
3. **Review Summary**: Check total profiles and sessions
4. **Start Automation**: Click "Start" to begin
5. **Monitor Progress**: Watch real-time updates in the dashboard
6. **View Results**: Check logs panel for detailed profile information

## 🎭 UI Features

### **Matrix Rain Effect**

-   Animated Japanese characters falling in the background
-   Theme-aware colors that match the current accent
-   Subtle opacity for non-intrusive visual appeal

### **Glass Morphism**

-   Semi-transparent panels with backdrop blur
-   Subtle borders and shadows
-   Modern, depth-based design language

### **Responsive Design**

-   Mobile-friendly layout
-   Collapsible sidebar on smaller screens
-   Adaptive grid layouts

## 🔌 Integration

### **Backend API**

-   `/open-url` - Start automation
-   `/automation-status` - Get current status
-   `/stop-automation` - Stop running automation
-   `/log-stream` - Real-time log streaming

### **Frontend JavaScript**

-   Modular architecture with separate files for UI, logs, automation, and validation
-   Event-driven updates via Server-Sent Events
-   Theme engine with CSS custom properties

## 🚨 Troubleshooting

### **Common Issues**

1. **Server not starting**: Check Node.js version and port availability
2. **UI not loading**: Verify all JavaScript files are accessible
3. **Automation failing**: Check browser installation and permissions

### **Debug Mode**

-   Open browser console for detailed logs
-   Check server console for backend errors
-   Verify SSE connection status in the sidebar

## 🎨 Customization

### **Adding New Themes**

1. Add theme object to `THEMES` array in `app.js`
2. Define color variables (bg1, bg2, accent, text, muted)
3. Theme will automatically appear in the theme rotator

### **Modifying Styles**

-   CSS variables in `:root` for easy color changes
-   Glass morphism effects in `.glass` class
-   Animation keyframes for custom effects

## 📱 Browser Support

-   **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+
-   **CSS Features**: CSS Grid, Flexbox, Backdrop Filter
-   **JavaScript**: ES2020+ features with fallbacks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ using Node.js, Express, Playwright, and modern web technologies**
