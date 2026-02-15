import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';
import { BrowserRouter } from 'react-router-dom';

// Mock firebase/auth
vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(),
    onAuthStateChanged: vi.fn((auth, callback) => {
        callback(null); // Simulate no user logged in
        return () => { }; // Return unsubscribe function
    }),
    signOut: vi.fn(),
}));

// Mock the local firebase config
vi.mock('/src/firebase/config.js', () => ({
    auth: {},
}));

describe('App', () => {
    it('renders the main heading', async () => {
        render(
            <BrowserRouter>
                <App />
            </BrowserRouter>
        );

        // Wait for the loading to finish and content to appear
        await waitFor(() => {
            expect(screen.getByText(/Global Equity Momentum/i)).toBeInTheDocument();
        });
    });
});
