# Owshi Enterprise – Android Transport Management App

এটি Expo + React Native ভিত্তিক Android অ্যাপের প্রজেক্ট। SQLite দিয়ে ফোনে অফলাইন ডেটা সংরক্ষণ করে। Supabase কনফিগার করলে ক্লাউড লগইন ও রেকর্ড আপলোডের ভিত্তি প্রস্তুত থাকে।

## অন্তর্ভুক্ত মডিউল
- লগইন স্ক্রিন ও Admin demo login
- বাংলা / English UI toggle
- ড্যাশবোর্ড: ট্রিপ, ভাড়া, অগ্রিম, বকেয়া, খরচ, নিট হিসাব
- ট্রিপ এন্ট্রি: ভাড়া, অগ্রিম, ফ্রি দিন, ডেমারেজ দিন ও দৈনিক রেট
- পার্টি তালিকা
- গাড়ির তালিকা ও কাগজপত্রের মেয়াদ
- গাড়ির মেরামত, গ্যারেজ/ওয়ার্কশপ বিল
- ড্রাইভার/হেলপার বিল
- ডকুমেন্ট রেকর্ড
- ডেমারেজ ক্যালকুলেটর
- প্রাথমিক রিপোর্ট
- ক্লাউড সিঙ্কের সংযোগ কাঠামো

## Android মোবাইল থেকে APK বানানো
1. GitHub-এ একটি নতুন repository খুলে এই ZIP-এর ফাইলগুলো আপলোড করুন।
2. Expo account তৈরি করুন: https://expo.dev
3. কম্পিউটার থাকলে Node.js ইনস্টল করে:
   - `npm install`
   - `npx expo install`
   - `npx eas-cli build:configure`
   - `npx eas-cli build -p android --profile preview`
4. শুধু Android ফোন ব্যবহার করলে GitHub Codespaces বা Replit-এর মতো browser IDE-তে প্রজেক্ট খুলে একই কমান্ড চালাতে পারেন। Expo EAS build ক্লাউডে APK তৈরি করবে।

## ডেমো লগইন
- User ID: `admin`
- Password: `123456`

**সতর্কতা:** ডেমো লগইন কেবল প্রাথমিক পরীক্ষা করার জন্য। ব্যবসার বাস্তব তথ্য ব্যবহারের আগে Supabase Authentication ও ব্যবহারকারী role policy কনফিগার করুন এবং demo login সরিয়ে দিন।

## Supabase ক্লাউড সেটআপ
1. https://supabase.com এ ফ্রি প্রজেক্ট তৈরি করুন।
2. Project URL এবং anon key `.env` ফাইলে দিন (`.env.example` কপি করে `.env` নাম দিন)।
3. Supabase SQL Editor-এ `supabase.sql` চালান।
4. Supabase Authentication থেকে Admin, Accounts ও Manager-এর জন্য পৃথক email/password user তৈরি করুন।
5. প্রতিটি user-এর User Metadata-তে `role` দিন: `Admin`, `Accounts`, অথবা `Manager`।
6. নতুন build তৈরি করুন।

## গুরুত্বপূর্ণ সীমাবদ্ধতা / পরবর্তী উন্নয়ন
এই প্রথম প্রজেক্ট সংস্করণে SQLite-এ অফলাইন রেকর্ড তৈরি হয় এবং Supabase সেটআপ থাকলে নতুন রেকর্ড ক্লাউডে পাঠানোর প্রাথমিক ব্যবস্থা আছে। পূর্ণ দ্বিমুখী sync, conflict resolution, role অনুযায়ী screen/action permission, PDF/Excel export, document photo upload এবং production-grade security এখনো সম্পূর্ণ করা হয়নি। ব্যবসার আসল ডেটা ব্যবহারের আগে এগুলো সম্পন্ন ও পরীক্ষা করতে হবে।
