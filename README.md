# A TWOSOONBUM PLACE ✨

DevOps engineer writing about work, experiences, and random thoughts between burger bites.

## About This Blog

A personal blog where I write about:
- DevOps and automation
- Sprint retrospectives
- AI and governance
- Career reflections
- Book reviews and random thoughts

Built with Astro, deployed on GitHub Pages.

## Tech Stack

- **Framework**: Astro v5
- **Styling**: Tailwind CSS v4
- **Animations**: swup.js for view transitions
- **Deployment**: GitHub Pages via GitHub Actions
- **Content**: Markdown blog posts with frontmatter

## Project Structure

```text
├── public/----------------- Static assets
├── src/
│   ├── assets/
│   │   └── images/--------- Blog post images
│   ├── components/--------- Astro components
│   ├── content/
│   │   └── blogs/---------- Blog posts (*.md)
│   ├── layouts/------------ Layout components
│   ├── pages/-------------- Site pages and dynamic routes
│   ├── styles/------------- Global styles
│   └── site.config.ts------ Site configuration
├── astro.config.mjs-------- Astro configuration
└── package.json------------ Dependencies
```

## Local Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

This blog is automatically deployed to GitHub Pages via GitHub Actions on every push to the `main` branch.

The deployment workflow:
1. Builds the Astro site
2. Uploads the build artifacts
3. Deploys to GitHub Pages

## Writing Posts

Blog posts are in `src/content/blogs/` as Markdown files with frontmatter:

```md
---
title: "Your Post Title"
author: "이순범"
description: "Post description"
image:
  url: "../../assets/images/your-image.png"
  alt: "Image description"
pubDate: 2025-12-20
tags: ["tag1", "tag2"]
---

Your content here...
```
