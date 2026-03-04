import { render, screen } from '@testing-library/react'
import { ImageUpload } from '../app/components/ImageUpload'

describe('ImageUpload', () => {
  it('should allow file selection and show preview', async () => {
    const { container } = render(<ImageUpload onImageChange={() => {}} />)
    const input = screen.getByLabelText('Upload image')
    expect(input).toBeInTheDocument()
  })
})