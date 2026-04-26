You are a senior React Native (Expo) mobile UI/UX engineer. Build a **production-ready, modern, animated mobile app UI** for a product called **"KODA"**.

This is a **high-quality, premium app UI**, not a basic prototype.

---

# 🎯 APP PURPOSE

A social productivity app where users:

- track study/productivity
- manage subjects and chapters
- use a focus timer
- view analytics
- interact socially (community, doubts)
- track progress and ranking

---

# 🧠 CORE ARCHITECTURE

## 🔐 AUTH FIRST (MANDATORY FLOW)

Flow:
Splash → Login/Signup → Main App

---

## 📱 MAIN APP STRUCTURE

Use **Bottom Tab Navigation (ONLY 5 tabs)**:

1. Home
2. Subjects
3. Timer
4. Community
5. Profile

---

## 📄 INTERNAL SCREENS (STACK)

- Chapters Screen
- Analytics Screen
- Doubt Detail Screen
- Leaderboard Screen
- Edit Profile Screen
- Add Subject Modal
- Add Chapter Modal

---

# 🧭 NAVIGATION STRUCTURE

Use:

- React Navigation

Structure:

Root Stack:

- Splash
- Auth Stack
- App Tabs

Auth Stack:

- Login
- Signup

App Tabs:

- Tab Navigator (5 tabs)

Each tab uses Stack Navigator for internal pages

---

# 🎨 DESIGN SYSTEM (KODA STYLE)

## Colors:

- Primary: #2FA36B
- Accent: #22C55E
- Background: #F8FAF8
- Card: #FFFFFF
- Text Primary: #111827
- Text Secondary: #6B7280
- Border: #E5E7EB

---

## Typography:

- Rounded modern font
- Heading: Bold
- Body: Medium
- Small: Light

---

## UI Style:

- Soft shadows
- Rounded corners (16px+)
- Clean spacing
- Minimal clutter
- Glassmorphism (optional subtle)

---

# 📁 STYLING ARCHITECTURE (MANDATORY)

Create a **central styling system**:

src/styles/

- colors.js
- spacing.js
- typography.js
- shadows.js
- globalStyles.js
- components.js (buttons, cards)

❌ Avoid inline styles
✅ Use reusable styles everywhere

---

# 🚫 SCROLL RULE

- Avoid long vertical scroll
- Use:
  - horizontal FlatList
  - swipe cards
  - paginated sections
  - tab switching

---

# ✨ ANIMATION SYSTEM (VERY IMPORTANT)

Use:

- react-native-reanimated
- moti

Implement:

### Micro interactions:

- Button press → scale (0.95)
- Card → slight lift on press
- Toggle → smooth switch

---

### Screen transitions:

- Fade + slide
- Shared element transitions (if possible)

---

### Progress animations:

- Progress bars animate on load
- Timer circular animation

---

### Special animations:

- Streak flame 🔥 pulse
- Leaderboard rank movement
- Avatar glow effect

---

# 📱 SCREEN DETAILS

---

## 🟢 Splash Screen

- Center logo (KODA)
- Fade + scale animation
- Background gradient

---

## 🔐 Login Screen

- Clean form
- Email + password
- Google login button
- Smooth keyboard handling
- Button loading animation

---

## 🔐 Signup Screen

Fields:

- Name

- Username

- Email

- Password

- Institution

- Year

- Avatar upload preview

- Validation UI

---

## 🏠 HOME SCREEN

Sections (no scroll, use cards):

- Greeting
- Streak card (animated)
- Today study time
- “Start Session” button (pulse animation)

Horizontal sections:

- Recent sessions
- Analytics preview

---

## 📚 SUBJECTS SCREEN

- Grid or horizontal cards

- Each card:
  - subject name
  - progress bar (animated)
  - time spent

- Floating Add Button (+)

---

## 📖 CHAPTERS SCREEN

- Clean list
- Toggle checkbox animation
- Progress indicator

---

## ⏱️ TIMER SCREEN (FOCUS MODE)

- Large circular animated timer

- Minimal UI (no distractions)

- Subject + chapter selector

- Buttons:
  - Start
  - Pause
  - Stop

- Background subtle animation

---

## 📊 ANALYTICS SCREEN

- Graphs (animated)
- Swipe between:
  - daily
  - weekly
  - subject-wise

---

## 💬 COMMUNITY SCREEN

Tabs inside:

- Feed
- Doubts

Feed:

- Card layout
- Activity updates

Doubts:

- List cards
- Tag (subject)
- Reply count

---

## ❓ DOUBT DETAIL SCREEN

- Question
- Replies list
- Upvote animation
- Accept answer highlight

---

## 🏆 LEADERBOARD SCREEN

- Top 3 (highlighted with animation)
- List below
- Rank movement animation

---

## 👤 PROFILE SCREEN

- Avatar (glow animation)

- Stats:
  - points
  - streak
  - level

- Buttons:
  - Edit Profile
  - Toggle public/private

---

## ✏️ EDIT PROFILE

- Form UI
- Avatar upload
- Save button animation

---

# 🧩 COMPONENTS (REUSABLE)

- Button (primary, secondary)
- Card
- Input
- Progress bar
- Avatar
- Badge
- Tab switcher

---

# ⚡ PERFORMANCE RULES

- Use memoization
- Avoid re-renders
- Lazy load screens
- Use FlatList for lists

---

# 📱 RESPONSIVENESS

- Works on all screen sizes
- Proper spacing scaling
- SafeAreaView usage

---

# 🔔 FEEDBACK UX

- Loading states
- Empty states
- Error messages
- Success animations

---

# 🚀 OUTPUT REQUIRED

Generate:

1. Full React Native project code
2. Navigation setup (auth + tabs + stacks)
3. Styling system (separate folder)
4. Animated components
5. All screens
6. Reusable components

Ensure:

- Clean architecture
- Modern premium UI
- Smooth animations
- No unnecessary scrolling
- Production-ready code
