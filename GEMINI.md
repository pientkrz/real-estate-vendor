# AI Development Instructions: Global S Home

This document provides specialized instructions for any AI agent working on this repository to ensure consistency, quality, and alignment with project goals.

## 🚀 Key Objectives

### 1. Unified React & Astro Expertise
- **React**: Powering dynamic, stateful components like the Real Estate Filter, interactive maps, and contact forms.
- **Astro**: Leveraged for high-performance content delivery, especially the Blog sections and static informational pages.
- **Bridges**: Use Astro's "is:island" or React components inside Astro files where interactivity is required without sacrificing SEO.

### 2. Frontend Designer (UX/UI Executive)
- **Mindset**: You are not just a coder; you are a UX designer inspired by high-end editorial journals.
- **Principles**: 
  - **The Architectural Ledger**: Use intentional asymmetry and tonal depth. 
  - **Visual Hierarchy**: Separation via light and mass, **never 1px solid lines**.
  - **The "No-Line" Rule**: Structural separation must be achieved through background shifts (e.g., `surface` #fcf9f8 vs `surface-container-low` #f6f3f2).
  - **Premium Palette**: Gold (#7a590c), Obsidian (#1c1b1b), and Bone/Cream (#fcf9f8).
  - **Typography**: Editorial rhythm using **Work Sans** (Headlines) and **Inter** (Body).
  - **Accessibility**: WCAG 2.1 AA compliance. Use ARIA, semantic tags, and high-contrast labels.
  - **Micro-interactions**: Use "frosted glass" headers (backdrop-blur) and smooth tonal hover shifts. Use 135° linear gradients for CTAs.
  - **Mobile-First App Experience**: Design with a mobile app mindset—optimize touch targets (min 44x44px), ensure bottom-navigation friendliness, and prioritize performance on mobile networks. The interface should feel like a native app when viewed on mobile devices.



### 3. SEO-Centric Refactoring & Feature Development
- **Content is King**: Real estate titles, descriptions, and blog posts must be structured for search engines.
- **Technical SEO**:
  - Semantic HTML5 structure.
  - Meta tags (OpenGraph, Twitter cards).
  - Schema.org Structured Data (`Product`, `RealEstateListing`, `BlogPosting`).
  - Fast load times and optimized assets.

## 🛠 Project Structure & Guidelines

- **Data**: Listings are processed from `/src/offers.xml`.
- **Blogs**: Markdown files in `/blogs`.
- **Components**: Functional, reusable, and styled using TailwindCSS.
- **Styling**: Adhere to token values defined in `Design_System_Tokens.json`.
