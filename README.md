# Caesar III Battle Commander

A React-based remake of the battles from Caesar III, built with Vite, Tailwind CSS, and Vitest.

## Features
- **Roman Armies**: Legion, Knights, Javelins, Catapults, and War Ships.
- **Dynamic Terrain**: Forest (slow movement), Mountains (impassable), Water (ships only), Shallows (navigable by both).
- **Projectiles**: Ranged units (Javelins, Catapults, Ships) throw projectiles, while melee units (Legion, Knights) engage in hand-to-hand combat.
- **Promotions**: Gain ranks and bonuses by winning battles.
- **GitHub Actions**: Automated deployment to GitHub Pages.

## Getting Started

### Prerequisites
- Node.js (v20 or later)
- npm

### Installation
```bash
npm install
```

### Local Development
Run the development server with HMR:
```bash
npm run dev
```

### Testing
Run unit tests with Vitest:
```bash
npm run test
```

### Production Build
Build for production:
```bash
npm run build
```

### Local Action Test
Test the GitHub Action workflow locally using `act`:
```bash
act -j build-and-deploy
```

## Deployment
The project is automatically deployed to GitHub Pages via GitHub Actions on every push to the `main` branch.

## License
MIT