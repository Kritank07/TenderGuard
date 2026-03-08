# TenderGuard

## Transparent & Intelligent Tender Monitoring System

TenderGuard is a **smart tender transparency platform** designed to reduce corruption, detect suspicious bidding behavior, and improve accountability in government infrastructure projects.

The system uses **AI-powered risk detection and cartel detection** to identify irregularities in tender bidding and ensures that tender information remains transparent and accessible to the public.

---

# Problem Statement

Government tender systems often suffer from:

- Corruption and political influence
- Cartel formation among contractors
- Lack of transparency in bidding
- Limited public awareness about ongoing infrastructure work
- Poor monitoring of infrastructure projects

These issues lead to **misuse of public funds, poor infrastructure quality, and lack of accountability**.

TenderGuard aims to solve these problems using **modern web technologies and AI-driven insights**.

---

# Solution

TenderGuard provides a **digital tender monitoring and bidding platform** that:

- Publishes tender details transparently
- Allows contractors to submit bids securely
- Uses **AI to detect potential risks and cartel behavior**
- Allows citizens to monitor infrastructure projects near them
- Provides location-based visualization of projects on a map

The platform promotes **transparency, accountability, and fair competition**.

---

# Key Features

## Transparent Tender Listings

Authorities can publish tenders including:

- Project Name
- Budget
- Location
- Deadline
- Description

Citizens can view all tender details publicly.

---

## Secure Digital Bidding

Contractors can:

- Register on the platform
- View available tenders
- Submit bids securely

All bids are stored in the database for monitoring and analysis.

---

## AI-Based Risk Detection

The platform uses **Google Gemini API** to analyze bids and detect potential risks such as:

- Suspiciously similar bid values
- Unusual bidding patterns
- Unrealistic pricing
  

AI generates a **risk analysis report** for each tender.

---

## Cartel Detection

Using **Google Generative AI**, the system detects possible cartel behavior by analyzing:

- Repeated contractors bidding together
- Similar pricing patterns
- Consistent winning rotation among contractors

The AI highlights potential **collusive bidding networks**.

---

## Location-Based Tender Visualization

Using **Leaflet.js**, the system displays:

- Tender project locations
- Infrastructure work areas
- Interactive map markers

This helps citizens easily see **what projects are happening around them**.

---

## Document Upload System

Using **Multer**, contractors and administrators can upload:

- Tender documents
- Project files
- Bid attachments

All files are securely stored and linked to their respective tenders.

---

## Role-Based Access Control

### Admin
- Create and manage tenders
- Monitor bids
- View AI risk reports

### Contractor
- View tenders
- Submit bids
- Upload documents

### Citizen/User
- View tenders
- Track infrastructure projects
- Monitor transparency
- Report issues / complaints

---

# Tech Stack

## Frontend
- React.js
- HTML
- CSS
- JavaScript
- Leaflet.js (Map visualization)

---

## Backend
- Node.js
- Express.js

---

## Database
- MongoDB
- Mongoose

---

## AI & APIs
- Google Gemini API
- Google Generative AI

Used for:

- Risk Detection
- Cartel Detection
- Bid Pattern Analysis

---

## File Handling
- Multer (File Uploads)

---

## Authentication
- JWT (JSON Web Token)

---

# System Architecture

```
User
   |
Frontend (React + Leaflet)
   |
API Layer (Node.js + Express)
   |
Authentication (JWT)
   |
Database (MongoDB)
   |
AI Analysis Layer
   |
Google Gemini API
```

---

# Project Structure

```
TenderGuard
│
├── client
│   ├── components
│   ├── pages
│   ├── services
│   └── App.js
│
├── server
│   ├── models
│   │   ├── User.js
│   │   ├── Tender.js
│   │   └── Bid.js
│   │
│   ├── routes
│   │   ├── authRoutes.js
│   │   ├── tenderRoutes.js
│   │   └── bidRoutes.js
│   │
│   ├── controllers
│   ├── middleware
│   │   └── authMiddleware.js
│   │
│   ├── services
│   │   └── geminiService.js
│   │
│   ├── uploads
│   └── server.js
│
├── .env
├── package.json
└── README.md
```

---

# Installation & Setup

## 1 Clone Repository

```bash
git clone https://github.com/yourusername/tenderguard.git
cd tenderguard
```

---

## 2 Install Dependencies

Backend:

```bash
cd server
npm install
```

Frontend:

```bash
cd client
npm install
```

---

## 3 Environment Variables

Create a `.env` file inside the server directory.

```
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/tenderguard
JWT_SECRET=your_secret_key
GEMINI_API_KEY=your_google_gemini_api_key
```

---

## 4 Run Backend

```bash
node server.js
```

or

```bash
nodemon server.js
```

---

## 5 Run Frontend

```bash
npm start
```

---

# Future Enhancements

- Blockchain-based tender verification
- Integration with digital identity systems
- Mobile application


---

# Use Cases

- Government procurement transparency
- Infrastructure monitoring
- Anti-corruption systems
- Smart city governance

---

# Contributors

Tanu Choudhary  
Lovneesh Agrawal
Kritank Jain

---

