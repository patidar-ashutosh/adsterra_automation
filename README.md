# 🚀 Adsterra Automation - Multiple URL Support

## ✨ New Features

### 🔗 Multiple URL Management

-   **Add unlimited URLs**: Add as many blog URLs as you want to automate
-   **Dynamic URL management**: Add/remove URLs on the fly with intuitive buttons
-   **URL validation**: Real-time validation with visual feedback
-   **Smart distribution**: Profiles are automatically distributed across all URLs

### 📊 Enhanced Profile Management

-   **Profiles per URL**: Configure how many profiles run for each URL simultaneously
-   **Total profiles calculation**: Automatic calculation of total profiles and windows
-   **URL-aware logging**: Each profile shows which URL it's working on
-   **Real-time status**: Live updates showing URL distribution and progress

### 🎨 Improved User Interface

-   **Modern design**: Beautiful glassmorphism interface with smooth animations
-   **Responsive layout**: Works perfectly on desktop and mobile devices
-   **Visual feedback**: Color-coded URL validation and status indicators
-   **Smart summaries**: Real-time calculation of total automation scope

## 🚀 How to Use Multiple URLs

### 1. Adding URLs

-   Click the **"+ Add Another URL"** button to add new URL inputs
-   Each URL input has real-time validation
-   Invalid URLs show red borders, valid URLs show green borders

### 2. URL Configuration

-   **Profiles per URL**: Set how many profiles run for each URL simultaneously
-   **Cycles**: Set how many times the entire automation runs
-   **Total calculation**: Automatically calculates total profiles and windows

### 3. Example Scenarios

#### Scenario 1: 3 URLs, 2 Profiles Each, 3 Cycles

-   **Total URLs**: 3
-   **Profiles per URL**: 2
-   **Total Profiles**: 6
-   **Total Windows**: 18 (6 profiles × 3 cycles)

#### Scenario 2: 5 URLs, 1 Profile Each, 2 Cycles

-   **Total URLs**: 5
-   **Profiles per URL**: 1
-   **Total Profiles**: 5
-   **Total Windows**: 10 (5 profiles × 2 cycles)

### 4. Profile Distribution

Profiles are distributed across URLs in a round-robin fashion:

-   Profile 1 → URL 1
-   Profile 2 → URL 2
-   Profile 3 → URL 3
-   Profile 4 → URL 1 (if more than 3 profiles)
-   And so on...

## 🔧 Technical Implementation

### Backend Changes

-   **Multiple URL support**: Backend now accepts arrays of URLs
-   **Profile distribution**: Each profile is assigned to a specific URL
-   **Enhanced logging**: Logs now include URL index and profile number
-   **Backward compatibility**: Still supports single URL mode

### Frontend Changes

-   **Dynamic URL inputs**: Add/remove URL fields dynamically
-   **Real-time validation**: URL format validation with visual feedback
-   **Smart summaries**: Automatic calculation of automation scope
-   **Enhanced monitoring**: Better profile tracking with URL information

## 📱 User Interface Features

### URL Management

-   **Add URL button**: Blue button to add new URL inputs
-   **Remove URL button**: Red × button to remove URLs (hidden for single URL)
-   **URL validation**: Real-time validation with color-coded feedback
-   **Combined preview**: Shows all combined URLs with proxy

### Profile Monitoring

-   **URL info display**: Each profile shows which URL it's working on
-   **Status indicators**: Color-coded status for each profile
-   **Real-time logs**: Live updates from each profile
-   **Progress tracking**: Visual progress bars and status summaries

### Responsive Design

-   **Mobile-friendly**: Optimized for all screen sizes
-   **Touch-friendly**: Easy to use on mobile devices
-   **Adaptive layout**: Automatically adjusts to screen dimensions

## 🚨 Important Notes

### Limits and Validation

-   **Maximum windows**: Limited to 200 total windows for performance
-   **URL validation**: All URLs must be properly formatted
-   **Required fields**: At least one URL is required to start automation

### Performance Considerations

-   **Browser instances**: Each profile opens a separate browser instance
-   **Memory usage**: Multiple profiles increase memory consumption
-   **Network load**: Multiple URLs increase network traffic

## 🔄 Migration from Single URL

The system maintains full backward compatibility:

-   **Single URL mode**: Still works exactly as before
-   **Multiple URL mode**: New functionality for advanced users
-   **Automatic detection**: System automatically detects single vs. multiple URLs

## 🎯 Use Cases

### Content Creators

-   Automate multiple blogs simultaneously
-   Distribute traffic across different content
-   Manage multiple projects efficiently

### Marketing Agencies

-   Run campaigns across multiple websites
-   A/B test different landing pages
-   Scale automation across client portfolios

### SEO Professionals

-   Monitor multiple domains
-   Test different content strategies
-   Analyze traffic patterns across sites

## 🚀 Future Enhancements

-   **URL groups**: Group URLs by category or purpose
-   **Scheduling**: Set different automation schedules per URL
-   **Priority levels**: Assign priority to different URLs
-   **Advanced analytics**: Detailed reporting per URL
-   **Template management**: Save and reuse URL configurations

---

## 📞 Support

For questions or issues with the multiple URL functionality, please check:

1. URL format validation
2. Profile and cycle limits
3. Browser compatibility
4. System resources

The multiple URL feature is designed to be intuitive and powerful while maintaining the reliability of the original single URL system.
