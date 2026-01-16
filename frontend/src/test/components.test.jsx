import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Input from '../components/ui/Input';

describe('Button Component', () => {
    it('renders button with text', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('renders primary variant by default', () => {
        render(<Button>Primary</Button>);
        expect(screen.getByText('Primary')).toHaveClass('btn-primary');
    });

    it('renders secondary variant', () => {
        render(<Button variant="secondary">Secondary</Button>);
        expect(screen.getByText('Secondary')).toHaveClass('btn-secondary');
    });

    it('renders disabled state', () => {
        render(<Button disabled>Disabled</Button>);
        expect(screen.getByText('Disabled')).toBeDisabled();
    });

    it('renders loading state', () => {
        render(<Button loading>Loading</Button>);
        const button = screen.getByRole('button');
        expect(button).toHaveClass('btn-loading');
        expect(button).toBeDisabled();
    });
});

describe('Card Component', () => {
    it('renders card with children', () => {
        render(<Card>Card content</Card>);
        expect(screen.getByText('Card content')).toBeInTheDocument();
    });

    it('renders card with title', () => {
        render(<Card title="Test Title">Content</Card>);
        expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('renders card with subtitle', () => {
        render(<Card title="Title" subtitle="Subtitle">Content</Card>);
        expect(screen.getByText('Subtitle')).toBeInTheDocument();
    });
});

describe('Badge Component', () => {
    it('renders badge with text', () => {
        render(<Badge>Active</Badge>);
        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('renders success variant', () => {
        render(<Badge variant="success">Success</Badge>);
        expect(screen.getByText('Success')).toHaveClass('badge-success');
    });

    it('renders danger variant', () => {
        render(<Badge variant="danger">Danger</Badge>);
        expect(screen.getByText('Danger')).toHaveClass('badge-danger');
    });
});

describe('Input Component', () => {
    it('renders input with label', () => {
        render(<Input label="Email" />);
        expect(screen.getByLabelText('Email')).toBeInTheDocument();
    });

    it('renders input with placeholder', () => {
        render(<Input label="Name" placeholder="Enter name" />);
        expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
    });

    it('renders error state', () => {
        render(<Input label="Email" error="Invalid email" />);
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
});
