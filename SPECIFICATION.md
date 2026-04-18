# Technical Specification: Real Estate Application

## 1. Project Overview
The objective of this application is to provide a user-friendly platform for browsing and viewing real estate offers based on an external XML data source. The application is designed to be lightweight, data-driven, and easily updateable via text-based formats (XML and Markdown).

## 2. Website Architecture
The application layout is structured into the following core navigation sections:

| Section | Description |
| :--- | :--- |
| **Landing Page** | The home page featuring the primary search filter and featured listings grid. |
| **Property Details** | Detailed view for individual properties, including full specs and location maps. |
| **Blog Listing** | Index of educational or promotional articles. |
| **Blog Post** | Dedicated reading view for individual blog entries. |
| **Contact** | Communication hub featuring a contact form. |
| **About Us** | Agency information and mission statement. |

## 3. Functionality & Features

### 3.1 Advanced Property Filter
The Landing Page serves as the primary gateway to the listings. Users can filter properties based on data parsed from the external portal feed.
- **Data Integration**: Real-time or cached filtering based on `offers.xml`.
- **Primary Filter Attributes**:
    - **Price Range** (min/max)
    - **Total Area** (square meters)
    - **Room Count**
    - **Bathrooms/Bedrooms**
    - **Location** (mapping to city/district)

### 3.2 Listings Display (Grid View)
Search results are presented in a responsive grid of property cards.
- **Card Requirements**: 
    - High-quality primary photo thumbnail.
    - Prominent price display with currency.
    - Summary of key specs: Area, Rooms, Bedrooms, Bathrooms.
    - Geolocation label (City/Area).

### 3.3 Property Detail View
Selecting a property from the grid opens a comprehensive detail view.
- **Content Requirements**: 
    - Full narrative description from XML.
    - Expanded technical specification table featuring all auxiliary parameters.
    - **Location Visualization**: Integrated map displaying the property's approximate or exact location based on XML hierarchy.

### 3.4 Blog & Content Management
- **Persistence Layer**: Content is managed via Markdown (`.md`) files located in the `/blogs` directory on the server.
- **Post Metadata (Front-Matter)**:
    - `title`: SEO-friendly heading.
    - `description`: Article summary for the listing view.
    - `date`: Publication timestamp.
    - `author`: Content creator name.
    - `thumbnail`: Path to the header image.
- **Rendering**: Support for full Markdown syntax (media embeds, formatting).

### 3.5 Contact & Compliance
- **Lead Generation**: A functional contact form for direct inquiries.
- **Legal Alignment**: Mandatory adherence to GDPR (RODO) regulations for personal data processing.

### 3.6 "About Us" Strategy
The "About Us" section can be implemented as:
1.  **Static Component**: Direct React/HTML implementation.
2.  **Dynamic Component**: A Markdown-driven file on the server, allowing for easy textual updates without redeploying code.

## 4. Technical Infrastructure

### 4.1 Data Feed Management
- **Workflow**: The application relies on a file-based update system.
- **Update Protocol**: Administrators upload the latest `offers.xml` (provided by external portals like Otodom/Morizon) via SFTP or SSH to the server, replacing the stale file.

### 4.2 Sample XML Mapping
Based on the provided `offers.xml`, the following structure should be mapped to the UI:

| XML Tag | Data Type | UI Usage |
| :--- | :--- | :--- |
| `<id>` | String | Internal reference / slug. |
| `<cena waluta="EUR">` | Numeric | Pricing display. |
| `<param nazwa="powierzchnia">` | Float | Area property. |
| `<param nazwa="liczbapokoi">` | Integer | Room count. |
| `<location>` | Hierarchy | City/District label construction. |
| `<param nazwa="opis">` | HTML/Text | Property narrative. |

---
**Version:** 1.0.0
**Status:** Translated & Formalized
**Source:** `specification.txt` (Polish)
