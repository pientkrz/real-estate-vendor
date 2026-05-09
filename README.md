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

## 📖 Application Functionality & Features

### 1. Advanced Property Filter
The Landing Page serves as the primary gateway to the listings. Users can filter properties based on data parsed from the external portal feed.
- **Data Integration**: Real-time or cached filtering based on `offers.xml`.
- **Primary Filter Attributes**: Price Range (min/max), Total Area (square meters), Room Count, Bathrooms/Bedrooms, Location (mapping to city/district). All available filter values (except the price range) are dynamically based on the data present in the `offers.xml` file.

### 2. Listings Display (Grid View)
Search results are presented in a responsive grid of property cards.
- **Card Requirements**: High-quality primary photo thumbnail, prominent price display with currency, summary of key specs (Area, Rooms, Bedrooms, Bathrooms), geolocation label (City/Area).

### 3. Property Detail View
Selecting a property from the grid opens a comprehensive detail view.
- **Content Requirements**: Full narrative description from XML, expanded technical specification table featuring all auxiliary parameters.
- **Location Visualization**: Integrated map displaying the property's approximate or exact location based on XML hierarchy.

### 4. Blog & Content Management
- **Persistence Layer**: Content is managed via Markdown (`.md`) files located in the `/blogs` directory on the server. Blogs are rendered based on available MD files following a specific format defined by a template.
- **Post Metadata (Front-Matter)**: `title` (SEO-friendly heading), `description` (article summary), `date` (publication timestamp), `author` (content creator), `thumbnail` (path to header image).
- **Rendering**: Support for full Markdown syntax (media embeds, formatting).

### 5. Contact & Compliance
- **Lead Generation**: A functional contact form for direct inquiries.
- **Legal Alignment**: Mandatory adherence to GDPR (RODO) regulations for personal data processing. The contact form can only be submitted when the user explicitly accepts the RODO clause.

### 6. "About Us" Strategy
The "About Us" section is implemented as either a Static Component (Direct React/HTML implementation) or a Dynamic Component (Markdown-driven file on the server).

---

*Part of the Real Estate Vendor ecosystem.*
