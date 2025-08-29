# Ovra Community - Retro Cream Community Platform

## Overview

Ovra Community is a retro-themed Korean social platform designed for users who love vintage aesthetics. The application features a warm cream color palette inspired by retro design patterns, enabling users to share posts, interact through likes and bookmarks, comment on content, and build a community around nostalgic themes. The platform combines modern web technologies with a carefully crafted retro visual design to create an engaging social experience using a modal-based single-page architecture for fast navigation.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### Latest modifications with dates

**August 26, 2025:**
- Enhanced main screen filter buttons (전체, 팔로잉, 옴표) with improved design and state management
- Implemented functional following filter that queries posts from followed users
- Improved quote button design with enhanced 3D visual effects and better user interaction
- Updated settings modal with improved UI sections and better organization
- Enhanced DotPet (도토) functionality with better visual effects and interactions
- Applied comprehensive button and icon size improvements across the platform
- Synchronized quoted post card appearance with preview design for consistency

**January 25, 2025:**
- Removed personality assessment/성격테스트 feature completely from navigation and backend
- Converted to modal-based single-page application (SPA) architecture
- Eliminated URL navigation for core features (explore, profile, friends) using state-based modals
- Enhanced CreatePostModal error handling for better user experience
- Implemented fast logic processing with instant modal access from both desktop and mobile navigation

## System Architecture

### Frontend Architecture
The client-side is built using **React 18** with **TypeScript** for type safety and modern development practices. The application uses **Vite** as the build tool for fast development and optimized production builds. State management is handled through **TanStack Query** (React Query) for server state management, providing caching, background updates, and optimistic updates.

**UI Framework**: The application leverages **shadcn/ui** components built on top of **Radix UI** primitives, providing accessible and customizable UI components. **Tailwind CSS** is used for styling with a custom retro cream color palette defined in CSS variables.

**Routing**: Client-side routing is implemented using **wouter**, a lightweight routing library that provides simple declarative routing without the complexity of larger routing solutions.

**Layout Strategy**: The application uses a modal-based single-page architecture with responsive layout that adapts between mobile and desktop views. All features (explore, profile viewing, friends management) are accessible through modals without URL navigation for fast user experience. On mobile, it uses a tab-based navigation at the bottom, while desktop users get a three-column layout with navigation, main content, and sidebar.

### Backend Architecture
The server is built with **Express.js** providing RESTful API endpoints. The application follows a clean separation between routes, storage layer, and authentication middleware.

**Authentication**: Integration with **Replit Auth** using OpenID Connect (OIDC) for user authentication. The system includes session management with PostgreSQL session storage and proper middleware for protecting authenticated routes.

**API Design**: RESTful endpoints organized around resources (posts, users, comments, likes, bookmarks) with consistent error handling and JSON responses. The API supports features like pagination, search, and filtering.

### Data Storage
**Database**: Uses **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations. The database schema includes tables for users, posts, comments, likes, bookmarks, follows, and session storage.

**Schema Design**: The database is designed with proper relationships between entities, foreign key constraints, and indexes for performance. User sessions are stored in PostgreSQL for persistence across server restarts.

**Connection Management**: Uses **Neon Database** serverless PostgreSQL with connection pooling for efficient database connections in a serverless environment.

### Authentication and Authorization
**Provider**: Replit Auth integration with OpenID Connect for seamless authentication within the Replit ecosystem. Users authenticate using their Replit accounts without additional registration.

**Session Management**: Server-side sessions stored in PostgreSQL with configurable TTL and secure cookie settings. Sessions include user information and are validated on protected routes.

**Middleware**: Authentication middleware protects API endpoints and provides user context to route handlers. Unauthorized requests are handled gracefully with appropriate error responses.

### External Dependencies

**Authentication Service**: Replit Auth (OpenID Connect) for user authentication and identity management

**Database**: Neon Database (serverless PostgreSQL) for persistent data storage with automatic scaling

**UI Components**: Radix UI primitives for accessible, unstyled UI components that form the foundation of the design system

**Styling**: Tailwind CSS for utility-first styling with custom retro cream color palette

**Icons**: Bootstrap Icons for consistent iconography throughout the application

**Fonts**: Google Fonts (Quicksand and Nunito) for typography that matches the retro aesthetic

**Development Tools**: 
- TypeScript for type safety and better developer experience
- Vite for fast development and optimized builds
- Drizzle Kit for database migrations and schema management
- TanStack Query for server state management and caching

**External Libraries**:
- date-fns for date formatting and manipulation
- Day.js for lightweight date operations (loaded via CDN)
- Swiper.js for carousel functionality (loaded via CDN)
- Various Radix UI components for accessible UI primitives