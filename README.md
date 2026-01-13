# SurakshaMap - Community-Powered Safety Network

## Description

SurakshaMap is a map-based safety platform for India that enables users to report and track local safety issues including crimes, missing persons, dog attacks, hazards, and natural disasters with periodic updates.

Users can pin incidents on a map, add proof, and help verify reports through community voting. Police and local authorities get a dedicated dashboard to view reports, take action, and update status, making safety information transparent, reliable, and actionable.

## Demo Video Link

https://drive.google.com/file/d/161ZmOWhMu1lNs_hObF2AAUnK-d6_-_Hd/view?usp=sharing

## Deployment Link
https://winterhackathon-coral.vercel.app/

## Features

### For Citizens

- **Location-Based Incident Reporting** - Pin incidents directly on an interactive map with detailed information and optional proof uploads (images)
- **Interactive Map View** - Visualize all reported incidents across India with color coded markers based on status and priority levels
- **Community Verification System** - Upvote or downvote reports based on proximity and knowledge, ensuring accuracy through crowd-sourced validation
- **Multiple Incident Categories** - Report crimes, missing persons, dog attacks, hazards, and natural disasters
- **Priority Levels** - Incidents automatically categorized as Critical, High, Medium, or Low priority
- **Proof Upload** - Attach evidence images to reports for verification
- **User Authentication** - Secure registration and login system with profile management
- **Status Tracking** - Track incident resolution from Pending to In-Progress to Resolved

### For Institutions (Police/Municipal Bodies)

- **Institutional Dashboard** - Comprehensive overview of all community reports with filtering and search capabilities
- **Report Management** - Review detailed incident information including proof images, location, and community votes
- **Assignment System** - Assign reports to specific officers or teams
- **Status Updates** - Update incident status (Pending, In-Progress, Under Review, Resolved, Closed)
- **Internal Notes** - Add institution specific notes for case management
- **Map Visualization** - View all reports on an interactive map with filtering options
- **Search & Filter** - Search by category, location, or status; filter by incident type
- **Statistics Dashboard** - View total reports, pending actions, in-progress cases, and resolved incidents

### Additional Features

- **Auto-Refresh** - Reports automatically refresh every 30 seconds using polling for periodic updates
- **Geolocation Support** - Automatic location detection for accurate incident reporting
- **Address Geocoding** - Convert addresses to coordinates for map placement
- **Image Storage** - Secure cloud-based image storage with public access URLs

## Tech Stack

### Frontend

- **React 19** - Modern UI library for building interactive user interfaces
- **Vite 7** - Fast build tool and development server
- **React Router v7** - Client-side routing and navigation
- **Tailwind CSS 4** - Utility-first CSS framework for responsive design
- **Axios** - HTTP client for API communication
- **@vis.gl/react-google-maps** - React components for Google Maps integration

### Backend

- **Node.js** - JavaScript runtime for server-side applications
- **Express.js 5** - Web application framework for building REST APIs
- **MongoDB (Mongoose 9)** - NoSQL database for flexible data storage
- **JWT (jsonwebtoken)** - Secure authentication and authorization
- **bcryptjs** - Password hashing for user security
- **Multer** - Middleware for handling multipart/form-data file uploads
- **Firebase Admin SDK** - Server-side Firebase integration
- **CORS** - Cross-Origin Resource Sharing middleware
- **dotenv** - Environment variable management

## Google Technologies Used

### Firebase Storage

**Why**: Firebase Storage provides a secure, scalable, and reliable cloud storage solution for user-uploaded proof images. We chose Firebase Storage because:

- **Public URLs**: Automatically generates publicly accessible URLs for images, enabling all users and institutions to view uploaded evidence
- **Scalability**: Handles unlimited file uploads without infrastructure management
- **Security**: Built-in security rules and authentication integration
- **Performance**: Global CDN ensures fast image loading across India
- **Cost-Effective**: Pay-as-you-go pricing model suitable for growing platforms

### Google Maps API

**Why**: Google Maps API is essential for our location-based safety platform. We use it because:

- **Interactive Mapping**: Provides rich, interactive maps with custom markers and info windows
- **Geocoding Service**: Converts addresses to coordinates and vice versa for accurate location tracking
- **Marker Customization**: Allows color-coded pins based on incident status and priority levels
- **Geolocation**: Enables automatic user location detection for proximity-based features
- **Coverage**: Comprehensive mapping data for all regions across India
- **Reliability**: Industry-leading uptime and accuracy for critical safety information
- **User Experience**: Familiar interface that users already trust and understand

### Implementation Details

- **Firebase Storage Integration**: Images uploaded via multipart/form-data are processed by Multer, then uploaded to Firebase Storage buckets with unique filenames. Public URLs are stored in MongoDB for retrieval.
- **Google Maps Integration**: Using @vis.gl/react-google-maps library for React components with Advanced Markers, custom pins, info windows, and real-time incident visualization.

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or MongoDB Atlas)
- Firebase Project with Storage enabled
- Google Maps API Key

### 1. Clone the repository

```bash
git clone https://github.com/Shivambhandary75/WinterHackathon-Vajra.git
cd WinterHackathon-Vajra
```

### 2. Install Dependencies

#### Backend Setup

```bash
cd server
npm install
```

#### Frontend Setup

```bash
cd ../client
npm install
```

### 3. Environment Variables

#### Backend (.env file in server directory)

```env
PORT=8080
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Firebase Configuration
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
```

#### Frontend (.env file in client directory)

```env
VITE_API_URL=http://localhost:8080/api
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 4. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firebase Storage
3. Generate a service account key (Project Settings > Service Accounts > Generate New Private Key)
4. Add the credentials to your backend .env file

### 5. Google Maps API Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Maps JavaScript API and Geocoding API
4. Create an API key and add it to your frontend .env file

### 6. Run the Project

#### Start Backend Server

```bash
cd server
npm run dev
# Server runs on http://localhost:8080
```

#### Start Frontend Development Server

```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

### 7. Access the Application

- **User Portal**: http://localhost:5173

### Default Accounts

After setting up, you can register new users or institutions through the registration pages.



## Team Members

- [Shivam S](https://github.com/Shivambhandary75/) -Fullstack
- [Prasad](https://github.com/prasadnaik12p) - Fullstack
- [Sharan Lenwin Correa](https://github.com/Sharan-d-oss) -Frontend
