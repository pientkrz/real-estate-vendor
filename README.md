# Local T P - Premium Real Estate Platform

A high-performance, editorial-grade real estate platform built with **Astro** and **React**. Designed with an "Architectural Ledger" aesthetic, this site combines the performance of static generation with the interactivity of React islands.

## 🚀 Technology Stack

- **Framework**: [Astro](https://astro.build/) (Static Site Generation & Performance)
- **UI Library**: [React](https://react.dev/) (Interactive "Islands")
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Utility-first styling with a custom design system)
- **Data**: XML-driven property listings (`public/offers.xml`)

## 🏛 Design Philosophy: Mediterranean Gilded Aura

The project follows a strict high-end design system:
- **Architectural Ledger**: Intentional asymmetry and tonal depth.
- **Visual Hierarchy**: Separation via light and mass, avoiding 1px solid lines.
- **The "No-Line" Rule**: Structural separation achieved through background shifts (e.g., `surface` vs `surface-container-low`).
- **Premium Palette**: Gold (#7a590c), Obsidian (#1c1b1b), and Bone/Cream (#fcf9f8).
- **Typography**: Editorial rhythm using **Work Sans** (Headlines) and **Inter** (Body).

## 📂 Project Structure

- `src/pages/`: Astro routing. `index.astro` is the primary entry point.
- `src/layouts/`: Base HTML templates and global components.
- `src/components/`: Reusable UI components. React components are used for interactivity (Islands).
- `src/hooks/`: Custom React hooks for state and data management.
- `src/utils/`: Utility functions (e.g., XML parsing).
- `public/`: Static assets and the `offers.xml` data source.

## 🛠 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Navigate to `http://localhost:4321` (default Astro port).

### 3. Build for Production
```bash
npm run build
```

## 📋 Available Scripts

- `npm run dev`: Starts the Astro development server.
- `npm run build`: Generates a static production build.
- `npm run preview`: Previews the production build locally.
- `npm run lint`: Runs ESLint for code quality checks.

---

*Part of the Real Estate Vendor ecosystem.*
