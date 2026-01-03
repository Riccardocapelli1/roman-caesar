import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import React from 'react';

describe('Caesar III Battle Game', () => {
    it('renders the main menu with the title', () => {
        render(<App />);
        expect(screen.getByText(/CAESAR III/i)).toBeInTheDocument();
    });

    it('renders the start button', () => {
        render(<App />);
        expect(screen.getByText(/COMMAND YOUR ARMY/i)).toBeInTheDocument();
    });

    it('shows controls in the menu', () => {
        render(<App />);
        expect(screen.getByText(/Command Controls/i)).toBeInTheDocument();
    });
});
