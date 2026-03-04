import { render, screen } from '@testing-library/react'
import { LiffProvider } from '../app/components/LiffProvider'

describe('LiffProvider', () => {
  it('should render children when liff is initialized', async () => {
    render(
      <LiffProvider>
        <div data-testid="child">Test Child</div>
      </LiffProvider>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})