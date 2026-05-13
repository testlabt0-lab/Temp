# Delivery App Project

This repository contains the source code for a complete restaurant delivery system built to be scalable and secure. It is composed of three main parts, utilizing **Supabase** as the unified Backend-as-a-Service (BaaS).

## Architecture & Tech Stack

1. **Backend & Database:** Supabase (PostgreSQL, Auth, Realtime)
   - Handles Row Level Security (RLS) to ensure drivers, customers, and restaurants only access their own data.
   - Real-time updates for order tracking.
2. **Dashboard & Restaurant Panel:** Next.js, TailwindCSS
   - Fast, modern web application for admins and restaurant owners to manage orders and menus.
3. **Customer Mobile App:** React Native (Expo)
   - Cross-platform app (iOS & Android) for customers to browse restaurants, view menus, and place orders.
4. **Driver Mobile App:** React Native (Expo)
   - Cross-platform app for drivers to view available orders, accept them, and update delivery status.

## Project Structure

- `/supabase`: Contains the SQL schema `schema.sql` and database architecture. Run this script in your Supabase SQL editor to create all tables and policies.
- `/dashboard`: Next.js web application.
- `/customer-app`: Expo application for Customers.
- `/driver-app`: Expo application for Drivers.

## Getting Started

### 1. Backend Setup
1. Create a project on [Supabase](https://supabase.com/).
2. Go to the SQL Editor and paste the contents of `/supabase/schema.sql`.
3. Run the query to set up tables, types, and RLS policies.
4. Go to Project Settings -> API and copy your `Project URL` and `anon public` key.

### 2. Running the Web Dashboard (Next.js)
1. Navigate to `/dashboard`:
   `cd dashboard`
2. Create a `.env.local` file and add your Supabase credentials:
   `NEXT_PUBLIC_SUPABASE_URL=your_supabase_url`
   `NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`
3. Run the development server using npm scripts.

### 3. Running the Customer App (React Native/Expo)
1. Navigate to `/customer-app`:
   `cd customer-app`
2. Create a `.env` file and add your Supabase credentials:
   `EXPO_PUBLIC_SUPABASE_URL=your_supabase_url`
   `EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`
3. Start Expo.

### 4. Running the Driver App (React Native/Expo)
1. Navigate to `/driver-app`:
   `cd driver-app`
2. Create a `.env` file and add your Supabase credentials:
   `EXPO_PUBLIC_SUPABASE_URL=your_supabase_url`
   `EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key`
3. Start Expo.

## Development Time & Cost
This structure is a solid Minimal Viable Product (MVP) designed to be built in 5 days. It relies on standard, production-ready BaaS solutions to drastically reduce development time while maintaining security and performance.
