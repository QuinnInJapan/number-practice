import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';
import { ModeSelection } from './ModeSelection';

describe('ModeSelection', () => {
  describe('rendering', () => {
    it('renders mode selection heading', () => {
      render(<ModeSelection />);
      expect(screen.getByText('Choose Your Path')).toBeInTheDocument();
    });

    it('renders Japanese to English button', () => {
      render(<ModeSelection />);
      expect(screen.getByText('Japanese → English')).toBeInTheDocument();
      expect(screen.getByText('Listen in Japanese, respond in English')).toBeInTheDocument();
    });

    it('renders English to Japanese button', () => {
      render(<ModeSelection />);
      expect(screen.getByText('English → Japanese')).toBeInTheDocument();
      expect(screen.getByText('Listen in English, respond in Japanese')).toBeInTheDocument();
    });

    it('renders mode icons', () => {
      render(<ModeSelection />);
      expect(screen.getByText('🇯🇵 → 🇺🇸')).toBeInTheDocument();
      expect(screen.getByText('🇺🇸 → 🇯🇵')).toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    it('clicking Japanese to English button triggers mode selection', () => {
      render(<ModeSelection />);

      const jaToEnButton = screen.getByText('Japanese → English').closest('button');
      expect(jaToEnButton).toBeInTheDocument();

      fireEvent.click(jaToEnButton!);

      // After clicking, the component should no longer render (state changes to READY)
      expect(screen.queryByText('Choose Your Path')).not.toBeInTheDocument();
    });

    it('clicking English to Japanese button triggers mode selection', () => {
      render(<ModeSelection />);

      const enToJaButton = screen.getByText('English → Japanese').closest('button');
      expect(enToJaButton).toBeInTheDocument();

      fireEvent.click(enToJaButton!);

      // After clicking, the component should no longer render (state changes to READY)
      expect(screen.queryByText('Choose Your Path')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('mode buttons are clickable', () => {
      render(<ModeSelection />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThanOrEqual(2);
    });
  });
});
